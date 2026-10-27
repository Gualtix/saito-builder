#!/usr/bin/env python3
"""Outline a standalone HTML page as JSON, to plan a site.config.yaml extraction.

Usage: python3 html_outline.py <page.html | folder-with-index.html>
       python3 html_outline.py --self-test
Standard library only. Reports what is in the page; it does not decide any mapping.
"""
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

BLOCKS = {"header", "nav", "section", "footer", "aside", "main", "article"}
HEADINGS = {"h1", "h2", "h3"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SOCIAL = {"instagram.com": "instagram", "facebook.com": "facebook", "tiktok.com": "tiktok", "x.com": "x",
          "twitter.com": "x", "youtube.com": "youtube", "linkedin.com": "linkedin", "github.com": "github",
          "wa.me": "whatsapp", "api.whatsapp.com": "whatsapp"}


class Outline(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.fonts, self.blocks, self.images, self.forms = {}, [], [], [], []
        self.links, self.styles, self.jsonld = [], [], 0
        self.stack, self.open_blocks, self.text_target, self.in_style, self.in_title = [], [], None, False, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "url(" in (a.get("style") or ""):
            self.styles.append(a["style"])
        if tag == "html" and a.get("lang"):
            self.meta["lang"] = a["lang"]
        elif tag == "title":
            self.in_title = True
        elif tag == "meta" and (a.get("name") or a.get("property")) and a.get("content"):
            self.meta[a.get("name") or a.get("property")] = a["content"]
        elif tag == "link" and "fonts.googleapis.com" in (a.get("href") or ""):
            self.fonts += [f.split(":")[0].replace("+", " ") for f in re.findall(r"family=([^&]+)", a["href"])]
        elif tag == "style":
            self.in_style = True
        elif tag == "script" and a.get("type") == "application/ld+json":
            self.jsonld += 1
        elif tag == "img":
            self.images.append({"src": a.get("src", ""), "alt": a.get("alt", "")})
            for b in self.open_blocks:
                b["counts"]["img"] += 1
        elif tag == "a" and a.get("href"):
            self.links.append({"href": a["href"], "inNav": any(b["tag"] == "nav" for b in self.open_blocks), "text": ""})
            self.text_target = ("link", self.links[-1])
            for b in self.open_blocks:
                b["counts"]["a"] += 1
        elif tag in ("input", "select", "textarea") and self.forms:
            self.forms[-1]["fields"].append(a.get("name") or a.get("id") or a.get("type") or tag)
        elif tag == "form":
            self.forms.append({"action": a.get("action"), "fields": []})
        if tag in HEADINGS and self.open_blocks and not self.open_blocks[-1]["heading"]:
            self.text_target = ("heading", self.open_blocks[-1])
        for b in self.open_blocks:
            if tag in ("button", "li", "form", "figure", "blockquote", "table"):
                b["counts"][tag] += 1
        if tag in VOID:
            return
        parent = self.stack[-1][0] if self.stack else None
        is_block = tag in BLOCKS or (tag == "div" and (a.get("id") or parent in ("main", "body")))
        if is_block:
            block = {"tag": tag, "id": a.get("id"), "class": a.get("class"), "depth": len(self.open_blocks),
                     "heading": "", "counts": Counter()}
            self.blocks.append(block)
            self.open_blocks.append(block)
        self.stack.append((tag, is_block))

    def handle_endtag(self, tag):
        if tag == "style":
            self.in_style = False
        if tag == "title":
            self.in_title = False
        if tag in HEADINGS or tag == "a":
            self.text_target = None
        # Pop to the matching tag; tolerates unclosed elements.
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for _, was_block in self.stack[i:]:
                    if was_block:
                        self.open_blocks.pop()
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.in_style:
            self.styles.append(data)
        elif self.in_title:
            self.meta["title"] = self.meta.get("title", "") + data.strip()
        elif self.text_target and data.strip():
            kind, target = self.text_target
            key = "heading" if kind == "heading" else "text"
            target[key] = (target[key] + " " + data.strip()).strip()[:80]


def classify_link(href):
    for domain, name in SOCIAL.items():
        if domain in href:
            return name
    for prefix, name in (("tel:", "phone"), ("mailto:", "email"), ("#", "anchor")):
        if href.startswith(prefix):
            return name
    if "maps." in href or "/maps" in href:
        return "map"
    return "external" if href.startswith("http") else "internal"


def outline(html):
    p = Outline()
    p.feed(html)
    css = "\n".join(p.styles)
    links = Counter()
    grouped = {}
    for link in p.links:
        kind = classify_link(link["href"])
        links[kind] += 1
        if kind != "anchor" or link["inNav"]:
            grouped.setdefault(kind, [])
            entry = {"href": link["href"], "text": link["text"]}
            if entry not in grouped[kind]:
                grouped[kind].append(entry)
    return {
        "meta": p.meta,
        "fonts": list(dict.fromkeys(p.fonts)),
        "cssVariables": dict(re.findall(r"(?<![\w-])(--[\w-]+)\s*:\s*([^;}{]+)", css)),
        "topColors": dict(Counter(c.lower() for c in re.findall(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", css)).most_common(12)),
        "radii": dict(Counter(re.findall(r"border-radius\s*:\s*([^;}{]+)", css)).most_common(6)),
        "blocks": [{k: (dict(v) if k == "counts" else v) for k, v in b.items() if v not in (None, "")} for b in p.blocks],
        "linkCounts": dict(links),
        "linkSamples": {k: v[:15] for k, v in grouped.items()},  # deduplicated, first 15 per kind; anchors only from nav
        "images": {"count": len(p.images), "hosts": dict(Counter(re.sub(r"^https?://([^/]+).*", r"\1", i["src"]) if i["src"].startswith("http") else "local" for i in p.images)), "sample": p.images[:8]},
        "cssBackgroundImages": list(dict.fromkeys(re.findall(r"url\([\"']?(https?://[^\"')]+)", css)))[:15],
        "forms": p.forms,
        "jsonLdBlocks": p.jsonld,
    }


def self_test():
    html = """<html lang="es"><head><title>Demo</title><meta name="description" content="d">
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter&display=swap" rel="stylesheet">
    <style>:root{--primary:#E99B3F} .btn--primary:hover{color:#fff} .card{border-radius:20px;color:#111}</style></head><body>
    <header><nav><a href="#menu">Menú</a></nav></header>
    <main><div class="strip"><h3>Envío gratis</h3></div><div class="band" style="background:url('https://x.test/b.jpg')"></div>
    <section id="menu"><h2>Nuestro menú</h2><ul><li>A<li>B</ul><img src="https://images.unsplash.com/x" alt="Plato"><div id="reservas"><h3>Reserva</h3></div></section></main>
    <footer><a href="https://wa.me/50245393659">WhatsApp</a><a href="tel:+50245393659">Tel</a></footer></body></html>"""
    o = outline(html)
    assert o["meta"]["lang"] == "es" and o["meta"]["title"] == "Demo", o["meta"]
    assert o["fonts"] == ["Dancing Script", "Inter"], o["fonts"]
    assert o["cssVariables"] == {"--primary": "#E99B3F"}, o["cssVariables"]
    section = next(b for b in o["blocks"] if b.get("id") == "menu")
    assert section["heading"] == "Nuestro menú" and section["counts"]["img"] == 1 and section["counts"]["li"] == 2, section
    assert o["linkCounts"] == {"anchor": 1, "whatsapp": 1, "phone": 1}, o["linkCounts"]
    assert o["linkSamples"]["anchor"][0]["text"] == "Menú"
    ids = [(b["tag"], b.get("id") or b.get("class")) for b in o["blocks"]]
    assert ("div", "strip") in ids and ("div", "band") in ids and ("div", "reservas") in ids, ids
    assert o["cssBackgroundImages"] == ["https://x.test/b.jpg"], o["cssBackgroundImages"]
    print("self-test ok")


def main(argv):
    if argv == ["--self-test"]:
        return self_test()
    if len(argv) != 1:
        sys.exit(__doc__)
    path = Path(argv[0])
    if path.is_dir():
        path = path / "index.html"
    print(json.dumps(outline(path.read_text(encoding="utf-8")), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1:])
