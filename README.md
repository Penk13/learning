# Learning

Personal study workspace. Each folder is a self-contained course with lessons, references, and progress notes.

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

Static site, no framework. `build_index.py` generates `index.html` for the root and each course from lesson `<title>` tags. Run it after adding lessons:

```sh
python build_index.py
```

Deployed as a Cloudflare Worker with static assets (`wrangler.jsonc`). Build command `python build_index.py`; `.assetsignore` keeps repo-only files off the site.
