/* ============================================================
   Kamir Group — Investor Portal logic
   ------------------------------------------------------------
   Real authentication via Firebase Google Sign-In, with per-
   investor data loaded from Cloud Firestore. Access is enforced
   by Firestore security rules (firestore.rules): a signed-in
   investor can only read their own investors/{email} document
   and its properties, plus the shared config/* data.

   - portal.html         -> Google sign-in, then redirect to the
                            dashboard if the account is authorized.
   - portal-dashboard.html -> auth-gated; loads data from Firestore
                            and renders the existing dashboard UI.
   ============================================================ */
(function () {
  "use strict";

  var PD = window.KamirPortalData;
  if (!PD) return;

  /* ---- Feature flags ----
     Investor self-upload writes to Cloud Storage, which requires the
     Firebase Blaze plan. While the project is on the free Spark plan we
     keep this OFF so the portal shows a tidy "coming soon" state instead
     of a failing upload. Flip to true once Storage is enabled on Blaze. */
  var UPLOADS_ENABLED = false;

  /* ---- Firebase bootstrap ---- */
  function configReady() {
    var c = window.KAMIR_FIREBASE_CONFIG;
    return c && c.apiKey && c.apiKey.indexOf("REPLACE_") !== 0 &&
      c.projectId && c.projectId.indexOf("REPLACE_") !== 0;
  }
  function initFirebase() {
    if (typeof firebase === "undefined" || !configReady()) return false;
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.KAMIR_FIREBASE_CONFIG);
    }
    return true;
  }

  /* ---- helpers ---- */
  function lang() {
    return (window.KamirI18N && window.KamirI18N.current && window.KamirI18N.current()) || "he";
  }
  function L(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lang()] != null ? obj[lang()] : (obj.he != null ? obj.he : obj.en);
  }
  function ui(key) { return L(PD.UI[key]); }
  function money(n) {
    return "$" + Number(n).toLocaleString("en-US");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---- Admin (manager preview) state ----
     An admin account (listed in config/admins) can view ANY investor's
     portal in the browser via the picker in the admin bar. Regular
     investors only ever see their own data. */
  var IS_ADMIN = false;        // is the signed-in user a manager?
  var INVESTOR_LIST = [];      // [{key, name}] — populated for admins only
  var ADMIN_VIEW_KEY = null;   // emailKey of the investor currently being viewed
  var SHARED_CONFIG = null;    // cached shared {contacts, media}

  /* ---- Firestore data loading ---- */
  function emailKey(user) {
    return (user.email || "").toLowerCase();
  }

  /* Shared, non-sensitive data (support contacts + explainer videos). */
  function loadConfig() {
    var db = firebase.firestore();
    return Promise.all([
      db.collection("config").doc("contacts").get(),
      db.collection("config").doc("media").get()
    ]).then(function (res) {
      return {
        contacts: res[0].exists ? (res[0].data().items || []) : [],
        media: res[1].exists ? (res[1].data().items || []) : []
      };
    });
  }

  /* Load one investor's doc + properties by their email key.
     Resolves {key, investor:{name,since}, properties:[...]} or null. */
  function loadInvestorByKey(key) {
    var db = firebase.firestore();
    var ref = db.collection("investors").doc(key);
    return ref.get().then(function (inv) {
      if (!inv.exists) return null;
      var info = inv.data() || {};
      return ref.collection("properties").get().then(function (snap) {
        var props = snap.docs.map(function (d) {
          var data = d.data();
          if (data.id == null) data.id = d.id;
          return data;
        });
        props.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        return { key: key, investor: { name: info.name, since: info.since }, properties: props };
      });
    });
  }

  /* Manager email list (config/admins.emails), lowercased. */
  function loadAdminEmails() {
    var db = firebase.firestore();
    return db.collection("config").doc("admins").get().then(function (doc) {
      if (!doc.exists) return [];
      return (doc.data().emails || []).map(function (e) { return String(e).toLowerCase(); });
    }).catch(function () { return []; });
  }

  /* All investors (admins only — gated by firestore.rules).
     Resolves to an array, or null when the list query is denied
     (e.g. the admin rules have not been published yet). The caller
     then gracefully falls back to the admin's own record. */
  function loadInvestorList() {
    var db = firebase.firestore();
    return db.collection("investors").get().then(function (snap) {
      return snap.docs.map(function (d) {
        var info = d.data() || {};
        return { key: d.id, name: info.name || { he: d.id, en: d.id } };
      }).sort(function (a, b) { return L(a.name).localeCompare(L(b.name)); });
    }).catch(function (e) {
      if (e && e.code === "permission-denied") return null;
      throw e;
    });
  }

  /* Load the signed-in investor's data + shared config from Firestore.
     Resolves with a DATA object (same shape the dashboard renders), or
     null if this account has no investor record (not authorized). */
  function loadPortalData(user) {
    return Promise.all([loadInvestorByKey(emailKey(user)), loadConfig()]).then(function (res) {
      var inv = res[0];
      if (!inv) return null;
      return { investor: inv.investor, properties: inv.properties, shared: res[1] };
    });
  }

  /* ============================================================
     LOGIN  (portal.html)
     ============================================================ */
  function setMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text || "";
    el.style.color = kind === "error" ? "var(--brick, #b4452f)"
      : kind === "ok" ? "var(--sage)" : "";
  }

  function setupLogin(root) {
    var btn = document.getElementById("google-signin");
    var result = root.querySelector(".form-result");
    var extra = document.getElementById("portal-google-extra");

    if (!initFirebase()) {
      if (btn) btn.disabled = true;
      setMsg(result, ui("configMissing"), "error");
      return;
    }

    var auth = firebase.auth();
    auth.useDeviceLanguage();
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    function showNoAccess(user) {
      setMsg(result, "", "");
      if (!extra) return;
      var msg = ui("noAccessMsg").replace("{email}", user.email || "");
      extra.innerHTML =
        '<div class="portal__noaccess">' +
          "<b>" + esc(ui("noAccessTitle")) + "</b>" +
          "<p>" + esc(msg) + "</p>" +
          '<div class="portal__noaccess-actions">' +
            '<button type="button" class="btn btn-ghost" id="switch-account">' + esc(ui("switchAccount")) + "</button>" +
            '<a class="btn btn-primary" href="contact.html">' + esc(ui("contactUs")) + "</a>" +
          "</div>" +
        "</div>";
      var sw = document.getElementById("switch-account");
      if (sw) sw.addEventListener("click", function () {
        auth.signOut().then(function () {
          extra.innerHTML = "";
          auth.signInWithPopup(provider).catch(handleSignInError);
        });
      });
    }

    function handleSignInError(e) {
      if (e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request")) {
        setMsg(result, "", "");
        return;
      }
      setMsg(result, ui("signinError"), "error");
    }

    /* React to auth state: if signed in & authorized -> dashboard. */
    auth.onAuthStateChanged(function (user) {
      if (!user) return;
      setMsg(result, ui("signedIn"), "ok");
      Promise.all([loadAdminEmails(), loadInvestorByKey(emailKey(user))]).then(function (res) {
        var isAdmin = res[0].indexOf(emailKey(user)) !== -1;
        var hasOwn = !!res[1];
        if (isAdmin || hasOwn) {
          window.location.replace("portal-dashboard.html");
        } else {
          showNoAccess(user);
        }
      }).catch(function () {
        setMsg(result, ui("loadError"), "error");
      });
    });

    if (btn) btn.addEventListener("click", function () {
      if (extra) extra.innerHTML = "";
      setMsg(result, ui("signingIn"), "");
      auth.signInWithPopup(provider).catch(handleSignInError);
    });
  }

  /* ============================================================
     DASHBOARD  (portal-dashboard.html)
     ============================================================ */
  function svg(paths, extra) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      (extra || "") + ">" + paths + "</svg>";
  }
  var ICONS = {
    overview: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'),
    financials: svg('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
    dist: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    photos: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>'),
    docs: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>'),
    contacts: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>'),
    media: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 5 3-5 3z" fill="currentColor" stroke="none"/><path d="M8 21h8"/>'),
    phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>'),
    play: svg('<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/>'),
    doc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
    sheet: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
    upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 9l5-5 5 5"/><path d="M12 4v12"/>'),
    ext: svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>'),
    shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    folder: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')
  };

  var activeTab = "overview";
  var activePropIdx = 0;

  function metricCard(label, value, sub) {
    return '<div class="pmetric"><span class="pmetric__label">' + esc(label) + '</span>' +
      '<span class="pmetric__value">' + value + "</span>" +
      (sub ? '<span class="pmetric__sub">' + esc(sub) + "</span>" : "") + "</div>";
  }

  function renderOverview(p) {
    var f = p.financials;
    var specs =
      specRow(ui("beds"), p.specs.beds) +
      specRow(ui("baths"), p.specs.baths) +
      specRow(ui("sqft"), p.specs.sqft) +
      specRow(ui("year"), p.specs.year) +
      specRow(ui("type"), L(p.specs.type)) +
      (p.leaseStart ? specRow(ui("leaseStart"), L(p.leaseStart)) : "") +
      (p.leaseEnd ? specRow(ui("leaseEnd"), L(p.leaseEnd)) : "");

    var metrics =
      metricCard(ui("investment"), money(f.investment)) +
      metricCard(ui("currentValue"), money(f.currentValue)) +
      metricCard(ui("netCashflow"), money(f.netCashflow) + ' <small>' + ui("perMonth") + "</small>") +
      metricCard(ui("cashOnCash"), f.cashOnCash + "%") +
      metricCard(ui("leverage"), f.leveragePct + "%") +
      metricCard(ui("equity"), money(f.equity));

    return '<div class="pcard pcard--hero">' +
        '<img src="' + esc(p.hero) + '" alt="' + esc(L(p.name)) + '" loading="lazy" />' +
        '<div class="pcard--hero__body">' +
          '<span class="pchip pchip--ok">' + esc(L(p.status)) + "</span>" +
          "<h2>" + esc(L(p.name)) + "</h2>" +
          '<p class="muted">' + esc(p.address) + " · " + esc(L(p.city)) + "</p>" +
          (p.zillowUrl
            ? '<a class="pzillow" href="' + esc(p.zillowUrl) + '" target="_blank" rel="noopener">' +
                ICONS.ext + "<span>" + ui("viewOnZillow") + "</span></a>"
            : "") +
        "</div>" +
      "</div>" +
      '<div class="pgrid pgrid--2">' +
        '<div class="pcard"><h3 class="pcard__title">' + ui("keyMetrics") + "</h3>" +
          '<div class="pmetrics">' + metrics + "</div></div>" +
        '<div class="pcard"><h3 class="pcard__title">' + ui("propertySpecs") + "</h3>" +
          '<dl class="pspecs">' + specs + "</dl></div>" +
      "</div>";
  }
  function specRow(k, v) {
    return "<div><dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>";
  }

  function finTile(label, value, tone) {
    return '<div class="ftile' + (tone ? " ftile--" + tone : "") + '">' +
      '<span class="ftile__label">' + esc(label) + "</span>" +
      '<span class="ftile__value">' + value + "</span></div>";
  }

  /* Donut chart: segments = [{tone, label, value}]. Renders an SVG ring
     (drawn from 12 o'clock clockwise) with a value in the middle. */
  function donutChart(segments, centerTop, centerBottom, aria) {
    var total = segments.reduce(function (s, x) { return s + Math.max(0, x.value); }, 0) || 1;
    var R = 54, CX = 70, CY = 70;
    var C = 2 * Math.PI * R;
    var off = 0;
    var ring = segments.map(function (seg) {
      var len = (Math.max(0, seg.value) / total) * C;
      var dash = len.toFixed(2) + " " + (C - len).toFixed(2);
      var c = '<circle class="fdonut__seg fdonut__seg--' + seg.tone + '" r="' + R + '" cx="' + CX + '" cy="' + CY + '"' +
        ' stroke-dasharray="' + dash + '" stroke-dashoffset="' + (-off).toFixed(2) + '"></circle>';
      off += len;
      return c;
    }).join("");
    return '<svg class="fdonut" viewBox="0 0 140 140" role="img" aria-label="' + esc(aria || "") + '">' +
      '<circle class="fdonut__track" r="' + R + '" cx="' + CX + '" cy="' + CY + '"></circle>' +
      '<g transform="rotate(-90 ' + CX + ' ' + CY + ')">' + ring + "</g>" +
      '<text class="fdonut__top" x="' + CX + '" y="' + (CY - 2) + '" text-anchor="middle">' + esc(centerTop) + "</text>" +
      '<text class="fdonut__bottom" x="' + CX + '" y="' + (CY + 16) + '" text-anchor="middle">' + esc(centerBottom) + "</text>" +
      "</svg>";
  }

  function renderFinancials(p) {
    var f = p.financials;

    /* ---- 1. headline tiles ---- */
    var tiles =
      finTile(ui("currentValue"), money(f.currentValue), "value") +
      finTile(ui("equity"), money(f.equity), "equity") +
      finTile(ui("investment"), money(f.investment), "invest") +
      finTile(ui("cashOnCash"), f.cashOnCash + "%", "yield");

    /* ---- 2. value composition bar (equity vs loan) ---- */
    var val = f.currentValue || 0;
    var eqPct = val > 0 ? Math.round((f.equity / val) * 100) : 100;
    var loanPct = Math.max(0, 100 - eqPct);
    var compBar =
      '<div class="fbar" role="img" aria-label="' + esc(ui("equity")) + " " + eqPct + '%">' +
        '<span class="fbar__seg fbar__seg--equity" style="width:' + eqPct + '%"></span>' +
        (loanPct > 0 ? '<span class="fbar__seg fbar__seg--loan" style="width:' + loanPct + '%"></span>' : "") +
      "</div>" +
      '<div class="flegend">' +
        '<span class="flegend__item"><i class="fdot fdot--equity"></i>' + esc(ui("equity")) + " · <b>" + money(f.equity) + "</b> (" + eqPct + "%)</span>" +
        (f.mortgageBalance > 0
          ? '<span class="flegend__item"><i class="fdot fdot--loan"></i>' + esc(ui("mortgageBalance")) + " · <b>" + money(f.mortgageBalance) + "</b></span>"
          : '<span class="flegend__item"><i class="fdot fdot--equity"></i>' + esc(ui("noLoan")) + "</span>") +
      "</div>" +
      (f.interestRate ? '<p class="fnote">' + esc(ui("interestRate")) + ': <b>' + f.interestRate + "%</b></p>" : "");

    /* ---- 3. monthly cashflow — donut + plain-language in/out/keep ---- */
    var gross = f.grossRent || 0;
    var totalOut = (f.monthlyMortgage || 0) + (f.monthlyInsurance || 0) + (f.monthlyOperating || 0);

    var segs = [
      { tone: "net",  label: ui("youKeep"),    value: f.netCashflow },
      f.monthlyMortgage  > 0 ? { tone: "loan", label: ui("mortgagePay"), value: f.monthlyMortgage }  : null,
      f.monthlyInsurance > 0 ? { tone: "ins",  label: ui("insurance"),   value: f.monthlyInsurance } : null,
      f.monthlyOperating > 0 ? { tone: "op",   label: ui("operating"),   value: f.monthlyOperating } : null
    ].filter(Boolean);

    var legend = segs.map(function (s) {
      var pct = gross > 0 ? Math.round((s.value / gross) * 100) : 0;
      return '<li class="fleg"><span class="fleg__dot fleg__dot--' + s.tone + '"></span>' +
        '<span class="fleg__label">' + esc(s.label) + "</span>" +
        '<span class="fleg__val">' + money(s.value) + ' <small>' + pct + "%</small></span></li>";
    }).join("");

    var keepPct = gross > 0 ? Math.round((f.netCashflow / gross) * 100) : 0;
    var pctOf = function (v) { return gross > 0 ? Math.round((v / gross) * 100) : 0; };

    /* VIEW A — donut + legend */
    var donut =
      '<div class="fdonut-wrap">' +
        donutChart(segs, money(gross), ui("perMonth"), ui("finMonthlyFlow") + " — " + money(gross)) +
        '<ul class="flegend2">' + legend + "</ul>" +
      "</div>";

    /* VIEW B — horizontal bars (magnitude comparison vs. rent) */
    var barsRows =
      '<div class="fbars__row fbars__row--ref">' +
        '<div class="fbars__top"><span class="fbars__label">' + ui("moneyIn") + "</span>" +
          '<span class="fbars__val">' + money(gross) + " <small>100%</small></span></div>" +
        '<div class="fbars__track"><span class="fbars__fill fbars__fill--rent" style="width:100%"></span></div>' +
      "</div>" +
      segs.map(function (s) {
        var pct = pctOf(s.value);
        return '<div class="fbars__row">' +
          '<div class="fbars__top"><span class="fbars__label"><span class="fleg__dot fleg__dot--' + s.tone + '"></span>' + esc(s.label) + "</span>" +
            '<span class="fbars__val">' + money(s.value) + " <small>" + pct + "%</small></span></div>" +
          '<div class="fbars__track"><span class="fbars__fill fbars__fill--' + s.tone + '" style="width:' + pct + '%"></span></div>' +
        "</div>";
      }).join("");
    var bars = '<div class="fbars">' + barsRows + "</div>";

    /* VIEW C — precise numeric table */
    var outSegs = segs.filter(function (s) { return s.tone !== "net"; });
    var tableBody =
      '<tr class="fcft__in"><td>' + ui("moneyIn") + "</td><td class='fnum'>" + money(gross) + "</td><td class='fnum'>100%</td></tr>" +
      outSegs.map(function (s) {
        return "<tr><td><span class='fleg__dot fleg__dot--" + s.tone + "'></span>" + esc(s.label) + "</td>" +
          "<td class='fnum'>−" + money(s.value) + "</td><td class='fnum fmuted'>" + pctOf(s.value) + "%</td></tr>";
      }).join("") +
      "<tr class='fcft__keep'><td>" + ui("youKeep") + "</td><td class='fnum'>" + money(f.netCashflow) + "</td><td class='fnum'>" + keepPct + "%</td></tr>";
    var table =
      '<div class="ptable-wrap"><table class="ptable fcftable"><thead><tr>' +
        "<th>" + ui("colItem") + "</th><th class='fnum'>" + ui("colAmount") + "</th><th class='fnum'>" + ui("ofRentShort") + "</th>" +
      "</tr></thead><tbody>" + tableBody + "</tbody></table></div>";

    /* plain-language money in -> out -> keep (always-on summary) */
    var inout =
      '<div class="fio">' +
        '<div class="fio__item fio__item--in">' +
          '<span class="fio__k">' + ui("moneyIn") + "</span>" +
          '<span class="fio__v">' + money(gross) + "</span>" +
          '<span class="fio__s">' + ui("perMonth") + "</span></div>" +
        '<div class="fio__op">−</div>' +
        '<div class="fio__item fio__item--out">' +
          '<span class="fio__k">' + ui("moneyOut") + "</span>" +
          '<span class="fio__v">' + money(totalOut) + "</span>" +
          '<span class="fio__s">' + ui("moneyOutSub") + "</span></div>" +
        '<div class="fio__op">=</div>' +
        '<div class="fio__item fio__item--keep">' +
          '<span class="fio__k">' + ui("youKeep") + "</span>" +
          '<span class="fio__v">' + money(f.netCashflow) + "</span>" +
          '<span class="fio__s">' + keepPct + "% " + ui("ofRent") + "</span></div>" +
      "</div>";

    /* view toggle — investor picks donut / bars / table; choice persists */
    var fv = "donut";
    try { fv = (window.localStorage && localStorage.getItem("kamir_fin_view")) || "donut"; } catch (e) {}
    if (fv !== "donut" && fv !== "bars" && fv !== "table") fv = "donut";
    var segBtn = function (id, label) {
      return '<button type="button" class="finseg' + (fv === id ? " is-active" : "") +
        '" role="tab" aria-selected="' + (fv === id ? "true" : "false") + '" data-finview="' + id + '">' + esc(label) + "</button>";
    };
    var toggle =
      '<div class="finview-toggle" role="tablist" aria-label="' + esc(ui("finViewLabel")) + '">' +
        segBtn("donut", ui("finViewDonut")) + segBtn("bars", ui("finViewBars")) + segBtn("table", ui("finViewTable")) +
      "</div>";
    var viewWrap = function (id, inner) {
      return '<div class="finview' + (fv === id ? " is-active" : "") + '" data-finview="' + id + '">' + inner + "</div>";
    };
    var views =
      '<div class="finviews">' +
        viewWrap("donut", donut) + viewWrap("bars", bars) + viewWrap("table", table) +
      "</div>";

    var monthlyCard =
      '<div class="pcard fmonthly">' +
        '<div class="fmonthly__head"><h3 class="pcard__title">' + ui("finMonthlyFlow") + "</h3>" + toggle + "</div>" +
        inout + views +
      "</div>";

    /* ---- 4. full purchase + renovation ledger ---- */
    var ledger = "";
    if (p.expenses && p.expenses.length) {
      var total = 0;
      var body = p.expenses.map(function (e) {
        total += Number(e.amount) || 0;
        return "<tr><td>" + esc(L(e.label)) + "</td><td class='fmuted'>" + esc(e.vendor || "") + "</td>" +
          "<td class='fnum'>" + money(e.amount) + "</td></tr>";
      }).join("");
      var sheetBtn = p.sheetUrl
        ? '<a class="pbtn pbtn--ghost fledger__sheet" href="' + esc(p.sheetUrl) + '" target="_blank" rel="noopener">' +
            ICONS.sheet + "<span>" + ui("openSheet") + "</span></a>"
        : "";
      ledger =
        '<div class="pcard fledger">' +
          '<div class="fledger__head"><h3 class="pcard__title">' + ui("finLedger") + "</h3>" + sheetBtn + "</div>" +
          '<div class="ptable-wrap"><table class="ptable ftable"><thead><tr>' +
            "<th>" + ui("colItem") + "</th><th>" + ui("colVendor") + "</th><th class='fnum'>" + ui("colAmount") + "</th>" +
          "</tr></thead><tbody>" + body +
          "<tr class='ftable__total'><td colspan='2'>" + ui("totalSpent") + "</td><td class='fnum'>" + money(total) + "</td></tr>" +
          "</tbody></table></div>" +
        "</div>";
    }

    return '<div class="fhead">' + tiles + "</div>" +
      monthlyCard +
      '<div class="pcard"><h3 class="pcard__title">' + ui("finValueEquity") + "</h3>" + compBar + "</div>" +
      ledger;
  }

  function renderDistributions(p) {
    var next = null;
    var dists = p.distributions || [];
    if (!dists.length) {
      return '<p class="psection__intro">' + ui("distIntro") + "</p>" +
        '<div class="pcard pempty">' + ICONS.dist +
        "<p>" + ui("distEmpty") + "</p></div>";
    }
    var body = dists.map(function (d) {
      var paid = d.status === "paid" ||
        (d.status && (d.status.en === "Paid" || d.status.he === "שולם"));
      if (!paid && !next) next = d;
      return "<tr>" +
        "<td>" + esc(L(d.period)) + "</td>" +
        "<td>" + money(d.gross) + "</td>" +
        "<td class='neg'>−" + money(d.mortgage) + "</td>" +
        "<td class='neg'>−" + money(d.insurance) + "</td>" +
        "<td class='neg'>−" + money(d.operating) + "</td>" +
        "<td><b>" + money(d.net) + "</b></td>" +
        "<td><span class='pchip " + (paid ? "pchip--ok" : "pchip--wait") + "'>" +
          (paid ? ui("statusPaid") : ui("statusScheduled")) + "</span></td>" +
        "</tr>";
    }).join("");

    var nextBanner = next ? '<div class="pcard pbanner">' +
        '<span class="pbanner__label">' + ui("nextPayout") + "</span>" +
        '<span class="pbanner__period">' + esc(L(next.period)) + "</span>" +
        '<span class="pbanner__amount">' + money(next.net) + "</span></div>" : "";

    return '<p class="psection__intro">' + ui("distIntro") + "</p>" + nextBanner +
      '<div class="pcard ptable-wrap"><table class="ptable"><thead><tr>' +
        "<th>" + ui("colPeriod") + "</th><th>" + ui("colGross") + "</th><th>" + ui("colMortgage") +
        "</th><th>" + ui("colInsurance") + "</th><th>" + ui("colOperating") + "</th><th>" +
        ui("colNet") + "</th><th>" + ui("colStatus") + "</th>" +
      "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function photoFigure(ph) {
    var cap = L(ph.caption);
    return '<figure class="pphoto" data-full="' + esc(ph.src) + '" tabindex="0" role="button" aria-label="' + esc(cap || ui("tabPhotos")) + '">' +
      '<img src="' + esc(ph.src) + '" alt="' + esc(cap) + '" loading="lazy" />' +
      (cap ? "<figcaption>" + esc(cap) + "</figcaption>" : "") + "</figure>";
  }
  function renderPhotos(p) {
    var ph = p.photos || {};
    /* New shape: a single flat gallery of all photos. */
    if (Array.isArray(ph.gallery) && ph.gallery.length) {
      var cells = ph.gallery.map(photoFigure).join("");
      return '<p class="psection__intro">' + ui("photosIntro") + "</p>" +
        '<div class="pcard"><div class="pgallery pgallery--all">' + cells + "</div></div>";
    }
    /* Legacy shape: separate exterior / interior lists. */
    var ext = (ph.exterior || []).map(photoFigure).join("");
    var int = (ph.interior || []).map(photoFigure).join("");
    return '<div class="pcard"><h3 class="pcard__title">' + ui("photosExterior") + '</h3><div class="pgallery">' + ext + "</div></div>" +
      ((ph.interior && ph.interior.length)
        ? '<div class="pcard"><h3 class="pcard__title">' + ui("photosInterior") + '</h3><div class="pgallery">' + int + "</div></div>"
        : "");
  }

  function renderDocuments(p) {
    /* Drive folders for this property — the files stay in Google Drive,
       the investor opens them straight from the portal in a new tab.
       Shared rendering; the folder links themselves are per-property data. */
    var folders = p.driveFolders || [];
    var folderCards = folders.map(function (fo) {
      return '<a class="pcard pdrivefolder" href="' + esc(fo.url) + '" target="_blank" rel="noopener" aria-label="' + esc(L(fo.title)) + '">' +
        '<span class="pdrivefolder__icon">' + ICONS.folder + "</span>" +
        '<span class="pdrivefolder__body">' +
          "<b>" + esc(L(fo.title)) + "</b>" +
          (L(fo.desc) ? "<p>" + esc(L(fo.desc)) + "</p>" : "") +
        "</span>" +
        '<span class="pdrivefolder__ext">' + ICONS.ext + "<span>" + ui("openDrive") + "</span></span>" +
        "</a>";
    }).join("");
    var foldersBlock = folders.length
      ? '<div class="pcard"><h3 class="pcard__title">' + ui("driveFoldersTitle") + "</h3>" +
          '<p class="pcard__sub">' + ui("driveFoldersIntro") + "</p>" +
          '<div class="pdrivefolders">' + folderCards + "</div></div>"
      : "";

    var docs = p.documents || [];
    var items = docs.map(function (d) {
      return '<div class="pdoc" data-demo-doc>' +
        '<span class="pdoc__icon">' + ICONS.doc + "</span>" +
        '<span class="pdoc__body"><b>' + esc(L(d.name)) + "</b>" +
          '<span class="pdoc__meta"><span class="pchip pchip--cat">' + ui(d.cat) + "</span> · PDF · " + esc(d.size) + "</span></span>" +
        '<button class="pdoc__dl" type="button" aria-label="' + ui("download") + '">' + ICONS.download + "</button>" +
        "</div>";
    }).join("");

    var list = docs.length
      ? '<div class="pcard pdocs">' + items + "</div>"
      : '<div class="pcard pempty">' + ICONS.docs + "<p>" + ui("docsEmpty") + "</p></div>";

    /* upload zone — lets the investor add their own documents.
       When uploads are disabled (Spark plan) we render a non-interactive
       "coming soon" card rather than a control that would fail. */
    var uploader = UPLOADS_ENABLED
      ? '<div class="pcard pupload" id="pupload" data-prop="' + esc(p.id) + '">' +
          '<label class="pupload__zone" for="pupload-input">' +
            '<span class="pupload__icon">' + ICONS.upload + "</span>" +
            '<span class="pupload__title">' + ui("uploadTitle") + "</span>" +
            '<span class="pupload__hint">' + ui("uploadHint") + "</span>" +
            '<input type="file" id="pupload-input" multiple ' +
              'accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" hidden />' +
          "</label>" +
          '<div class="pupload__list" id="pupload-list" hidden></div>' +
        "</div>"
      : '<div class="pcard pupload is-disabled">' +
          '<div class="pupload__zone pupload__zone--soon">' +
            '<span class="pupload__icon">' + ICONS.upload + "</span>" +
            '<span class="pupload__title">' + ui("uploadTitle") + "</span>" +
            '<span class="pupload__hint">' + ui("uploadUnavailable") + "</span>" +
          "</div>" +
        "</div>";

    return '<p class="psection__intro">' + ui("docsIntro") + "</p>" + foldersBlock + uploader + list;
  }

  function renderContacts() {
    var contacts = (PD.DATA.shared && PD.DATA.shared.contacts) || [];
    var items = contacts.map(function (c) {
      return '<div class="pcard pcontact">' +
        "<h3>" + esc(L(c.name)) + "</h3>" +
        '<p class="pcontact__role">' + esc(L(c.role)) + "</p>" +
        '<p class="pcontact__when"><b>' + ui("whenToContact") + ":</b> " + esc(L(c.when)) + "</p>" +
        '<div class="pcontact__actions">' +
          '<a class="pbtn" href="tel:' + esc(c.phone) + '">' + ICONS.phone + '<span dir="ltr">' + esc(c.phoneLabel) + "</span></a>" +
          '<a class="pbtn pbtn--ghost" href="mailto:' + esc(c.email) + '">' + ICONS.mail + "<span>" + esc(c.email) + "</span></a>" +
        "</div></div>";
    }).join("");
    return '<p class="psection__intro">' + ui("contactsIntro") + '</p><div class="pgrid pgrid--2">' + items + "</div>";
  }

  function renderMedia() {
    var media = (PD.DATA.shared && PD.DATA.shared.media) || [];
    var items = media.map(function (m) {
      var thumb = m.driveId
        ? "https://drive.google.com/thumbnail?id=" + encodeURIComponent(m.driveId) + "&sz=w800"
        : (m.thumb || "");
      var driveAttr = m.driveId ? ' data-drive-id="' + esc(m.driveId) + '"' : "";
      var driveUrl = m.driveId ? "https://drive.google.com/file/d/" + m.driveId + "/view" : "#";
      return '<div class="pcard pmedia" role="button" tabindex="0"' + driveAttr + ' aria-label="' + esc(L(m.title)) + '">' +
        '<div class="pmedia__thumb pmedia__thumb--video">' +
          (thumb ? '<img src="' + esc(thumb) + '" alt="' + esc(L(m.title)) + '" loading="lazy" referrerpolicy="no-referrer" />' : "") +
          '<span class="pmedia__play">' + ICONS.play + "</span></div>" +
        '<div class="pmedia__body"><b>' + esc(L(m.title)) + "</b><p>" + esc(L(m.desc)) + "</p>" +
          '<span class="pmedia__actions">' +
            '<button class="pbtn pbtn--ghost" type="button" data-media-watch>' + ICONS.play + "<span>" + ui("watch") + "</span></button>" +
            '<a class="pmedia__ext" href="' + driveUrl + '" target="_blank" rel="noopener">' + ui("openDrive") + "</a>" +
          "</span></div>" +
        "</div>";
    }).join("");
    return '<p class="psection__intro">' + ui("mediaIntro") + '</p><div class="pgrid pgrid--3">' + items + "</div>";
  }

  var TABS = [
    { id: "overview", icon: "overview", label: "tabOverview", render: renderOverview },
    { id: "financials", icon: "financials", label: "tabFinancials", render: renderFinancials },
    { id: "dist", icon: "dist", label: "tabDist", render: renderDistributions },
    { id: "photos", icon: "photos", label: "tabPhotos", render: renderPhotos },
    { id: "docs", icon: "docs", label: "tabDocs", render: renderDocuments },
    { id: "contacts", icon: "contacts", label: "tabContacts", render: renderContacts },
    { id: "media", icon: "media", label: "tabMedia", render: renderMedia }
  ];

  function renderDashboard(app) {
    var d = PD.DATA;
    var props = d.properties;
    var p = props[activePropIdx] || props[0];

    /* portfolio summary across all properties */
    var totInvest = 0, totValue = 0, totCash = 0, totEquity = 0, yieldSum = 0;
    props.forEach(function (pr) {
      totInvest += pr.financials.investment;
      totValue += pr.financials.currentValue;
      totCash += pr.financials.netCashflow;
      totEquity += pr.financials.equity;
      yieldSum += pr.financials.cashOnCash;
    });
    var avgYield = props.length ? (yieldSum / props.length).toFixed(1) : 0;

    var countTxt = props.length === 1
      ? ui("portfolioCountOne")
      : ui("portfolioCountMany").replace("{n}", props.length);

    var propPills = props.map(function (pr, i) {
      var meta = [L(pr.city), L(pr.status)].filter(Boolean).join(" · ");
      return '<button class="ppill' + (i === activePropIdx ? " is-active" : "") + '" type="button" data-prop="' + i + '"' +
          (i === activePropIdx ? ' aria-current="true"' : "") + ">" +
        '<span class="ppill__name">' + esc(L(pr.name)) + "</span>" +
        '<span class="ppill__meta">' + esc(meta) + "</span>" +
        "</button>";
    }).join("");

    var tabsNav = TABS.map(function (t) {
      return '<button class="ptab' + (t.id === activeTab ? " is-active" : "") + '" data-tab="' + t.id + '">' +
        ICONS[t.icon] + "<span>" + ui(t.label) + "</span></button>";
    }).join("");

    var activeDef = TABS.filter(function (t) { return t.id === activeTab; })[0] || TABS[0];

    var adminBar = "";
    if (IS_ADMIN) {
      if (INVESTOR_LIST.length) {
        var opts = INVESTOR_LIST.map(function (i) {
          return '<option value="' + esc(i.key) + '"' + (i.key === ADMIN_VIEW_KEY ? " selected" : "") + ">" +
            esc(L(i.name)) + " — " + esc(i.key) + "</option>";
        }).join("");
        adminBar =
          '<div class="padminbar">' +
            '<div class="padminbar__tag">' + ICONS.shield + "<span>" + ui("adminMode") + "</span></div>" +
            '<label class="padminbar__pick"><span>' + ui("adminViewing") + "</span>" +
              '<select id="admin-investor" aria-label="' + esc(ui("adminViewing")) + '">' + opts + "</select>" +
            "</label>" +
          "</div>";
      } else {
        // Fallback: admin viewing own record because the investor list
        // query is not yet permitted. Show the badge without the picker.
        adminBar =
          '<div class="padminbar">' +
            '<div class="padminbar__tag">' + ICONS.shield + "<span>" + ui("adminMode") + "</span></div>" +
          "</div>";
      }
    }

    app.innerHTML =
      '<section class="pdash">' +
        '<div class="container">' +
          adminBar +
          '<div class="pdash__top">' +
            '<div><span class="pdash__hello">' + ui("welcome") + ", <b>" + esc(L(d.investor.name)) + "</b></span>" +
              '<span class="pdash__since">' + ui("investorSince") + " " + esc(L(d.investor.since)) + "</span></div>" +
            '<div class="pdash__topactions">' +
              '<button class="pbtn pbtn--ghost" id="portal-logout">' +
                svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>') +
                "<span>" + ui("logout") + "</span></button>" +
            "</div>" +
          "</div>" +

          '<div class="psummary">' +
            sumCard(ui("totalInvested"), money(totInvest)) +
            sumCard(ui("portfolioValue"), money(totValue)) +
            sumCard(ui("totalEquity"), money(totEquity), "accent") +
            sumCard(ui("monthlyCashflow"), money(totCash) + " " + ui("perMonth")) +
            sumCard(ui("avgYield"), avgYield + "%") +
          "</div>" +

          '<div class="pdash__bar">' +
            '<div class="pdash__barhead">' +
              '<span class="pdash__barlabel">' + ui("yourProperties") + "</span>" +
              '<span class="pcount">' + ICONS.overview + "<span>" + esc(countTxt) + "</span></span>" +
            "</div>" +
            '<div class="ppills">' + propPills + "</div>" +
          "</div>" +

          '<nav class="ptabs" aria-label="' + ui("portfolio") + '">' + tabsNav + "</nav>" +

          '<div class="psection" id="psection">' + activeDef.render(p) + "</div>" +
        "</div>" +
      "</section>" +
      '<div class="plightbox" id="plightbox" hidden><button class="plightbox__close" aria-label="close">&times;</button><img alt="" /></div>' +
      '<div class="pvideobox" id="pvideobox" hidden><button class="pvideobox__close" aria-label="close">&times;</button><div class="pvideobox__frame"><iframe title="video" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div></div>';

    attach(app);
  }
  function sumCard(label, value, tone) {
    return '<div class="psum' + (tone ? " psum--" + tone : "") + '"><span class="psum__label">' + esc(label) +
      '</span><span class="psum__value">' + value + "</span></div>";
  }

  function attach(app) {
    /* admin investor picker */
    var asel = app.querySelector("#admin-investor");
    if (asel) asel.addEventListener("change", function () {
      ADMIN_VIEW_KEY = asel.value;
      loadAndRenderInvestor(app, ADMIN_VIEW_KEY);
    });

    /* logout */
    var lo = app.querySelector("#portal-logout");
    if (lo) lo.addEventListener("click", function () {
      var done = function () { window.location.replace("portal.html"); };
      try {
        if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
          firebase.auth().signOut().then(done, done);
          return;
        }
      } catch (e) {}
      done();
    });

    /* property switcher (pills) */
    app.querySelectorAll(".ppill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        var i = parseInt(pill.getAttribute("data-prop"), 10) || 0;
        if (i === activePropIdx) return;
        activePropIdx = i;
        renderDashboard(app);
      });
    });

    /* tabs */
    app.querySelectorAll(".ptab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeTab = btn.getAttribute("data-tab");
        renderDashboard(app);
        var sec = app.querySelector(".ptabs");
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });

    /* financials view toggle (donut / bars / table) — swap views in place */
    app.querySelectorAll(".finseg").forEach(function (seg) {
      seg.addEventListener("click", function () {
        var id = seg.getAttribute("data-finview");
        try { if (window.localStorage) localStorage.setItem("kamir_fin_view", id); } catch (e) {}
        app.querySelectorAll(".finseg").forEach(function (b) {
          var on = b === seg;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        app.querySelectorAll(".finview").forEach(function (v) {
          v.classList.toggle("is-active", v.getAttribute("data-finview") === id);
        });
      });
    });

    /* photo lightbox */
    var lb = app.querySelector("#plightbox");
    var lbImg = lb ? lb.querySelector("img") : null;
    function openLb(src) {
      if (!lb) return;
      lbImg.src = src; lb.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function closeLb() { if (lb) { lb.hidden = true; lbImg.src = ""; document.body.style.overflow = ""; } }
    app.querySelectorAll(".pphoto").forEach(function (fig) {
      fig.addEventListener("click", function () { openLb(fig.getAttribute("data-full")); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(fig.getAttribute("data-full")); }
      });
    });
    if (lb) {
      lb.addEventListener("click", function (e) {
        if (e.target === lb || e.target.classList.contains("plightbox__close")) closeLb();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
    }

    /* demo notice for documents (no real files in demo) */
    app.querySelectorAll("[data-demo-doc]").forEach(function (el) {
      el.addEventListener("click", function () { toast(ui("docDemoMsg")); });
    });

    /* document upload */
    var upInput = app.querySelector("#pupload-input");
    var upZone = app.querySelector("#pupload");
    if (upInput && upZone) {
      var propId = upZone.getAttribute("data-prop");
      upInput.addEventListener("change", function () {
        if (upInput.files && upInput.files.length) {
          handleUpload(upInput.files, propId, upZone);
          upInput.value = "";
        }
      });
      /* drag & drop */
      ["dragenter", "dragover"].forEach(function (ev) {
        upZone.addEventListener(ev, function (e) { e.preventDefault(); upZone.classList.add("is-drag"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        upZone.addEventListener(ev, function (e) { e.preventDefault(); upZone.classList.remove("is-drag"); });
      });
      upZone.addEventListener("drop", function (e) {
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) handleUpload(files, propId, upZone);
      });
    }

    /* media: play Google Drive videos in an embedded modal */
    var vb = app.querySelector("#pvideobox");
    var vbFrame = vb ? vb.querySelector("iframe") : null;
    function openVideo(id) {
      if (!vb || !vbFrame || !id) return;
      vbFrame.src = "https://drive.google.com/file/d/" + id + "/preview";
      vb.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function closeVideo() {
      if (!vb || !vbFrame) return;
      vbFrame.src = "";
      vb.hidden = true;
      document.body.style.overflow = "";
    }
    app.querySelectorAll(".pmedia[data-drive-id]").forEach(function (card) {
      var id = card.getAttribute("data-drive-id");
      function go(e) {
        /* let the "open in Drive" link behave normally */
        if (e.target.closest && e.target.closest(".pmedia__ext")) return;
        e.preventDefault();
        openVideo(id);
      }
      card.addEventListener("click", go);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { go(e); }
      });
    });
    if (vb) {
      vb.addEventListener("click", function (e) {
        if (e.target === vb || e.target.classList.contains("pvideobox__close")) closeVideo();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeVideo(); });
    }
  }

  function uploadPath(propId, name) {
    var user = (typeof firebase !== "undefined" && firebase.auth) ? firebase.auth().currentUser : null;
    var email = ((user && user.email) || "unknown").toLowerCase();
    var safe = name.replace(/[^\w.\-]+/g, "_");
    return "investor-docs/" + email + "/" + (propId || "general") + "/" + Date.now() + "_" + safe;
  }

  function handleUpload(files, propId, zone) {
    var list = zone.querySelector("#pupload-list");
    if (list) list.hidden = false;
    var hasStorage = typeof firebase !== "undefined" && typeof firebase.storage === "function";

    Array.prototype.forEach.call(files, function (file) {
      var row = document.createElement("div");
      row.className = "puprow";
      row.innerHTML = '<span class="puprow__name">' + ICONS.doc + "<span>" + esc(file.name) + "</span></span>" +
        '<span class="puprow__status"></span>';
      if (list) list.appendChild(row);
      var status = row.querySelector(".puprow__status");
      function setStatus(cls, txt) {
        row.className = "puprow " + cls;
        if (status) status.textContent = txt;
      }

      if (!hasStorage) { setStatus("is-pending", ui("uploadUnavailable")); return; }
      if (file.size > 25 * 1024 * 1024) { setStatus("is-error", ui("uploadTooBig")); return; }

      try {
        var ref = firebase.storage().ref(uploadPath(propId, file.name));
        var t = ref.put(file);
        setStatus("is-uploading", "0%");
        t.on("state_changed",
          function (snap) {
            var pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
            if (status) status.textContent = pct + "%";
          },
          function () { setStatus("is-error", ui("uploadFailed")); },
          function () { setStatus("is-done", ui("uploadDone")); }
        );
      } catch (e) {
        setStatus("is-error", ui("uploadFailed"));
      }
    });
  }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("ptoast");
    if (!t) {
      t = document.createElement("div");
      t.id = "ptoast";
      t.className = "ptoast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }

  /* Centered status block for the dashboard page (loading / error). */
  function stateBlock(message, spinner) {
    return '<section class="pdash"><div class="container">' +
      '<div class="pstate">' +
        (spinner ? '<span class="pstate__spinner" aria-hidden="true"></span>' : "") +
        "<p>" + esc(message) + "</p>" +
      "</div></div></section>";
  }

  /* ---- Admin boot: load investor list, then view one investor ---- */
  function bootAdmin(app, user) {
    var ownKey = emailKey(user);
    return loadInvestorList().then(function (list) {
      // list === null -> the investors list query was denied (admin rules
      // not published yet). Fall back to the admin's own record so the
      // dashboard still renders; the picker reappears once rules are live.
      if (!list) {
        INVESTOR_LIST = [];
        ADMIN_VIEW_KEY = ownKey;
        return loadAndRenderInvestor(app, ownKey);
      }
      INVESTOR_LIST = list;
      var hasOwn = list.some(function (i) { return i.key === ownKey; });
      ADMIN_VIEW_KEY = hasOwn ? ownKey : (list[0] ? list[0].key : null);
      if (!ADMIN_VIEW_KEY) { app.innerHTML = adminEmptyBlock(); return; }
      return loadAndRenderInvestor(app, ADMIN_VIEW_KEY);
    });
  }
  function loadAndRenderInvestor(app, key) {
    app.innerHTML = stateBlock(ui("loading"), true);
    return loadInvestorByKey(key).then(function (inv) {
      if (!inv) { app.innerHTML = adminEmptyBlock(); return; }
      activePropIdx = 0;
      activeTab = "overview";
      PD.DATA = { investor: inv.investor, properties: inv.properties, shared: SHARED_CONFIG };
      renderDashboard(app);
    });
  }
  /* Admin view when no investors exist / selected investor has no data. */
  function adminEmptyBlock() {
    var opts = INVESTOR_LIST.map(function (i) {
      return '<option value="' + esc(i.key) + '"' + (i.key === ADMIN_VIEW_KEY ? " selected" : "") + ">" +
        esc(L(i.name)) + " — " + esc(i.key) + "</option>";
    }).join("");
    var bar = INVESTOR_LIST.length
      ? '<div class="padminbar"><div class="padminbar__tag">' + ICONS.shield + "<span>" + ui("adminMode") + "</span></div>" +
          '<label class="padminbar__pick"><span>' + ui("adminViewing") + "</span>" +
          '<select id="admin-investor">' + opts + "</select></label></div>"
      : "";
    setTimeout(function () {
      var app = document.getElementById("portal-app");
      var sel = app && app.querySelector("#admin-investor");
      if (sel) sel.addEventListener("change", function () {
        ADMIN_VIEW_KEY = sel.value;
        loadAndRenderInvestor(app, ADMIN_VIEW_KEY);
      });
      var lo = app && app.querySelector("#portal-logout");
      if (lo) lo.addEventListener("click", function () {
        firebase.auth().signOut().then(function () { window.location.replace("portal.html"); });
      });
    }, 0);
    return '<section class="pdash"><div class="container">' + bar +
      '<div class="pstate"><p>' + esc(ui("adminNoInvestors")) + "</p>" +
      '<button class="pbtn pbtn--ghost" id="portal-logout" style="margin-top:14px">' + ui("logout") + "</button>" +
      "</div></div></section>";
  }

  /* ---- boot ---- */
  document.addEventListener("DOMContentLoaded", function () {
    var loginRoot = document.getElementById("portal-login");
    if (loginRoot) { setupLogin(loginRoot); return; }

    var app = document.getElementById("portal-app");
    if (!app) return;

    if (!initFirebase()) {
      app.innerHTML = stateBlock(ui("configMissing"));
      return;
    }

    app.innerHTML = stateBlock(ui("loading"), true);
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) { window.location.replace("portal.html"); return; }
      loadConfig().then(function (config) {
        SHARED_CONFIG = config;
        return loadAdminEmails().then(function (admins) {
          IS_ADMIN = admins.indexOf(emailKey(user)) !== -1;
          if (IS_ADMIN) return bootAdmin(app, user);
          return loadInvestorByKey(emailKey(user)).then(function (inv) {
            if (!inv) { window.location.replace("portal.html"); return; }
            PD.DATA = { investor: inv.investor, properties: inv.properties, shared: config };
            renderDashboard(app);
          });
        });
      }).catch(function () {
        app.innerHTML = stateBlock(ui("loadError"));
      });
    });
    window.addEventListener("langchange", function () { if (PD.DATA) renderDashboard(app); });
  });
})();
