#!/usr/bin/env python3
"""Inventory a whole web project directory as JSON, to plan a template extraction.

Usage: python3 project_inventory.py <web-directory>
       python3 project_inventory.py --self-test
Standard library only. Never executes the project's code. Reports what the directory contains and how its files
connect (pages → stylesheets and entry scripts → module graph → custom elements); it does not decide any mapping.
Every file gets a role, so the extraction can account for each one.
"""
import fnmatch
import json
import re
import struct
import sys
import tempfile
from collections import Counter
from pathlib import Path

from html_outline import outline

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".astro", ".wrangler", "dist"}
IMAGE = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg", ".ico"}
FONT = {".woff", ".woff2", ".ttf", ".otf"}
SCRIPT = {".js", ".mjs", ".ts"}
CONFIG = {"package.json", "tailwind.config.js", "tailwind.config.ts", "vite.config.js", "vite.config.ts",
          "astro.config.mjs", "netlify.toml", "_headers", "_redirects", ".gitignore"}
APIS = {  # browser capabilities a pattern may depend on (and the platform may have to allow)
    "localStorage": "localStorage", "sessionStorage": "sessionStorage", "indexedDB": "indexedDB",
    "navigator.geolocation": "geolocation", "serviceWorker": "serviceWorker", "beforeinstallprompt": "installPrompt",
    "IntersectionObserver": "IntersectionObserver", "prefers-reduced-motion": "reducedMotion",
    "fetch(": "fetch", "Notification": "notifications", "navigator.share": "webShare", "navigator.clipboard": "clipboard",
    "<dialog": "dialog", "showModal": "dialog", "Intl.NumberFormat": "intlNumber", "matchMedia": "matchMedia",
}
URL = re.compile(r"https?://[^\s\"'`)<>]+")


def ignored(rel, patterns):
    """Minimal .gitignore matching (globs and dir/ entries); enough to flag a project's working files."""
    parts = rel.split("/")
    for pat in patterns:
        pat = pat.rstrip("/")
        if fnmatch.fnmatch(rel, pat) or any(fnmatch.fnmatch(part, pat) for part in parts[:-1]) or fnmatch.fnmatch(parts[-1], pat):
            return True
    return False


def role(path, text):
    name, ext = path.name.lower(), path.suffix.lower()
    if name in ("manifest.json",) or ext == ".webmanifest":
        return "manifest"
    if name in CONFIG:
        return "config"
    if ext in (".html", ".htm"):
        return "page"
    if ext == ".css":
        return "stylesheet"
    if ext in SCRIPT:
        if "self.addEventListener" in text and ("'fetch'" in text or '"fetch"' in text or "caches." in text):
            return "service-worker"
        if re.search(r"^export default\s*[{\[]", text, re.M) and not re.search(r"customElements\.define|^\s*(?:export\s+)?class\s", text, re.M):
            return "data"
        return "script"
    if ext in (".json", ".yaml", ".yml", ".toml"):
        return "data"
    if ext in IMAGE:
        return "image"
    if ext in FONT:
        return "font"
    if ext in (".md", ".txt"):
        return "doc"
    if ext in (".sh", ".py"):
        return "tooling"
    return "other"


def image_size(path):
    """(width, height) for PNG and SVG viewBox; None otherwise."""
    try:
        if path.suffix.lower() == ".png":
            head = path.read_bytes()[:24]
            return list(struct.unpack(">II", head[16:24])) if head[:8] == b"\x89PNG\r\n\x1a\n" else None
        if path.suffix.lower() == ".svg":
            m = re.search(r'viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"', path.read_text(errors="ignore"))
            return [float(m[1]), float(m[2])] if m else None
    except OSError:
        return None


def script_summary(text):
    imports = re.findall(r"""(?:^|\s)import\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]""", text, re.M)
    imports += re.findall(r"""import\(\s*['"]([^'"]+)['"]\s*\)""", text)
    exports = re.findall(r"^export\s+(?:default\s+)?(?:async\s+)?(?:const|let|function\*?|class)\s+(\w+)", text, re.M)
    if re.search(r"^export default", text, re.M):
        exports.append("default")
    return {
        "imports": imports,
        "exports": list(dict.fromkeys(exports)),
        "customElements": re.findall(r"""customElements\.define\(\s*['"]([\w-]+)['"]""", text),
        "registersServiceWorker": re.findall(r"""serviceWorker\.register\(\s*['"]([^'"]+)['"]""", text),
        "browserApis": sorted({v for k, v in APIS.items() if k in text}),
        "externalUrls": sorted({u.rstrip(".,;") for u in URL.findall(text)})[:20],
        "selfTest": bool(re.search(r"self-?test|console\.assert", text, re.I)),
        "lines": text.count("\n") + 1,
    }


def css_summary(text):
    return {
        "customProperties": len(set(re.findall(r"(?<![\w-])(--[\w-]+)\s*:", text))),
        "keyframes": re.findall(r"@keyframes\s+([\w-]+)", text),
        "mediaQueries": sorted(set(re.findall(r"@media\s*([^{]+)", text)))[:15],
        "layers": sorted(set(re.findall(r"@layer\s+([\w-]+)", text))),
        "externalUrls": sorted({u.rstrip(".,;") for u in URL.findall(text)})[:20],
        "lines": text.count("\n") + 1,
    }


def data_summary(path, text):
    """Top-level keys and their kind, read statically (the project's code is never run)."""
    if path.suffix == ".json":
        try:
            obj = json.loads(text)
        except ValueError:
            return {"error": "invalid JSON"}
        if isinstance(obj, dict):
            return {"keys": {k: (f"array[{len(v)}]" if isinstance(v, list) else type(v).__name__) for k, v in obj.items()}}
        return {"kind": f"array[{len(obj)}]" if isinstance(obj, list) else type(obj).__name__}
    body = text[re.search(r"^export default", text, re.M).start():] if re.search(r"^export default", text, re.M) else text
    keys = {}
    for m in re.finditer(r"^ {2}(\w+)\s*:\s*(.)", body, re.M):  # 2-space indent = top level of the default export
        keys[m[1]] = {"[": "array", "{": "object", "'": "string", '"': "string", "`": "string"}.get(m[2], "value")
    for k in [k for k, v in keys.items() if v == "array"]:
        block = re.search(rf"^ {{2}}{k}\s*:\s*\[(.*?)^ {{2}}\]", body, re.M | re.S)
        if block:
            keys[k] = f"array[{len(re.findall(r'^ {4}\{', block[1], re.M))}]"
    return {"keys": keys}


def resolve(base, spec, root):
    if not spec.startswith((".", "/")):
        return None  # bare or remote specifier: external
    target = (root / spec.lstrip("/")) if spec.startswith("/") else (base.parent / spec)
    try:
        return target.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return None


def local_href(href):
    return href and not href.startswith(("http:", "https:", "//", "data:", "#", "mailto:", "tel:"))


def inventory(root):
    root = Path(root)
    gitignore = root / ".gitignore"
    patterns = [l.strip() for l in gitignore.read_text().splitlines() if l.strip() and not l.startswith("#")] if gitignore.exists() else []
    files, texts, skipped = {}, {}, set()
    for path in sorted(root.rglob("*")):
        rel = path.relative_to(root).as_posix()
        skip = next((p for p in rel.split("/") if p in SKIP_DIRS or p.lower() in ("trash", ".trash")), None)
        if skip:
            skipped.add(skip)
            continue
        if path.is_dir():
            continue
        text = path.read_text(errors="ignore") if path.suffix.lower() not in IMAGE | FONT or path.suffix == ".svg" else ""
        texts[rel] = text
        entry = {"role": role(path, text), "bytes": path.stat().st_size}
        if ignored(rel, patterns):
            entry["gitignored"] = True  # usually working docs: context, not part of the site
        if entry["role"] == "image" and (size := image_size(path)):
            entry["size"] = size
        files[rel] = entry

    out = {"root": root.as_posix(), "skippedDirs": sorted(skipped), "roles": dict(Counter(f["role"] for f in files.values())), "files": files,
           "pages": {}, "stylesheets": {}, "scripts": {}, "data": {}, "manifest": {}, "serviceWorker": {}, "docs": {}}

    for rel, f in files.items():
        text, path = texts[rel], root / rel
        if f["role"] == "stylesheet":
            out["stylesheets"][rel] = css_summary(text)
        elif f["role"] in ("script", "service-worker"):
            out["scripts"][rel] = script_summary(text)
        elif f["role"] == "data":
            out["data"][rel] = data_summary(path, text)
        elif f["role"] == "manifest":
            try:
                m = json.loads(text)
                out["manifest"][rel] = {k: m.get(k) for k in ("name", "short_name", "lang", "start_url", "scope", "display",
                                                              "theme_color", "background_color") if k in m}
                out["manifest"][rel].update(icons=len(m.get("icons", [])), screenshots=len(m.get("screenshots", [])))
            except ValueError:
                out["manifest"][rel] = {"error": "invalid JSON"}
        elif f["role"] == "doc":
            heading = re.search(r"^#\s+(.+)", text, re.M)
            out["docs"][rel] = heading[1].strip() if heading else ""
        if f["role"] == "service-worker":
            out["serviceWorker"][rel] = {"caches": re.findall(r"""(?:CACHE\w*|cacheName)\s*=\s*['"]([^'"]+)['"]""", text),
                                         "precache": re.findall(r"""['"](\.?/[^'"]+\.(?:html|css|js|png|svg|json))['"]""", text)[:20]}

    # Pages: outline with their local stylesheets merged in, so tokens from styles.css count.
    entries = []
    for rel, f in files.items():
        if f["role"] != "page":
            continue
        page = outline(texts[rel])
        css = [resolve(root / rel, h, root) for h in page["stylesheets"] if local_href(h)]
        page = outline(texts[rel], "\n".join(texts.get(c, "") for c in css if c))
        page["localStylesheets"] = [c for c in css if c]
        page["entryScripts"] = [s for s in (resolve(root / rel, x["src"], root) for x in page["scripts"] if local_href(x["src"])) if s]
        entries += page["entryScripts"]
        out["pages"][rel] = page

    # Module graph from the pages' entry scripts: what runs, and what is dead.
    reached, queue = set(), list(entries)
    while queue:
        rel = queue.pop()
        if rel in reached or rel not in files:
            continue
        reached.add(rel)
        summary = out["scripts"].get(rel)
        if summary:
            summary["resolvedImports"] = [r for r in (resolve(root / rel, s, root) for s in summary["imports"]) if r]
            # Service-worker URLs resolve against the page (the project root here), not the registering script.
            queue += summary["resolvedImports"] + [r for r in (resolve(root / "index.html", s, root) for s in summary["registersServiceWorker"]) if r]
    out["moduleGraph"] = {"entries": sorted(set(entries)), "reached": sorted(reached),
                          "unreached": sorted(r for r, f in files.items() if f["role"] in ("script", "data", "service-worker") and r not in reached)}

    # Custom elements: where each is defined, and where it is used (page markup or another component's template).
    defined = {tag: rel for rel, s in out["scripts"].items() for tag in s["customElements"]}
    used = {}
    for rel, p in out["pages"].items():
        for tag in p["customElements"]:
            used.setdefault(tag, []).append(rel)
    for rel in out["scripts"]:
        for tag in sorted(set(re.findall(r"<([a-z]+-[a-z-]+)[\s>/]", texts[rel]))):
            if defined.get(tag) != rel:  # its own file mentions it; that is not a use
                used.setdefault(tag, []).append(rel)
    out["customElements"] = {tag: {"definedIn": defined.get(tag), "usedIn": used.get(tag, [])} for tag in sorted(set(defined) | set(used))}

    hosts = Counter()
    for text in texts.values():
        for u in URL.findall(text):
            if re.search(r"\.(?:png|jpe?g|webp|avif|gif|svg)\b|images\.unsplash\.com|/photo-", u):
                hosts[re.sub(r"^https?://([^/]+).*", r"\1", u)] += 1
    out["remoteImages"] = dict(hosts)

    # Design context the live-sketching layout keeps next to the project folder (intent, not facts).
    parent = root.resolve().parent
    out["context"] = sorted(p.relative_to(parent).as_posix() for p in [parent / "DESIGN.md", *parent.glob("references/**/*.md")] if p.is_file())
    return out


def self_test():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / "site"
        (root / "js/components").mkdir(parents=True)
        (root / "icons").mkdir()
        (root / "docs").mkdir()
        (Path(tmp) / "DESIGN.md").write_text("# Design\n")
        (root / ".gitignore").write_text("# working docs\ndocs/\n")
        (root / "docs/notes.md").write_text("# Notes\n")
        (root / "index.html").write_text('<html lang="es"><head><link rel="stylesheet" href="./styles.css">'
                                          '<link rel="manifest" href="./manifest.webmanifest">'
                                          '<script type="module" src="./js/app.js"></script></head><body>'
                                          '<menu-catalog id="menu"></menu-catalog><section id="old" hidden><h2>x</h2></section></body></html>')
        (root / "styles.css").write_text(":root{--tangerine:#E99B3F;--r-s:20px}\n.card{border-radius:20px}\n@keyframes marquee{}")
        (root / "data.js").write_text("export default {\n  business: 'X',\n  products: [\n    { id: 'a' },\n    { id: 'b' },\n  ],\n};\n")
        (root / "js/app.js").write_text("import data from '../data.js';\nimport './components/menu.js';\n"
                                        "navigator.serviceWorker.register('./sw.js');\n")
        (root / "js/components/menu.js").write_text("class M extends HTMLElement { connectedCallback(){ this.innerHTML = '<product-dialog></product-dialog>'; localStorage.x = 1; } }\n"
                                                    "customElements.define('menu-catalog', M);\n")
        (root / "js/unused.js").write_text("export const x = 1;\n")
        (root / "sw.js").write_text("const CACHE = 'demo-v1';\nself.addEventListener('fetch', e => {});\n")
        (root / "manifest.webmanifest").write_text('{"name": "Demo", "theme_color": "#E99B3F", "icons": [{}, {}]}')
        (root / "icons/icon.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"\0\0\0\rIHDR" + struct.pack(">II", 192, 192))
        o = inventory(root)
    assert o["roles"] == {"config": 1, "doc": 1, "page": 1, "stylesheet": 1, "data": 1, "image": 1, "script": 3,
                          "service-worker": 1, "manifest": 1}, o["roles"]
    f = o["files"]
    assert f["data.js"]["role"] == "data" and f["sw.js"]["role"] == "service-worker" and f["manifest.webmanifest"]["role"] == "manifest", f
    assert f["docs/notes.md"].get("gitignored") and f["icons/icon.png"]["size"] == [192, 192], f
    page = o["pages"]["index.html"]
    assert next(b for b in page["blocks"] if b.get("id") == "menu")["depth"] == 0, page["blocks"]
    assert page["cssVariables"]["--tangerine"] == "#E99B3F" and page["localStylesheets"] == ["styles.css"], page
    assert page["entryScripts"] == ["js/app.js"] and next(b for b in page["blocks"] if b.get("id") == "old")["hidden"], page
    assert o["data"]["data.js"]["keys"] == {"business": "string", "products": "array[2]"}, o["data"]
    assert set(o["moduleGraph"]["reached"]) == {"js/app.js", "data.js", "js/components/menu.js", "sw.js"}, o["moduleGraph"]
    assert o["moduleGraph"]["unreached"] == ["js/unused.js"], o["moduleGraph"]
    assert o["customElements"]["menu-catalog"] == {"definedIn": "js/components/menu.js", "usedIn": ["index.html"]}, o["customElements"]
    assert o["customElements"]["product-dialog"] == {"definedIn": None, "usedIn": ["js/components/menu.js"]}, o["customElements"]
    assert "localStorage" in o["scripts"]["js/components/menu.js"]["browserApis"]
    assert o["serviceWorker"]["sw.js"]["caches"] == ["demo-v1"] and o["manifest"]["manifest.webmanifest"]["icons"] == 2
    assert o["stylesheets"]["styles.css"]["keyframes"] == ["marquee"] and o["context"] == ["DESIGN.md"], o["context"]
    print("self-test ok")


def main(argv):
    if argv == ["--self-test"]:
        return self_test()
    if len(argv) != 1 or not Path(argv[0]).is_dir():
        sys.exit(__doc__)
    print(json.dumps(inventory(argv[0]), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1:])
