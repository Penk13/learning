# Notes

## Learner preferences
- One HTML lesson **per book chapter** (not micro-lessons). Lesson N = Chapter N.
- Easy to read; **diagrams/illustrations over long text**.
- Replies: terse (caveman style). Lessons themselves written in normal English.
- Works in BINUS IT Division — tie examples to university/IT-ops scenarios, but never invent BINUS system names.
- Uses the **2nd edition** (confirmed 2026-10-03). Never fall back to 1st-ed chapter numbers, pages or examples.

## Source
- PDF: `03_Resources/Books & Reading/Designing Data-Intensive Applications 2nd Edition (Martin Kleppmann, Chris Riccomini).pdf`
- Page mapping: **book page = PDF page − 24** (1-based; book p.1 = PDF p.25). PDF has a bookmark outline.
- 2nd-ed chapter map (book pages):
  1 Trade-Offs in Data Systems Architecture (1) · 2 Defining Nonfunctional Requirements (33) · 3 Data Models and Query Languages (65) · 4 Storage and Retrieval (115) · 5 Encoding and Evolution (161) · 6 Replication (197) · 7 Sharding (251) · 8 Transactions (277) · 9 The Trouble with Distributed Systems (345) · 10 Consistency and Consensus (401) · 11 Batch Processing (451) · 12 Stream Processing (487) · 13 A Philosophy of Streaming Systems (539) · 14 Doing the Right Thing (585) · Glossary (603)
- Differs from 1st ed.: old Ch.1 (reliable/scalable/maintainable) is now **Ch.2**; new Ch.1 covers OLTP/OLAP, warehouses/lakes, systems of record, cloud vs self-host, distributed vs single-node, law. Twitter case study uses new numbers (5.8k posts/s, 400M lookups/s vs ~1.16M writes/s). Partitioning → "Sharding" (Ch.7). Batch chapter rewritten (no MapReduce focus).

## Components (assets/)
- `course.css` — shared tokens (light/dark), cards, grid, callouts, quiz, widget, glossary styles, `pre` code blocks + `.code-label`, print.
- `widgets.js` — quiz engine (`.quiz[data-answer]`, `[data-quiz-score]`, `[data-quiz-reset]`); widgets via `data-widget`: `percentiles`, `tail-amplification`, `fanout` (2nd-ed numbers, spike toggle), `queueing` (Ch.2 response time vs load, toy M/M/1), `provisioning` (Ch.1 cloud vs self-host toy cost model), `n-plus-one` (Ch.3 ORM N+1 toy cost), `event-sourcing` (Ch.3 event log → views, bug + replay), `lsm` (Ch.4 memtable → SSTables → compaction, tombstones, lookup path), `bloom` (Ch.4 16-bit Bloom filter, false positives). Add new widgets to the `WIDGETS` map.
- Inline SVG uses CSS vars (`var(--rel)` etc.) so diagrams follow dark mode.

## Lesson pattern
1. Big-picture diagram → 2. sections per chapter heading, each with a figure or widget → 3. recall cards → 4. 6–9 quiz Qs (equal-length options) → 5. "apply to your work" prompt → 6. primary source + ask-teacher box.

## Progress
- 2026-10-02: Lesson 0001 created from 1st-ed Ch.1 (wrong edition).
- 2026-10-03: Re-based course on 2nd ed. New Lesson 0001 = Ch.1 Trade-offs; old content revised into Lesson 0002 = Ch.2 Nonfunctional Requirements. Cheat sheets ch1/ch2 + glossary rebuilt. Learner hasn't done quizzes yet.
- 2026-10-05: Learner finished Ch.1 + lesson 0001 + ch1 cheat sheet + glossary. Created `learning-records/` (one record per lesson, Missing Semester format: Demonstrated / Gaps found / Next). Record 0001 added. Ch.2 planned 2026-10-06 — start with Ch.1 recall listed in record 0001.
- 2026-10-19: Learner reports Ch.2 read in full; now reading Ch.3 (Data Models and Query Languages). Record 0002 added. Lesson 0002 / quizzes completion unknown. Lesson 0003 not built yet.
- 2026-10-19: Built lesson 0003 (Ch.3 Data Models & Query Languages, book pp. 65–108 = PDF 89–132), `reference/ch3-cheatsheet.html`, 37 Ch.3 glossary terms, 2 new widgets. Learner mid-way through reading Ch.3. Preview server: `.claude/launch.json` at repo root (`learning-static`, port 8765).
- 2026-10-22: Learner finished reading Ch.3 + lesson 0003 + its quiz (score not reported). Record 0003 added. Built lesson 0004 (Ch.4 Storage and Retrieval, book pp. 115–150 = PDF 139–174; refs to p.160), `reference/ch4-cheatsheet.html`, 53 Ch.4 glossary terms, 2 new widgets. Learner starting Ch.4 reading now. PDF actually at `C:/Users/msi/My Drive (natanael.steven.setiawan@gmail.com)/Obsidian Personal/03_Resources/Books & Reading/`.
