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
    back: I('<path d="M15 5l-7 7 7 7"/>', 2.4),
    r: I('<path d="M9 5l7 7-7 7"/>', 2.2),
    caret: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 9.5h12l-6 6.5z"/></svg>',
    film: I('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>'),
    muted: I('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    sound: I('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
    clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    heart: I('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>'),
    people: I('<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.7-3.2 3-4.8 6-4.8s5.3 1.6 6 4.8"/><circle cx="17" cy="9.5" r="2.6"/><path d="M16.5 14.8c2.4.2 4 1.6 4.5 4.2"/>'),
    cloud: I('<path d="M7.5 18.5a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5 3.75 3.75 0 0 1 0 7.5z"/><path d="M9.5 13.5l2 2 3.5-3.5"/>'),
    google: '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
    menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>', 2),
    person: I('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.9-3.6 3.6-5.4 7-5.4s6.1 1.8 7 5.4"/>'),
    send: I('<path d="M21 3.5L10.5 13.5M21 3.5l-6.5 17-4-7-7-4z"/>'),
    bell: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    upOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10.5v9H4.5v-9zM8.5 10.3l3.7-6c1.4 0 2.3 1 2.1 2.3l-.6 3.2h5a1.9 1.9 0 0 1 1.9 2.3l-1.4 6.2a1.9 1.9 0 0 1-1.9 1.5H8.5z"/></svg>'
  };

  // ---------- state ----------
  S.state = window.vesperState;
  var _po = S.po, _bd = S.bd, webp = function (u) { return u ? u.replace(/\.jpg$/, ".webp") : u; };
  S.po = function (t, size) { return t && /^https?:/.test(t.poster || "") ? t.poster : webp(_po(t, size)); };
  S.bd = function (t, size) { return t && /^https?:/.test(t.backdrop || "") ? t.backdrop : webp(_bd(t, size)); };
  // an image that fails as WebP quietly retries as JPEG, then a smaller size
  window.vImgErr = function (im) {
    var u = im.src; if (/\.webp$/.test(u)) { im.src = u.replace(/\.webp$/, ".jpg"); return; }
    if (/\/s592\//.test(u)) { im.src = u.replace("/s592/", "/s332/"); return; }
    im.remove();
  };
  var tab = "home", sec = "home", arg = null, noted = false, POS = {};
  function setPref(k, v) { var p = Object.assign({}, S.state.prefs || {}); p[k] = v; S.setRaw("prefs", p); }
  function toast(msg, act, fn) {
    var t = $("toast"); t.textContent = msg; t.classList.toggle("act", !!act);
    if (act) { var b = document.createElement("button"); b.innerHTML = act; b.onclick = function (e) { e.stopPropagation(); t.classList.remove("on"); fn(); }; t.appendChild(b); }
    t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("on"); }, act ? 4500 : 1800);
  }
  // the title's own page in its app (not playback), where that app's own + My List button is
  function openTitlePage(t) {
    var a = t.orig && (t.avail || []).indexOf(t.orig) >= 0 ? t.orig : S.pickApp(t); if (!a) return;
    window.vesperOpen(a, S.playUrl(a, t).replace("/watch/", "/title/"));
  }
  // iPhone haptics: Safari gives a light tap when a switch control is toggled, so we keep a hidden one to "press"
  var hapEl = (function () { var w = h("div"); w.style.cssText = "position:fixed;left:-99px;top:0;width:1px;height:1px;overflow:hidden;opacity:0";
    w.innerHTML = '<input type="checkbox" switch id="hap"><label for="hap" id="hapl"></label>'; document.body.appendChild(w); return w.querySelector("label"); })();
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(8); else hapEl.click(); } catch (e) {} }

  var SECT_NAMES = { home: "Home", shows: "Series", movies: "Films", collections: "Collections", anime: "Anime", korean: "Korean", english: "Hollywood", uk: "British",
    indian: "Indian", world: "World Cinema", throwback: "Throwback", time: "Fits Your Time", weather: "Weather", "new": "New & Hot", mylist: "My List" };
  S.APPS.forEach(function (a) { SECT_NAMES["app:" + a] = LABEL[a]; });
  var CATS = [["throwback", "Throwback 2005–19"], ["collections", "Collections"], ["anime", "Anime"], ["korean", "Korean"], ["english", "Hollywood"], ["uk", "British"], ["indian", "Indian"], ["world", "World Cinema"]];

  // ---------- cards ----------
  var TOPSET = null;
  function topRank(t) { if (!TOPSET) { TOPSET = {}; var tp = S.CAT.top10 || {}; (tp.shows || []).concat(tp.movies || []).forEach(function (id) { TOPSET[id] = 1; }); } return TOPSET[t.id]; }
  function badge(t) {
    var soon = S.soonOf(t); if (soon && !(t.avail || []).length) return '<div class="bdg soon">' + esc(S.fmtDate(soon.date).toUpperCase()) + "</div>";
    var a = S.arrivalOf(t); if (a) return '<div class="bdg">' + (a.season > 1 ? "NEW SEASON" : "NEW") + "</div>";
    return topRank(t) ? '<div class="t10b"><b>TOP</b><i>10</i></div>' : "";
  }
  function poster(t, i) {
    var c = h("div", "pc"); c.dataset.id = t.id;
    var src = S.po(t, "s592"), lg = t.orig ? '<img class="lg" src="' + LOGO[t.orig] + '">' : "";
    c.innerHTML = (src ? '<img class="p"' + (i != null && i < 6 ? "" : ' loading="lazy"') + ' decoding="async" src="' + src + '" onload="this.classList.add(\'ok\')" onerror="vImgErr(this)">' : "") +
      '<div class="nt"' + (src ? ' style="opacity:0"' : "") + ">" + esc(t.title) + "</div>" + lg + badge(t) + (window.VSB ? VSB.label(t) : "");
    if (src) { var im = c.querySelector("img.p"); im.addEventListener("error", function () { if (im.dataset.f === "1" && !im.isConnected) c.querySelector(".nt").style.opacity = 1; setTimeout(function () { if (!im.isConnected) c.querySelector(".nt").style.opacity = 1; }, 50); }); }
    return c;
  }
  function topCard(t, i) { var c = h("div", "tc"); c.innerHTML = '<div class="num">' + (i + 1) + "</div>"; var p = poster(t, i); p.querySelector(".t10b") && p.querySelector(".t10b").remove(); c.appendChild(p); return c; }
  function wideCard(t) {
    var c = h("div", "wide"); c.dataset.id = t.id; c.style.setProperty("--gh", S.glowHue(t));
    var a = t.orig || S.pickApp(t);
    c.innerHTML = '<div class="art"><img decoding="async" loading="lazy" src="' + S.bd(t, "s1440") + '" onload="this.classList.add(\'ok\')"><div class="g"></div>' +
      (a ? '<img class="lg" src="' + LOGO[a] + '">' : "") + '<div class="nm">' + esc(t.title) + '</div></div><div class="vibe">' + S.vibes(t).map(esc).join(" · ") + "</div>";
    return c;
  }
  function trioNote() { var p = S.partOfDay(), wn = S.wxNow(); return (wn && (p === "evening" || p === "night") ? wn.title + " · " : "") + "for " + (p === "morning" ? "this morning" : p === "afternoon" ? "this afternoon" : "tonight"); }
  function rowEl(r) {
    var row = h("div", "row"), rail = h("div", "rail" + (r.kind === "top10" ? " toprail" : ""));
    row.innerHTML = '<div class="row-h">' + esc(r.title) + (r.kind === "trio" ? "<small>" + esc(trioNote()) + "</small>" : r.sub ? "<small>" + esc(r.sub) + "</small>" : "") +
      (r.more ? '<button class="seeall" data-go="throwback" data-era="' + r.more + '">All' + G.r + "</button>" : "") + "</div>";
    row.appendChild(rail);
    row._fill = function () {
      if (row._done) return; row._done = 1; var f = document.createDocumentFragment();
      if (r.kind === "trio") {
        r.items.forEach(function (t) { f.appendChild(wideCard(t)); });
        var s = h("div", "wide surprise", '<div class="art"><div class="q">' + G.dice + "</div><b>Tonight's surprise</b><small>Tap to turn it over</small></div><div class=\"vibe\">&nbsp;</div>");
        s.addEventListener("click", function (e) { e.stopPropagation(); var t = S.surprisePick(); if (!t) return; buzz(); s.replaceWith(wideCard(t)); });
        f.appendChild(s);
      } else r.items.forEach(function (t, i) { f.appendChild(r.kind === "top10" ? topCard(t, i) : poster(t, i)); });
      rail.appendChild(f);
      if (POS[r.title]) rail.scrollLeft = POS[r.title];
      rail.addEventListener("scroll", function () { POS[r.title] = rail.scrollLeft; }, { passive: true });
    };
    return row;
  }
  var io = null;
  function addRows(box, rows) {
    if (!io) io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target._fill(); io.unobserve(e.target); } }); }, { root: $("view"), rootMargin: "600px 0px" });
    rows.forEach(function (r, i) { var el = rowEl(r), f = el._fill; el._fill = function () { try { f(); } catch (e) { console.error(e); el.remove(); } };   // one bad row never breaks the page
      box.appendChild(el); if (i < 3) el._fill(); else io.observe(el); });
  }
  function gridOf(list) { var g = h("div", "grid"); list.forEach(function (t, i) { g.appendChild(poster(t, i < 9 ? i : null)); }); return g; }

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
        ? '<button class="chip x" data-go="home">' + G.x + '</button><button class="chip on" data-sheet="' + (sec === "time" ? "time" : sec.indexOf("app:") === 0 ? "apps" : CATS.some(function (c) { return c[0] === sec; }) ? "cats" : "") + '">' +
          (sec.indexOf("app:") === 0 ? '<img src="' + LOGO[sec.slice(4)] + '">' : sec === "time" ? G.clock : "") + esc(sec === "time" ? tLabel(S.pref("tmax", 60)) : SECT_NAMES[sec] || "") + (sec === "shows" || sec === "movies" ? "" : G.caret) + "</button>" +
          (sec === "shows" ? '<button class="chip" data-go="movies">Films</button>' : sec === "movies" ? '<button class="chip" data-go="shows">Series</button>' : "")
        : '<button class="chip" data-sheet="time">' + G.clock + 'Time</button><button class="chip" data-go="shows">Series</button><button class="chip" data-go="movies">Films</button><button class="chip" data-go="throwback">Throwback</button><button class="chip" data-sheet="apps">Your Apps' + G.caret + '</button><button class="chip" data-sheet="cats">Categories' + G.caret + "</button>";
      if (sec === "throwback") { var ce = S.pref("era", "e10");
        chips = '<button class="chip x" data-go="home">' + G.x + "</button>" + ERAS.map(function (x) { return '<button class="chip era' + (x.k === ce ? " on" : "") + '" data-era="' + x.k + '">' + x.label + "</button>"; }).join(""); }
      var title = inSec ? esc(SECT_NAMES[sec] || "") : p ? "For " + esc(p.name) : "Home";
      top.innerHTML = '<div class="hrow"><img class="logo" src="icons/icon-180.png" alt=""><h1>' + title + "</h1>" +
        '<button class="hbtn" data-pick title="Pick for me">' + G.dice + '</button><button class="hbtn" data-tab="search">' + G.search + "</button></div><div class=\"chips\">" + chips + "</div>";
    } else {
      var T = { "new": "New & Hot", weather: "Weather", search: "Search", mylist: "My Vesper" }[tab];
      top.innerHTML = '<div class="hrow"><h1>' + T + "</h1>" + (tab === "mylist" ? '<button class="hbtn" data-tab="search">' + G.search + '</button><button class="hbtn" data-sheet="me">' + G.menu + "</button>" : "") + "</div>";
    }
    top.style.display = tab === "weather" ? "none" : "";
  }
  // the page glows with the colours of the billboard poster (a softly blurred copy of it, like Netflix)
  function setAmb(t) {
    var a = $("amb"); if (!t) { a.classList.remove("on"); return; }
    var src = S.po(t, "s332"); if (a._src === src) { a.classList.add("on"); return; }
    a._src = src; var im = new Image(); im.decoding = "async"; im.src = src;
    im.onload = function () { a.innerHTML = ""; a.appendChild(im); a.appendChild(h("div", "fade")); requestAnimationFrame(function () { a.classList.add("on"); }); };
  }
  function tabs() {
    var p = S.profile();
    var T = [["home", "Home", tab === "home" ? G.homeOn : G.home], ["new", "New & Hot", G.hot], ["weather", "Weather", G.weather], ["search", "Search", G.search],
      ["mylist", "My Vesper", p ? S.avatar(p) : G.list]];
    $("tabs").innerHTML = T.map(function (x) { return '<button data-tab="' + x[0] + '" class="' + (x[0] === tab ? "on" : "") + '">' + x[2] + "<span>" + x[1] + "</span></button>"; }).join("");
  }
  var lastY = 0;
  function island() {
    var d = $("detail"), on = d.classList.contains("on") ? d.scrollTop > 120 : tab === "weather" && $("view").scrollTop > 40;
    var I = $("isl"), db = d.querySelector(".dbar"), bar = d.classList.contains("on") && d.scrollTop > 260;
    I.classList.toggle("on", (on && !bar) || !!$("trl")); if (db) db.classList.toggle("bar", bar);
  }
  var scrollQ = false;
  function onScroll() { if (scrollQ) return; scrollQ = true; requestAnimationFrame(function () { scrollQ = false; doScroll(); }); }
  function doScroll() {
    island();
    var y = $("view").scrollTop, top = $("top");
    top.classList.toggle("solid", y > 30); $("amb").style.opacity = Math.max(0, 1 - y / 700);
    if (y > 160 && y > lastY + 4) top.classList.add("tuck"); else if (y < lastY - 6 || y < 120) top.classList.remove("tuck");
    lastY = y;
  }

  // ---------- navigation ----------
  function show(t, s, a, keepY) {
    var v = $("view");
    POS["_y:" + tab + ":" + sec] = v.scrollTop;
    tab = t; if (t === "home") sec = s || "home"; arg = a == null ? null : a;
    header(); tabs();
    var page = h("div", "page" + (t === "weather" ? " flush" : t === "home" ? "" : " short"));
    if (io) { io.disconnect(); io = null; }   // one loader per page, shared by every group of rows on it
    v.textContent = ""; v.appendChild(page);
    if (t !== "home") setAmb(null);
    if (!(t === "home" && sec === "throwback")) delete document.documentElement.dataset.era;
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
  function rankOf(t) { var tp = S.CAT.top10 || {}, i = (tp.shows || []).indexOf(t.id); if (i >= 0) return "#" + (i + 1) + " in Series Today"; i = (tp.movies || []).indexOf(t.id); return i >= 0 ? "#" + (i + 1) + " in Films Today" : null; }
  function genreWords(t) {
    var w = S.vibes(t).slice(0, 2), g = (t.genres || []).filter(function (x) { return x !== "drm"; })[0] || (t.genres || [])[0], gn = g && S.GENRES[g];
    if (gn && w.length < 3) w.push(gn.replace(" & Animation", ""));
    if ((t.imdb || 0) >= 8.2 && w.length < 3) w.push("Critically Acclaimed");
    return w.slice(0, 3);
  }
  var heroTimer = null;
  function slide(t, s, wn, first) {
    var arr = S.arrivalOf(t), kicker = s === "home" && wn && S.wxRow(wn.k, 30).indexOf(t) >= 0 ? wn.hero : arr ? (arr.season > 1 ? "New Season" : "Just Added") : rankOf(t);
    var el = h("section", "hero"); el.dataset.id = t.id;
    var inL = S.inList("mylist", t.id), a = t.orig || S.pickApp(t);
    el.innerHTML = '<img class="p" decoding="async"' + (first ? ' fetchpriority="high"' : ' loading="lazy"') + ' src="' + S.po(t, "s718") + '" onload="this.classList.add(\'ok\')" onerror="vImgErr(this)"><div class="sh"></div>' +
      (a ? '<img class="svc" src="' + LOGO[a] + '">' : "") + '<div class="inf">' +
      (kicker ? '<div class="kick">' + esc(kicker) + "</div>" : "") + '<div class="nm">' + esc(t.title) + '</div><div class="line">' +
      genreWords(t).map(esc).join('<i class="dot"></i>') + "</div>" +
      '<div class="btns"><button class="btn play" data-play="' + t.id + '">' + G.play + (S.pickApp(t) ? "Play" : "Soon") + '</button><button class="btn ghost" data-list="' + t.id + '">' + (inL ? G.check : G.plus) + "My List</button></div></div>";
    return el;
  }
  // a swipeable billboard: six picks, the page glow follows the one you're looking at
  function heroEl(s) {
    var hid = S.hiddenSet(), list = S.heroFor(s).filter(function (t) { return !hid[t.id] && t.poster; }); if (!list.length) return null;
    if (s === "home") { var last = S.list("lastHero")[0], k = list.findIndex(function (x) { return x.id === last; }); list = list.slice(k + 1).concat(list.slice(0, k + 1)); S.set("lastHero", [list[0].id]); }
    else list = list.slice().sort(function () { return Math.random() - 0.5; });
    list = list.slice(0, 6);
    var wn = S.wxNow(), box = h("div", "heros"), track = h("div", "htrack"), dots = h("div", "hdots");
    list.forEach(function (t, i) { track.appendChild(slide(t, s, wn, i === 0)); });
    dots.innerHTML = list.map(function (_, i) { return "<i" + (i ? "" : ' class="on"') + "></i>"; }).join("");
    box.appendChild(track); if (list.length > 1) box.appendChild(dots);
    var cur = 0, touching = false;
    function at() { return Math.round(track.scrollLeft / (track.firstChild.offsetWidth + 12)); }
    track.addEventListener("scroll", function () { var i = at(); if (i !== cur && list[i]) { cur = i; setAmb(list[i]); [].forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j === i); }); buzz(); } }, { passive: true });
    track.addEventListener("touchstart", function () { touching = true; }, { passive: true });
    track.addEventListener("touchend", function () { touching = false; }, { passive: true });
    clearInterval(heroTimer);
    heroTimer = setInterval(function () {
      if (!box.isConnected) return clearInterval(heroTimer);
      if (touching || document.hidden || $("detail").classList.contains("on") || $("view").scrollTop > 200) return;
      var n = (cur + 1) % list.length; track.scrollTo({ left: n * (track.firstChild.offsetWidth + 12), behavior: "smooth" });
    }, 9000);
    setAmb(list[0]);
    return box;
  }
  // every open feels new: inside each row, titles get a gentle shuffle (popular ones still lean to the front);
  // ranked rows (Top 10, Coming Soon, New this week) and your own lists keep their order
  var KEEP_ORDER = /^(Top 10|Coming Soon|New on|New Seasons|Continue|My List|Liked|Not for Me|Watched|Tonight's Three)/;
  function jitter(rows) {
    rows.forEach(function (r) {
      if (!r || r.kind === "top10" || r.kind === "trio" || r.keep || KEEP_ORDER.test(r.title)) return;
      r.items = r.items.map(function (t, i) { return { t: t, k: i + Math.random() * 9 }; }).sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.t; });
    });
    return rows;
  }
  // rows themselves drift a few places each open: your own rows and Tonight's Three stay on top,
  // everything else (Top 10, Trending, the weather row…) moves up or down a little
  var PINNED = /^(Continue|My List|Tonight's Three)/;
  function drift(rows) {
    var top = [], rest = [];
    rows.forEach(function (r) { (PINNED.test(r.title) || r.kind === "trio" ? top : rest).push(r); });
    rest = rest.map(function (r, i) { return { r: r, k: i + Math.random() * 4.5 }; }).sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.r; });
    return top.concat(rest);
  }
  function renderSection(page, s) {
    var rows = S.finalize((S.SECTIONS[s] || S.SECTIONS.home)());
    if (s !== "mylist" && s !== "new") rows = drift(jitter(S.freshen(rows, s)));
    if (s === "home" && !noted) { noted = true; S.noteShown(rows); }
    if (s === "throwback") page.appendChild(eraBar());
    if (s === "home") { var tz = S.finalize([throwbackTeaser()]); if (tz.length) rows.splice(Math.min(6, rows.length), 0, tz[0]); }
    var hero = heroEl(s); if (hero) page.appendChild(hero); else setAmb(null);
    if (s === "home" && S.list("likes").length + S.list("dislikes").length < 6 && !(S.state[qrKey()] || []).length)
      page.appendChild(h("button", "qrprompt", G.heart + "<span><b>Teach Vesper your taste</b><small>Swipe through 20 posters — takes a minute</small></span>" + G.r)).dataset.qr = "1";
    if (!rows.length) page.appendChild(h("div", "empty", "<b>Nothing here yet</b>The show list is still loading."));
    addRows(page, rows);
  }

  // ---------- Throwback: American films 2005–2019, one era at a time ----------
  var ERAS = [{ k: "e05", label: "2005–09", tag: "Flip phones, iPods and indie soundtracks", a: 2005, b: 2009, seg: "us_e05", tv: "us_se05" },
    { k: "e10", label: "2010–14", tag: "Bromances, Instagram filters and New York lofts", a: 2010, b: 2014, seg: "us_e10", tv: "us_se10" },
    { k: "e15", label: "2015–19", tag: "Group chats, road trips and one last summer", a: 2015, b: 2019, seg: "us_e15", tv: "us_se15" }];
  function eraOf(k) { return ERAS.filter(function (e) { return e.k === k; })[0] || ERAS[1]; }
  function eraPool(e, anyYear) {
    var yr = anyYear ? 0 : S.pref("eraYear", 0), A0 = e.a, B0 = e.b; if (yr >= e.a && yr <= e.b) e = Object.assign({}, e, { a: yr, b: yr });
    var seen = {}, out = [], A = S._, hid = S.hiddenSet();
    A.seg(e.seg).concat(S.ALL.filter(function (t) { return t.type === "MOVIE" && t.year >= e.a && t.year <= e.b && (t.countries || []).indexOf("US") >= 0; }))
      .forEach(function (t) { if (!seen[t.id] && !hid[t.id] && (t.avail || []).length && t.year >= e.a && t.year <= e.b && t.type === "MOVIE" && everyday(t) && american(t)) { seen[t.id] = 1; out.push(t); } });
    return out;
  }
  // the American series that started in that era (live-action, real-world)
  function eraTV(e) {
    var yr = S.pref("eraYear", 0); if (yr >= e.a && yr <= e.b) e = Object.assign({}, e, { a: yr, b: yr });
    var seen = {}, out = [], hid = S.hiddenSet();
    S._.seg(e.tv).concat(S.ALL.filter(function (t) { return t.type === "SHOW" && t.year >= e.a && t.year <= e.b && (t.countries || []).indexOf("US") >= 0; }))
      .forEach(function (t) { var g = t.genres || []; if (!seen[t.id] && !hid[t.id] && (t.avail || []).length && t.type === "SHOW" && t.year >= e.a && t.year <= e.b &&
        g.indexOf("ani") < 0 && g.indexOf("rly") < 0 && g.indexOf("fml") < 0 && (t.votes || 0) >= 15000) { seen[t.id] = 1; out.push(t); } });
    return out;
  }
  function american(t) {
    var c = t.countries || []; if (c.indexOf("US") < 0) return false;
    if (t.otitle && !/^[\x00-\x7f]+$/.test(t.otitle)) return false;            // original title in another language
    return !c.some(function (x) { return ["IN", "KR", "JP", "LB", "FR", "ES", "DE", "IT", "CN", "MX", "IR", "AU", "NZ"].indexOf(x) >= 0 && c.length <= 3 && x !== "US" && c.indexOf("GB") < 0 && x !== "CA"; });
  }
  // real-world films: no animation, superheroes, fantasy or sci-fi, and the mega-blockbusters step aside
  function everyday(t) {
    var g = t.genres || [];
    if (g.indexOf("ani") >= 0 || g.indexOf("fnt") >= 0 || g.indexOf("scf") >= 0 || g.indexOf("fml") >= 0) return false;
    if (g.indexOf("act") >= 0 && (t.votes || 0) > 450000) return false;
    return (t.votes || 0) >= 9000;
  }
  // "famous but not mega": the films people liked then, not the ones still on every billboard
  function famous(l) { return l.slice().sort(function (a, b) { function sc(t) { var v = t.votes || 0; return (v > 900000 ? 900000 - (v - 900000) : v) * (0.6 + (t.imdb || 6) / 15); } return sc(b) - sc(a); }); }
  function about(re) { return function (t) { return re.test(t.desc || ""); }; }
  function hasGenre() { var g = [].slice.call(arguments); return function (t) { return (t.genres || []).some(function (x) { return g.indexOf(x) >= 0; }); }; }
  function byVotes(l) { return l.slice().sort(function (a, b) { return (b.votes || 0) - (a.votes || 0); }); }
  function eraRows(e) {
    var notDoc = function (t) { return !hasGenre("doc")(t) && !/stand-?up|comedy special/i.test(t.desc || ""); };
    var P = eraPool(e), TV = eraTV(e), R = S.R, Q = S._.byQ;
    var nyc = /new york|manhattan|brooklyn|\bnyc\b|queens|harlem|the bronx|wall street|upper east side/i;
    var twenties = /college|fraternity|\bfrat\b|sorority|roommate|twenty-?something|bachelor|best friends?|wedding|graduat|dating|one night|single (guy|girl|woman|man)|party/i;
    var teen = /high school|teenag|\bteen\b|prom\b|senior year|homecoming|coming[- ]of[- ]age/i;
    var grit = /\bcoach|underdog|championship|\bboxer|\bboxing|olympic|\bleague\b|wrestl|\bsprint/i;
    var truth = /true story|based on the (true|real)|real[- ]life|inspired by (the )?true|biopic|memoir/i;
    var heist = /\bheist|\brobbery|bank job|\bcon (man|men|artist)|\bthie(f|ves)\b|\bspy\b|\bspies\b|\bcia\b|espionage|undercover|safecracker/i;
    var road = /road trip|cross-country|\bvacation|spring break|summer (break|camp|vacation|job)|bachelor party|las vegas|\bvegas\b|on the road/i;
    var holiday = /christmas|thanksgiving|holiday|new year|santa/i;
    var town = /small[- ]town|hometown|suburb|midwest|rural|farm town|quiet town/i;
    var rows = [];
    // made for you: the era, ordered by what you like
    var T = S.taste();
    if (T.n >= 8) rows.push(R("Your " + e.label + " Picks", P.slice().sort(function (a, b) { return S.tasteScore(b, T) - S.tasteScore(a, T); }), null, "ordered by what you like"));
    rows.push(R("Everyone Watched These", famous(P), null, "the films that defined the era"),
      R("New York State of Mind", Q(P.concat(TV).filter(about(nyc))), null, "city lights, small apartments, big plans"),
      R("Twenty-Somethings", famous(P.filter(about(twenties)).filter(hasGenre("cmy", "rma", "drm"))), null, "friends, bad decisions, figuring it out"),
      R("Binge the Era", famous(TV), null, "the shows everyone talked about at school or work"),
      R("Crime, Guilt & Rain", Q(P.filter(hasGenre("crm", "trl")).filter(function (t) { return (t.imdb || 0) >= 6.8; })), null, "grey skies and hard choices"),
      R("Teen Years", famous(P.filter(about(teen)).filter(hasGenre("cmy", "rma", "drm")).filter(function (t) { return !hasGenre("hrr", "trl", "crm")(t); })), null, "lockers, parties, one big night"),
      R("Date-Night Rom-Coms", famous(P.filter(hasGenre("rma"))), null, "the ones you'd rewatch on a rainy Sunday"),
      R("Heists, Cons & Spies", famous(P.filter(about(heist)).filter(hasGenre("crm", "trl", "act", "cmy"))), null, "the plan always goes wrong"),
      R("Road Trips & Summers", famous(P.filter(about(road)).filter(function (t) { return !hasGenre("hrr", "war")(t); })), null, "windows down, no plan"),
      R("Underdogs", Q(P.filter(function (t) { return (about(grit)(t) && hasGenre("drm", "cmy", "spt")(t)) || hasGenre("spt")(t); })), null, "nobody believed in them"),
      R("True Stories", Q(P.filter(about(truth))), null, "it really happened"),
      R("Small-Town America", Q(P.filter(about(town)).filter(function (t) { return !hasGenre("hrr")(t); })), null, "porches, secrets, one main street"),
      R("Laugh Out Loud", famous(P.filter(hasGenre("cmy")).filter(function (t) { return !hasGenre("rma")(t); })), null),
      R("Cult Favourites", Q(P.filter(notDoc).filter(function (t) { return (t.imdb || 0) >= 7.3 && t.votes >= 60000 && t.votes <= 320000; })), null, "the ones friends kept telling you about"),
      R("Holiday Comfort", famous(P.filter(about(holiday))), null, "blankets and hot chocolate", 4),
      R("Forgotten Gems", Q(P.filter(notDoc).filter(function (t) { return (t.imdb || 0) >= 7 && t.votes >= 9000 && t.votes <= 160000; })), null, "loved then, quietly buried since"));
    return rows;
  }
  S.SECTIONS.throwback = function () { return eraRows(eraOf(S.pref("era", "e10"))); };
  function eraBar() {
    var e = eraOf(S.pref("era", "e10")), b = h("div", "erabar");
    var yr = S.pref("eraYear", 0), years = []; for (var y = e.a; y <= e.b; y++) years.push(y);
    b.innerHTML = '<div class="eratag">' + esc(e.tag) + '</div><div class="years"><button class="' + (!yr || yr < e.a || yr > e.b ? "on" : "") + '" data-eyear="0">All ' + e.label + "</button>" +
      years.map(function (y) { return '<button class="' + (yr === y ? "on" : "") + '" data-eyear="' + y + '">' + y + "</button>"; }).join("") + '</div><button class="roulette" data-roulette="' + e.k + '">' + G.dice + "<span>Throwback Roulette<small>one great " + e.label + " pick, chosen for you</small></span></button>";
    document.documentElement.dataset.era = e.k;
    return b;
  }
  function roulette(k) {
    var e = eraOf(k), P = eraPool(e).filter(function (t) { return (t.imdb || 0) >= 6.6; }), T = S.taste();
    var l = P.map(function (t) { return { t: t, s: (T.n >= 5 ? S.tasteScore(t, T) : 0) + (t.imdb || 6) * 3 + Math.random() * 14 }; }).sort(function (a, b) { return b.s - a.s; });
    var pick = l[0] && l[0].t; if (pick) { buzz(); openDetail(pick.id); }
  }
  // one small doorway on Home (a different era each day), so Home never gets crowded
  function throwbackTeaser() {
    var e = ERAS[new Date().getDate() % 3], P = eraPool(e, true), hid = S.hiddenSet();
    var items = famous(P).slice(0, 24).filter(function (t) { return !hid[t.id]; });
    var r = S.R("Throwback · " + e.label, items.sort(function () { return Math.random() - 0.5; }), null, "American films you forgot you loved");
    r.more = e.k; return r;
  }

  // ---------- "I have…" — only what fits the time you've got ----------
  var TIMES = [[30, "30 min"], [60, "1 hour"], [90, "1½ hours"], [120, "2 hours"], [180, "A whole evening"]];
  function tLabel(m) { return (TIMES.filter(function (x) { return x[0] === m; })[0] || [0, m + " min"])[1]; }
  S.SECTIONS.time = function () {
    var m = S.pref("tmax", 60), R = S.R, Q = S._.byQ, hid = S.hiddenSet();
    var ok = S.ALL.filter(function (t) { return (t.avail || []).length && !hid[t.id] && t.runtime; });
    var films = ok.filter(function (t) { return t.type === "MOVIE" && t.runtime <= m && t.runtime >= Math.min(70, m - 20); });
    var eps = ok.filter(function (t) { return t.type === "SHOW" && t.runtime <= Math.min(m, 65) && t.runtime >= (m <= 30 ? 15 : 25); });
    var g = function (l, x) { return l.filter(function (t) { return (t.genres || []).indexOf(x) >= 0; }); };
    var rows = [];
    if (m >= 80) rows.push(R("Films That Fit", Q(films), null, "all " + (m >= 180 ? "evening-length" : "under " + tLabel(m).toLowerCase())));
    rows.push(R(m <= 30 ? "One Episode, Done" : "Shows to Start Tonight", Q(eps), null, "episodes under " + Math.min(m, 65) + " minutes"));
    rows.push(R("Quick Laughs", Q(g(eps, "cmy").concat(g(films, "cmy"))), null), R("Edge of Your Seat", Q(g(films, "trl").concat(g(eps, "trl"), g(eps, "crm"))), null),
      R("Feel Something", Q(g(films, "drm").concat(g(eps, "drm"))), null), R("Anime Episodes", Q(g(eps, "ani")), null, "around 24 minutes each"),
      R("Romance", Q(g(films, "rma").concat(g(eps, "rma"))), null), R("Real Stories", Q(g(films, "doc").concat(g(eps, "doc"))), null));
    if (m >= 120) rows.push(R("Worth Every Minute", Q(films.filter(function (t) { return (t.imdb || 0) >= 8; })), null, "8+ on IMDb"));
    return rows;
  };
  function timeSheet() {
    var cur = S.pref("tmax", 60);
    sheet("<h3>How much time do you have?</h3>" + TIMES.map(function (x) { return '<button class="opt' + (x[0] === cur && sec === "time" ? " on" : "") + '" data-tmax="' + x[0] + '">' + G.clock + "<span>" + x[1] + "</span></button>"; }).join(""));
  }

  // ---------- Quick Rate: swipe through posters to teach Vesper your taste ----------
  function qrKey() { return "rated" + (S.state.profile ? "@" + S.state.profile : ""); }
  function quickRate() {
    var done = {}; ["likes", "dislikes", "mylist", "watched"].forEach(function (k) { S.list(k).forEach(function (id) { done[id] = 1; }); });
    (S.state[qrKey()] || []).forEach(function (id) { done[id] = 1; });
    var pool = S.ALL.filter(function (t) { return !done[t.id] && t.poster && (t.votes || 0) > 40000 && (t.avail || []).length; })
      .sort(function (a, b) { return (b.votes || 0) - (a.votes || 0); }).slice(0, 160).sort(function () { return Math.random() - 0.5; }).slice(0, 20);
    if (!pool.length) { toast("You've rated everything — nice"); return; }
    var o = h("div", "qr"); o.id = "qr"; document.body.appendChild(o);
    var i = 0, liked = 0, rated = [];
    o.innerHTML = '<div class="qtop"><button data-qclose>' + G.x + '</button><div class="qprog"></div><b class="qcount"></b></div><div class="qstack"></div>' +
      '<div class="qhint">Swipe right if you liked it · left if not for you · up to save</div>' +
      '<div class="qbtns"><button class="no" data-qa="no">' + G.x + '</button><button class="sk" data-qa="skip">Haven\'t seen</button><button class="sv" data-qa="save">' + G.plus + '</button><button class="yes" data-qa="yes">' + G.heart + "</button></div>";
    var stack = o.querySelector(".qstack");
    function card(t) { var c = h("div", "qcard"); c.innerHTML = '<img src="' + S.po(t, "s718") + '"><div class="qsh"></div><div class="qinf"><b>' + esc(t.title) + "</b><small>" + [t.year, genreWords(t).slice(0, 2).join(" · ")].filter(Boolean).join(" · ") +
      '</small></div><div class="qstamp yes">LIKED</div><div class="qstamp no">NOPE</div><div class="qstamp save">SAVED</div>'; return c; }
    function paint() {
      stack.textContent = "";
      o.querySelector(".qprog").innerHTML = pool.map(function (_, j) { return "<i" + (j < i ? ' class="d"' : j === i ? ' class="c"' : "") + "></i>"; }).join("");
      o.querySelector(".qcount").textContent = Math.min(i + 1, pool.length) + "/" + pool.length;
      if (i >= pool.length) return finish();
      if (pool[i + 1]) { var b = card(pool[i + 1]); b.classList.add("under"); stack.appendChild(b); }
      var c = card(pool[i]); stack.appendChild(c); drag(c);
    }
    function act(kind, c) {
      var t = pool[i]; if (!t) return; buzz();
      if (kind === "yes") { S.like(t.id); liked++; } else if (kind === "no") S.dislike(t.id); else if (kind === "save") S.toggle("mylist", t.id, true);
      rated.push(t.id); S.setRaw(qrKey(), (S.state[qrKey()] || []).concat([t.id]).slice(-600));
      c = c || stack.lastChild; c.classList.add("go-" + kind);
      i++; setTimeout(paint, 260);
    }
    function drag(c) {
      var x0 = 0, y0 = 0, dx = 0, dy = 0, on = false;
      c.addEventListener("touchstart", function (e) { on = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; c.style.transition = "none"; }, { passive: true });
      c.addEventListener("touchmove", function (e) { if (!on) return; dx = e.touches[0].clientX - x0; dy = e.touches[0].clientY - y0;
        c.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx / 18 + "deg)";
        c.classList.toggle("s-yes", dx > 60); c.classList.toggle("s-no", dx < -60); c.classList.toggle("s-save", dy < -80 && Math.abs(dx) < 60); }, { passive: true });
      c.addEventListener("touchend", function () { on = false; c.style.transition = "";
        if (dx > 100) { c.style.transform = ""; act("yes", c); } else if (dx < -100) { c.style.transform = ""; act("no", c); } else if (dy < -120) { c.style.transform = ""; act("save", c); }
        else { c.style.transform = ""; c.classList.remove("s-yes", "s-no", "s-save"); } dx = dy = 0; });
    }
    function finish() {
      stack.innerHTML = '<div class="qdone">' + G.heart + "<b>Your picks just got sharper</b><small>You rated " + rated.length + " titles" + (liked ? " and liked " + liked : "") + ". Home now leans your way.</small>" +
        '<button class="btn play" data-qhome>See my picks</button></div>';
      o.querySelector(".qbtns").style.visibility = "hidden"; o.querySelector(".qhint").style.visibility = "hidden";
    }
    o.addEventListener("click", function (e) {
      var b = e.target.closest("[data-qa],[data-qclose],[data-qhome]"); if (!b) return; e.stopPropagation();
      if (b.dataset.qa) { if (b.dataset.qa === "skip") { buzz(); rated.push(pool[i].id); S.setRaw(qrKey(), (S.state[qrKey()] || []).concat([pool[i].id]).slice(-600)); stack.lastChild.classList.add("go-skip"); i++; setTimeout(paint, 220); } else act(b.dataset.qa); return; }
      o.classList.remove("on"); setTimeout(function () { o.remove(); }, 300);
      if (rated.length) { if (S.reseed) S.reseed(); noted = false; show(tab === "home" ? "home" : tab, tab === "home" ? "home" : sec); }
    });
    requestAnimationFrame(function () { o.classList.add("on"); }); paint();
  }

  // ---------- Watch together: what two people will both enjoy ----------
  function togetherSheet() {
    var me = S.profile(), others = S.profiles().filter(function (p) { return !me || p.id !== me.id; });
    if (!me || !others.length) { sheet('<h3>Watch together</h3><div class="sub-h" style="padding:0 20px 14px">Add a second person and Vesper will find what you\'ll both enjoy.</div><button class="opt" data-padd>' + S.avatar(null) + "<span>Add a person</span></button>"); return; }
    sheet("<h3>Watch with…</h3>" + others.map(function (p) { return '<button class="opt" data-tpart="' + p.id + '">' + S.avatar(p) + "<span>" + esc(p.name) + "</span></button>"; }).join(""));
  }
  function togetherPicks(pid) {
    var me = S.state.profile, Ta = S.taste(); S.state.profile = pid; var Tb = S.taste(), hb = S.hiddenSet(); S.state.profile = me; var ha = S.hiddenSet();
    var other = S.profiles().filter(function (p) { return p.id === pid; })[0];
    var pick = S.ALL.filter(function (t) { return (t.avail || []).length && !ha[t.id] && !hb[t.id] && (t.imdb || 0) >= 6.8 && (t.votes || 0) > 8000; })
      .map(function (t) { var a = S.tasteScore(t, Ta), b = S.tasteScore(t, Tb); return { t: t, s: a + b - Math.abs(a - b) * 0.7 }; })
      .sort(function (x, y) { return y.s - x.s; }).slice(0, 36).map(function (x) { return x.t; });
    closeSheet();
    setTimeout(function () { sheet('<h3>You & ' + esc(other ? other.name : "them") + '</h3><div class="sub-h" style="padding:0 20px 14px">Picked for both of your tastes — nothing either of you said no to.</div>', function (card) { card.appendChild(gridOf(pick)); }); }, 300);
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
      var days = d ? Math.round((d - new Date(new Date().toDateString())) / 864e5) : null;
      var when = m === "soon" && d ? (days <= 0 ? "Out today" : days === 1 ? "Tomorrow" : days < 7 ? "In " + days + " days · " + d.toLocaleDateString("en-GB", { weekday: "long" }) : "Coming " + d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })) + (a ? " · " + LABEL[a] : "")
        : arr ? (arr.season > 1 ? "New season · " : "Now streaming · ") + (LABEL[arr.app] || "") : a ? "On " + LABEL[a] : "";
      var el = h("div", "nh"); el.dataset.id = t.id;
      el.innerHTML = '<div class="dt">' + left + '</div><div class="bd"><div class="art"><img loading="lazy" decoding="async" src="' + S.bd(t, "s1440") + '">' + (a && LOGO[a] ? '<img class="lg" src="' + LOGO[a] + '">' : "") +
        '<span class="pb" data-trailer="' + t.id + '">' + G.play + '</span></div><div class="nhb"><button data-trailer="' + t.id + '">' + G.film + "Trailer</button>" +
        (m === "soon" ? '<button data-list="' + t.id + '" data-remind="1">' + (S.inList("mylist", t.id) ? G.check + "Reminded" : G.bell + "Remind Me") + "</button>"
          : '<button data-list="' + t.id + '">' + (S.inList("mylist", t.id) ? G.check : G.plus) + "My List</button>") + "</div>" + '<div class="nm">' + esc(t.title) + '</div><div class="when">' + esc(when) + "</div><p>" + esc(t.desc || "") + '</p><div class="gn">' + (t.genres || []).slice(0, 3).map(function (g) { return S.GENRES[g] || g; }).join(" · ") + "</div></div>";
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
    var rows = S.finalize(S.SECTIONS.weather()); rows = jitter(S.freshen(rows, "weather")); rows = rows.slice(0, 1).concat(drift(rows.slice(1)));
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
    if (window.VSB) { var sbt = VSB.toggle(function () { run(); }); page.appendChild(sbt); }
    chips.style.margin = "0 0 14px"; page.appendChild(chips); page.appendChild(body);
    inp.value = arg || "";
    var t = null, rawOnly = false;
    function run() {
      var q = inp.value.trim(); arg = q; box.classList.toggle("has", !!q); body.textContent = ""; chips.textContent = "";
      if (!q) {
        var rec = S.list("queries").slice(0, 8);
        chips.innerHTML = rec.map(function (r) { return '<button class="chip" data-q="' + esc(r) + '">' + esc(r) + "</button>"; }).join("");
        var seenIds = S.list("viewed").slice(0, 16), seen = S.ids(seenIds).filter(function (x) { return (x.avail || []).length; });
        if (seen.length >= 2) { var rv = rowEl(S.R("Recently Viewed", seen, null, null, 1, true)); body.appendChild(rv); rv._fill(); }
        var quick = h("div", "quick");
        quick.innerHTML = "<h4>Try a vibe</h4>" + ["new york", "college", "heist", "road trip", "small town", "detective", "wedding", "time travel"].map(function (v) { return '<button class="chip" data-q="' + v + '">' + v + "</button>"; }).join("") +
          "<h4>Throwback</h4>" + ERAS.map(function (e) { return '<button class="chip era" data-era="' + e.k + '">' + e.label + " American films</button>"; }).join("");
        body.appendChild(quick);
        body.appendChild(h("div", "sec-h", "Top Searches"));
        S._.seg("trend").filter(function (x) { return (x.avail || []).length; }).slice(0, 25).forEach(function (x) {
          var li = h("div", "li"); li.dataset.id = x.id;
          li.innerHTML = '<div class="th"><img loading="lazy" src="' + S.bd(x, "s640") + '"></div><div class="tx">' + esc(x.title) + "<small>" + esc(S.length(x)) + " · " + esc(LABEL[S.pickApp(x)] || "") + '</small></div><div class="pl">' + G.play + "</div>";
          body.appendChild(li); });
        return;
      }
      var fixedQ = autocorrect(q);
      if (!rawOnly && fixedQ !== q && S.norm(fixedQ) !== S.norm(q)) body.appendChild(h("div", "fixq", "Showing results for <b>" + esc(fixedQ) + '</b><button data-raw="' + esc(q) + '">Search “' + esc(q) + "” instead</button>"));
      var R = smartSearch(rawOnly ? q : fixedQ); rawOnly = false;
      if (window.VSB && VSB.on()) VSB.searchInto(body, rawOnly ? q : fixedQ, R, rowEl);
      if (R.sections) {
        chips.innerHTML = R.chips.map(function (c) { return '<button class="chip" data-q="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
        if (!R.sections.length) { body.appendChild(h("div", "empty", "<b>Nothing like that on your apps</b>Try a nearby year, or drop a word.")); return; }
        if (R.like) { var lc = h("div", "likeof"); lc.dataset.id = R.like.id; lc.innerHTML = '<img src="' + S.po(R.like, "s332") + '"><span><small>Because you liked</small>' + esc(R.like.title) + "</span>" + G.r; body.appendChild(lc); }
        R.sections.forEach(function (sx) {
          body.appendChild(h("div", "sec-h", esc(sx.title) + (sx.sub ? ' <small class="secsub">' + esc(sx.sub) + "</small>" : "")));
          var g = gridOf(sx.items);
          if (sx.years) [].forEach.call(g.children, function (c, k) { var t = sx.items[k]; if (t && t.year) c.insertAdjacentHTML("beforeend", '<span class="yr">' + t.year + "</span>"); });
          body.appendChild(g);
        });
        return;
      }
      chips.innerHTML = R.chips.map(function (c) { return '<button class="chip" data-q="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
      if (!R.top && !R.titles.length && !R.vibe.length) { body.appendChild(h("div", "empty", "<b>No matches</b>Try a different spelling, an actor, a vibe like “rainy” or an era like “2010s”.")); return; }
      if (R.top) {
        var tp = h("div", "toprez"); tp.dataset.id = R.top.id; var ta = S.pickApp(R.top);
        tp.innerHTML = '<div class="art"><img src="' + S.bd(R.top, "s1440") + '"><div class="g"></div>' + (ta ? '<img class="lg" src="' + LOGO[ta] + '">' : "") + '</div><div class="tx"><small>Top result</small><b>' + esc(R.top.title) +
          "</b><span>" + [R.top.year, S.length(R.top), R.top.imdb ? "IMDb " + R.top.imdb.toFixed(1) : ""].filter(Boolean).join(" · ") + "</span></div>" +
          (ta ? '<button class="btn play" data-play="' + R.top.id + '">' + G.play + "Play</button>" : "");
        body.appendChild(tp);
      }
      if (R.titles.length) { body.appendChild(h("div", "sec-h", R.top ? "Also matching" : "Titles")); body.appendChild(gridOf(R.titles)); }
      if (R.similar.length) { var row = rowEl(S.R("More like " + R.top.title, R.similar)); body.appendChild(row); row._fill(); }
      if (R.vibe.length) { body.appendChild(h("div", "sec-h", "The “" + esc(R.label) + "” vibe")); body.appendChild(gridOf(R.vibe)); }
    }
    function saveQ() { var q = inp.value.trim(); if (q.length < 2) return; var l = S.list("queries").filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); }); l.unshift(q); S.set("queries", l.slice(0, 12)); }
    inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(run, 120); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { saveQ(); inp.blur(); } });
    body.addEventListener("click", saveQ, true);
    box.querySelector(".clr").addEventListener("click", function () { inp.value = ""; run(); inp.focus(); });
    page.addEventListener("click", function (e) {
      var r0 = e.target.closest("[data-raw]"); if (r0) { rawOnly = true; run(); return; }
      var b = e.target.closest("[data-q]"); if (b) { inp.value = b.dataset.q; run(); saveQ(); } });
    run();
    if (!inp.value) setTimeout(function () { inp.focus(); }, 300);
  }

  // ---------- smart search: names first, then the vibe, eras understood ----------
  var SYN = { rain: "rain|rainy|storm|monsoon|downpour|thunder", rainy: "rain|rainy|storm|monsoon", college: "college|university|campus|fraternity|frat|sorority|dorm|freshman",
    casino: "casino|gambl|las vegas|vegas|poker|blackjack|roulette|bookie", vegas: "vegas|casino|gambl", heist: "heist|robbery|rob |thief|thieves|steal|vault|con artist",
    school: "school|teen|student|classmate|campus", teen: "teen|high school|adolescen", spy: "spy|spies|agent|cia|mi6|espionage|undercover", detective: "detective|investigat|murder|inspector|sleuth",
    space: "space|astronaut|planet|galaxy|alien", zombie: "zombie|undead|apocalyp", vampire: "vampire|blood|undead", christmas: "christmas|holiday|santa|xmas", summer: "summer|vacation|beach|camp",
    love: "love|romance|romantic|relationship", wedding: "wedding|bride|groom|marriage|engaged", war: "war|soldier|battle|military|army", ocean: "ocean|sea|island|sail|ship|underwater",
    snow: "snow|winter|arctic|frozen|ice", fog: "fog|mist|mysterious", murder: "murder|killer|homicide|serial", killer: "killer|murder|serial|assassin", hacker: "hacker|hacking|cyber|computer",
    "new york": "new york|manhattan|brooklyn|nyc|queens", london: "london|british|england", paris: "paris|france|french", road: "road trip|road|journey|drive", sad: "grief|loss|tragic|heartbreak",
    funny: "comedy|funny|hilarious", scary: "horror|terrif|haunt|scary", ghost: "ghost|haunt|spirit|paranormal", cop: "cop|police|detective|officer", lawyer: "lawyer|attorney|court|trial",
    doctor: "doctor|hospital|surgeon|medical", sport: "sport|team|coach|football|basketball|baseball|boxing", music: "music|band|singer|musician|concert", dance: "dance|dancer|ballet" };
  var STOP = { the: 1, a: 1, an: 1, and: 1, of: 1, with: 1, movie: 1, movies: 1, film: 1, films: 1, show: 1, shows: 1, series: 1, like: 1, about: 1, set: 1, in: 1, for: 1, vibe: 1, vibes: 1 };
  var COUNTRY = { korean: ["KR"], korea: ["KR"], kdrama: ["KR"], kdramas: ["KR"], japanese: ["JP"], japan: ["JP"], jdrama: ["JP"], indian: ["IN"], india: ["IN"], bollywood: ["IN"],
    hindi: ["IN"], tamil: ["IN"], telugu: ["IN"], malayalam: ["IN"], kannada: ["IN"], american: ["US"], usa: ["US"], hollywood: ["US"], british: ["GB"], uk: ["GB"], england: ["GB"],
    spanish: ["ES"], spain: ["ES"], french: ["FR"], france: ["FR"], german: ["DE"], germany: ["DE"], italian: ["IT"], italy: ["IT"], chinese: ["CN", "HK"], china: ["CN"], cdrama: ["CN"],
    taiwanese: ["TW"], thai: ["TH"], turkish: ["TR"], mexican: ["MX"], australian: ["AU"], canadian: ["CA"], irish: ["IE"], danish: ["DK"], swedish: ["SE"], norwegian: ["NO"],
    scandinavian: ["NO", "SE", "DK", "FI", "IS"], nordic: ["NO", "SE", "DK", "FI", "IS"], european: ["FR", "DE", "ES", "IT", "NO", "SE", "DK", "BE", "NL", "PL", "IE"], pakistani: ["PK"], filipino: ["PH"], brazilian: ["BR"] };
  var CNAME = { KR: "Korean", JP: "Japanese", IN: "Indian", US: "American", GB: "British", ES: "Spanish", FR: "French", DE: "German", IT: "Italian", CN: "Chinese", TW: "Taiwanese", TH: "Thai",
    TR: "Turkish", MX: "Mexican", AU: "Australian", CA: "Canadian", IE: "Irish", DK: "Danish", SE: "Swedish", NO: "Norwegian", PK: "Pakistani", PH: "Filipino", BR: "Brazilian" };
  var TYPEW = { movie: "MOVIE", movies: "MOVIE", film: "MOVIE", films: "MOVIE", cinema: "MOVIE", series: "SHOW", show: "SHOW", shows: "SHOW", tv: "SHOW", season: "SHOW", episodes: "SHOW",
    drama: "SHOW?", dramas: "SHOW?", kdrama: "SHOW", kdramas: "SHOW", jdrama: "SHOW", cdrama: "SHOW" };
  var GENREW = { thriller: "trl", thrillers: "trl", horror: "hrr", scary: "hrr", comedy: "cmy", comedies: "cmy", funny: "cmy", romance: "rma", romantic: "rma", romcom: "rma",
    action: "act", crime: "crm", scifi: "scf", sci: "scf", fantasy: "fnt", anime: "ani", animated: "ani", animation: "ani", cartoon: "ani", documentary: "doc", documentaries: "doc", docuseries: "doc",
    war: "war", historical: "hst", history: "hst", period: "hst", family: "fml", kids: "fml", sport: "spt", sports: "spt", musical: "msc", music: "msc", reality: "rly", western: "wsn" };
  var GNAME = { trl: "thrillers", hrr: "horror", cmy: "comedies", rma: "romance", act: "action", crm: "crime", scf: "sci-fi", fnt: "fantasy", ani: "anime", doc: "documentaries", war: "war",
    hst: "historical", fml: "family", spt: "sports", msc: "musicals", rly: "reality", wsn: "westerns", drm: "dramas" };
  function parseQuery(q) {
    var w = S.norm(q).replace(/\bk drama/g, "kdrama").replace(/\bj drama/g, "jdrama").replace(/\bc drama/g, "cdrama").replace(/\bsci fi\b/g, "scifi").replace(/\bscience fiction\b/g, "scifi").replace(/\brom com\b/g, "romcom").split(" ").filter(Boolean);
    var P = { cc: null, type: null, genres: [], year: null, era: null, rest: [] }, dramaWord = false;
    w.forEach(function (x) {
      var m = x.match(/^(\d{2}|\d{4})s$/), y = x.match(/^(19|20)\d{2}$/);
      if (m) { var d = +m[1]; d = d < 100 ? (d >= 30 ? 1900 + d : 2000 + d) : d; P.era = [d, d + 9]; return; }
      if (y) { P.year = +x; return; }
      if (COUNTRY[x]) { P.cc = (P.cc || []).concat(COUNTRY[x]); if (/drama/.test(x)) P.type = "SHOW"; return; }
      if (TYPEW[x]) { if (TYPEW[x] === "SHOW?") dramaWord = true; else P.type = TYPEW[x]; return; }
      if (GENREW[x]) { if (P.genres.indexOf(GENREW[x]) < 0) P.genres.push(GENREW[x]); return; }
      if (!STOP[x]) P.rest.push(x);
    });
    // "korean drama" = K-dramas (series); "drama" on its own = the drama genre
    if (dramaWord) { if (P.cc && !P.type) P.type = "SHOW"; else if (!P.cc) P.genres.push("drm"); }
    P.structured = !!(P.cc || P.type || P.genres.length || P.year || P.era);
    return P;
  }
  // how surely a title comes from a country: its original-language title is the strongest clue,
  // then being made only there; a co-production with Hollywood counts least (and animation outsourced abroad not at all)
  var SCRIPT = { KR: /[\uac00-\ud7af]/, JP: /[\u3040-\u30ff]/, IN: /[\u0900-\u0dff]/, CN: /[\u4e00-\u9fff]/, TH: /[\u0e00-\u0e7f]/, TW: /[\u4e00-\u9fff]/ };
  function countryScore(t, cc) {
    var c = t.countries || [], hit = c.filter(function (x) { return cc.indexOf(x) >= 0; }); if (!hit.length) return 0;
    var ot = t.otitle || "", main = cc[0], sc = 1;
    if (SCRIPT[main] && SCRIPT[main].test(ot)) sc = 3;
    else if (c.length === hit.length) sc = 3;
    else if (main === "US") sc = 2;
    else if (SCRIPT[main]) sc = 1;   // Korean/Japanese/Indian/Chinese/Thai films nearly always carry their own-script title; a co-production without one counts least
    else if (c.indexOf("US") < 0 && c.indexOf("GB") < 0) sc = 2;
    else if (ot && !/^[\x00-\x7f]+$/.test(ot) && !SCRIPT[main]) sc = 2;   // e.g. a Spanish or French original title
    if ((t.genres || []).indexOf("ani") >= 0 && main !== "JP" && !(SCRIPT[main] && SCRIPT[main].test(ot))) sc -= 1;
    return sc;
  }
  function qual(t) { return Math.log(1 + (t.votes || 0)) * 1.25 + (t.imdb || 6) * 1.6 + (t.rank ? Math.max(0, 6 - Math.log(t.rank)) : 0); }
  // people: full names, or a distinctive surname ("nolan", "dicaprio"), most famous first
  var PEOPLE = null;
  function findPerson(rest) {
    if (!PEOPLE) { var m = {}; S.ALL.forEach(function (t) { (t.cast || []).slice(0, 6).concat(t.dirs || []).forEach(function (n) { var k = S.norm(n); m[k] = m[k] || { n: n, k: k, c: 0 }; m[k].c += 1 + Math.log(1 + (t.votes || 0)) / 4; }); });
      PEOPLE = Object.keys(m).map(function (k) { return m[k]; }).filter(function (p) { return p.c >= 2; }).sort(function (a, b) { return b.c - a.c; }); }
    var r = S.norm(rest); if (r.length < 4) return null;
    return PEOPLE.filter(function (p) { return p.k === r; })[0] || PEOPLE.filter(function (p) { return (" " + p.k).indexOf(" " + r) >= 0 && (r.indexOf(" ") > 0 || r.length >= 5); })[0] || null;
  }
  function describe(P, withYear) {
    var GADJ = { trl: "thriller", hrr: "horror", cmy: "comedy", rma: "romance", act: "action", crm: "crime", scf: "sci-fi", fnt: "fantasy", ani: "anime", doc: "documentary", war: "war",
      hst: "historical", fml: "family", spt: "sports", msc: "musical", rly: "reality", wsn: "western", drm: "drama" };
    var ty = P.type === "MOVIE" ? "movies" : P.type === "SHOW" ? (P.cc && P.cc[0] === "KR" ? "dramas" : "series") : "";
    var c = P.cc ? (CNAME[P.cc[0]] || "") + " " : "", g = P.genres.length ? P.genres.map(function (x) { return (ty ? GADJ : GNAME)[x]; }).join(" & ") : "";
    if (!ty && !g) ty = "titles";
    var txt = (c + (g ? g + (ty ? " " + ty : "") : ty)).trim();
    txt = txt.charAt(0).toUpperCase() + txt.slice(1);
    if (P.who) txt = (P.type === "MOVIE" ? "Films" : P.type === "SHOW" ? "Series" : "Everything") + (P.whoBy ? " by " : " with ") + P.who + (P.genres.length ? " · " + P.genres.map(function (x) { return GNAME[x]; }).join(" & ") : "");
    if (withYear && P.year) txt += " from " + P.year; else if (withYear && P.era) txt += " from the " + P.era[0] + "s";
    return txt;
  }
  function structuredSearch(q, P) {
    var hid = S.hiddenSet();
    var base = S.ALL.filter(function (t) {
      if (!(t.avail || []).length || hid[t.id]) return false;
      if (P.cc && countryScore(t, P.cc) < (P.ccLoose ? 1 : 2)) return false;   // made there, not just co-produced
      if (P.type && t.type !== P.type) return false;
      if (P.genres.length && !P.genres.every(function (g) { return (t.genres || []).indexOf(g) >= 0; })) return false;
      return true;
    });
    if (P.cc && !P.ccLoose && base.length < 10) { P.ccLoose = true; return structuredSearch(q, P); }
    // a person's name ("leonardo dicaprio movies", "nolan films 2010s")? then it's their work
    var rest = P.rest.join(" "), who = rest ? findPerson(rest) : null;
    if (who) { base = base.filter(function (t) { return (t.cast || []).concat(t.dirs || []).some(function (n) { return S.norm(n) === who.k; }); }); P.who = who.n; rest = "";
      var asDir = base.filter(function (t) { return (t.dirs || []).some(function (n) { return S.norm(n) === who.k; }); }).length; P.whoBy = asDir * 2 >= base.length; P.whoK = who.k; }
    // any leftover words ("revenge", "college", "zombie"…) must fit the story too, when possible
    if (rest) {
      var pats = P.rest.filter(function (w) { return w.length >= 3; }).map(function (w) { var syn = SYN[w] || (w.length > 5 ? w.slice(0, w.length - 2) : w); return new RegExp("\\b(?:" + syn.split("|").map(function (x) { return x.trim().replace(/[.*+?^${}()[\]\\]/g, "\\$&"); }).join("|") + ")", "i"); });
      var narrowed = base.filter(function (t) { var h2 = [t.title, t.desc || "", (t.cast || []).join(" "), (t.dirs || []).join(" ")].join(" "); return pats.every(function (p) { return p.test(h2); }); });
      if (narrowed.length >= 3) base = narrowed;
    }
    var sections = [], used = {};
    function take(list, n) { var out = []; list.forEach(function (t) { if (!used[t.id] && out.length < n) { used[t.id] = 1; out.push(t); } }); return out; }
    var byQ = function (l) { return l.slice().sort(function (a, b) { return qual(b) - qual(a); }); };
    if (P.year) {
      var exact = take(byQ(base.filter(function (t) { return t.year === P.year; })), 40);
      if (exact.length) sections.push({ title: describe(P, true), items: exact });
      // then the years around it: 1 year either side first, then 2, then 3
      var near = base.filter(function (t) { return t.year && t.year !== P.year && Math.abs(t.year - P.year) <= 3; })
        .sort(function (a, b) { return Math.abs(a.year - P.year) - Math.abs(b.year - P.year) || qual(b) - qual(a); });
      var nr = take(near, 40); if (nr.length) sections.push({ title: "Around " + P.year, sub: (P.year - 3) + "–" + (P.year + 3), items: nr, years: true });
    } else if (P.era) {
      var inE = take(byQ(base.filter(function (t) { return t.year >= P.era[0] && t.year <= P.era[1]; })), 60);
      if (inE.length) sections.push({ title: describe(P, true), items: inE, years: true });
      var edge = take(base.filter(function (t) { return t.year && (Math.abs(t.year - P.era[0]) <= 2 || Math.abs(t.year - P.era[1]) <= 2); }).sort(function (a, b) { return qual(b) - qual(a); }), 24);
      if (edge.length) sections.push({ title: "Just before & after", items: edge, years: true });
    } else {
      // no year: if both films and series match, show each, the best first
      if (!P.type) {
        var mv = take(byQ(base.filter(function (t) { return t.type === "MOVIE"; })), 30), sh = take(byQ(base.filter(function (t) { return t.type === "SHOW"; })), 30);
        var first = (sh.length && (!mv.length || qual(sh[0]) >= qual(mv[0]))) ? [["SHOW", sh], ["MOVIE", mv]] : [["MOVIE", mv], ["SHOW", sh]];
        first.forEach(function (x) { if (x[1].length) { var Pt = Object.assign({}, P, { type: x[0] }); sections.push({ title: describe(Pt), items: x[1] }); } });
      } else sections.push({ title: describe(P), items: take(byQ(base), 60) });
      var newer = take(base.filter(function (t) { return t.year >= new Date().getFullYear() - 1; }).sort(function (a, b) { return qual(b) - qual(a); }), 20);
      if (newer.length) sections.splice(1, 0, { title: "New " + describe(P).replace(/^(\w)/, function (c) { return c.toLowerCase(); }), items: newer });
    }
    // still room? relax: same country & type, any year, then similar genres
    if (sections.reduce(function (n, x) { return n + x.items.length; }, 0) < 12) {
      var wider = take(byQ(S.ALL.filter(function (t) { return (t.avail || []).length && !hid[t.id] && (!P.cc || countryScore(t, P.cc) >= 2) && (!P.type || t.type === P.type) &&
        (!P.whoK || (t.cast || []).concat(t.dirs || []).some(function (n) { return S.norm(n) === P.whoK; })); })), 30);
      if (wider.length) sections.push({ title: "More " + describe(Object.assign({}, P, { genres: [], year: null, era: null })).replace(/^(\w)/, function (c) { return c.toLowerCase(); }), items: wider });
    }
    // refine buttons
    var label = describe(P).toLowerCase(), chips = [];
    if (!P.type && P.cc) chips.push(CNAME[P.cc[0]].toLowerCase() + " movies", CNAME[P.cc[0]].toLowerCase() + " series");
    if (!P.year && !P.era) chips.push(label + " 2010s", label + " 2020s");
    if (P.year) chips.push(label + " " + (P.year - 1), label + " " + (P.year + 1));
    if (!P.genres.length) ["thriller", "romance", "comedy", "crime"].forEach(function (g) { chips.push((P.cc ? CNAME[P.cc[0]].toLowerCase() + " " : "") + g + (P.type === "MOVIE" ? " movies" : P.type === "SHOW" ? " series" : "") + (P.year ? " " + P.year : "")); });
    return { sections: sections, chips: chips.slice(0, 8) };
  }
  // ---------- autocorrect: every word checked against titles, cast and the words search understands ----------
  var VOCAB = null;
  function vocab() {
    if (VOCAB) return VOCAB; var f = {};
    function add(w, n) { if (w.length >= 2 && !/^\d+$/.test(w)) f[w] = (f[w] || 0) + n; }
    S.ALL.forEach(function (t) { var wt = 1 + Math.log(1 + (t.votes || 0));
      S.norm(t.title).split(" ").forEach(function (w) { add(w, wt * 3); });
      (t.cast || []).slice(0, 4).concat(t.dirs || []).forEach(function (n) { S.norm(n).split(" ").forEach(function (w) { add(w, wt); }); }); });
    [COUNTRY, TYPEW, GENREW, SYN].forEach(function (m) { Object.keys(m).forEach(function (k) { k.split(" ").forEach(function (w) { add(w, 400); }); }); });
    ["new", "york", "rain", "rainy", "college", "heist", "vibe", "school", "detective", "road", "trip", "small", "town", "time", "travel", "wedding", "zombie", "revenge", "prison", "island", "summer"].forEach(function (w) { add(w, 300); });
    VOCAB = { f: f, words: Object.keys(f) }; return VOCAB;
  }
  function editDist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur, i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { cur = [i]; var best = i;
      for (j = 1; j <= b.length; j++) { var c = a[i - 1] === b[j - 1] ? 0 : 1; cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev[j - 2] + 1);   // swapped letters
        if (cur[j] < best) best = cur[j]; }
      if (best > max) return max + 1; prev2 = prev; prev = cur; }
    return prev[b.length];
  }
  var prev2 = null;
  function autocorrect(q) {
    var V = vocab(), words = S.norm(q).split(" ").filter(Boolean), changed = false;
    var fixed = words.map(function (w, idx) {
      if (V.f[w] || /^\d/.test(w) || w.length < 4) return w;
      var last = idx === words.length - 1;
      if (last && V.words.some(function (x) { return x.indexOf(w) === 0; })) return w;   // still typing a real word
      var max = w.length >= 7 ? 2 : 1, best = null, bd = 9, bf = 0;
      V.words.forEach(function (x) { if (Math.abs(x.length - w.length) > max || x[0] !== w[0] && max < 2) return;
        var d = editDist(w, x, max); if (d <= max && (d < bd || (d === bd && V.f[x] > bf))) { best = x; bd = d; bf = V.f[x]; } });
      if (best) { changed = true; return best; } return w;
    });
    return changed ? fixed.join(" ") : q;
  }
  // "like X": shared genres (the main one most), same director or cast, similar era and country, never animation for live-action
  function likeOf(src) {
    var sg = (src.genres || []).filter(function (g) { return g !== "drm"; }), main = sg[0] || (src.genres || [])[0];
    var sd = (src.dirs || []).map(S.norm), sc = (src.cast || []).slice(0, 6).map(S.norm), sAni = (src.genres || []).indexOf("ani") >= 0, sFam = (src.genres || []).indexOf("fml") >= 0;
    var sp = S._.primary(src) || (src.countries || [])[0];
    return S.ALL.filter(function (t) { return t.id !== src.id && (t.genres || []).some(function (g) { return sg.indexOf(g) >= 0 || g === main; }); }).map(function (t) {
      var tg = (t.genres || []).filter(function (g) { return g !== "drm"; }), inter = tg.filter(function (g) { return sg.indexOf(g) >= 0; }).length, uni = sg.length + tg.length - inter || 1;
      var tAni = (t.genres || []).indexOf("ani") >= 0, tFam = (t.genres || []).indexOf("fml") >= 0;
      var sc2 = (inter / uni) * 14 + ((t.genres || [])[0] === main || tg[0] === main ? 5 : 0);
      if ((t.dirs || []).some(function (n) { return sd.indexOf(S.norm(n)) >= 0; })) sc2 += 9;
      sc2 += (t.cast || []).filter(function (n) { return sc.indexOf(S.norm(n)) >= 0; }).length * 2.5;
      if (src.year && t.year) sc2 += Math.max(0, 4 - Math.abs(src.year - t.year) / 4);
      if (sp && (S._.primary(t) || (t.countries || [])[0]) === sp) sc2 += 2.5;
      if (sAni !== tAni) sc2 -= 10; if (sFam !== tFam) sc2 -= 5;
      sc2 += Math.log(1 + (t.votes || 0)) * 0.45 + ((t.imdb || 6) - 6) * 0.9;
      return { t: t, s: sc2 };
    }).sort(function (a, b) { return b.s - a.s; }).slice(0, 80).map(function (x) { return x.t; });
  }
  function smartSearch(q) {
    // "movies like inception", "shows like dark", "similar to money heist"
    var lk = S.norm(q).match(/^(?:(movies?|films?|shows?|series|anime|kdramas?|something)\s+)?(?:like|similar to)\s+(.+)$/);
    if (lk) {
      var name = lk[2], src = S.ALL.filter(function (t) { return S.norm(t.title) === name; })[0] || S.search(name, 5).titles[0];
      if (src) {
        var ty = /movie|film/.test(lk[1] || "") ? "MOVIE" : /show|series|kdrama/.test(lk[1] || "") ? "SHOW" : null, T = S.taste();
        var sim = likeOf(src).filter(function (t) { return (t.avail || []).length && (!ty || t.type === ty) && !S.hiddenSet()[t.id] && t.id !== src.id; });
        if (/anime/.test(lk[1] || "")) sim = sim.filter(function (t) { return (t.genres || []).indexOf("ani") >= 0; });
        var close = sim.slice(0, 18), more = sim.slice(18, 48).sort(function (a, b) { return (T.n >= 5 ? S.tasteScore(b, T) - S.tasteScore(a, T) : 0) || qual(b) - qual(a); });
        return { sections: [{ title: (ty === "MOVIE" ? "Films" : ty === "SHOW" ? "Series" : "Titles") + " like " + src.title, items: close }].concat(more.length ? [{ title: "Also in that spirit", items: more }] : []),
          chips: [src.title, "movies like " + src.title, "shows like " + src.title].filter(function (c) { return S.norm(c) !== S.norm(q); }), like: src };
      }
    }
    var PQ = parseQuery(q);
    // pure "kind of thing" searches (korean movies 2016, thriller 2010s…) — unless it's clearly a real title
    if (PQ.structured) {
      var exactTitle = S.ALL.filter(function (t) { return S.norm(t.title) === S.norm(q); })[0];
      if (!exactTitle) return structuredSearch(q, PQ);
    }
    var words = S.norm(q).split(" ").filter(Boolean), era = null, keep = [];
    words.forEach(function (w) {
      var m = w.match(/^(\d{2}|\d{4})s$/), y = w.match(/^(19|20)\d{2}$/);
      if (m) { var d = +m[1]; d = d < 100 ? (d >= 30 ? 1900 + d : 2000 + d) : d; era = [d, d + 9]; }
      else if (y) era = [+w, +w];
      else keep.push(w);
    });
    var rest = keep.join(" "), inEra = function (t) { return !era || (t.year >= era[0] && t.year <= era[1]); }, avail = function (t) { return (t.avail || []).length; };
    // 1) names: the title you probably meant
    var byName = rest ? S.search(rest, 80) : { titles: [], people: [], genres: [] };
    var nr = S.norm(rest), named = byName.titles.filter(inEra).filter(function (t) { var k = S.norm(t.title); return k.indexOf(nr) < 0 || (" " + k).indexOf(" " + nr) >= 0; });   // "rain" shouldn't match "train"
    var top = named.filter(function (t) { var k = S.norm(t.title); return nr && (k === nr || k.indexOf(nr) === 0 || (" " + k).indexOf(" " + nr) >= 0); })[0] || null;
    // 2) the vibe: every word (with its look-alikes) found in the story, title or genres
    var toks = keep.filter(function (w) { return w.length >= 3 && !STOP[w]; });
    if (/new york/.test(rest)) toks = toks.filter(function (w) { return w !== "new" && w !== "york"; }).concat(["new york"]);
    var pats = toks.map(function (w) { var syn = SYN[w] || (w.length > 5 ? w.slice(0, w.length - 2) : w); return new RegExp("\\b(?:" + syn.split("|").map(function (x) { return x.trim().replace(/[.*+?^${}()[\]\\]/g, "\\$&"); }).join("|") + ")", "i"); });
    function hay(t) { return t._hay || (t._hay = [t.title, t.desc || "", (t.genres || []).map(function (g) { return S.GENRES[g] || ""; }).join(" "), S.vibes(t).join(" ")].join(" ")); }
    var shown = {}; if (top) shown[top.id] = 1;
    var titles = named.filter(function (t) { return !shown[t.id] && (shown[t.id] = 1); }).slice(0, 18);
    var vibe = [];
    if (pats.length || era) {
      var need = pats.length;
      var cand = S.ALL.filter(function (t) { return avail(t) && inEra(t) && !shown[t.id]; }).map(function (t) { var h2 = hay(t), n = pats.filter(function (p) { return p.test(h2); }).length; return { t: t, n: n }; });
      var full = cand.filter(function (c) { return c.n === need; });
      if (full.length < 8 && need > 1) full = full.concat(cand.filter(function (c) { return c.n >= Math.ceil(need / 2) && c.n < need; }));
      vibe = full.sort(function (a, b) { return b.n - a.n || (Math.log(1 + (b.t.votes || 0)) + (b.t.imdb || 6) * 1.5) - (Math.log(1 + (a.t.votes || 0)) + (a.t.imdb || 6) * 1.5); })
        .map(function (c) { return c.t; }).slice(0, 36);
    }
    // weather words use Vesper's hand-picked weather moods first (rainy, foggy, snowy, stormy…)
    var WXW = { rain: "rain", rainy: "rain", gloomy: "rain", grey: "rain", gray: "rain", fog: "fog", foggy: "fog", mist: "fog", snow: "snow", snowy: "snow", winter: "snow",
      storm: "storm", stormy: "storm", cold: "cold", noir: "city", gothic: "storm", vampire: "vamp", magic: "magic", mystery: "myst" };
    var wk = keep.filter(function (w) { return WXW[w]; })[0];
    if (wk) {
      var others = pats.filter(function (_, k) { return toks[k] !== wk; });
      var curated = S.wxRow(WXW[wk], 80).filter(function (t) { return avail(t) && inEra(t) && !shown[t.id] && others.every(function (p) { return p.test(hay(t)); }); });
      var cs = {}; curated.forEach(function (t) { cs[t.id] = 1; });
      vibe = curated.concat(vibe.filter(function (t) { return !cs[t.id]; })).slice(0, 36);
    }
    // 3) more like the top result
    var similar = top ? S.similar(top, 20).filter(function (t) { return avail(t) && !shown[t.id]; }) : [];
    if (top && S.norm(top.title) === nr) vibe = [];   // you searched a real title: show what's like it, not word matches
    var chips = byName.people.slice(0, 3).concat(byName.genres.slice(0, 2));
    if (!era && rest) chips = chips.concat([rest + " 2000s", rest + " 2010s"]).slice(0, 6);
    return { top: top, titles: titles, similar: similar, vibe: vibe, chips: chips, label: [rest, era ? (era[0] === era[1] ? era[0] : era[0] + "s") : ""].filter(Boolean).join(" · ") };
  }

  // ---------- My Vesper ----------
  function renderMine(page) {
    var p = S.profile(), many = S.profiles().length > 1;
    var me = h("div", "mehead"); me.dataset.sheet = "people";
    me.innerHTML = (p ? S.avatar(p) : '<div class="ava" style="--h:265">' + G.person + "</div>") + "<b>" + (p ? esc(p.name) : "Add your name") + G.caret + "</b>";
    page.appendChild(me);
    var L = S.wxLive(), fav = S.pref("app", "auto");
    var opts = h("div", "mlist");
    opts.innerHTML = '<button class="mrow" data-sheet="place"><i style="--c:#3b82f6">' + G.weather + "</i><span>Weather mood<small>" + (L ? esc(S.wxWords(L.code)) + " · " + Math.round(L.temp) + "° in " : "From ") + esc(S.place().name) + "</small></span>" + G.r + "</button>" +
      '<button class="mrow" data-sheet="me"><i style="--c:#e50914">' + G.play + "</i><span>Play on first<small>" + (fav === "auto" ? "Best available app" : LABEL[fav]) + "</small></span>" + G.r + "</button>" +
      '<button class="mrow" data-sheet="people"><i style="--c:#8f7cff">' + G.person + "</i><span>Profiles<small>" + (many ? S.profiles().length + " people" : "Add family members") + "</small></span>" + G.r + "</button>" +
      syncRow() +
      '<button class="mrow" data-qr><i style="--c:#f3a46b">' + G.heart + "</i><span>Quick Rate<small>Swipe 20 posters, sharpen your picks</small></span>" + G.r + "</button>" +
      '<button class="mrow" data-together><i style="--c:#22a06b">' + G.people + "</i><span>Watch together<small>What you'll both enjoy</small></span>" + G.r + "</button>";
    page.appendChild(opts);
    var likes = S.ids(S.list("likes")), mine = S.ids(S.list("mylist")), recent = S.ids(S.list("recent")), no = S.ids(S.list("dislikes"));
    function shelf(title, list, share, all) {
      if (!list.length) return;
      var row = h("div", "row");
      row.innerHTML = '<div class="row-h">' + esc(title) + (all ? '<button class="seeall" data-all="' + all + '">See All' + G.r + "</button>" : "") + '</div><div class="rail"></div>';
      var rail = row.querySelector(".rail");
      list.slice(0, 20).forEach(function (t) {
        if (!share) return rail.appendChild(poster(t));
        var w = h("div", "shc"); w.appendChild(poster(t));
        w.insertAdjacentHTML("beforeend", '<button data-share="' + t.id + '">' + G.send + "Share</button>"); rail.appendChild(w);
      });
      page.appendChild(row);
    }
    shelf("Continue Watching", recent, false, "recent");
    shelf("My List", mine, false, "mylist");
    shelf("Shows & Films You've Liked", likes, true, "likes");
    shelf("Not for Me", no, false, "dislikes");
    if (!mine.length && !likes.length && !recent.length)
      page.appendChild(h("div", "empty", "<b>Your list is empty</b>Tap + My List on anything you want to watch, or press and hold a poster."));
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
      '<div class="foot">Show list updated ' + (gen ? gen.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "—") + " · " + S.ALL.length + " titles across Netflix, Prime Video, JioHotstar, Apple TV+ and Crunchyroll.<br>Your lists stay on this iPhone.<br><span style=\"opacity:.6\">" + displayInfo() + "</span></div>");
  }
  // ---------- sync (Google account) ----------
  function syncRow() {
    var Y = window.VesperSync || { status: "off" }, on = Y.status === "synced" || Y.status === "syncing";
    var sub = Y.status === "synced" ? "Synced" + (Y.email ? " · " + Y.email : Y.linked ? " · linked device" : "") : Y.status === "syncing" ? "Syncing…" : Y.status === "error" ? "Couldn't sync — tap to retry" : "Sign in with Google to keep your list and taste everywhere";
    return '<button class="mrow" data-sheet="sync"><i style="--c:' + (on ? "#22a06b" : "#4285f4") + '">' + G.cloud + "</i><span>" + (on ? "Your Vesper account" : "Save to your Google account") + "<small>" + esc(sub) + "</small></span>" + G.r + "</button>";
  }
  function syncSheet() {
    var Y = window.VesperSync; if (!Y) return;
    var on = Y.status === "synced" || Y.status === "syncing";
    if (!on) {
      sheet('<h3>Keep Vesper everywhere</h3><div class="sub-h" style="padding:0 20px 14px">Your My List, likes, profiles and taste are saved to your Google account — never lost, and the same on your Mac and TV.</div>' +
        '<div class="sheet-in"><button class="btn gbtn" data-sync="google">' + G.google + "Sign in with Google</button></div>" +
        '<div class="sheet-in"><button class="btn wide" data-sync="code">Use a link code instead</button></div>' +
        '<div class="foot">Free — your data lives in your own Google account. Vesper never sees your password.</div>');
      return;
    }
    sheet("<h3>Your Vesper account</h3>" + '<div class="sub-h" style="padding:0 20px 10px">' + (Y.email ? "Signed in as <b>" + esc(Y.email) + "</b>" : "This device is linked to your account") + " · " + (Y.status === "synced" ? "everything is saved" : "saving…") + "</div>" +
      (Y.email ? '<h4>Link your TV or another device</h4><div class="sub-h" style="padding:0 20px 8px">Open Vesper there, choose “Link with a code”, and type the 6 letters it shows:</div>' +
        '<div class="sheet-in codein"><input maxlength="6" placeholder="ABC123" autocapitalize="characters" autocomplete="off"><button class="btn play" data-sync="approve">Link</button></div><div class="sub-h linkmsg" style="padding:0 20px"></div>' : "") +
      '<button class="opt red" data-sync="out"><span>Sign out on this device</span></button>');
  }
  function linkCodeSheet() {
    sheet('<h3>Link with a code</h3><div class="sub-h" style="padding:0 20px 14px">On a device that\'s already signed in (your Mac or another phone), open My Vesper → Your Vesper account, and type this code:</div><div class="bigcode"><div class="spin"></div></div>');
    window.VesperSync.requestLink(function (c) { var b = document.querySelector(".bigcode"); if (b) b.textContent = c.slice(0, 3) + " " + c.slice(3); },
      function () { closeSheet(); toast("Linked — your Vesper is here"); rerender(); }).catch(function () { var b = document.querySelector(".bigcode"); if (b) b.textContent = "Offline — try again"; });
  }
  function peopleSheet() {
    var ps = S.profiles(), cur = S.state.profile;
    sheet("<h3>Who's watching?</h3>" + ps.map(function (p) { return '<button class="opt' + (p.id === cur ? " on" : "") + '" data-prof="' + p.id + '">' + S.avatar(p) + "<span>" + esc(p.name) + "</span></button>"; }).join("") +
      '<button class="opt" data-padd>' + S.avatar(null) + "<span>Add a person</span></button>" +
      (ps.length ? '<button class="opt" data-pren><span style="padding-left:44px">Rename ' + esc((S.profile() || {}).name || "") + "</span></button>" : "") +
      (ps.length > 1 ? '<button class="opt red" data-prem><span style="padding-left:44px">Remove ' + esc((S.profile() || {}).name || "") + "</span></button>" : ""));
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
  var fromRect = null;
  function openDetail(id) {
    var t = S.T[id]; if (!t) return; curT = t; S.markViewed(t.id); buzz();
    var d = $("detail"), apps = t.avail || [], best = S.pickApp(t), soon = S.soonOf(t), rank = rankOf(t), arr = S.arrivalOf(t);
    var others = apps.filter(function (a) { return a !== best; }), inL = S.inList("mylist", t.id);
    var meta = [t.year ? "<span>" + t.year + "</span>" : "", t.cert ? '<span class="box">' + esc(t.cert) + "</span>" : "", "<span>" + esc(S.length(t)) + "</span>", '<span class="box">HD</span>', t.imdb ? '<span class="imdb">IMDb ' + t.imdb.toFixed(1) + "</span>" : ""].filter(Boolean).join("");
    var plays = best ? '<button class="btn play big" data-play="' + t.id + '" data-app="' + best + '">' + G.play + 'Play<img src="' + LOGO[best] + '"></button>'
      : '<div class="soonbox">' + G.bell + (soon ? "Coming " + new Date(soon.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + (soon.app ? " on " + LABEL[soon.app] : "") : "Not streaming on your apps right now") + "</div>";
    var cast = (t.cast || []).slice(0, 8), dirs = (t.dirs || []).slice(0, 2);
    d.innerHTML = '<div class="dtop"></div><div class="dbar"><span>' + esc(t.title) + '</span></div><button class="dclose" data-close>' + G.x + '</button><div class="dart"><img decoding="async" fetchpriority="high" src="' + S.bd(t, "s1440") + '" onerror="vImgErr(this)"><div class="g"></div></div><div class="dbody">' +
      tagLine(t) + "<h2>" + esc(t.title) + '</h2><div class="dmeta">' + meta + "</div>" +
      (rank ? '<div class="drank"><span class="t10">TOP<br>10</span>' + esc(rank) + "</div>" : arr ? '<div class="drank new">' + (arr.season > 1 ? "New season just added" : "Just added") + "</div>" : "") +
      (t.site && !best ? '<button class="btn play big feb" data-feb="' + t.id + '">' + G.play + "Play with FebBox</button>" : plays) + (t.site && best ? '<button class="btn wide feb" data-feb="' + t.id + '">' + G.play + "Play with FebBox</button>" : "") + '<button class="btn wide" data-list="' + t.id + '">' + (inL ? G.check + "In My List" : G.plus + "My List") + "</button>" +
      (others.length ? '<div class="also"><small>Also on</small>' + others.map(function (a) { return '<button data-play="' + t.id + '" data-app="' + a + '"><img src="' + LOGO[a] + '">' + LABEL[a] + "</button>"; }).join("") + "</div>" : "") +
      '<div class="desc">' + esc(t.desc || "") + "</div>" +
      '<div class="credits">' + (cast.length ? '<div class="cl">Cast: ' + cast.slice(0, 3).map(esc).join(", ") + (cast.length > 3 ? '<span class="more" data-more> … more</span><span class="rest">, ' + cast.slice(3).map(esc).join(", ") + "</span>" : "") + "</div>" : "") +
      (dirs.length ? "<div>" + (t.type === "SHOW" ? "Creator: " : "Director: ") + dirs.map(esc).join(", ") + "</div>" : "") + "</div>" + actsHTML(t) +
      '<div class="dtabs">' + (t.type === "SHOW" ? '<button class="on" data-dt="eps">Episodes</button>' : "") + '<button' + (t.type === "SHOW" ? "" : ' class="on"') + ' data-dt="more">More Like This</button></div><div class="dsect"></div></div>';
    d.scrollTop = 0;
    if (fromRect) { d.style.transformOrigin = (fromRect.left + fromRect.width / 2) + "px " + (fromRect.top + fromRect.height / 2) + "px"; } else d.style.transformOrigin = "50% 80%";
    fromRect = null;
    requestAnimationFrame(function () { d.classList.add("on"); });
    history.pushState({ d: 1 }, "");
    dtab(t.type === "SHOW" ? "eps" : "more");
    startPreview(t);
    if (window.VSB && t.site) VSB.prep(t, d.querySelector(".desc"));
  }
  function actsHTML(t) {
    var lk = S.inList("likes", t.id), no = S.inList("dislikes", t.id);
    return '<div class="acts"><button data-like="' + t.id + '"' + (lk ? ' class="on"' : "") + ">" + (lk ? G.upOn : G.up) + (lk ? "Rated" : "Rate") + "</button>" +
      '<button data-dislike="' + t.id + '"' + (no ? ' class="on no"' : "") + ">" + G.no + "Not for me</button>" +
      '<button data-trailer="' + t.id + '">' + G.film + "Trailer</button>" +
      '<button data-share="' + t.id + '">' + G.send + "Share</button></div>";
  }
  function refreshActs() {
    var d = $("detail"), a = d.querySelector(".acts"); if (!a || !curT) return; a.outerHTML = actsHTML(curT);
    var w = d.querySelector(".btn.wide"); if (w) w.innerHTML = S.inList("mylist", curT.id) ? G.check + "In My List" : G.plus + "My List";
  }
  function closeDetail(fromPop) { var d = $("detail"); if (!d.classList.contains("on")) return; stopPreview(); d.classList.remove("on"); setTimeout(island, 0); curT = null; if (!fromPop && history.state && history.state.d) history.back(); }
  function dtab(which) {
    var t = curT, box = $("detail").querySelector(".dsect"); if (!t || !box) return;
    qa(".dtabs button", $("detail")).forEach(function (b) { b.classList.toggle("on", b.dataset.dt === which); });
    box.textContent = "";
    if (which === "more") { var hid0 = S.hiddenSet(), all0 = likeOf(t).filter(function (x) { return x.poster && (x.avail || []).length && !hid0[x.id]; });
      var l = all0.filter(function (x) { return x.type === t.type; }); if (l.length < 12) l = l.concat(all0.filter(function (x) { return x.type !== t.type; })); l = l.slice(0, 24); box.appendChild(l.length ? gridOf(l) : h("div", "note", "Nothing similar on your apps yet.")); return; }
    loadEpisodes(t, box);
  }
  function epApp(t) { return S.pickApp(t); }
  // episode guide from TVmaze (free, works straight from the phone): numbers, titles, summaries, runtimes, air dates, pictures
  var EPS = {};
  function tvGuide(t) {
    if (EPS[t.id]) return EPS[t.id];
    function nm(x) { return S.norm(x || ""); }
    // exact match by IMDb code when we have it; otherwise by name and first-air year
    var find = t.imdb_id
      ? fetch("https://api.tvmaze.com/lookup/shows?imdb=" + t.imdb_id).then(function (r) { if (!r.ok) throw new Error("no imdb match"); return r.json(); })
      : Promise.reject(new Error("no imdb"));
    return (EPS[t.id] = find.catch(function () {
      return fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(t.title)).then(function (r) { return r.json(); }).then(function (res) {
        var want = nm(t.title), y = t.year || 0;
        var pick = res.map(function (x) { return x.show; }).filter(function (sh) {
          var sy = sh.premiered ? +sh.premiered.slice(0, 4) : 0; return nm(sh.name) === want && (!y || !sy || Math.abs(sy - y) <= 1); })[0];
        if (!pick) throw new Error("not found");
        return pick;
      });
    }).then(function (show) {
      return fetch("https://api.tvmaze.com/shows/" + show.id + "/episodes").then(function (r) { return r.json(); });
    }).then(function (list) {
      var by = {};
      list.forEach(function (e) { if (!e.season || e.number == null) return; (by[e.season] = by[e.season] || []).push({ s: e.season, n: e.number, title: e.name || "Episode " + e.number,
        desc: (e.summary || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(), runtime: e.runtime, date: e.airdate,
        img: e.image ? (e.image.original || e.image.medium) : null, sm: e.image ? e.image.medium : null, links: {} }); });
      var seasons = Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return { n: n, eps: by[n] }; });
      if (!seasons.length) throw new Error("empty");
      return seasons;
    }).catch(function (e) { delete EPS[t.id]; throw e; }));
  }
  // Up Next: remember the last episode you opened, per profile
  function epKey() { return "epsdone" + (S.state.profile ? "@" + S.state.profile : ""); }
  function lastEp(t) { return (S.state[epKey()] || {})[t.id] || null; }
  function markEp(t, ep) { var m = Object.assign({}, S.state[epKey()] || {}); m[t.id] = { s: ep.s, n: ep.n, at: Date.now() }; S.setRaw(epKey(), m); }
  function nextEp(ss, last) {
    if (!last) return null; var si = ss.findIndex(function (x) { return x.n === last.s; }); if (si < 0) return null;
    var e = ss[si].eps.filter(function (x) { return x.n > last.n; })[0]; if (e) return e;
    return ss[si + 1] ? ss[si + 1].eps[0] : null;
  }
  window.epHi = function (im) {
    im.classList.add("ok"); var hi = im.dataset.hi; if (!hi || im.src === hi) return; im.removeAttribute("data-hi");
    var big = new Image(); big.decoding = "async"; big.onload = function () { im.src = hi; }; big.src = hi;
  };
  function epDate(d) { if (!d) return ""; var x = new Date(d + "T12:00:00"); return x > new Date() ? "Coming " + x.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function loadEpisodes(t, box, sn) {
    var app = epApp(t);
    box.innerHTML = '<div class="spin"></div>';
    tvGuide(t).then(function (ss) {
      if (curT !== t) return;
      var last = lastEp(t), nx = nextEp(ss, last);
      var s = ss.filter(function (x) { return x.n === sn; })[0] || (nx && ss.filter(function (x) { return x.n === nx.s; })[0]) ||
        ((t.genres || []).indexOf("rly") >= 0 ? ss[ss.length - 1] : ss[0]);   // reality shows open on the newest season
      box._ss = ss;
      box.innerHTML = (nx ? '<button class="upnext" data-upnext>' + G.play + '<span><small>Up next</small>S' + nx.s + " · E" + nx.n + " " + esc(nx.title) + "</span></button>" : "") +
        '<div class="eptop"><button class="seasel" data-seasons>Season ' + s.n + (ss.length > 1 ? G.down : "") + "</button><small>" + s.eps.length + " episodes</small></div>";
      var el = h("div", "eps"); box.appendChild(el);
      s.eps.forEach(function (ep) {
        var e = h("div", "ep" + (last && (ep.s < last.s || (ep.s === last.s && ep.n <= last.n)) ? " seen" : "") + (nx && ep.s === nx.s && ep.n === nx.n ? " next" : "")); e._ep = ep;
        e.innerHTML = '<div class="eh"><div class="eth">' + (ep.img ? '<img loading="lazy" decoding="async" src="' + esc(ep.sm || ep.img) + '" data-hi="' + esc(ep.img) + '" onload="epHi(this)">' : '<div class="noimg" style="--h:' + (S.glowHue(t) + ep.n * 23) % 360 + '"><b>' + ep.n + "</b><small>EPISODE</small></div>") +
          (ep.img ? "<span>" + G.play + "</span>" : "") + '</div><div class="et"><b>' + ep.n + ". " + esc(ep.title) + "</b><small>" + [ep.runtime ? ep.runtime + "m" : "", epDate(ep.date)].filter(Boolean).join(" · ") + "</small></div></div>" +
          (ep.desc ? "<p>" + esc(ep.desc) + "</p>" : "");
        el.appendChild(e);
      });
      box._nx = nx;
      box.insertAdjacentHTML("beforeend", '<div class="epnote">Tap an episode to open ' + esc(LABEL[app] || "the app") + " — it picks up where you left off.</div>");
    }).catch(function () {
      if (curT !== t) return;
      box.innerHTML = '<div class="note">' + (t.seasons ? esc(S.length(t)) + (t.eps ? " · " + t.eps + " episodes" : "") + ". " : "") +
        "No episode guide for this one yet — tap <b>Play</b> and " + esc(LABEL[app] || "the app") + " opens right on the show.</div>";
    });
  }
  function seasonsSheet(box) {
    var ss = box._ss || []; if (ss.length < 2) return;
    sheet("<h3>Seasons</h3>" + ss.map(function (s) { return '<button class="opt" data-season="' + s.n + '"><span>Season ' + s.n + "</span><small>" + s.eps.length + " episodes</small></button>"; }).join(""));
  }
  function playEp(t, ep) {
    var app = epApp(t); if (!app) return;
    if (ep.s) markEp(t, ep);
    if (app === "netflix") { S.markRecent(t.id); return window.V.call("play", { app: app, url: ep.links.netflix || S.playUrl(app, t) }); }
    S.playEpisode(t, app, ep);
  }
  function playTitle(id, app) { var t = S.T[id]; if (!t) return; if (!S.play(t, app)) { openDetail(id); return; } toast("Opening " + LABEL[app || S.pickApp(t)] + "…"); }

  // ---------- trailers (YouTube; found daily by tools/trailers.mjs) ----------
  var TR = {};
  function trailerOf(t) { return t && TR[t.id] || ""; }
  function ytSearch(t) { return "https://www.youtube.com/results?search_query=" + encodeURIComponent(t.title + (t.year ? " " + t.year : "") + " official trailer"); }
  function openTrailer(t) {
    var id = trailerOf(t); buzz();
    if (!id) { window.vesperOpen("youtube", ytSearch(t)); return; }
    stopPreview();
    var o = h("div", "trl"); o.id = "trl";
    o.innerHTML = '<div class="tbar"><b>' + esc(t.title) + '</b><button data-tclose>' + G.x + '</button></div><div class="tv"><iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>' +
      '<div class="tacts">' + (S.pickApp(t) ? '<button class="btn play" data-play="' + t.id + '">' + G.play + "Play on " + LABEL[S.pickApp(t)] + "</button>" : "") +
      '<button class="btn wide" data-yt="' + id + '">Open in YouTube</button></div>';
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add("on"); }); island();
  }
  function closeTrailer() { var o = $("trl"); if (o) { o.classList.remove("on"); setTimeout(function () { o.remove(); island(); }, 300); } }
  // details: the trailer starts silently at the top, like Netflix
  var prevT = null;
  function startPreview(t) {
    var id = trailerOf(t), art = $("detail").querySelector(".dart"); if (!id || !art) return;
    clearTimeout(prevT);
    prevT = setTimeout(function () { if (curT !== t) return;
      var f = h("iframe"); f.className = "pv"; f.setAttribute("allow", "autoplay; encrypted-media"); f.setAttribute("playsinline", "");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=" + id + "&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1";
      f.onload = function () { setTimeout(function () { art.classList.add("playing"); }, 3800); };
      art.appendChild(f);
      var m = h("button", "mute", G.muted); m.dataset.mute = "1"; art.appendChild(m);
    }, 900);
  }
  function stopPreview() { clearTimeout(prevT); var d = $("detail"); qa(".dart iframe,.dart .mute", d).forEach(function (x) { x.remove(); }); var a = d.querySelector(".dart"); if (a) a.classList.remove("playing"); }
  function toggleMute(btn) {
    var f = $("detail").querySelector(".dart iframe"); if (!f) return; var on = btn.dataset.mute === "1";
    f.contentWindow.postMessage(JSON.stringify({ event: "command", func: on ? "unMute" : "mute", args: [] }), "*");
    btn.dataset.mute = on ? "0" : "1"; btn.innerHTML = on ? G.sound : G.muted; buzz();
  }

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
    var fb = e.target.closest("[data-feb]"); if (fb && window.VSB) { e.stopPropagation(); return VSB.play(S.T[fb.dataset.feb], toast); }
    var el = e.target.closest("[data-play],[data-list],[data-like],[data-dislike],[data-share],[data-close],[data-dt],[data-seasons],[data-season],[data-tab],[data-go],[data-sheet],[data-pick],[data-sync],[data-ci],[data-eyear],[data-era],[data-roulette],[data-upnext],[data-qr],[data-tmax],[data-together],[data-tpart],[data-qd],[data-trailer],[data-tclose],[data-yt],[data-mute],[data-more],[data-similar],[data-all],[data-nh],[data-wx],[data-mood],[data-prof],[data-padd],[data-pren],[data-prem],[data-fav],[data-clear],.ep,.pc,.wide,.nh,.li,.hero,.toprez");
    if (!el) return;
    var D = el.dataset;
    var inSheet = !!el.closest("#sheet");
    if (D.play) { e.stopPropagation(); if (inSheet) closeSheet(); return playTitle(D.play, D.app); }
    if (D.trailer) { e.stopPropagation(); if (inSheet) closeSheet(); return openTrailer(S.T[D.trailer]); }
    if (D.tclose != null) return closeTrailer();
    if (D.yt) { closeTrailer(); return window.vesperOpen("youtube", "https://www.youtube.com/watch?v=" + D.yt); }
    if (D.mute) return toggleMute(el);
    if (D.qd) { closeSheet(); return openDetail(D.qd); }
    if (D.upnext != null) { var bx = el.closest(".dsect"); if (bx && bx._nx && curT) { buzz(); playEp(curT, bx._nx); setTimeout(function () { if (curT) loadEpisodes(curT, bx); }, 800); } return; }
    if (D.qr != null) { closeSheet(); return quickRate(); }
    if (D.tmax) { setPref("tmax", +D.tmax); buzz(); closeSheet(); return show("home", "time"); }
    if (D.together != null) return togetherSheet();
    if (D.tpart) return togetherPicks(D.tpart);
    if (D.more != null) { el.parentNode.classList.add("open"); return; }
    if (D.similar) { var sm = S.similar(S.T[D.similar], 12).filter(function (x) { return (x.avail || []).length && !S.hiddenSet()[x.id]; }); if (sm.length) openDetail(sm[Math.floor(Math.random() * Math.min(6, sm.length))].id); return; }
    if (D.all) { var AL = { recent: "Continue Watching", mylist: "My List", likes: "Liked", dislikes: "Not for Me" }; var items = S.ids(S.list(D.all));
      return sheet("<h3>" + AL[D.all] + "</h3>", function (card) { card.appendChild(gridOf(items)); }); }
    if (inSheet && (D.list || D.like || D.dislike)) setTimeout(function () { closeSheet(); if (D.dislike && tab !== "search") rerender(); }, 120);
    if (D.remind) { var r = S.toggle("mylist", D.list, true); buzz(); toast(r ? "We'll keep it at the top of My List" : "Reminder removed"); el.innerHTML = r ? G.check + "Reminded" : G.bell + "Remind Me"; return; }
    if (D.list) { var on = S.toggle("mylist", D.list, true), lt = S.T[D.list], la = lt && (lt.orig && (lt.avail || []).indexOf(lt.orig) >= 0 ? lt.orig : S.pickApp(lt)); buzz();
      if (on && la) toast("Added to My List", "Add in " + LABEL[la].replace("Prime Video", "Prime") + " too ›", function () { openTitlePage(lt); }); else toast(on ? "Added to My List" : "Removed from My List");
      if (el.closest(".hero,.nhb")) el.innerHTML = (on ? G.check : G.plus) + "My List"; refreshActs(); if (tab === "mylist" && !curT) rerender(); return; }
    if (D.like) { var l = S.like(D.like); buzz(); toast(l ? "Got it — more like this" : "Like removed"); refreshActs(); return; }
    if (D.dislike) { var n = S.dislike(D.dislike); buzz(); toast(n ? "Hidden — we won't show it again" : "It's back"); refreshActs(); return; }
    if (D.share) { var st = S.T[D.share], a = S.pickApp(st); if (navigator.share) navigator.share({ title: st.title, url: a ? S.playUrl(a, st).replace("/watch/", "/title/") : undefined }).catch(function () {}); return; }
    if (D.close != null) return closeDetail();
    if (D.dt) return dtab(D.dt);
    if (D.seasons != null) return seasonsSheet(el.closest(".dsect"));
    if (D.season) { closeSheet(); return loadEpisodes(curT, $("detail").querySelector(".dsect"), +D.season); }
    if (el.classList.contains("ep") && curT) { var b2 = el.closest(".dsect"); playEp(curT, el._ep); setTimeout(function () { if (curT && b2) loadEpisodes(curT, b2, el._ep.s); }, 800); return; }
    if (D.tab) { closeSheet(); closeDetail(); if (D.tab === tab && tab === "home" && sec !== "home") return show("home", "home"); if (D.tab === tab) { $("view").scrollTo({ top: 0, behavior: "smooth" }); return; } return show(D.tab, null, null, true); }
    if (D.roulette) return roulette(D.roulette);
    if (D.sync) { var Y = window.VesperSync;
      if (D.sync === "google") { Y.signIn().then(function () { closeSheet(); toast("Signed in — saving your Vesper"); }).catch(function (er) { toast(er && er.code === "auth/popup-closed-by-user" ? "Sign-in cancelled" : "Couldn't sign in — try a link code"); }); return; }
      if (D.sync === "code") return linkCodeSheet();
      if (D.sync === "out") { Y.signOut(); closeSheet(); toast("Signed out — your lists stay on this phone"); return rerender(); }
      if (D.sync === "approve") { var inp = document.querySelector(".codein input"), msg = document.querySelector(".linkmsg");
        Y.approveLink(inp.value).then(function (n) { buzz(); msg.textContent = "Linked " + n + " ✓"; inp.value = ""; }).catch(function (er) { msg.textContent = er.message; }); return; }
      return; }
    if (D.ci) { var ct = S.T[D.cid]; closeSheet(); buzz(); if (!ct) return;
      if (D.ci === "love") { if (!S.inList("likes", ct.id)) S.like(ct.id); toast("Noted — more like " + ct.title); }
      else if (D.ci === "meh") { if (!S.inList("dislikes", ct.id)) S.dislike(ct.id); toast("Got it — fewer like this"); }
      else if (D.ci === "done") { if (!S.inList("watched", ct.id)) S.toggle("watched", ct.id, true); toast("Marked as watched"); }
      else if (D.ci === "next") { setTimeout(function () { openDetail(ct.id); }, 300); }
      return; }
    if (D.eyear != null && D.eyear !== "") { setPref("eraYear", +D.eyear); buzz(); return show("home", "throwback"); }
    if (D.era) { setPref("era", D.era); setPref("eraYear", 0); buzz(); closeSheet(); closeDetail(); return show("home", "throwback"); }
    if (D.go) { closeSheet(); closeDetail(); return show("home", D.go); }
    if (D.sheet === "apps") return appsSheet();
    if (D.sheet === "cats") return catsSheet();
    if (D.sheet === "place") return placeSheet();
    if (D.sheet === "me") return meSheet();
    if (D.sheet === "sync") return syncSheet();
    if (D.sheet === "time") return timeSheet();
    if (D.sheet === "people") return peopleSheet();
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
    if (id) { var src = el.closest(".pc,.wide,.hero,.nh .art,.li") || el; fromRect = src.getBoundingClientRect(); closeSheet(); openDetail(id); }
  });
  window.addEventListener("popstate", function () { closeDetail(true); });
  $("detail").addEventListener("scroll", island, { passive: true });

  // the moment a finger lands on a poster, start fetching its big artwork so the page opens ready
  var warmed = {};
  document.addEventListener("touchstart", function (e) {
    var c = e.target.closest && e.target.closest("[data-id]"); if (!c) return; var id = c.dataset.id, t = S.T[id]; if (!t || warmed[id]) return;
    warmed[id] = 1; var im = new Image(); im.decoding = "async"; im.src = S.bd(t, "s1440");
  }, { passive: true, capture: true });

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
      '<button class="opt" data-trailer="' + id + '">' + G.film + "<span>Watch trailer</span></button>" +
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

  // pull down at the top of Home for a fresh set of picks
  (function () {
    var v = $("view"), y0 = null, pull = 0, ind = h("div", "ptr", G.dice + "<span>Pull for fresh picks</span>"); document.body.appendChild(ind);
    v.addEventListener("touchstart", function (e) { y0 = tab === "home" && v.scrollTop <= 0 ? e.touches[0].clientY : null; pull = 0; }, { passive: true });
    v.addEventListener("touchmove", function (e) { if (y0 == null) return; pull = Math.max(0, e.touches[0].clientY - y0);
      if (pull > 10) { ind.classList.add("on"); ind.style.transform = "translate(-50%," + Math.min(pull * 0.5, 70) + "px) rotate(" + pull * 2 + "deg)"; ind.classList.toggle("ready", pull > 120); } }, { passive: true });
    v.addEventListener("touchend", function () { if (y0 == null) return; y0 = null; ind.style.transform = ""; ind.classList.remove("on");
      if (pull > 120) { ind.classList.remove("ready"); buzz(); if (S.reseed) S.reseed(); noted = false; show("home", sec); toast("Fresh picks for you"); } pull = 0; });
  })();

  // fill the whole screen: measure the strip iOS leaves out at the bottom of home-screen apps
  function fitScreen() {
    var standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    var portrait = innerHeight > innerWidth, H = portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width);
    var root = document.documentElement;
    root.style.setProperty("--gap", "0px");
    if (standalone && H >= innerHeight) { root.classList.add("fit"); root.style.setProperty("--H", H + "px"); }
    else { root.classList.remove("fit"); root.style.removeProperty("--H"); }
  }
  function displayInfo() {
    var p = document.createElement("div"); p.style.cssText = "position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden";
    document.body.appendChild(p); var cs = getComputedStyle(p), st = cs.paddingTop, sb = cs.paddingBottom; p.remove();
    return "Vesper v22 · Display: screen " + screen.width + "×" + screen.height + " · window " + innerWidth + "×" + innerHeight + " · edges " + parseInt(st) + "/" + parseInt(sb) +
      " · " + (navigator.standalone ? "home-screen" : "browser") + (document.documentElement.classList.contains("fit") ? " · fit" : "");
  }
  fitScreen(); addEventListener("resize", fitScreen); addEventListener("orientationchange", function () { setTimeout(fitScreen, 300); });

  // ---------- start ----------
  $("view").addEventListener("scroll", onScroll, { passive: true });
  function fetchCatalog() { return fetch("catalog.json?d=" + new Date().toISOString().slice(0, 13)).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function loadTrailers() { return fetch("trailers.json?d=" + new Date().toISOString().slice(0, 10)).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { TR = j || {}; }).catch(function () {}); }
  window.vesperRefresh = function () { S.state = window.vesperState; if (!$("detail").classList.contains("on") && !$("sheet").classList.contains("on")) rerender(); };
  if (window.VesperSync) window.VesperSync.onChange(function () { if (tab === "mylist" && !$("sheet").classList.contains("on")) rerender(); });
  function start(cat) {
    if (window.VesperSync) setTimeout(function () { window.VesperSync.start(); }, 600);
    S.load(cat); loadTrailers();
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
  fetchCatalog().then(start).catch(function (e) {
    if (e && e.stack) { console.error(e); try { localStorage.setItem("vesper.lastError", String(e.stack).slice(0, 500)); } catch (x) {} }
    $("boot").innerHTML = '<div class="empty"><b>Can\'t reach Vesper</b>Check your connection and open it again.</div>';
  });
  // came back after a while: refresh the list quietly
  // remember what you went off to watch, so Vesper can ask how it was when you come back
  var _call = window.V.call;
  window.V.call = function (n, a) {
    if (n === "play" && a) { var id = a.id || (curT && curT.id); try { localStorage.setItem("vesper.lastPlay", JSON.stringify({ id: id, at: Date.now(), p: S.state.profile || "" })); } catch (e) {} }
    return _call.apply(this, arguments);
  };
  function checkIn() {
    var L = null; try { L = JSON.parse(localStorage.getItem("vesper.lastPlay") || "null"); } catch (e) {}
    if (!L || !L.id || L.done) return; var gone = Date.now() - L.at, t = S.T[L.id];
    if (!t || gone < 8 * 60e3 || gone > 14 * 3600e3 || (L.p || "") !== (S.state.profile || "")) return;
    L.done = 1; try { localStorage.setItem("vesper.lastPlay", JSON.stringify(L)); } catch (e) {}
    var nx = null, ss = EPS[t.id]; if (ss && ss.then === undefined) nx = null;
    sheet('<div class="checkin"><img src="' + S.bd(t, "s640") + '"><div><small>Welcome back</small><b>How was ' + esc(t.title) + "?</b></div></div>" +
      '<div class="cibtns"><button data-ci="love" data-cid="' + t.id + '">' + G.heart + "Loved it</button>" +
      '<button data-ci="meh" data-cid="' + t.id + '">' + G.no + "Not for me</button>" +
      (t.type === "MOVIE" ? '<button data-ci="done" data-cid="' + t.id + '">' + G.check + "Finished</button>" : '<button data-ci="next" data-cid="' + t.id + '">' + G.play + "Next episode</button>") +
      '<button data-ci="later" data-cid="' + t.id + '">' + G.clock + "Still watching</button></div>");
  }
  var hiddenAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    setTimeout(checkIn, 700);
    if (hiddenAt && Date.now() - hiddenAt > 4 * 3600e3) fetchCatalog().then(function (cat) { S.load(cat); TOPSET = null; noted = false; if (!$("detail").classList.contains("on")) show(tab, sec, arg); }).catch(function () {});
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (r) { r.update().catch(function () {}); }).catch(function () {});
})();
