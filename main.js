/* The Baez Lending Team · site behaviour (no libraries) */
(function () {
  "use strict";
  var CFG = window.BAEZ_CONFIG || {};
  var I18N = window.BAEZ_I18N || { es: {}, dyn: { en: {}, es: {} } };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= language ================= */
  var lang = "en";
  var EN = {}; var enAttr = []; var enTitle = document.title;
  var metaDesc = $('meta[name="description"]'); var enDesc = metaDesc ? metaDesc.content : "";
  $$("[data-i18n]").forEach(function (el) { var k = el.getAttribute("data-i18n"); if (!(k in EN)) EN[k] = el.innerHTML; });
  $$("[data-i18n-attr]").forEach(function (el) {
    el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
      var p = pair.split(":"); enAttr.push({ el: el, attr: p[0], key: p[1], en: el.getAttribute(p[0]) });
    });
  });
  var PAGE_ES = { title: document.body.getAttribute("data-title-es"), desc: document.body.getAttribute("data-desc-es") };

  function t(key) { var d = I18N.dyn[lang] || I18N.dyn.en; var v = d[key] != null ? d[key] : I18N.dyn.en[key]; return typeof v === "string" ? v.replace(/info@(obaez\.net|thebaezlendingteam\.com)/g, CFG.email || "info@thebaezlendingteam.com") : v; }

  function setLang(next, save) {
    lang = next === "es" ? "es" : "en";
    var dict = lang === "es" ? I18N.es : EN;
    $$("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n"); var v = dict[k] != null ? dict[k] : EN[k];
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    enAttr.forEach(function (a) { a.el.setAttribute(a.attr, lang === "es" && I18N.es[a.key] ? I18N.es[a.key] : a.en); });
    document.documentElement.lang = lang;
    document.title = lang === "es" && PAGE_ES.title ? PAGE_ES.title : enTitle;
    if (metaDesc) metaDesc.content = lang === "es" && PAGE_ES.desc ? PAGE_ES.desc : enDesc;
    $$("[data-lang-toggle]").forEach(function (b) {
      var other = lang === "es" ? "en" : "es";
      b.textContent = other === "es" ? "Español" : "English";
      b.setAttribute("lang", other);
      b.setAttribute("aria-label", other === "es" ? "Ver este sitio en español" : "View this site in English");
    });
    $$("a.js-keep-lang").forEach(function (a) {
      var base = a.getAttribute("href").split("?")[0].split("#");
      a.setAttribute("href", base[0] + (lang === "es" ? "?lang=es" : "") + (base[1] ? "#" + base[1] : ""));
    });
    var fl = $("#f-lang"); if (fl && !fl.dataset.touched) fl.value = lang === "es" ? "Español" : "English";
    if (save) { try { localStorage.setItem("baez-lang", lang); } catch (e) {} }
    if (save) {
      try { var u = new URL(location.href); if (lang === "es") u.searchParams.set("lang", "es"); else u.searchParams.delete("lang"); history.replaceState(null, "", u); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("baez:lang"));
  }
  $$("[data-lang-toggle]").forEach(function (b) { b.addEventListener("click", function () { setLang(lang === "es" ? "en" : "es", true); }); });
  var initial = "en";
  try {
    var q = new URLSearchParams(location.search).get("lang");
    var stored = localStorage.getItem("baez-lang");
    if (q === "es" || q === "en") initial = q; else if (stored) initial = stored;
    else if ((navigator.language || "").toLowerCase().indexOf("es") === 0) initial = "es";
  } catch (e) {}
  setLang(initial, false);
  var fLang = $("#f-lang"); if (fLang) fLang.addEventListener("change", function () { fLang.dataset.touched = "1"; });

  /* ================= integrations ================= */
  if (CFG.applyUrl) {
    $$(".js-apply, .js-apply-url").forEach(function (a) { a.href = CFG.applyUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.hidden = false; if ($("#newtab-note")) a.setAttribute("aria-describedby", "newtab-note"); });
    $$(".js-apply-ready").forEach(function (el) { el.hidden = false; });
    $$(".js-apply-pending, .js-apply-call").forEach(function (el) { el.hidden = true; });
  }
  if (CFG.bookingUrl) {
    $$(".js-book").forEach(function (a) { a.href = CFG.bookingUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.removeAttribute("data-topic"); });
  }

  /* contact details from config.js: email and WhatsApp */
  var EMAIL = CFG.email || "info@thebaezlendingteam.com";
  $$('a[href^="mailto:"]').forEach(function (a) { a.href = "mailto:" + EMAIL; if (!a.children.length && a.textContent.indexOf("@") > -1) a.textContent = EMAIL; });
  $$(".js-email-text").forEach(function (el) { el.textContent = EMAIL; });
  var WA = String(CFG.whatsapp || "").replace(/[^0-9]/g, "");
  function waLink(text) { return "https://wa.me/" + WA + (text ? "?text=" + encodeURIComponent(text) : ""); }
  if (WA) {
    $$(".js-wa").forEach(function (a) { a.href = waLink(""); var n = $(".js-wa-num", a) || a; n.textContent = WA.replace(/^1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3"); });
    $$(".js-wa-row").forEach(function (el) { el.hidden = false; });
  } else {
    $$(".js-wa-row, .js-wa-chat").forEach(function (el) { el.hidden = true; });
  }

  function setWaChats() { if (!WA) return; $$(".js-wa-chat").forEach(function (a) { a.href = waLink(t(a.getAttribute("data-wa-msg") || "waMsgHello")); }); }
  setWaChats(); document.addEventListener("baez:lang", setWaChats);

  /* topic prefill: any link with data-topic opens the form on that subject */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-topic]");
    if (!a) return;
    var sel = $("#f-topic"); if (!sel) return;
    sel.value = a.getAttribute("data-topic");
    setTimeout(function () { var n = $("#f-name"); if (n) n.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 650);
  });

  /* ================= header / nav ================= */
  var head = $(".site-head"); var nav = $("#nav"); var menuBtn = $(".menu-btn");
  var wideNav = window.matchMedia("(min-width: 1181px)");
  var subs = $$(".nav .has-sub");
  function setSub(li, open) {
    li.classList.toggle("open", open);
    var b = $(".nav-drop", li); if (b) b.setAttribute("aria-expanded", String(open));
  }
  function closeSubs(except) { subs.forEach(function (li) { if (li !== except) setSub(li, false); }); }
  function closeMenu() { closeSubs(); if (!nav) return; nav.classList.remove("open"); if (menuBtn) menuBtn.setAttribute("aria-expanded", "false"); }
  subs.forEach(function (li) {
    var b = $(".nav-drop", li), t = null;
    b.addEventListener("click", function () { var open = !li.classList.contains("open"); closeSubs(li); setSub(li, open); });
    /* desktop: open on hover too, with a short grace period so the menu doesn't flicker */
    li.addEventListener("mouseenter", function () { if (!wideNav.matches || !window.matchMedia("(hover: hover)").matches) return; clearTimeout(t); closeSubs(li); setSub(li, true); });
    li.addEventListener("mouseleave", function () { if (!wideNav.matches) return; clearTimeout(t); t = setTimeout(function () { setSub(li, false); }, 160); });
    li.addEventListener("focusout", function (e) { if (wideNav.matches && !li.contains(e.relatedTarget)) setSub(li, false); });
  });
  document.addEventListener("click", function (e) { if (wideNav.matches && !e.target.closest(".has-sub")) closeSubs(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openLi = subs.filter(function (li) { return li.classList.contains("open"); })[0];
    if (openLi) { setSub(openLi, false); $(".nav-drop", openLi).focus(); return; }
    if (nav && nav.classList.contains("open")) { closeMenu(); if (menuBtn) menuBtn.focus(); }
  });
  if (nav) nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = !nav.classList.contains("open");
      if (!open) closeSubs();
      nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open));
      if (open) { var f = $(".nav-top", nav); if (f) f.focus(); }
    });
    window.addEventListener("resize", function () { if (wideNav.matches) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });
  }

  /* current section: underline the matching top-level item */
  var navTops = $$(".nav .nav-top");
  if ("IntersectionObserver" in window && navTops.length) {
    var map = {};
    navTops.forEach(function (el) {
      var id = el.getAttribute("data-sec") || ((el.getAttribute("href") || "").charAt(0) === "#" ? el.getAttribute("href").slice(1) : "");
      if (id && id !== "top") map[id] = el;
    });
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = map[en.target.id]; if (!el || !en.isIntersecting) return;
        navTops.forEach(function (x) { x.removeAttribute("aria-current"); }); el.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var sec = document.getElementById(id); if (sec) secIO.observe(sec); });
  }

  /* reveal on scroll */
  if ("IntersectionObserver" in window) {
    var rIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rIO.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { rIO.observe(el); });
  } else { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); }
  requestAnimationFrame(function () { document.documentElement.classList.add("loaded"); });

  /* scroll-linked: header shadow and the phone Call / Apply bar (shown once the hero is passed) */
  var heroBox = $(".hero"); var mbar = $(".mobile-bar");
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (head) head.classList.toggle("is-scrolled", window.scrollY > 8);
    if (mbar && heroBox) mbar.classList.toggle("show", heroBox.getBoundingClientRect().bottom < window.innerHeight * 0.4);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* loan programs: each one is switched on in config.js only after Oscar / Capstone confirm it.
     "on" = shown, "off" = removed, "pending" = shown only while reviewMode is true. */
  var PROG = CFG.programs || {};
  var anyPending = false;
  $$(".menu-item[data-program]").forEach(function (item) {
    var st = PROG[item.getAttribute("data-program")] || "pending";
    if (st === "pending") anyPending = true;
    if (st === "off" || (st === "pending" && !CFG.reviewMode)) item.remove();
  });
  $$(".menu-col[data-fam]").forEach(function (col) { if (!col.querySelector(".menu-item")) col.remove(); });
  /* other services in the menu and form follow the same rule */
  var SERV = CFG.services || {};
  $$("[data-service]").forEach(function (el) {
    var st = SERV[el.getAttribute("data-service")] || "pending";
    if (st === "off" || (st === "pending" && !CFG.reviewMode)) el.remove();
  });
  var reviewNote = $("#loans-review"); if (reviewNote) reviewNote.hidden = !(CFG.reviewMode && anyPending);
  /* the contact form only lists loan topics that are still on the page */
  $$("#f-topic option").forEach(function (opt) {
    var isProgram = { conventional: 1, fha: 1, va: 1, jumbo: 1, first: 1, second: 1, nonqm: 1, itin: 1, dscr: 1, foreign: 1 }[opt.value];
    if (isProgram && !document.querySelector('.menu-item [data-topic="' + opt.value + '"]')) opt.remove();
  });

  /* loan index: picking a loan shows its details and photo (inline on phones) */
  var liItems = $$("#li-list .menu-item"), liImg = $("#li-img"), liCopy = $("#li-panel-copy"), liCurrent = null;
  var liTabs = $$(".li-tab"), curGroup = null;
  function showGroup(g, keepSelection) {
    if (!g || g === curGroup) return;
    curGroup = g;
    liTabs.forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-group") === g)); });
    liItems.forEach(function (it) { it.hidden = it.getAttribute("data-group") !== g; });
    if (!keepSelection) { var first = liItems.filter(function (it) { return !it.hidden && !it.classList.contains("dim"); })[0] || liItems.filter(function (it) { return !it.hidden; })[0]; if (first) selectLoan(first); }
  }
  function selectLoan(item, focus) {
    if (!item) return;
    liCurrent = item;
    liItems.forEach(function (it) { var on = it === item; it.classList.toggle("active", on); it.querySelector(".li-btn").setAttribute("aria-expanded", String(on)); });
    if (liImg && item.getAttribute("data-img")) {
      liImg.classList.remove("in"); liImg.srcset = item.getAttribute("data-srcset") || ""; liImg.src = item.getAttribute("data-img");
      requestAnimationFrame(function () { liImg.classList.add("in"); });
    }
    showGroup(item.getAttribute("data-group"), true);
    if (liCopy) {
      liCopy.innerHTML = "<p class='li-panel-fam'>" + item.querySelector(".li-fam").textContent + "</p><h3>" + item.querySelector(".li-name").textContent + "</h3>" + item.querySelector(".li-detail").innerHTML;
    }
  }
  liItems = liItems.filter(function (it) { return document.body.contains(it); });
  liItems.forEach(function (it) {
    it.querySelector(".li-btn").addEventListener("click", function () { selectLoan(it); });
    it.querySelector(".li-btn").addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover) and (min-width: 1001px)").matches) selectLoan(it); });
  });
  /* tabs: count what is actually on the page; hide a group with nothing confirmed */
  liTabs.forEach(function (b) {
    var g = b.getAttribute("data-group"), n = liItems.filter(function (it) { return it.getAttribute("data-group") === g; }).length;
    var c = $(".li-tab-n", b); if (c) c.textContent = n;
    if (!n) b.hidden = true;
    b.addEventListener("click", function () { showGroup(g); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var vis = liTabs.filter(function (x) { return !x.hidden; }), i = vis.indexOf(b) + (e.key === "ArrowRight" ? 1 : -1);
      var nb = vis[(i + vis.length) % vis.length]; nb.focus(); nb.click();
    });
  });
  selectLoan(liItems[0]);

  /* "What are you trying to do?" highlights the matching loan options */
  var chip = $("#intent-chip"), chipName = $("#intent-name");
  function setIntent(key, label) {
    var first = null;
    liItems.forEach(function (it) {
      var match = !key || (it.getAttribute("data-intents") || "").split(" ").indexOf(key) > -1;
      it.classList.toggle("dim", !match); it.classList.toggle("match", !!key && match);
      if (match && !first) first = it;
    });
    if (first) selectLoan(first);
    if (chip) { chip.hidden = !key; if (chipName) chipName.textContent = label || ""; }
  }
  $$("[data-intent]").forEach(function (a) {
    a.addEventListener("click", function () {
      var key = a.getAttribute("data-intent"), lab = a.querySelector("b") || $('.intent-col[data-intent="' + key + '"] b') || a;
      setIntent(key, lab.textContent);
    });
  });
  /* Loan Options menu: built from the programs that are actually on the page (confirmed, or preview) */
  var subLoans = $("#sub-loans-list");
  function buildLoanMenu() {
    if (!subLoans) return;
    subLoans.innerHTML = "";
    liItems.forEach(function (it) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#loans"; a.setAttribute("data-loan", it.getAttribute("data-program"));
      a.textContent = it.querySelector(".li-name").textContent;
      li.appendChild(a); subLoans.appendChild(li);
    });
    subLoans.hidden = !liItems.length;
  }
  buildLoanMenu();
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-loan]"); if (!a) return;
    setIntent(null);
    var it = $('#li-list .menu-item[data-program="' + a.getAttribute("data-loan") + '"]'); if (it) selectLoan(it);
  });
  var clr = $("#intent-clear"); if (clr) clr.addEventListener("click", function () { setIntent(null); });
  document.addEventListener("baez:lang", function () { setIntent(null); selectLoan(liItems[0]); buildLoanMenu(); });

  /* controlled motion: the hero path draws you toward the door; big photos drift slightly (off with Reduce Motion) */
  var doorImg = $(".door-img"), heroSec = $(".hero"), plx = $$(".parallax");
  var pathLine = $("#path-line"), pathSteps = pathLine ? $$("li", pathLine) : [], aboutCut = $(".about-cut");
  var desktopMotion = window.matchMedia("(min-width: 1001px) and (hover: hover)");

  /* closing day: Oscar's message starts by itself (muted, subtitles are in the video) as soon as the
     section is on screen; tap the sound button for audio. When it finishes, the celebration reel plays next.
     Not with Reduce Motion or Data Saver. */
  var firstClip = $(".js-firstclip"), nextClip = $(".js-nextclip"), clipsMedia = $(".closings-media");
  var saveData = navigator.connection && navigator.connection.saveData;
  var userTook = false; /* once the visitor presses play/pause themselves, we stop auto-playing */
  $$(".closings .clip-play, .closings .clip-sound, .closings video").forEach(function (el) { el.addEventListener("click", function () { userTook = true; }); });
  if (firstClip && clipsMedia && "IntersectionObserver" in window && !reduceMotion.matches && !saveData) {
    var clipIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          firstClip.preload = "auto";
          if (!userTook && firstClip.paused && (!nextClip || nextClip.paused)) { firstClip.muted = true; var pr = firstClip.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } else if (!userTook) {
          [firstClip, nextClip].forEach(function (v) { if (v && !v.paused && v.muted) v.pause(); });
        }
      });
    }, { threshold: 0.4 });
    clipIO.observe(clipsMedia);
    /* get the first video ready a little before the visitor arrives */
    var warmIO = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { firstClip.preload = "auto"; warmIO.disconnect(); } }, { rootMargin: "800px 0px" });
    warmIO.observe(clipsMedia);
    if (nextClip) firstClip.addEventListener("ended", function () { if (!userTook) { nextClip.muted = true; var p2 = nextClip.play(); if (p2 && p2.catch) p2.catch(function () {}); } });
  }

  /* custom controls: one tap plays (with sound for Oscar's message), tap again pauses;
     a video with sound pauses the others; when it ends it goes back to its cover picture */
  $$(".closings .clip-frame").forEach(function (fr) {
    var v = $("video", fr), play = $(".clip-play", fr), snd = $(".clip-sound", fr), bar = $(".clip-bar i", fr);
    if (!v) return;
    function soundIcon() { if (!snd) return; $("use", snd).setAttribute("href", v.muted ? "#i-mute" : "#i-sound"); snd.setAttribute("aria-label", t(v.muted ? "soundOn" : "soundOff")); var tt = $(".clip-sound-t", snd); if (tt) tt.hidden = !v.muted; }
    function start(withSound) {
      v.preload = "auto";
      if (withSound) v.muted = false;
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () { v.muted = true; v.play(); });
      soundIcon();
    }
    if (play) play.addEventListener("click", function () { start(true); });
    v.addEventListener("click", function () { if (v.paused) start(true); else v.pause(); });
    if (snd) snd.addEventListener("click", function (e) { e.stopPropagation(); v.muted = !v.muted; if (v.paused) start(!v.muted); soundIcon(); });
    v.addEventListener("play", function () {
      fr.classList.add("playing"); if (snd) snd.hidden = false;
      if (!v.muted) $$(".closings video").forEach(function (o) { if (o !== v && !o.paused) o.pause(); });
    });
    v.addEventListener("pause", function () { fr.classList.remove("playing"); });
    v.addEventListener("volumechange", function () { soundIcon(); if (!v.muted && !v.paused) $$(".closings video").forEach(function (o) { if (o !== v && !o.paused) o.pause(); }); });
    v.addEventListener("timeupdate", function () { if (bar && v.duration) bar.style.transform = "scaleX(" + (v.currentTime / v.duration).toFixed(4) + ")"; });
    v.addEventListener("ended", function () { fr.classList.remove("playing"); if (bar) bar.style.transform = "scaleX(0)"; v.load(); });
  });


  /* desktop only: sections rise in as you reach them, the four doorways one after another */
  if (desktopMotion.matches && !reduceMotion.matches && "IntersectionObserver" in window) {
    var rvTargets = [".intent-head", ".calc-head", ".loans-head", ".loan-index", ".about-copy", ".about-figure", ".start-card", ".contact-info", ".contact-form", ".path-card"];
    rvTargets.forEach(function (sel) { $$(sel).forEach(function (el) { el.classList.add("rv"); }); });
    $$(".intent-strip li").forEach(function (li, i) { li.classList.add("rv"); li.style.setProperty("--d", (i * 0.09).toFixed(2) + "s"); });
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rvIO.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    $$(".rv").forEach(function (el) { rvIO.observe(el); });
  }
  var mticking = false;
  function motion() {
    mticking = false;
    var vh = window.innerHeight;
    /* the path home fills in step by step as it crosses the screen */
    var pr = pathLine ? pathLine.getBoundingClientRect() : null;
    if (pr && (reduceMotion.matches || (pr.bottom > -vh && pr.top < vh * 2))) {
      var p = reduceMotion.matches ? 1 : Math.min(1, Math.max(0, (vh * 0.82 - pr.top) / (pr.height + vh * 0.35)));
      pathLine.style.setProperty("--p", p.toFixed(3));
      pathSteps.forEach(function (li, i) { li.classList.toggle("on", p >= i / Math.max(1, pathSteps.length - 1) - 0.001); });
      var lastNode = pathSteps.length ? pathSteps[pathSteps.length - 1].querySelector(".node") : null;
      if (lastNode) {
        var nr = lastNode.getBoundingClientRect();
        pathLine.style.setProperty("--pe-x", Math.max(0, pr.right - (nr.left + nr.width / 2)).toFixed(0) + "px");
        pathLine.style.setProperty("--pe-y", Math.max(0, pr.bottom - (nr.top + nr.height / 2)).toFixed(0) + "px");
      }
    }
    if (reduceMotion.matches) return;
    if (aboutCut && desktopMotion.matches) {
      var ar = aboutCut.getBoundingClientRect();
      if (ar.bottom > -50 && ar.top < vh + 50) aboutCut.style.transform = "translateY(" + (((ar.top + ar.height / 2 - vh / 2) / vh) * -18).toFixed(1) + "px)";
    }
    if (doorImg && heroSec) {
      var hr = heroSec.getBoundingClientRect();
      var hp = Math.min(1, Math.max(0, -hr.top / Math.max(1, hr.height)));
      doorImg.style.transform = "scale(" + (1.04 + 0.16 * hp).toFixed(4) + ") translateY(" + (hp * 4).toFixed(2) + "%)";
    }
    if (desktopMotion.matches) plx.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = "translateY(" + (c * -6).toFixed(2) + "%) scale(1.14)";
    });
  }
  window.addEventListener("scroll", function () { if (!mticking) { mticking = true; requestAnimationFrame(motion); } }, { passive: true });
  window.addEventListener("resize", motion);
  motion();

  /* facts that should never go stale */
  (function () {
    var since = new Date((CFG.licensedSince || "2012-10-08") + "T00:00:00"); var now = new Date();
    var yrs = now.getFullYear() - since.getFullYear();
    if (now.getMonth() < since.getMonth() || (now.getMonth() === since.getMonth() && now.getDate() < since.getDate())) yrs--;
    $$(".js-years").forEach(function (el) { el.textContent = yrs; });
    $$(".js-year").forEach(function (el) { el.textContent = now.getFullYear(); });
  })();

  /* ================= calculator ================= */
  var form = $("#calc-form");
  if (form) (function () {
    var el = {
      price: $("#c-price"), priceR: $("#c-price-r"), down: $("#c-down"), downP: $("#c-down-p"), downR: $("#c-down-r"),
      rate: $("#c-rate"), tax: $("#c-tax"), ins: $("#c-ins"), hoa: $("#c-hoa"), mi: $("#c-mi"),
      total: $("#c-total"), list: $("#c-break"), facts: $("#c-facts"), warn: $("#c-warn"), bar: $("#c-bar"), send: $("#c-send"), tierImgs: $$("#fd-photos img"), tierLabel: $("#fd-tier"), credit: $("#fd-credit"), style: $("#fd-style"), out: $("#c-price-out")
    };
    var TAX_RATE = 0.019;
    var state = { taxEdited: false, miEdited: false };
    /* price ranges for the illustrative home photos: [upper bound, tier, photographer] */
    var TIERS = [[250000, 1, "Dmytro Koplyk / Unsplash"], [450000, 2, "Ace King / Unsplash"], [750000, 3, "Camilo / Pexels"], [1000000, 4, "Brendon Spring / Pexels"], [Infinity, 5, "Vincent Rivaud / Pexels"]];
    var lastTier = null;
    /* the big price slider is logarithmic ($100K to $2M+) so every budget range gets room */
    var PMIN = 100000, PMAX = 2000000;
    function sliderToPrice(v) { return Math.round(PMIN * Math.pow(PMAX / PMIN, v / 1000) / 5000) * 5000; }
    function priceToSlider(p) { p = Math.min(PMAX, Math.max(PMIN, p || PMIN)); return Math.round(1000 * Math.log(p / PMIN) / Math.log(PMAX / PMIN)); }
    /* stage position: each range boundary sits exactly halfway between two homes, so the next home
       opens right where the budget label changes; inside a range the home slowly comes closer */
    var KNOTS = [[PMIN, 0.5], [250000, 1.5], [450000, 2.5], [750000, 3.5], [1000000, 4.5], [PMAX, 5.5]];
    function stagePos(price) {
      var lp = Math.log(Math.min(PMAX, Math.max(PMIN, price)));
      for (var i = 1; i < KNOTS.length; i++) {
        var a = Math.log(KNOTS[i - 1][0]), b = Math.log(KNOTS[i][0]);
        if (lp <= b) return KNOTS[i - 1][1] + (lp - a) / (b - a) * (KNOTS[i][1] - KNOTS[i - 1][1]);
      }
      return 5.5;
    }
    /* tick labels sit at their real place on the logarithmic slider */
    $$(".ticks span[data-p]").forEach(function (s) { s.style.left = (100 * Math.log(+s.getAttribute("data-p") / PMIN) / Math.log(PMAX / PMIN)).toFixed(2) + "%"; });
    function paintStage(price) {
      if (!el.tierImgs.length) return;
      var pos = stagePos(price);
      var posO = Math.min(5, Math.max(1, pos));
      var base = Math.floor(posO), frac = posO - base, still = reduceMotion.matches;
      var ss = function (e0, e1, x) { x = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return x * x * (3 - 2 * x); };
      /* the next home is revealed by a door opening from the center, driven by the slider */
      var open = still ? (frac >= 0.5 ? 1 : 0) : ss(0.3, 0.7, frac);
      el.tierImgs.forEach(function (img) {
        var k = +img.getAttribute("data-tier"), show = k <= base || (k === base + 1 && open > 0);
        if (k < base - 1) show = false;
        img.style.opacity = show ? "1" : "0";
        img.style.clipPath = (k === base + 1 && open < 1) ? "inset(0 " + (50 * (1 - open)).toFixed(2) + "% 0 " + (50 * (1 - open)).toFixed(2) + "%)" : "none";
        var d = Math.min(1, Math.max(0, pos - k + 0.5));
        img.style.transform = still ? "none" : "scale(" + (1.02 + 0.08 * d).toFixed(4) + ")";
        if (show && img.loading === "lazy") img.loading = "eager";
      });
    }
    var money0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    var num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
    function parse(v) { var n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; }
    function fmtInput(input) { var n = parse(input.value); input.value = n ? num0.format(Math.round(n)) : "0"; }
    function round(n, d) { var m = Math.pow(10, d); return Math.round(n * m) / m; }
    function type() { return form.querySelector('input[name="c-type"]:checked').value; }
    function term() { return +form.querySelector('input[name="c-term"]:checked').value; }
    function setFill(r) { r.style.setProperty("--fill", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); }

    function autoMi(ltv) {
      var tp = type();
      if (tp === "conv") return ltv > 80 ? 0.5 : 0;
      if (tp === "fha") return ltv > 95 ? 0.55 : 0.5;
      return 0;
    }
    function upfrontRate(downPct) {
      var tp = type();
      if (tp === "fha") return 0.0175;
      if (tp === "va") return downPct < 5 ? 0.0215 : downPct < 10 ? 0.015 : 0.0125;
      return 0;
    }

    var shown = 0; var anim = null;
    function showTotal(v) {
      if (anim) cancelAnimationFrame(anim);
      clearTimeout(showTotal.done);
      showTotal.done = setTimeout(function () { if (anim) cancelAnimationFrame(anim); shown = v; el.total.innerHTML = money0.format(v) + "<small>" + t("mo") + "</small>"; }, 600);
      if (reduceMotion.matches || document.hidden) { shown = v; el.total.innerHTML = money0.format(v) + "<small>" + t("mo") + "</small>"; return; }
      var from = shown, start = performance.now(), dur = 520;
      (function step(now) {
        var k = Math.min(1, (now - start) / dur); k = 1 - Math.pow(1 - k, 3);
        shown = from + (v - from) * k;
        el.total.innerHTML = money0.format(Math.round(shown)) + "<small>" + t("mo") + "</small>";
        if (k < 1) anim = requestAnimationFrame(step);
      })(start);
    }

    var last = null;
    function calc() {
      var price = parse(el.price.value);
      var down = Math.min(parse(el.down.value), price);
      var downPct = price ? down / price * 100 : 0;
      var rate = parse(el.rate.value);
      var n = term() * 12;
      var base = Math.max(0, price - down);
      var ltv = price ? base / price * 100 : 0;
      if (!state.miEdited) el.mi.value = String(autoMi(ltv));
      var up = upfrontRate(downPct);
      var loan = base * (1 + up);
      var r = rate / 100 / 12;
      var pi = loan <= 0 ? 0 : (r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n)));
      var tax = parse(el.tax.value) / 12;
      var ins = parse(el.ins.value) / 12;
      var hoa = parse(el.hoa.value);
      var mi = base * parse(el.mi.value) / 100 / 12;
      var parts = [["pi", pi], ["tax", tax], ["ins", ins], ["hoa", hoa], ["mi", mi]];
      var total = pi + tax + ins + hoa + mi;
      last = { price: price, down: down, downPct: downPct, rate: rate, years: term(), type: type(), loan: loan, up: up, parts: parts, total: total, ltv: ltv };

      showTotal(Math.round(total));
      el.list.innerHTML = parts.map(function (p) {
        return '<li class="' + (p[1] < 0.5 ? "zero" : "") + '"><span class="dot dot-' + p[0] + '"></span><span>' + t(p[0]) + "</span><b>" + money0.format(Math.round(p[1])) + "</b></li>";
      }).join("");
      var interest = Math.max(0, pi * n - loan);
      var upNote = up ? '<div><dt>' + t(type() === "fha" ? "upfrontFha" : "upfrontVa") + "</dt><dd>" + money0.format(Math.round(base * up)) + "</dd></div>" : "";
      el.facts.innerHTML =
        "<div><dt>" + t("loan") + "</dt><dd>" + money0.format(Math.round(loan)) + "</dd></div>" +
        "<div><dt>" + t("down") + "</dt><dd>" + money0.format(Math.round(down)) + " · " + round(downPct, 1) + "%</dd></div>" +
        "<div><dt>" + t("ltv") + "</dt><dd>" + round(ltv, 1) + "%</dd></div>" +
        "<div><dt>" + t("interest") + "</dt><dd>" + money0.format(Math.round(interest)) + "</dd></div>" + upNote;

      /* payment bar: each part's share of the monthly total */
      parts.forEach(function (p, i) {
        var seg = el.bar && el.bar.children[i];
        if (seg) seg.style.width = (total > 0 ? p[1] / total * 100 : 0).toFixed(2) + "%";
      });

      /* signature: from payment to front door. The neighborhood changes with the price. */
      var tier = TIERS.filter(function (x) { return price < x[0]; })[0] || TIERS[TIERS.length - 1];
      paintStage(price);
      if (tier !== lastTier) { lastTier = tier; if (el.credit) el.credit.textContent = "Photo: " + tier[2]; }
      if (el.tierLabel) el.tierLabel.textContent = t("tier" + tier[1]);
      if (el.style) el.style.textContent = t("style" + tier[1]);
      if (el.out) el.out.textContent = money0.format(price);
      var mini = $("#c-mini-total");
      if (mini) mini.innerHTML = money0.format(Math.round(total)) + "<small>" + t("mo") + "</small>";

      var w = "";
      if (!price) w = t("warnPrice");
      else if (el.rate.value.trim() === "") w = t("warnRate");
      else if (type() === "fha" && downPct < 3.5) w = t("warnFha");
      else if (type() === "conv" && downPct < 3) w = t("warnConv");
      el.warn.textContent = w; el.warn.hidden = !w;
      el.price.parentNode.classList.toggle("invalid", !price);
      el.rate.parentNode.classList.toggle("invalid", el.rate.value.trim() === "");
    }

    function syncDownFromPct() { var p = Math.min(100, parse(el.downP.value)); el.down.value = num0.format(Math.round(parse(el.price.value) * p / 100)); }
    function syncPctFromDown() { var price = parse(el.price.value); var p = price ? parse(el.down.value) / price * 100 : 0; el.downP.value = String(round(p, 2)); el.downR.value = p; setFill(el.downR); }
    function autoTax() { if (!state.taxEdited) el.tax.value = num0.format(Math.round(parse(el.price.value) * TAX_RATE)); }

    el.price.addEventListener("input", function () { el.priceR.value = priceToSlider(parse(el.price.value)); setFill(el.priceR); syncDownFromPct(); autoTax(); calc(); });
    el.priceR.addEventListener("input", function () { el.price.value = num0.format(sliderToPrice(+el.priceR.value)); setFill(el.priceR); syncDownFromPct(); autoTax(); calc(); });
    el.down.addEventListener("input", function () { syncPctFromDown(); calc(); });
    el.downP.addEventListener("input", function () { el.downR.value = parse(el.downP.value); setFill(el.downR); syncDownFromPct(); calc(); });
    el.downR.addEventListener("input", function () { el.downP.value = el.downR.value; setFill(el.downR); syncDownFromPct(); calc(); });
    el.tax.addEventListener("input", function () { state.taxEdited = true; calc(); });
    el.mi.addEventListener("input", function () { state.miEdited = true; calc(); });
    [el.rate, el.ins, el.hoa].forEach(function (i) { i.addEventListener("input", calc); });
    $$('input[name="c-type"]', form).forEach(function (i) { i.addEventListener("change", function () { state.miEdited = false; calc(); }); });
    $$('input[name="c-term"]', form).forEach(function (i) { i.addEventListener("change", calc); });
    [el.price, el.down, el.tax, el.ins, el.hoa].forEach(function (i) { i.addEventListener("blur", function () { fmtInput(i); if (i === el.down) syncPctFromDown(); calc(); }); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    document.addEventListener("baez:lang", calc);
    el.priceR.value = priceToSlider(parse(el.price.value)); setFill(el.priceR); setFill(el.downR);
    calc();

    /* hand the numbers to the contact form */
    el.send.addEventListener("click", function () {
      if (!last) return;
      var tpName = { conv: lang === "es" ? "Convencional" : "Conventional", fha: "FHA", va: "VA" }[last.type];
      var lines = [t("sendIntro"),
        "• " + (lang === "es" ? "Precio" : "Home price") + ": " + money0.format(last.price),
        "• " + t("down") + ": " + money0.format(last.down) + " (" + round(last.downPct, 1) + "%)",
        "• " + (lang === "es" ? "Tipo" : "Loan type") + ": " + tpName + ", " + last.years + " " + t("years"),
        "• " + (lang === "es" ? "Tasa usada" : "Rate used") + ": " + last.rate + "%",
        "• " + t("loan") + ": " + money0.format(Math.round(last.loan)),
        "• " + (lang === "es" ? "Pago mensual estimado" : "Estimated monthly payment") + ": " + money0.format(Math.round(last.total))];
      var sel = $("#f-topic"); if (sel) sel.value = "calculator";
      var msg = $("#f-msg"); if (msg) msg.value = lines.join("\n");
      setTimeout(function () { var nm = $("#f-name"); if (nm) nm.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 650);
    });
  })();

  /* ================= contact form ================= */
  var cf = $("#contact-form");
  if (cf) (function () {
    var status = $("#f-status");
    var fields = [
      { el: $("#f-name"), test: function (v) { return v.trim().length >= 2; }, msg: "reqName" },
      { el: $("#f-phone"), test: function (v) { return v.replace(/\D/g, "").length >= 10; }, msg: "reqPhone" },
      { el: $("#f-email"), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "reqEmail" },
      { el: $("#f-consent"), test: function () { return $("#f-consent").checked; }, msg: "reqConsent" }
    ];
    function check(f, show) {
      var ok = f.test(f.el.value); var err = document.getElementById(f.el.id + "-e");
      if (show || f.el.getAttribute("aria-invalid") === "true") {
        f.el.setAttribute("aria-invalid", String(!ok));
        if (err) { err.textContent = ok ? "" : t(f.msg); err.hidden = ok; }
        if (!ok && err) f.el.setAttribute("aria-describedby", err.id); else f.el.removeAttribute("aria-describedby");
      }
      return ok;
    }
    fields.forEach(function (f) {
      f.el.addEventListener(f.el.type === "checkbox" ? "change" : "blur", function () { if (f.el.value || f.el.type === "checkbox") check(f, true); });
      f.el.addEventListener("input", function () { check(f, false); });
    });
    document.addEventListener("baez:lang", function () { fields.forEach(function (f) { if (f.el.getAttribute("aria-invalid") === "true") check(f, true); }); });
    function say(msg, cls) { status.textContent = msg; status.className = "form-status " + (cls || ""); status.hidden = false; }

    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = fields.filter(function (f) { return !check(f, true); });
      if (bad.length) { say(t("fixErrors"), "bad"); bad[0].el.focus(); return; }
      if ($("#f-web").value) return; /* bot */
      var topicSel = $("#f-topic");
      var data = {
        name: $("#f-name").value.trim(), phone: $("#f-phone").value.trim(), email: $("#f-email").value.trim(),
        language: $("#f-lang").value, topic: topicSel.options[topicSel.selectedIndex].text, message: $("#f-msg").value.trim()
      };
      var subject = "Website inquiry: " + data.topic + " (" + data.name + ")";
      var btn = cf.querySelector('button[type="submit"]');

      var body = [
        "Name: " + data.name, "Phone: " + data.phone, "Email: " + data.email, "Preferred language: " + data.language,
        "Topic: " + data.topic, "", data.message
      ].join("\n");
      var choice = $("#f-choice"), fMail = $("#f-mail"), fWa = $("#f-wa");
      var waText = (lang === "es" ? "Hola Oscar, le escribo desde su sitio web.\n\n" : "Hi Oscar, I'm writing from your website.\n\n") + body;
      if (fWa) { fWa.hidden = !WA; if (WA) fWa.href = waLink(waText); }

      if (CFG.formEndpoint) {
        btn.disabled = true; var label = btn.innerHTML; btn.textContent = t("sending");
        var payload = Object.assign({ subject: subject, from_name: "Baez Lending website", consent: "yes" }, data);
        if (CFG.formAccessKey) payload.access_key = CFG.formAccessKey;
        fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return res.ok && j.success !== false; }); })
          .then(function (ok) {
            if (ok) {
              say(t(WA ? "sentOkWa" : "sentOk"), "ok");
              if (choice) { choice.hidden = !WA; if (fMail) fMail.hidden = true; }
              cf.reset();
            } else { say(t("sentFail"), "bad"); if (choice) { choice.hidden = false; if (fMail) { fMail.hidden = false; fMail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); } } }
          })
          .catch(function () { say(t("sentFail"), "bad"); })
          .then(function () { btn.disabled = false; btn.innerHTML = label; });
        return;
      }
      /* No form service connected yet: the visitor sends it from their own email app or WhatsApp. Nothing is faked as "sent". */
      if (fMail) { fMail.hidden = false; fMail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }
      if (choice) choice.hidden = false;
      say(t("readyToSend"), "");
    });
  })();
})();
