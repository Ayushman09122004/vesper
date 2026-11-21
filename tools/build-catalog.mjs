// Rebuilds the catalog from JustWatch (India, your five apps) using the same engine as Vesper for Mac.
// Runs on GitHub as a relay of bots (see .github/workflows/refresh.yml and tools/jwrelay.mjs); also locally:
//   node tools/build-catalog.mjs
// Writes two files:
//   catalog.json       — every title the rows use (lists, new arrivals, coming soon, weather moods…): what the apps load first
//   catalog-more.json  — EVERYTHING ELSE on your apps (lighter: no long cast lists), loaded in the background so search and
//                        sections can find any title on your apps, not only the ones in a list
// Exit codes: 0 = written (or already fresh), 3 = partial (progress saved, next bot continues), 1 = real error.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { relay } from "./jwrelay.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const file = path.join(root, "catalog.json"), moreFile = path.join(root, "catalog-more.json");
const FRESH_H = +process.env.SKIP_IF_FRESH_HOURS || 0;

let prev = {}; try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
if (FRESH_H && prev.generated && Date.now() - Date.parse(prev.generated) < FRESH_H * 3600e3) {
  console.log("catalog is fresh (" + prev.generated + ") — skipping"); process.exit(0);
}
// the engine carries over yesterday's titles — the extras are fetched fresh every day anyway, so only the main file is needed

const R = relay();
const ctx = { console, setTimeout, clearTimeout, Promise, Date, Math, JSON, URL, encodeURIComponent, decodeURIComponent, isNaN, String };
ctx.globalThis = ctx;
ctx.vesperFetch = R.fetch;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "core.js"), "utf8"), ctx);

let last = -1, next;
try {
  next = await ctx.VesperCore.build({ prev, onProgress: (p, l) => { const pc = Math.round(p * 100); if (pc >= last + 5) { last = pc; console.log(pc + "% " + l); } } });
} catch (e) { R.persist(); console.error(e); process.exit(1); }
R.persist();
if (!next || !next.titles || next.titles.length < 500) { console.error("catalog too small:", ((next && next.titles) || []).length); process.exit(1); }

// ---- split: what the rows use → catalog.json, the rest → catalog-more.json ----
const used = new Set();
const addIds = (a) => (a || []).forEach((x) => used.add(typeof x === "string" ? x : x && x.id));
Object.values(next.segs || {}).forEach((s) => addIds(s.ids));
addIds(next.arrivals); addIds(next.soon);
Object.values(next.wx || {}).forEach((v) => addIds(Array.isArray(v) ? v : v && v.ids));
Object.values(next.top10 || {}).forEach(addIds);
const main = [], more = [];
next.titles.forEach((t) => (used.has(t.id) ? main : more).push(t));
// extras are ~2/3 of everything on your apps, so they're split for phones:
//   catalog-more.json            a compact search index (columns, numbers for images) — loaded in the background
//   catalog-more/dNN.json        details (description, cast, play links…) in 16 shards — fetched only when a title is opened
const IDX_F = ["id", "type", "title", "otitle", "year", "imdb", "votes", "pop", "rank", "genres", "countries", "runtime", "cert", "seasons", "eps", "avail", "po", "bd", "orig", "added"];
const SHARDS = 16;
const shardOf = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % SHARDS; };
const imgNo = (p) => { const m = /\/(\d+)\//.exec(p || ""); return m ? +m[1] : 0; };
const recent = Date.now() - 14 * 864e5;
const rows = [], shards = Array.from({ length: SHARDS }, () => ({}));
for (const t of more) {
  rows.push([t.id, t.type === "SHOW" ? "S" : "M", t.title, t.otitle || 0, t.year || 0, t.imdb || 0, t.votes || 0, t.pop || 0, t.rank || 0,
    (t.genres || []).join(","), (t.countries || []).join(","), t.runtime || 0, t.cert || 0, t.seasons || 0, t.eps || 0, (t.avail || []).join(","),
    imgNo(t.poster), imgNo(t.backdrop), t.orig || 0, t.added && Date.parse(t.added) >= recent ? t.added : 0]);
  const d = {};
  if (t.desc) d.desc = t.desc.length > 330 ? t.desc.slice(0, 320).replace(/\s+\S*$/, "") + "…" : t.desc;
  if (t.cast && t.cast.length) d.cast = t.cast.slice(0, 4);
  if (t.dirs && t.dirs.length) d.dirs = t.dirs.slice(0, 2);
  if (t.imdb_id && t.type === "SHOW") d.imdb_id = t.imdb_id;
  if (t.links) { const l = {}; for (const [app, x] of Object.entries(t.links)) l[app] = (app === "netflix" || app === "amazon") && x.id ? { id: x.id } : x.url ? { url: x.url } : x; d.links = l; }
  shards[shardOf(t.id)][t.id] = d;
}
fs.writeFileSync(file, JSON.stringify(Object.assign({}, next, { titles: main, more: { n: rows.length, file: "catalog-more.json", shards: SHARDS } })));
fs.writeFileSync(moreFile, JSON.stringify({ v: 2, generated: next.generated, f: IDX_F, shards: SHARDS, r: rows }));
fs.mkdirSync(path.join(root, "catalog-more"), { recursive: true });
shards.forEach((d, i) => fs.writeFileSync(path.join(root, "catalog-more", "d" + String(i).padStart(2, "0") + ".json"), JSON.stringify({ generated: next.generated, d })));
const slim = rows;
R.done();
console.log(`built ${next.titles.length} titles (${main.length} in rows + ${slim.length} more) — ${R.stats.calls} new requests, ${R.stats.replayed} replayed from earlier bots`);
