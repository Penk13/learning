# Learning

Personal study workspace for quick review and spaced repetition: short lessons (5 minutes of reading) end in cards, and a daily review queue brings the cards back on a Leitner schedule. Each folder is a self-contained course. The model is in [DESIGN.md](DESIGN.md).

**Live site:** https://learning.penk13.workers.dev (protected by Cloudflare Access)

## Courses

| Folder | Topic |
| --- | --- |
| [dotnet-job-preparation](./dotnet-job-preparation) | ASP.NET Core fundamentals |
| [ddia-2e](./ddia-2e) | Designing Data-Intensive Applications, 2nd ed. |
| [django-job-preparation](./django-job-preparation) | Python / Django fundamentals |
| [react-job-preparation](./react-job-preparation) | React fundamentals |
| [missing-semester](./missing-semester) | Shell, scripting, dev tooling |

## Structure

Each course follows the same layout:

- `MISSION.md`: goal and scope
- `ROADMAP.md`: planned lessons in order, ticked when built
- `lessons/`: short HTML lessons, each ending in 2–4 cards
- `reference/cheatsheet.html`: one cheat sheet for the course
- `learning-records/`: progress log, one record per lesson
- `NOTES.md`, `RESOURCES.md`: notes and external links

## Site

Static site, no framework, deployed as a Cloudflare Worker with static assets. Every push to `main` redeploys.

- `build_index.py` builds the site into `dist/` (gitignored): copies each course without repo-only files (`.md` notes, learning records, dotfiles), prefixes lesson and reference `<title>` tags with `Learning - `, and generates `index.html` for the root and each course, `review.html` (the review queue) and `cards.json` (every card from every lesson). Index rows show each lesson's reading time. Write lesson titles without the prefix. Cloudflare runs it as the build command; run it locally to preview `dist/`:

  ```sh
  python build_index.py
  ```

- `assets/` holds the shared, mobile-first design: `site.css` (tokens, light/dark, every common lesson component), `site.js` (theme toggle, reading progress line, auto-hiding top bar), `quiz.js` (runs every card, on lessons and the review page) and `review.js` (Leitner queue, due count on the home page). The build loads `site.css` before each course stylesheet and adds a top bar and prev/next navigation to every lesson and reference page, so lessons need no nav or base styles of their own. Course stylesheets hold only course-specific components.
- `wrangler.jsonc` holds the Worker config and serves `dist/`. Lessons link to `.md` notes on GitHub.

## Answer sync and review (D1)

Answers from the phone are stored in a Cloudflare D1 database, so the review queue can schedule cards and an agent on the laptop can read them.

- `assets/progress.js` (loaded on every page) records each `quiz:answered` event from `quiz.js`, queues it in localStorage and POSTs it to `/api/answers`. Answers made without a token or offline stay queued and upload later. The cloud button in the top bar shows the state (grey: no token, accent: waiting, green: synced, red: token rejected); tap it to set the token once per device.
- `worker/index.js` handles `POST /api/answers`, `GET /api/progress` and `GET /api/schedule` (all need bearer token = `SYNC_TOKEN` secret) and serves everything else from `dist/`. `/api/progress` returns per-lesson counts; `/api/schedule` returns each card's (time, correct) history. Answer text is never readable over HTTP.
- `assets/review.js` folds each card's history into a Leitner box (1, 3, 7, 14, 30, 60 days) in the browser and shows the due cards on `/review.html`, one at a time, across all courses.
- Index pages show synced progress on each lesson row (`3/4`, `4/4 ✓`, `· 1 wrong`) and course card. The last result is cached on the device.
- `build_index.py` warns about lessons over the 5-minute budget and cards without a unique `data-qid`, options or a model answer.
- `migrations/` holds the schema: append-only `attempts` (`course`, `lesson`, `qid`, `kind` mcq/text, `question`, `answer`, `correct`, `answered_at`, `reviewed_at`) and `grades` (the agent's verdict on a free-text attempt; text counts as correct until graded wrong).

**Writing lessons and reviewing answers:** see [CLAUDE.md](CLAUDE.md) and the card format in [DESIGN.md](DESIGN.md). Needs `npx wrangler login` and Node 22+.

**One-time setup:**

```sh
npx wrangler d1 create learning                      # copy database_id into wrangler.jsonc
npx wrangler d1 migrations apply learning --remote
npx wrangler secret put SYNC_TOKEN                   # paste a long random string
```

**Local dev:** put `SYNC_TOKEN=local-dev-token` in `.dev.vars` (gitignored), then `npx wrangler d1 migrations apply learning --local` and `npx wrangler dev`.
