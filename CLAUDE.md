# Learning repo: agent rules

Personal study site. The learner reads lessons and answers quizzes on a phone; answers sync to Cloudflare D1. See README.md for the site and sync design.

## Writing lessons

- Every quiz container (`data-quiz` or class `quiz`) and every `<textarea>` needs a `data-qid`, unique within the page: `q1`, `q2`… for quizzes, `t1`, `t2`… for text answers.
- Never renumber or reuse a `data-qid` on a published lesson: synced answers are keyed by it. When inserting a quiz, give it the next unused number, even if that puts ids out of order on the page.
- Course quiz scripts must fire this after each answer, or the answer is never saved:
  ```js
  quiz.dispatchEvent(new CustomEvent("quiz:answered", { bubbles: true,
    detail: { qid: quiz.dataset.qid, question, answer, correct } }));
  ```
  Reuse an existing course's `assets/quiz.js` for a new course instead of writing a new one.
- Free-text prompts need no script: `assets/progress.js` adds a "Save answer" button under each `<textarea>` and uses the element just before it as the question text (or `data-question`).
- Run `python build_index.py` before committing. It must print no answer-sync warnings.

## Reviewing the learner's answers

Wrangler needs Node 22+ (the machine default is Node 16), so put Node 22 first on PATH:

```sh
export PATH="/c/Users/msi/AppData/Local/nvm/v22.12.0:$PATH"
npx wrangler d1 execute learning --remote --command "SELECT id, course, lesson, qid, kind, correct, question, answer, answered_at FROM attempts WHERE reviewed_at IS NULL ORDER BY course, lesson, qid, answered_at"
```

- Judge each question by its first attempt; later attempts on the same `qid` are retries.
- Grade `kind = 'text'` answers against the lesson's model answer.
- Write what was demonstrated and the gaps into that course's `learning-records/` (follow the existing record format), and open the next lesson with recall questions on the gaps.
- Then mark exactly the rows you read as reviewed:
  ```sh
  npx wrangler d1 execute learning --remote --command "UPDATE attempts SET reviewed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE reviewed_at IS NULL AND id <= <highest id read>"
  ```
- Schema changes: add a new file in `migrations/` and apply it with `npx wrangler d1 migrations apply learning --remote` before pushing code that needs it.
