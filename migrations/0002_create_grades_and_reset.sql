-- Short-lesson redesign (see DESIGN.md): every lesson was rewritten, so old answers no longer
-- match any card. Start the answer history fresh.
DELETE FROM attempts;

-- The agent's verdict on a free-text attempt. Text answers count as correct until graded;
-- the latest grade per attempt wins. Append-only, like attempts.
CREATE TABLE grades (
  id          INTEGER PRIMARY KEY,
  attempt_id  INTEGER NOT NULL REFERENCES attempts (id),
  correct     INTEGER NOT NULL CHECK (correct IN (0, 1)),
  note        TEXT,                              -- short reason, for the learning record
  graded_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_grades_attempt ON grades (attempt_id);
CREATE INDEX idx_attempts_card ON attempts (course, lesson, qid, answered_at);
