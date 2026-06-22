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

  /* ---- Firestore data loading ---- */
  function emailKey(user) {
    return (user.email || "").toLowerCase();
  }
  /* Load the signed-in investor's data + shared config from Firestore.
     Resolves with a DATA object (same shape the dashboard renders), or
     null if this account has no investor record (not authorized). */
  function loadPortalData(user) {
    var db = firebase.firestore();
    var ref = db.collection("investors").doc(emailKey(user));
    return ref.get().then(function (inv) {
      if (!inv.exists) return null;
      var info = inv.data() || {};
      return Promise.all([
        ref.collection("properties").get(),
        db.collection("config").doc("contacts").get(),
        db.collection("config").doc("media").get()
      ]).then(function (res) {
        var props = res[0].docs.map(function (d) {
          var data = d.data();
          if (data.id == null) data.id = d.id;
          return data;
        });
        props.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var contacts = res[1].exists ? (res[1].data().items || []) : [];
        var media = res[2].exists ? (res[2].data().items || []) : [];
        return {
          investor: { name: info.name, since: info.since },
          properties: props,
          shared: { contacts: contacts, media: media }
        };
      });
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
      loadPortalData(user).then(function (data) {
        if (data) {
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
    doc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>')
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
      specRow(ui("type"), L(p.specs.type));

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

  function renderFinancials(p) {
    var f = p.financials;
    var rows = [
      [ui("purchasePrice"), money(f.purchasePrice)],
      [ui("currentValue"), money(f.currentValue)],
      [ui("downPayment"), money(f.downPayment)],
      [ui("closingReno"), money(f.closingReno)],
      [ui("investment"), money(f.investment)],
      [ui("loanAmount"), money(f.loanAmount)],
      [ui("leverage"), f.leveragePct + "%"],
      [ui("mortgageBalance"), money(f.mortgageBalance)],
      [ui("equity"), money(f.equity)]
    ].map(function (r) {
      return '<div class="prow"><span>' + esc(r[0]) + "</span><b>" + r[1] + "</b></div>";
    }).join("");

    var monthly = [
      [ui("grossRent"), money(f.grossRent), "pos"],
      [ui("mortgagePay"), "−" + money(f.monthlyMortgage), "neg"],
      [ui("insurance"), "−" + money(f.monthlyInsurance), "neg"],
      [ui("operating"), "−" + money(f.monthlyOperating), "neg"]
    ].map(function (r) {
      return '<div class="prow"><span>' + esc(r[0]) + '</span><b class="' + r[2] + '">' + r[1] + "</b></div>";
    }).join("");
    monthly += '<div class="prow prow--total"><span>' + ui("netCashflow") + "</span><b>" + money(f.netCashflow) + "</b></div>";

    return '<div class="pgrid pgrid--2">' +
        '<div class="pcard"><h3 class="pcard__title">' + ui("keyMetrics") + "</h3>" + rows + "</div>" +
        '<div class="pcard"><h3 class="pcard__title">' + ui("monthlyTable") + "</h3>" + monthly +
          '<p class="pcard__foot">' + ui("cashOnCash") + ": <b>" + f.cashOnCash + "%</b></p></div>" +
      "</div>";
  }

  function renderDistributions(p) {
    var next = null;
    var body = p.distributions.map(function (d) {
      var paid = d.status === "paid";
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
    return '<figure class="pphoto" data-full="' + esc(ph.src) + '" tabindex="0" role="button" aria-label="' + esc(L(ph.caption)) + '">' +
      '<img src="' + esc(ph.src) + '" alt="' + esc(L(ph.caption)) + '" loading="lazy" />' +
      "<figcaption>" + esc(L(ph.caption)) + "</figcaption></figure>";
  }
  function renderPhotos(p) {
    var ext = p.photos.exterior.map(photoFigure).join("");
    var int = p.photos.interior.map(photoFigure).join("");
    return '<div class="pcard"><h3 class="pcard__title">' + ui("photosExterior") + '</h3><div class="pgallery">' + ext + "</div></div>" +
      '<div class="pcard"><h3 class="pcard__title">' + ui("photosInterior") + '</h3><div class="pgallery">' + int + "</div></div>";
  }

  function renderDocuments(p) {
    var items = p.documents.map(function (d) {
      return '<div class="pdoc" data-demo-doc>' +
        '<span class="pdoc__icon">' + ICONS.doc + "</span>" +
        '<span class="pdoc__body"><b>' + esc(L(d.name)) + "</b>" +
          '<span class="pdoc__meta"><span class="pchip pchip--cat">' + ui(d.cat) + "</span> · PDF · " + esc(d.size) + "</span></span>" +
        '<button class="pdoc__dl" type="button" aria-label="' + ui("download") + '">' + ICONS.download + "</button>" +
        "</div>";
    }).join("");
    return '<p class="psection__intro">' + ui("docsIntro") + '</p><div class="pcard pdocs">' + items + "</div>";
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
    var totInvest = 0, totValue = 0, totCash = 0, yieldSum = 0;
    props.forEach(function (pr) {
      totInvest += pr.financials.investment;
      totValue += pr.financials.currentValue;
      totCash += pr.financials.netCashflow;
      yieldSum += pr.financials.cashOnCash;
    });
    var avgYield = props.length ? (yieldSum / props.length).toFixed(1) : 0;

    var propSelector;
    if (props.length > 1) {
      propSelector = '<select class="pselect" id="prop-select">' + props.map(function (pr, i) {
        return '<option value="' + i + '"' + (i === activePropIdx ? " selected" : "") + ">" + esc(L(pr.name)) + "</option>";
      }).join("") + "</select>";
    } else {
      propSelector = '<span class="pchip pchip--cat">' + esc(L(p.name)) + "</span>";
    }

    var tabsNav = TABS.map(function (t) {
      return '<button class="ptab' + (t.id === activeTab ? " is-active" : "") + '" data-tab="' + t.id + '">' +
        ICONS[t.icon] + "<span>" + ui(t.label) + "</span></button>";
    }).join("");

    var activeDef = TABS.filter(function (t) { return t.id === activeTab; })[0] || TABS[0];

    app.innerHTML =
      '<section class="pdash">' +
        '<div class="container">' +
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
            sumCard(ui("monthlyCashflow"), money(totCash) + " " + ui("perMonth")) +
            sumCard(ui("avgYield"), avgYield + "%") +
          "</div>" +

          '<div class="pdash__bar"><span class="pdash__barlabel">' + ui("selectProperty") + ":</span> " + propSelector + "</div>" +

          '<nav class="ptabs" aria-label="' + ui("portfolio") + '">' + tabsNav + "</nav>" +

          '<div class="psection" id="psection">' + activeDef.render(p) + "</div>" +
        "</div>" +
      "</section>" +
      '<div class="plightbox" id="plightbox" hidden><button class="plightbox__close" aria-label="close">&times;</button><img alt="" /></div>' +
      '<div class="pvideobox" id="pvideobox" hidden><button class="pvideobox__close" aria-label="close">&times;</button><div class="pvideobox__frame"><iframe title="video" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div></div>';

    attach(app);
  }
  function sumCard(label, value) {
    return '<div class="psum"><span class="psum__label">' + esc(label) + '</span><span class="psum__value">' + value + "</span></div>";
  }

  function attach(app) {
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

    /* property selector */
    var sel = app.querySelector("#prop-select");
    if (sel) sel.addEventListener("change", function () {
      activePropIdx = parseInt(sel.value, 10) || 0;
      renderDashboard(app);
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
      loadPortalData(user).then(function (data) {
        if (!data) { window.location.replace("portal.html"); return; }
        PD.DATA = data;
        renderDashboard(app);
      }).catch(function () {
        app.innerHTML = stateBlock(ui("loadError"));
      });
    });
    window.addEventListener("langchange", function () { if (PD.DATA) renderDashboard(app); });
  });
})();
