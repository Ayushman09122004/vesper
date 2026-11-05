// Finds the official trailer (a YouTube video id) for each title in catalog.json → trailers.json.
// Only looks up titles it hasn't checked yet, so the daily run is quick. Usage: node tools/trailers.mjs [max]
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cat = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
const file = path.join(root, "trailers.json");
let T = {}; try { T = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
const max = +process.argv[2] || 4000;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const todo = (cat.titles || []).filter(t => t.backdrop && !(t.id in T)).slice(0, max);
console.log("looking up", todo.length, "of", cat.titles.length);
function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
async function find(t) {
  const q = t.title + (t.type === "MOVIE" && t.year ? " " + t.year : "") + " official trailer";
  const r = await fetch("https://www.youtube.com/results?search_query=" + encodeURIComponent(q) + "&sp=EgIQAQ%253D%253D", { headers: { "user-agent": UA, "accept-language": "en" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const html = await r.text(), re = /"videoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g;
  const words = norm(t.title).split(" ").filter(w => w.length > 1), out = [];
  let m; while ((m = re.exec(html)) && out.length < 5) out.push({ id: m[1], title: norm(JSON.parse('"' + m[2] + '"')) });
  const ok = out.find(v => /trailer|teaser/.test(v.title) && words.filter(w => v.title.includes(w)).length >= Math.ceil(words.length * 0.6));
  return ok ? ok.id : "";
}
let done = 0, hits = 0, fails = 0;
async function worker() {
  while (todo.length) {
    const t = todo.shift();
    let id = null;
    for (let i = 0; i < 3 && id === null; i++) { try { id = await find(t); } catch (e) { await new Promise(r => setTimeout(r, 1500 * (i + 1))); } }
    try { if (id === null) throw new Error("fetch failed"); T[t.id] = id; if (id) hits++; fails = 0; } catch (e) { fails++; if (fails < 4) console.log("err", t.title, e.message); if (fails > 25) { todo.length = 0; console.log("stopping: too many errors"); } }
    if (++done % 100 === 0) { console.log(done, "checked,", hits, "trailers"); fs.writeFileSync(file, JSON.stringify(T)); }
    await new Promise(r => setTimeout(r, 250));
  }
}
await Promise.all([worker(), worker(), worker()]);
fs.writeFileSync(file, JSON.stringify(T));
console.log("done:", done, "checked,", hits, "trailers found,", Object.values(T).filter(Boolean).length, "total");
