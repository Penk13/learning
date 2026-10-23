# Learning

Personal study workspace. Each folder is a self-contained course with lessons, references, and progress notes.

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
- `lessons/`: HTML lessons (open in browser)
- `reference/`: cheatsheets
- `learning-records/`: progress log
- `NOTES.md`, `RESOURCES.md`: notes and external links

## Site

Static site, no framework, deployed as a Cloudflare Worker with static assets. Every push to `main` redeploys.

- `build_index.py` builds the site into `dist/` (gitignored): copies each course without repo-only files (`.md` notes, learning records, dotfiles), prefixes lesson and reference `<title>` tags with `Learning - `, and generates `index.html` for the root and each course. Write lesson titles without the prefix. Cloudflare runs it as the build command; run it locally to preview `dist/`:

  ```sh
  python build_index.py
  ```

- `assets/` holds the shared, mobile-first design: `site.css` (tokens, light/dark, every common lesson component) and `site.js` (theme toggle, reading progress line, auto-hiding top bar). The build loads `site.css` before each course stylesheet and adds a top bar and prev/next navigation to every lesson and reference page, so lessons need no nav or base styles of their own. Course stylesheets hold only course-specific components.
- `wrangler.jsonc` holds the Worker config and serves `dist/`. Lessons link to `.md` notes on GitHub.

## Answer sync (D1)

Quiz answers and saved free-text answers from the phone are stored in a Cloudflare D1 database, so an agent on the laptop can read them.

- `assets/progress.js` (loaded on every lesson and reference page) queues each answer in localStorage and POSTs it to `/api/answers`. Answers made without a token or offline stay queued and upload later. The cloud button in the top bar shows the state (grey: no token, accent: waiting, green: synced, red: token rejected); tap it to set the token once per device.
- `worker/index.js` handles `POST /api/answers` and `GET /api/progress` (both need bearer token = `SYNC_TOKEN` secret) and serves everything else from `dist/`. `/api/progress` returns only per-lesson counts (questions answered, first attempts wrong); full answers are never readable over HTTP.
- Index pages show synced progress on each lesson row (`3/9`, `9/9 ✓`, `· 2 wrong`) and course card, using question counts the build writes into `data-total`. The last result is cached on the device.
- `build_index.py` prints answer-sync warnings for quizzes or text boxes without a unique `data-qid` and for course scripts that never fire `quiz:answered`.
- `migrations/` holds the schema: one append-only `attempts` table (`course`, `lesson`, `qid`, `kind` mcq/text, `question`, `answer`, `correct`, `answered_at`, `reviewed_at`).

**Writing lessons:** see [CLAUDE.md](CLAUDE.md). In short: every quiz and `<textarea>` has a `data-qid` that never changes once published, and quiz scripts fire the event below after an answer (the existing course scripts already do). Every `<textarea>` gets a "Save answer" button automatically.

```js
quiz.dispatchEvent(new CustomEvent("quiz:answered", { bubbles: true,
  detail: { qid, question, answer, correct } }));
```

**Agent workflow:** read unreviewed answers, write them into the course's `learning-records/`, then mark them reviewed (needs `npx wrangler login`, Node 22+):

```sh
npx wrangler d1 execute learning --remote --command "SELECT id, course, lesson, qid, kind, correct, question, answer, answered_at FROM attempts WHERE reviewed_at IS NULL ORDER BY answered_at"
npx wrangler d1 execute learning --remote --command "UPDATE attempts SET reviewed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE reviewed_at IS NULL AND id <= <last id read>"
```

**One-time setup:**

```sh
npx wrangler d1 create learning                      # copy database_id into wrangler.jsonc
npx wrangler d1 migrations apply learning --remote
npx wrangler secret put SYNC_TOKEN                   # paste a long random string
```

**Local dev:** put `SYNC_TOKEN=local-dev-token` in `.dev.vars` (gitignored), then `npx wrangler d1 migrations apply learning --local` and `npx wrangler dev`.
