// Shared by the bots (build-catalog.mjs, netflix-world.mjs): JustWatch requests that survive JustWatch blocking
// GitHub machines. JustWatch blocks one machine's address after ~100 quick requests, so every answer is saved to a
// cache file; when JustWatch blocks this machine the bot saves and exits with code 3, and the next bot (new machine,
// new address) replays the saved answers instantly and carries on. Exit codes: 0 done, 3 partial (hand on), 1 error.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function relay({ cache = process.env.JW_CACHE || "", pace = +(process.env.JW_PACE_MS || 350), maxAgeH = 20 } = {}) {
  const testBlock = +process.env.JW_TEST_BLOCK_AFTER || 0;   // testing: pretend JustWatch blocks after N requests
  let saved = { started: Date.now(), answers: {} };
  if (cache) try {
    const s = JSON.parse(zlib.gunzipSync(fs.readFileSync(cache)).toString());
    if (Date.now() - s.started < maxAgeH * 3600e3) saved = s; else console.log("old saved answers — starting fresh");
  } catch {}
  console.log(`starting with ${Object.keys(saved.answers).length} saved answers`);
  const st = { calls: 0, replayed: 0 };
  let lastAt = 0;
  function persist() {
    if (!cache) return;
    fs.mkdirSync(path.dirname(cache), { recursive: true });
    fs.writeFileSync(cache, zlib.gzipSync(JSON.stringify(saved)));
  }
  const keyOf = (url, body) => crypto.createHash("sha1").update(url + "\n" + (body || "")).digest("hex");

  async function fetchJSON(url, opt = {}) {
    const k = keyOf(url, opt.body);
    if (saved.answers[k]) { st.replayed++; return saved.answers[k]; }
    for (let i = 0; ; i++) {
      const wait = lastAt + pace - Date.now(); if (wait > 0) await sleep(wait);
      lastAt = Date.now(); st.calls++;
      let r;
      try {
        r = await fetch(url, { method: opt.method || "GET", body: opt.body, signal: AbortSignal.timeout(60000),
          headers: { "content-type": "application/json", "user-agent": UA } });
      } catch (e) { if (i >= 3) throw e; await sleep(5000 * (i + 1)); continue; }
      if (testBlock && st.calls > testBlock) r = { status: 429, ok: false };
      if (r.ok) {
        const j = await r.json();
        if (!j.errors) { saved.answers[k] = j; if (st.calls % 20 === 0) persist(); }
        return j;
      }
      if (r.status === 429) {
        if (i === 0 && !testBlock) { await sleep(20000); continue; }   // one short wait in case it's a blip
        persist();
        console.log(`  JustWatch blocked this machine after ${st.calls} requests — handing on (${st.replayed} replayed, ${Object.keys(saved.answers).length} answers saved)`);
        process.exit(3);   // nothing more this machine can fetch
      }
      if (r.status >= 500 && i < 3) { await sleep(10000 * (i + 1)); continue; }
      throw new Error("HTTP " + r.status);
    }
  }
  return {
    fetch: fetchJSON,
    stats: st,
    persist,
    done() { if (cache) try { fs.unlinkSync(cache); } catch {} },   // build finished: next build starts clean
  };
}
