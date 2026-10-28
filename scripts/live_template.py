#!/usr/bin/env python3
"""Publish a static template folder as a public GitHub Pages site.

Usage: npm run live-template -- <template_folder_location>
The GitHub account is the owner of the folder's git origin (e.g. git@github-personal:Gualtix/x.git
-> Gualtix), so gh must be logged in as it; outside a GitHub repo gh's active account is used.
Exit codes: 0 created/updated/unchanged, 1 runtime/GitHub failure, 2 bad usage/invalid folder.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

TOPIC = "live-template"
DESC_PREFIX = "Live preview of template: "
REPO_ROOT = Path(__file__).resolve().parent.parent
WAIT_SECONDS = 180
# Never let an inherited GIT_DIR/GIT_WORK_TREE point git at the monorepo.
ENV = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}


class Fail(Exception):
    def __init__(self, message, code=1):
        super().__init__(message)
        self.code = code


def repo_name(basename):
    name = re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9._-]", "-", basename.lower()))
    name = name.strip("-.")[:100].strip("-.")
    if not name:
        raise Fail(f"Cannot derive a repository name from folder name {basename!r}.", 2)
    return name


def validate_folder(folder):
    if not folder.is_dir():
        raise Fail(f"Not a directory: {folder}", 2)
    if not (folder / "index.html").is_file():
        raise Fail(f"No index.html at the root of {folder}. GitHub Pages serves index.html as the "
                   "home page, so the folder must contain a built static site.", 2)
    env_files = []
    for root, dirs, files in os.walk(folder):
        dirs[:] = [d for d in dirs if d != ".git"]
        env_files += [Path(root, f).relative_to(folder) for f in files
                      if (f == ".env" or f.startswith(".env.")) and f != ".env.example"]
    if env_files:
        listing = "\n".join(f"  {p}" for p in sorted(env_files))
        raise Fail(f"Refusing to publish: environment files found (they may hold secrets):\n{listing}", 2)


def run(args, step, cwd=None, env=None, ok_http=()):
    """Run a command; return None on an allowed gh HTTP error status, raise Fail on other errors."""
    proc = subprocess.run(args, cwd=cwd, env=env or ENV, capture_output=True, text=True)
    if proc.returncode == 0:
        return proc
    if any(f"HTTP {code}" in proc.stderr for code in ok_http):
        return None
    raise Fail(f"{step} failed:\n{(proc.stderr or proc.stdout).strip()}")


def git(args, cwd, step="git", env=None):
    return run(["git", *args], f"{step} (git {args[0]})", cwd=cwd, env=env)


def gh_json(args, step, ok_http=()):
    proc = run(["gh", *args], step, ok_http=ok_http)
    return None if proc is None else json.loads(proc.stdout or "null")


def stage(folder, tmp):
    """Copy the folder into a fresh temp git repo with everything staged; return its path."""
    work = tmp / "site"
    shutil.copytree(folder, work, symlinks=True, ignore=shutil.ignore_patterns(".git", ".DS_Store"))
    (work / ".nojekyll").write_text("")
    git(["init", "-q", "-b", "main"], work, "prepare content")
    # Honor only the folder's own .gitignore files, not the machine's global excludes.
    git(["-c", "core.excludesFile=", "add", "-A"], work, "prepare content")
    return work


def source_label(folder):
    try:
        return str(folder.relative_to(REPO_ROOT))
    except ValueError:
        return str(folder)


def ensure_pages(full):
    source = {"branch": "main", "path": "/"}
    args = ["-f", "source[branch]=main", "-f", "source[path]=/"]
    pages = gh_json(["api", "-X", "POST", f"repos/{full}/pages", *args], "enable GitHub Pages", ok_http=(409,))
    if pages is None:  # already enabled
        pages = gh_json(["api", f"repos/{full}/pages"], "read GitHub Pages settings")
        if pages.get("source") != source:
            run(["gh", "api", "-X", "PUT", f"repos/{full}/pages", *args], "set GitHub Pages source")
    return pages.get("html_url")


def wait_for_build(full, sha):
    deadline = time.monotonic() + WAIT_SECONDS
    while time.monotonic() < deadline:
        build = gh_json(["api", f"repos/{full}/pages/builds/latest"], "check Pages build", ok_http=(404,))
        if build and build.get("commit") == sha:  # older builds don't count
            if build.get("status") == "built":
                print("live")
                return 0
            if build.get("status") == "errored":
                print(f"GitHub Pages build errored: {(build.get('error') or {}).get('message') or 'unknown error'}")
                return 1
        time.sleep(5)
    print(f"still deploying after {WAIT_SECONDS}s; the site should be live shortly")
    return 0


def folder_account(folder):
    """GitHub owner in the origin URL of the git repo containing folder, else None.

    Handles SSH host aliases (git@github-personal:Owner/repo.git) as well as https and plain ssh.
    shortcut: assumes the origin owner is a user, not an org, upgrade if you publish from org-owned repos.
    """
    proc = subprocess.run(["git", "-C", str(folder), "remote", "get-url", "origin"],
                          env=ENV, capture_output=True, text=True)
    m = re.search(r"github[^:/]*[:/]+([^/]+)/[^/]+$", proc.stdout.strip()) if proc.returncode == 0 else None
    return m.group(1) if m else None


def select_account(folder):
    """Run every gh/git call as the account that owns folder's repo (no manual `gh auth switch`)."""
    owner = folder_account(folder)
    if not owner:
        return  # not in a GitHub repo: keep gh's active account
    for var in ("GH_TOKEN", "GITHUB_TOKEN"):
        ENV.pop(var, None)  # an inherited token would override the per-account one
    proc = subprocess.run(["gh", "auth", "token", "--user", owner], env=ENV, capture_output=True, text=True)
    if proc.returncode != 0 or not proc.stdout.strip():
        raise Fail(f"This folder's repo belongs to GitHub account '{owner}', but gh is not logged in as it. "
                   f"Run `gh auth login` as {owner} and retry.")
    ENV["GH_TOKEN"] = proc.stdout.strip()
    print(f"using GitHub account {owner}", file=sys.stderr)


def publish(folder):
    name = repo_name(folder.name)
    label = source_label(folder)

    if not shutil.which("gh"):
        raise Fail("GitHub CLI (gh) not found. Install it from https://cli.github.com")
    if not shutil.which("git"):
        raise Fail("git not found. Install git and retry.")
    select_account(folder)
    if subprocess.run(["gh", "auth", "status"], env=ENV, capture_output=True).returncode != 0:
        raise Fail("GitHub CLI is not authenticated. Run `gh auth login` and retry.")
    owner = run(["gh", "api", "user", "--jq", ".login"], "read GitHub user").stdout.strip()
    full = f"{owner}/{name}"

    repo = gh_json(["api", f"repos/{full}"], "look up repository", ok_http=(404,))
    remote_tree = None
    if repo is None:
        status = "created"
    else:
        status = "updated"
        if TOPIC not in repo.get("topics", []):
            raise Fail(f"Repository {full} already exists but has no '{TOPIC}' topic, so this tool did "
                       f"not create it. Rename the folder, or delete the repo or add the topic to it.")
        description = repo.get("description") or ""
        if description != DESC_PREFIX + label:
            existing = description.removeprefix(DESC_PREFIX) or "(no description)"
            raise Fail(f"Repository {full} already publishes a different folder:\n  existing: {existing}\n"
                       f"  current:  {label}\nRename one of the folders to avoid the name collision.")
        head = run(["gh", "api", f"repos/{full}/commits/main", "--jq", ".commit.tree.sha"],
                   "read remote main", ok_http=(404, 409, 422))  # empty repo / no main yet
        remote_tree = head.stdout.strip() if head else None

    with tempfile.TemporaryDirectory() as tmp:
        work = stage(folder, Path(tmp))
        tree = git(["write-tree"], work, "prepare content").stdout.strip()
        if tree == remote_tree:
            print("unchanged")
            print(f"https://{owner.lower()}.github.io/{name}/")
            return 0

        if repo is None:
            run(["gh", "repo", "create", full, "--public", "--description", DESC_PREFIX + label],
                "create repository")
            run(["gh", "repo", "edit", full, "--add-topic", TOPIC], "tag repository")
        # Identity is the GitHub noreply address so no local email leaks into a public repo.
        ident = {**ENV, "GIT_AUTHOR_NAME": owner, "GIT_AUTHOR_EMAIL": f"{owner}@users.noreply.github.com",
                 "GIT_COMMITTER_NAME": owner, "GIT_COMMITTER_EMAIL": f"{owner}@users.noreply.github.com"}
        sha = git(["commit-tree", tree, "-m", f"Publish {label}"], work, "commit", ident).stdout.strip()
        git(["-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential",
             "push", "--force", "--no-verify", "-q", f"https://github.com/{full}.git", f"{sha}:refs/heads/main"],
            work, "push")

    print(status)
    url = ensure_pages(full) or f"https://{owner.lower()}.github.io/{name}/"
    code = wait_for_build(full, sha)
    print(url)
    return code


def main(argv):
    if len(argv) != 1:
        print("Usage: npm run live-template -- <template_folder_location>", file=sys.stderr)
        return 2
    folder = (Path(os.environ.get("INIT_CWD") or os.getcwd()) / argv[0]).resolve()
    try:
        validate_folder(folder)
        repo_name(folder.name)  # bad names are usage errors, checked before any gh/git call
        return publish(folder)
    except Fail as e:
        print(f"error: {e}", file=sys.stderr)
        return e.code


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
