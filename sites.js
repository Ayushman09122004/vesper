/* Vesper for iPhone — ShowBox inside Vesper. Reads ShowBox straight from the phone (it allows web pages to), mixes its titles
   into every section, adds a ShowBox switch to Search, and "Play with FebBox" opens the title's FebBox share.
   (A web page can't act on your FebBox account or reach JustWatch's full database — the TV app does those.) */
(function () {
  var S = window.VS, LS = window.localStorage;
  function ld(k, d) { try { var v = JSON.parse(LS.getItem("vesper.sb." + k)); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { LS.setItem("vesper.sb." + k, JSON.stringify(v)); } catch (e) {} }
  var SITE = { name: "ShowBox", url: "https://www.showbox.media/", search: "https://www.showbox.media/search?keyword={q}" };
  var C = ld("cache", {}), HAS = ld("has", {}), ON = !!ld("on", false), IDX = null, saveT = null;
  function saveLater() { clearTimeout(saveT); saveT = setTimeout(function () { sv("cache", C); sv("has", HAS); }, 1500); }
  function norm(s) { return S.norm(s || ""); }
  function slim(c) { return { url: c.url, title: c.title, img: c.img, meta: c.meta || "" }; }

  // ---- titles: the catalog's own title when ShowBox has it, else a ShowBox title with its (sharper) poster ----
  function hi(u) { var m = /thumb_([A-Za-z0-9+\/=_-]+)\.(png|jpg)/.exec(u || ""); if (!m) return u; try { var s = atob(m[1].replace(/-/g, "+").replace(/_/g, "/")); if (!/\|\d+\|\d+$/.test(s)) return u;
      return u.replace(m[1], btoa(s.replace(/\|\d+\|\d+$/, "|800|88")).replace(/=+$/, "")); } catch (e) { return u; } }
  function idx() { if (IDX) return IDX; IDX = {}; (S.ALL || []).forEach(function (t) { var k = norm(t.title); (IDX[k] = IDX[k] || []).push(t); }); return IDX; }
  function yearOf(c) { var y = /\b(19|20)\d\d\b/.exec((c.meta || "") + " " + c.url); return y ? +y[0] : 0; }
  function T(c) {
    var id = "st:" + c.url; if (S.T[id]) return S.T[id];
    var y = yearOf(c), type = /\/tv\/|\/t-/.test(c.url) ? "SHOW" : "MOVIE";
    var cat = (idx()[norm(c.title)] || []).filter(function (x) { return !y || !x.year || Math.abs(x.year - y) <= 1; }).sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); })[0];
    if (cat) { if (!cat.site) cat.site = { url: c.url }; S.T[id] = cat; return cat; }
    var t = { id: id, title: c.title, type: type, year: y, genres: [], avail: [], desc: "", poster: hi(c.img), backdrop: hi(c.img), site: { url: c.url }, sb: 1 };
    S.T[id] = t; return t;
  }

  // ---- ShowBox's front page + main sections, remembered; refreshed every 6 hours in the background ----
  function boot() {
    var h = C.home;
    if (!h || Date.now() - h.at > 6 * 3600000) setTimeout(function () {
      SR.read(SITE.url, "home", function (err, r) { if (err || !r) return;
        C.home = { at: Date.now(), rows: r.rows.map(function (x) { return { title: x.title, items: x.items.map(slim) }; }), nav: r.nav.map(function (n) { return { title: n.title, url: n.url }; }) };
        saveLater(); more(true); });
    }, 4000); else setTimeout(more, 6000);
  }
  function more(force) {
    var h = C.home; if (!h || (!force && C.more && Date.now() - C.more.at < 24 * 3600000)) return;
    var main = (h.nav || []).filter(function (n) { return /^(movies?|tv( shows?)?|top( imdb)?)$/i.test(n.title); }).slice(0, 3), got = [], k = 0;
    (function next() { if (k >= main.length) { if (got.length) { C.more = { at: Date.now(), lists: got }; saveLater(); } return; }
      var n = main[k++]; SR.get(n.url, function (html, code, fin) { if (html) { var l = SR.lite(html, fin).map(slim); if (l.length) got.push({ title: n.title, items: l }); } setTimeout(next, 800); }); })();
  }
  function all(type) { var out = [], seen = {};
    ((C.home && C.home.rows) || []).concat((C.more && C.more.lists) || []).forEach(function (r) { r.items.forEach(function (c) { var t = T(c); if (!seen[t.id] && (!type || t.type === type)) { seen[t.id] = 1; out.push(t); } }); });
    return out; }
  // country pages (Korean, Japanese, Indian…) read once a day when a section asks
  var CCN = { KR: /korea/i, JP: /japan/i, IN: /india/i, CN: /china/i, TH: /thai/i, GB: /united kingdom|britain/i, ES: /spain/i, FR: /france/i, TR: /turk/i };
  var CCL = { KR: "Korean", JP: "Japanese", IN: "Indian", CN: "Chinese", TH: "Thai", GB: "British", ES: "Spanish", FR: "French", TR: "Turkish" };
  var ccBusy = {};
  function country(cc) { C.cc = C.cc || {}; var c = C.cc[cc];
    if ((!c || Date.now() - c.at > 24 * 3600000) && !ccBusy[cc] && C.home) { var n = (C.home.nav || []).filter(function (x) { return CCN[cc] && CCN[cc].test(x.title); })[0];
      if (n) { ccBusy[cc] = 1; SR.get(n.url, function (html, code, fin) { ccBusy[cc] = 0; C.cc[cc] = { at: Date.now(), items: html ? SR.lite(html, fin).map(slim) : [] }; saveLater(); }); } }
    return c ? c.items.map(T) : []; }
  function primary(t) { var c = t.countries || []; return c.indexOf("IN") >= 0 ? "IN" : c.indexOf("KR") >= 0 ? "KR" : c.indexOf("JP") >= 0 ? "JP" : c[0]; }

  // ---- every section gets a ShowBox row that fits it (country, genres, films vs series) ----
  var SKIP = /^(mylist|search|settings|together|time)$/;
  function mix(id, rows) {
    if (SKIP.test(id) || !rows || rows.length < 2) return rows;
    if (id === "korean") newKorean(rows);
    var pool = all(/movie/.test(id) ? "MOVIE" : /show|series/.test(id) ? "SHOW" : null);
    if (id === "home") { if (pool.length >= 6) rows.splice(Math.min(4, rows.length), 0, S.R("New on ShowBox", pool, null, "tap Play with FebBox", 1, true)); return rows; }
    var gc = {}, cc = {}, ty = { M: 0, S: 0 }, n = 0;
    rows.slice(0, 6).forEach(function (r) { (r.items || []).slice(0, 12).forEach(function (t) { if (!t || t.sb) return; n++;
      (t.genres || []).slice(0, 3).forEach(function (g) { gc[g] = (gc[g] || 0) + 1; }); var p = primary(t); if (p) cc[p] = (cc[p] || 0) + 1; ty[t.type === "SHOW" ? "S" : "M"]++; }); });
    if (n < 4) return rows;
    var dom = Object.keys(cc).sort(function (a, b) { return cc[b] - cc[a]; })[0]; if (!(dom && dom !== "US" && cc[dom] >= n * 0.35 && CCL[dom])) dom = null;
    var top = Object.keys(gc).sort(function (a, b) { return gc[b] - gc[a]; }).slice(0, 3), only = ty.S > n * 0.8 ? "SHOW" : ty.M > n * 0.8 ? "MOVIE" : null;
    var ccl = dom ? country(dom) : [], seen = {};
    var pick = ccl.concat(pool).filter(function (t) { if (seen[t.id]) return false; seen[t.id] = 1; if (only && t.type !== only) return false;
        if (dom) return (t.countries || []).indexOf(dom) >= 0 || (t.sb && ccl.indexOf(t) >= 0);
        return !top.length || (t.genres || []).some(function (g) { return top.indexOf(g) >= 0; }); })
      .sort(function (a, b) { function s(t) { return (t.imdb || 6) + (t.genres || []).filter(function (g) { return top.indexOf(g) >= 0; }).length * 0.6 - (t.sb ? 1.5 : 0); } return s(b) - s(a); });
    if (pick.length < 6) return rows;
    rows.splice(Math.min(id === "korean" ? 4 : 3, rows.length), 0, S.R((dom ? CCL[dom] + " on " : "On ") + "ShowBox", pick.slice(0, 30), null, "tap Play with FebBox", 1, true));
    return rows;
  }
  // K-Drama page: the new-release rows get checked on ShowBox (answers remembered, a "no" re-checked after 4 days);
  // titles ShowBox has get its label + Play with FebBox, and new Korean films only ShowBox has join the movies row
  var kBusy = false;
  function newKorean(rows) {
    var rs = rows.filter(function (r) { return r && /^New (K-Drama Series|Korean Movies)$/.test(r.title); }); if (!rs.length) return;
    var mv = rs.filter(function (r) { return /Movies/.test(r.title); })[0], Y = new Date().getFullYear();
    if (mv) { var have = {}; mv.items.forEach(function (t) { have[norm(t.title)] = 1; });
      country("KR").forEach(function (t) { if (t.sb && t.type === "MOVIE" && (t.year || 0) >= Y - 1 && !have[norm(t.title)]) { have[norm(t.title)] = 1; mv.items.push(t); } }); }
    var todo = []; rs.forEach(function (r) { r.items.slice(0, 30).forEach(function (t) { if (t && !t.site && !t.sb) todo.push(t); }); });
    if (kBusy || !todo.length) return; kBusy = true;
    var k = 0, live = 0;
    function lit(t) { document.querySelectorAll('.pc[data-id="' + t.id + '"]').forEach(function (c) { if (!c.querySelector(".sbl")) c.insertAdjacentHTML("beforeend", '<span class="sbl">ShowBox</span>'); }); }
    function next() {
      while (live < 3 && k < todo.length) { (function (t) { live++;
        one({ t: t.title, y: t.year, type: t.type }, function (hit) { live--;
          if (hit) { t.site = { url: hit.url }; S.T["st:" + hit.url] = t; HAS[norm(t.title) + "|" + (t.year || "")] = hit.url; saveLater(); lit(t); }
          if (k >= todo.length && !live) kBusy = false; else next(); }); })(todo[k++]); }
    }
    next();
  }
  function wrapSections() { Object.keys(S.SECTIONS).forEach(function (k) { var f = S.SECTIONS[k]; if (typeof f !== "function" || f._sb) return;
    var g = function () { var r = f.apply(this, arguments); try { return mix(k, r); } catch (e) { return r; } }; g._sb = 1; S.SECTIONS[k] = g; }); }

  // ---- Search: the switch, and an "On ShowBox" row on top of Vesper's own smart results ----
  var tok = 0, SSR = {};
  function check(t, cb) { var k = norm(t.title) + "|" + (t.year || ""); var h = HAS[k];
    if (h) { if (!t.site) t.site = { url: h }; return cb(true); } if (h === 0) return cb(false);
    SR.search(SITE, t.title, function (err, list) { var hit = (list || []).filter(function (c) { var y = yearOf(c); return norm(c.title) === norm(t.title) && (!t.year || !y || Math.abs(y - t.year) <= 1); })[0];
      HAS[k] = hit ? hit.url : 0; if (hit && !t.site) { t.site = { url: hit.url }; S.T["st:" + hit.url] = t; } saveLater(); cb(!!hit); }); }
  // ShowBox's own results show as soon as its search answers; Vesper's matches it already lists need no extra lookup;
  // only the top few others are checked (all at once), and labels/rows grow as answers arrive. Results are remembered.
  var SQC = ld("sq", {});
  // typos: "butterfly effet" still finds "The Butterfly Effect" (each word you typed ≈ a word of the title)
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var d = [], i, j; for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 1; j <= b.length; j++) d[0][j] = j; for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length]; }
  var STOPW = { the: 1, a: 1, an: 1, of: 1, and: 1 };
  function close(title, qn) { var tw = norm(title).split(" "), qw = qn.split(" ").filter(function (w) { return w && !STOPW[w]; }); if (!qw.length) return 0; var hit = 0;
    qw.forEach(function (w) { if (tw.some(function (x) { return x === w || (w.length >= 3 && x.indexOf(w) === 0) || (w.length >= 4 && lev(x, w) <= (w.length >= 7 ? 2 : 1)); })) hit++; });
    return hit === qw.length ? 2 + (tw.filter(function (x) { return !STOPW[x]; }).length === qw.length ? 1 : 0) : 0; }
  // ShowBox's search doesn't forgive typos: when it finds little, also search its most distinctive word and keep the close titles
  function sbSearch(q, qn, cb) { SR.search(SITE, q, function (err, list) { list = list || [];
      if (list.some(function (c) { return close(c.title, qn) >= 3; }) || !/\s/.test(qn) && list.length) return cb(list);
      var key = qn.split(" ").filter(function (w) { return !STOPW[w]; }).sort(function (a, b) { return b.length - a.length; })[0];
      if (!key || key === qn) return cb(list);
      SR.search(SITE, key, function (e2, l2) { var seen = {}, out = [];
        list.concat((l2 || []).filter(function (c) { return close(c.title, qn); }).sort(function (a, b) { return close(b.title, qn) - close(a.title, qn); }))
          .forEach(function (c) { if (!seen[c.url]) { seen[c.url] = 1; out.push(c); } }); cb(out); }); }); }
  function searchInto(body, q, R, rowEl, opt) {
    if (!ON || !q) return; var my = ++tok, qn = norm(q), TY = (opt && opt.type) || null, okT = function (t) { return !TY || (t && t.type === TY); };
    var box = document.createElement("div"); box.className = "sbres"; box.innerHTML = '<div class="row-h">On ShowBox<small>looking…</small></div><div class="sbph"></div>';
    body.insertBefore(box, body.firstChild);
    var mine = [];   // Vesper's own matches, best first
    // Vesper's title matches; only when there are none (an actor, a topic) its wider picks
    if (R.top) mine.push(R.top); (R.titles || []).forEach(function (t) { mine.push(t); });
    var loose = !mine.length;
    if (loose) { (R.sections || []).forEach(function (s) { (s.items || []).forEach(function (t) { mine.push(t); }); }); (R.vibe || []).forEach(function (t) { mine.push(t); }); }
    mine = mine.filter(function (t, i) { return t && mine.indexOf(t) === i && okT(t); }).slice(0, 12);
    var cur = box, ok = [];
    function paint() { if (my !== tok) return;
      var own = (SSR[qn] || []).map(T), byName = {}; own.forEach(function (t) { byName[norm(t.title)] = 1; });
      mine.forEach(function (t) { if (ok.indexOf(t) < 0 && (t.site || byName[norm(t.title)])) ok.push(t); });
      var exact = own.filter(function (t) { return norm(t.title) === qn || close(t.title, qn) >= 3; }), seen = {}, items = [];
      exact.concat(loose && exact.length ? [] : mine.filter(function (t) { return ok.indexOf(t) >= 0; })).concat(loose && exact.length ? own.filter(function (t) { return close(t.title, qn); }) : own).forEach(function (t) { if (t && !seen[t.id] && okT(t)) { seen[t.id] = 1; items.push(t); } });
      if (!items.length) { if (SSR[qn]) { var sm = cur.querySelector && cur.querySelector("small"); if (sm) sm.textContent = "nothing for “" + q + "”"; var ph = cur.querySelector && cur.querySelector(".sbph"); if (ph) ph.remove(); } return; }
      var row = rowEl(S.R("On ShowBox", items.slice(0, 30), null, items.length + " · tap Play with FebBox", 1, true)), keep = cur.querySelector && cur.querySelector(".rail"), x = keep ? keep.scrollLeft : 0;
      cur.replaceWith(row); row._fill(); var nr = row.querySelector(".rail"); if (nr && x) nr.scrollLeft = x; cur = row; }
    if (SQC[qn]) SSR[qn] = SQC[qn];
    if (SSR[qn]) paint();   // seen this search before: instant
    setTimeout(function () { if (my !== tok) return;   // a short pause after typing
      if (!SSR[qn]) sbSearch(q, qn, function (list) { SSR[qn] = (list || []).map(slim); SQC[qn] = SSR[qn]; var ks = Object.keys(SQC); if (ks.length > 120) delete SQC[ks[0]]; sv("sq", SQC); paint(); next(); });
      else next();
      function next() {   // the top few Vesper matches ShowBox's own list didn't include: check them all at once
        var own = {}; (SSR[qn] || []).forEach(function (c) { own[norm(c.title)] = 1; });
        mine.filter(function (t) { return !t.site && !own[norm(t.title)]; }).slice(0, 6).forEach(function (t) { check(t, function (yes) { if (yes && ok.indexOf(t) < 0) { ok.push(t); paint(); } }); });
      }
    }, 250);
  }
  function toggle(onChange) { var b = document.createElement("button"); b.className = "sbtog" + (ON ? " on" : ""); b.innerHTML = "<i></i>ShowBox " + (ON ? "on" : "off");
    b.addEventListener("click", function () { ON = !ON; sv("on", ON); b.className = "sbtog" + (ON ? " on" : ""); b.innerHTML = "<i></i>ShowBox " + (ON ? "on" : "off"); if (onChange) onChange(); }); return b; }

  // ---- title page: details for ShowBox-only titles; the FebBox link is fetched ahead so the tap opens at once ----
  function prep(t, descEl, cb) {
    if (!t || !t.site) return;
    if (t.sb && !t.desc && descEl) SR.read(t.site.url, "detail", function (err, d) { if (d) { t.desc = d.desc || ""; if (descEl.isConnected) descEl.textContent = t.desc; } });
    if (t.shareKey || t.keyNone) { if (cb) cb(); return; }
    if (cb) (t.keyWait = t.keyWait || []).push(cb);
    if (!t.keyBusy) { t.keyBusy = 1; SR.findShare(t.site.url, function (key) { t.keyBusy = 0; t.shareKey = key || ""; t.keyNone = !key; var w = t.keyWait || []; t.keyWait = null; w.forEach(function (f) { f(); }); }); }
  }
  // one click: the tab opens during your click (browsers only allow that), then goes to FebBox the moment the link is ready
  function play(t, toast) {
    if (!t || !t.site) return;
    var url = function () { return "https://www.febbox.com/share/" + t.shareKey; };
    if (t.shareKey) { window.open(url(), "_blank"); return; }
    if (t.keyNone) { toast("ShowBox has no FebBox copy of this right now"); return; }
    var w = null; try { w = window.open("", "_blank"); } catch (e) {}
    if (w) { try { w.document.write('<title>Opening FebBox…</title><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0b10;color:#e9e4dc;font:600 20px -apple-system,sans-serif">Opening FebBox…</body>'); } catch (e) {} }
    else toast("Getting the FebBox link…");
    prep(t, null, function () {
      if (t.shareKey) { if (w && !w.closed) w.location.href = url(); else window.open(url(), "_blank"); }
      else { if (w && !w.closed) w.close(); toast("ShowBox has no FebBox copy of this right now"); }
    });
  }

  // ---- ShowBox's own list pages (by year / country / genre, films or series) and its raw search pages, remembered 12 hours ----
  var SBO = "https://www.showbox.media", PGC = ld("pg", {});
  function pages(path, n, cb) {
    var hit = PGC[path]; if (hit && Date.now() - hit.at < 12 * 3600000) return cb(hit.items, true);
    var per = [], left = n;
    for (var p = 1; p <= n; p++) (function (p) {
      SR.get(SBO + path + (path.indexOf("?") >= 0 ? "&" : "?") + "page=" + p, function (html, code, fin) {
        left--; per[p] = html ? SR.lite(html, fin || SBO + path).filter(function (c) { return /\/(movie|tv)\/[mt]-/.test(c.url); }).map(slim) : [];
        var seen = {}, all = []; per.forEach(function (l) { (l || []).forEach(function (c) { if (!seen[c.url]) { seen[c.url] = 1; all.push(c); } }); });
        if (!left && all.length) { PGC[path] = { at: Date.now(), items: all }; var ks = Object.keys(PGC); if (ks.length > 60) delete PGC[ks[0]]; sv("pg", PGC); }
        cb(all, !left);
      });
    })(p);
  }
  var SBC = { KR: "South Korea", JP: "Japan", IN: "India", CN: "China", HK: "Hong Kong", TW: "Taiwan", TH: "Thailand", GB: "United Kingdom", US: "United States", FR: "France",
    DE: "Germany", ES: "Spain", IT: "Italy", MX: "Mexico", AU: "Australia", CA: "Canada", IE: "Ireland", DK: "Denmark", SE: "Sweden", NO: "Norway", FI: "Finland", BR: "Brazil",
    PL: "Poland", NL: "Netherlands", BE: "Belgium", RU: "Russia", AR: "Argentina", NZ: "New Zealand", ZA: "South Africa", IL: "Israel" };
  var SBG = { act: 1, adv: 2, ani: 3, cmy: 5, crm: 6, doc: 7, drm: 8, fml: 9, fnt: 10, hst: 12, hrr: 13, msc: 14, rma: 16, scf: 17, spt: 18, trl: 19, war: 20, wsn: 21, rly: 24 };
  function listFor(P) {
    var yr = P.year ? String(P.year) : P.era ? P.era[0] + "-" + P.era[1] : "", g = (P.genres || []).map(function (x) { return SBG[x]; }).filter(Boolean).join("-"),
      cc = P.cc && SBC[P.cc[0]], out = [];
    function qs(o) { return Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return k + "=" + encodeURIComponent(o[k]); }).join("&"); }
    if (!yr && !g && !cc) return out;
    if (P.type !== "SHOW") out.push({ type: "MOVIE", path: "/movie?" + qs({ country: cc, release_year: yr, genre: g }) });
    if (P.type !== "MOVIE" && !cc) out.push({ type: "SHOW", path: "/tv?" + qs({ release_year: yr, genre: g }) });   // ShowBox can't filter series by country
    return out;
  }
  // "Korean movies on ShowBox", "2016 on ShowBox": ShowBox's own filtered lists, the titles Vesper knows first
  var btok = 0;
  function browse(P, onItems) {
    var L = listFor(P); if (!ON || !L.length) return false;
    var my = ++btok, got = {}, fin = {}, cc = P.cc && P.cc[0];
    L.forEach(function (x) { pages(x.path, 3, function (items, done) { if (my !== btok) return;
      got[x.path] = items.map(function (c) { var t = T(c); if (t.sb && cc && !(t.countries || []).length) t.countries = [cc]; return t; }); if (done) fin[x.path] = 1;
      var all = [], seen = {}; L.forEach(function (y) { (got[y.path] || []).forEach(function (t) { if (!seen[t.id] && (!P.type || t.type === P.type)) { seen[t.id] = 1; all.push(t); } }); });
      var known = all.filter(function (t) { return !t.sb; }).sort(function (a, b) { return (b.imdb || 6) - (a.imdb || 6); });
      onItems(known.concat(all.filter(function (t) { return t.sb; })), Object.keys(fin).length === L.length); }); });
    return true;
  }
  // everything a person / studio made that ShowBox has: ShowBox's search for the name first (it looks in cast lists too),
  // then the rest of the filmography title by title (3 at a time, best-known first). Answers remembered.
  var HAS2 = ld("has2", {}), h2T = null, wtok = 0;
  function h2save() { clearTimeout(h2T); h2T = setTimeout(function () { var ks = Object.keys(HAS2); if (ks.length > 3000) ks.slice(0, 600).forEach(function (k) { delete HAS2[k]; }); sv("has2", HAS2); }, 1500); }
  function wkey(w) { return norm(w.t) + "|" + (w.y || "") + "|" + w.type; }
  function tyOf(c) { return /\/tv\/|\/t-/.test(c.url) ? "SHOW" : "MOVIE"; }
  function one(w, cb) {
    var k = wkey(w), v = HAS2[k];
    if (v && v.url) return cb(v); if (typeof v === "number" && Date.now() - v < 4 * 864e5) return cb(null);   // a "no" is re-checked after 4 days
    SR.get(SBO + "/search?keyword=" + encodeURIComponent(w.t) + "&type=" + (w.type === "SHOW" ? "tv" : "movie"), function (html, code, fin) {
      var list = html ? SR.lite(html, fin || SBO).filter(function (c) { return /\/(movie|tv)\/[mt]-/.test(c.url); }) : null;
      var hit = (list || []).filter(function (c) { var y = yearOf(c); return norm(c.title) === norm(w.t) && (!w.y || !y || Math.abs(y - w.y) <= 1) && tyOf(c) === w.type; })[0];
      if (hit) HAS2[k] = slim(hit); else if (list) HAS2[k] = Date.now(); h2save(); cb(hit ? slim(hit) : null); });
  }
  function works(list, name, type, onItems) {
    var my = ++wtok, found = {}, byName = {};
    list = list.filter(function (w) { return !type || w.type === type; });
    list.forEach(function (w) { var n = norm(w.t); (byName[n] = byName[n] || []).push(w); });
    function emit(done) { if (my !== wtok) return; var out = [], seen = {};
      list.forEach(function (w) { var c = found[wkey(w)]; if (!c) return; var t = T(c); if (!seen[t.id]) { seen[t.id] = 1; out.push({ w: w, t: t }); } }); onItems(out, done); }
    function match(c) { (byName[norm(c.title)] || []).forEach(function (w) { var y = yearOf(c);
      if (tyOf(c) === w.type && (!w.y || !y || Math.abs(w.y - y) <= 1) && !found[wkey(w)]) { found[wkey(w)] = c; HAS2[wkey(w)] = c; } }); }
    list.forEach(function (w) { var v = HAS2[wkey(w)]; if (v && v.url) found[wkey(w)] = v; });   // known from before: instant
    emit(false);
    var started = false;
    pages("/search?keyword=" + encodeURIComponent(name) + (type ? "&type=" + (type === "SHOW" ? "tv" : "movie") : ""), 3, function (items, done) {
      if (my !== wtok) return; items.forEach(match); h2save(); emit(false); if (done && !started) { started = true; rest(); } });
    function rest() {
      var todo = list.filter(function (w) { return !found[wkey(w)]; }).slice(0, 70), i = 0, run = 0;
      if (!todo.length) return emit(true);
      (function pump() { if (my !== wtok) return;
        while (run < 3 && i < todo.length) (function (w) { run++; one(w, function (c) { run--; if (c) { found[wkey(w)] = c; emit(false); }
          if (i >= todo.length && !run) emit(true); else setTimeout(pump, 0); }); })(todo[i++]); })();
    }
  }
  function cancel() { tok++; btok++; wtok++; }

  window.VSB = { reindex: function () { IDX = null; }, on: function () { return ON; }, toggle: toggle, searchInto: searchInto, prep: prep, play: play, browse: browse, works: works, cancel: cancel, T: T,
    cached: function () { var out = [], seen = {}; Object.keys(SQC).forEach(function (k) { (SQC[k] || []).forEach(function (c) { if (!seen[c.url]) { seen[c.url] = 1; out.push(c); } }); });
      ((C.home && C.home.rows) || []).concat((C.more && C.more.lists) || []).forEach(function (r) { r.items.forEach(function (c) { if (!seen[c.url]) { seen[c.url] = 1; out.push(c); } }); }); return out; },
    label: function (t) { return t && t.site ? '<span class="sbl">ShowBox</span>' : ""; } };
  if (S.SECTIONS) wrapSections();   // before the first screen is drawn
  function start() { if (!S.ALL || !S.SECTIONS) return setTimeout(start, 300); wrapSections(); boot(); }
  start();
})();
