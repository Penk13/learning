# Design: short lessons + spaced repetition

The site exists to make things stick, not to explain everything. Lessons are short entry points; the questions in them (cards) are what the learner keeps, reviewed on a Leitner schedule from a daily queue.

## Lessons

- One idea per lesson: a section, a study case, a part of a chapter, anything. No fixed "one chapter per lesson" rule.
- **Budget: 5 minutes of reading**, questions not included. Aim for 300–800 words; `build_index.py` warns above 1000 words (200 wpm) and shows the estimate on each index row.
- Write for review, not explanation: the key claims, a diagram or table if it carries the idea, one concrete example. Cut background, history, and asides.
- 2–4 cards at the end (see below).
- File name `NNNN-slug.html` in `lessons/`; the index is a flat list in file-name order.
- The agent picks the next lesson from the course's `ROADMAP.md` and ticks it off when built.

## Cards

Every question is a card, identified by `course / lesson / qid` (`lesson` = file stem). One shared script, `assets/quiz.js`, runs every card on lesson pages and on the review page.

Multiple choice (`qid` `q1`, `q2`…). Options are shuffled each time the card is shown:

```html
<div class="quiz" data-quiz data-qid="q1">
  <p class="quiz-question">Why is <code>kill -9</code> a last resort?</p>
  <div class="quiz-options">
    <button data-answer="correct">SIGKILL can't be caught, so nothing gets cleaned up.</button>
    <button data-answer="wrong">It needs root.</button>
    <button data-answer="wrong">It only pauses the process.</button>
  </div>
  <div class="quiz-explanation">Plain <code>kill</code> (SIGTERM) lets the app shut down gracefully…</div>
</div>
```

Free text, including case studies (`qid` `t1`, `t2`…). `quiz.js` adds the text box and Submit button; the model answer shows after submitting:

```html
<div class="quiz" data-quiz data-qid="t1">
  <p class="quiz-case">Your container takes 30 s to stop and in-flight requests fail.</p>  <!-- optional scenario -->
  <p class="quiz-question">What does <code>docker stop</code> send, in what order, and what is the likely bug?</p>
  <div class="quiz-answer">SIGTERM, a 10 s grace period, then SIGKILL. The app probably…</div>
</div>
```

Rules:

- A card must make sense on its own: it is shown in the review queue without the lesson around it. No "as above", no references to figures on the page.
- Prefer recall over recognition: at most one multiple-choice card per lesson; the rest are short recall, "why", or case-study cards.
- `data-qid` is unique within the page and never renumbered or reused once published. A new card gets the next unused number.
- Keep model answers short (1–4 sentences) so they can be checked at a glance.

## Leitner schedule

Boxes 1–6 with intervals **1, 3, 7, 14, 30, 60 days**. A card starts in box 0 (never answered). For each answer, in time order:

- **Correct** moves the card up one box (max 6) — only if the card was due. Answering early does not promote it.
- **Wrong** sends it to box 1, due or not.
- A card is due when `today >= date of last counted answer + interval of its box`, in the learner's local calendar days.

So a card answered in the lesson (correct or wrong) lands in box 1 and is first reviewed the next day.

What counts as correct:

- Multiple choice: the option picked.
- Free text: correct when submitted (optimistic). When the agent later grades it wrong, a row in `grades` overrides it and the schedule is recomputed from the history, sending the card back to box 1.

The schedule is never stored: `/api/schedule` returns each card's answer history (time + correct, after grades), and `assets/review.js` folds it into boxes in the browser, so day boundaries follow the phone's time zone. Answers still queued on the device are merged in, so a card answered offline does not come back.

## Review page

`/review.html`, linked from the top of the home page with the number of cards due.

- One queue across all courses, shuffled, no daily limit.
- One card at a time; after answering, the explanation or model answer shows with a Next button and a link to the card's lesson.
- Cards come from `cards.json`, which the build extracts from every lesson. A card removed from its lesson drops out of the queue.

## Data (D1)

- `attempts` (append-only): every answer, from lessons and from the review page.
- `grades` (append-only): the agent's verdict on a text attempt. The latest grade per attempt wins.

`/api/progress` and `/api/schedule` return counts and (time, correct) pairs only; answer text is read with `wrangler`, never over HTTP.

## Per course

- `ROADMAP.md`: the planned lessons in order, ticked when built.
- `learning-records/NNNN-slug.md`: one per lesson, written by the agent at review time.
- `reference/cheatsheet.html`: one cheat sheet per course, extended as lessons are added.
- `MISSION.md`, `NOTES.md`, `RESOURCES.md` as before.

## Agent loop

1. Read unreviewed attempts.
2. Grade text answers against the card's model answer; insert a `grades` row for each one that is wrong (or right, to record the check).
3. Update the lesson's learning record: what was shown, gaps, leeches (cards wrong 3+ times).
4. Fix leeches: rewrite the card, split it, or add a case-study card from another angle (new `qid`).
5. Mark the read rows reviewed.
6. Build the next lesson from `ROADMAP.md` when asked.
