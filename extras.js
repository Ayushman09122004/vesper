/* Vesper web — extras:
   1. Trailer feed: a full-screen, swipe-up feed of trailers (your apps' titles, leaning to your taste and what's new),
      each with Play / My List / Info. Opens from the "Trailers" chip on Home.
   2. Netflix history import: Netflix → Account → Profile → Viewing activity → Download all gives
      NetflixViewingHistory.csv ("Title","Date"). Vesper marks every title it knows as watched and treats shows you
      binged (6+ episodes) and films you watched twice as liked — so picks stop repeating what you've seen. */
(function () {
  var S = window.VS; if (!S) return;
  var LS = window.localStorage;
  function ld(k, d) { try { var v = JSON.parse(LS.getItem("vesper.x." + k)); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { LS.setItem("vesper.x." + k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var GN = { act: "Action", ani: "Animation", cmy: "Comedy", crm: "Crime", doc: "Documentary", drm: "Drama", fml: "Family", fnt: "Fantasy", hst: "History", hrr: "Horror", msc: "Music",
    rma: "Romance", scf: "Sci-Fi", spt: "Sport", trl: "Thriller", war: "War", wsn: "Western", rly: "Reality" };

  var css = document.createElement("style");
  css.textContent =
    ".tf{position:fixed;inset:0;z-index:45;background:#000;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;opacity:0;pointer-events:none;transition:opacity .25s;-webkit-overflow-scrolling:touch}" +
    ".tf.on{opacity:1;pointer-events:auto}.tf::-webkit-scrollbar{display:none}" +
    ".tfs{position:relative;height:100vh;height:100dvh;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end}" +
    ".tfbg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.32;transform:scale(1.04)}" +
    ".tfv{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 64px);aspect-ratio:16/9;background:#000;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)}" +
    ".tfv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.tfv iframe{position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity .5s;pointer-events:none}" +
    ".tfs.playing .tfv iframe{opacity:1}" +
    ".tfg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,0) 22%,rgba(0,0,0,0) 45%,rgba(0,0,0,.92) 85%)}" +
    ".tfi{position:relative;z-index:2;padding:0 18px calc(env(safe-area-inset-bottom) + 28px);color:#fff}" +
    ".tfi .tfl{display:flex;align-items:center;gap:8px;font:700 11.5px -apple-system,system-ui,sans-serif;color:rgba(255,255,255,.7);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px}.tfi .tfl img{width:20px;height:20px;border-radius:5px}" +
    ".tfi h2{font:800 28px/1.08 -apple-system,system-ui,sans-serif;letter-spacing:-.6px;margin:0 0 8px}" +
    ".tfi .tfm{font:600 13px -apple-system,system-ui,sans-serif;color:rgba(255,255,255,.75);margin-bottom:9px}.tfi .tfm b{color:#f5c518}" +
    ".tfi p{font:500 13.5px/1.4 -apple-system,system-ui,sans-serif;color:rgba(255,255,255,.8);margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}" +
    ".tfb{display:flex;gap:10px}.tfb button{height:44px;border-radius:12px;border:0;font:700 14.5px -apple-system,system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;padding:0 16px}" +
    ".tfb .tfp{flex:1;background:#fff;color:#000}.tfb .tfx{background:rgba(255,255,255,.16);color:#fff}" +
    ".tfbar{position:fixed;left:0;right:0;top:0;z-index:46;display:flex;justify-content:space-between;align-items:center;padding:calc(env(safe-area-inset-top) + 12px) 14px 10px;pointer-events:none}" +
    ".tfbar b{font:800 17px -apple-system,system-ui,sans-serif;color:#fff;letter-spacing:-.3px;text-shadow:0 1px 8px rgba(0,0,0,.6)}" +
    ".tfbar button{pointer-events:auto;width:38px;height:38px;border-radius:99px;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:17px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
    ".tfbar .tfr{display:flex;gap:8px}.tfhint{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 6px);transform:translateX(-50%);z-index:46;font:600 11px -apple-system,system-ui,sans-serif;color:rgba(255,255,255,.5);pointer-events:none}" +
    "html.desk .tfv{left:50%;width:min(960px,92vw);transform:translateX(-50%);border-radius:14px;top:80px}html.desk .tfi{max-width:960px;margin:0 auto;width:92vw;padding-bottom:40px}html.desk .tfi h2{font-size:40px}" +
    // Netflix import
    ".nfi{position:fixed;inset:0;z-index:72;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}" +
    ".nfi>div{width:100%;max-width:520px;background:#16161e;border-radius:18px 18px 0 0;padding:22px 20px calc(env(safe-area-inset-bottom) + 22px);color:#fff;font-family:-apple-system,system-ui,sans-serif}" +
    "html.desk .nfi{align-items:center}html.desk .nfi>div{border-radius:18px}" +
    ".nfi h3{margin:0 0 6px;font:800 20px -apple-system,system-ui,sans-serif}.nfi p{color:rgba(255,255,255,.72);font-size:14px;line-height:1.45;margin:0 0 14px}.nfi ol{margin:0 0 16px;padding-left:20px;color:rgba(255,255,255,.8);font-size:13.5px;line-height:1.55}" +
    ".nfi .nfb{display:flex;gap:10px}.nfi button,.nfi label{flex:1;height:46px;border-radius:12px;border:0;font:700 15px -apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer}" +
    ".nfi .nfgo{background:#e50914;color:#fff}.nfi .nfno{background:rgba(255,255,255,.12);color:#fff}.nfi .nfst{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 0 16px}" +
    ".nfi .nfst div{background:rgba(255,255,255,.06);border-radius:12px;padding:12px}.nfi .nfst b{display:block;font-size:24px}.nfi .nfst small{color:rgba(255,255,255,.6);font-size:12px}";
  document.head.appendChild(css);

  // ================= trailer feed =================
  var feed = null, list = [], muted = true, io = null, cur = null;
  function pool() {
    var hid = S.hiddenSet ? S.hiddenSet() : {}, T = S.taste ? S.taste() : { n: 0 }, Y = new Date().getFullYear(), seenW = {};
    (S.list ? S.list("watched") : []).forEach(function (id) { seenW[id] = 1; });
    var l = (S.ALL || []).filter(function (t) { return !hid[t.id] && !seenW[t.id] && (t.avail || []).length && t.backdrop && window.VUI && VUI.trailer(t); });
    l.forEach(function (t) { t._tf = Math.log(1 + (t.votes || 0)) * 0.8 + (t.imdb || 6) + (t.year >= Y - 1 ? 3 : 0) + (T.n >= 5 ? S.tasteScore(t, T) * 0.8 : 0) + Math.random() * 5; });
    return l.sort(function (a, b) { return b._tf - a._tf; }).slice(0, 240);
  }
  function slide(t, i) {
    var app = S.pickApp ? S.pickApp(t) : null, g = (t.genres || []).map(function (x) { return GN[x]; }).filter(Boolean).slice(0, 2).join(" · ");
    var d = document.createElement("div"); d.className = "tfs"; d.dataset.i = i;
    d.innerHTML = '<img class="tfbg" loading="lazy" src="' + esc(S.bd(t, "s1440")) + '" alt="">' +
      '<div class="tfv"><img loading="lazy" src="' + esc(S.bd(t, "s1440")) + '" alt=""></div><div class="tfg"></div>' +
      '<div class="tfi">' + (app && S.LOGO[app] ? '<div class="tfl"><img src="' + S.LOGO[app] + '">' + esc(S.LABEL[app] || "") + "</div>" : "") +
      "<h2>" + esc(t.title) + '</h2><div class="tfm">' + [t.year, g, t.imdb ? "<b>★</b> " + t.imdb.toFixed(1) : ""].filter(Boolean).join(" · ") + "</div>" +
      "<p>" + esc(t.desc || "") + '</p><div class="tfb">' +
      (app ? '<button class="tfp" data-play="' + esc(t.id) + '" data-app="' + esc(app) + '">' + PLAY + "Play</button>" : '<button class="tfp" data-free="' + esc(t.id) + '">' + PLAY + "Play</button>") +
      '<button class="tfx" data-list="' + esc(t.id) + '">' + (S.inList("mylist", t.id) ? "✓" : "+") + ' My List</button><button class="tfx" data-tfinfo="' + esc(t.id) + '">Info</button></div></div>';
    return d;
  }
  function ytUrl(id) { return "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=" + id + "&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0"; }
  function ytCmd(f, func) { try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: [] }), "*"); } catch (e) {} }
  function activate(sl) {
    if (cur === sl) return;
    if (cur) { cur.classList.remove("playing"); var of = cur.querySelector("iframe"); if (of) of.remove(); }
    cur = sl; var t = list[+sl.dataset.i]; if (!t) return;
    var id = VUI.trailer(t); if (!id) return;
    var f = document.createElement("iframe"); f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture"); f.src = ytUrl(id);
    sl.querySelector(".tfv").appendChild(f);
    VUI.ytWatch(f, function () { if (cur !== sl) return; sl.classList.add("playing"); if (!muted) ytCmd(f, "unMute"); });
    // keep a few slides ahead filled
    var i = +sl.dataset.i; if (i > feed._n - 6) more();
  }
  function more() { var start = feed._n, end = Math.min(list.length, start + 12), box = feed.querySelector(".tfl8");
    for (var i = start; i < end; i++) { var s = slide(list[i], i); box.appendChild(s); io.observe(s); } feed._n = end; }
  function openFeed() {
    if (!feed) {
      feed = document.createElement("div"); feed.className = "tf";
      feed.innerHTML = '<div class="tfbar"><b>Trailers</b><div class="tfr"><button data-tfsnd aria-label="Sound">🔇</button><button data-tfx aria-label="Close">✕</button></div></div><div class="tfl8"></div><div class="tfhint">Swipe up for the next one</div>';
      document.body.appendChild(feed);
      io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > 0.6) activate(e.target); }); }, { root: feed, threshold: [0.6] });
      feed.addEventListener("click", function (e) {
        if (e.target.closest("[data-tfx]")) { e.stopPropagation(); return closeFeed(); }
        var sn = e.target.closest("[data-tfsnd]"); if (sn) { e.stopPropagation(); muted = !muted; sn.textContent = muted ? "🔇" : "🔊"; var f = cur && cur.querySelector("iframe"); if (f) ytCmd(f, muted ? "mute" : "unMute"); return; }
        var inf = e.target.closest("[data-tfinfo]"); if (inf) { e.stopPropagation(); muted = true; var f2 = cur && cur.querySelector("iframe"); if (f2) ytCmd(f2, "mute"); if (window.VUI) VUI.open(inf.dataset.tfinfo); return; }
        var lb = e.target.closest("[data-list]"); if (lb) setTimeout(function () { lb.innerHTML = (S.inList("mylist", lb.dataset.list) ? "✓" : "+") + " My List"; }, 50);
        if (e.target.closest("[data-free],[data-play]")) { var f3 = cur && cur.querySelector("iframe"); if (f3) ytCmd(f3, "pauseVideo"); }
      });
    }
    list = pool(); feed._n = 0; cur = null; feed.querySelector(".tfl8").textContent = ""; more(); feed.scrollTop = 0;
    feed.classList.add("on"); document.documentElement.style.overflow = "hidden";
    history.pushState({ tf: 1 }, "");
  }
  function closeFeed(fromPop) {
    if (!feed || !feed.classList.contains("on")) return;
    feed.classList.remove("on"); document.documentElement.style.overflow = "";
    if (cur) { var f = cur.querySelector("iframe"); if (f) f.remove(); cur.classList.remove("playing"); cur = null; }
    if (!fromPop && history.state && history.state.tf) history.back();
  }
  window.addEventListener("popstate", function () { if (feed && feed.classList.contains("on") && !(history.state && history.state.tf) && !(history.state && history.state.d)) closeFeed(true); });
  document.addEventListener("click", function (e) { var c = e.target.closest && e.target.closest("[data-vfeed]"); if (!c) return; e.stopPropagation(); e.preventDefault(); openFeed(); }, true);

  // ================= Netflix history import =================
  function parseCSV(txt) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < txt.length; i++) { var c = txt[i];
      if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; } else f += c; }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  var SPLIT = /:\s*(Season|Series|Part|Volume|Vol\.|Chapter|Book|Limited Series|Collection|Episode|Staffel|Temporada|Saison|Stagione)\b/i;
  function importNetflix(txt) {
    var rows = parseCSV(txt).filter(function (r) { return r.length >= 1 && r[0] && !/^title$/i.test(r[0].trim()); });
    var prefixN = {}; rows.forEach(function (r) { var p = r[0].split(": ")[0]; prefixN[p] = (prefixN[p] || 0) + 1; });
    var shows = {}, films = {};
    rows.forEach(function (r) { var t = r[0].trim(), m = t.split(SPLIT), name;
      if (m.length > 1) name = m[0]; else if (t.indexOf(": ") > 0 && prefixN[t.split(": ")[0]] >= 2) name = t.split(": ")[0]; else name = t;
      var isShow = m.length > 1 || name !== t; (isShow ? shows : films)[name] = ((isShow ? shows : films)[name] || 0) + 1; });
    var idx = {}; (S.ALL || []).forEach(function (t) { [t.title, t.otitle].forEach(function (n) { if (!n) return; var k = S.norm(n); var o = idx[k]; if (!o || ((t.avail || []).indexOf("netflix") >= 0 && (o.avail || []).indexOf("netflix") < 0) || (t.votes || 0) > (o.votes || 0) * 3) idx[k] = t; }); });
    var watched = S.list("watched").slice(), likes = S.list("likes").slice(), no = {}; S.list("dislikes").forEach(function (id) { no[id] = 1; });
    var wSet = {}; watched.forEach(function (id) { wSet[id] = 1; }); var lSet = {}; likes.forEach(function (id) { lSet[id] = 1; });
    var res = { titles: 0, matched: 0, liked: 0, missed: [] };
    function take(name, n, show) { res.titles++; var k = S.norm(name), t = idx[k];
      if (t && show !== (t.type === "SHOW") && idx[k + " " + (show ? "series" : "")]) t = idx[k + " series"];
      if (!t) { res.missed.push(name); return; } res.matched++;
      if (!wSet[t.id]) { wSet[t.id] = 1; watched.unshift(t.id); }
      if ((show ? n >= 6 : n >= 2) && !lSet[t.id] && !no[t.id]) { lSet[t.id] = 1; likes.unshift(t.id); res.liked++; } }
    Object.keys(shows).forEach(function (k) { take(k, shows[k], true); });
    Object.keys(films).forEach(function (k) { take(k, films[k], false); });
    S.set("watched", watched.slice(0, 5000)); S.set("likes", likes.slice(0, 3000));
    sv("nfimport", { at: Date.now(), titles: res.titles, matched: res.matched, liked: res.liked, rows: rows.length });
    return res;
  }
  function nfSheet(html) {
    var o = document.querySelector(".nfi"); if (o) o.remove();
    o = document.createElement("div"); o.className = "nfi"; o.innerHTML = "<div>" + html + "</div>"; document.body.appendChild(o);
    o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-nfclose]")) o.remove(); });
    var inp = o.querySelector("input[type=file]");
    if (inp) inp.addEventListener("change", function () { var file = inp.files && inp.files[0]; if (!file) return; var rd = new FileReader();
      rd.onload = function () { var r = importNetflix(String(rd.result || ""));
        nfSheet("<h3>Imported ✓</h3><p>Vesper read your Netflix history.</p><div class=\"nfst\"><div><b>" + r.titles + "</b><small>films & series in the file</small></div><div><b>" + r.matched + "</b><small>marked as watched</small></div>" +
          "<div><b>" + r.liked + "</b><small>you binged or rewatched → liked</small></div><div><b>" + r.missed.length + "</b><small>not in Vesper's catalog</small></div></div>" +
          "<p>Your picks now leave out what you've seen and lean towards what you loved.</p><div class=\"nfb\"><button class=\"nfgo\" data-nfclose>Done</button></div>"); };
      rd.readAsText(file); });
  }
  function nfStart() {
    var last = ld("nfimport", null);
    nfSheet("<h3>Import your Netflix history</h3><p>Vesper marks everything you've watched and learns your taste from it. The file stays on this device.</p>" +
      "<ol><li>On netflix.com: <b>Account → Profiles → your profile → Viewing activity</b></li><li>Scroll down and tap <b>Download all</b> (NetflixViewingHistory.csv)</li><li>Pick that file here</li></ol>" +
      (last ? "<p>Last import: " + new Date(last.at).toLocaleDateString() + " · " + last.matched + " titles marked.</p>" : "") +
      '<div class="nfb"><button class="nfno" data-nfclose>Not now</button><label class="nfgo">Choose file<input type="file" accept=".csv,text/csv" hidden></label></div>');
  }
  document.addEventListener("click", function (e) { var c = e.target.closest && e.target.closest("[data-nfimport]"); if (!c) return; e.stopPropagation(); e.preventDefault(); nfStart(); }, true);

  window.VX = { feed: openFeed, importNetflix: importNetflix, nfStart: nfStart, nfLast: function () { return ld("nfimport", null); } };
})();
