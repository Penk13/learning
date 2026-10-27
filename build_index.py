"""Build the static site into dist/.

Copies each course (minus repo-only files) and the shared assets/ folder, then
wires every lesson and reference page into the site shell: shared stylesheet
and scripts (site.js, progress.js answer sync, quiz.js cards), a sticky top bar and
prev/next navigation. Prefixes lesson and reference <title> tags with TITLE_PREFIX and
generates index.html for the site root and each course, plus the spaced-repetition
review page (review.html) and cards.json, every card from every lesson (see DESIGN.md).
A course is any top-level folder containing a lessons/ directory.
Prints warnings for lessons over the reading budget and for cards that won't sync or
review correctly: every card needs a unique data-qid and either options or a model answer.
Index rows carry each lesson's card count and reading time.
Run after adding lessons:  python build_index.py
Stdlib only, so it also runs as the Cloudflare build command.
"""

import html
import json
import math
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
ASSETS = ROOT / "assets"
SECTIONS = ("lessons", "reference")
# Repo-only files kept off the site; lessons link to .md notes on GitHub instead.
REPO_ONLY = shutil.ignore_patterns("*.md", "learning-records", ".*", "Thumbs.db", "desktop.ini")
REPO_URL = "https://github.com/Penk13/learning/blob/main"
TITLE_PREFIX = "Learning - "
# Lessons are read on a phone in at most MAX_MINUTES, cards not counted (DESIGN.md).
WORDS_PER_MINUTE = 200
MAX_MINUTES = 5

ICON = {
    "back": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    "chev": '<svg class="sx-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    "theme": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor"/></svg>',
    "sync": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5Z"/></svg>',
    "review": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
    "doc":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
}

# Applies the saved theme before first paint, so dark mode never flashes light.
THEME_BOOT = '<script>try{var t=JSON.parse(localStorage.getItem("learning:theme"));if(t)document.documentElement.dataset.theme=t}catch(e){}</script>'

e = lambda s: html.escape(str(s), quote=True)
WARNINGS = []


class LessonScan(HTMLParser):
    """Finds the cards on a lesson page (.quiz[data-quiz] containers) with their source
    spans, and counts the words read outside them. Stray <textarea>s are counted too:
    free-text questions must be cards so they reach the review queue."""

    SKIP = {"script", "style", "template", "head"}

    def __init__(self, source):
        super().__init__()
        self.source = source
        self.line_starts = [0] + [m.end() for m in re.finditer("\n", source)]
        self.cards = []
        self.card = None
        self.depth = 0
        self.skip = 0
        self.words = 0
        self.stray_textareas = 0

    def source_pos(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        if tag in self.SKIP:
            self.skip += 1
        if self.card:
            if tag == self.card["tag"]:
                self.depth += 1
            if "quiz-options" in classes:
                self.card["kind"] = "mcq"
            elif "quiz-answer" in classes and not self.card["kind"]:
                self.card["kind"] = "text"
            if a.get("data-answer") == "correct":
                self.card["correct"] += 1
        elif "data-quiz" in a or "quiz" in classes:
            self.card = {"tag": tag, "qid": a.get("data-qid"), "start": self.source_pos(), "kind": None,
                         "correct": 0, "wired": "data-quiz" in a and "quiz" in classes}
            self.depth = 1
        elif tag == "textarea":
            self.stray_textareas += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self.skip = max(0, self.skip - 1)
        if self.card and tag == self.card["tag"]:
            self.depth -= 1
            if self.depth == 0:
                self.card["html"] = self.source[self.card["start"]:self.source.index(">", self.source_pos()) + 1]
                self.cards.append(self.card)
                self.card = None

    def handle_data(self, data):
        if not self.card and not self.skip:
            self.words += len(data.split())


def scan_lesson(path):
    """Return (cards, reading minutes) for a lesson, recording warnings for problems."""
    scan = LessonScan(path.read_text(encoding="utf-8"))
    scan.feed(scan.source)
    scan.close()
    where = path.relative_to(ROOT)
    minutes = max(1, math.ceil(scan.words / WORDS_PER_MINUTE))
    if minutes > MAX_MINUTES:
        WARNINGS.append(f"{where}: {scan.words} words, about {minutes} min to read (budget {MAX_MINUTES} min, "
                        f"{WORDS_PER_MINUTE * MAX_MINUTES} words); split it")
    if scan.stray_textareas:
        WARNINGS.append(f"{where}: <textarea> outside a card; use a free-text card (.quiz-answer) instead")
    seen = set()
    for card in scan.cards:
        qid = card["qid"]
        label = f'card data-qid="{qid}"' if qid else "card"
        if not qid:
            WARNINGS.append(f"{where}: card without data-qid")
        elif qid in seen:
            WARNINGS.append(f'{where}: duplicate data-qid="{qid}"')
        seen.add(qid)
        if not card["wired"]:
            WARNINGS.append(f'{where}: {label} needs both class="quiz" and data-quiz')
        if not card["kind"]:
            WARNINGS.append(f"{where}: {label} has neither .quiz-options nor .quiz-answer")
        elif card["kind"] == "mcq" and card["correct"] != 1:
            WARNINGS.append(f'{where}: {label} has {card["correct"]} options marked data-answer="correct" (needs 1)')
    return [c for c in scan.cards if c["qid"] and c["kind"]], minutes


def check_course_scripts(course):
    """Cards run on the shared assets/quiz.js; course scripts must not handle them."""
    for script in sorted((course / "assets").glob("*.js")) if (course / "assets").is_dir() else []:
        if re.search(r"quiz", script.read_text(encoding="utf-8"), re.I):
            WARNINGS.append(f"{script.relative_to(ROOT)}: course script handles quizzes; cards use assets/quiz.js")


def head_bits(rel):
    return (f'<meta name="color-scheme" content="light dark">\n{THEME_BOOT}\n'
            f'<link rel="stylesheet" href="{rel}assets/site.css">\n')


def top_bar(back_href, back_label, title, sub, progress=False):
    back = (f'<a class="sx-icon" href="{e(back_href)}" aria-label="{e(back_label)}">{ICON["back"]}</a>'
            if back_href else '<span class="sx-pad"></span>')
    sub_html = f'<span><i class="sx-dot"></i>{e(sub)}</span>' if sub else ""
    bar = '<div class="sx-progress"><span></span></div>' if progress else ""
    # Answer-sync status button, driven by assets/progress.js.
    sync = f'<button class="sx-icon sx-sync" type="button" data-sx-sync aria-label="Answer sync">{ICON["sync"]}</button>'
    return (f'<header class="sx-bar">{back}<div class="sx-where"><b>{e(title)}</b>{sub_html}</div>{sync}'
            f'<button class="sx-icon" type="button" data-sx-theme aria-label="Toggle dark mode">{ICON["theme"]}</button>{bar}</header>')


def page(title, body, rel="", course=None, scripts=()):
    course_attr = f' data-course="{e(course)}"' if course else ""
    extra = "".join(f'<script src="{rel}assets/{name}" defer></script>\n' for name in scripts)
    return f"""<!doctype html>
<html lang="en"{course_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
{head_bits(rel)}<script src="{rel}assets/site.js" defer></script>
<script src="{rel}assets/progress.js" defer></script>
{extra}</head>
<body>
{body}
</body>
</html>
"""


TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
SHORT_RE = re.compile(r"^(?:Lesson\s+\d+|Reference)\s*[—–:-]\s*", re.I)


def html_title(path):
    match = TITLE_RE.search(path.read_text(encoding="utf-8"))
    return html.unescape(match.group(1).strip()) if match else path.stem


def short_title(title):
    """'Lesson 0002 — Environment Variables' -> 'Environment Variables'."""
    return SHORT_RE.sub("", title).strip()


def lesson_number(path, fallback):
    match = re.match(r"(\d+)", path.name)
    return int(match.group(1)) if match else fallback


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


def wire_page(path, *, course, course_title, section, items, index):
    """Inject the site shell into one copied lesson/reference page."""
    text = path.read_text(encoding="utf-8")
    name, title = items[index]
    where = f"Lesson {index + 1} of {len(items)}" if section == "lessons" else "Reference"

    text = TITLE_RE.sub(lambda m: f"<title>{e(TITLE_PREFIX)}{m.group(1).strip()}</title>", text, count=1)
    text = re.sub(r"<html\b", f'<html data-course="{e(course)}" data-lesson="{e(path.stem)}"', text, count=1)
    # Shared stylesheet goes first so the course stylesheet can override it.
    first_css = re.search(r'<link[^>]+rel="stylesheet"', text)
    at = first_css.start() if first_css else text.lower().index("</head>")
    text = text[:at] + head_bits("../../") + text[at:]
    text = re.sub(r"</head>", '<script src="../../assets/site.js" defer></script>\n'
                  '<script src="../../assets/progress.js" defer></script>\n'
                  '<script src="../../assets/quiz.js" defer></script>\n</head>', text, count=1, flags=re.I)

    bar = top_bar("../index.html", f"Back to {course_title}", short_title(title), f"{course_title} · {where}", progress=True)
    text = re.sub(r"(<body\b[^>]*>)", lambda m: m.group(1) + "\n" + bar, text, count=1, flags=re.I)

    links = []
    if index > 0:
        prev_name, prev_title = items[index - 1]
        links.append(f'<a class="sx-prev" href="{e(prev_name)}"><small>‹ Previous</small><span>{e(short_title(prev_title))}</span></a>')
    if index < len(items) - 1:
        next_name, next_title = items[index + 1]
        links.append(f'<a class="sx-next" href="{e(next_name)}"><small>Next ›</small><span>{e(short_title(next_title))}</span></a>')
    foot = ('<nav class="sx-foot" aria-label="Course navigation">'
            + (f'<div class="sx-pn">{"".join(links)}</div>' if links else "")
            + f'<a class="sx-home" href="../index.html">All of {e(course_title)}</a></nav>')
    text = re.sub(r"</body>", lambda m: foot + "\n" + m.group(0), text, count=1, flags=re.I)
    path.write_text(text, encoding="utf-8", newline="")


def row(href, label, badge, progress_key=None, total=0, minutes=None):
    # progress.js fills .sx-score from /api/progress for rows that have questions.
    attrs = f' data-progress="{e(progress_key)}" data-total="{total}"' if total else ""
    score = '<span class="sx-score" hidden></span>' if total else ""
    time = f'<small class="sx-time">~{minutes} min</small>' if minutes else ""
    return (f'<li><a class="sx-lesson" href="{e(href)}"{attrs}><span class="sx-num">{badge}</span>'
            f'<span class="sx-label"><b>{e(label)}</b>{time}</span>{score}{ICON["chev"]}</a></li>')


def build_course(course):
    title, summary = mission(course)
    out = DIST / course.name
    shutil.copytree(course, out, ignore=REPO_ONLY)

    check_course_scripts(course)
    sections = {}
    scans = {}
    for section in SECTIONS:
        files = sorted((course / section).glob("*.html")) if (course / section).is_dir() else []
        items = [(f.name, html_title(f)) for f in files]
        sections[section] = (files, items)
        if section == "lessons":
            scans = {f.name: scan_lesson(f) for f in files}
        for i in range(len(items)):
            wire_page(out / section / items[i][0], course=course.name, course_title=title,
                      section=section, items=items, index=i)

    lessons, lesson_items = sections["lessons"]
    refs, ref_items = sections["reference"]
    parts = [
        top_bar("../index.html", "All courses", title, "Course"),
        '<main class="sx-index">',
        f'<header><div class="kicker">Course · {len(lessons)} lesson{"s" if len(lessons) != 1 else ""}</div>'
        f"<h1>{e(title)}</h1>" + (f'<p class="sx-lead">{e(summary)}</p>' if summary else "") + "</header>",
    ]
    if lessons:
        parts.append('<h2 class="sx-h">Lessons</h2><ul class="sx-list">')
        parts += [row(f"lessons/{name}", short_title(t), str(lesson_number(f, i + 1)),
                      f"{course.name}/{f.stem}", len(scans[name][0]), scans[name][1])
                  for i, (f, (name, t)) in enumerate(zip(lessons, lesson_items))]
        parts.append("</ul>")
    if refs:
        parts.append('<h2 class="sx-h">Reference</h2><ul class="sx-list sx-refs">')
        parts += [row(f"reference/{name}", short_title(t), ICON["doc"]) for name, t in ref_items]
        parts.append("</ul>")
    docs = [name for name in ("MISSION", "RESOURCES", "NOTES") if (course / f"{name}.md").exists()]
    if docs:
        parts.append('<h2 class="sx-h">Notes on GitHub</h2><div class="sx-chips">' + "".join(
            f'<a href="{REPO_URL}/{course.name}/{name}.md" target="_blank" rel="noopener">{name.capitalize()} ↗</a>'
            for name in docs) + "</div>")
    parts.append("</main>")
    (out / "index.html").write_text(page(TITLE_PREFIX + title, "\n".join(parts), rel="../", course=course.name),
                                    encoding="utf-8")
    cards = [{"course": course.name, "course_title": title, "lesson": f.stem, "qid": c["qid"], "title": short_title(t),
              "url": f"{course.name}/lessons/{name}", "html": c["html"]}
             for f, (name, t) in zip(lessons, lesson_items) for c in scans[name][0]]
    return title, summary, len(lessons), len(refs), cards


def main():
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()
    shutil.copytree(ASSETS, DIST / "assets")
    courses = sorted(d for d in ROOT.iterdir() if d != DIST and (d / "lessons").is_dir())
    tiles = []
    all_cards = []
    for course in courses:
        title, summary, n_lessons, n_refs, cards = build_course(course)
        all_cards += cards
        counts = f"{n_lessons} lesson{'s' if n_lessons != 1 else ''}" + (f" · {n_refs} ref{'s' if n_refs != 1 else ''}" if n_refs else "")
        progress = (f' data-progress="{e(course.name)}" data-total="{len(cards)}"' if cards else "")
        score = '<span class="sx-score" hidden></span>' if cards else ""
        tiles.append(
            f'<li><a class="sx-course" data-course="{e(course.name)}" href="{e(course.name)}/index.html"{progress}>'
            f"<b>{e(title)}</b>" + (f"<p>{e(summary)}</p>" if summary else "")
            + f'<div class="sx-stats">{counts}{score}</div></a></li>')
    # assets/review.js fills the due count from /api/schedule.
    review_link = (f'<a class="sx-review" href="review.html"><span class="sx-num">{ICON["review"]}</span>'
                   f'<span class="sx-label"><b>Review</b><small data-review-due>{len(all_cards)} cards</small></span>{ICON["chev"]}</a>')
    body = "\n".join([
        top_bar(None, "", "Learning", ""),
        '<main class="sx-index">',
        '<header><h1>Learning</h1><p class="sx-lead">Short lessons, reviewed on a spaced-repetition schedule.</p></header>',
        review_link,
        '<h2 class="sx-h">Courses</h2>',
        '<ul class="sx-list sx-courses">', *tiles, "</ul>",
        "</main>",
    ])
    (DIST / "index.html").write_text(page("Learning", body, scripts=["review.js"]), encoding="utf-8")

    review = "\n".join([
        top_bar("index.html", "All courses", "Review", "Spaced repetition"),
        '<main class="sx-index rv" data-review><p class="sx-lead">Loading cards…</p></main>',
    ])
    (DIST / "review.html").write_text(page(TITLE_PREFIX + "Review", review, scripts=["quiz.js", "review.js"]),
                                      encoding="utf-8")
    (DIST / "cards.json").write_text(json.dumps({"cards": all_cards}, ensure_ascii=False), encoding="utf-8")

    print(f"Built {len(courses)} courses, {len(all_cards)} cards into {DIST.name}/.")
    if WARNINGS:
        print(f"\n{len(WARNINGS)} warning{'s' if len(WARNINGS) != 1 else ''} (fix before committing):")
        print("\n".join(f"  - {w}" for w in WARNINGS))


if __name__ == "__main__":
    main()
