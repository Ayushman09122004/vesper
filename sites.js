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
    rows.splice(Math.min(3, rows.length), 0, S.R((dom ? CCL[dom] + " on " : "On ") + "ShowBox", pick.slice(0, 30), null, "tap Play with FebBox", 1, true));
    return rows;
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
  function searchInto(body, q, R, rowEl) {
    if (!ON || !q) return; var my = ++tok, qn = norm(q);
    var box = document.createElement("div"); box.className = "sbres"; box.innerHTML = '<div class="row-h">On ShowBox<small>looking…</small></div><div class="sbph"></div>';
    body.insertBefore(box, body.firstChild);
    var mine = [];   // Vesper's own matches, best first
    // Vesper's title matches; only when there are none (an actor, a topic) its wider picks
    if (R.top) mine.push(R.top); (R.titles || []).forEach(function (t) { mine.push(t); });
    var loose = !mine.length;
    if (loose) { (R.sections || []).forEach(function (s) { (s.items || []).forEach(function (t) { mine.push(t); }); }); (R.vibe || []).forEach(function (t) { mine.push(t); }); }
    mine = mine.filter(function (t, i) { return t && mine.indexOf(t) === i; }).slice(0, 12);
    var cur = box, ok = [];
    function paint() { if (my !== tok) return;
      var own = (SSR[qn] || []).map(T), byName = {}; own.forEach(function (t) { byName[norm(t.title)] = 1; });
      mine.forEach(function (t) { if (ok.indexOf(t) < 0 && (t.site || byName[norm(t.title)])) ok.push(t); });
      var exact = own.filter(function (t) { return norm(t.title) === qn || close(t.title, qn) >= 3; }), seen = {}, items = [];
      exact.concat(loose && exact.length ? [] : mine.filter(function (t) { return ok.indexOf(t) >= 0; })).concat(loose && exact.length ? own.filter(function (t) { return close(t.title, qn); }) : own).forEach(function (t) { if (t && !seen[t.id]) { seen[t.id] = 1; items.push(t); } });
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
  function prep(t, descEl) {
    if (!t || !t.site) return;
    if (t.sb && !t.desc && descEl) SR.read(t.site.url, "detail", function (err, d) { if (d) { t.desc = d.desc || ""; if (descEl.isConnected) descEl.textContent = t.desc; } });
    if (!t.shareKey && !t.keyBusy) { t.keyBusy = 1; SR.findShare(t.site.url, function (key) { t.keyBusy = 0; t.shareKey = key || ""; t.keyNone = !key; }); }
  }
  function play(t, toast) {
    if (!t || !t.site) return;
    if (t.shareKey) { window.open("https://www.febbox.com/share/" + t.shareKey, "_blank"); return; }
    if (t.keyNone) { toast("ShowBox has no FebBox copy of this right now"); return; }
    toast("Getting the FebBox link — tap again in a second"); prep(t);
  }

  window.VSB = { on: function () { return ON; }, toggle: toggle, searchInto: searchInto, prep: prep, play: play, label: function (t) { return t && t.site ? '<span class="sbl">ShowBox</span>' : ""; } };
  if (S.SECTIONS) wrapSections();   // before the first screen is drawn
  function start() { if (!S.ALL || !S.SECTIONS) return setTimeout(start, 300); wrapSections(); boot(); }
  start();
})();
