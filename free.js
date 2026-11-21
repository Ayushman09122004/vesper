/* Vesper web — "Free servers": any film or series can be watched in Vesper through public embed players (VidQueen,
   VidGold, Cinezo, VsEmbed…), the same way stream-aggregator sites do it: the player is asked for a TMDB id and shows the
   video in a frame. Titles come from Cinemeta (Stremio's free public catalog: search, posters, IMDb + TMDB ids, episodes),
   which works straight from the phone with no key and no helper.
   - every title page gets "Watch free" (catalog titles too, matched by IMDb id)
   - Search gets a "Free servers" switch → an "On free servers" row (anything Cinemeta knows, not just your apps)
   - Home / Films / Series get "Watch free" rows from Cinemeta's popular + new lists
   The players are other sites: no control over their ads or what each server has. */
(function () {
  var S = window.VS; if (!S) return;
  var LS = window.localStorage;
  function ld(k, d) { try { var v = JSON.parse(LS.getItem("vesper.fs." + k)); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { LS.setItem("vesper.fs." + k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return S.norm(s || ""); }
  var CM = "https://v3-cinemeta.strem.io", MH = "https://images.metahub.space";
  var ON = ld("on", true), IDS = ld("ids", {}), EPL = ld("ep", {}), CAT = ld("cat", {});

  // ---------- the servers (TMDB id; same order idea as the aggregator: own-brand players first, ad-heavy ones last) ----------
  var LOOK = "autoplay=true&chromecast=true&servericon=true&setting=true&pip=true&font=Roboto&fontcolor=ffffff&fontsize=20&opacity=0.5&primarycolor=ffffff&secondarycolor=0a0b0d&iconcolor=ffffff&skipintro=true&upnext=false&autonext=false";
  function brand(host) { return function (ty, id, s, e) { return "https://" + host + (ty === "tv" ? "/embed/tv/" + id + "/" + s + "/" + e : "/embed/movie/" + id) + "?" + LOOK; }; }
  function path(base, q, pre) { return function (ty, id, s, e) { return base + (pre || "") + (ty === "tv" ? "tv/" + id + "/" + s + "/" + e : "movie/" + id) + (q || ""); }; }
  // ad: 0 = no ads, "lock" = runs in a locked frame (pop-ups and redirects can't fire), 1 = shows ads (can't be locked: they refuse to play)
  var SB = "allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock";
  var SERVERS = [
    { k: "vidqueen", n: "VidQueen", d: "No ads · best", ad: 0, u: brand("player.vidqueen.st") },
    { k: "vidgold", n: "VidGold", d: "No ads", ad: 0, u: brand("player.vidgold.net") },
    { k: "cinezo", n: "Cinezo", d: "Locked · no pop-ups", ad: "lock", u: path("https://player.cinezo.live/", "", "embed/") },
    { k: "vidrift", n: "VidRift", d: "Locked · subtitles", ad: "lock", u: path("https://embed.vidrift.net/", "?hide=next,episodes", "embed/") },
    { k: "vidora", n: "Vidora", d: "Locked · no pop-ups", ad: "lock", u: path("https://vidora.ac/", "?autoplay=true") },
    { k: "vidmario", n: "VidMario", d: "May show ads", ad: 1, u: brand("player.vidmario.net") },
    { k: "vidlink", n: "VidLink", d: "Ads", ad: 1, u: path("https://vidlink.pro/", "?autoplay=true") },
    { k: "vidup", n: "Vidup", d: "Ads", ad: 1, u: path("https://vidup.to/", "?autoPlay=true") },
    { k: "vsembed", n: "VsEmbed", d: "Ads · tap play", ad: 1, quiet: 1, u: path("https://vsembed.ru/", "", "embed/") },
    { k: "vidbolt", n: "VidBolt", d: "Ads · tap play", ad: 1, quiet: 1, u: path("https://vidbolt.pro/", "?autoPlay=true&nextEpisodeButton=false&episodesButton=false") }
  ];
  var NOADS = ld("noads", true);   // keep servers with ads out of the way (default)
  function adsOk() { return !NOADS || (P && P.allowAds); }
  function order(all) { var fav = ld("srv", ""), rank = function (x) { return x.ad === 0 ? 0 : x.ad === "lock" ? 1 : x.quiet ? 3 : 2; };
    var l = SERVERS.filter(function (x) { return all || x.ad !== 1 || adsOk(); }).sort(function (a, b) { return rank(a) - rank(b) || SERVERS.indexOf(a) - SERVERS.indexOf(b); }); var i = l.findIndex(function (x) { return x.k === fav; }); if (i > 0) l.unshift(l.splice(i, 1)[0]); return l; }

  // ---------- titles ----------
  var BYIMDB = null;
  function index() { if (BYIMDB) return BYIMDB; BYIMDB = {}; (S.ALL || []).forEach(function (t) { if (t.imdb_id) BYIMDB[t.imdb_id] = t; }); return BYIMDB; }
  function yr(m) { var y = /\d{4}/.exec(m.releaseInfo || m.year || ""); return y ? +y[0] : 0; }
  function T(m) {   // a Cinemeta item → Vesper title (the catalog's own one when it's on your apps)
    var imdb = m.imdb_id || m.id; if (!/^tt\d+$/.test(imdb)) return null;
    var id = "fs:" + imdb; if (S.T[id]) return S.T[id];
    var type = m.type === "series" ? "SHOW" : "MOVIE", y = yr(m), cat = index()[imdb];
    if (!cat) { var k = norm(m.name); cat = (S.ALL || []).filter(function (x) { return x.type === type && norm(x.title) === k && x.year && y && Math.abs(x.year - y) <= 1; })[0]; }
    if (cat) { cat.fs = { imdb: imdb }; if (!cat.imdb_id) cat.imdb_id = imdb; S.T[id] = cat; return cat; }
    var t = { id: id, title: m.name, type: type, year: y, genres: [], avail: [], desc: m.description || "", imdb_id: imdb, fs: { imdb: imdb },
      poster: m.poster && /^https:/.test(m.poster) && !/metahub/.test(m.poster) ? m.poster : MH + "/poster/medium/" + imdb + "/img", backdrop: m.background || MH + "/background/medium/" + imdb + "/img",
      imdb: +m.imdbRating || 0, cast: m.cast || [], dirs: m.director || [], fsg: m.genres || m.genre || [] };
    S.T[id] = t; return t;
  }
  function can(t) { return !!t && (t.type === "MOVIE" || t.type === "SHOW"); }

  function get(u, ms) {
    var c = new AbortController(), tm = setTimeout(function () { c.abort(); }, ms || 9000);
    return fetch(u, { signal: c.signal }).then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  // IMDb id → Cinemeta meta (TMDB id, episodes, description). Title-only titles are looked up by name + year first.
  var META = {};
  function imdbOf(t) {
    if (t.imdb_id) return Promise.resolve(t.imdb_id);
    var full = t._lite && S.full ? new Promise(function (ok) { S.full(t, function () { ok(); }); }) : Promise.resolve();
    return full.then(function () {
      if (t.imdb_id) return t.imdb_id;
      return get(CM + "/catalog/" + (t.type === "SHOW" ? "series" : "movie") + "/top/search=" + encodeURIComponent(t.title) + ".json").then(function (j) {
        var k = norm(t.title), hit = (j.metas || []).filter(function (m) { return norm(m.name) === k && (!t.year || !yr(m) || Math.abs(yr(m) - t.year) <= 1); })[0];
        if (!hit) throw new Error("not found"); t.imdb_id = hit.id; return hit.id;
      });
    });
  }
  function meta(t) {
    return imdbOf(t).then(function (imdb) {
      var key = (t.type === "SHOW" ? "series/" : "movie/") + imdb;
      if (!META[key]) META[key] = get(CM + "/meta/" + key + ".json").then(function (j) { return j.meta || {}; }).catch(function () { delete META[key]; return {}; });
      return META[key].then(function (m) {
        var tmdb = m.moviedb_id || IDS[imdb];
        var done = function (id) { if (id) { IDS[imdb] = id; sv("ids", IDS); } return { imdb: imdb, tmdb: id || null, m: m }; };
        if (tmdb) return done(tmdb);
        // Cinemeta doesn't know the TMDB id → Wikidata does for most titles
        var q = 'SELECT ?a ?b WHERE { ?i wdt:P345 "' + imdb + '". OPTIONAL{?i wdt:P4947 ?a} OPTIONAL{?i wdt:P4983 ?b} } LIMIT 1';
        return get("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q), 12000).then(function (j) {
          var b = (j.results.bindings || [])[0] || {}; return done(+((b.b && b.b.value) || (b.a && b.a.value)) || null);
        }).catch(function () { return done(null); });
      });
    });
  }
  function episodes(m) {   // Cinemeta episode list → [{n, eps:[{s,e,title}]}]
    var by = {};
    (m.videos || []).forEach(function (v) { if (!v.season || v.season < 1 || !v.number) return; (by[v.season] = by[v.season] || []).push({ s: v.season, e: v.number, title: v.name || v.title || "Episode " + v.number, date: v.released || v.firstAired }); });
    return Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return { n: n, eps: by[n].sort(function (a, b) { return a.e - b.e; }) }; });
  }

  // ---------- the player ----------
  var css = document.createElement("style");
  css.textContent =
    ".fsp{position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .2s}" +
    ".fsp.on{opacity:1;pointer-events:auto}" +
    ".fsbar{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top) + 8px) 12px 8px;color:#fff;min-height:44px}" +
    ".fsbar button{background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:99px;height:36px;min-width:36px;padding:0 12px;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}" +
    ".fsbar [data-fsdock]{display:none}.fsbar .fsx{font-size:22px;line-height:1;padding:0;width:36px}" +
    ".fst{flex:1;min-width:0}.fst b{display:block;font:700 16px -apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".fst small{display:block;color:rgba(255,255,255,.6);font:500 12.5px -apple-system,system-ui,sans-serif;margin-top:1px}" +
    ".fsv{position:relative;width:100%;aspect-ratio:16/9;background:#050508;flex:none}" +
    ".fsv iframe{position:absolute;inset:0;width:100%;height:100%;border:0}" +
    ".fsmsg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:rgba(255,255,255,.75);font:500 14px -apple-system,system-ui,sans-serif;pointer-events:none}" +
    ".fsdock{flex:1;overflow-y:auto;padding:14px 12px calc(env(safe-area-inset-bottom) + 18px);color:#fff;font-family:-apple-system,system-ui,sans-serif}" +
    ".fsh{font:700 13px -apple-system,system-ui,sans-serif;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.06em;margin:4px 2px 9px}" +
    ".fsrv{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px;margin-bottom:18px}" +
    ".fsrv button{background:rgba(255,255,255,.07);border:1.5px solid transparent;border-radius:12px;color:#fff;text-align:left;padding:10px 12px;cursor:pointer;font:inherit}" +
    ".fsrv button b{display:block;font-size:14.5px}.fsrv button small{color:rgba(255,255,255,.55);font-size:12px}" +
    ".fsrv button.on{border-color:#fff;background:rgba(255,255,255,.14)}" +
    ".fsep{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap}" +
    ".fsep select{flex:1;min-width:120px;height:40px;border-radius:10px;background:rgba(255,255,255,.08);color:#fff;border:0;padding:0 10px;font:600 14px -apple-system,system-ui,sans-serif}" +
    ".fsep button{height:40px;border-radius:10px;border:0;background:rgba(255,255,255,.12);color:#fff;padding:0 14px;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}" +
    ".fsauto{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;display:flex;align-items:center;gap:10px;background:rgba(10,10,14,.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:12px;padding:9px 10px 9px 14px;color:#fff;font:500 13.5px -apple-system,system-ui,sans-serif}" +
    ".fsauto span{flex:1}.fsauto button{border:0;border-radius:99px;background:#fff;color:#000;font:600 13px -apple-system,system-ui,sans-serif;padding:7px 13px;cursor:pointer}.fsauto button.g{background:rgba(255,255,255,.16);color:#fff}" +
    ".fsrv button.bad{opacity:.45}.fsrv button.ok small{color:#7be0a8}" +
    ".fsok{color:#7be0a8;font-size:12px}.fslk{font-size:11px}.fsadh{display:flex;align-items:center;gap:10px}.fsadsw{border:0;border-radius:99px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.7);font:700 11px -apple-system,system-ui,sans-serif;padding:4px 10px;text-transform:none;letter-spacing:0;cursor:pointer}.fsadsw.on{background:#f3a46b;color:#1a0d05}" +
    ".fsrvad button{opacity:.72}.fsrvad button.on{opacity:1}" +
    ".gpi{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#ff4f7a,#ff9a5a);color:#fff;font:900 9.5px -apple-system,system-ui,sans-serif;margin-right:8px;flex:none}" +
    ".btn.gp{display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;background:rgba(255,255,255,.1)}" +
    ".fsgp{display:flex;align-items:center;justify-content:center;width:100%;height:42px;border-radius:12px;background:rgba(255,255,255,.07);color:#fff;text-decoration:none;font:600 14px -apple-system,system-ui,sans-serif;margin-bottom:8px}" +
    ".fsnote{color:rgba(255,255,255,.45);font-size:12.5px;line-height:1.45;margin:6px 2px}" +
    ".btn.free{background:rgba(255,255,255,.14);color:#fff}.btn.play.big.free{background:#fff;color:#000}" +
    ".pc .fsbar0{position:absolute;left:6px;right:6px;bottom:5px;height:3px;border-radius:2px;background:rgba(255,255,255,.28);z-index:3;overflow:hidden}.pc .fsbar0 i{display:block;height:100%;background:#e50914}" +
    ".pc .fsse{position:absolute;right:6px;top:6px;font:800 9.5px -apple-system,system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.66);padding:2px 5px;border-radius:4px;z-index:3}" +
    ".srcs{margin:4px 0 22px;border-radius:16px;background:rgba(255,255,255,.045);padding:14px 14px 6px}.srch{font:700 12px -apple-system,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px}" +
    ".src{display:flex;gap:12px;align-items:center;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;padding:0 0 12px;cursor:pointer}.src.own{cursor:default}" +
    ".sic{flex:none;width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font:900 15px -apple-system,system-ui,sans-serif}" +
    ".sic.logos{display:grid;grid-template-columns:repeat(3,13px);gap:2.5px;align-content:center;justify-content:center;background:rgba(255,255,255,.08)}.sic.logos img{width:13px;height:13px;border-radius:3px}" +
    ".sic.sbx{background:#f3a46b;color:#1a0d05}.sic.fsx{background:#3fcf8e;color:#04140b}" +
    ".stx{min-width:0}.stx b{display:flex;align-items:center;gap:8px;font-size:15px}.stx b em{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#7be0a8}" +
    ".stx b i{font-style:normal;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.6)}.stx b i.on{background:#3fcf8e;color:#04140b}" +
    ".stx small{display:block;color:rgba(255,255,255,.55);font-size:12.5px;line-height:1.35;margin-top:2px}" +
    ".sbres:not(.fsres)>.row-h::before,.fsres>.row-h::before{content:'SB';display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;margin-right:8px;vertical-align:-3px;font:900 8.5px -apple-system,system-ui,sans-serif;background:#f3a46b;color:#1a0d05}" +
    ".fsres>.row-h::before{content:'▶';font-size:9px;background:#3fcf8e;color:#04140b}" +
    ".sbl.fsl{background:rgba(80,200,140,.92);color:#04140b}" +
    "html.desk .fsp{flex-direction:row;flex-wrap:wrap;align-content:flex-start}html.desk .fsbar{width:100%}" +
    "html.desk .fsv{width:auto;flex:1 1 640px;aspect-ratio:auto;height:calc(100vh - 62px)}html.desk .fsdock{flex:0 0 320px;height:calc(100vh - 62px)}" +
    "@media (orientation:landscape) and (max-height:520px){.fsp{flex-direction:row;flex-wrap:wrap}.fsbar{position:absolute;top:0;left:0;right:0;z-index:2;background:linear-gradient(#000c,#0000);transition:opacity .3s}" +
    ".fsbar [data-fsdock]{display:block}.fsp.quiet .fsbar{opacity:0;pointer-events:none}.fsv{width:100%;height:100%;aspect-ratio:auto}.fsdock{display:none}.fsp.dock .fsdock{display:block;position:absolute;right:0;top:0;bottom:0;width:300px;background:#0b0b10f2;z-index:3;padding-top:calc(env(safe-area-inset-top) + 56px)}}";
  document.head.appendChild(css);

  var el = null, P = null, quietT = null;
  function build() {
    if (el) return el;
    el = document.createElement("div"); el.className = "fsp"; el.id = "fsp";
    el.innerHTML = '<div class="fsbar"><button class="fsx" data-fsx aria-label="Close">‹</button><div class="fst"><b></b><small></small></div><button data-fsdock>Servers</button></div>' +
      '<div class="fsv"><div class="fsmsg"></div></div><div class="fsdock"></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-fsx")) return close();
      if (b.hasAttribute("data-fsdock")) { el.classList.toggle("dock"); return; }
      if (b.dataset.srv) { P.srv = b.dataset.srv; P.auto = 0; return load(); }
      if (b.hasAttribute("data-fsnexts")) { if (W && W.k === P.srv) { W.done = 0; return fail("user"); } var l = order(), j = l.findIndex(function (x) { return x.k === P.srv; }); P.srv = l[(j + 1) % l.length].k; return load(); }
      if (b.hasAttribute("data-fsstay")) return settle(false);
      if (b.hasAttribute("data-fsgo")) return fail("user");
      if (b.hasAttribute("data-fsads")) { P.allowAds = 1; var na = order().filter(function (x) { return !P.bad[x.k]; })[0]; if (na) { P.srv = na.k; P.auto = 1; load(); } return; }
      if (b.hasAttribute("data-fsadsw")) { NOADS = !NOADS; sv("noads", NOADS); return dock(); }
      if (b.hasAttribute("data-fsretry")) { P.bad = {}; P.auto = 1; P.srv = order()[0].k; return load(); }
      if (b.hasAttribute("data-fsprev")) return step(-1);
      if (b.hasAttribute("data-fsnext")) return step(1);
    });
    el.addEventListener("change", function (e) {
      if (e.target.matches("[data-fss]")) { var s = +e.target.value, ss = P.ss.filter(function (x) { return x.n === s; })[0]; P.s = s; P.e = ss ? ss.eps[0].e : 1; load(); }
      if (e.target.matches("[data-fse]")) { P.e = +e.target.value; P.bad = {}; P.auto = 1; load(); }
    });
    // landscape phone: tap shows the bar for a few seconds
    el.addEventListener("touchstart", function () { el.classList.remove("quiet"); clearTimeout(quietT); quietT = setTimeout(function () { if (!el.classList.contains("dock")) el.classList.add("quiet"); }, 3500); }, { passive: true });
    return el;
  }
  function step(d) {
    var flat = []; (P.ss || []).forEach(function (s) { s.eps.forEach(function (x) { flat.push(x); }); });
    var i = flat.findIndex(function (x) { return x.s === P.s && x.e === P.e; }), n = flat[i + d]; if (!n) return;
    P.s = n.s; P.e = n.e; P.bad = {}; P.auto = 1; if (P.okk) P.srv = P.okk; P.okk = null; load();
  }
  function dock() {
    var d = el.querySelector(".fsdock"), html = "";
    if (P.t.type === "SHOW" && P.ss && P.ss.length) {
      var cur = P.ss.filter(function (x) { return x.n === P.s; })[0] || P.ss[0];
      html += '<div class="fsh">Episode</div><div class="fsep"><select data-fss>' + P.ss.map(function (s) { return '<option value="' + s.n + '"' + (s.n === P.s ? " selected" : "") + ">Season " + s.n + "</option>"; }).join("") + "</select>" +
        '<select data-fse>' + cur.eps.map(function (x) { return '<option value="' + x.e + '"' + (x.e === P.e ? " selected" : "") + ">" + x.e + ". " + esc(x.title) + "</option>"; }).join("") + "</select>" +
        '<button data-fsprev>‹ Prev</button><button data-fsnext>Next ›</button></div>';
    }
    function cell(x) { return '<button data-srv="' + x.k + '"' + (x.k === P.srv ? ' class="on"' : "") + "><b>" + x.n + (x.ad === 0 ? ' <span class="fsok">✓</span>' : x.ad === "lock" ? ' <span class="fslk">🔒</span>' : "") + "</b><small>" + x.d + "</small></button>"; }
    var all = order(true), clean = all.filter(function (x) { return x.ad !== 1; }), ads = all.filter(function (x) { return x.ad === 1; });
    html += '<div class="fsh">Ad-free servers</div><div class="fsrv">' + clean.map(cell).join("") + "</div>" +
      '<div class="fsh fsadh">Servers with ads <button class="fsadsw' + (NOADS ? "" : " on") + '" data-fsadsw>' + (NOADS ? "Skipped" : "Used too") + "</button></div>" +
      (NOADS && !(P && P.allowAds) ? '<p class="fsnote" style="margin-top:-2px">Vesper only tries these when no ad-free server has the title. You can still tap one.</p>' : "") +
      '<div class="fsrv fsrvad">' + ads.map(cell).join("") + "</div>" +
      '<a class="fsgp" href="' + esc(gpUrl(P.t)) + '" target="_blank" rel="noopener"><span class="gpi">GP</span>Search “' + esc(P.t.title) + '” on GoPlay ↗</a>' +
      '<button class="fsnx" data-fsnexts style="width:100%;height:42px;border-radius:12px;border:0;background:rgba(255,255,255,.12);color:#fff;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer">Not playing? Try the next server</button>' +
      '<p class="fsnote">Free players from other sites. If one shows nothing, Vesper moves to the next by itself — tap the picture or Stay to keep one. 🔒 servers run locked, so their pop-up and redirect ads can’t open. Ads drawn inside a player’s own picture can’t be removed from outside it.</p>';
    d.innerHTML = html; mark();
  }
  function load() {
    var sv0 = SERVERS.filter(function (x) { return x.k === P.srv; })[0] || SERVERS[0], box = el.querySelector(".fsv"), msg = box.querySelector(".fsmsg");
    var old = box.querySelector("iframe"); if (old) old.remove();
    var tv = P.t.type === "SHOW";
    el.querySelector(".fst small").textContent = (tv ? "S" + P.s + " · E" + P.e + " · " : "") + sv0.n;
    dock();
    if (!P.tmdb) { msg.textContent = P.err || "Finding this title…"; return; }
    msg.textContent = "Loading " + sv0.n + "…";
    var f = document.createElement("iframe");
    f.setAttribute("allow", "autoplay; fullscreen; encrypted-media; picture-in-picture");
    f.setAttribute("allowfullscreen", ""); f.setAttribute("referrerpolicy", "origin");
    if (sv0.ad === "lock") f.setAttribute("sandbox", SB);   // pop-up and redirect ads can't fire from in here
    f.src = sv0.u(tv ? "tv" : "movie", P.tmdb, P.s, P.e);
    f.onload = function () { msg.textContent = ""; };
    box.appendChild(f);
    if (tv) { EPL[P.imdb] = { s: P.s, e: P.e, at: Date.now() }; var ks = Object.keys(EPL); if (ks.length > 300) delete EPL[ks[0]]; sv("ep", EPL); }
    watch(sv0, f);
    if (P.resume) { var rs = P.resume; P.resume = 0; setTimeout(function () { if (!W || W.tick) return; banner("<span>Last time you stopped at <b>" + clock(rs) + "</b> — skip there in the player.</span>"); setTimeout(function () { var b = el && el.querySelector(".fsauto"); if (b && /stopped at/.test(b.textContent)) banner(null); }, 9000); }, 1500); }
  }
  // ---------- Continue watching: where you stopped, per title (from the players' own time reports) ----------
  var CW = ld("cw", {}), cwT = 0;
  function prog(cur, dur) {
    if (!P || !P.imdb) return; var t = P.t, now = Date.now(); if (now - cwT < 5000) return; cwT = now;
    var left = dur - cur, done = cur / dur > 0.93 || left < 240;
    if (done && t.type !== "SHOW") { delete CW[P.imdb]; sv("cw", CW); return; }
    CW[P.imdb] = { id: t.id, imdb: P.imdb, name: t.title, type: t.type === "SHOW" ? "series" : "movie", y: t.year || 0, poster: /^https:/.test(t.poster || "") ? t.poster : null,
      s: P.s, e: P.e, c: Math.round(cur), d: Math.round(dur), at: now, fin: done ? 1 : 0 };
    var ks = Object.keys(CW).sort(function (a, b) { return CW[b].at - CW[a].at; }); ks.slice(40).forEach(function (k) { delete CW[k]; }); sv("cw", CW);
  }
  function cwTitle(x) { return S.T[x.id] || T({ id: x.imdb, name: x.name, type: x.type, releaseInfo: String(x.y || ""), poster: x.poster }); }
  function cwList() { return Object.keys(CW).map(function (k) { return CW[k]; }).sort(function (a, b) { return b.at - a.at; }).map(function (x) { var t = cwTitle(x); if (t) t._cw = x; return t; }).filter(Boolean); }
  function clock(s) { s = Math.round(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
  // progress bar on a card (m.js poster() asks)
  function bar(t) { var x = t && t.imdb_id && CW[t.imdb_id]; if (!x || !x.d) return "";
    return '<div class="fsbar0"><i style="width:' + Math.max(4, Math.min(100, x.c / x.d * 100)).toFixed(0) + '%"></i></div>' + (x.type === "series" ? '<div class="fsse">S' + x.s + " · E" + x.e + "</div>" : ""); }
  // ---------- autopilot: no picture from a server → move on to the next one until something plays ----------
  // Most players tell the page what they're doing (postMessage PLAYER_EVENT with currentTime/duration); a few say nothing.
  var W = null, autoT = null, tickT = null;
  function banner(html) { var box = el.querySelector(".fsv"), b = box.querySelector(".fsauto"); if (!html) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.className = "fsauto"; box.appendChild(b); } b.innerHTML = html; }
  function settle(ok) {   // this server works (ok) — stop the autopilot
    clearTimeout(autoT); clearInterval(tickT); banner(null); if (!W) return; W.done = 1;
    if (ok && P) { P.okk = W.k; sv("srv", W.k); var sub = el.querySelector(".fst small"); if (sub && !/found/.test(sub.textContent)) sub.textContent += " · found"; mark(); }
  }
  function mark() { [].forEach.call(el.querySelectorAll(".fsrv [data-srv]"), function (b) { b.classList.toggle("bad", !!(P.bad && P.bad[b.dataset.srv])); b.classList.toggle("ok", P.okk === b.dataset.srv); }); }
  function fail(why) {
    if (!W || W.done || !P) return; W.done = 1; clearTimeout(autoT); clearInterval(tickT);
    P.bad = P.bad || {}; P.bad[W.k] = 1;
    var l = order(), nx = l.filter(function (x) { return !P.bad[x.k]; })[0];
    if (!nx && !adsOk()) { banner('<span>The ad-free servers don’t have this one.</span><button data-fsads>Try ones with ads</button>'); return; }
    if (!nx) { banner('<span>None of the servers had this one. Try them again in a bit.</span><button class="g" data-fsretry>Retry</button>'); return; }
    var from = (SERVERS.filter(function (x) { return x.k === W.k; })[0] || {}).n;
    P.srv = nx.k; P.auto = 1; load();
    banner("<span>" + esc(from) + " had nothing — trying " + esc(nx.n) + "…</span>"); setTimeout(function () { if (W && !W.done && W.k === nx.k && !W.tick) banner(null); }, 3500);
  }
  function watch(sv0, frame) {
    clearTimeout(autoT); clearInterval(tickT); banner(null);
    W = { k: sv0.k, f: frame, done: 0, t0: Date.now() };
    if (!P.auto && P.srv === P.okk) { W.done = 1; return; }
    if (sv0.quiet) {   // these never tell us anything: stop here and let you press play
      W.done = 1; if (P.auto) banner('<span>' + esc(sv0.n) + ' — tap play in the picture.</span><button class="g" data-fsnexts>Next server</button>'); return; }
    var wait = sv0.k === "vidqueen" || sv0.k === "vidgold" || sv0.k === "vidmario" ? 20000 : 12000, my = W;
    autoT = setTimeout(function () { if (W !== my || my.done) return;
      var left = 6; my.tick = 1;
      function draw() { banner('<span>No picture from ' + esc(sv0.n) + " yet — next server in " + left + "s</span><button data-fsstay>Stay</button><button class=\"g\" data-fsgo>Next</button>"); }
      draw(); tickT = setInterval(function () { if (W !== my || my.done) return clearInterval(tickT); if (--left <= 0) { clearInterval(tickT); fail("timeout"); } else draw(); }, 1000);
    }, wait);
  }
  window.addEventListener("message", function (e) {
    if (!W || !P || !W.f || e.source !== W.f.contentWindow) return;
    var d = e.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (x) { return; } } if (!d || typeof d !== "object") return;
    var ev = d.type === "PLAYER_EVENT" && d.data ? d.data : null;
    if (ev) {
      if (ev.event === "play" || ev.event === "playing" || +ev.duration > 0 || +ev.currentTime > 0.3) { if (!W.done) settle(true); }
      if (+ev.currentTime > 0 && +ev.duration > 0) prog(+ev.currentTime, +ev.duration);
      if (ev.event === "ended" && P.t.type === "SHOW" && W.done) { step(1); }
      return;
    }
    if (d.event === "status" && +d.data >= 400) return fail("status");
    if (/^vidrift:(unpaused|playing|time)/.test(d.type || "")) return settle(true);
  });
  // a tap inside the player (the page loses focus to the frame) = you're using it: no more switching
  window.addEventListener("blur", function () { setTimeout(function () { if (W && !W.done && document.activeElement === W.f) settle(false); }, 0); });
  // an ad that tries to send the whole page elsewhere gets a "Leave site?" question instead (laptop browsers)
  function onLeave(e) { e.preventDefault(); e.returnValue = ""; return ""; }
  function guard(on) { if (on) window.addEventListener("beforeunload", onLeave); else window.removeEventListener("beforeunload", onLeave); }
  function play(t, ep) {
    if (!can(t)) return;
    build(); if (S.markViewed) try { S.markViewed(t.id); } catch (e) {}
    P = { t: t, auto: 1, bad: {}, srv: order()[0].k, s: ep && ep.s || 1, e: ep && (ep.e || ep.n) || 1, tmdb: null, ss: null, explicit: !!ep };
    el.querySelector(".fst b").textContent = t.title + (t.year ? " (" + t.year + ")" : "");
    el.classList.remove("dock", "quiet"); el.classList.add("on"); guard(true);
    history.pushState({ fsp: 1, d: history.state && history.state.d }, "");
    load();
    var my = P;
    meta(t).then(function (r) {
      if (P !== my) return;
      P.imdb = r.imdb; P.tmdb = r.tmdb; if (!r.tmdb) P.err = "None of the free servers know this title yet.";
      if (t.type === "SHOW") { P.ss = episodes(r.m);
        var last = EPL[r.imdb]; if (!P.explicit && last) { P.s = last.s; P.e = last.e; } }
      var cw = CW[r.imdb]; if (cw && cw.c > 60 && !cw.fin && (t.type !== "SHOW" || (cw.s === P.s && cw.e === P.e))) P.resume = cw.c;
      if (t.fs && !t.desc && r.m.description) t.desc = r.m.description;
      load();
    }).catch(function () { if (P !== my) return; P.err = "Couldn't find this title on the free servers."; load(); });
  }
  function close(fromPop) {
    if (!el || !el.classList.contains("on")) return false;
    el.classList.remove("on", "dock"); guard(false); clearTimeout(autoT); clearInterval(tickT); W = null; var f = el.querySelector("iframe"); if (f) f.remove(); P = null;
    if (!fromPop && history.state && history.state.fsp) history.back();
    return true;
  }

  // ---------- GoPlay: opens GoPlay's own search for the exact title (its pages can't be looked up from a phone) ----------
  var ASIA = { KR: 1, JP: 1, CN: 1, TW: 1, HK: 1, TH: 1, PH: 1, VN: 1, ID: 1, MY: 1, SG: 1 };
  function gpUrl(t) { return "https://goplay.su/?search=" + encodeURIComponent(String(t.title || "").replace(/\s*\(.*?\)\s*/g, " ").trim()); }
  function gpFits(t) { return !!t && (t.countries || []).some(function (c) { return ASIA[c]; }); }
  function gpBtn(t) { return '<a class="btn wide gp" href="' + esc(gpUrl(t)) + '" target="_blank" rel="noopener"><span class="gpi">GP</span>Open on GoPlay</a>'; }
  // ---------- title page / hover button ----------
  function btn(t, big) {
    if (!can(t)) return "";
    return '<button class="btn ' + (big ? "play big free" : "wide free") + '" data-free="' + esc(t.id) + '"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Watch free</button>' + (gpFits(t) ? gpBtn(t) : "");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-free]"); if (!b) return;
    e.stopPropagation(); e.preventDefault(); play(S.T[b.dataset.free]);
  }, true);

  // ---------- Search: "Free servers" switch + "On free servers" row ----------
  var tok = 0, SQ = {};
  function search(q, cb) {
    var qn = norm(q); if (SQ[qn]) return cb(SQ[qn]);
    Promise.all(["movie", "series"].map(function (ty) { return get(CM + "/catalog/" + ty + "/top/search=" + encodeURIComponent(q) + ".json").then(function (j) { return j.metas || []; }).catch(function () { return []; }); }))
      .then(function (r) {
        var all = r[0].map(function (m) { m.type = "movie"; return m; }).concat(r[1].map(function (m) { m.type = "series"; return m; }));
        function score(m, i) { var k = norm(m.name); return (k === qn ? 100 : k.indexOf(qn) === 0 ? 50 : (" " + k).indexOf(" " + qn) >= 0 ? 25 : 0) - (i % 100) * 0.3; }
        var withI = all.map(function (m, i) { return { m: m, s: score(m, m.type === "movie" ? i : i - r[0].length) }; });
        withI.sort(function (a, b) { return b.s - a.s; });
        SQ[qn] = withI.map(function (x) { return x.m; }); cb(SQ[qn]);
      });
  }
  function searchInto(body, q, R, rowEl, opt) {
    if (!ON || !q || q.length < 2) return;
    var my = ++tok, TY = (opt && opt.type) || null;
    var box = document.createElement("div"); box.className = "sbres fsres"; box.innerHTML = '<div class="row-h">On free servers<small>looking…</small></div><div class="sbph"></div>';
    body.insertBefore(box, body.querySelector(".ownend") || body.firstChild);
    setTimeout(function () {
      if (my !== tok) return;
      search(q, function (list) {
        if (my !== tok || !box.isConnected) return;
        var items = list.map(T).filter(function (t) { return t && (!TY || t.type === TY); }).filter(function (t, i, a) { return a.indexOf(t) === i; }).slice(0, 30);
        if (!items.length) { box.querySelector("small").textContent = "nothing for “" + q + "”"; var ph = box.querySelector(".sbph"); if (ph) ph.remove(); return; }
        var row = rowEl(S.R("On free servers", items, null, items.length + " · tap Watch free", 1, true)); row.classList.add("sbres", "fsres");
        box.replaceWith(row); if (row._fill) row._fill();
      });
    }, 280);
  }
  function toggle(onChange) {
    var b = document.createElement("button");
    function paint() { b.className = "sbtog fstog" + (ON ? " on" : ""); b.innerHTML = "<i></i>Free servers " + (ON ? "on" : "off"); }
    paint(); b.addEventListener("click", function () { ON = !ON; sv("on", ON); paint(); if (onChange) onChange(); });
    return b;
  }

  // ---------- free rows: trending + new + genre picks from Cinemeta, a different mix every visit, spread through the page ----------
  var Y = new Date().getFullYear(), LAUNCH = (+ld("launch", 0) || 0) + 1; sv("launch", LAUNCH);
  var MG = ["Action", "Comedy", "Thriller", "Horror", "Romance", "Sci-Fi", "Animation", "Drama", "Crime", "Mystery", "Fantasy", "Adventure", "Family", "Documentary"];
  var SG = ["Drama", "Comedy", "Crime", "Sci-Fi", "Animation", "Thriller", "Fantasy", "Mystery", "Reality-TV", "Documentary", "Action"];
  var GW = { "Sci-Fi": "sci-fi", "Reality-TV": "reality", Documentary: "documentary", Animation: "animated" };
  function gw(g) { return GW[g] || g.toLowerCase(); }
  function seeded(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function hash(str) { var h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); }
  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function core(id) {
    if (id === "home") return [{ t: "Trending now", k: ["movie/top", "series/top"] }, { t: "New this year", k: ["movie/year/genre=" + Y, "series/year/genre=" + Y], fresh: 1 }];
    if (id === "movies") return [{ t: "Trending films", k: ["movie/top"] }, { t: "New films of " + Y, k: ["movie/year/genre=" + Y], fresh: 1 }];
    if (id === "shows") return [{ t: "Trending series", k: ["series/top"] }, { t: "New series of " + Y, k: ["series/year/genre=" + Y], fresh: 1 }];
    if (id === "anime") return [{ t: "Trending anime & animation", k: ["series/top/genre=Animation", "movie/top/genre=Animation"] }];
    return [];
  }
  function extra(id) {
    var r = [], mv = id === "home" || id === "movies", se = id === "home" || id === "shows";
    if (mv) { r.push({ t: "Fresh from " + (Y - 1), k: ["movie/year/genre=" + (Y - 1)] }, { t: "All-time great films", k: ["movie/imdbRating"] });
      MG.forEach(function (g) { r.push({ t: "Trending " + gw(g) + " films", k: ["movie/top/genre=" + g] }); }); }
    if (se) { r.push({ t: "Series from " + (Y - 1), k: ["series/year/genre=" + (Y - 1)] }, { t: "All-time great series", k: ["series/imdbRating"] });
      SG.forEach(function (g) { r.push({ t: "Trending " + gw(g) + " series", k: ["series/top/genre=" + g] }); }); }
    return r;
  }
  var NX = { home: 4, movies: 3, shows: 3, anime: 0 };
  function picks(id, launch) { return core(id).concat(shuffle(extra(id), seeded(launch * 977 + hash(id))).slice(0, NX[id] || 0)); }
  var LISTS = { home: 1, movies: 1, shows: 1, anime: 1 };
  var busy = {};
  function list(key) {
    var c = CAT[key];
    if ((!c || Date.now() - c.at > 12 * 3600000) && !busy[key]) { busy[key] = 1;
      get(CM + "/catalog/" + key + ".json", 12000).then(function (j) {
        CAT[key] = { at: Date.now(), m: (j.metas || []).slice(0, 40).map(function (m) { return { id: m.id, name: m.name, type: m.type, releaseInfo: m.releaseInfo, imdbRating: m.imdbRating, description: (m.description || "").slice(0, 300), background: m.background }; }) };
        var ks = Object.keys(CAT).filter(function (k) { return !/^air/.test(k); }).sort(function (x, y) { return CAT[x].at - CAT[y].at; }); ks.slice(0, Math.max(0, ks.length - 30)).forEach(function (k) { delete CAT[k]; });
        sv("cat", CAT); busy[key] = 0;
      }).catch(function () { busy[key] = 0; }); }
    return c ? c.m : [];
  }
  // blend the row's lists, lean to newer titles on "fresh" rows, then shake the order a little so every visit looks different
  function build(rc, seen, hid, rnd) {
    var ls = rc.k.map(list), out = [], n = Math.max.apply(null, ls.map(function (l) { return l.length; }).concat([0]));
    for (var i = 0; i < n; i++) ls.forEach(function (l) { if (l[i]) out.push(l[i]); });
    var items = out.map(function (m, i) { var y = yr(m); return { m: m, s: i - (rc.fresh ? 0 : (y >= Y - 1 ? 6 : y >= Y - 3 ? 3 : 0)) + rnd() * 7 }; })
      .sort(function (x, y) { return x.s - y.s; }).map(function (x) { return T(x.m); })
      .filter(function (t) { if (!t || hid[t.id] || seen[t.id]) return false; seen[t.id] = 1; return true; });
    return items;
  }
  // Airing today (series): TVmaze's schedule — streaming + US/UK/Korea/India TV — matched to IMDb ids so they play free
  // Airing today (series): TVmaze's schedule — streaming + US/UK/Korea/India TV — matched to IMDb ids so they play free
  function airing() {
    var key = "air" + new Date().toISOString().slice(0, 10), c = CAT[key];
    if (!c && !busy[key]) { busy[key] = 1; var day = new Date().toISOString().slice(0, 10);
      Promise.all(["https://api.tvmaze.com/schedule/web?date=" + day].concat(["US", "GB", "KR", "IN"].map(function (cc) { return "https://api.tvmaze.com/schedule?country=" + cc + "&date=" + day; }))
        .map(function (u) { return get(u, 12000).catch(function () { return []; }); })).then(function (ls) {
        var seen = {}, out = [];
        [].concat.apply([], ls).forEach(function (ep) { var sh = ep.show || (ep._embedded && ep._embedded.show); if (!sh || !sh.externals || !sh.externals.imdb || seen[sh.id]) return;
          if (/News|Talk Show|Sports|Game Show/.test(sh.type || "")) return; seen[sh.id] = 1;
          out.push({ id: sh.externals.imdb, name: sh.name, type: "series", releaseInfo: (sh.premiered || "").slice(0, 4), poster: sh.image ? sh.image.original || sh.image.medium : null, w: sh.weight || 0, description: (sh.summary || "").replace(/<[^>]+>/g, "").slice(0, 400) }); });
        out.sort(function (a, b) { return b.w - a.w; });
        Object.keys(CAT).forEach(function (k) { if (/^air/.test(k)) delete CAT[k]; });
        CAT[key] = { at: Date.now(), m: out.slice(0, 40) }; sv("cat", CAT); busy[key] = 0;
      }); }
    return c ? c.m.map(T).filter(Boolean) : [];
  }
  function mix(id, rows) {
    if (!rows || rows.length < 2) return rows;
    if (id === "home" || id === "shows" || id === "movies") {   // Continue watching goes on top even when the switch is off
      var cw = cwList().filter(function (t) { return id === "home" || (id === "shows") === (t.type === "SHOW"); });
      if (cw.length) rows.splice(id === "home" ? 1 : 0, 0, S.R("Continue watching", cw, null, "free servers", 1, true));
    }
    if (!ON || !LISTS[id]) return rows;
    var hid = S.hiddenSet ? S.hiddenSet() : {}, seen = {}, rnd = seeded(LAUNCH * 131 + hash(id)), add = [];
    if (id === "shows" || id === "home") { var air = airing().filter(function (t) { return !hid[t.id]; }); if (air.length >= 6) add.push(S.R("Airing today", shuffle(air.slice(0, 12), rnd).concat(air.slice(12)), null, "new episodes · watch free", 1, true)); }
    picks(id, LAUNCH).forEach(function (rc) { var items = build(rc, seen, hid, rnd); if (items.length >= 6) add.push(S.R(rc.t, items.slice(0, 30), null, "free servers", 1, true)); });
    // core rows first, the rest shuffled; spread out: one free row every few of yours
    var first = add.slice(0, id === "anime" ? 1 : 2), rest = shuffle(add.slice(first.length), rnd), order0 = first.concat(rest);
    var at = id === "home" ? 3 : 2, gap = id === "home" ? 3 : 3;
    order0.forEach(function (r, i) { rows.splice(Math.min(at + i * (gap + 1), rows.length), 0, r); });
    return rows;
  }
  function wrap() { Object.keys(LISTS).forEach(function (k) { var f = S.SECTIONS && S.SECTIONS[k]; if (typeof f !== "function" || f._fs) return;
    var g = function () { var r = f.apply(this, arguments); try { return mix(k, r); } catch (e) { return r; } }; g._fs = 1; Object.keys(f).forEach(function (p) { g[p] = f[p]; }); S.SECTIONS[k] = g; }); }
  wrap();
  // fetch this visit's lists (and the next visit's, so they're ready) in the background
  setTimeout(function () { if (!ON) return; Object.keys(LISTS).forEach(function (k) { [LAUNCH, LAUNCH + 1].forEach(function (L) { picks(k, L).forEach(function (rc) { rc.k.forEach(list); }); }); }); airing(); }, 2500);

  // "Free" badge on cards of titles only the free servers have
  if (window.VSB) { var lab = VSB.label; VSB.label = function (t) { if (!t || (t.avail || []).length) return ""; return t.site ? lab(t) : t.fs ? '<span class="sbl fsl">Free</span>' : ""; }; }

  // title page of a free-only title: description, length, cast and genres from Cinemeta
  function prep(t, d) {
    if (!t || !t.fs || (t.avail || []).length || t._fsp) return; t._fsp = 1;
    meta(t).then(function (r) { var m = r.m || {};
      if (!t.desc && m.description) t.desc = m.description;
      var rt = /(\d+)/.exec(m.runtime || ""); if (rt && !t.runtime) t.runtime = +rt[1];
      if (!t.imdb && +m.imdbRating) t.imdb = +m.imdbRating;
      if (!(t.cast || []).length && m.cast) t.cast = m.cast.slice(0, 8);
      if (!(t.dirs || []).length && m.director) t.dirs = [].concat(m.director).slice(0, 2);
      if (t.type === "SHOW" && !t.seasons) { var ss = episodes(m); if (ss.length) { t.seasons = ss.length; t.eps = ss.reduce(function (a, s) { return a + s.eps.length; }, 0); } }
      var de = d && d.querySelector(".desc"); if (de && de.isConnected && !de.textContent) de.textContent = t.desc || "";
    }).catch(function () {});
  }
  // episode guide in the title page's format, for series TVmaze doesn't know
  function guide(t) {
    return meta(t).then(function (r) {
      var by = {};
      (r.m.videos || []).forEach(function (v) { if (!v.season || v.season < 1 || !v.number) return;
        (by[v.season] = by[v.season] || []).push({ s: v.season, n: v.number, title: v.name || v.title || "Episode " + v.number, desc: v.overview || v.description || "",
          runtime: null, date: (v.released || v.firstAired || "").slice(0, 10), img: v.thumbnail || null, sm: v.thumbnail || null, links: {} }); });
      var ss = Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return { n: n, eps: by[n].sort(function (a, b) { return a.n - b.n; }) }; });
      if (!ss.length) throw new Error("empty"); return ss;
    });
  }
  // ---------- Search start card: where Vesper looks (your apps first, then ShowBox, then the free servers) ----------
  var APPS = ["netflix", "amazon", "hotstar", "com.apple.appletv", "com.crunchyroll.webapp"];
  function sources(page, rerun) {
    var sbOn = !!(window.VSB && VSB.on()), d = document.createElement("div"); d.className = "srcs";
    d.innerHTML = '<div class="srch">Where Vesper looks</div>' +
      '<div class="src own"><div class="sic logos">' + APPS.map(function (a) { return '<img src="' + S.LOGO[a] + '" alt="' + esc(S.LABEL[a]) + '">'; }).join("") + '</div>' +
        '<div class="stx"><b>Your apps <em>always first</em></b><small>' + APPS.map(function (a) { return esc(S.LABEL[a]); }).join(" · ") + ' — every title on them, opens right in the app.</small></div></div>' +
      (window.VSB ? '<button class="src" data-srct="sb"><div class="sic sbx">SB</div><div class="stx"><b>ShowBox <i class="' + (sbOn ? "on" : "") + '">' + (sbOn ? "On" : "Off") + '</i></b><small>Films & series your apps don’t have — Play with FebBox.</small></div></button>' : "") +
      '<button class="src" data-srct="fs"><div class="sic fsx"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div><div class="stx"><b>Free servers <i class="' + (ON ? "on" : "") + '">' + (ON ? "On" : "Off") + '</i></b><small>Anything ever made — streams right inside Vesper. If one server has nothing, the next is tried by itself.</small></div></button>';
    d.addEventListener("click", function (e) { var b = e.target.closest("[data-srct]"); if (!b) return;
      var tg = b.dataset.srct === "fs" ? page.querySelector(".fstog") : page.querySelector(".sbtog:not(.fstog):not(.nfwtog)"); if (tg) tg.click(); });
    return d;
  }
  window.VFS = { sources: sources, bar: bar, prep: prep, guide: guide, on: function () { return ON; }, toggle: toggle, searchInto: searchInto, play: play, btn: btn, can: can, T: T,
    popped: function () { return close(true); }, open: function () { return !!(el && el.classList.contains("on")); } };
})();
