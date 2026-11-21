// Rebuilds catalog.json from JustWatch (India, your five apps) using the same engine as Vesper for Mac.
// Runs on GitHub as a relay of bots (see .github/workflows/refresh.yml); also locally: node tools/build-catalog.mjs
//
// JustWatch blocks a machine's address for 25+ minutes after ~75 quick requests; a full build needs ~400.
// So the build is RESUMABLE: every JustWatch answer is saved to JW_CACHE. When JustWatch blocks this machine, it stops
// and keeps the cache; the next bot (new machine, new address) replays the saved answers instantly and only asks for
// what's missing. When a build completes, catalog.json is written and the cache removed.
// Exit codes: 0 = catalog written (or already fresh), 3 = partial (progress saved, hand on), 1 = real error.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import crypto from "node:crypto";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const file = path.join(root, "catalog.json");
const CACHE = process.env.JW_CACHE || "";
const PACE = +(process.env.JW_PACE_MS || 350);
const FRESH_H = +process.env.SKIP_IF_FRESH_HOURS || 0;
const TEST_BLOCK = +process.env.JW_TEST_BLOCK_AFTER || 0;   // testing: pretend JustWatch blocks after N requests

let prev = {}; try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
if (FRESH_H && prev.generated && Date.now() - Date.parse(prev.generated) < FRESH_H * 3600e3) {
  console.log("catalog is fresh (" + prev.generated + ") — skipping"); process.exit(0);
}

// ---- saved answers from earlier bots of this build (thrown away when older than 20 h) ----
let saved = { started: Date.now(), answers: {} };
if (CACHE) try {
  const s = JSON.parse(zlib.gunzipSync(fs.readFileSync(CACHE)).toString());
  if (Date.now() - s.started < 20 * 3600e3) saved = s; else console.log("old saved answers — starting a new build");
} catch {}
console.log(`starting with ${Object.keys(saved.answers).length} saved answers`);
function persist() {
  if (!CACHE) return;
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, zlib.gzipSync(JSON.stringify(saved)));
}

// ---- fetch: replay saved answers, pace new ones, stop cleanly when JustWatch blocks us ----
let lastAt = 0, calls = 0, replayed = 0, blocked = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const keyOf = (url, body) => crypto.createHash("sha1").update(url + "\n" + (body || "")).digest("hex");
const ctx = { console, setTimeout, clearTimeout, Promise, Date, Math, JSON, URL, encodeURIComponent, decodeURIComponent };
ctx.globalThis = ctx;
ctx.vesperFetch = async (url, opt = {}) => {
  const k = keyOf(url, opt.body);
  if (saved.answers[k]) { replayed++; return saved.answers[k]; }
  if (blocked) throw new Error("blocked — next bot continues");
  for (let i = 0; ; i++) {
    const wait = lastAt + PACE - Date.now(); if (wait > 0) await sleep(wait);
    lastAt = Date.now(); calls++;
    let r;
    try {
      r = await fetch(url, { method: opt.method || "GET", body: opt.body, signal: AbortSignal.timeout(45000),
        headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15" } });
    } catch (e) { if (i >= 3) throw e; await sleep(5000 * (i + 1)); continue; }
    if (TEST_BLOCK && calls > TEST_BLOCK) r = { status: 429, ok: false };
    if (r.ok) {
      const j = await r.json();
      if (!j.errors) { saved.answers[k] = j; if (calls % 25 === 0) persist(); }
      return j;
    }
    if (r.status === 429) {
      if (TEST_BLOCK) i = 1;
      if (i === 0) { await sleep(20000); continue; }          // one short wait in case it's a blip
      blocked = true; persist();
      console.log(`  JustWatch blocked this machine after ${calls} requests — handing on (${replayed} replayed, ${Object.keys(saved.answers).length} answers saved)`);
      process.exit(3);   // stop right here: nothing more this machine can fetch
    }
    if (r.status >= 500 && i < 3) { await sleep(10000 * (i + 1)); continue; }
    throw new Error("HTTP " + r.status);
  }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "core.js"), "utf8"), ctx);

let last = -1, next;
try {
  next = await ctx.VesperCore.build({ prev, onProgress: (p, l) => { const pc = Math.round(p * 100); if (pc >= last + 5) { last = pc; console.log(pc + "% " + l); } } });
} catch (e) {
  if (!blocked) { persist(); console.error(e); process.exit(1); }
}
persist();
if (blocked) {   // the engine swallows some errors (skips a section) — a blocked build is never published
  console.log(`partial: ${calls} new requests, ${replayed} replayed, ${Object.keys(saved.answers).length} answers saved`);
  process.exit(3);
}
if (!next || !next.titles || next.titles.length < 500) { console.error("catalog too small:", ((next && next.titles) || []).length); process.exit(1); }
fs.writeFileSync(file, JSON.stringify(next));
if (CACHE) try { fs.unlinkSync(CACHE); } catch {}
console.log("built", next.titles.length, "titles —", calls, "new requests,", replayed, "replayed from earlier bots");
