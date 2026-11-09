/* Vesper for Mac — catalog shaping shared by the main window and the menu bar mini.
   Turns the raw catalog into rows (Home, New & Hot, Weather, Moods, Collections…), search results and play links. */
(function (G) {
  "use strict";
  var IMG = "https://images.justwatch.com", YEAR = new Date().getFullYear();
  var APPS = ["netflix", "amazon", "hotstar", "com.apple.appletv", "com.crunchyroll.webapp"];
  var PRIORITY = ["netflix", "amazon", "com.apple.appletv", "hotstar", "com.crunchyroll.webapp"];
  var LABEL = { netflix: "Netflix", amazon: "Prime Video", hotstar: "JioHotstar", "com.apple.appletv": "Apple TV+", "com.crunchyroll.webapp": "Crunchyroll" };
  var LOGO = { netflix: "logos/netflix.png", amazon: "logos/amazon.png", hotstar: "logos/hotstar.png", "com.apple.appletv": "logos/apple.png", "com.crunchyroll.webapp": "logos/crunchyroll.png" };
  var OCLS = { netflix: "netflix", amazon: "amazon", hotstar: "hotstar", "com.apple.appletv": "apple", "com.crunchyroll.webapp": "crunchyroll" };
  var ORIG = { netflix: "Netflix Original", amazon: "Prime Original", hotstar: "Only on JioHotstar", "com.apple.appletv": "Apple Original", "com.crunchyroll.webapp": "Crunchyroll Original" };
  var ORIG_ROW = { netflix: "Netflix Originals", amazon: "Prime Video Originals", hotstar: "Only on JioHotstar", "com.apple.appletv": "Apple TV+ Originals", "com.crunchyroll.webapp": "Crunchyroll Originals" };
  var GENRES = { act: "Action", ani: "Anime & Animation", cmy: "Comedy", crm: "Crime", doc: "Documentary", drm: "Drama", eur: "European", fml: "Family", fnt: "Fantasy",
    hrr: "Horror", hst: "History", msc: "Music", rly: "Reality", rma: "Romance", scf: "Sci-Fi", spt: "Sport", trl: "Thriller", war: "War", wsn: "Western" };
  var GENRE_ROWS = [["act", "Action & Adventure"], ["cmy", "Comedy"], ["trl", "Thrillers"], ["crm", "Crime"], ["rma", "Romance"], ["scf", "Sci-Fi & Fantasy"],
    ["hrr", "Horror"], ["drm", "Drama"], ["fml", "Family Time"], ["doc", "Documentaries"]];

  var V = { CAT: null, ALL: [], T: {}, state: {}, LABEL: LABEL, LOGO: LOGO, OCLS: OCLS, ORIG: ORIG, GENRES: GENRES, APPS: APPS };

  V.load = function (cat) {
    V.CAT = cat; V.T = {};
    V.ALL = (cat.titles || []).filter(function (t) { return t.backdrop; });
    V.ALL.forEach(function (t) { V.T[t.id] = t; });
    NAMES = null;
  };
  // personal things live per profile ("mylist@p2"); settings like weather and favourite service are shared
  var PERSONAL = { mylist: 1, watched: 1, recent: 1, queries: 1, likes: 1, dislikes: 1, viewed: 1, shown: 1, trios: 1, lastHero: 1, regions: 1 };
  V.key = function (k) { return PERSONAL[k] && V.state.profile ? k + "@" + V.state.profile : k; };
  function list(k) { return V.state[V.key(k)] || []; }
  V.list = list;
  V.pref = function (k, d) { var p = V.state.prefs || {}; return p[k] != null ? p[k] : d; };

  // ---------- images, apps, play links ----------
  V.bd = function (t, size) { return t && t.backdrop ? IMG + t.backdrop.replace("{profile}", size || "s1440") : null; };
  V.po = function (t, size) { return t && t.poster ? IMG + t.poster.replace("{profile}", size || "s592") : null; };
  V.pickApp = function (t) {
    var a = t.avail || [], fav = V.pref("app", "auto");
    if (fav !== "auto" && a.indexOf(fav) >= 0) return fav;
    for (var i = 0; i < PRIORITY.length; i++) if (a.indexOf(PRIORITY[i]) >= 0) return PRIORITY[i];
    return null;
  };
  // the exact title on the service's own website
  V.playUrl = function (app, t) {
    var l = (t.links || {})[app] || {}, id = l.id;
    if (app === "netflix") return id ? "https://www.netflix.com/watch/" + id : (l.url || "https://www.netflix.com/browse").replace(/^http:/, "https:");
    if (app === "amazon") return id ? "https://www.primevideo.com/detail/" + id + "/" : "https://www.primevideo.com/";
    if (app === "com.apple.appletv") { var u = l.url || "https://tv.apple.com/in"; var sid = u.match(/showId=(umc\.cmc\.[a-z0-9]+)/i);
      if (t.type === "SHOW" && sid) return "https://tv.apple.com/in/show/" + sid[1]; return u.split("?")[0]; }
    if (app === "hotstar") return l.url || "https://www.hotstar.com/in/home";
    if (app === "com.crunchyroll.webapp") return l.url || "https://www.crunchyroll.com/";
    return l.url || null;
  };

  // ---------- shaping ----------
  function ids(a) { return (a || []).map(function (id) { return V.T[id]; }).filter(Boolean); }
  V.ids = ids;
  var SEG_CC = { us_m: "US", us_s: "US", gb_m: "GB", gb_s: "GB", kr_s: "KR", kr_m: "KR", in_m: "IN", in_s: "IN", ani_s: "JP", ani_m: "JP", jp_live: "JP" };
  function seg(k) { var l = ids(((V.CAT.segs || {})[k] || { ids: [] }).ids), cc = SEG_CC[k]; l = cc ? l.filter(from(cc)) : l;
    return k === "ani_m" ? l.filter(function (t) { return (t.countries || []).indexOf("US") < 0; }) : l; }
  function byPop(a) { return a.slice().sort(function (x, y) { return y.pop - x.pop; }); }
  function quality(t) { return (t.imdb || 6) * 10 + Math.log(1 + t.votes) + Math.log(1 + t.pop) * 2; }
  function byQ(a) { return a.slice().sort(function (x, y) { return quality(y) - quality(x); }); }
  function good(t) { return t.votes >= (t.type === "SHOW" ? 2500 : 8000) && (t.imdb || 0) >= 7.4; }
  function topRated(a) { return a.filter(good).sort(function (x, y) { return (y.imdb - x.imdb) || (y.votes - x.votes); }); }
  function fresh(a) { return byPop(a.filter(function (t) { return t.year >= YEAR - 1; })); }
  function gems(a) { return a.filter(function (t) { return (t.imdb || 0) >= 7.6 && t.votes >= 4000 && t.votes < 90000; }).sort(function (x, y) { return x.pop - y.pop; }).slice(0, 40); }
  function classics(a) { return byPop(a.filter(function (t) { return t.year && t.year < 1998 && (t.imdb || 0) >= 7.6 && t.votes >= 20000; })); }
  function isType(ty) { return function (t) { return t.type === ty; }; }
  function hasG() { var a = arguments; return function (t) { for (var i = 0; i < a.length; i++) if ((t.genres || []).indexOf(a[i]) >= 0) return true; return false; }; }
  function not(f) { return function (t) { return !f(t); }; }
  function primary(t) { var c = t.countries || []; return c.indexOf("IN") >= 0 ? "IN" : c.indexOf("KR") >= 0 ? "KR" : c.indexOf("JP") >= 0 ? "JP" : null; }
  function from(cc) { return function (t) { var p = primary(t); return cc === "IN" || cc === "KR" || cc === "JP" ? p === cc : (!p && (t.countries || []).indexOf(cc) >= 0); }; }
  function on(app) { return function (t) { return (t.avail || []).indexOf(app) >= 0; }; }
  function origOf(app) { return byPop(V.ALL.filter(function (t) { return t.orig === app && (t.avail || []).indexOf(app) >= 0; })); }
  function topList(type) { return ids(((V.CAT.top10 || {})[type === "SHOW" ? "shows" : "movies"]) || []); }
  function arrivals(f) { var out = [], seen = {}; (V.CAT.arrivals || []).forEach(function (a) { var t = V.T[a.id]; if (t && !seen[t.id] && (!f || f(a, t))) { seen[t.id] = 1; out.push(t); } }); return out; }
  function comingSoon() { return (V.CAT.soon || []).map(function (x) { return V.T[x.id]; }).filter(Boolean); }
  V.soonOf = function (t) { var s = (V.CAT.soon || []).filter(function (x) { return x.id === t.id; })[0]; return s || null; };
  V.arrivalOf = function (t) { var a = (V.CAT.arrivals || []).filter(function (x) { return x.id === t.id; })[0]; return a || null; };
  function binge(l) { return byPop((l || V.ALL).filter(function (t) { return t.type === "SHOW" && t.seasons === 1 && t.eps && t.eps <= 10 && (t.imdb || 0) >= 7; })); }
  function shortFilms(l) { return byPop((l || V.ALL).filter(function (t) { return t.type === "MOVIE" && t.runtime && t.runtime <= 100 && (t.imdb || 0) >= 6.8 && t.votes >= 5000; })); }
  function masterpieces() { return byQ(V.ALL.filter(function (t) { return (t.imdb || 0) >= 8.3 && t.votes >= 100000; })); }
  function similar(t, n) { var g = t.genres || [], cc = t.countries || [];
    return V.ALL.filter(function (x) { return x.id !== t.id && (x.avail || []).length; }).map(function (x) {
      var sh = (x.genres || []).filter(function (c) { return g.indexOf(c) >= 0; }).length, sc = (x.countries || []).some(function (c) { return cc.indexOf(c) >= 0; }) ? 6 : 0;
      return { x: x, s: sh * 10 + sc + (x.type === t.type ? 5 : 0) + (x.imdb || 0) + Math.min(8, Math.log(1 + x.votes) / 1.6), sh: sh }; })
      .filter(function (o) { return o.sh > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, n || 30).map(function (o) { return o.x; }); }
  V.similar = similar;
  function topPicks(n) { var seeds = ids(list("mylist").concat(list("recent"))).slice(0, 8); if (!seeds.length) return [];
    var score = {}, hide = {}; seeds.forEach(function (s) { hide[s.id] = 1; });
    seeds.forEach(function (s, i) { similar(s, 40).forEach(function (x, j) { if (!hide[x.id]) score[x.id] = (score[x.id] || 0) + (40 - j) * (1 - i * 0.08); }); });
    return Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, n || 40).map(function (id) { return V.T[id]; }); }
  var FRANCHISES = [["Harry Potter", "^Harry Potter|^Fantastic Beasts"], ["Star Wars", "Star Wars|^Andor$|The Mandalorian|Obi-Wan"], ["Mission: Impossible", "^Mission: Impossible"], ["John Wick", "John Wick"],
    ["Fast & Furious", "Fast (&|and) (the )?Furious|^Fast X|^Furious 7|^F9|^2 Fast|Hobbs & Shaw|^Fast Five"], ["Middle-earth", "Lord of the Rings|^The Hobbit"], ["Jurassic", "^Jurassic"], ["Spider-Man", "Spider-Man"],
    ["The Avengers", "Avengers"], ["Batman", "Batman|The Dark Knight"], ["Toy Story", "^Toy Story"], ["Pirates of the Caribbean", "Pirates of the Caribbean"], ["Bourne", "Bourne"],
    ["James Bond", "Casino Royale|Quantum of Solace|^Skyfall|^Spectre$|No Time to Die"], ["Dune", "^Dune"], ["The Hunger Games", "Hunger Games|Mockingjay|Catching Fire"], ["Shrek", "^Shrek"],
    ["The Matrix", "^The Matrix"], ["The Godfather", "^The Godfather"], ["How to Train Your Dragon", "How to Train Your Dragon"], ["The Conjuring Universe", "Conjuring|^Annabelle|^The Nun"],
    ["Twilight", "^Twilight|^The Twilight Saga"], ["Dragon Ball", "^Dragon Ball"], ["Naruto", "^Naruto|^Boruto"], ["Demon Slayer", "Demon Slayer|Kimetsu no Yaiba"], ["Star Trek", "^Star Trek"],
    ["Baahubali", "Baahubali|Bahubali"], ["Drishyam", "^Drishyam"], ["Planet of the Apes", "Planet of the Apes"], ["Rocky & Creed", "^Rocky|^Creed"]];
  function franchiseRows(min) { var rows = []; FRANCHISES.forEach(function (f) { var re = new RegExp(f[1], "i");
    var l = V.ALL.filter(function (t) { return re.test(t.title) && (t.avail || []).length; }).sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
    if (l.length >= (min || 3)) rows.push(R(f[0], l, null, "in watch order", 3)); }); return rows; }
  function directorRows(n) { var m = {}; V.ALL.forEach(function (t) { if (t.type !== "MOVIE") return; var d = (t.dirs || [])[0]; if (d) (m[d] = m[d] || []).push(t); });
    return Object.keys(m).filter(function (d) { return m[d].length >= 4; }).map(function (d) { return { d: d, l: m[d], s: m[d].reduce(function (a, t) { return a + quality(t); }, 0) }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, n || 10).map(function (o) { return R("Directed by " + o.d, byQ(o.l), null, "spotlight", 4); }); }
  function dayPick(l, salt) { if (!l.length) return null; var d = new Date(); return l[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate() + (salt || 0)) % l.length]; }
  V.dayPick = dayPick;

  // ---------- weather moods: a curated worldwide library (catalog.wx) topped up by smart matching ----------
  var NORTH = ["GB", "IE", "DE", "NO", "SE", "DK", "IS", "FI", "BE", "NL", "PL", "CA", "KR", "JP", "FR", "ES", "AT", "CH"];
  var WX = [
    { k: "rain", n: "Rainy & Gloomy", d: "Grey skies, rain on the window, stories with an ache.", tag: "r", re: /\b(rain|storm|grey|gray|gloom|melanchol|fog|mist|drizzl|small town|disappear|missing|murder|detective|haunt|grief|lonel|winter|secret)/i, g: ["crm", "trl", "drm"], cc: NORTH },
    { k: "cold", n: "Cold & Wet", d: "Windswept coasts, winter rain and long nights.", tag: "c", re: /\b(winter|cold|snow|ice|frozen|north|arctic|freez|blizzard|island|coast|sea|fisherm|rain|storm|wind|mountain)/i, g: ["drm", "crm", "trl"], cc: ["GB", "IE", "NO", "SE", "DK", "IS", "FI", "CA", "DE", "PL"] },
    { k: "fog", n: "Dark & Foggy", d: "Mist, dread and places that keep their secrets.", tag: "f", re: /\b(fog|mist|forest|woods|lake|dark|secret|cult|buried|haunt|vanish|curse|isolat)/i, g: ["trl", "hrr", "drm", "fnt"], cc: NORTH },
    { k: "myst", n: "Foggy Mysteries", d: "Whodunits and small towns where everyone's hiding something.", tag: "f", gen: ["crm", "trl"], re: /\b(murder|detective|investigat|missing|disappear|small town|village|whodunit|killer|suspect|inspector)/i, g: ["crm", "trl"], cc: NORTH },
    { k: "snow", n: "Cold & Snowy Noir", d: "Nordic chills and crimes in the snow.", tag: "s", re: /\b(snow|winter|frozen|ice|blizzard|cold|arctic|alaska|minnesota|norw|iceland|swed|finland|siberia|copenhagen|oslo|stockholm)/i, g: ["crm", "trl"], cc: ["NO", "SE", "DK", "IS", "FI", "CA"] },
    { k: "magic", n: "Magic for Grey Days", d: "Wizards, witches and spellbound schools.", tag: "m", re: /\b(witch|wizard|magic|sorcer|spell|school|academy|fairy|curse|dragon|enchant|prophecy|realm)/i, g: ["fnt"], cc: ["GB", "US", "NZ", "IE"], not: ["rly", "doc"] },
    { k: "vamp", n: "Dark Romance & Vampires", d: "Gothic love, vampires and longing.", tag: "v", re: /\b(vampire|werewolf|immortal|forbidden|gothic|obsess|haunt|undead|blood|longing|governess|estate|duke)/i, g: ["rma", "fnt", "hrr"], cc: ["GB", "US", "IE"] },
    { k: "storm", n: "Stormy Nights", d: "Haunted houses and gothic chills for thunderous nights.", tag: "t", re: /\b(haunt|ghost|possess|storm|gothic|curse|demon|mansion|night|evil|exorc)/i, g: ["hrr"], cc: NORTH, imdb: 6.3 },
    { k: "city", n: "Rain-Soaked Cities", d: "Neon, rain and detectives working the dark.", tag: "n", re: /\b(noir|detective|serial killer|cop|police|neon|gang|corrupt|underworld|vigilante)/i, g: ["crm", "trl"], cc: ["US", "KR", "JP", "GB"] },
    { k: "anime", n: "Rainy-Day Anime", d: "Melancholy, mystery and rain-swept anime.", tag: "a", gen: ["ani"], re: /\b(rain|melanchol|mystery|dark|psycholog|death|lonel|memor|time|detective)/i, g: ["trl", "drm", "rma"], cc: ["JP"] }];
  var WXK = {}; WX.forEach(function (m) { WXK[m.k] = m; });
  V.WX = WX; V.WXK = WXK;
  function wxScore(t, m) { var txt = t.title + " " + (t.desc || ""), s = 0, gs = t.genres || [];
    if (m.re && m.re.test(txt)) s += 6;
    (m.g || []).forEach(function (x) { if (gs.indexOf(x) >= 0) s += 3; });
    if (m.cc && (t.countries || []).some(function (c) { return m.cc.indexOf(c) >= 0; })) s += 3;
    if (gs.indexOf("cmy") >= 0 && gs.indexOf("drm") < 0) s -= 6;
    ["rly", "spt", "fml"].concat(m.not || []).forEach(function (x) { if (gs.indexOf(x) >= 0) s -= 8; });
    return s; }
  var wxCache = {};
  function wxRow(k, n) { var key = k + "|" + (n || 40) + "|" + (V.CAT && V.CAT.generated); if (wxCache[key]) return wxCache[key];
    var m = WXK[k], seen = {}, out = []; if (!m) return [];
    ids((V.CAT.wx || {})[m.tag] || []).forEach(function (t) { if (m.gen && !m.gen.some(function (g) { return (t.genres || []).indexOf(g) >= 0; })) return; if (!seen[t.id]) { seen[t.id] = 1; out.push(t); } });
    V.ALL.filter(function (t) { return !seen[t.id] && (t.avail || []).length && (t.imdb || 0) >= (m.imdb || 6.6) && t.votes >= 3000 && (!m.gen || m.gen.some(function (g) { return (t.genres || []).indexOf(g) >= 0; })); })
      .map(function (t) { return { t: t, s: wxScore(t, m) }; }).filter(function (o) { return o.s >= 12; })
      .sort(function (a, b) { return (b.s - a.s) || (quality(b.t) - quality(a.t)); }).forEach(function (o) { out.push(o.t); });
    return (wxCache[key] = out.slice(0, n || 40)); }
  V.wxRow = wxRow;
  function wxRegion(ccs, ex) { var seen = {}, pool = []; ["rain", "fog", "cold", "myst", "snow", "storm"].forEach(function (k) { wxRow(k, 80).forEach(function (t) { if (!seen[t.id]) { seen[t.id] = 1; pool.push(t); } }); });
    return pool.filter(function (t) { var c = t.countries || []; return c.some(function (x) { return ccs.indexOf(x) >= 0; }) && !(ex && c.some(function (x) { return ex.indexOf(x) >= 0; })); }); }

  // live weather → a mood. Content always comes from everywhere; the place only picks the KIND of weather.
  V.PLACES = [{ name: "Seattle", country: "United States", lat: 47.61, lon: -122.33 }, { name: "Bergen", country: "Norway", lat: 60.39, lon: 5.32 },
    { name: "Edinburgh", country: "Scotland", lat: 55.95, lon: -3.19 }, { name: "London", country: "England", lat: 51.51, lon: -0.13 },
    { name: "Reykjavík", country: "Iceland", lat: 64.15, lon: -21.94 }, { name: "Dublin", country: "Ireland", lat: 53.35, lon: -6.26 },
    { name: "Vancouver", country: "Canada", lat: 49.28, lon: -123.12 }, { name: "Copenhagen", country: "Denmark", lat: 55.68, lon: 12.57 },
    { name: "Tromsø", country: "Norway", lat: 69.65, lon: 18.96 }, { name: "Zurich", country: "Switzerland", lat: 47.37, lon: 8.54 }, { name: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69 }];
  V.place = function () { return V.pref("place", null) || V.PLACES[0]; };
  V.WXMODES = [["live", "Live weather"], ["rain", "Rainy day"], ["grey", "Grey skies"], ["fog", "Foggy"], ["cold", "Cold & wet"], ["snow", "Snowy"], ["storm", "Stormy night"], ["off", "Off"]];
  var KIND_MOOD = { rain: "rain", drizzle: "rain", grey: "rain", fog: "fog", cold: "cold", snow: "snow", storm: "storm" };
  function partOfDay() { var h = new Date().getHours(); return h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 23 ? "evening" : "night"; }
  V.partOfDay = partOfDay;
  function kindOf(c, temp, cloud) {
    if (c >= 95) return "storm"; if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return "rain"; if (c >= 51 && c <= 57) return "drizzle";
    if (c === 45 || c === 48) return "fog"; if (temp != null && temp < 12) return "cold";
    if (c === 3 || (cloud != null && cloud >= 70)) return "grey"; return null; }
  var KTITLE = { rain: "Rainy Day", drizzle: "Drizzle & Gloom", grey: "Grey Skies", cold: "Cold & Wet", snow: "Snowfall", storm: "Stormy Night" };
  var HERO = { rain: "For a rainy day", drizzle: "For drizzle & gloom", grey: "For grey skies", cold: "For cold & wet days", snow: "For snowfall", storm: "For a stormy night" };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  V.wxWords = function (c) { return c >= 95 ? "Thunderstorm" : c >= 80 ? "Showers" : c >= 71 ? "Snow" : c >= 61 ? "Rain" : c >= 51 ? "Drizzle" : c >= 45 ? "Fog" : c === 3 ? "Overcast" : c === 2 ? "Partly cloudy" : c === 1 ? "Mostly clear" : "Clear"; };
  V.wxLive = function () { var L = V.state.wxlive, p = V.place(); return L && L.place === p.name && Date.now() - L.at < 3 * 3600e3 ? L : null; };
  // what the weather says right now: {k: mood key, title, sub, hero, kind}
  V.wxNow = function () { var mode = V.pref("wx", "live"); if (mode === "off") return null;
    var kd = mode;
    if (mode === "live") { var L = V.wxLive(); kd = L ? kindOf(L.code, L.temp, L.cloud) : null;
      if (!kd) { var h = new Date().getHours(); kd = h >= 18 || h < 6 ? "fog" : "grey"; L = L || null; } }
    var mk = KIND_MOOD[kd]; if (!mk) return null;
    var title = kd === "fog" ? "Foggy " + cap(partOfDay()) : KTITLE[kd], L2 = V.wxLive();
    return { k: mk, kind: kd, title: title, hero: kd === "fog" ? "For a foggy " + partOfDay() : HERO[kd],
      sub: (title === WXK[mk].n ? WXK[mk].d : WXK[mk].n) + (mode === "live" && L2 ? "  ·  live from " + L2.place + ", " + Math.round(L2.temp) + "°" : "") }; };
  V.fetchWeather = function (force) {
    if (V.pref("wx", "live") !== "live") return Promise.resolve(null);
    var p = V.place(), L = V.state.wxlive;
    if (!force && L && L.place === p.name && Date.now() - L.at < 30 * 60000) return Promise.resolve(L);
    function save(temp, code, cloud) { var o = { place: p.name, temp: temp, code: code, cloud: cloud, at: Date.now() }; V.set("wxlive", o); return o; }
    return G.vesperFetch("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lon + "&current=temperature_2m,weather_code,cloud_cover&timezone=auto")
      .then(function (j) { if (!j || !j.current) throw 0; return save(j.current.temperature_2m, j.current.weather_code, j.current.cloud_cover); })
      .catch(function () {
        return G.vesperFetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=" + p.lat.toFixed(3) + "&lon=" + p.lon.toFixed(3)).then(function (j) {
          var ts = j.properties.timeseries[0].data, det = ts.instant.details, sym = ((ts.next_1_hours || ts.next_6_hours || {}).summary || {}).symbol_code || "";
          var code = /thunder/.test(sym) ? 95 : /snow|sleet/.test(sym) ? 73 : /heavyrain/.test(sym) ? 65 : /showers/.test(sym) ? 80 : /lightrain/.test(sym) ? 61 : /rain/.test(sym) ? 63 : /fog/.test(sym) ? 45 : /^cloudy/.test(sym) ? 3 : /partlycloudy/.test(sym) ? 2 : /fair/.test(sym) ? 1 : 0;
          return save(det.air_temperature, code, det.cloud_area_fraction); }).catch(function () { return null; }); }); };
  V.searchPlaces = function (q) {
    return G.vesperFetch("https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&name=" + encodeURIComponent(q)).then(function (j) {
      return (j.results || []).map(function (r) { return { name: r.name, country: [r.admin1, r.country].filter(Boolean).join(", "), lat: r.latitude, lon: r.longitude }; }); }); };

  // ---------- moods ----------
  function M(id, name, desc, fn) { return { id: id, name: name, desc: desc, fn: fn }; }
  V.MOODS = [
    M("gloom", "Rainy & Gloomy", "Grey skies, rain on the window, stories with an ache.", function () { return wxRow("rain", 60); }),
    M("thrill", "Edge of Your Seat", "Thrillers, crime and mysteries that won't let go.", function () { return byQ(V.ALL.filter(hasG("trl", "crm")).filter(function (t) { return (t.imdb || 0) >= 7 && t.votes >= 8000; })); }),
    M("mind", "Mind-Bending", "Twists, time loops and ideas that stay with you.", function () { return byQ(V.ALL.filter(function (t) { return (hasG("scf")(t) && hasG("trl")(t)) || (/\b(time|dream|reality|memor|parallel|loop|simulation)\w*/i.test(t.desc || "") && hasG("scf", "trl")(t)); }).filter(function (t) { return (t.imdb || 0) >= 7.2; })); }),
    M("magic", "Magic & Wonder", "Wizards, witches and spellbound worlds.", function () { return wxRow("magic", 60); }),
    M("vamp", "Dark Romance", "Gothic love, vampires and longing.", function () { return wxRow("vamp", 60); }),
    M("feel", "Feel-Good", "Warm, funny, uplifting — guaranteed smiles.", function () { return byQ(V.ALL.filter(hasG("cmy", "fml", "rma")).filter(not(hasG("hrr", "crm", "war", "trl"))).filter(function (t) { return (t.imdb || 0) >= 7 && t.votes >= 5000; })); }),
    M("cozy", "Cozy Night In", "Easygoing series to sink into.", function () { return byQ(V.ALL.filter(isType("SHOW")).filter(hasG("cmy", "rma", "drm", "fml")).filter(not(hasG("hrr", "crm", "war", "trl"))).filter(function (t) { return (t.imdb || 0) >= 7.3; })); }),
    M("laugh", "Laugh Out Loud", "Comedies with real laughs.", function () { return byQ(V.ALL.filter(hasG("cmy")).filter(not(hasG("drm", "hrr", "crm"))).filter(function (t) { return (t.imdb || 0) >= 7; })); }),
    M("scary", "Scary", "Horror for brave nights.", function () { return byQ(V.ALL.filter(hasG("hrr")).filter(function (t) { return (t.imdb || 0) >= 6.3; })); }),
    M("epic", "Epic & Grand", "Big worlds, big stakes.", function () { return byQ(V.ALL.filter(hasG("act", "fnt", "scf", "war", "hst")).filter(function (t) { return (t.imdb || 0) >= 7.5 && ((t.type === "MOVIE" && t.runtime >= 140) || (t.type === "SHOW" && t.seasons >= 3)); })); }),
    M("short", "Something Short", "Great films under 100 minutes.", function () { return shortFilms(); }),
    M("binge", "Binge in a Weekend", "One season, ten episodes or fewer.", function () { return binge(); }),
    M("master", "Masterpieces", "The very best — 8.3+ on IMDb.", function () { return masterpieces(); }),
    M("anime", "Anime Night", "The best anime on your apps.", function () { return byQ(seg("ani_s").concat(seg("ani_m")).filter(function (t) { return (t.imdb || 0) >= 7.5; })); }),
    M("true", "True Stories", "Documentaries and stories from real life.", function () { return byQ(V.ALL.filter(function (t) { return hasG("doc", "hst")(t) || /true story|based on (a )?real|real-life/i.test(t.desc || ""); }).filter(function (t) { return (t.imdb || 0) >= 7; })); })];

  // ---------- sections ----------
  function R(title, items, kind, sub, min, keep) { return { title: title, items: items, kind: kind, sub: sub, min: min, keep: keep }; }
  V.R = R;
  function stdRows(l, noun) { var rows = [R("New " + noun, fresh(l)), R("Top Rated " + noun, topRated(l)), R("Hidden Gems", gems(l))];
    GENRE_ROWS.forEach(function (g) { rows.push(R(g[1], byPop(l.filter(hasG(g[0]))))); });
    APPS.forEach(function (a) { rows.push(R(noun + " on " + LABEL[a], byPop(l.filter(on(a))))); });
    rows.push(R("Classics", classics(l))); return rows; }
  V.finalize = function (rows) { var seen = {}, w = list("watched").concat(list("dislikes"));
    return rows.filter(Boolean).filter(function (r) {
      if (!r.keep) r.items = r.items.filter(function (t) { return w.indexOf(t.id) < 0; });
      r.items = r.items.slice(0, r.kind === "top10" ? 10 : 40);
      if (r.items.length < (r.min || (r.kind === "top10" ? 5 : 6))) return false;
      var sig = r.items.slice(0, 6).map(function (t) { return t.id; }).join(); if (seen[sig]) return false; seen[sig] = 1; return true; }); };
  function personalRows() { var rows = [];
    if (list("recent").length) rows.push(R("Continue Watching", ids(list("recent")), null, "pick up where you left off", 1, true));
    if (list("mylist").length) rows.push(R("My List", ids(list("mylist")), null, null, 1, true));
    var last = V.T[list("recent")[0]]; if (last) rows.push(R("Because you watched " + last.title, similar(last, 30)));
    return rows; }

  V.SECTIONS = {
    home: function () { var wn = V.wxNow(), picks = topPicks(40), rows = [R("Top 10 Series in India Today", topList("SHOW"), "top10")];
      rows = personalRows().slice(0, 2).concat(rows);
      if (wn) rows.push(R(wn.title, wxRow(wn.k), null, wn.sub));
      if (picks.length >= 6) rows.push(R("Top Picks for You", picks, null, "based on your list"));
      rows.push(R("New on Your Apps", arrivals(), null, "this week"), R("Trending Now", seg("trend")));
      var last = V.T[list("recent")[0]]; if (last) rows.push(R("Because you watched " + last.title, similar(last, 30)));
      var dr = dayPick(directorRows(12)), fr = dayPick(franchiseRows(3));
      rows.push(R("Netflix Originals", origOf("netflix")), R("Coming Soon", comingSoon(), null, "dates on your apps", 3), R("Top 10 Movies in India Today", topList("MOVIE"), "top10"),
        R("Binge in a Weekend", binge(), null, "one season, ten episodes or fewer"), R("Dark & Foggy", wxRow("fog"), null, WXK.fog.d), R("New Releases", seg("new")));
      if (fr) rows.push(fr);
      rows.push(R("K-Dramas", seg("kr_s")), R("Hollywood Blockbusters", seg("us_m")), R("Magic for Grey Days", wxRow("magic"), null, WXK.magic.d), R("Anime", seg("ani_s")),
        R("Prime Video Originals", origOf("amazon")), R("Critically Acclaimed Films", seg("acc_m")), R("British Series", seg("gb_s")), R("Apple TV+ Originals", origOf("com.apple.appletv")),
        R("Dark Romance & Vampires", wxRow("vamp"), null, WXK.vamp.d), R("World Cinema", seg("world_m")), R("Bingeworthy Series", seg("acc_s")), R("Only on JioHotstar", origOf("hotstar")),
        R("Indian Cinema", seg("in_m")), R("Korean Films", seg("kr_m")), R("Popular on Crunchyroll", seg("app_com.crunchyroll.webapp")), R("Anime Films", seg("ani_m")),
        R("Short & Sweet", shortFilms(), null, "films under 100 minutes"), R("Hidden Gems", gems(V.ALL)), R("Family Time", seg("kids")), R("Documentaries", seg("docs")), R("Classics", classics(V.ALL)));
      if (dr) rows.splice(Math.min(rows.length, 14), 0, dr);
      return rows; },
    weather: function () { var cur = V.wxNow(), rows = [];
      if (cur) rows.push(R(cur.title, wxRow(cur.k), null, cur.sub));
      ["rain", "cold", "fog", "myst", "magic", "vamp", "snow"].forEach(function (k) { if (!cur || cur.k !== k) rows.push(R(WXK[k].n, wxRow(k), null, WXK[k].d)); });
      rows.push(R("Nordic & European Gloom", wxRegion(["DE", "NO", "SE", "DK", "IS", "FI", "BE", "NL", "PL", "FR", "ES", "AT", "CH"], ["US"]), null, "Germany, Scandinavia, France, Spain…"),
        R("British Grey Skies", wxRegion(["GB", "IE"]), null, "from the UK & Ireland"), R("Korean & Japanese Dark", wxRegion(["KR", "JP"]), null, "from Korea & Japan"),
        R("Monsoon Noir", wxRegion(["IN"]), null, "rain, fog and secrets from South Asia"));
      ["storm", "city", "anime"].forEach(function (k) { rows.push(R(WXK[k].n, wxRow(k), null, WXK[k].d)); });
      return rows; },
    "new": function () { return [R("New on Your Apps", arrivals(), null, "the last 7 days"), R("New Seasons", arrivals(function (a) { return a.season > 1; }), null, "returning series", 3),
      R("New Movies on Your Apps", arrivals(function (a, t) { return t.type === "MOVIE"; }), null, null, 3), R("Coming Soon", comingSoon(), null, "dates on your apps", 1),
      R("Top 10 Series in India Today", topList("SHOW"), "top10"), R("Top 10 Movies in India Today", topList("MOVIE"), "top10"), R("Trending Now", seg("trend")), R("New Releases", seg("new"))]; },
    collections: function () { return [R("Masterpieces", masterpieces(), null, "8.3+ on IMDb"), R("Binge in a Weekend", binge(), null, "one season, ten episodes or fewer"),
      R("Short & Sweet", shortFilms(), null, "films under 100 minutes")].concat(franchiseRows(3), directorRows(10), [R("Hidden Gems", gems(V.ALL)), R("Classics", classics(V.ALL))]); },
    mylist: function () { var rows = []; if (list("mylist").length) rows.push(R("My List", ids(list("mylist")), null, null, 1, true));
      if (list("recent").length) rows.push(R("Continue Watching", ids(list("recent")), null, null, 1, true));
      if (list("watched").length) rows.push(R("Watched", ids(list("watched")), null, "hidden from your rows", 1, true)); return rows; },
    movies: function () { var m = V.ALL.filter(isType("MOVIE"));
      return [R("Top 10 Movies in India Today", topList("MOVIE"), "top10"), R("Popular Movies", seg("movies")), R("Hollywood", seg("us_m")), R("Indian Cinema", seg("in_m")),
        R("Critically Acclaimed", seg("acc_m")), R("Korean Films", seg("kr_m")), R("Anime Films", seg("ani_m")), R("British Films", seg("gb_m")), R("World Cinema", seg("world_m"))].concat(stdRows(m, "Movies")); },
    shows: function () { var s = V.ALL.filter(isType("SHOW"));
      return [R("Top 10 Series in India Today", topList("SHOW"), "top10"), R("Popular Series", seg("shows")), R("Bingeworthy", seg("acc_s")), R("American Series", seg("us_s")),
        R("K-Dramas", seg("kr_s")), R("Anime", seg("ani_s")), R("British Series", seg("gb_s")), R("Indian Series", seg("in_s")), R("International Series", seg("world_s"))].concat(stdRows(s, "Series")); },
    anime: function () { var a = seg("ani_s").concat(seg("ani_m")); return [R("Popular Anime", seg("ani_s")), R("Rainy-Day Anime", wxRow("anime"), null, WXK.anime.d), R("Anime Films", seg("ani_m"))].concat(stdRows(a, "Anime")); },
    korean: function () { var k = V.ALL.filter(from("KR")); return [R("K-Dramas", seg("kr_s")), R("Korean Films", seg("kr_m")), R("Romantic K-Dramas", byPop(k.filter(isType("SHOW")).filter(hasG("rma"))))].concat(stdRows(k, "Korean")); },
    english: function () { var e = V.ALL.filter(from("US")); return [R("Hollywood Blockbusters", seg("us_m")), R("American Series", seg("us_s")), R("Critically Acclaimed", topRated(e))].concat(stdRows(e, "Hollywood")); },
    uk: function () { var u = V.ALL.filter(from("GB")); return [R("British Series", seg("gb_s")), R("British Films", seg("gb_m")), R("British Grey Skies", wxRegion(["GB", "IE"]))].concat(stdRows(u, "British")); },
    indian: function () { var n = V.ALL.filter(from("IN")); return [R("Indian Cinema", seg("in_m")), R("Indian Series", seg("in_s")), R("Only on JioHotstar", origOf("hotstar"))].concat(stdRows(n, "Indian")); },
    world: function () { var w = seg("world_m").concat(seg("world_s"), seg("jp_live")); return [R("World Cinema", seg("world_m")), R("International Series", seg("world_s")), R("Japanese Live-Action", seg("jp_live"))].concat(stdRows(w, "World")); }
  };
  APPS.forEach(function (a) {
    V.SECTIONS["app:" + a] = function () { var l = V.ALL.filter(on(a)), n = LABEL[a];
      var rows = [R(ORIG_ROW[a], origOf(a)), R("Top 10 on " + n + " Today", l.filter(function (t) { return t.rank; }).sort(function (x, y) { return x.rank - y.rank; }), "top10"),
        R("New on " + n, arrivals(function (x) { return x.app === a; }), null, "this week", 3), R("Popular on " + n, seg("app_" + a)), R("New Releases", fresh(l)), R("Top Rated", topRated(l)),
        R("Rainy & Gloomy", wxRow("rain", 80).filter(on(a))), R("Anime", byPop(l.filter(hasG("ani")))), R("K-Dramas", byPop(l.filter(from("KR")).filter(isType("SHOW")))),
        R("Hollywood", byPop(l.filter(from("US")))), R("Hidden Gems", gems(l))];
      GENRE_ROWS.forEach(function (g) { rows.push(R(g[1], byPop(l.filter(hasG(g[0]))))); });
      rows.push(R("Classics", classics(l))); return rows; };
  });

  // the billboard: a handful of strong, good-looking titles for a section
  V.heroFor = function (sec) { var pool, wn = V.wxNow();
    var ok = function (t) { return t && (t.avail || []).length && (t.imdb || 0) >= 7 && t.votes >= 5000 && list("watched").indexOf(t.id) < 0; };
    if (sec === "home") pool = (wn ? wxRow(wn.k, 30).slice(0, 8) : []).concat(origOf("netflix").slice(0, 8), seg("trend").slice(0, 10), origOf("com.apple.appletv").slice(0, 4), origOf("amazon").slice(0, 4));
    else if (sec === "weather") pool = wn ? wxRow(wn.k, 30) : wxRow("rain", 30);
    else if (sec === "new") pool = arrivals().concat(seg("new"));
    else if (sec === "movies") pool = seg("movies").concat(seg("acc_m"));
    else if (sec === "shows") pool = seg("shows").concat(seg("acc_s"));
    else if (sec === "collections") pool = masterpieces();
    else if (sec.indexOf("app:") === 0) { var a = sec.slice(4); pool = origOf(a).concat(seg("app_" + a)); }
    else if (V.SECTIONS[sec]) pool = [].concat.apply([], V.SECTIONS[sec]().slice(0, 3).map(function (r) { return r.items.slice(0, 8); }));
    else pool = [];
    var seen = {}, out = [];
    pool.forEach(function (t) { if (ok(t) && !seen[t.id]) { seen[t.id] = 1; out.push(t); } });
    if (sec === "home" && wn) { var w = out.slice(0, 3), rest = out.slice(3).sort(function () { return Math.random() - 0.5; }); out = w.concat(rest); }
    return out.slice(0, 10); };
  V.tonightsPick = function () { var wn = V.wxNow(), l = (wn ? wxRow(wn.k, 30) : masterpieces()).filter(function (t) { return list("watched").indexOf(t.id) < 0 && (t.avail || []).length; }); return dayPick(l, 7); };

  // ---------- search ----------
  var NAMES = null;
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
  V.norm = norm;
  function nameIndex() { if (NAMES) return NAMES; NAMES = (V.CAT.people || []).map(function (p) { return { n: p[0], c: p[1], p: p[2], k: norm(p[0]) }; }); return NAMES; }
  var GENRE_WORDS = [["thriller", "trl"], ["crime", "crm"], ["comedy", "cmy"], ["romance", "rma"], ["romantic", "rma"], ["horror", "hrr"], ["scary", "hrr"], ["sci fi", "scf"], ["science fiction", "scf"],
    ["fantasy", "fnt"], ["anime", "ani"], ["animation", "ani"], ["documentary", "doc"], ["drama", "drm"], ["action", "act"], ["family", "fml"], ["war", "war"], ["history", "hst"], ["western", "wsn"], ["music", "msc"], ["sport", "spt"]];
  // results: titles ranked by how well they match, plus people/genre suggestions for autocomplete
  V.search = function (q, n) { var k = norm(q); if (!k) return { titles: [], people: [], genres: [] };
    var words = k.split(" "), out = [];
    V.ALL.forEach(function (t) { var tk = t._k || (t._k = norm(t.title)), s = 0;
      if (tk === k) s = 1000; else if (tk.indexOf(k) === 0) s = 700; else if ((" " + tk).indexOf(" " + k) >= 0) s = 500; else if (tk.indexOf(k) >= 0) s = 300;
      else if (words.length > 1 && words.every(function (w) { return tk.indexOf(w) >= 0; })) s = 250;
      if (!s && k.length >= 3) { var pk = t._pk || (t._pk = norm((t.cast || []).concat(t.dirs || []).join(" | "))); if ((" " + pk).indexOf(" " + k) >= 0) s = 200; }
      if (s) { s += Math.min(60, Math.log(1 + t.votes) * 4) + (t.imdb || 0) * 2 + ((t.avail || []).length ? 30 : 0); out.push({ t: t, s: s }); } });
    var ppl = k.length < 2 ? [] : nameIndex().filter(function (p) { return (" " + p.k).indexOf(" " + k) >= 0; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 5).map(function (p) { return p.n; });
    var gen = GENRE_WORDS.filter(function (g) { return g[0].indexOf(k) === 0 || (k.length > 3 && k.indexOf(g[0]) === 0); }).slice(0, 2);
    gen.forEach(function (g) { V.ALL.forEach(function (t) { if ((t.genres || []).indexOf(g[1]) >= 0 && (t.imdb || 0) >= 7.2 && t.votes > 20000) out.push({ t: t, s: 150 + (t.imdb || 0) * 3 }); }); });
    var seen = {}; out.sort(function (a, b) { return b.s - a.s; });
    return { titles: out.filter(function (o) { if (seen[o.t.id]) return false; seen[o.t.id] = 1; return true; }).slice(0, n || 60).map(function (o) { return o.t; }),
      people: ppl, genres: gen.map(function (g) { return GENRES[g[1]]; }) }; };

  // ---------- episodes: seasons/episodes from JustWatch (per-episode links), Netflix ids from Netflix itself ----------
  var JW = "https://apis.justwatch.com/graphql";
  var FAMILY = { nfx: "netflix", nfk: "netflix", nfa: "netflix", prv: "amazon", pva: "amazon", amp: "amazon",
    jhs: "hotstar", hst: "hotstar", atp: "com.apple.appletv", cru: "com.crunchyroll.webapp" };
  var EPC = {};
  function jw(q) { return G.vesperFetch(JW, { method: "POST", body: JSON.stringify({ query: q }) }).then(function (j) { if (j.errors) throw new Error(j.errors[0].message); return j.data; }); }
  V.seasons = function (t) {
    var k = "s" + t.id;
    return EPC[k] || (EPC[k] = jw('{node(id:"' + t.id + '"){... on Show{seasons{id content(country:IN,language:"en"){seasonNumber title}}}}}').then(function (d) {
      return (((d.node || {}).seasons) || []).map(function (s) { return { id: s.id, n: s.content.seasonNumber, title: s.content.title }; })
        .filter(function (s) { return s.n > 0; }).sort(function (a, b) { return a.n - b.n; }); }).catch(function (e) { delete EPC[k]; throw e; }));
  };
  V.episodes = function (season) {
    var k = "e" + season.id;
    return EPC[k] || (EPC[k] = jw('{node(id:"' + season.id + '"){... on Season{episodes{id content(country:IN,language:"en"){title episodeNumber shortDescription runtime}' +
      ' offers(country:IN,platform:WEB){monetizationType standardWebURL package{shortName}}}}}}').then(function (d) {
      return (((d.node || {}).episodes) || []).map(function (e) { var links = {};
        (e.offers || []).forEach(function (o) { var a = FAMILY[o.package && o.package.shortName];
          if (a && ["FLATRATE", "FREE", "ADS"].indexOf(o.monetizationType) >= 0 && o.standardWebURL && !links[a]) links[a] = o.standardWebURL; });
        var c = e.content || {}; return { n: c.episodeNumber, title: c.title || "Episode " + c.episodeNumber, desc: c.shortDescription || "", runtime: c.runtime, links: links }; })
        .sort(function (a, b) { return a.n - b.n; }); }).catch(function (e) { delete EPC[k]; throw e; }));
  };
  // Netflix's own list: episode ids to play directly, stills, and how far you've watched
  V.netflixSeasons = function (t) {
    var id = ((t.links || {}).netflix || {}).id, k = "n" + id; if (!id) return Promise.resolve(null);
    return EPC[k] || (EPC[k] = G.V.call("netflixMeta", { id: id }).then(function (txt) {
      var v = JSON.parse(txt).video || {}; return (v.seasons || []).map(function (s) { return { n: s.seq, eps: (s.episodes || []).map(function (e) {
        var st = (e.stills || [])[0] || (e.thumbs || [])[0] || {}, bm = e.bookmark || {};
        return { n: e.seq, id: e.episodeId || e.id, title: e.title, desc: e.synopsis, runtime: e.runtime, still: st.url || null,
          progress: e.runtime && bm.offset > 0 ? Math.min(1, bm.offset / e.runtime) : 0 }; }) }; }); }).catch(function () { delete EPC[k]; return null; }));
  };
  // the exact episode on a service's website
  V.episodeUrl = function (app, ep, t) {
    if (app === "netflix") return ep.nfx ? "https://www.netflix.com/watch/" + ep.nfx : V.playUrl(app, t);
    var u = ep.links[app]; if (!u) return V.playUrl(app, t);
    if (app === "amazon") { var g = u.match(/gti=([^&]+)/); return g ? "https://www.primevideo.com/detail/" + decodeURIComponent(g[1]) + "/" : u; }
    if (app === "com.apple.appletv") { var m = u.match(/^([^?]+)\?.*?(showId=[^&]+)/); return m ? m[1] + "?" + m[2] : u.split("?")[0]; }
    return u;
  };
  V.playEpisode = function (t, app, ep) { V.markRecent(t.id);
    G.V.call("play", { app: app, url: V.episodeUrl(app, ep, t), title: t.title, id: t.id,
      fallback: app === "com.crunchyroll.webapp" ? "https://www.crunchyroll.com/search?q=" + encodeURIComponent(t.title) : null }); };

  // ---------- small text helpers ----------
  V.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  V.length = function (t) { if (t.type === "SHOW") return t.seasons ? t.seasons + (t.seasons > 1 ? " Seasons" : " Season") : (t.eps ? t.eps + " Episodes" : "Series");
    if (!t.runtime) return "Film"; var h = Math.floor(t.runtime / 60), m = t.runtime % 60; return (h ? h + "h " : "") + (m ? m + "m" : ""); };
  V.fmtDate = function (d) { var x = new Date(d + "T12:00:00"); return x.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
  V.inList = function (k, id) { return list(k).indexOf(id) >= 0; };
  // state is shared through the app: every window sees the same My List
  V.set = function (k, v) { k = V.key(k); V.state[k] = v; if (G.V && G.V.call) G.V.call("stateSet", { k: k, v: v }); };
  V.setRaw = function (k, v) { V.state[k] = v; if (G.V && G.V.call) G.V.call("stateSet", { k: k, v: v }); };
  V.toggle = function (k, id, front) { var l = list(k).slice(), i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else if (front) l.unshift(id); else l.push(id); V.set(k, l); return i < 0; };
  V.markRecent = function (id) { var l = list("recent").filter(function (x) { return x !== id; }); l.unshift(id); V.set("recent", l.slice(0, 30)); };
  V.play = function (t, app) { app = app || V.pickApp(t); if (!app) return false; V.markRecent(t.id);
    G.V.call("play", { app: app, url: V.playUrl(app, t), title: t.title, id: t.id,
      fallback: app === "com.crunchyroll.webapp" ? "https://www.crunchyroll.com/search?q=" + encodeURIComponent(t.title) : null }); return true; };

  // helpers for taste.js (recommendations, Tonight's Three, fresh rows)
  V._ = { primary: primary, quality: quality, byQ: byQ, byPop: byPop, seg: seg, arrivals: arrivals, comingSoon: comingSoon, masterpieces: masterpieces,
    topList: topList, gems: gems, classics: classics, binge: binge, shortFilms: shortFilms, franchiseRows: franchiseRows, directorRows: directorRows,
    wxRegion: wxRegion, origOf: origOf, fresh: fresh, topRated: topRated, from: from, hasG: hasG, isType: isType, GENRE_ROWS: GENRE_ROWS };
  G.VS = V;
})(window);
