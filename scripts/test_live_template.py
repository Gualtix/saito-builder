import tempfile
import unittest
from pathlib import Path

import live_template as lt


class RepoNameTest(unittest.TestCase):
    def test_sanitizes_basename(self):
        self.assertEqual(lt.repo_name("Artisan Heritage"), "artisan-heritage")
        self.assertEqual(lt.repo_name("--My__Site!!  v2.."), "my__site-v2")
        self.assertEqual(lt.repo_name("a" * 120), "a" * 100)

    def test_rejects_empty_names(self):
        for bad in ("", ".", "..", "---", "!!!"):
            with self.assertRaises(lt.Fail) as ctx:
                lt.repo_name(bad)
            self.assertEqual(ctx.exception.code, 2)


class ValidateFolderTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def test_requires_index_html(self):
        (self.dir / "DESIGN.md").write_text("x")
        with self.assertRaises(lt.Fail) as ctx:
            lt.validate_folder(self.dir)
        self.assertEqual(ctx.exception.code, 2)
        self.assertIn("index.html", str(ctx.exception))

    def test_rejects_env_files_at_any_depth(self):
        (self.dir / "index.html").write_text("<h1>hi</h1>")
        (self.dir / "a" / "b").mkdir(parents=True)
        (self.dir / "a" / "b" / ".env.local").write_text("SECRET=1")
        (self.dir / ".env.example").write_text("SECRET=")
        with self.assertRaises(lt.Fail) as ctx:
            lt.validate_folder(self.dir)
        self.assertEqual(ctx.exception.code, 2)
        self.assertIn(".env.local", str(ctx.exception))
        self.assertNotIn(".env.example", str(ctx.exception))

    def test_accepts_valid_folder(self):
        (self.dir / "index.html").write_text("<h1>hi</h1>")
        (self.dir / ".env.example").write_text("SECRET=")
        lt.validate_folder(self.dir)


class StageTreeTest(unittest.TestCase):
    """Local git only, no network."""

    def test_tree_is_content_based_and_filtered(self):
        src = Path(tempfile.mkdtemp())
        (src / "index.html").write_text("<h1>hi</h1>")
        (src / ".DS_Store").write_text("junk")
        (src / "css").mkdir()
        (src / "css" / "a.css").write_text("body{}")
        (src / ".gitignore").write_text("*.css\n")  # ignored files must still publish
        with tempfile.TemporaryDirectory() as t1, tempfile.TemporaryDirectory() as t2:
            work = lt.stage(src, Path(t1))
            files = lt.git(["ls-files"], work).stdout.split()
            self.assertEqual(sorted(files), [".gitignore", ".nojekyll", "css/a.css", "index.html"])
            first = lt.git(["write-tree"], work).stdout.strip()
            (src / "index.html").touch()
            again = lt.git(["write-tree"], lt.stage(src, Path(t2))).stdout.strip()
            self.assertEqual(first, again)


class FolderAccountTest(unittest.TestCase):
    """Local git only, no network."""

    def owner_for(self, url=None):
        d = Path(tempfile.mkdtemp())
        lt.git(["init", "-q"], d)
        if url:
            lt.git(["remote", "add", "origin", url], d)
        return lt.folder_account(d)

    def test_owner_from_origin_url_forms(self):
        for url in ("git@github-personal:Gualtix/saito-builder.git", "git@github.com:Gualtix/saito-builder",
                    "https://github.com/Gualtix/saito-builder.git", "ssh://git@github-work/Gualtix/x.git"):
            self.assertEqual(self.owner_for(url), "Gualtix", url)

    def test_none_without_github_origin_or_repo(self):
        self.assertIsNone(self.owner_for())
        self.assertIsNone(self.owner_for("git@gitlab.com:someone/x.git"))
        self.assertIsNone(lt.folder_account(Path(tempfile.mkdtemp())))


if __name__ == "__main__":
    unittest.main()
