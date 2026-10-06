"""Build the static site into dist/.

Copies each course (minus repo-only files), prefixes lesson and reference
<title> tags with TITLE_PREFIX, and generates index.html for the site root
and each course. A course is any top-level folder containing a lessons/ directory.
Run after adding lessons:  python build_index.py
Stdlib only, so it also runs as the Cloudflare build command.
"""

import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
SECTIONS = ("lessons", "reference")
# Repo-only files kept off the site; lessons link to .md notes on GitHub instead.
REPO_ONLY = shutil.ignore_patterns("*.md", "learning-records", ".*", "Thumbs.db", "desktop.ini")
REPO_URL = "https://github.com/Penk13/learning/blob/main"
TITLE_PREFIX = "Learning - "

STYLE = """
:root {
  --bg: #f6f3ed; --card: #fffdf9; --ink: #25313b; --muted: #66727a;
  --line: #d9d4ca; --accent: #0f766e;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #14191d; --card: #1c2329; --ink: #e6e9eb; --muted: #9aa5ad;
          --line: #2e383f; --accent: #4fd1c5; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); line-height: 1.6; }
main { width: min(100% - 2rem, 760px); margin: 0 auto; padding: 2.5rem 0 4rem; }
h1 { font-family: Georgia, serif; font-size: clamp(2rem, 6vw, 2.8rem); margin: 0.3rem 0 0.5rem; }
h2 { font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 2rem 0 0.6rem; }
p { color: var(--muted); margin: 0 0 1rem; }
a { color: var(--accent); text-decoration: none; }
.crumb { font-size: 0.9rem; }
ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
li a { display: block; padding: 0.9rem 1rem; background: var(--card); border: 1px solid var(--line);
       border-radius: 10px; color: var(--ink); }
li a:hover, li a:focus-visible { border-color: var(--accent); }
li a small { display: block; color: var(--muted); margin-top: 0.2rem; }
.links { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; }
"""


def page(title, body):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>{STYLE}</style>
</head>
<body>
<main>
{body}
</main>
</body>
</html>
"""


TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S | re.I)


def html_title(path):
    match = TITLE_RE.search(path.read_text(encoding="utf-8"))
    return html.unescape(match.group(1).strip()) if match else path.stem


def prefix_title(path):
    text = path.read_text(encoding="utf-8")
    prefixed = TITLE_RE.sub(lambda m: f"<title>{html.escape(TITLE_PREFIX)}{m.group(1).strip()}</title>", text, count=1)
    path.write_text(prefixed, encoding="utf-8", newline="")


def mission(course):
    """Return (title, summary) from MISSION.md, falling back to the folder name."""
    path = course / "MISSION.md"
    if not path.exists():
        return course.name, ""
    text = path.read_text(encoding="utf-8")
    heading = re.search(r"^#\s+(?:Mission:\s*)?(.+)$", text, re.M)
    why = re.search(r"^## Why\s*\n+(?:>.*\n+)*(.+)$", text, re.M)
    summary = why.group(1).strip() if why else ""
    if len(summary) > 180:
        summary = summary[:180].rsplit(" ", 1)[0] + "…"
    return (heading.group(1).strip() if heading else course.name), summary


def link_list(items):
    rows = []
    for href, label, note in items:
        small = f"<small>{html.escape(note)}</small>" if note else ""
        rows.append(f'<li><a href="{href}">{html.escape(label)}{small}</a></li>')
    return "<ul>\n" + "\n".join(rows) + "\n</ul>"


def build_course(course):
    title, summary = mission(course)
    parts = [
        '<a class="crumb" href="../index.html">← All courses</a>',
        f"<h1>{html.escape(title)}</h1>",
        f"<p>{html.escape(summary)}</p>" if summary else "",
    ]
    out = DIST / course.name
    shutil.copytree(course, out, ignore=REPO_ONLY)
    for section in SECTIONS:
        files = sorted((course / section).glob("*.html")) if (course / section).is_dir() else []
        if files:
            parts.append(f"<h2>{section.capitalize()}</h2>")
            parts.append(link_list([(f"{section}/{f.name}", html_title(f), "") for f in files]))
        for f in files:
            prefix_title(out / section / f.name)
    docs = [name for name in ("MISSION", "RESOURCES", "NOTES") if (course / f"{name}.md").exists()]
    if docs:
        parts.append("<h2>Notes</h2>")
        parts.append('<div class="links">' + "".join(
            f'<a href="{REPO_URL}/{course.name}/{name}.md">{name.capitalize()}</a>' for name in docs
        ) + "</div>")
    (out / "index.html").write_text(page(TITLE_PREFIX + title, "\n".join(p for p in parts if p)), encoding="utf-8")
    lesson_count = len(list((course / "lessons").glob("*.html")))
    return title, lesson_count


def main():
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()
    courses = sorted(d for d in ROOT.iterdir() if d != DIST and (d / "lessons").is_dir())
    items = []
    for course in courses:
        title, count = build_course(course)
        items.append((f"{course.name}/index.html", title, f"{count} lesson{'s' if count != 1 else ''}"))
    body = "\n".join([
        "<h1>Learning</h1>",
        "<p>Study workspace: lessons, cheat sheets, and notes.</p>",
        "<h2>Courses</h2>",
        link_list(items),
    ])
    (DIST / "index.html").write_text(page("Learning", body), encoding="utf-8")
    print(f"Built {len(courses)} courses into {DIST.name}/.")


if __name__ == "__main__":
    main()
