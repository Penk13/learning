/* Learning site Worker: serves dist/ as static assets and accepts quiz answers.
 *
 * POST /api/answers  { attempts: [...] }  with header  Authorization: Bearer <SYNC_TOKEN>
 * Inserts into D1 (binding DB). Nothing is readable over HTTP; read with
 * `wrangler d1 execute learning --remote` instead. */

const MAX_BATCH = 50;
const LIMITS = { client_id: 64, course: 100, lesson: 200, qid: 100, question: 4000, answer: 10000 };
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const sha256 = async (text) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));

// Hash both sides first so timingSafeEqual always gets equal-length input.
async function authorized(request, env) {
  if (!env.SYNC_TOKEN) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  return crypto.subtle.timingSafeEqual(await sha256(token), await sha256(env.SYNC_TOKEN));
}

const str = (value, key) => typeof value === "string" && value.length > 0 && value.length <= LIMITS[key];

function validAttempt(a) {
  return a && typeof a === "object"
    && ["client_id", "course", "lesson", "qid", "question", "answer"].every((key) => str(a[key], key))
    && (a.kind === "mcq" || a.kind === "text")
    && (a.kind === "mcq" ? typeof a.correct === "boolean" : a.correct === null)
    && typeof a.answered_at === "string" && ISO_RE.test(a.answered_at);
}

async function saveAnswers(request, env) {
  if (!(await authorized(request, env))) return json({ error: "unauthorized" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  const attempts = body && body.attempts;
  if (!Array.isArray(attempts) || attempts.length === 0 || attempts.length > MAX_BATCH) {
    return json({ error: `attempts must be an array of 1-${MAX_BATCH}` }, 400);
  }
  if (!attempts.every(validAttempt)) return json({ error: "invalid attempt" }, 400);

  // INSERT OR IGNORE on client_id: a batch re-sent after a lost response is a no-op.
  const insert = env.DB.prepare(
    `INSERT OR IGNORE INTO attempts (client_id, course, lesson, qid, kind, question, answer, correct, answered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  await env.DB.batch(attempts.map((a) => insert.bind(
    a.client_id, a.course, a.lesson, a.qid, a.kind, a.question, a.answer,
    a.correct === null ? null : Number(a.correct), a.answered_at)));

  return json({ saved: attempts.map((a) => a.client_id) });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/answers") {
      if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
      try {
        return await saveAnswers(request, env);
      } catch (err) {
        console.error("saveAnswers failed", err);
        return json({ error: "server error" }, 500);
      }
    }
    if (pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(request);
  },
};
