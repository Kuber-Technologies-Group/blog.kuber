#!/usr/bin/env python3
"""
new_post.py — scaffold a new Kuber Tech Blog markdown post.

Creates a .md file in posts/ with the front matter the blog expects
(title, date, tags, summary, slug), matching lib/markdown.js's parser
and lib/utils.js's slugify() exactly.

Usage (interactive):
    python new_post.py

Usage (flags, non-interactive):
    python3 new_post.py \\
        --title "Why Backups Matter" \\
        --tags "hosting, security, backups" \\
        --summary "A short one-sentence summary for cards and RSS." \\
        --date 2026-07-20 \\
        --body-file draft.md

If --body / --body-file are omitted, an editor opens (via $EDITOR) so
you can write the article body. Falls back to reading from stdin if
no editor is available.
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

POSTS_DIR = Path(__file__).resolve().parent / "posts"


def slugify(value: str) -> str:
    """Mirror lib/utils.js slugify() exactly."""
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def escape_front_matter_value(value: str) -> str:
    """Wrap in double quotes, escaping any embedded double quotes."""
    return '"' + value.replace('"', '\\"') + '"'


def open_editor_for_body() -> str:
    editor = os.environ.get("EDITOR")
    if editor:
        with tempfile.NamedTemporaryFile(suffix=".md", mode="w+", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            subprocess.run([editor, tmp_path], check=True)
            return Path(tmp_path).read_text(encoding="utf-8")
        finally:
            os.unlink(tmp_path)

    print("No $EDITOR set. Paste the article body, then press Ctrl-D (Ctrl-Z on Windows) when done:")
    return sys.stdin.read()


def prompt(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or default


def build_post(title: str, post_date: str, tags: str, summary: str, slug: str, body: str) -> str:
    front_matter_lines = [
        "---",
        f"title: {escape_front_matter_value(title)}",
        f"date: {escape_front_matter_value(post_date)}",
        f"tags: {escape_front_matter_value(tags)}",
        f"summary: {escape_front_matter_value(summary)}",
        f"slug: {escape_front_matter_value(slug)}",
        "---",
        "",
    ]
    return "\n".join(front_matter_lines) + body.strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold a new Kuber Tech Blog post.")
    parser.add_argument("--title", help="Post title")
    parser.add_argument("--date", help="Publish date, YYYY-MM-DD (default: today)")
    parser.add_argument("--tags", help="Comma-separated tags, e.g. 'hosting, email, security'")
    parser.add_argument("--summary", help="One-sentence summary used on cards, RSS, and SEO")
    parser.add_argument("--slug", help="URL slug (default: derived from title)")
    parser.add_argument("--body", help="Article body as a plain string")
    parser.add_argument("--body-file", help="Path to a file containing the article body")
    parser.add_argument(
        "--posts-dir",
        default=str(POSTS_DIR),
        help=f"Where to write the post (default: {POSTS_DIR})",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite the file if it already exists")
    args = parser.parse_args()

    title = args.title or prompt("Title")
    if not title:
        sys.exit("A title is required.")

    post_date = args.date or prompt("Date (YYYY-MM-DD)", default=date.today().isoformat())
    tags = args.tags if args.tags is not None else prompt("Tags (comma-separated)", default="")
    summary = args.summary if args.summary is not None else prompt("Summary", default="")
    slug = args.slug or slugify(title)
    slug = slugify(slug) or slugify(title)

    if args.body_file:
        body = Path(args.body_file).read_text(encoding="utf-8")
    elif args.body is not None:
        body = args.body
    else:
        body = open_editor_for_body()

    if not body.strip():
        sys.exit("Article body is empty — aborting.")

    posts_dir = Path(args.posts_dir)
    posts_dir.mkdir(parents=True, exist_ok=True)
    out_path = posts_dir / f"{slug}.md"

    if out_path.exists() and not args.force:
        sys.exit(f"{out_path} already exists. Use --force to overwrite.")

    out_path.write_text(build_post(title, post_date, tags, summary, slug, body), encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
