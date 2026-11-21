// Netflix around the world: which of 48 countries has each title on Netflix — built daily by the bots
// (.github/workflows/netflix-world.yml, relay like the catalog: tools/jwrelay.mjs) and published as netflix-world.json.
// The web app downloads it only when "Netflix worldwide" is switched on in Search.
//
// File: { v, generated, cc: ["IN","US",…], t: [[id, title, year, "M"|"S", posterPath, mask], …] }
//   mask = base-36 bitmask over cc (bit i set → on Netflix in cc[i]). A country that fails today keeps yesterday's bits.
// Exit codes: 0 = written (or already fresh), 3 = partial (next bot continues), 1 = error.
import fs from "node:fs";
import path from "node:path";
import { relay } from "./jwrelay.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const file = path.join(root, "netflix-world.json");
const FRESH_H = +process.env.SKIP_IF_FRESH_HOURS || 0;
// India first (home), then the rest; order = bit order, append only (never reorder: masks depend on it)
const CC = "IN US GB CA AU NZ IE JP KR TW HK SG MY TH PH ID FR DE ES IT NL BE CH AT PT SE NO DK FI PL CZ HU RO GR TR IL AE SA EG ZA NG KE BR MX AR CO CL PE".split(" ");
const PER_REQ = 15;                 // pages of 100 per request
const ENDPOINT = "https://apis.justwatch.com/graphql";

let prev = null; try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
if (FRESH_H && prev && Date.now() - Date.parse(prev.generated) < FRESH_H * 3600e3) { console.log("netflix-world is fresh (" + prev.generated + ") — skipping"); process.exit(0); }

const R = relay();
async function gql(query) {
  const j = await R.fetch(ENDPOINT, { method: "POST", body: JSON.stringify({ query }) });
  if (j.errors) throw new Error(j.errors[0].message);
  return j.data;
}
const b64 = (s) => Buffer.from(String(s)).toString("base64");
const year = new Date().getFullYear();
const filt = (s) => `{packages:["nfx"],monetizationTypes:[FLATRATE],objectTypes:[${s[0]}],releaseYear:{min:${s[1]},max:${s[2]}}}`;

const T = new Map();          // id → [title, year, type, poster]
const got = {};               // cc → Set(ids)
for (const cc of CC) {
  try {
    // slice films/series by release year until every slice fits under JustWatch's ~2,000 paging limit
    let queue = [["MOVIE", 1900, year + 1], ["SHOW", 1900, year + 1]], fit = [];
    while (queue.length) {
      const b = queue.splice(0, 20);
      const d = await gql("{" + b.map((s, i) => `c${i}:popularTitles(country:${cc},first:1,filter:${filt(s)}){totalCount}`).join(" ") + "}");
      b.forEach((s, i) => { const n = d["c" + i].totalCount;
        if (n <= 1900 || s[1] === s[2]) { if (n) fit.push([s, n]); }
        else { const m = Math.floor((s[1] + s[2]) / 2); queue.push([s[0], s[1], m], [s[0], m + 1, s[2]]); } });
    }
    const pages = []; fit.forEach(([s, n]) => { for (let o = 0; o < Math.min(n, 2000); o += 100) pages.push([s, o]); });
    const ids = new Set();
    for (let p = 0; p < pages.length; p += PER_REQ) {
      const grp = pages.slice(p, p + PER_REQ);
      const d = await gql("{" + grp.map(([s, o], i) => `p${i}:popularTitles(country:${cc},first:100${o ? `,after:"${b64(o)}"` : ""},sortBy:POPULAR,filter:${filt(s)}){edges{node{id objectType content(country:US,language:"en"){title originalReleaseYear posterUrl}}}}`).join(" ") + "}");
      grp.forEach((g, i) => ((d["p" + i] || {}).edges || []).forEach(({ node: n }) => {
        if (!n || !n.content || !n.content.title) return;
        ids.add(n.id);
        if (!T.has(n.id)) T.set(n.id, [n.content.title, n.content.originalReleaseYear || 0, n.objectType === "SHOW" ? "S" : "M", (n.content.posterUrl || "").replace("/poster/", "").replace("/{profile}/", "/").replace(".{format}", "")]);
      }));
    }
    if (ids.size > 500) got[cc] = ids; else console.log(`  ${cc}: only ${ids.size} titles — keeping yesterday's`);
    console.log(`${cc}: ${ids.size}`);
  } catch (e) { console.log(`  ${cc} failed (${e.message}) — keeping yesterday's`); }
}
R.persist();

// yesterday's data for countries that failed today
const prevBits = new Map();
if (prev) {
  const pcc = prev.cc || [];
  prev.t.forEach(([id, title, y, ty, po, mask]) => {
    const m = BigInt(parseInt(mask, 36));   // 48 bits: exact in a JS number
    pcc.forEach((c, i) => { if (!got[c] && (m >> BigInt(i)) & 1n) { if (!prevBits.has(id)) prevBits.set(id, new Set()); prevBits.get(id).add(c); } });
    if (!T.has(id)) T.set(id, [title, y, ty, po]);
  });
}
if (Object.keys(got).length < CC.length / 2) { console.error("too many countries failed:", Object.keys(got).length); process.exit(1); }

const out = [];
for (const [id, [title, y, ty, po]] of T) {
  let mask = 0n;
  CC.forEach((c, i) => { if ((got[c] && got[c].has(id)) || (!got[c] && prevBits.get(id)?.has(c))) mask |= 1n << BigInt(i); });
  if (mask) out.push([id, title, y, ty, po, mask.toString(36)]);
}
fs.writeFileSync(file, JSON.stringify({ v: 1, generated: new Date().toISOString(), cc: CC, t: out }));
R.done();
console.log(`netflix-world: ${out.length} titles across ${Object.keys(got).length}/${CC.length} countries — ${R.stats.calls} new requests, ${R.stats.replayed} replayed`);
