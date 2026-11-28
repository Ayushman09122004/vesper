/* Vesper sync — keeps My List, likes, profiles and taste in your Google account (Firebase, free Spark plan),
   so they follow you between iPhone, Mac and TV and are never lost.
   Devices that can't show Google sign-in (the TV) join with a 6-letter link code approved from a signed-in device. */
(function (G) {
  "use strict";
  var CFG = { apiKey: "AIzaSyAvZCJDwRQirEKbmLMJM6tidWlGFy0pdAM", authDomain: "vesper-3db89.firebaseapp.com", projectId: "vesper-3db89",
    storageBucket: "vesper-3db89.firebasestorage.app", messagingSenderId: "635983731327", appId: "1:635983731327:web:1b0894237c0745bf577d4a" };
  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  var SYNCED = /^(profiles|prefs|(mylist|watched|recent|likes|dislikes|viewed|queries|rated|epsdone)(@.+)?)$/;
  var LS = { on: "vesper.sync.on", at: "vesper.sync.at", dev: "vesper.sync.dev", link: "vesper.sync.link" };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var devId = ls(LS.dev) || (function () { var d = "d" + Math.random().toString(36).slice(2, 10); ls(LS.dev, d); return d; })();
  var stamps = {}; try { stamps = JSON.parse(ls(LS.at) || "{}") || {}; } catch (e) {}
  var fb = null, auth = null, db = null, user = null, ownerUid = null, unsub = null, applying = false, pushT = null, listeners = [];
  var Sync = G.VesperSync = { status: "off", email: null, name: null, onChange: function (fn) { listeners.push(fn); } };
  function emit() { listeners.forEach(function (fn) { try { fn(Sync); } catch (e) {} }); }
  function set(st, extra) { Sync.status = st; Object.assign(Sync, extra || {}); emit(); }

  function load(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function boot() {
    if (fb) return Promise.resolve();
    return load(SDK + "firebase-app-compat.js").then(function () { return Promise.all([load(SDK + "firebase-auth-compat.js"), load(SDK + "firebase-firestore-compat.js")]); })
      .then(function () { fb = G.firebase; fb.initializeApp(CFG); auth = fb.auth(); db = fb.firestore();
        return auth.setPersistence(fb.auth.Auth.Persistence.LOCAL).catch(function () {}); });
  }

  // ---------- local state <-> cloud ----------
  function state() { return G.vesperState || {}; }
  function snapshot() { var out = {}, s = state(); Object.keys(s).forEach(function (k) { if (SYNCED.test(k) && s[k] != null) out[k] = { v: s[k], t: stamps[k] || 0 }; }); return out; }
  function apply(remote) {
    if (!remote) return false; var s = state(), changed = false; applying = true;
    Object.keys(remote).forEach(function (k) {
      if (!SYNCED.test(k)) return; var r = remote[k];
      if (!r || (stamps[k] || 0) >= (r.t || 0)) return;
      stamps[k] = r.t || 0; s[k] = r.v; changed = true;
    });
    if (changed) { try { localStorage.setItem("vesper.state.v1", JSON.stringify(s)); ls(LS.at, JSON.stringify(stamps)); } catch (e) {} if (G.VS) G.VS.state = s; }
    applying = false; return changed;
  }
  function docRef() { return ownerUid ? db.collection("users").doc(ownerUid) : null; }
  function push() {
    clearTimeout(pushT);
    pushT = setTimeout(function () { var ref = docRef(); if (!ref) return;
      ref.set({ blob: JSON.stringify(snapshot()), dev: devId, at: fb.firestore.FieldValue.serverTimestamp() }, { merge: true }).then(function () { set("synced"); }).catch(function (e) { set("error", { err: e.code || String(e) }); });
    }, 1500);
  }
  // every local change to a synced key gets a fresh timestamp and is sent up
  function hook() {
    var call = G.V.call;
    G.V.call = function (n, a) {
      var r = call.apply(this, arguments);
      if (n === "stateSet" && a && SYNCED.test(a.k) && !applying) { stamps[a.k] = Date.now(); ls(LS.at, JSON.stringify(stamps)); if (ownerUid) push(); }
      return r;
    };
  }
  function listen() {
    if (unsub) unsub(); var ref = docRef(); if (!ref) return;
    unsub = ref.onSnapshot(function (d) {
      if (!d.exists) { push(); return; }
      var data = d.data() || {}, remote = {}; try { remote = JSON.parse(data.blob || "{}"); } catch (e) {}
      var changed = apply(remote);
      // anything newer here than in the cloud goes up
      var mine = snapshot(), behind = Object.keys(mine).some(function (k) { return !remote[k] || (remote[k].t || 0) < (mine[k].t || 0); });
      if (behind) push(); else set("synced");
      if (changed && G.vesperRefresh) G.vesperRefresh();
    }, function (e) { set("error", { err: e.code || String(e) }); });
  }
  function started(u) {
    user = u; var link = ls(LS.link);
    if (!u) { ownerUid = null; if (unsub) unsub(); set("off"); return; }
    if (u.isAnonymous) { if (!link) { set("off"); return; } ownerUid = link; set("syncing", { email: null, name: "Linked device", linked: true }); }
    else { ownerUid = u.uid; ls(LS.link, null); set("syncing", { email: u.email, name: u.displayName, linked: false }); }
    ls(LS.on, "1"); listen();
  }

  // ---------- public actions ----------
  Sync.start = function () {   // called on launch: only wakes Firebase if this device has synced before
    hook();
    if (ls(LS.on) !== "1") return;
    set("syncing");
    boot().then(function () { auth.getRedirectResult().catch(function () {}); auth.onAuthStateChanged(started); }).catch(function () { set("error", { err: "offline" }); });
  };
  Sync.signIn = function () {
    set("syncing");
    return boot().then(function () {
      auth.onAuthStateChanged(started);
      var p = new fb.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
      return auth.signInWithPopup(p).catch(function (e) {
        // home-screen apps on iPhone sometimes can't open pop-ups: fall back to a full-page Google sign-in
        if (/popup|operation-not-supported|web-storage/.test(e.code || "")) { ls(LS.on, "1"); return auth.signInWithRedirect(p); }
        set("off"); throw e;
      });
    });
  };
  Sync.signOut = function () { if (!auth) return; if (unsub) unsub(); ls(LS.on, null); ls(LS.link, null); auth.signOut(); set("off", { email: null, name: null }); };

  // a device without Google sign-in shows a code; a signed-in device approves it
  function code6() { var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = ""; for (var i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  Sync.requestLink = function (onCode, onDone) {
    return boot().then(function () { return auth.currentUser && auth.currentUser.isAnonymous ? auth.currentUser : auth.signInAnonymously().then(function (c) { return c.user; }); })
      .then(function (u) { var c = code6(), ref = db.collection("pairings").doc(c);
        return ref.set({ dev: u.uid, name: navigator.userAgent.indexOf("iPhone") >= 0 ? "iPhone" : "Device", at: Date.now() }).then(function () {
          onCode(c);
          var off = ref.onSnapshot(function (d) { var x = d.data(); if (x && x.uid) { off(); ls(LS.link, x.uid); ls(LS.on, "1"); ref.delete().catch(function () {}); auth.onAuthStateChanged(started); started(u); onDone && onDone(); } });
        }); });
  };
  Sync.approveLink = function (code) {
    if (!user || user.isAnonymous) return Promise.reject(new Error("Sign in with Google on this device first"));
    var ref = db.collection("pairings").doc(String(code).toUpperCase().replace(/[^A-Z0-9]/g, ""));
    return ref.get().then(function (d) {
      if (!d.exists) throw new Error("That code wasn't found — check it on the other screen");
      var x = d.data();
      return db.collection("users").doc(user.uid).collection("devices").doc(x.dev).set({ name: x.name || "Device", at: Date.now() })
        .then(function () { return ref.update({ uid: user.uid }); }).then(function () { return x.name || "Device"; });
    });
  };
})(window);
