# Roadmap

**Status: finished (2026-10-21).** Course closed after all nine official lectures were read; lessons exist for Topics 1–2 only. On 2026-10-26 the original five long lessons were split into the short spaced-repetition lessons below. No further lessons are planned.

## Topic 1 — The shell

- [x] 0001 commands-and-path — program + arguments, `$PATH` lookup, builtins (`which cd` vs `type cd`), local help
- [x] 0002 streams-pipes-exit-status — stdin/stdout/stderr, redirection, pipes, `$?`, `&&` / `||`, quoting and globs

## Topic 2 — Command-line environment

- [x] 0003 environment-variables — parent/child model, `export`, one-shot `VAR=value cmd`, command substitution
- [x] 0004 shell-scripts-and-source — shebang, `chmod +x`, `./`, arguments, run vs `source`, `set -euo pipefail`
- [x] 0005 signals — SIGINT/QUIT/TERM/KILL/TSTP/HUP, `kill`, graceful shutdown, `docker stop`, `exec` in entrypoints
- [x] 0006 job-control — `&`, Ctrl-Z, `bg`/`fg`/`jobs`, SIGHUP on close, `nohup`/`disown`, `trap … EXIT`, `wait`
- [x] 0007 ssh — remote vs local parts of a command, key pairs, `~/.ssh/config`, `scp`/`rsync`, port forwarding
- [x] 0008 tmux — tmux server owns the shells, sessions/windows/panes, detach/reattach, why it beats `&`
- [x] 0009 bashrc-path-aliases-functions — startup sourcing, extending `PATH`, aliases vs functions, Ctrl-R
- [x] 0010 dotfiles-repo-and-tools — dotfiles repo + symlinks, keeping secrets out, package managers, `curl | bash`

Topics 3–9 (development environment, debugging, Git, shipping, agentic coding, beyond the code, code quality) were read from the official notes only; no lessons.

Cheat sheet: `reference/cheatsheet.html`.
