/* Vesper — the discovery engine. Every time the app opens, each section gets a different mix of rows from a big pool of
   ideas (genre × films/series, moods, countries, decades, quality, length, people, your taste), and inside every row the
   titles you've already been shown step back so new ones surface. Shared by the web app (VS) and the TV app.
   window.VE = VE.make(env) → { expand(sec, rows), more(sec, n) }   env: all(), R(), tasteScore(t)?, hidden()?, primary(t)? */
(function (G) {
  var LS = G.localStorage;
  function ld(k, d) { try { var v = JSON.parse(LS.getItem("ve." + k)); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { LS.setItem("ve." + k, JSON.stringify(v)); } catch (e) {} }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  var GL = { act: "Action", cmy: "Comedy", drm: "Drama", trl: "Thriller", crm: "Crime", fnt: "Fantasy", rma: "Romance", scf: "Sci-Fi", hrr: "Horror", hst: "History",
    war: "War", doc: "Documentary", fml: "Family", msc: "Music", spt: "Sport", wsn: "Western", rly: "Reality", ani: "Animation" };
  var CC = [["US", "American"], ["GB", "British"], ["KR", "Korean"], ["JP", "Japanese"], ["IN", "Indian"], ["FR", "French"], ["ES", "Spanish"], ["DE", "German"], ["IT", "Italian"],
    [["SE", "DK", "NO", "FI", "IS"], "Nordic"], ["CN", "Chinese"], ["HK", "Hong Kong"], ["TW", "Taiwanese"], ["TH", "Thai"], ["TR", "Turkish"], [["MX", "AR", "BR", "CO", "CL"], "Latin American"],
    [["AU", "NZ"], "Australian"], ["CA", "Canadian"], ["IE", "Irish"]];
  // story ideas found in descriptions
  var THEMES = [["Heists & Capers", /\bheist|robber|steal|thie(f|ves)|con artist|vault\b/], ["Spies & Secret Agents", /\bspy\b|spies|secret agent|\bcia\b|\bmi6\b|espionage|undercover/],
    ["Time Travel", /time travel|time loop|travels? back in time|future self/], ["Survival Stories", /surviv|stranded|wilderness|castaway/], ["Courtroom Dramas", /lawyer|attorney|courtroom|\btrial\b/],
    ["Into Space", /\bspace\b|astronaut|\bplanet|galaxy|spaceship/], ["Small-Town Secrets", /small town|village|quiet town/], ["Revenge", /revenge|vengeance|avenge/],
    ["Coming of Age", /coming[- ]of[- ]age|teenager|high school|first love/], ["True Stories", /true story|real[- ]life|based on (the )?(true|real)|incredible story/],
    ["Serial Killers", /serial killer|murder spree/], ["Zombies & Outbreaks", /zombie|outbreak|pandemic|infected/], ["Superheroes", /superhero|super[- ]powered|superpowers|vigilante/],
    ["Martial Arts", /martial art|kung fu|karate|fighter|tournament/], ["Family Secrets", /family secret|dark secret|estranged/], ["Medical Dramas", /\bdoctors?\b|hospital|surgeon|medical/],
    ["Cops & Detectives", /detective|police|\bcop\b|investigat/], ["Mafia & Gangsters", /mafia|gangster|cartel|crime family|mob\b/], ["Haunted", /haunt|ghost|possess|demon/],
    ["Road Trips", /road trip|journey across|on the road/], ["Royals & Empires", /king\b|queen\b|prince|royal|empire|dynasty/], ["Weddings & Romance", /wedding|bride|marriage|engaged/],
    ["Sports Underdogs", /team\b|coach|championship|underdog/], ["Cooking & Food", /chef|cook|restaurant|kitchen|food/], ["Music & Musicians", /band\b|singer|musician|concert|rapper/]];

  // where each profile likes its films and shows from — asked once per profile (env.regions() → ["US","KR",…], [] = everything)
  var REGIONS = [["US", "American", ["US", "CA"]], ["IN", "Indian", ["IN"]], ["KR", "Korean", ["KR"]], ["JP", "Japanese & Anime", ["JP"]], ["GB", "British", ["GB", "IE", "AU", "NZ"]],
    ["EU", "European", ["FR", "ES", "DE", "IT", "SE", "DK", "NO", "FI", "NL", "BE", "PL", "PT", "AT", "CH", "IS"]], ["CN", "Chinese", ["CN", "HK", "TW"]],
    ["LA", "Latin American", ["MX", "AR", "BR", "CO", "CL"]], ["SEA", "Thai & SE Asian", ["TH", "ID", "PH", "MY", "VN", "SG"]], ["TR", "Turkish", ["TR"]]];
  var C2R = {}; REGIONS.forEach(function (r) { r[2].forEach(function (c) { C2R[c] = r[0]; }); });
  var RWORD = { IN: /indian|bollywood|hindi|tamil|telugu|malayalam|kannada|desi|punjabi|marathi|bengali/i, KR: /korean|k-drama|kdrama/i, JP: /japanese|anime/i, GB: /british|\buk\b/i,
    US: /american|hollywood/i, CN: /chinese|c-drama|hong kong/i, TR: /turkish/i, LA: /latin|spanish-language|mexican/i, EU: /european|french|german|italian|spanish|nordic|scandi/i, SEA: /thai|indonesian|filipino/i };
  VE_make.REGIONS = REGIONS;
  VE_make.version = 2;
  function VE_make(env) {
    var openN = ld("open", 0) + 1; sv("open", openN);                // each launch is a new "open"
    var EXP = ld("exp", {}), ROT = ld("rot", {}), today = Math.floor(Date.now() / 864e5);
    var feat = null, recipesCache = null, used = {}, pageRecipes = {};
    function prim(t) { return env.primary ? env.primary(t) : (t.countries || [])[0]; }
    feat = {};
    function fe(t) {   // per-title features, worked out once (warm() does it ahead of time in small slices)
      var f = feat[t.id]; if (f) return f; var d = ((t.desc || "") + " " + (t.title || "")).toLowerCase(), th = [];
      for (var i = 0; i < THEMES.length; i++) if (THEMES[i][1].test(d)) th.push(i);
      return (feat[t.id] = { c: prim(t) || (t.countries || [])[0], th: th });
    }
    function F() { return feat; }
    function ageOf(t) { if (t._va == null) t._va = Math.floor(Date.parse(t.added) / 864e5) || 0; return today - t._va; }
    // the profile's region picks: liked regions float up, the rest sink (but never vanish)
    var RG0 = null, RGsig = "";
    function regs() { var a = env.regions ? env.regions() || [] : [], sig = a.join(","); if (sig !== RGsig || !RG0) { RGsig = sig; RG0 = {}; a.forEach(function (k) { RG0[k] = 1; }); RG0._n = a.length; } return RG0; }
    function regBonus(t) { var R0 = regs(); if (!R0._n) return 0; var c = fe(t).c, k = C2R[c] || "OTHER";
      if (R0[k]) return 1.6; if (R0.JP && (t.genres || []).indexOf("ani") >= 0) return 1.2; return k === "OTHER" ? -0.6 : -1.5; }
    function rowWanted(label) { var R0 = regs(); if (!R0._n) return true; for (var k in RWORD) if (!R0[k] && RWORD[k].test(label)) { var other = false; for (var j in RWORD) if (R0[j] && RWORD[j].test(label)) other = true; if (!other) return false; } return true; }
    function hasG(g) { return function (t) { return (t.genres || []).indexOf(g) >= 0; }; }
    function inC(c) { var a = [].concat(c); return function (t) { return a.indexOf(fe(t).c) >= 0; }; }
    function yr(a, b) { return function (t) { return t.year >= a && t.year <= b; }; }
    function and() { var fs = [].slice.call(arguments); return function (t) { return fs.every(function (f) { return f(t); }); }; }
    var MOV = function (t) { return t.type === "MOVIE"; }, SHO = function (t) { return t.type === "SHOW"; };

    // ---- the pool of row ideas ----
    function recipes() {
      if (recipesCache) return recipesCache; var R = [], Y = new Date().getFullYear();
      function add(key, fam, label, f, sub) { R.push({ key: key, fam: fam, label: label, f: f, sub: sub || null }); }
      Object.keys(GL).forEach(function (g) {
        if (g !== "rly") add("gm_" + g, "genre", GL[g] + (g === "doc" && !/ary$/.test(GL[g]) ? "ary Films" : " Films"), and(MOV, hasG(g)));
        if (g !== "wsn") add("gs_" + g, "genre", g === "rly" ? "Reality TV" : GL[g] + (g === "doc" ? " Series" : " Series"), and(SHO, hasG(g)));
      });
      [["Mind-Bending Sci-Fi", ["scf", "trl"]], ["Date Night", ["rma", "cmy"]], ["True Crime", ["crm", "doc"]], ["Period Dramas", ["hst", "drm"]], ["Crime Comedies", ["crm", "cmy"]],
       ["Action Comedies", ["act", "cmy"]], ["Dark Fantasy", ["fnt", "hrr"]], ["Romantic Dramas", ["rma", "drm"]], ["Supernatural Thrillers", ["hrr", "trl"]], ["Animated Adventures", ["ani", "act"]],
       ["Family Comedies", ["fml", "cmy"]], ["War Dramas", ["war", "drm"]], ["Sci-Fi Action", ["scf", "act"]], ["Crime Thrillers", ["crm", "trl"]], ["Musical Dramas", ["msc", "drm"]]
      ].forEach(function (x, i) { add("mix_" + i, "mood", x[0], function (t) { var g = t.genres || []; return x[1].every(function (c) { return g.indexOf(c) >= 0; }); }); });
      THEMES.forEach(function (x, i) { add("th_" + i, "theme", x[0], function (t) { return fe(t).th.indexOf(i) >= 0; }); });
      CC.forEach(function (c) { var k = [].concat(c[0]).join(""); add("cm_" + k, "country", c[1] + " Films", and(MOV, inC(c[0]))); add("cs_" + k, "country", c[1] + " Series", and(SHO, inC(c[0]))); });
      [[1970, 1989, "Films of the 70s & 80s", "the films people still talk about"], [1990, 1999, "The 90s", "a decade of classics"], [2000, 2009, "The 2000s", "back when DVDs ruled"],
       [2010, 2014, "Early 2010s", null], [2015, 2019, "Late 2010s", null], [Y - 1, Y, "Brand New", "released this year or last"]].forEach(function (d, i) { add("dec_" + i, "era", d[2], yr(d[0], d[1]), d[3]); });
      add("q_master", "quality", "Masterpieces", function (t) { return (t.imdb || 0) >= 8.3 && (t.votes || 0) >= 40000; }, "8.3+ on IMDb");
      add("q_gems", "quality", "Hidden Gems", function (t) { return (t.imdb || 0) >= 7.4 && (t.votes || 0) >= 800 && (t.votes || 0) < 40000; }, "loved by the few who found them");
      add("q_cult", "quality", "Cult Favourites", function (t) { return t.year && t.year < 2006 && (t.votes || 0) >= 120000; });
      add("q_crowd", "quality", "Crowd Pleasers", function (t) { return (t.votes || 0) >= 300000 && (t.imdb || 0) >= 7; });
      add("q_sr", "quality", "Highly Rated Series", function (t) { return t.type === "SHOW" && (t.imdb || 0) >= 8.2; }, "8.2+ on IMDb");
      add("q_fresh", "quality", "Rising Now", function (t) { return t.year >= Y - 2 && (t.imdb || 0) >= 7; }, "new and well reviewed");
      add("len_short", "length", "Under 100 Minutes", function (t) { return t.type === "MOVIE" && t.runtime && t.runtime < 100; }, "for a short evening");
      add("len_epic", "length", "Epics", function (t) { return t.type === "MOVIE" && t.runtime >= 150; }, "2½ hours or more");
      add("len_lim", "length", "Limited Series", function (t) { return t.type === "SHOW" && t.seasons === 1 && t.eps && t.eps <= 10; }, "a beginning, a middle and an end");
      add("len_long", "length", "Long-Running Series", function (t) { return t.type === "SHOW" && t.seasons >= 5; }, "something to settle into");
      add("x_newv", "discover", "New to Vesper", function (t) { return t.added && ageOf(t) <= 4 && (t.imdb || 6.5) >= 6.2; }, "just joined the catalogue");
      add("x_world", "discover", "Around the World", function (t) { var c = fe(t).c; return c && ["US", "IN", "GB"].indexOf(c) < 0 && (t.imdb || 0) >= 7; }, "great titles from everywhere else");
      add("x_old", "discover", "From the Archives", function (t) { return t.year && t.year < 1996; });
      recipesCache = R; return R;
    }
    // people spotlights: a director or an actor with several titles here (different one each open)
    var PEOP = {};
    function people(pool, r, sec) {
      var pm = PEOP[sec]; if (!pm) { pm = PEOP[sec] = { dir: {}, cast: {} }; var dir = pm.dir, cast = pm.cast; pool.forEach(function (t) { (t.dirs || []).slice(0, 2).forEach(function (n) { (dir[n] = dir[n] || []).push(t); }); (t.cast || []).slice(0, 3).forEach(function (n) { (cast[n] = cast[n] || []).push(t); }); });
        Object.keys(dir).forEach(function (k) { if (dir[k].length < 4) delete dir[k]; }); Object.keys(cast).forEach(function (k) { if (cast[k].length < 6) delete cast[k]; }); }
      var dir = pm.dir, cast = pm.cast;
      function pick(m, min) { var ks = Object.keys(m).filter(function (k) { return m[k].length >= min; }); return ks.length ? ks[Math.floor(r() * ks.length)] : null; }
      var out = [], d = pick(dir, 4), a = pick(cast, 6);
      if (d) out.push({ key: "p_d_" + d, fam: "people", label: "Directed by " + d, items: dir[d] });
      if (a) out.push({ key: "p_a_" + a, fam: "people", label: "Starring " + a, items: cast[a] });
      return out;
    }
    // your taste: "because you liked X" from a different liked/saved title each open
    function becauseRow(pool, r) {
      var seeds = (env.seeds ? env.seeds() : []).filter(Boolean); if (!seeds.length) return null;
      var s = seeds[Math.floor(r() * Math.min(seeds.length, 12))], g = s.genres || [], c = prim(s);
      var l = pool.filter(function (t) { return t.id !== s.id && (t.genres || []).filter(function (x) { return g.indexOf(x) >= 0; }).length >= 2 && (!c || prim(t) === c || g.indexOf("ani") < 0); });
      return l.length >= 8 ? { key: "because", fam: "taste", label: "Because you liked " + s.title, items: l } : null;
    }

    // ---- ranking inside a row: quality + your taste + newness to you + a little chance ----
    function score(t, r) {
      var e = EXP[t.id], pen = 0;
      if (e) { var age = today - e[1]; pen = Math.min(6, e[0] * 1.6) * Math.exp(-age / 4); }
      var q = qual(t);
      var ts = TS[t.id]; if (ts == null) ts = TS[t.id] = env.tasteScore ? Math.max(-2, Math.min(3, env.tasteScore(t) || 0)) * 0.6 : 0;   // remembered for this session
      return q + ts + regBonus(t) - pen + (e ? 0 : 0.7) + (t.added && ageOf(t) <= 3 ? 0.9 : 0) + r() * 2.4;
    }
    function rank(items, r, n) {
      var hid = env.hidden ? env.hidden() : {};
      // big lists: the best few hundred plus a random sample of the rest (keeps surprises, a fraction of the work)
      if (items.length > 420) { var top = items.slice(0, 260), rest = items.slice(260), pick = []; for (var k = 0; k < 160; k++) pick.push(rest[Math.floor(r() * rest.length)]); items = top.concat(pick); }
      return items.filter(function (t) { return t && !hid[t.id] && !used[t.id] && (t.avail || []).length; })
        .map(function (t) { return { t: t, s: score(t, r) }; }).sort(function (a, b) { return b.s - a.s; }).slice(0, n || 28).map(function (o) { return o.t; });
    }

    // ---- what each section is about ----
    function scopeOf(sec) {
      var m;
      if (sec === "movies") return { f: MOV, no: { genre: 0 } }; if (sec === "shows") return { f: SHO };
      if (sec === "anime") return { f: hasG("ani"), no: { country: 1 } };
      if (sec === "korean") return { f: inC("KR"), no: { country: 1 } }; if (sec === "english") return { f: inC("US"), no: { country: 1 } };
      if (sec === "uk") return { f: inC(["GB", "IE"]), no: { country: 1 } }; if (sec === "indian") return { f: inC("IN"), no: { country: 1 } };
      if (sec === "world") return { f: function (t) { var c = fe(t).c; return c && ["US", "IN", "GB", "KR", "JP"].indexOf(c) < 0; } };
      if (sec === "new") { var Y = new Date().getFullYear(); return { f: function (t) { return t.year >= Y - 2; }, no: { era: 1 } }; }
      if ((m = /^app:(.+)$/.exec(sec))) return { f: function (t) { return (t.avail || []).indexOf(m[1]) >= 0; } };
      if (/^(home|collections|weather)$/.test(sec)) return { f: function () { return true; } };
      return null;   // other pages (search, my list, throwback, time…) keep their own rows
    }
    var POOLC = {}, RC = {}, RG = {}, TS = {};
    function qual(t) { return t._vq != null ? t._vq : (t._vq = (t.imdb || 6.3) + Math.log(((t.votes || 0) + 10)) / Math.LN10 * 0.55); }
    function allOf(x) { return RG[x.key] || (RG[x.key] = env.all().filter(function (t) { return (t.avail || []).length && x.f(t); }).sort(function (a, b) { return qual(b) - qual(a); })); }
    // do the heavy lifting early, a slice at a time, only while the viewer isn't pressing anything
    function warm(idle, done) {
      var all = env.all(), i = 0, rs = recipes(), k = 0, w0 = Date.now(), WS = ["home", "movies", "shows"], ws = 0;
      (function step() { idle(function () {
        var t0 = Date.now();
        while (i < all.length && Date.now() - t0 < 12) fe(all[i++]);
        while (i >= all.length && k < rs.length && Date.now() - t0 < 12) allOf(rs[k++]);
        while (i >= all.length && k >= rs.length && ws < WS.length && Date.now() - t0 < 12) { var sc0 = scopeOf(WS[ws]); if (sc0) { var pl = poolOf(WS[ws], sc0); people(pl, rnd(1), WS[ws]); pl.slice(0, 4000).forEach(function (t) { if (TS[t.id] == null) TS[t.id] = env.tasteScore ? Math.max(-2, Math.min(3, env.tasteScore(t) || 0)) * 0.6 : 0; }); } ws++; }
        if (i < all.length || k < rs.length || ws < WS.length) setTimeout(step, 30); else { api.warmed = Date.now() - w0; if (done) done(); }
      }); })();
    }
    function poolOf(sec, sc) { return POOLC[sec] || (POOLC[sec] = env.all().filter(function (t) { return (t.avail || []).length && sc.f(t); })); }
    // pick rows for this open: weighted by fit and by how long since you saw that idea, a different mix every time
    function pickRecipes(sec, sc, pool, n, r, skip) {
      var T = env.tasteGenres ? env.tasteGenres() : {}, rot = ROT[sec] || {};
      var cands = recipes().filter(function (x) { return !skip[x.key] && !(sc.no && sc.no[x.fam]); }).map(function (x) {
        var ck = sec + "|" + x.key, items = RC[ck] || (RC[ck] = sec === "home" || sec === "collections" || sec === "weather" ? allOf(x) : allOf(x).filter(sc.f)); if (items.length < 10) return null;
        var last = rot[x.key], gap = last == null ? 99 : openN - last, w = gap <= 1 ? 0.12 : gap <= 3 ? 0.45 : 1;
        var gs = x.key.slice(0, 3) === "gm_" || x.key.slice(0, 3) === "gs_" ? x.key.slice(3) : null; if (gs && T[gs]) w *= 1 + Math.min(1.5, T[gs]);
        if (!rowWanted(x.label)) w *= 0.08; else if (x.fam === "country" && regs()._n) w *= 2.4;
        return { x: x, items: items, w: w * (0.6 + r()) * (x.fam === "theme" || x.fam === "mood" ? 1.25 : 1) };
      }).filter(Boolean);
      var out = [], famN = {};
      while (out.length < n && cands.length) {
        var tot = cands.reduce(function (a, c) { return a + c.w; }, 0), p = r() * tot, i = 0;
        for (; i < cands.length - 1; i++) { p -= cands[i].w; if (p <= 0) break; }
        var c = cands.splice(i, 1)[0]; if ((famN[c.x.fam] || 0) >= (c.x.fam === "genre" ? 4 : 3)) continue;
        famN[c.x.fam] = (famN[c.x.fam] || 0) + 1; out.push(c);
      }
      // no two rows of the same kind next to each other
      for (var k = 1; k < out.length; k++) if (out[k].x.fam === out[k - 1].x.fam) { for (var j = k + 1; j < out.length; j++) if (out[j].x.fam !== out[k - 1].x.fam) { var tmp = out[k]; out[k] = out[j]; out[j] = tmp; break; } }
      return out;
    }
    function build(sec, n) {
      var sc = scopeOf(sec); if (!sc) return [];
      var pool = poolOf(sec, sc), r = rnd(hash(sec) ^ (openN * 2654435761) ^ (n * 97)), rows = [], skip = pageRecipes[sec] || (pageRecipes[sec] = {});
      var extra = (n >= 6 ? people(pool, r, sec).concat([becauseRow(pool, r)]) : []).filter(function (x) { return x && !skip[x.key]; });
      var picked = pickRecipes(sec, sc, pool, n - extra.length, r, skip);
      extra.forEach(function (e, i) { picked.splice(Math.min(picked.length, 3 + i * 5), 0, { x: e, items: e.items }); });
      var rot = ROT[sec] || (ROT[sec] = {});
      picked.forEach(function (c) {
        skip[c.x.key] = 1; rot[c.x.key] = openN;
        var items = rank(c.items, r, 28); if (items.length < 8) return;
        items.slice(0, 10).forEach(function (t) { used[t.id] = 1; var e = EXP[t.id] || (EXP[t.id] = [0, today]); e[0]++; e[1] = today; });
        rows.push(env.R(c.x.label, items, null, c.x.sub, 8));
      });
      saveLater(); return rows;
    }
    var st = null; function saveLater() { clearTimeout(st); st = setTimeout(function () {
      var ks = Object.keys(EXP); if (ks.length > 6000) ks.sort(function (a, b) { return EXP[a][1] - EXP[b][1]; }).slice(0, ks.length - 5000).forEach(function (k) { delete EXP[k]; });
      sv("exp", EXP); sv("rot", ROT); }, 1500); }

    var api = {
      // a section's rows: its own first few (Top 10, Continue, My List…), then a fresh mix of ideas woven with the rest
      expand: function (sec, rows) {
        if (!scopeOf(sec) || !rows) return rows;
        used = {}; pageRecipes[sec] = {};
        var keepN = sec === "home" ? 5 : 3, head = rows.slice(0, keepN), rest = rows.slice(keepN), r = rnd(hash(sec + "w") ^ openN);
        head = head.filter(function (x) { return !x || !x.title || rowWanted(x.title); });
        rest = rest.filter(function (x) { return r() < 0.45 && (!x || !x.title || rowWanted(x.title)); }).slice(0, sec === "home" ? 6 : 4);   // some of the usual rows, different ones each time
        var fresh = build(sec, sec === "home" ? 18 : 14), out = head.slice(), i = 0, j = 0;
        while (i < fresh.length || j < rest.length) { if (i < fresh.length) out.push(fresh[i++]); if (i < fresh.length) out.push(fresh[i++]); if (j < rest.length) out.push(rest[j++]); }
        return out;
      },
      // endless: more fresh rows when you reach the bottom
      more: function (sec, n) { return scopeOf(sec) ? build(sec, n || 6) : []; },
      // a fresh billboard pick for a section
      warm: function (idle, done) { warm(idle || function (f) { f(); }, done); },
      heroPool: function (sec) { var sc = scopeOf(sec); if (!sc) return null; var r = rnd(hash(sec + "h") ^ openN); return rank(poolOf(sec, sc).filter(function (t) { return (t.imdb || 0) >= 7 && t.backdrop; }), r, 12); },
      open: openN,
      reset: function () { RG0 = null; }
    };
    return api;
  }
  G.VEMake = VE_make;
})(typeof window !== "undefined" ? window : globalThis);
