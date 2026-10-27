/* Spaced-repetition queue (Leitner, see DESIGN.md).
 *
 * Folds each card's answer history from /api/schedule, plus answers still queued on this
 * device by assets/progress.js, into a box, and a card is due once today (local calendar
 * day) reaches its last counted answer + INTERVALS[box]. Cards come from /cards.json.
 *
 * Home page:   [data-review-due] gets the due count.
 * Review page: [data-review] shows the due cards one at a time, shuffled, across courses;
 *              assets/quiz.js runs each card and progress.js records the answer. */
(() => {
  "use strict";

  const INTERVALS = [0, 1, 3, 7, 14, 30, 60]; // days, by box; box 0 = never answered
  const TOP_BOX = INTERVALS.length - 1;
  const TOKEN_KEY = "learning:sync-token";
  const QUEUE_KEY = "learning:answer-queue";
  const SCHEDULE_KEY = "learning:schedule";

  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
  };
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const root = document.querySelector("[data-review]");
  const dueLabel = document.querySelector("[data-review-due]");

  // Local calendar day as a day count, so "tomorrow" follows the phone's time zone.
  const dayOf = (date) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const today = dayOf(new Date());

  /** history: [[answered_at, ok], ...] oldest first -> { box, dueDay } */
  function fold(history) {
    let box = 0;
    let last = null;
    for (const [at, ok] of history) {
      const day = dayOf(new Date(at));
      if (!ok) { box = 1; last = day; }
      else if (box === 0 || day >= last + INTERVALS[box]) { box = Math.min(box + 1, TOP_BOX); last = day; }
      // a correct answer before the card is due doesn't promote it
    }
    return { box, dueDay: box ? last + INTERVALS[box] : null };
  }

  async function loadSchedule() {
    const token = load(TOKEN_KEY, "");
    let server = load(SCHEDULE_KEY, null);
    let problem = token ? null : "no-token";
    if (token) {
      try {
        const res = await fetch("/api/schedule", { headers: { authorization: `Bearer ${token}` }, redirect: "manual" });
        if (res.ok) { server = (await res.json()).cards; save(SCHEDULE_KEY, server); }
        else problem = res.status === 401 ? "bad-token" : "offline";
      } catch { problem = "offline"; }
    }
    const histories = {};
    for (const [key, rows] of Object.entries(server || {})) histories[key] = rows.slice();
    for (const a of load(QUEUE_KEY, [])) {
      (histories[`${a.course}/${a.lesson}/${a.qid}`] ||= []).push([a.answered_at, a.kind === "text" ? 1 : a.correct ? 1 : 0]);
    }
    for (const rows of Object.values(histories)) rows.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
    return { histories, problem: server ? (problem === "offline" ? "stale" : problem) : problem };
  }

  async function loadCards() {
    const res = await fetch("cards.json", { cache: "no-cache" });
    return (await res.json()).cards;
  }

  /** -> { due: [card + state], upcoming: [card + state] } for cards answered at least once */
  function plan(cards, histories) {
    const due = [];
    const upcoming = [];
    for (const card of cards) {
      const history = histories[`${card.course}/${card.lesson}/${card.qid}`];
      if (!history?.length) continue;
      const state = fold(history);
      (state.dueDay <= today ? due : upcoming).push({ ...card, ...state });
    }
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [due[i], due[j]] = [due[j], due[i]];
    }
    return { due, upcoming };
  }

  const whenLabel = (day) => {
    const d = day - today;
    if (d <= 1) return "tomorrow";
    if (d < 7) return `in ${d} days`;
    return new Date(day * 86400000).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
  };
  const nextDue = (upcoming) => {
    if (!upcoming.length) return "";
    const day = Math.min(...upcoming.map((c) => c.dueDay));
    const n = upcoming.filter((c) => c.dueDay === day).length;
    return `Next: ${plural(n, "card")} ${whenLabel(day)}.`;
  };
  const PROBLEMS = {
    "no-token": "Set the sync token (cloud button, top right) to load your schedule.",
    "bad-token": "The sync token was rejected. Tap the cloud button to fix it.",
    offline: "Couldn't reach the server, and there's no saved schedule on this device yet.",
    stale: "Offline: showing the schedule saved on this device.",
  };

  /* ---------- home page ---------- */
  async function showDueCount() {
    const [cards, { histories, problem }] = await Promise.all([loadCards(), loadSchedule()]);
    if (problem === "no-token" || problem === "bad-token" || problem === "offline") return;
    const { due, upcoming } = plan(cards, histories);
    dueLabel.textContent = due.length ? `${plural(due.length, "card")} due today`
      : upcoming.length ? `Nothing due · ${nextDue(upcoming).replace(/^Next: /, "next ").replace(/\.$/, "")}`
      : "No cards yet · answer a lesson first";
    if (due.length) dueLabel.closest(".sx-review")?.setAttribute("data-due", due.length);
  }

  /* ---------- review page ---------- */
  async function runReview() {
    let cards, histories, problem;
    try {
      [cards, { histories, problem }] = await Promise.all([loadCards(), loadSchedule()]);
    } catch {
      root.innerHTML = '<p class="sx-lead">Couldn\'t load the cards. Check your connection and reload.</p>';
      return;
    }
    const note = problem && PROBLEMS[problem] ? `<p class="callout warn">${esc(PROBLEMS[problem])}</p>` : "";
    if (problem && problem !== "stale") { root.innerHTML = note; return; }

    const { due, upcoming } = plan(cards, histories);
    let index = 0;
    let reviewed = 0;

    const finish = () => {
      root.innerHTML = note + `<div class="rv-done"><h2>${reviewed ? "Done for today" : "Nothing due"}</h2>`
        + `<p class="sx-lead">${reviewed ? `${plural(reviewed, "card")} reviewed. ` : ""}${esc(nextDue(upcoming)) || "Answer the cards in a lesson to add them to the queue."}</p>`
        + '<p><a href="index.html">Back to courses</a></p></div>';
    };

    const show = () => {
      if (index >= due.length) { finish(); return; }
      const card = due[index];
      root.innerHTML = note
        + `<div class="rv-head"><span>Card ${index + 1} of ${due.length}</span><span>Box ${card.box}</span></div>`
        + `<div class="rv-bar"><span style="width:${(index / due.length) * 100}%"></span></div>`
        + `<div class="rv-card" data-course="${esc(card.course)}">`
        + `<p class="rv-from">${esc(card.course_title)} · ${esc(card.title)}</p>${card.html}`
        + `<div class="rv-actions" hidden><a href="${esc(card.url)}">Open lesson</a>`
        + `<button type="button" class="rv-next">${index + 1 < due.length ? "Next card" : "Finish"}</button></div></div>`;
      const quiz = root.querySelector(".quiz");
      quiz.dataset.course = card.course;
      quiz.dataset.lesson = card.lesson;
      window.LearningQuiz.init(root);
      const actions = root.querySelector(".rv-actions");
      quiz.addEventListener("quiz:answered", () => {
        reviewed++;
        actions.hidden = false;
        actions.querySelector(".rv-next").focus({ preventScroll: true });
      });
      actions.querySelector(".rv-next").addEventListener("click", () => {
        index++;
        show();
        window.scrollTo({ top: 0 });
      });
    };
    show();
  }

  if (root) runReview();
  else if (dueLabel) showDueCount().catch(() => { /* keep the static card count */ });
})();
