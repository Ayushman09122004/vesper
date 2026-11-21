// Rebuilds catalog.json from JustWatch (India, your five apps) using the same engine as Vesper for Mac.
// Runs every morning on GitHub (see .github/workflows/refresh.yml); can also run locally: node tools/build-catalog.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ctx = { console, setTimeout, clearTimeout, Promise, Date, Math, JSON, URL, encodeURIComponent, decodeURIComponent };
ctx.globalThis = ctx;
// JustWatch rate-limits busy IPs (GitHub runners especially): keep a steady pace and, on 429/5xx,
// wait it out (Retry-After or growing pauses) instead of failing the whole build.
let lastAt = 0, gap = 350, calls = 0, waits = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
ctx.vesperFetch = async (url, opt = {}) => {
  for (let i = 0; ; i++) {
    const wait = lastAt + gap - Date.now(); if (wait > 0) await sleep(wait);
    lastAt = Date.now(); calls++;
    let r;
    try {
      r = await fetch(url, { method: opt.method || "GET", body: opt.body, signal: AbortSignal.timeout(45000),
        headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15" } });
    } catch (e) { if (i >= 6) throw e; await sleep(5000 * (i + 1)); continue; }
    if (r.ok) { if (gap > 350) gap = Math.max(350, gap - 25); return r.json(); }
    if ((r.status === 429 || r.status >= 500) && i < 8) {
      const ra = +r.headers.get("retry-after");
      const ms = ra > 0 ? Math.min(ra * 1000, 180000) : Math.min(180000, 15000 * 2 ** Math.min(i, 3));
      gap = Math.min(3000, gap * 2); waits++;
      console.log(`  HTTP ${r.status} — waiting ${Math.round(ms / 1000)}s (try ${i + 1}), pace now ${gap}ms`);
      await sleep(ms); continue;
    }
    throw new Error("HTTP " + r.status);
  }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "core.js"), "utf8"), ctx);
const file = path.join(root, "catalog.json");
let prev = {}; try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
// backup mode (GitHub robot): the Mac already published a fresh catalog today → nothing to do
const fresh = +process.env.SKIP_IF_FRESH_HOURS;
if (fresh && prev.generated && Date.now() - Date.parse(prev.generated) < fresh * 3600e3) { console.log("catalog is fresh (" + prev.generated + ") — skipping"); process.exit(0); }
let last = -1;
const next = await ctx.VesperCore.build({ prev, onProgress: (p, l) => { const pc = Math.round(p * 100); if (pc >= last + 5) { last = pc; console.log(pc + "% " + l); } } });
if (!next.titles || next.titles.length < 500) { console.error("catalog too small:", (next.titles || []).length); process.exit(1); }
fs.writeFileSync(file, JSON.stringify(next));
console.log("built", next.titles.length, "titles in", calls, "requests,", waits, "rate-limit waits");
