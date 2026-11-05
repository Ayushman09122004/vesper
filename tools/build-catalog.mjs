// Rebuilds catalog.json from JustWatch (India, your five apps) using the same engine as Vesper for Mac.
// Runs every morning on GitHub (see .github/workflows/refresh.yml); can also run locally: node tools/build-catalog.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ctx = { console, setTimeout, clearTimeout, Promise, Date, Math, JSON, URL, encodeURIComponent, decodeURIComponent };
ctx.globalThis = ctx;
ctx.vesperFetch = async (url, opt = {}) => {
  const r = await fetch(url, { method: opt.method || "GET", body: opt.body,
    headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "core.js"), "utf8"), ctx);
const file = path.join(root, "catalog.json");
let prev = {}; try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
let last = -1;
const next = await ctx.VesperCore.build({ prev, onProgress: (p, l) => { const pc = Math.round(p * 100); if (pc >= last + 5) { last = pc; console.log(pc + "% " + l); } } });
if (!next.titles || next.titles.length < 500) { console.error("catalog too small:", (next.titles || []).length); process.exit(1); }
fs.writeFileSync(file, JSON.stringify(next));
console.log("built", next.titles.length, "titles");
