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

- `wrangler.jsonc` holds the Worker config and serves `dist/`. Lessons link to `.md` notes on GitHub.
