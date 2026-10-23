/* Answer sync: records quiz answers and saved free-text answers, queues them in
 * localStorage and uploads them to /api/answers (D1) when a sync token is set.
 * On index pages it fills each row's score from /api/progress.
 *
 * Quiz scripts report answers with a bubbling event:
 *   quiz.dispatchEvent(new CustomEvent("quiz:answered", { bubbles: true,
 *     detail: { qid, question, answer, correct } }));
 * Every <textarea> on a lesson page gets a "Save answer" button (qid from data-qid, else t1, t2...).
 * The top-bar button [data-sx-sync] shows sync state; tapping it sets or clears the token.
 * Rows with data-progress="course/lesson" (or "course" for a course card) and data-total
 * get their .sx-score filled in; the last result is cached so it shows offline. */
(() => {
  "use strict";

  const QUEUE_KEY = "learning:answer-queue";
  const REJECTED_KEY = "learning:answer-rejected";
  const TOKEN_KEY = "learning:sync-token";
  const PROGRESS_KEY = "learning:progress";
  const BATCH = 50;

  const { course, lesson } = document.documentElement.dataset;

  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: answers stay in memory */ }
  };
  // Server limits are 4000 / 10000 chars; clip here so a long answer never blocks the queue.
  const oneLine = (text, max) => (text || "").replace(/\s+/g, " ").trim().slice(0, max);
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  let queue = load(QUEUE_KEY, []);
  let token = load(TOKEN_KEY, "");
  let rejectedToken = false;
  let flushing = false;

  /* ---------- top-bar state ---------- */
  const btn = document.querySelector("[data-sx-sync]");
  const render = () => {
    if (!btn) return;
    const pending = queue.length;
    const [state, label] =
      !token ? ["off", pending ? `Sync off · ${plural(pending, "answer")} saved on this device` : "Sync off · tap to set token"]
      : rejectedToken ? ["error", "Sync token rejected · tap to fix"]
      : pending ? ["pending", `${plural(pending, "answer")} waiting to sync`]
      : ["ok", "All answers synced"];
    btn.dataset.state = state;
    btn.title = label;
    btn.setAttribute("aria-label", label);
  };

  btn?.addEventListener("click", () => {
    const value = window.prompt("Sync token (leave empty to turn sync off):", "");
    if (value === null) return;
    token = value.trim();
    rejectedToken = false;
    if (token) save(TOKEN_KEY, token);
    else try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    render();
    sync();
  });

  const api = (path, options = {}) => fetch(path, {
    ...options,
    headers: { ...options.headers, authorization: `Bearer ${token}` },
    redirect: "manual", // an expired Access session redirects; treat it as offline
  });

  /* ---------- upload ---------- */
  async function flush() {
    if (flushing || !token || rejectedToken || !queue.length) return;
    flushing = true;
    try {
      while (queue.length) {
        const batch = queue.slice(0, BATCH);
        const res = await api("/api/answers", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attempts: batch }),
        });
        if (res.status === 401) { rejectedToken = true; break; }
        if (res.status === 400) {
          // Malformed rows would block the queue forever; park them instead of dropping.
          save(REJECTED_KEY, load(REJECTED_KEY, []).concat(batch));
          console.warn("Answer sync rejected a batch; kept under", REJECTED_KEY, await res.text());
        } else if (!res.ok) {
          break;
        }
        const sent = new Set(batch.map((a) => a.client_id));
        queue = queue.filter((a) => !sent.has(a.client_id));
        save(QUEUE_KEY, queue);
      }
    } catch {
      /* offline or blocked: keep the queue for the next try */
    } finally {
      flushing = false;
      render();
    }
  }

  /* ---------- progress on index pages ---------- */
  const scored = [...document.querySelectorAll("[data-progress][data-total]")];

  // { "course/lesson": { answered, wrong } }, plus a summed entry per course.
  function paint(lessons) {
    const byKey = {};
    for (const { course: c, lesson: l, answered, wrong } of lessons) {
      byKey[`${c}/${l}`] = { answered, wrong };
      const sum = (byKey[c] ||= { answered: 0, wrong: 0 });
      sum.answered += answered;
      sum.wrong += wrong;
    }
    for (const el of scored) {
      const score = el.querySelector(".sx-score");
      const data = byKey[el.dataset.progress];
      if (!score) continue;
      if (!data) { score.hidden = true; continue; }
      const total = Number(el.dataset.total);
      const answered = Math.min(data.answered, total); // stale qids can overshoot
      const done = answered === total;
      const isCourse = !el.dataset.progress.includes("/");
      score.textContent = (isCourse ? ` · ${answered}/${total} answered` : `${answered}/${total}${done && !data.wrong ? " ✓" : ""}`)
        + (data.wrong ? ` · ${data.wrong} wrong` : "");
      score.dataset.state = data.wrong ? "wrong" : done ? "done" : "partial";
      score.hidden = false;
    }
  }

  async function loadProgress() {
    if (!scored.length || !token || rejectedToken) return;
    try {
      const res = await api("/api/progress");
      if (res.status === 401) { rejectedToken = true; render(); return; }
      if (!res.ok) return;
      const { lessons } = await res.json();
      save(PROGRESS_KEY, lessons);
      paint(lessons);
    } catch {
      /* offline: the cached result stays on screen */
    }
  }

  async function sync() {
    await flush();
    await loadProgress();
  }

  /* ---------- recording (lesson and reference pages) ---------- */
  function record({ qid, kind, question, answer, correct }) {
    queue.push({
      client_id: crypto.randomUUID(),
      course, lesson, qid, kind,
      question: oneLine(question, 4000) || "(no question text)",
      answer: kind === "text" ? answer.trim().slice(0, 10000) : oneLine(answer, 10000),
      correct: kind === "mcq" ? Boolean(correct) : null,
      answered_at: new Date().toISOString(),
    });
    save(QUEUE_KEY, queue);
    render();
    flush();
  }

  if (course && lesson) {
    document.addEventListener("quiz:answered", (event) => {
      const { qid, question, answer, correct } = event.detail || {};
      if (!qid || !answer) return;
      record({ qid: oneLine(qid, 100), kind: "mcq", question, answer, correct });
    });

    document.querySelectorAll("textarea").forEach((area, i) => {
      const row = document.createElement("div");
      row.className = "sx-save";
      row.innerHTML = '<button type="button">Save answer</button><span aria-live="polite"></span>';
      const [saveBtn, status] = row.children;
      area.after(row);
      area.addEventListener("input", () => { status.textContent = ""; });
      saveBtn.addEventListener("click", () => {
        if (!area.value.trim()) { status.textContent = "Write something first."; return; }
        record({
          qid: oneLine(area.dataset.qid, 100) || `t${i + 1}`,
          kind: "text",
          question: area.dataset.question || area.previousElementSibling?.textContent || area.getAttribute("aria-label"),
          answer: area.value,
          correct: null,
        });
        status.textContent = "Saved.";
      });
    });
  }

  window.addEventListener("online", sync);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync(); });
  if (scored.length) paint(load(PROGRESS_KEY, []));
  render();
  sync();
})();
