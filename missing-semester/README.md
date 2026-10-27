# The Missing Semester

A short, interactive learning workspace for making everyday .NET/React and Django development more effective through better command-line, debugging, Git, shipping, AI-assisted, and code-quality workflows.

> **Status: Finished (2026-10-21).** All nine official lectures read. The course was closed early: the learner already knows Git and delegates most debugging, CI/CD, and Git work to AI agents, so hands-on drills were judged low value. The Topic 1–2 lessons were split on 2026-10-26 into ten short spaced-repetition lessons (0001–0010, see [Roadmap](ROADMAP.md)); no further lessons will be built.

## Start here

- [Mission](MISSION.md)
- [Roadmap](ROADMAP.md)
- [Resources](RESOURCES.md)
- [Teaching notes](NOTES.md)
- [Lessons](lessons/)
- [Cheat sheet](reference/cheatsheet.html)
- [Learning records](learning-records/)

## Course map

The curriculum follows the official [2026 syllabus](https://missing.csail.mit.edu/2026/). Lessons were built for Topics 1–2; Topics 3–9 were read from the official notes only.

| # | Date | Topic | Official source | Status |
|---:|---|---|---|---|
| 1 | 12 Jan 2026 | Course Overview + Introduction to the Shell | [Course page](https://missing.csail.mit.edu/2026/course-shell/) | [0001](lessons/0001-commands-and-path.html) commands + PATH · [0002](lessons/0002-streams-pipes-exit-status.html) streams + exit status |
| 2 | 13 Jan 2026 | Command-line Environment | [Course page](https://missing.csail.mit.edu/2026/command-line-environment/) | [0003](lessons/0003-environment-variables.html) env vars · [0004](lessons/0004-shell-scripts-and-source.html) scripts · [0005](lessons/0005-signals.html) signals · [0006](lessons/0006-job-control.html) jobs · [0007](lessons/0007-ssh.html) SSH · [0008](lessons/0008-tmux.html) tmux · [0009](lessons/0009-bashrc-path-aliases-functions.html) .bashrc · [0010](lessons/0010-dotfiles-repo-and-tools.html) dotfiles repo |
| 3 | 14 Jan 2026 | Development Environment and Tools | [Course page](https://missing.csail.mit.edu/2026/development-environment/) | Lecture read |
| 4 | 15 Jan 2026 | Debugging and Profiling | [Course page](https://missing.csail.mit.edu/2026/debugging-profiling/) | Lecture read |
| 5 | 16 Jan 2026 | Version Control and Git | [Course page](https://missing.csail.mit.edu/2026/version-control/) | Lecture read |
| 6 | 20 Jan 2026 | Packaging and Shipping Code | [Course page](https://missing.csail.mit.edu/2026/shipping-code/) | Lecture read |
| 7 | 21 Jan 2026 | Agentic Coding | [Course page](https://missing.csail.mit.edu/2026/agentic-coding/) | Lecture read |
| 8 | 22 Jan 2026 | Beyond the Code | [Course page](https://missing.csail.mit.edu/2026/beyond-code/) | Lecture read |
| 9 | 23 Jan 2026 | Code Quality | [Course page](https://missing.csail.mit.edu/2026/code-quality/) | Lecture read |

## Learning loop

Lessons follow the repo-wide short-lesson model (see `DESIGN.md` at the repo root): one idea, at most 5 minutes of reading, then 2–4 cards that come back in the spaced-repetition review queue. Practice ideas live in the cheat sheet rather than in the lessons.

Lessons are the primary learning units. The cheat sheet compresses durable commands and mental models for later review. Learning records are written only when understanding is demonstrated, a misconception is corrected, or prior knowledge changes the next lesson.

## Safety boundary

Practice uses safe, disposable WSL sandbox projects. Do not place work repositories, credentials, tokens, or confidential ITDIV Binus / Top25 material in this workspace.
