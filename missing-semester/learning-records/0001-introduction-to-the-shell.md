# Learning record — Lesson 0001: Introduction to the Shell

Date: 2026-09-23

## Demonstrated
- Read official 2026 lecture notes (course-shell) and lesson 0001.
- Answered all 3 lesson quizzes correctly (program + arguments, `$PATH` lookup, pipes).
- Completed the sandbox task.

## Gaps found (warm-up recall)
- Could not explain why `which cd` prints nothing → taught: `cd` is a shell builtin; a child process cannot change its parent's working directory. Use `type` instead of `which`.
- Could not predict `false || echo no` / `false && echo yes` → taught: `||` runs on failure, `&&` runs on success (exit status 0).

## Next
- Re-check both gaps with a quick retrieval question at the start of the next session.
- Learner chose to skip Topic 1 exercises (low workflow value); script basics folded into lesson 0002.
- Lesson 0002 opens with recall quizzes on both gaps.
