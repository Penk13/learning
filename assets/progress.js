/* Answer sync: records quiz answers and saved free-text answers, queues them in
 * localStorage and uploads them to /api/answers (D1) when a sync token is set.
 *
 * Quiz scripts report answers with a bubbling event:
 *   quiz.dispatchEvent(new CustomEvent("quiz:answered", { bubbles: true,
 *     detail: { qid, question, answer, correct } }));
 * Every <textarea> on the page gets a "Save answer" button (qid from data-qid, else t1, t2...).
 * The top-bar button [data-sx-sync] shows sync state; tapping it sets or clears the token. */
(() => {
  "use strict";

  const QUEUE_KEY = "learning:answer-queue";
  const REJECTED_KEY = "learning:answer-rejected";
  const TOKEN_KEY = "learning:sync-token";
  const BATCH = 50;

  const course = document.documentElement.dataset.course;
  const lesson = decodeURIComponent(location.pathname.split("/").pop() || "").replace(/\.html$/, "");
  if (!course || !lesson) return;

  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: answers stay in memory */ }
  };
  // Server limits are 4000 / 10000 chars; clip here so a long answer never blocks the queue.
  const oneLine = (text, max) => (text || "").replace(/\s+/g, " ").trim().slice(0, max);

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
      !token ? ["off", pending ? `Sync off · ${pending} answer${pending > 1 ? "s" : ""} saved on this device` : "Sync off · tap to set token"]
      : rejectedToken ? ["error", "Sync token rejected · tap to fix"]
      : pending ? ["pending", `${pending} answer${pending > 1 ? "s" : ""} waiting to sync`]
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
    flush();
  });

  /* ---------- upload ---------- */
  async function flush() {
    if (flushing || !token || rejectedToken || !queue.length) return;
    flushing = true;
    try {
      while (queue.length) {
        const batch = queue.slice(0, BATCH);
        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ attempts: batch }),
          redirect: "manual", // an expired Access session redirects; treat it as offline
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

  /* ---------- quiz answers ---------- */
  document.addEventListener("quiz:answered", (event) => {
    const { qid, question, answer, correct } = event.detail || {};
    if (!qid || !answer) return;
    record({ qid: oneLine(qid, 100), kind: "mcq", question, answer, correct });
  });

  /* ---------- free-text answers ---------- */
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

  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") flush(); });
  render();
  flush();
})();
