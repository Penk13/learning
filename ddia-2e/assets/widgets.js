/* DDIA course — reusable interactive components.
 *
 * Quiz:     <div class="quiz" data-answer="2"> <div class="q">…</div>
 *             <div class="opts"><button class="opt">…</button>…</div>
 *             <div class="why">explanation</div></div>
 *           data-answer = 0-based index of correct option.
 *           Optional <span class="score" data-quiz-score></span> shows running score.
 *
 * Widgets:  <div class="widget" data-widget="percentiles"></div>
 *           <div class="widget" data-widget="tail-amplification"></div>
 *           <div class="widget" data-widget="fanout"></div>
 *           <div class="widget" data-widget="queueing"></div>
 *           <div class="widget" data-widget="provisioning"></div>
 */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M"
                   : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k"
                   : String(Math.round(n));
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };

  /* ---------------- Quiz ---------------- */
  function initQuizzes() {
    const quizzes = [...document.querySelectorAll(".quiz")];
    const scoreEl = $("[data-quiz-score]");
    let answered = 0, correct = 0;
    const updateScore = () => {
      if (scoreEl) scoreEl.textContent = `${correct} / ${quizzes.length} correct` +
        (answered < quizzes.length ? ` · ${quizzes.length - answered} left` : " · done");
    };
    quizzes.forEach((quiz) => {
      const answer = Number(quiz.dataset.answer);
      const opts = [...quiz.querySelectorAll("button.opt")];
      opts.forEach((btn, i) => btn.addEventListener("click", () => {
        if (quiz.classList.contains("done")) return;
        quiz.classList.add("done");
        answered++;
        if (i === answer) correct++;
        btn.classList.add(i === answer ? "right" : "wrong");
        opts[answer].classList.add("right");
        opts.forEach((b) => (b.disabled = true));
        updateScore();
      }));
    });
    const reset = $("[data-quiz-reset]");
    if (reset) reset.addEventListener("click", () => {
      quizzes.forEach((q) => {
        q.classList.remove("done");
        q.querySelectorAll("button.opt").forEach((b) => { b.disabled = false; b.classList.remove("right", "wrong"); });
      });
      answered = 0; correct = 0; updateScore();
    });
    updateScore();
  }

  /* ---------------- Percentiles ----------------
   * 100 simulated response times. Shows mean vs p50/p95/p99.
   * Slider injects slow outliers: watch mean move, median barely budge. */
  function percentiles(root) {
    root.innerHTML = `
      <div class="w-title">Response-time playground</div>
      <div class="w-sub">Each bar = one request (height = how long it took). 100 requests.</div>
      <svg viewBox="0 0 600 220" role="img" aria-label="Bar chart of 100 request response times with percentile lines"></svg>
      <div class="row" style="margin-top:.6em">
        <span class="stat">mean<b data-k="mean"></b></span>
        <span class="stat">p50 (median)<b data-k="p50"></b></span>
        <span class="stat">p95<b data-k="p95"></b></span>
        <span class="stat">p99<b data-k="p99"></b></span>
      </div>
      <label>Slow outliers (GC pause, lost packet, disk hiccup…): <b data-k="nOut"></b> of 100</label>
      <input type="range" min="0" max="20" value="3" data-k="out">
      <div class="row" style="margin-top:.6em">
        <button class="btn" data-k="sort">Sort fastest → slowest</button>
        <button class="btn" data-k="again">New random sample</button>
      </div>
      <p class="readout" data-k="msg"></p>`;
    const svg = $("svg", root), out = $('[data-k="out"]', root);
    let sorted = false, base = [], outlierRank = [];

    const sample = () => {
      // log-normal-ish around ~120ms
      base = Array.from({ length: 100 }, () => {
        const u = Math.random() + Math.random() + Math.random();
        return 60 + u * 45 + Math.random() * 25;
      });
      outlierRank = Array.from({ length: 100 }, (_, i) => i).sort(() => Math.random() - 0.5);
    };
    const pct = (arr, p) => {
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
    };
    const draw = () => {
      const nOut = Number(out.value);
      const data = base.map((v, i) => outlierRank.indexOf(i) < nOut ? 900 + (i * 37 % 1100) : v);
      const shown = sorted ? [...data].sort((a, b) => a - b) : data;
      const max = 2100, H = 190, W = 600, bw = W / 100;
      const y = (v) => H - (v / max) * (H - 10);
      const st = {
        mean: data.reduce((a, b) => a + b, 0) / data.length,
        p50: pct(data, 50), p95: pct(data, 95), p99: pct(data, 99),
      };
      svg.innerHTML = "";
      shown.forEach((v, i) => svg.appendChild(svgEl("rect", {
        x: i * bw + 0.5, y: y(v), width: bw - 1, height: H - y(v),
        fill: v > 500 ? css("--bad") : css("--muted"), opacity: v > 500 ? 0.85 : 0.45,
      })));
      const lines = [["mean", css("--accent"), "6 4"], ["p50", css("--rel"), ""], ["p95", css("--sca"), ""], ["p99", css("--mai"), ""]];
      lines.forEach(([k, color, dash], j) => {
        const yy = y(st[k]);
        svg.appendChild(svgEl("line", { x1: 0, x2: W, y1: yy, y2: yy, stroke: color, "stroke-width": 2, "stroke-dasharray": dash }));
        const t = svgEl("text", { x: W - 4 - j * 62, y: yy - 4, "text-anchor": "end", "font-size": 12, "font-weight": 700, fill: color });
        t.textContent = k;
        svg.appendChild(t);
      });
      svg.appendChild(svgEl("line", { x1: 0, x2: W, y1: H, y2: H, stroke: css("--rule") }));
      const ms = (v) => Math.round(v) + " ms";
      for (const k in st) $(`[data-k="${k}"]`, root).textContent = ms(st[k]);
      $('[data-k="nOut"]', root).textContent = nOut;
      $('[data-k="msg"]', root).innerHTML = nOut === 0
        ? "No outliers: mean ≈ median. Everything looks calm."
        : `Mean got dragged to <b>${ms(st.mean)}</b>, yet ${100 - nOut} of 100 requests were faster than ${ms(pct(data, 100 - nOut))}. ` +
          `The mean describes <i>nobody's</i> experience. p50 stays put; p99 exposes the pain.`;
      $('[data-k="sort"]', root).classList.toggle("on", sorted);
    };
    out.addEventListener("input", draw);
    $('[data-k="sort"]', root).addEventListener("click", () => { sorted = !sorted; draw(); });
    $('[data-k="again"]', root).addEventListener("click", () => { sample(); draw(); });
    sample(); draw();
  }

  /* ---------------- Tail latency amplification ----------------
   * P(page slow) = 1 - (1 - p)^n for n parallel backend calls. */
  function tailAmplification(root) {
    root.innerHTML = `
      <div class="w-title">Tail latency amplification</div>
      <div class="w-sub">One page load fans out to N backend calls in parallel. The page is as slow as its slowest call.</div>
      <label>Backend calls per page: <b data-k="nv"></b></label>
      <input type="range" min="1" max="100" value="1" data-k="n">
      <label>Chance a single backend call is slow: <b data-k="pv"></b></label>
      <input type="range" min="1" max="50" value="10" data-k="p">
      <p class="readout">Pages that end up slow: <b data-k="res" style="font-size:1.3rem"></b></p>
      <svg viewBox="0 0 600 64" role="img" aria-label="100 dots representing page loads; red dots are slow"></svg>
      <p class="muted" style="margin:.3em 0 0">100 dots = 100 page loads. Red = user waited on a slow call.</p>`;
    const n = $('[data-k="n"]', root), p = $('[data-k="p"]', root), svg = $("svg", root);
    const draw = () => {
      const N = Number(n.value), P = Number(p.value) / 1000; // slider 1..50 → 0.1%..5%
      const prob = 1 - Math.pow(1 - P, N);
      $('[data-k="nv"]', root).textContent = N;
      $('[data-k="pv"]', root).textContent = (P * 100).toFixed(1) + "%";
      $('[data-k="res"]', root).textContent = (prob * 100).toFixed(1) + "%";
      svg.innerHTML = "";
      const slow = Math.round(prob * 100);
      for (let i = 0; i < 100; i++) {
        const col = i % 50, row = Math.floor(i / 50);
        svg.appendChild(svgEl("circle", {
          cx: 8 + col * 11.8, cy: 14 + row * 30, r: 5,
          fill: i < slow ? css("--bad") : css("--rule"),
        }));
      }
    };
    n.addEventListener("input", draw); p.addEventListener("input", draw);
    draw();
  }

  /* ---------------- Fan-out (social network home timelines, DDIA 2nd ed. Ch.2 numbers) ----------------
   * Approach 1: clients poll a join query every 5 s.  Approach 2: materialize timelines on write.
   * Bar widths are log-scaled because values span 5.8k … 400M. */
  function fanout(root) {
    const POSTS = 5800, SPIKE = 150000, POLLS = 2e6; // 10M online users polling every 5 s
    root.innerHTML = `
      <div class="w-title">Where do you pay: at read time or at write time?</div>
      <div class="w-sub">Book's case study: 500M posts/day ≈ 5.8k posts/s (spikes to 150k/s), 10M users online, posts visible within 5 s.</div>
      <div class="row">
        <button class="btn on" data-k="a1">Approach 1 · poll a join query</button>
        <button class="btn" data-k="a2">Approach 2 · materialize timelines</button>
        <button class="btn" data-k="sp">⚡ Simulate post spike</button>
      </div>
      <label>Average follows / followers per user: <b data-k="fv"></b></label>
      <input type="range" min="10" max="1000" value="200" data-k="f">
      <svg viewBox="0 0 600 120" role="img" aria-label="Bars comparing write work and read work per second (log scale)"></svg>
      <p class="muted" style="margin:0;font-size:.78rem">Bar length is log-scaled.</p>
      <p class="readout" data-k="msg"></p>
      <label>One celebrity with this many followers posts: <b data-k="cv"></b></label>
      <input type="range" min="3" max="8.2" step="0.1" value="7.5" data-k="c">
      <p class="readout" data-k="cmsg"></p>`;
    let mode = 1, spike = false;
    const f = $('[data-k="f"]', root), c = $('[data-k="c"]', root), svg = $("svg", root);
    const draw = () => {
      const F = Number(f.value), C = Math.round(Math.pow(10, Number(c.value)));
      const posts = spike ? SPIKE : POSTS;
      $('[data-k="fv"]', root).textContent = F;
      $('[data-k="cv"]', root).textContent = fmt(C);
      const writeOps = mode === 1 ? posts : posts * F;
      const readOps = mode === 1 ? POLLS * F : 0;
      const bar = (y, val, color, label, sub) => {
        const w = val <= 0 ? 4 : Math.max(4, (Math.log10(val) / 9) * 330);
        svg.appendChild(svgEl("rect", { x: 0, y, width: w, height: 30, rx: 5, fill: color }));
        const t = svgEl("text", { x: w + 8, y: y + 14, "font-size": 13, "font-weight": 700 }); t.textContent = label; svg.appendChild(t);
        const s = svgEl("text", { x: w + 8, y: y + 28, "font-size": 11, class: "muted-t" }); s.textContent = sub; svg.appendChild(s);
      };
      svg.innerHTML = "";
      bar(10, writeOps, css("--sca"), fmt(writeOps) + " writes/s",
        mode === 1 ? "insert each post once" : `${fmt(posts)} posts × ${F} followers (can be queued)`);
      bar(64, readOps, mode === 1 ? css("--bad") : css("--good"),
        mode === 1 ? fmt(readOps) + " lookups/s" : "≈ 0 extra work",
        mode === 1 ? `2M polls/s × ${F} followed accounts, then merge + sort` : "timeline served from cache; new posts pushed");
      $('[data-k="msg"]', root).innerHTML = mode === 1
        ? `Writes are trivial, but every poll re-runs an expensive join: <b>${fmt(readOps)}</b> lookups/s — and that's the average user.`
        : spike
          ? `Spike: <b>${fmt(writeOps)}</b> timeline writes/s. Don't deliver instantly — <i>enqueue</i> them and accept a short delay. Reads stay fast because they hit the cache.`
          : `Writes multiply by follower count (<b>${fmt(writeOps)}</b>/s), but that's far less than the polling cost, and reads become cheap. This is <i>materialization</i>.`;
      $('[data-k="cmsg"]', root).innerHTML = mode === 1
        ? "Approach 1: the celebrity's post is stored once; followers find it when they query."
        : `Approach 2: one post → <b>${fmt(C)} timeline writes</b>. Fix from the book: store celebrity posts separately and <i>merge them in at read time</i>. ` +
          `(The opposite extreme — someone following huge numbers of busy accounts — can just get a <i>sample</i>; dropping some of their writes is OK.)`;
      $('[data-k="a1"]', root).classList.toggle("on", mode === 1);
      $('[data-k="a2"]', root).classList.toggle("on", mode === 2);
      $('[data-k="sp"]', root).classList.toggle("on", spike);
    };
    $('[data-k="a1"]', root).addEventListener("click", () => { mode = 1; draw(); });
    $('[data-k="a2"]', root).addEventListener("click", () => { mode = 2; draw(); });
    $('[data-k="sp"]', root).addEventListener("click", () => { spike = !spike; draw(); });
    f.addEventListener("input", draw); c.addEventListener("input", draw);
    draw();
  }

  /* ---------------- Queueing: throughput vs response time (book Fig. 2-3 idea) ----------------
   * Simple single-server queue model (M/M/1): R = S / (1 − utilisation). Illustration only. */
  function queueing(root) {
    const S = 50; // ms service time
    root.innerHTML = `
      <div class="w-title">Why response time explodes near capacity</div>
      <div class="w-sub">Service time is fixed at ${S} ms. Only the load changes. (Toy single-queue model — the shape is what matters.)</div>
      <svg viewBox="0 0 600 200" role="img" aria-label="Curve of response time rising sharply as throughput approaches capacity"></svg>
      <label>Throughput, as % of max capacity: <b data-k="uv"></b></label>
      <input type="range" min="0" max="98" value="50" data-k="u">
      <p class="readout" data-k="msg"></p>`;
    const u = $('[data-k="u"]', root), svg = $("svg", root);
    const W = 600, H = 170, maxR = 2000;
    const R = (x) => S / (1 - x);
    const X = (x) => 40 + x * (W - 60), Y = (r) => H - Math.min(r, maxR) / maxR * (H - 10);
    const draw = () => {
      const x = Number(u.value) / 100, r = R(x);
      svg.innerHTML = "";
      svg.appendChild(svgEl("line", { x1: 40, x2: W - 20, y1: H, y2: H, stroke: css("--rule") }));
      svg.appendChild(svgEl("line", { x1: 40, x2: 40, y1: 5, y2: H, stroke: css("--rule") }));
      let d = "";
      for (let i = 0; i <= 98; i++) { const xi = i / 100; d += (i ? "L" : "M") + X(xi).toFixed(1) + " " + Y(R(xi)).toFixed(1); }
      svg.appendChild(svgEl("path", { d, fill: "none", stroke: css("--sca"), "stroke-width": 2.5 }));
      svg.appendChild(svgEl("line", { x1: X(1), x2: X(1), y1: 5, y2: H, stroke: css("--bad"), "stroke-dasharray": "4 4" }));
      const cap = svgEl("text", { x: X(1) - 4, y: 18, "text-anchor": "end", "font-size": 11, fill: css("--bad") }); cap.textContent = "max capacity"; svg.appendChild(cap);
      svg.appendChild(svgEl("circle", { cx: X(x), cy: Y(r), r: 7, fill: css("--accent") }));
      const lx = svgEl("text", { x: W / 2, y: H + 22, "text-anchor": "middle", "font-size": 11, class: "muted-t" }); lx.textContent = "throughput →"; svg.appendChild(lx);
      const ly = svgEl("text", { x: 34, y: 14, "text-anchor": "end", "font-size": 11, class: "muted-t" }); ly.textContent = "time"; svg.appendChild(ly);
      $('[data-k="uv"]', root).textContent = Math.round(x * 100) + "%";
      const ms = r >= 1000 ? (r / 1000).toFixed(1) + " s" : Math.round(r) + " ms";
      $('[data-k="msg"]', root).innerHTML = `Response time ≈ <b>${ms}</b> (of which ${S} ms is real work, the rest is <i>queueing</i>). ` +
        (x < 0.7 ? "Plenty of headroom." : x < 0.9 ? "Getting steep — small load increases now hurt a lot."
          : "Danger zone: clients time out and retry, adding more load → <b>retry storm</b> → possible <b>metastable failure</b>.");
    };
    u.addEventListener("input", draw);
    draw();
  }

  /* ---------------- Provisioning: self-host for peak vs pay-per-use cloud (Ch.1) ----------------
   * Toy cost model, not real prices. Self-hosted cost ∝ peak capacity × 24h.
   * Cloud cost ∝ capacity actually used × price premium. */
  function provisioning(root) {
    root.innerHTML = `
      <div class="w-title">Cloud or self-host? It depends on how spiky your load is</div>
      <div class="w-sub">Toy model (made-up prices). Self-hosted machines must be sized for the peak; cloud bills only what you use, at a higher unit price.</div>
      <svg viewBox="0 0 600 170" role="img" aria-label="24-hour load curve with a peak-capacity line; shaded area is idle capacity"></svg>
      <label>How spiky is the load? Peak ÷ average: <b data-k="pv"></b></label>
      <input type="range" min="1" max="6" step="0.1" value="1.5" data-k="p">
      <label>Cloud price premium per unit of compute: <b data-k="mv"></b></label>
      <input type="range" min="1" max="4" step="0.1" value="2" data-k="m">
      <div class="row" style="margin-top:.6em">
        <span class="stat">self-hosted cost<b data-k="sh"></b></span>
        <span class="stat">cloud cost<b data-k="cl"></b></span>
        <span class="stat">idle capacity<b data-k="idle"></b></span>
      </div>
      <p class="readout" data-k="msg"></p>`;
    const p = $('[data-k="p"]', root), m = $('[data-k="m"]', root), svg = $("svg", root);
    const W = 600, H = 150;
    // 24 hourly samples: flat base plus one busy bump around 14:00
    const shape = Array.from({ length: 24 }, (_, h) => Math.exp(-Math.pow((h - 14) / 2.2, 2)));
    const meanS = shape.reduce((a, b) => a + b, 0) / 24, maxS = Math.max(...shape);
    const draw = () => {
      const peakRatio = Number(p.value), prem = Number(m.value);
      // load = a + b·shape, scaled so mean = 1 and max = peakRatio
      const b = (peakRatio - 1) / (maxS - meanS), a = 1 - b * meanS;
      const load = shape.map((s) => a + b * s);
      const peak = Math.max(...load);
      const selfCost = peak * 24, cloudCost = load.reduce((x, y) => x + y, 0) * prem;
      const yMax = 6.5, X = (h) => 20 + h * ((W - 40) / 23), Y = (v) => H - (v / yMax) * (H - 10);
      svg.innerHTML = "";
      let area = `M${X(0)} ${Y(peak)}`;
      load.forEach((v, h) => (area += ` L${X(h)} ${Y(v)}`));
      area += ` L${X(23)} ${Y(peak)} Z`;
      svg.appendChild(svgEl("path", { d: area, fill: css("--bad"), opacity: 0.15 }));
      let line = "";
      load.forEach((v, h) => (line += (h ? " L" : "M") + X(h) + " " + Y(v)));
      svg.appendChild(svgEl("path", { d: line, fill: "none", stroke: css("--rel"), "stroke-width": 2.5 }));
      svg.appendChild(svgEl("line", { x1: X(0), x2: X(23), y1: Y(peak), y2: Y(peak), stroke: css("--bad"), "stroke-dasharray": "5 4" }));
      const t = svgEl("text", { x: X(0), y: Y(peak) - 5, "font-size": 11, fill: css("--bad") }); t.textContent = "machines you must own (sized for peak)"; svg.appendChild(t);
      svg.appendChild(svgEl("line", { x1: X(0), x2: X(23), y1: H, y2: H, stroke: css("--rule") }));
      const lx = svgEl("text", { x: W / 2, y: H + 16, "text-anchor": "middle", "font-size": 11, class: "muted-t" }); lx.textContent = "24 hours →"; svg.appendChild(lx);
      $('[data-k="pv"]', root).textContent = peakRatio.toFixed(1) + "×";
      $('[data-k="mv"]', root).textContent = prem.toFixed(1) + "×";
      $('[data-k="sh"]', root).textContent = Math.round(selfCost);
      $('[data-k="cl"]', root).textContent = Math.round(cloudCost);
      $('[data-k="idle"]', root).textContent = Math.round((1 - 24 / selfCost) * 100) + "%";
      $('[data-k="msg"]', root).innerHTML = selfCost <= cloudCost
        ? "<b>Self-hosting wins</b>: load is predictable, so the machines you buy are mostly busy. (Assumes you already have the skills to run it.)"
        : "<b>Cloud wins</b>: you'd pay for lots of idle machines just to survive the peak. Elastic, pay-per-use capacity is worth the premium.";
    };
    p.addEventListener("input", draw); m.addEventListener("input", draw);
    draw();
  }

  const WIDGETS = { percentiles, "tail-amplification": tailAmplification, fanout, queueing, provisioning };

  document.addEventListener("DOMContentLoaded", () => {
    initQuizzes();
    document.querySelectorAll("[data-widget]").forEach((el) => {
      const fn = WIDGETS[el.dataset.widget];
      if (fn) fn(el);
    });
    // redraw widgets on theme change so SVG colors follow
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () =>
      document.querySelectorAll("[data-widget]").forEach((el) => WIDGETS[el.dataset.widget]?.(el)));
  });
})();
