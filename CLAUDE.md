# Learning repo: agent rules

Personal study site for quick review and spaced repetition. The learner reads short lessons and answers cards on a phone; answers sync to Cloudflare D1, and a daily review queue (`/review.html`) brings cards back on a Leitner schedule. Read DESIGN.md for the model and README.md for the site and sync mechanics.

## Writing lessons

- Pick the next lesson from the course's `ROADMAP.md`, then tick it off there.
- **5 minutes of reading max** (questions not counted): one idea, 300–800 words. Review notes, not a textbook: key claims, one example, a diagram or table only if it carries the idea. `build_index.py` warns above 1000 words.
- End with 2–4 cards in the shared format from DESIGN.md (`.quiz[data-quiz]`, multiple choice with `.quiz-options`, free text or case study with `.quiz-answer`). At most one multiple-choice card per lesson.
- Every card must stand alone: it reappears in the review queue without the lesson around it.
- Every card needs a `data-qid`, unique within the page: `q1`, `q2`… for multiple choice, `t1`, `t2`… for free text. Never renumber or reuse one on a published lesson; a new card gets the next unused number.
- The build loads the shared card script (`assets/quiz.js`) into every lesson. Don't write course quiz scripts or loose `<textarea>` prompts.
- No hand-written nav, footer or time estimate: the build adds navigation and shows reading time on the index.
- Course-wide notes go in the one cheat sheet, `reference/cheatsheet.html`. Keep every course folder in the layout from DESIGN.md (stylesheet `assets/course.css`, no scripts or interactive widgets).
- Run `python build_index.py` before committing. It must print no warnings.

## Reviewing the learner's answers

Wrangler needs Node 22+ (the machine default is Node 16), so put Node 22 first on PATH:

```sh
export PATH="/c/Users/msi/AppData/Local/nvm/v22.12.0:$PATH"
npx wrangler d1 execute learning --remote --command "SELECT id, course, lesson, qid, kind, correct, question, answer, answered_at FROM attempts WHERE reviewed_at IS NULL ORDER BY course, lesson, qid, answered_at"
```

- Text answers count as correct until graded. Grade each `kind = 'text'` row against the card's model answer and record the verdict (a wrong grade sends the card back to box 1):
  ```sh
  npx wrangler d1 execute learning --remote --command "INSERT INTO grades (attempt_id, correct, note) VALUES (<id>, 0, '<short reason>')"
  ```
- Write what was shown, the gaps and any leeches (cards wrong 3+ times) into `learning-records/<lesson stem>.md` (follow the existing record format).
- Fix leeches: rewrite or split the card, or add a new card from another angle with a new `qid`.
- Then mark exactly the rows you read as reviewed:
  ```sh
  npx wrangler d1 execute learning --remote --command "UPDATE attempts SET reviewed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE reviewed_at IS NULL AND id <= <highest id read>"
  ```
- Schema changes: add a new file in `migrations/` and apply it with `npx wrangler d1 migrations apply learning --remote` before pushing code that needs it.
