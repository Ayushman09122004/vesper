/* Vesper for Mac — taste: profiles, Like / Not for me, recommendations that learn, Tonight's Three,
   a surprise pick, and rows that feel fresh every time Vesper opens. Builds on shape.js (window.VS). */
(function (G) {
  "use strict";
  var V = G.VS, _ = V._, R = V.R;
  var SEED = Math.random();   // one per launch: what reshuffles each time Vesper opens
  function rnd(seed) { var s = Math.floor((seed % 1) * 2147483646) + 1; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function setOf(keys, n) { var o = {}; keys.forEach(function (k) { V.list(k).slice(0, n || 1e9).forEach(function (id) { o[id] = 1; }); }); return o; }

  // ---------- profiles ----------
  var HUES = [265, 22, 200, 330, 150, 45, 290, 185];
  V.profiles = function () { return V.state.profiles || []; };
  V.profile = function () { var id = V.state.profile; return V.profiles().filter(function (p) { return p.id === id; })[0] || null; };
  V.addProfile = function (name) {
    var ps = V.profiles().slice(), id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), first = !ps.length;
    ps.push({ id: id, name: name, hue: HUES[ps.length % HUES.length] });
    V.setRaw("profiles", ps);
    // the first person keeps everything Vesper already learned before profiles existed
    if (first) ["mylist", "watched", "recent", "queries", "likes", "dislikes", "viewed"].forEach(function (k) { if (V.state[k] && V.state[k].length) V.setRaw(k + "@" + id, V.state[k]); });
    return id;
  };
  V.useProfile = function (id) { V.setRaw("profile", id); TRIO = null; SHOWN_LAST = null; };
  V.renameProfile = function (id, name) { V.setRaw("profiles", V.profiles().map(function (p) { return p.id === id ? Object.assign({}, p, { name: name }) : p; })); };
  V.removeProfile = function (id) {
    V.setRaw("profiles", V.profiles().filter(function (p) { return p.id !== id; }));
    Object.keys(V.state).forEach(function (k) { if (k.slice(-(id.length + 1)) === "@" + id) V.setRaw(k, null); });
    if (V.state.profile === id) V.setRaw("profile", (V.profiles()[0] || {}).id || null);
  };
  V.avatar = function (p, cls) {
    return '<div class="ava ' + (cls || "") + '" style="--h:' + (p ? p.hue : 265) + '">' + V.esc(p ? (p.name.trim()[0] || "?").toUpperCase() : "+") + "</div>";
  };
  // forget opened titles, searches, likes and taste for this profile (My List stays)
  V.clearHistory = function () { ["recent", "queries", "likes", "dislikes", "viewed", "watched", "shown", "trios"].forEach(function (k) { V.set(k, []); }); TRIO = null; };

  // ---------- Like / Not for me ----------
  V.like = function (id) { var on = V.toggle("likes", id, true); if (on) V.set("dislikes", V.list("dislikes").filter(function (x) { return x !== id; })); return on; };
  V.dislike = function (id) { var on = V.toggle("dislikes", id, true); if (on) V.set("likes", V.list("likes").filter(function (x) { return x !== id; })); return on; };
  V.markViewed = function (id) { var l = V.list("viewed").filter(function (x) { return x !== id; }); l.unshift(id); V.set("viewed", l.slice(0, 80)); };
  V.hiddenSet = function () { return setOf(["dislikes", "watched"]); };

  // ---------- taste: what you do adds weight to genres, countries and services ----------
  var W = { likes: 5, watched: 4, mylist: 2.5, recent: 2, viewed: 0.5, dislikes: -3 };
  var tCache = null, tSig = "";
  V.taste = function () {
    var sig = (V.state.profile || "") + Object.keys(W).map(function (k) { return V.list(k).length + ":" + V.list(k)[0]; }).join("|");
    if (tCache && sig === tSig) return tCache;
    var g = {}, c = {}, a = {}, n = 0;
    Object.keys(W).forEach(function (k) {
      V.list(k).slice(0, k === "viewed" ? 40 : 300).forEach(function (id) {
        var t = V.T[id], w = W[k]; if (!t) return; n += Math.abs(w);
        (t.genres || []).forEach(function (x) { g[x] = (g[x] || 0) + w; });
        var p = _.primary(t) || (t.countries || [])[0]; if (p) c[p] = (c[p] || 0) + w;
        (t.avail || []).forEach(function (x) { a[x] = (a[x] || 0) + w; });
      });
    });
    tSig = sig; return (tCache = { g: g, c: c, a: a, n: n });
  };
  function maxPos(o) { var m = 0; for (var k in o) if (o[k] > m) m = o[k]; return m || 1; }
  V.tasteScore = function (t, T) {
    var mg = maxPos(T.g), mc = maxPos(T.c), gs = 0;
    (t.genres || []).forEach(function (x) { var w = T.g[x] || 0; gs += w > 0 ? Math.min(1, w / mg) : Math.max(-1, w / mg); });
    gs = Math.max(-2, Math.min(2.2, gs));   // capped, so one genre can't take over
    var p = _.primary(t) || (t.countries || [])[0], cw = p ? T.c[p] || 0 : 0, cs = cw > 0 ? Math.min(1, cw / mc) : cw < 0 ? -0.5 : 0;
    var as = (t.avail || []).some(function (x) { return (T.a[x] || 0) > 0; }) ? 1 : 0;
    return gs * 12 + cs * 6 + as * 3 + ((t.imdb || 6) - 6.5) * 4 + Math.min(6, Math.log(1 + t.votes) / 2) + Math.min(3, Math.log(1 + (t.pop || 0)));
  };
  // never recommends what you've opened, saved, watched, liked or turned down
  function excluded() { return setOf(["recent", "mylist", "watched", "likes", "dislikes"]); }
  V.topPicks = function (n) {
    var T = V.taste(); if (T.n < 6) return [];
    var ex = excluded();
    return V.ALL.filter(function (t) { return !ex[t.id] && (t.avail || []).length && (t.imdb || 0) >= 6.5 && t.votes >= 2000; })
      .map(function (t) { return { t: t, s: V.tasteScore(t, T) }; }).sort(function (a, b) { return b.s - a.s; })
      .slice(0, n || 40).map(function (o) { return o.t; });
  };

  // ---------- personal rows ----------
  V.personalRows = function () {
    var rows = [];
    if (V.list("recent").length) rows.push(R("Continue in Your Apps", V.ids(V.list("recent")), null, "pick up where you left off", 1, true));
    if (V.list("mylist").length) rows.push(R("My List", V.ids(V.list("mylist")), null, null, 1, true));
    return rows;
  };
  V.becauseRows = function () {
    var rows = [], ex = excluded(), likes = V.ids(V.list("likes")).slice(0, 4);
    if (likes.length) { var l = likes[Math.floor(rnd(SEED * 3)() * likes.length)];   // rotates among your last few likes
      rows.push(R("Because you liked " + l.title, V.similar(l, 50).filter(function (t) { return !ex[t.id]; }))); }
    var o = V.T[V.list("recent")[0]];
    if (o) rows.push(R("Because you opened " + o.title, V.similar(o, 50).filter(function (t) { return !ex[t.id]; })));
    return rows;
  };

  // ---------- Tonight's Three (+ the surprise card, Pick for me) ----------
  var TRIO = null;
  function mainGenre(t) { return (t.genres || []).filter(function (g) { return g !== "drm"; })[0] || "drm"; }
  V.tonightsThree = function () {
    if (TRIO) return TRIO;
    var skip = setOf(["recent", "watched", "dislikes"], 80), past = setOf(["trios"]), pool = [], seen = {};
    var wn = V.wxNow(), pod = V.partOfDay(), late = pod === "evening" || pod === "night";
    function add(l, w) { l.forEach(function (t) { if (t && !seen[t.id] && !skip[t.id] && !past[t.id] && (t.avail || []).length && (t.imdb || 0) >= 7 && t.votes >= 3000) { seen[t.id] = 1; pool.push({ t: t, w: w }); } }); }
    add(wn ? V.wxRow(wn.k, 40) : [], late ? 1.3 : 1.1);   // the weather leads after dark
    add(V.topPicks(40), 1.25); add(_.arrivals(), 1); add(_.masterpieces().slice(0, 80), 1); add(_.seg("trend").slice(0, 80), 0.95);
    var r = rnd(SEED * 11);
    pool.forEach(function (o) { if (!late && _.hasG("cmy", "fml", "rma")(o.t)) o.w *= 1.1; o.s = _.quality(o.t) * o.w * (0.85 + r() * 0.3); });
    pool.sort(function (a, b) { return b.s - a.s; });
    var out = [], used = {};
    pool.some(function (o) { var g = mainGenre(o.t); if (!used[g]) { used[g] = 1; out.push(o.t); } return out.length === 2; });
    // the third: a different genre, and a series if both so far are films (or a film if both are series)
    var both = out.length === 2 && out[0].type === out[1].type ? out[0].type : null;
    var third = pool.filter(function (o) { return out.indexOf(o.t) < 0 && !used[mainGenre(o.t)] && (!both || o.t.type !== both); })[0] ||
      pool.filter(function (o) { return out.indexOf(o.t) < 0 && !used[mainGenre(o.t)]; })[0];
    if (third) out.push(third.t);
    V.set("trios", out.map(function (t) { return t.id; }).concat(V.list("trios")).slice(0, 12));   // don't repeat the last few trios
    return (TRIO = out);
  };
  V.surprisePick = function () {
    var skip = setOf(["recent", "watched", "dislikes", "mylist", "likes"]), trio = TRIO || [];
    var l = V.ALL.filter(function (t) { return !skip[t.id] && trio.indexOf(t) < 0 && (t.avail || []).length && (t.imdb || 0) >= 7.6 && t.votes > 20000; });
    return l[Math.floor(Math.random() * l.length)];
  };
  V.pickForMe = function () {
    var l = V.topPicks(10); if (l.length < 4) l = l.concat(V.tonightsThree());
    return l.length ? l[Math.floor(Math.random() * Math.min(l.length, 6))] : V.surprisePick();
  };

  // ---------- vibe words (show, don't tell) ----------
  var VIBE = { trl: "Tense", crm: "Gritty", hrr: "Chilling", cmy: "Witty", rma: "Romantic", fnt: "Enchanting", drm: "Moving", act: "Thrilling", fml: "Heartwarming",
    doc: "Eye-opening", war: "Harrowing", hst: "Sweeping", scf: "Visionary", ani: "Animated", msc: "Soulful", spt: "Rousing", wsn: "Rugged", rly: "Unscripted" };
  V.vibes = function (t) {
    var w = [];
    if (_.hasG("scf")(t) && _.hasG("trl", "drm")(t)) w.push("Mind-bending");
    (t.genres || []).filter(function (g) { return g !== "drm"; }).concat((t.genres || []).indexOf("drm") >= 0 ? ["drm"] : []).forEach(function (g) { var v = VIBE[g]; if (v && w.length < 2 && w.indexOf(v) < 0 && !(g === "scf" && w[0] === "Mind-bending")) w.push(v); });
    if (t.type === "SHOW" && t.seasons === 1 && t.eps && t.eps <= 10) w.push("One-weekend binge");
    else if (t.type === "MOVIE" && t.runtime && t.runtime <= 100) w.push("Quick watch");
    else { var ex = (t.genres || []).filter(function (g) { return g !== "drm" && VIBE[g] && w.indexOf(VIBE[g]) < 0; })[0]; if (ex) w.push(VIBE[ex]); }
    return w.slice(0, 3);
  };
  // a soft glow colour for the hovered card, by genre
  var HUE = { trl: 210, crm: 28, hrr: 0, cmy: 48, rma: 335, fnt: 275, drm: 220, act: 15, fml: 140, doc: 170, war: 35, hst: 38, scf: 190, ani: 300, msc: 320 };
  V.glowHue = function (t) { var g = (t.genres || []).filter(function (x) { return HUE[x] != null && x !== "drm"; })[0] || (t.genres || [])[0]; return HUE[g] != null ? HUE[g] : 250; };

  // ---------- fresh every launch ----------
  // ranked rows (Top 10, Coming Soon) and your own rows stay put; everything else is reshuffled, titles you were shown
  // last time step back, and two "guest" titles join each row
  var FIXED = /^(Top 10|Coming Soon|Continue in Your Apps|My List|Tonight's Three|New on Your Apps|New Seasons|Watched|Not for Me)/;
  var SHOWN_LAST = null;
  function shownLast() { if (!SHOWN_LAST) SHOWN_LAST = setOf(["shown"]); return SHOWN_LAST; }
  function guestPool() {
    var wn = V.wxNow(), seen = {}, out = [], hid = V.hiddenSet(), mine = setOf(["recent", "mylist", "likes"]);
    [V.topPicks(60), wn ? V.wxRow(wn.k, 40) : [], _.arrivals(), _.masterpieces().slice(0, 80), _.seg("trend").slice(0, 80)].forEach(function (l) {
      l.forEach(function (t) { if (t && !seen[t.id] && !hid[t.id] && !mine[t.id] && (t.avail || []).length) { seen[t.id] = 1; out.push(t); } }); });
    return out;
  }
  function rowGenre(items) { var c = {}; items.slice(0, 12).forEach(function (t) { var g = mainGenre(t); c[g] = (c[g] || 0) + 1; }); var best = null; for (var g in c) if (!best || c[g] > c[best]) best = g; return best; }
  function rowType(items) { var s = 0; items.slice(0, 12).forEach(function (t) { s += t.type === "SHOW" ? 1 : -1; }); return s > 3 ? "SHOW" : s < -3 ? "MOVIE" : null; }
  V.freshen = function (rows, sec) {
    var r = rnd(SEED * 13 + sec.length / 100), last = shownLast(), pool = guestPool(), usedGuest = {};
    // guests must belong where they land: only that service on a service page, only films on Movies, none on country/genre pages
    var app = sec.indexOf("app:") === 0 ? sec.slice(4) : null, fits = app ? function (t) { return (t.avail || []).indexOf(app) >= 0; }
      : sec === "movies" ? function (t) { return t.type === "MOVIE"; } : sec === "shows" ? function (t) { return t.type === "SHOW"; }
      : /^(home|weather|collections)$/.test(sec) ? function () { return true; } : null;
    pool = fits ? pool.filter(fits) : [];
    rows.forEach(function (row) {
      if (row.kind === "top10" || row.kind === "trio" || row.keep || FIXED.test(row.title)) return;
      var a = row.items.filter(function (t) { return !last[t.id]; }), b = row.items.filter(function (t) { return last[t.id]; });
      row.items = a.concat(b);
      var g = rowGenre(row.items), ty = rowType(row.items), inRow = {};
      row.items.forEach(function (t) { inRow[t.id] = 1; });
      var gs = shuffle(pool.filter(function (t) { return !inRow[t.id] && !usedGuest[t.id] && (t.genres || []).indexOf(g) >= 0 && (!ty || t.type === ty); }).slice(0, 12), r).slice(0, 2);
      gs.forEach(function (t, i) { usedGuest[t.id] = 1; row.items.splice(i ? 5 : 2, 0, t); });
    });
    var slots = [], movable = [];
    rows.forEach(function (row, i) { if (i < 2 || row.kind === "top10" || row.kind === "trio" || FIXED.test(row.title)) return; slots.push(i); movable.push(row); });
    movable = shuffle(movable, r);
    slots.forEach(function (i, j) { rows[i] = movable[j]; });
    return rows;
  };
  // remember the first few cards of each row you were shown, so next launch they step back
  V.noteShown = function (rows) {
    var ids = [];
    rows.forEach(function (row) { if (row.kind !== "top10" && !row.keep && !FIXED.test(row.title)) row.items.slice(0, 6).forEach(function (t) { ids.push(t.id); }); });
    V.set("shown", ids.slice(0, 400));
  };

  // ---------- Home, rebuilt around you ----------
  V.SECTIONS.home = function () {
    var wn = V.wxNow(), rows = V.personalRows().concat([R("Tonight's Three", V.tonightsThree(), "trio", null, 1, true), R("Top 10 Series in India Today", _.topList("SHOW"), "top10")]);
    if (wn) rows.push(R(wn.title, V.wxRow(wn.k), null, wn.sub));
    var picks = V.topPicks(40); if (picks.length >= 6) rows.push(R("Top Picks for You", picks, null, "learns from what you like"));
    rows = rows.concat(V.becauseRows());
    rows.push(R("New on Your Apps", _.arrivals(), null, "this week"), R("Trending Now", _.seg("trend")), R("Coming Soon", _.comingSoon(), null, "dates on your apps", 3),
      R("Top 10 Movies in India Today", _.topList("MOVIE"), "top10"));
    // themed rows: a different handful from a big pool each launch
    var W = V.WXK, pool = [R("Netflix Originals", _.origOf("netflix")), R("Prime Video Originals", _.origOf("amazon")), R("Apple TV+ Originals", _.origOf("com.apple.appletv")),
      R("Only on JioHotstar", _.origOf("hotstar")), R("K-Dramas", _.seg("kr_s")), R("Hollywood Blockbusters", _.seg("us_m")), R("Anime", _.seg("ani_s")), R("British Series", _.seg("gb_s")),
      R("World Cinema", _.seg("world_m")), R("Bingeworthy Series", _.seg("acc_s")), R("Indian Cinema", _.seg("in_m")), R("Korean Films", _.seg("kr_m")), R("Anime Films", _.seg("ani_m")),
      R("Critically Acclaimed Films", _.seg("acc_m")), R("International Series", _.seg("world_s")), R("New Releases", _.seg("new")),
      R("Binge in a Weekend", _.binge(), null, "one season, ten episodes or fewer"), R("Short & Sweet", _.shortFilms(), null, "films under 100 minutes"),
      R("Masterpieces", _.masterpieces(), null, "8.3+ on IMDb"), R("Hidden Gems", _.gems(V.ALL)), R("Classics", _.classics(V.ALL)), R("Family Time", _.seg("kids")), R("Documentaries", _.seg("docs")),
      R("Nordic & European Gloom", _.wxRegion(["DE", "NO", "SE", "DK", "IS", "FI", "BE", "NL", "PL", "FR", "ES", "AT", "CH"], ["US"]), null, "Germany, Scandinavia, France, Spain…"),
      R("British Grey Skies", _.wxRegion(["GB", "IE"]), null, "from the UK & Ireland"), R("Korean & Japanese Dark", _.wxRegion(["KR", "JP"]))];
    ["fog", "myst", "magic", "vamp", "snow", "storm", "city", "anime"].forEach(function (k) { if (!wn || wn.k !== k) pool.push(R(W[k].n, V.wxRow(k), null, W[k].d)); });
    _.GENRE_ROWS.forEach(function (g) { pool.push(R(g[1], _.byPop(V.ALL.filter(_.hasG(g[0]))))); });
    var r = rnd(SEED * 17);
    pool = pool.concat(shuffle(_.franchiseRows(3), r).slice(0, 2), shuffle(_.directorRows(14), r).slice(0, 2));
    return rows.concat(shuffle(pool, r).slice(0, 16));
  };
  // My List page also shows what you turned down, so you can undo it
  var baseMyList = V.SECTIONS.mylist;
  V.SECTIONS.mylist = function () {
    var rows = baseMyList(), likes = V.ids(V.list("likes")), no = V.ids(V.list("dislikes"));
    if (likes.length) rows.splice(1, 0, R("Liked", likes, null, null, 1, true));
    if (no.length) rows.push(R("Not for Me", no, null, "hidden everywhere — open one to undo", 1, true));
    return rows;
  };
  V.tonightsPick = function () { return V.tonightsThree()[0] || V.surprisePick(); };
  V.SEED = SEED;
  // a brand-new shuffle without restarting (pull to refresh on iPhone)
  V.reseed = function () { SEED = Math.random(); V.SEED = SEED; TRIO = null; SHOWN_LAST = null; };
})(window);
