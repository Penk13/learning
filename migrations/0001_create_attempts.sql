-- One row per quiz answer or saved free-text answer. Append-only: retries are new rows.
CREATE TABLE attempts (
  id           INTEGER PRIMARY KEY,
  client_id    TEXT NOT NULL UNIQUE,            -- random id from the phone; makes retried uploads idempotent
  course       TEXT NOT NULL,                   -- 'missing-semester'
  lesson       TEXT NOT NULL,                   -- page file stem: '0005-dotfiles-and-shell-customization'
  qid          TEXT NOT NULL,                   -- data-qid, or 'q1', 'q2'... by position on the page
  kind         TEXT NOT NULL CHECK (kind IN ('mcq', 'text')),
  question     TEXT NOT NULL,                   -- snapshot of the question text
  answer       TEXT NOT NULL,                   -- chosen option text or typed answer
  correct      INTEGER CHECK (correct IN (0, 1)), -- NULL for free text
  answered_at  TEXT NOT NULL,                   -- when answered on the device (ISO 8601, UTC)
  received_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  reviewed_at  TEXT                             -- set by the agent once written into learning-records
);

CREATE INDEX idx_attempts_lesson ON attempts (course, lesson);
CREATE INDEX idx_attempts_unreviewed ON attempts (reviewed_at);
