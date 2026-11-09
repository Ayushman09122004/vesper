/* Vesper web — connects the discovery engine (explore.js) to the app's sections: every browsing page gets a different,
   bigger mix each time you open the app, and pages keep adding fresh rows as you scroll. */
(function () {
  var S = window.VS; if (!S || !window.VEMake) return;
  var TT = null; function taste() { if (!TT) TT = S.taste(); return TT; }
  function maxPos(o) { var m = 0; for (var k in o) if (o[k] > m) m = o[k]; return m || 1; }
  var E = window.VEMake({
    all: function () { return S.ALL; },
    R: S.R,
    hidden: S.hiddenSet,
    primary: S._ && S._.primary,
    // only the "fits your taste" part (genres + countries you lean to), about −1…+1.5
    tasteScore: function (t) { var T = taste(); if (T.n < 6) return 0; var mg = maxPos(T.g), mc = maxPos(T.c), gs = 0;
      (t.genres || []).forEach(function (x) { var w = T.g[x] || 0; gs += w > 0 ? Math.min(1, w / mg) : Math.max(-1, w / mg); });
      var p = S._.primary(t) || (t.countries || [])[0], cw = p ? T.c[p] || 0 : 0; return (Math.max(-2, Math.min(2.2, gs)) * 12 + (cw > 0 ? Math.min(1, cw / mc) : cw < 0 ? -0.5 : 0) * 6) / 18; },
    tasteGenres: function () { var T = taste(), m = maxPos(T.g), o = {}; Object.keys(T.g).forEach(function (k) { if (T.g[k] > 0) o[k] = T.g[k] / m; }); return o; },
    regions: function () { var r = S.state[S.key("regions")]; return r && r[0] !== "ALL" ? r : []; },
    seeds: function () { return S.ids(S.list("likes").concat(S.list("mylist"), S.list("recent"))); }
  });
  window.VE = E;
  // the heavy lifting ahead of time, in idle moments
  (function w() { if (!S.ALL || !S.ALL.length) return setTimeout(w, 800); setTimeout(function () { E.warm(function (f) { (window.requestIdleCallback || setTimeout)(f); }); }, 2500); })();
  Object.keys(S.SECTIONS).forEach(function (k) { var f = S.SECTIONS[k]; if (typeof f !== "function" || f._ve) return;
    var g = function () { var r = f.apply(this, arguments); try { return E.expand(k, r); } catch (e) { console.error(e); return r; } }; g._ve = 1; S.SECTIONS[k] = g; });
})();
