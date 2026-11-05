/* Vesper for iPhone — the phone screens: Home, New & Hot, Weather & moods, Search, My List, details with episodes,
   profiles and settings. The catalog brain (shape.js + taste.js) is shared with Vesper for Mac. */
(function () {
  "use strict";
  var S = window.VS, esc = S.esc, LOGO = S.LOGO, LABEL = S.LABEL;
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function qa(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  // ---------- glyphs ----------
  var I = function (d, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; };
  var G = {
    search: I('<circle cx="10.8" cy="10.8" r="6.3"/><path d="M15.5 15.5l4.6 4.6"/>', 2),
    home: I('<path d="M4.5 10.6L12 4.5l7.5 6.1"/><path d="M6.5 9.2V19.5h4v-5h3v5h4V9.2"/>'),
    homeOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.6l8.3 6.8-1 1.2-.8-.6v9.5h-5v-5h-3v5h-5V11l-.8.6-1-1.2z"/></svg>',
    hot: I('<path d="M12 3.6c.5 2.9 4.6 4.9 4.6 9.6a4.6 4.6 0 0 1-9.2 0c0-2.1.9-3.6 2.1-4.7.2 1.5.9 2.4 1.8 2.8-.2-2.7.3-5.3.7-7.7z"/>'),
    weather: I('<path d="M7.2 15.6a3.9 3.9 0 0 1-.4-7.8 5.3 5.3 0 0 1 10.2 1.2 3.3 3.3 0 0 1 .3 6.6z"/><path d="M8.6 18.6l-.8 1.8M12.4 18.6l-.8 1.8M16.2 18.6l-.8 1.8"/>'),
    list: I('<path d="M7 4.5h10a.8.8 0 0 1 .8.8v14.2L12 15.9l-5.8 3.6V5.3a.8.8 0 0 1 .8-.8z"/>'),
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
    plus: I('<path d="M12 5v14M5 12h14"/>', 2),
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.2),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>', 2),
    down: I('<path d="M6 9l6 6 6-6"/>', 2.4),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>', 2.4),
    xc: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm3.5 11.9-1.1 1.1-2.4-2.4-2.4 2.4-1.1-1.1 2.4-2.4-2.4-2.4 1.1-1.1 2.4 2.4 2.4-2.4 1.1 1.1-2.4 2.4z"/></svg>',
    up: I('<path d="M7 10.5v9H4.5v-9zM7 10.5l4-6.5c1.3 0 2.2 1 2 2.3l-.6 3.2h5.1a1.9 1.9 0 0 1 1.9 2.3l-1.4 6.2a1.9 1.9 0 0 1-1.9 1.5H7"/>'),
    no: I('<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>'),
    share: I('<path d="M12 3.5v12M7.5 8L12 3.5 16.5 8"/><path d="M5.5 12.5v6.5h13v-6.5"/>'),
    dice: I('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>', 2.4),
    pin: I('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
    back: I('<path d="M15 5l-7 7 7 7"/>', 2.4)
  };

  // ---------- state ----------
  S.state = window.vesperState;
  var tab = "home", sec = "home", arg = null, noted = false, POS = {};
  function setPref(k, v) { var p = Object.assign({}, S.state.prefs || {}); p[k] = v; S.setRaw("prefs", p); }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("on"); }, 1800); }
  // iPhone haptics: Safari gives a light tap when a switch control is toggled, so we keep a hidden one to "press"
  var hapEl = (function () { var w = h("div"); w.style.cssText = "position:fixed;left:-99px;top:0;width:1px;height:1px;overflow:hidden;opacity:0";
    w.innerHTML = '<input type="checkbox" switch id="hap"><label for="hap" id="hapl"></label>'; document.body.appendChild(w); return w.querySelector("label"); })();
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(8); else hapEl.click(); } catch (e) {} }

  var SECT_NAMES = { home: "Home", shows: "Series", movies: "Films", collections: "Collections", anime: "Anime", korean: "Korean", english: "Hollywood", uk: "British",
    indian: "Indian", world: "World Cinema", weather: "Weather", "new": "New & Hot", mylist: "My List" };
  S.APPS.forEach(function (a) { SECT_NAMES["app:" + a] = LABEL[a]; });
  var CATS = [["collections", "Collections"], ["anime", "Anime"], ["korean", "Korean"], ["english", "Hollywood"], ["uk", "British"], ["indian", "Indian"], ["world", "World Cinema"]];

  // ---------- cards ----------
  var TOPSET = null;
  function topRank(t) { if (!TOPSET) { TOPSET = {}; var tp = S.CAT.top10 || {}; (tp.shows || []).concat(tp.movies || []).forEach(function (id) { TOPSET[id] = 1; }); } return TOPSET[t.id]; }
  function badge(t) {
    var soon = S.soonOf(t); if (soon && !(t.avail || []).length) return '<div class="bdg soon">' + esc(S.fmtDate(soon.date).toUpperCase()) + "</div>";
    var a = S.arrivalOf(t); if (a) return '<div class="bdg">' + (a.season > 1 ? "NEW SEASON" : "NEW") + "</div>";
    return topRank(t) ? '<div class="t10b"><b>TOP</b><i>10</i></div>' : "";
  }
  function poster(t) {
    var c = h("div", "pc"); c.dataset.id = t.id;
    var src = S.po(t, "s332"), lg = t.orig ? '<img class="lg" src="' + LOGO[t.orig] + '">' : "";
    c.innerHTML = (src ? '<img class="p" loading="lazy" decoding="async" src="' + src + '" onload="this.classList.add(\'ok\')" onerror="this.remove()">' : "") +
      '<div class="nt"' + (src ? ' style="opacity:0"' : "") + ">" + esc(t.title) + "</div>" + lg + badge(t);
    if (src) { var im = c.querySelector("img.p"); im.addEventListener("error", function () { c.querySelector(".nt").style.opacity = 1; }); }
    return c;
  }
  function topCard(t, i) { var c = h("div", "tc"); c.innerHTML = '<div class="num">' + (i + 1) + "</div>"; var p = poster(t); p.querySelector(".t10b") && p.querySelector(".t10b").remove(); c.appendChild(p); return c; }
  function wideCard(t) {
    var c = h("div", "wide"); c.dataset.id = t.id; c.style.setProperty("--gh", S.glowHue(t));
    var a = t.orig || S.pickApp(t);
    c.innerHTML = '<div class="art"><img decoding="async" src="' + S.bd(t, "s640") + '" onload="this.classList.add(\'ok\')"><div class="g"></div>' +
      (a ? '<img class="lg" src="' + LOGO[a] + '">' : "") + '<div class="nm">' + esc(t.title) + '</div></div><div class="vibe">' + S.vibes(t).map(esc).join(" · ") + "</div>";
    return c;
  }
  function trioNote() { var p = S.partOfDay(), wn = S.wxNow(); return (wn && (p === "evening" || p === "night") ? wn.title + " · " : "") + "for " + (p === "morning" ? "this morning" : p === "afternoon" ? "this afternoon" : "tonight"); }
  function rowEl(r) {
    var row = h("div", "row"), rail = h("div", "rail" + (r.kind === "top10" ? " toprail" : ""));
    row.innerHTML = '<div class="row-h">' + esc(r.title) + (r.kind === "trio" ? "<small>" + esc(trioNote()) + "</small>" : r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</div>";
    row.appendChild(rail);
    row._fill = function () {
      if (row._done) return; row._done = 1; var f = document.createDocumentFragment();
      if (r.kind === "trio") {
        r.items.forEach(function (t) { f.appendChild(wideCard(t)); });
        var s = h("div", "wide surprise", '<div class="art"><div class="q">' + G.dice + "</div><b>Tonight's surprise</b><small>Tap to turn it over</small></div><div class=\"vibe\">&nbsp;</div>");
        s.addEventListener("click", function (e) { e.stopPropagation(); var t = S.surprisePick(); if (!t) return; buzz(); s.replaceWith(wideCard(t)); });
        f.appendChild(s);
      } else r.items.forEach(function (t, i) { f.appendChild(r.kind === "top10" ? topCard(t, i) : poster(t)); });
      rail.appendChild(f);
      if (POS[r.title]) rail.scrollLeft = POS[r.title];
      rail.addEventListener("scroll", function () { POS[r.title] = rail.scrollLeft; }, { passive: true });
    };
    return row;
  }
  var io = null;
  function addRows(box, rows) {
    if (io) io.disconnect();
    io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target._fill(); io.unobserve(e.target); } }); }, { root: $("view"), rootMargin: "600px 0px" });
    rows.forEach(function (r, i) { var el = rowEl(r); box.appendChild(el); if (i < 3) el._fill(); else io.observe(el); });
  }
  function gridOf(list) { var g = h("div", "grid"); list.forEach(function (t) { g.appendChild(poster(t)); }); return g; }

  // ---------- meta lines ----------
  function heroLine(t) {
    var p = [];
    if (topRank(t)) p.push('<span class="t10">TOP 10</span>');
    if (t.imdb) p.push('<span class="imdb">IMDb ' + t.imdb.toFixed(1) + "</span>");
    if (t.year) p.push("<span>" + t.year + "</span>");
    S.vibes(t).slice(0, 2).forEach(function (v) { p.push('<span class="vw">' + esc(v) + "</span>"); });
    return p.join('<i class="dot"></i>');
  }
  function metaLine(t) {
    var p = [], a = S.arrivalOf(t);
    if (a) p.push('<span class="new">' + (a.season > 1 ? "New Season" : "New") + "</span>");
    if (topRank(t)) p.push('<span class="t10">TOP 10</span>');
    if (t.imdb) p.push('<span class="imdb">IMDb ' + t.imdb.toFixed(1) + "</span>");
    if (t.year) p.push("<span>" + t.year + "</span>");
    if (t.cert) p.push('<span class="cert">' + esc(t.cert) + "</span>");
    p.push("<span>" + esc(S.length(t)) + "</span>");
    return p.join('<i class="dot"></i>');
  }
  function tagLine(t, extra) {
    if (extra) return '<div class="tg">' + esc(extra) + "</div>";
    if (t.orig) return '<div class="tg"><img src="' + LOGO[t.orig] + '">' + esc(S.ORIG[t.orig]).replace("Original", t.type === "SHOW" ? "Original Series" : "Original Film") + "</div>";
    var a = S.pickApp(t); return a ? '<div class="tg"><img src="' + LOGO[a] + '">' + (t.type === "SHOW" ? "Series" : "Film") + "</div>" : "";
  }

  // ---------- header & tabs ----------
  function header() {
    var top = $("top"), p = S.profile();
    if (tab === "home") {
      var inSec = sec !== "home";
      var chips = inSec
        ? '<button class="chip x" data-go="home">' + G.x + '</button><button class="chip on" data-sheet="' + (sec.indexOf("app:") === 0 ? "apps" : CATS.some(function (c) { return c[0] === sec; }) ? "cats" : "") + '">' +
          (sec.indexOf("app:") === 0 ? '<img src="' + LOGO[sec.slice(4)] + '">' : "") + esc(SECT_NAMES[sec] || "") + (sec === "shows" || sec === "movies" ? "" : G.down) + "</button>" +
          (sec === "shows" ? '<button class="chip" data-go="movies">Films</button>' : sec === "movies" ? '<button class="chip" data-go="shows">Series</button>' : "")
        : '<button class="chip" data-go="shows">Series</button><button class="chip" data-go="movies">Films</button><button class="chip" data-sheet="apps">Your Apps' + G.down + '</button><button class="chip" data-sheet="cats">Categories' + G.down + "</button>";
      top.innerHTML = '<div class="hrow"><img class="logo" src="icons/icon-180.png" alt=""><h1>' + (p ? "For " + esc(p.name) : "Vesper") + "</h1>" +
        '<button class="hbtn" data-pick title="Pick for me">' + G.dice + '</button><button class="hbtn" data-tab="search">' + G.search + "</button></div><div class=\"chips\">" + chips + "</div>";
    } else {
      var T = { "new": "New & Hot", weather: "Weather", search: "Search", mylist: "My Vesper" }[tab];
      top.innerHTML = '<div class="hrow"><h1>' + T + "</h1>" + "" + "</div>";
    }
    top.style.display = tab === "weather" ? "none" : "";
  }
  function tabs() {
    var p = S.profile();
    var T = [["home", "Home", tab === "home" ? G.homeOn : G.home], ["new", "New & Hot", G.hot], ["weather", "Weather", G.weather], ["search", "Search", G.search],
      ["mylist", "My Vesper", p ? S.avatar(p) : G.list]];
    $("tabs").innerHTML = T.map(function (x) { return '<button data-tab="' + x[0] + '" class="' + (x[0] === tab ? "on" : "") + '">' + x[2] + "<span>" + x[1] + "</span></button>"; }).join("");
  }
  function onScroll() { $("top").classList.toggle("solid", $("view").scrollTop > 30); }

  // ---------- navigation ----------
  function show(t, s, a, keepY) {
    var v = $("view");
    POS["_y:" + tab + ":" + sec] = v.scrollTop;
    tab = t; if (t === "home") sec = s || "home"; arg = a == null ? null : a;
    header(); tabs();
    var page = h("div", "page" + (t === "weather" ? " flush" : t === "home" ? "" : " short"));
    v.textContent = ""; v.appendChild(page);
    if (t === "home") renderSection(page, sec);
    else if (t === "new") renderNew(page);
    else if (t === "weather") renderWeather(page);
    else if (t === "search") renderSearch(page);
    else if (t === "mylist") renderMine(page);
    v.scrollTop = keepY ? (POS["_y:" + tab + ":" + sec] || 0) : 0;
    onScroll();
  }
  function rerender() { show(tab, sec, arg, true); }

  // ---------- Home and sections ----------
  function heroEl(s) {
    var hid = S.hiddenSet(), list = S.heroFor(s).filter(function (t) { return !hid[t.id] && t.poster; }); if (!list.length) return null;
    var t;
    if (s === "home") { var last = S.list("lastHero")[0], k = list.findIndex(function (x) { return x.id === last; }); t = list[(k + 1) % list.length]; S.set("lastHero", [t.id]); }
    else t = list[Math.floor(Math.random() * Math.min(list.length, 5))];
    var wn = S.wxNow(), extra = s === "home" && wn && S.wxRow(wn.k, 30).indexOf(t) >= 0 ? wn.hero : null;
    var el = h("section", "hero"); el.dataset.id = t.id; el.style.setProperty("--gh", S.glowHue(t));
    var inL = S.inList("mylist", t.id);
    el.innerHTML = '<img class="p" decoding="async" src="' + S.po(t, "s718") + '" onload="this.classList.add(\'ok\')"><div class="sh"></div><div class="inf">' + tagLine(t, extra) +
      '<div class="nm">' + esc(t.title) + '</div><div class="line">' + heroLine(t) + "</div>" +
      '<div class="btns"><button class="btn play" data-play="' + t.id + '">' + G.play + (S.pickApp(t) ? "Play" : "Soon") + '</button><button class="btn ghost" data-list="' + t.id + '">' + (inL ? G.check : G.plus) + "My List</button></div></div>";
    return el;
  }
  function renderSection(page, s) {
    var rows = S.finalize((S.SECTIONS[s] || S.SECTIONS.home)());
    if (s !== "mylist" && s !== "new") rows = S.freshen(rows, s);
    if (s === "home" && !noted) { noted = true; S.noteShown(rows); }
    var hero = heroEl(s); if (hero) page.appendChild(hero);
    if (!rows.length) page.appendChild(h("div", "empty", "<b>Nothing here yet</b>The show list is still loading."));
    addRows(page, rows);
  }

  // ---------- New & Hot ----------
  function renderNew(page) {
    var chips = h("div", "chips"); chips.style.margin = "0 0 18px"; page.appendChild(chips);
    var modes = [["soon", "Coming Soon"], ["new", "New This Week"], ["shows", "Top 10 Series"], ["movies", "Top 10 Films"]], m = arg || "soon";
    chips.innerHTML = modes.map(function (x) { return '<button class="chip' + (x[0] === m ? " on" : "") + '" data-nh="' + x[0] + '">' + x[1] + "</button>"; }).join("");
    var list, A = S._;
    if (m === "soon") list = A.comingSoon().slice(0, 30);
    else if (m === "new") list = A.arrivals().slice(0, 30);
    else list = A.topList(m === "shows" ? "SHOW" : "MOVIE").slice(0, 10);
    if (!list.length) { page.appendChild(h("div", "empty", "<b>Nothing announced</b>Check back tomorrow.")); return; }
    list.forEach(function (t, i) {
      var soon = S.soonOf(t), arr = S.arrivalOf(t), d = soon ? new Date(soon.date + "T12:00:00") : null, a = t.orig || S.pickApp(t) || (soon && soon.app);
      var left = m === "soon" && d ? "<small>" + d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase() + "</small><b>" + d.getDate() + "</b>" : m === "shows" || m === "movies" ? "<b>" + (i + 1) + "</b>" : "<small>NEW</small>";
      var when = m === "soon" && d ? "Coming " + d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + (a ? " · " + LABEL[a] : "")
        : arr ? (arr.season > 1 ? "New season · " : "Now streaming · ") + (LABEL[arr.app] || "") : a ? "On " + LABEL[a] : "";
      var el = h("div", "nh"); el.dataset.id = t.id;
      el.innerHTML = '<div class="dt">' + left + '</div><div class="bd"><div class="art"><img loading="lazy" src="' + S.bd(t, "s640") + '">' + (a && LOGO[a] ? '<img class="lg" src="' + LOGO[a] + '">' : "") +
        '</div><div class="nm">' + esc(t.title) + '</div><div class="when">' + esc(when) + "</div><p>" + esc(t.desc || "") + '</p><div class="gn">' + (t.genres || []).slice(0, 3).map(function (g) { return S.GENRES[g] || g; }).join(" · ") + "</div></div>";
      page.appendChild(el);
    });
  }

  // ---------- Weather & moods ----------
  var stopSky = null;
  function sky(cv, kind) {
    if (!cv.getContext || kind === "off") return function () {};
    var ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W, H, drops = [], snow = kind === "snow", run = true;
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); var n = snow ? 70 : kind === "grey" ? 30 : kind === "drizzle" ? 55 : 95;
    for (var i = 0; i < n; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, v: snow ? 0.4 + Math.random() * 0.8 : 7 + Math.random() * 7, l: snow ? 1 + Math.random() * 2 : 9 + Math.random() * 12 });
    function frame() { if (!run) return; ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(200,210,255,.35)"; ctx.fillStyle = "rgba(240,240,255,.8)"; ctx.lineWidth = 1;
      drops.forEach(function (d) { d.y += d.v; d.x += snow ? Math.sin(d.y / 40) * 0.4 : -d.v * 0.12; if (d.y > H) { d.y = -20; d.x = Math.random() * W * 1.1; }
        if (snow) { ctx.beginPath(); ctx.arc(d.x, d.y, d.l, 0, 7); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.v * 0.12 * 2, d.y - d.l); ctx.stroke(); } });
      requestAnimationFrame(frame); }
    frame(); return function () { run = false; };
  }
  function renderWeather(page) {
    if (stopSky) stopSky();
    var cur = S.wxNow(), mode = S.pref("wx", "live"), L = S.wxLive(), p = S.place();
    var now = mode === "live" ? (L ? S.wxWords(L.code) + " · " + Math.round(L.temp) + "° in " + esc(L.place) : "Reading the sky over " + esc(p.name) + "…") : "Weather set by hand";
    var pic = cur ? S.wxRow(cur.k, 12)[Math.floor(Math.random() * 6)] : null;
    var top = h("div", "sky", (pic ? '<img src="' + S.bd(pic, "s1440") + '">' : "") + '<canvas></canvas><div class="sh"></div><div class="tx"><small>' + G.pin.replace("<svg", '<svg style="display:inline;width:12px;height:12px;vertical-align:-1px"') + " " + now +
      "</small><h2>" + esc(cur ? cur.title : "Weather moods") + "</h2><p>" + esc(cur ? cur.sub.split("  ·  ")[0] : "Pick a sky below.") + "</p></div>");
    page.appendChild(top);
    stopSky = sky(top.querySelector("canvas"), cur ? cur.kind : "off");
    var chips = h("div", "chips"); chips.style.margin = "0 0 22px";
    chips.innerHTML = S.WXMODES.map(function (m) { return '<button class="chip' + (m[0] === mode ? " on" : "") + '" data-wx="' + m[0] + '">' + m[1] + "</button>"; }).join("") +
      '<button class="chip" data-sheet="place">' + G.pin + esc(p.name) + "</button>";
    page.appendChild(chips);
    var rows = S.finalize(S.SECTIONS.weather()); rows = S.freshen(rows, "weather");
    var box = h("div"); page.appendChild(box); addRows(box, rows.slice(0, 4));
    page.appendChild(h("div", "sec-h", "Moods"));
    var mg = h("div", "moods"), HU = [265, 200, 330, 22, 150, 290, 45, 185, 0, 240, 120, 310];
    mg.innerHTML = S.MOODS.map(function (m, i) { return '<button class="mood" style="--h:' + HU[i % HU.length] + '" data-mood="' + m.id + '"><b>' + esc(m.name) + "</b><small>" + esc(m.desc) + "</small></button>"; }).join("");
    page.appendChild(mg);
    var more = h("div"); page.appendChild(more); addRows(more, rows.slice(4));
    if (mode === "live" && !L) S.fetchWeather(true).then(function (r) { if (r && tab === "weather") rerender(); });
  }
  function openMood(id) {
    var m = S.MOODS.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    var w = S.hiddenSet(), items = m.fn().filter(function (t) { return !w[t.id] && (t.avail || []).length; }).slice(0, 60);
    sheet('<h3>' + esc(m.name) + '</h3><div class="sub-h" style="padding:0 20px 14px">' + esc(m.desc) + "</div>", function (card) { card.appendChild(gridOf(items)); });
  }

  // ---------- Search ----------
  function renderSearch(page) {
    var box = h("div", "sbox", G.search + '<input type="search" placeholder="Shows, films, actors, genres" enterkeyhint="search" autocomplete="off" autocorrect="off"><button class="clr">' + G.xc + "</button>");
    page.appendChild(box);
    var inp = box.querySelector("input"), chips = h("div", "chips"), body = h("div");
    chips.style.margin = "0 0 14px"; page.appendChild(chips); page.appendChild(body);
    inp.value = arg || "";
    var t = null;
    function run() {
      var q = inp.value.trim(); arg = q; box.classList.toggle("has", !!q); body.textContent = ""; chips.textContent = "";
      if (!q) {
        var rec = S.list("queries").slice(0, 8);
        if (rec.length) chips.innerHTML = rec.map(function (r) { return '<button class="chip" data-q="' + esc(r) + '">' + esc(r) + "</button>"; }).join("");
        body.appendChild(h("div", "sec-h", "Top Searches"));
        S._.seg("trend").filter(function (x) { return (x.avail || []).length; }).slice(0, 25).forEach(function (x) {
          var li = h("div", "li"); li.dataset.id = x.id;
          li.innerHTML = '<div class="th"><img loading="lazy" src="' + S.bd(x, "s640") + '"></div><div class="tx">' + esc(x.title) + "<small>" + esc(S.length(x)) + " · " + esc(LABEL[S.pickApp(x)] || "") + '</small></div><div class="pl">' + G.play + "</div>";
          body.appendChild(li); });
        return;
      }
      var r = S.search(q, 60);
      chips.innerHTML = r.people.map(function (p) { return '<button class="chip" data-q="' + esc(p) + '">' + esc(p) + "</button>"; }).join("") +
        r.genres.map(function (g) { return '<button class="chip" data-q="' + esc(g) + '">' + esc(g) + "</button>"; }).join("");
      if (!r.titles.length) { body.appendChild(h("div", "empty", "<b>No matches</b>Try a different spelling, an actor or a genre.")); return; }
      body.appendChild(gridOf(r.titles));
    }
    function saveQ() { var q = inp.value.trim(); if (q.length < 2) return; var l = S.list("queries").filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); }); l.unshift(q); S.set("queries", l.slice(0, 12)); }
    inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(run, 120); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { saveQ(); inp.blur(); } });
    body.addEventListener("click", saveQ, true);
    box.querySelector(".clr").addEventListener("click", function () { inp.value = ""; run(); inp.focus(); });
    chips.addEventListener("click", function (e) { var b = e.target.closest("[data-q]"); if (b) { inp.value = b.dataset.q; run(); saveQ(); } });
    run();
    if (!inp.value) setTimeout(function () { inp.focus(); }, 300);
  }

  // ---------- My Vesper ----------
  function renderMine(page) {
    var p = S.profile();
    var me = h("div", "li"); me.style.cssText = "padding:4px 16px 22px";
    me.innerHTML = (p ? S.avatar(p).replace('class="ava ', 'style="width:52px;height:52px;font-size:22px;--h:' + p.hue + '" class="ava ') : "") +
      '<div class="tx" style="font-size:19px;font-weight:700">' + (p ? esc(p.name) : "Your Vesper") + "<small>" + (S.profiles().length > 1 ? "Tap to switch profile" : "Profiles, weather, favourite app") + "</small></div>" +
      '<button class="chip" data-sheet="me">Settings</button>';
    me.dataset.sheet = "me";
    page.appendChild(me);
    var rows = S.finalize(S.SECTIONS.mylist());
    if (!rows.length) { page.appendChild(h("div", "empty", "<b>Your list is empty</b>Tap + My List on any title and it waits for you here.")); return; }
    addRows(page, rows);
  }

  // ---------- sheets ----------
  function sheet(html, after) {
    var s = $("sheet");
    s.innerHTML = '<div class="scrim"></div><div class="card"><div class="grab"></div>' + html + "</div>";
    if (after) after(s.querySelector(".card"));
    requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.add("on"); }); });
    s.querySelector(".scrim").onclick = closeSheet;
    var card = s.querySelector(".card"), y0 = null;
    card.addEventListener("touchstart", function (e) { y0 = card.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    card.addEventListener("touchmove", function (e) { if (y0 == null) return; var d = e.touches[0].clientY - y0; if (d > 0) { card.style.transition = "none"; card.style.transform = "translateY(" + d + "px)"; } }, { passive: true });
    card.addEventListener("touchend", function (e) { if (y0 == null) return; var d = e.changedTouches[0].clientY - y0; card.style.transition = ""; card.style.transform = ""; y0 = null; if (d > 110) closeSheet(); });
  }
  function closeSheet() { $("sheet").classList.remove("on"); }
  function appsSheet() {
    sheet("<h3>Your Apps</h3>" + S.APPS.map(function (a) { return '<button class="opt' + (sec === "app:" + a ? " on" : "") + '" data-go="app:' + a + '"><img src="' + LOGO[a] + '"><span>' + LABEL[a] + "</span><small>" +
      S.ALL.filter(function (t) { return (t.avail || []).indexOf(a) >= 0; }).length + " titles</small></button>"; }).join(""));
  }
  function catsSheet() {
    sheet('<h3>Categories</h3><div class="cats">' + CATS.concat([["shows", "Series"], ["movies", "Films"]]).map(function (c) { return '<button class="opt' + (sec === c[0] ? " on" : "") + '" data-go="' + c[0] + '"><span>' + c[1] + "</span></button>"; }).join("") +
      '</div><h4>Moods</h4><div class="cats">' + S.MOODS.map(function (m) { return '<button class="opt" data-mood="' + m.id + '"><span>' + esc(m.name) + "</span></button>"; }).join("") + "</div>");
  }
  function placeSheet() {
    sheet('<h3>Weather from</h3><div class="sheet-in"><input placeholder="Search any city" autocomplete="off"></div><div class="res"></div>', function (card) {
      var inp = card.querySelector("input"), res = card.querySelector(".res"), t;
      function list(l) { res.innerHTML = l.map(function (p, i) { return '<button class="opt" data-pl="' + i + '">' + G.pin + "<span>" + esc(p.name) + "</span><small>" + esc(p.country) + "</small></button>"; }).join(""); res._l = l; }
      list(S.PLACES);
      inp.addEventListener("input", function () { clearTimeout(t); var q = inp.value.trim(); if (q.length < 2) return list(S.PLACES); t = setTimeout(function () { S.searchPlaces(q).then(list).catch(function () {}); }, 250); });
      res.addEventListener("click", function (e) { var b = e.target.closest("[data-pl]"); if (!b) return; setPref("place", res._l[+b.dataset.pl]); setPref("wx", "live"); closeSheet(); S.fetchWeather(true).then(rerender); toast("Weather from " + res._l[+b.dataset.pl].name); });
    });
  }
  function meSheet() {
    var ps = S.profiles(), cur = S.state.profile, fav = S.pref("app", "auto"), gen = S.CAT.generated ? new Date(S.CAT.generated) : null;
    sheet("<h3>My Vesper</h3><h4>Who's watching</h4>" + ps.map(function (p) { return '<button class="opt' + (p.id === cur ? " on" : "") + '" data-prof="' + p.id + '">' + S.avatar(p) + "<span>" + esc(p.name) + "</span></button>"; }).join("") +
      '<button class="opt" data-padd>' + S.avatar(null) + "<span>Add a person</span></button>" +
      (ps.length ? '<button class="opt" data-pren><span style="padding-left:44px">Rename ' + esc((S.profile() || {}).name || "") + "</span></button>" : "") +
      (ps.length > 1 ? '<button class="opt red" data-prem><span style="padding-left:44px">Remove ' + esc((S.profile() || {}).name || "") + "</span></button>" : "") +
      "<h4>Play on first</h4>" + [["auto", "Best available"]].concat(S.APPS.map(function (a) { return [a, LABEL[a]]; })).map(function (x) {
        return '<button class="opt' + (fav === x[0] ? " on" : "") + '" data-fav="' + x[0] + '">' + (LOGO[x[0]] ? '<img src="' + LOGO[x[0]] + '">' : '<span style="flex:none;width:28px"></span>') + "<span>" + x[1] + "</span></button>"; }).join("") +
      '<h4>Weather</h4><button class="opt" data-sheet="place">' + G.pin + "<span>" + esc(S.place().name) + "</span><small>Change</small></button>" +
      '<h4>History</h4><button class="opt red" data-clear><span>Forget what I opened and liked</span></button>' +
      '<div class="foot">Show list updated ' + (gen ? gen.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "—") + " · " + S.ALL.length + " titles across Netflix, Prime Video, JioHotstar, Apple TV+ and Crunchyroll.<br>Your lists stay on this iPhone.</div>");
  }
  function nameSheet(title, val, done) {
    sheet("<h3>" + esc(title) + '</h3><div class="sheet-in"><input maxlength="18" placeholder="Name" value="' + esc(val || "") + '"></div><div class="sheet-in"><button class="btn play" style="width:100%">Save</button></div>', function (card) {
      var inp = card.querySelector("input"); setTimeout(function () { inp.focus(); }, 350);
      function ok() { var v = inp.value.trim(); if (!v) return; closeSheet(); done(v); }
      card.querySelector("button.btn").onclick = ok; inp.addEventListener("keydown", function (e) { if (e.key === "Enter") ok(); });
    });
  }

  // ---------- details ----------
  var curT = null;
  function openDetail(id) {
    var t = S.T[id]; if (!t) return; curT = t; S.markViewed(t.id); buzz();
    var d = $("detail"), apps = t.avail || [], best = S.pickApp(t), soon = S.soonOf(t);
    var others = apps.filter(function (a) { return a !== best; });
    var plays = best ? '<div class="plays"><button class="btn play" data-play="' + t.id + '" data-app="' + best + '">' + G.play + "Play on " + LABEL[best] + "</button>" +
      (others.length ? '<div class="also">' + others.map(function (a) { return '<button class="btn" data-play="' + t.id + '" data-app="' + a + '"><img src="' + LOGO[a] + '">' + LABEL[a] + "</button>"; }).join("") + "</div>" : "") + "</div>"
      : '<div class="soonbox">' + (soon ? "Coming " + new Date(soon.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" }) + (soon.app ? " on " + LABEL[soon.app] : "") : "Not streaming on your apps right now") + "</div>";
    var cast = (t.cast || []).slice(0, 5), dirs = (t.dirs || []).slice(0, 2);
    d.innerHTML = '<button class="dclose" data-close>' + G.x + '</button><div class="dart"><img src="' + S.bd(t, "s1440") + '"><div class="g"></div></div><div class="dbody">' +
      tagLine(t) + "<h2>" + esc(t.title) + '</h2><div class="line">' + metaLine(t) + "</div>" + plays +
      '<div class="desc">' + esc(t.desc || "") + "</div>" +
      '<div class="credits">' + (cast.length ? "<b>Starring</b> " + cast.map(esc).join(", ") + "<br>" : "") + (dirs.length ? "<b>" + (t.type === "SHOW" ? "Created by" : "Director") + "</b> " + dirs.map(esc).join(", ") + "<br>" : "") +
      ((t.genres || []).length ? "<b>Genres</b> " + t.genres.map(function (g) { return S.GENRES[g] || g; }).join(", ") : "") + "</div>" + actsHTML(t) +
      '<div class="dtabs">' + (t.type === "SHOW" ? '<button class="on" data-dt="eps">Episodes</button>' : "") + '<button' + (t.type === "SHOW" ? "" : ' class="on"') + ' data-dt="more">More Like This</button></div><div class="dsect"></div></div>';
    d.scrollTop = 0; d.classList.add("on");
    history.pushState({ d: 1 }, "");
    dtab(t.type === "SHOW" ? "eps" : "more");
  }
  function actsHTML(t) {
    var inL = S.inList("mylist", t.id), lk = S.inList("likes", t.id), no = S.inList("dislikes", t.id);
    return '<div class="acts"><button data-list="' + t.id + '"' + (inL ? ' class="on"' : "") + ">" + (inL ? G.check : G.plus) + "My List</button>" +
      '<button data-like="' + t.id + '"' + (lk ? ' class="on"' : "") + ">" + G.up + (lk ? "Liked" : "Like") + "</button>" +
      '<button data-dislike="' + t.id + '"' + (no ? ' class="on no"' : "") + ">" + G.no + "Not for me</button>" +
      '<button data-share="' + t.id + '">' + G.share + "Share</button></div>";
  }
  function refreshActs() { var a = $("detail").querySelector(".acts"); if (a && curT) a.outerHTML = actsHTML(curT); }
  function closeDetail(fromPop) { var d = $("detail"); if (!d.classList.contains("on")) return; d.classList.remove("on"); curT = null; if (!fromPop && history.state && history.state.d) history.back(); }
  function dtab(which) {
    var t = curT, box = $("detail").querySelector(".dsect"); if (!t || !box) return;
    qa(".dtabs button", $("detail")).forEach(function (b) { b.classList.toggle("on", b.dataset.dt === which); });
    box.textContent = "";
    if (which === "more") { var l = S.similar(t, 24).filter(function (x) { return x.poster; }); box.appendChild(l.length ? gridOf(l) : h("div", "note", "Nothing similar on your apps yet.")); return; }
    loadEpisodes(t, box);
  }
  function epApp(t) { return S.pickApp(t); }
  function loadEpisodes(t, box, sn) {
    var app = epApp(t);
    if (!window.vesperHasProxy) {
      box.innerHTML = '<div class="note">' + (t.seasons ? esc(S.length(t)) + (t.eps ? " · " + t.eps + " episodes" : "") + ". " : "") +
        "Tap <b>Play</b> and " + esc(LABEL[app] || "the app") + " opens right on this show — it remembers where you left off, so the next episode is one tap away.</div>";
      return;
    }
    box.innerHTML = '<div class="spin"></div>';
    S.seasons(t).then(function (ss) {
      if (curT !== t) return;
      if (!ss.length) throw new Error("none");
      var s = ss.filter(function (x) { return x.n === sn; })[0] || ss[0];
      box.innerHTML = '<button class="seasel" data-seasons>' + esc(s.title && !/^season \d+$/i.test(s.title) ? s.title : "Season " + s.n) + (ss.length > 1 ? G.down : "") + '</button><div class="eps"><div class="spin"></div></div>';
      box._ss = ss;
      return S.episodes(s).then(function (eps) {
        if (curT !== t) return;
        var el = box.querySelector(".eps"); el.textContent = "";
        eps.forEach(function (ep) {
          var e = h("div", "ep"); e._ep = ep;
          e.innerHTML = '<div class="en">' + ep.n + '</div><div class="et"><b>' + esc(ep.title) + "</b><small>" + (ep.runtime ? ep.runtime + "m" : "") + "</small><p>" + esc(ep.desc) + '</p></div><div class="pl">' + G.play + "</div>";
          el.appendChild(e);
        });
        if (!eps.length) el.innerHTML = '<div class="note">No episode list for this season yet.</div>';
      });
    }).catch(function () {
      if (curT !== t) return;
      box.innerHTML = '<div class="note">Couldn\'t load the episode list right now. Tap <b>Play</b> to pick an episode inside ' + esc(LABEL[app] || "the app") + ".</div>";
    });
  }
  function seasonsSheet(box) {
    var ss = box._ss || []; if (ss.length < 2) return;
    sheet("<h3>Seasons</h3>" + ss.map(function (s) { return '<button class="opt" data-season="' + s.n + '"><span>' + esc(s.title && !/^season \d+$/i.test(s.title) ? s.title : "Season " + s.n) + "</span></button>"; }).join(""));
  }
  function playEp(t, ep) {
    var app = epApp(t); if (!app) return;
    if (app === "netflix") { S.markRecent(t.id); return window.V.call("play", { app: app, url: ep.links.netflix || S.playUrl(app, t) }); }
    S.playEpisode(t, app, ep);
  }
  function playTitle(id, app) { var t = S.T[id]; if (!t) return; if (!S.play(t, app)) { openDetail(id); return; } toast("Opening " + LABEL[app || S.pickApp(t)] + "…"); }

  // ---------- Who's watching ----------
  function whoIsWatching(done) {
    var ps = S.profiles(), w = h("div"); w.id = "who"; document.body.appendChild(w);
    function paint() {
      w.innerHTML = "<h2>Who's watching?</h2><div class=\"ppl\">" + S.profiles().map(function (p) { return '<button class="pp" data-p="' + p.id + '">' + S.avatar(p) + esc(p.name) + "</button>"; }).join("") +
        '<button class="pp add" data-add>' + S.avatar(null) + "Add</button></div>";
    }
    paint();
    w.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]");
      if (b) { S.useProfile(b.dataset.p); w.remove(); done(); return; }
      if (e.target.closest("[data-add]")) {
        w.innerHTML = '<h2>Who\'s this?</h2><input maxlength="18" placeholder="Name"><button class="btn play" style="width:200px;flex:none">Continue</button>';
        var inp = w.querySelector("input"); inp.focus();
        function ok() { var v = inp.value.trim(); if (!v) return; var id = S.addProfile(v); S.useProfile(id); w.remove(); done(); }
        w.querySelector("button").onclick = ok; inp.addEventListener("keydown", function (e2) { if (e2.key === "Enter") ok(); });
      }
    });
  }

  // ---------- one tap handler for everything ----------
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-play],[data-list],[data-like],[data-dislike],[data-share],[data-close],[data-dt],[data-seasons],[data-season],[data-tab],[data-go],[data-sheet],[data-pick],[data-qd],[data-nh],[data-wx],[data-mood],[data-prof],[data-padd],[data-pren],[data-prem],[data-fav],[data-clear],.ep,.pc,.wide,.nh,.li,.hero");
    if (!el) return;
    var D = el.dataset;
    var inSheet = !!el.closest("#sheet");
    if (D.play) { e.stopPropagation(); if (inSheet) closeSheet(); return playTitle(D.play, D.app); }
    if (D.qd) { closeSheet(); return openDetail(D.qd); }
    if (inSheet && (D.list || D.like || D.dislike)) setTimeout(function () { closeSheet(); if (D.dislike && tab !== "search") rerender(); }, 120);
    if (D.list) { var on = S.toggle("mylist", D.list, true); buzz(); toast(on ? "Added to My List" : "Removed from My List");
      if (el.closest(".hero")) el.innerHTML = (on ? G.check : G.plus) + "My List"; refreshActs(); return; }
    if (D.like) { var l = S.like(D.like); buzz(); toast(l ? "Got it — more like this" : "Like removed"); refreshActs(); return; }
    if (D.dislike) { var n = S.dislike(D.dislike); buzz(); toast(n ? "Hidden — we won't show it again" : "It's back"); refreshActs(); return; }
    if (D.share) { var st = S.T[D.share], a = S.pickApp(st); if (navigator.share) navigator.share({ title: st.title, url: a ? S.playUrl(a, st).replace("/watch/", "/title/") : undefined }).catch(function () {}); return; }
    if (D.close != null) return closeDetail();
    if (D.dt) return dtab(D.dt);
    if (D.seasons != null) return seasonsSheet(el.closest(".dsect"));
    if (D.season) { closeSheet(); return loadEpisodes(curT, $("detail").querySelector(".dsect"), +D.season); }
    if (el.classList.contains("ep") && curT) return playEp(curT, el._ep);
    if (D.tab) { closeSheet(); closeDetail(); if (D.tab === tab && tab === "home" && sec !== "home") return show("home", "home"); if (D.tab === tab) { $("view").scrollTo({ top: 0, behavior: "smooth" }); return; } return show(D.tab, null, null, true); }
    if (D.go) { closeSheet(); closeDetail(); return show("home", D.go); }
    if (D.sheet === "apps") return appsSheet();
    if (D.sheet === "cats") return catsSheet();
    if (D.sheet === "place") return placeSheet();
    if (D.sheet === "me") return meSheet();
    if (D.pick != null) { var pk = S.pickForMe(); if (pk) openDetail(pk.id); return; }
    if (D.nh) { arg = D.nh; return rerender(); }
    if (D.wx) { setPref("wx", D.wx); if (D.wx === "live") S.fetchWeather(true).then(rerender); return rerender(); }
    if (D.mood) return openMood(D.mood);
    if (D.prof) { S.useProfile(D.prof); closeSheet(); noted = false; return show("home", "home"); }
    if (D.padd != null) return nameSheet("Add a person", "", function (v) { var id = S.addProfile(v); S.useProfile(id); noted = false; show("home", "home"); toast("Hi, " + v); });
    if (D.pren != null) { var me = S.profile(); return me && nameSheet("Rename", me.name, function (v) { S.renameProfile(me.id, v); rerender(); }); }
    if (D.prem != null) { var pr = S.profile(); if (!pr) return; if (el._sure) { S.removeProfile(pr.id); closeSheet(); noted = false; return show("home", "home"); }
      el._sure = 1; el.querySelector("span").textContent = "Tap again to remove " + pr.name; return; }
    if (D.fav) { setPref("app", D.fav); closeSheet(); toast(D.fav === "auto" ? "Playing on the best available app" : "Playing on " + LABEL[D.fav] + " first"); return rerender(); }
    if (D.clear != null) { if (el._sure) { S.clearHistory(); closeSheet(); toast("History cleared"); return rerender(); } el._sure = 1; el.querySelector("span").textContent = "Tap again to forget"; return; }
    var id = D.id || (el.closest("[data-id]") || {}).dataset && el.closest("[data-id]").dataset.id;
    if (id) { closeSheet(); openDetail(id); }
  });
  window.addEventListener("popstate", function () { closeDetail(true); });

  // press and hold any poster: quick actions, like iOS
  (function () {
    var timer = null, x0 = 0, y0 = 0, held = false;
    document.addEventListener("touchstart", function (e) {
      var c = e.target.closest(".pc,.wide,.nh,.li"); held = false; if (!c || !c.dataset.id) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      timer = setTimeout(function () { timer = null; buzz(); held = true; quick(c.dataset.id); }, 480);
    }, { passive: true });
    document.addEventListener("touchmove", function (e) { if (timer && (Math.abs(e.touches[0].clientX - x0) > 8 || Math.abs(e.touches[0].clientY - y0) > 8)) { clearTimeout(timer); timer = null; } }, { passive: true });
    document.addEventListener("touchend", function () { if (timer) { clearTimeout(timer); timer = null; } }, { passive: true });
    document.addEventListener("click", function (e) { if (e.target.closest("#hap,#hapl")) return; if (held) { held = false; if (!e.target.closest("#sheet")) { e.stopPropagation(); e.preventDefault(); } } }, true);
    document.addEventListener("contextmenu", function (e) { if (e.target.closest(".pc,.wide,.nh,.li")) e.preventDefault(); });
  })();
  function quick(id) {
    var t = S.T[id]; if (!t) return; var a = S.pickApp(t), inL = S.inList("mylist", id), lk = S.inList("likes", id), no = S.inList("dislikes", id);
    sheet('<div class="qhead"><img src="' + S.bd(t, "s640") + '"><div><b>' + esc(t.title) + "</b><small>" + metaLine(t).replace(/<i class="dot"><\/i>/g, " · ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ") + "</small></div></div>" +
      (a ? '<button class="opt" data-play="' + id + '">' + G.play + "<span>Play on " + LABEL[a] + "</span></button>" : "") +
      '<button class="opt" data-qd="' + id + '">' + G.info + "<span>Details & episodes</span></button>" +
      '<button class="opt" data-list="' + id + '">' + (inL ? G.check : G.plus) + "<span>" + (inL ? "Remove from My List" : "Add to My List") + "</span></button>" +
      '<button class="opt" data-like="' + id + '">' + G.up + "<span>" + (lk ? "Remove like" : "Like — show me more like this") + "</span></button>" +
      '<button class="opt" data-dislike="' + id + '">' + G.no + "<span>" + (no ? "Show it again" : "Not for me") + "</span></button>");
  }

  // details: swipe down from the top to close
  (function () { var d = $("detail"), y0 = null;
    d.addEventListener("touchstart", function (e) { y0 = d.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    d.addEventListener("touchmove", function (e) { if (y0 == null) return; var dy = e.touches[0].clientY - y0; if (dy > 0) { d.style.transition = "none"; d.style.transform = "translateY(" + dy * 0.8 + "px)"; } }, { passive: true });
    d.addEventListener("touchend", function (e) { if (y0 == null) return; var dy = e.changedTouches[0].clientY - y0; d.style.transition = ""; d.style.transform = ""; y0 = null; if (dy > 120) closeDetail(); });
  })();

  // ---------- start ----------
  $("view").addEventListener("scroll", onScroll, { passive: true });
  function fetchCatalog() { return fetch("catalog.json?d=" + new Date().toISOString().slice(0, 13)).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function start(cat) {
    S.load(cat);
    var go = function () { show("home", "home"); setTimeout(function () { $("boot").classList.add("out"); }, 60); };
    S.fetchWeather(false).catch(function () {});
    if (S.profiles().length > 1) { $("boot").classList.add("out"); whoIsWatching(go); } else go();
  }
  // opened in Safari instead of from the Home Screen: show how to install
  var standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  if (!standalone && /iPhone|iPad/.test(navigator.userAgent)) setTimeout(function () {
    var c = h("div", "coach", '<img src="icons/icon-180.png"><div><b>Put Vesper on your Home Screen</b>Tap <span class="sh">' + G.share + '</span> below, then <b>Add to Home Screen</b>.</div><button>' + G.x + "</button>");
    document.body.appendChild(c); c.querySelector("button").onclick = function () { c.remove(); };
  }, 1500);
  fetchCatalog().then(start).catch(function () {
    $("boot").innerHTML = '<div class="empty"><b>Can\'t reach Vesper</b>Check your connection and open it again.</div>';
  });
  // came back after a while: refresh the list quietly
  var hiddenAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 4 * 3600e3) fetchCatalog().then(function (cat) { S.load(cat); TOPSET = null; noted = false; if (!$("detail").classList.contains("on")) show(tab, sec, arg); }).catch(function () {});
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
})();
