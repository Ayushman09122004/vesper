// KissKH index for Vesper's "KissKH" server. The phone can't read KissKH's API (no CORS), so this bot does it daily
// and publishes two small things with the site:
//   kisskh/index.json   { generated, t: [[id, title, year, type, country, eps]] }   type: M movie, S series, H hollywood…
//   kisskh/eNN.json     NN = id % 64 → { "<id>": { th: thumbnail, e: [[number, episodeId], …] } }
// Incremental: yesterday's files (from the live site) are reused; only new titles, or titles whose episode count
// changed, are asked for again. Polite: one request at a time (KissKH answers 429 to parallel ones), slowing down
// whenever it says "too many", and a time budget per run (the rest continues next run).
//   node tools/kisskh.mjs [outDir=kisskh] [budgetMinutes=320]
import fs from "node:fs";
import path from "node:path";

const OUT = process.argv[2] || "kisskh";
const BUDGET = (+process.argv[3] || 320) * 60000;
let PACE = 250;   // ms between requests; grows on 429, shrinks slowly when things go well
const API = "https://kisskh.is/api/DramaList";
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36", Accept: "application/json" };
const SH = 64, t0 = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { PACE = Math.min(5000, PACE * 2); await sleep(PACE * 4); continue; }
      if (r.status >= 500) throw new Error("HTTP " + r.status);
      PACE = Math.max(250, PACE * 0.97);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { await sleep(1500 * (i + 1) ** 2); }
  }
  return null;
}
const yearOf = (title) => { const m = /\((19|20)\d\d\)\s*$/.exec(title || ""); return m ? +m[0].slice(1, 5) : 0; };
const TYPE = { Movie: "M", TVSeries: "S", Hollywood: "H", Anime: "A" };
const CC = { "South Korea": "KR", China: "CN", Japan: "JP", Taiwan: "TW", Thailand: "TH", "Hong Kong": "HK", Philippines: "PH", "United States": "US", Vietnam: "VN", Indonesia: "ID", Malaysia: "MY", Singapore: "SG", India: "IN" };

// ---- yesterday's data ----
let old = { t: [] }; const oldEp = {};
try { old = JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8")); } catch {}
for (let i = 0; i < SH; i++) { try { Object.assign(oldEp, JSON.parse(fs.readFileSync(path.join(OUT, `e${String(i).padStart(2, "0")}.json`), "utf8"))); } catch {} }
const oldRow = new Map(old.t.map((r) => [r[0], r]));
console.log("yesterday:", old.t.length, "titles,", Object.keys(oldEp).length, "with episodes");

// ---- 1. the whole list (newest first) ----
const list = [];
for (let page = 1; ; page++) {
  const j = await get(`${API}/List?page=${page}&type=0&sub=0&country=0&status=0&order=2&pageSize=1000`);
  if (!j || !j.data) { if (page === 1) { console.error("list failed"); process.exit(1); } break; }
  list.push(...j.data); if (!j.data.length || list.length >= j.totalCount) break; await sleep(400);
}
console.log("list:", list.length, "titles");
if (list.length < 5000) { console.error("list too small, keeping yesterday's"); process.exit(1); }

// ---- 2. details for new / changed titles ----
const rows = new Map(), eps = {};
const todo = [];
for (const d of list) {
  const o = oldRow.get(d.id), e = oldEp[d.id];
  if (o && e && o[5] === d.episodesCount && e.e.length) { rows.set(d.id, o); eps[d.id] = e; continue; }
  todo.push(d);
}
console.log("to fetch:", todo.length);
let done = 0, failed = 0, stop = false;
async function worker() {
  while (todo.length && !stop) {
    if (Date.now() - t0 > BUDGET) { stop = true; break; }
    const d = todo.shift();
    const j = await get(`${API}/Drama/${d.id}?isq=false`);
    if (j && Array.isArray(j.episodes)) {
      rows.set(d.id, [d.id, d.title, yearOf(d.title) || 0, TYPE[j.type] || (j.type || "?").slice(0, 1), CC[j.country] || "", d.episodesCount || j.episodes.length]);
      eps[d.id] = { th: j.thumbnail || d.thumbnail || "", e: j.episodes.map((x) => [x.number, x.id]).sort((a, b) => a[0] - b[0]) };
    } else {
      failed++; const o = oldRow.get(d.id); if (o && oldEp[d.id]) { rows.set(d.id, o); eps[d.id] = oldEp[d.id]; }
    }
    if (++done % 500 === 0) console.log(" ", done, "fetched,", failed, "failed,", Math.round((Date.now() - t0) / 1000), "s");
    await sleep(PACE);
  }
}
await worker();
// titles not reached this run keep yesterday's data (if any) so nothing disappears
for (const d of todo) { const o = oldRow.get(d.id); if (o && oldEp[d.id]) { rows.set(d.id, o); eps[d.id] = oldEp[d.id]; } }
console.log("fetched", done, "failed", failed, "left for next run", todo.length);

// ---- 3. write ----
fs.mkdirSync(OUT, { recursive: true });
const order = list.map((d) => d.id).filter((id) => rows.has(id));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ generated: new Date().toISOString(), complete: !todo.length, t: order.map((id) => rows.get(id)) }));
const shards = Array.from({ length: SH }, () => ({}));
for (const id of order) if (eps[id]) shards[id % SH][id] = eps[id];
shards.forEach((s, i) => fs.writeFileSync(path.join(OUT, `e${String(i).padStart(2, "0")}.json`), JSON.stringify(s)));
const size = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
console.log("wrote", order.length, "titles,", Math.round(size / 1024), "KB in", OUT, "—", Math.round((Date.now() - t0) / 1000), "s");
