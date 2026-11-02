/* OnLive Expo – 3D expo ground built with CSS 3D transforms and driven by GSAP. */
(function () {
  "use strict";
  const D = window.EXPO, G = window.gsap;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = n => "₹" + n.toLocaleString("en-IN");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = () => innerWidth < 760;
  const KEY = "onlive.expo.v2";

  /* ---------- saved state (browser only) ---------- */
  let S = { stamps: [], taken: [], enq: 0, bonus: 0, mine: null, reward: false, leads: [] };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  /* ---------- scene helpers ---------- */
  const cam = $("#cam"), ground = $("#ground");
  const cs = { x: 0, y: -40, z: -720, tilt: 60 };
  let mode = "hero"; // hero | tween | play | booth
  function applyCam() {
    cam.style.setProperty("--ut", -cs.tilt + "deg");
    cam.style.transform = `translate3d(0,0,${cs.z}px) rotateX(${cs.tilt}deg) translate3d(${-cs.x}px,${-cs.y}px,0)`;
  }
  function el(cls, html, vars) {
    const d = document.createElement("div"); d.className = cls; if (html) d.innerHTML = html;
    if (vars) for (const k in vars) d.style.setProperty(k, vars[k]);
    cam.appendChild(d); return d;
  }
  const bb = (cls, x, y, html, v) => { const e = el("bb " + cls, html, Object.assign({ "--x": x + "px", "--y": y + "px" }, v)); e._p = { x, y }; return e; };
  const flat = (cls, x, y, w, h, v) => el("flat " + cls, "", Object.assign({ "--x": x + "px", "--y": y + "px", width: w + "px", height: h + "px" }, v));
  const lane = (x, y, w, h) => el("lane", "", { "--x": x + "px", "--y": y + "px", width: w + "px", height: h + "px" });

  /* ---------- floor details ---------- */
  lane(-110, -700, 220, 1400);
  [-120, 240, 600].forEach(y => lane(-900, y - 36, 1800, 72));
  flat("", -150, 664, 300, 70, { background: "var(--orange)", border: "3px solid #14202B", "border-radius": "12px", display: "grid", "place-items": "center" })
    .innerHTML = '<span style="font:800 15px Unbounded,sans-serif;color:#fff;letter-spacing:.04em;transform:none">WELCOME · GATE 1</span>';

  /* ---------- slots ---------- */
  const slots = D.COMPANIES.map(c => {
    const p = D.SLOT(c.slot);
    return { i: c.slot, x: p.x, y: p.y, c: c.vacant ? null : Object.assign({}, c), els: [], prods: [], fa: null };
  });
  const anchor = { x: D.ANCHOR.x, y: D.ANCHOR.y, name: "Your Brand Here", el: null };
  const solids = slots.map(s => ({ x: s.x, y: s.y, hw: 168, hh: 94 }));
  solids.push({ x: anchor.x, y: anchor.y, hw: 150, hh: 94 });
  const blocked = (x, y) => solids.some(s => Math.abs(x - s.x) < s.hw && Math.abs(y - s.y) < s.hh);
  const BX = 900, BY0 = -690, BY1 = 690;
  const gate = (s) => ({ x: s.x, y: s.y + 112 });

  function nameSize(n) { return n.length > 16 ? 11 : n.length > 12 ? 13 : 17; }
  function facadeHTML(c) {
    const col = c.color, S2 = D.shade;
    return `<div class="fa" style="--c:${col};--c2:${S2(col, 22)};--c3:${S2(col, -14)}">
      ${c.plan === "premier" ? '<i class="flag l"></i><i class="flag r"></i><div class="bulbs">' + "<i></i>".repeat(9) + "</div>" : ""}
      ${c.spot ? '<div class="ribbon">TOP SPOT</div>' : ""}
      <div class="hdr" style="font-size:${nameSize(c.name)}px">${esc(c.name.toUpperCase())}</div><div class="wall"></div>
      <div class="mono">${esc(c.name[0].toUpperCase())}</div>
      <div class="tg">${esc(c.tag)}<i>${esc(c.cat)} · ${esc(c.city || "India")}</i></div>
      ${c.plan !== "starter" ? `<div class="scr"><span>NOW SHOWING<br>${esc(c.products[0][1].toUpperCase())}</span></div>` : ""}
      <div class="ctr"></div></div>`;
  }
  const PXS = n => (n === 3 ? [-100, 0, 100] : n === 2 ? [-60, 60] : [0]);

  function clearSlot(s) { s.els.forEach(e => e.remove()); s.els = []; s.prods = []; }
  function buildSlot(s) {
    clearSlot(s);
    const c = s.c, add = e => (s.els.push(e), e), col = c ? c.color : "#14202B";
    add(flat("plat", s.x - 150, s.y - 75, 300, 150, c
      ? { background: `repeating-linear-gradient(90deg,${D.shade(col, 62)} 0 20px,${D.shade(col, 52)} 20px 40px)` }
      : { background: "repeating-linear-gradient(45deg,#EADFC6 0 10px,#E2D5B6 10px 20px)", "border-style": "dashed" }));
    const g = gate(s);
    s.ring = add(flat("ring", g.x - 50, g.y - 50, 100, 100, { "--c": col }));
    if (c) {
      const f = add(bb("hit p-" + c.plan, s.x, s.y - 62, facadeHTML(c))); f.dataset.slot = s.i; s.fa = f.firstElementChild;
      if (c.spot) {
        const b = add(bb("beacon", s.x, s.y - 70)); G.to(b, { opacity: .35, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
      const xs = PXS(c.products.length);
      c.products.forEach((p, k) => {
        const e = add(bb("ped hit", s.x + xs[k], s.y + 34,
          `<div class="pr"><div class="sp">${D.icon(p[0], col)}</div></div><div class="base"><small>${esc(p[1])}</small></div>`, { "--c": col }));
        e.dataset.slot = s.i; e.dataset.prod = k; s.prods.push(e);
        G.to(e.querySelector(".pr"), { y: -9, duration: 1.3 + k * .25, yoyo: true, repeat: -1, ease: "sine.inOut" });
        G.fromTo(e.querySelector(".sp"), { rotationY: -28, transformPerspective: 600 }, { rotationY: 28, transformPerspective: 600, duration: 2.6 + k * .4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      });
    } else {
      const v = add(bb("hit", s.x, s.y - 10, `<div class="vac-sign"><span>Plot ${s.i + 1} · open</span><b>YOUR BOOTH HERE</b><em>From ₹499 / month · first 90 days free</em></div>`)); v.dataset.slot = s.i;
      G.to(v.firstElementChild, { y: -8, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
  }
  slots.forEach(buildSlot);

  /* anchor hall */
  flat("plat", anchor.x - 150, anchor.y - 75, 300, 150, { background: "repeating-linear-gradient(90deg,#2B3A48 0 20px,#34475A 20px 40px)", "border-color": "#FFC247" });
  anchor.ring = flat("ring", anchor.x - 50, anchor.y + 62, 100, 100, { "--c": "#FFC247" });
  anchor.el = bb("hit", anchor.x, anchor.y - 40, `<div class="tower"><div class="scr2"><small>FOUNDING ANCHOR PARTNER</small><b id="aName">${esc(anchor.name)}</b><span>FREE 6-MONTH PILOT · FIRST HALL</span></div><i class="stripe"></i><div class="pole"></div></div>`);
  anchor.el.dataset.anchor = "1";
  function setAnchorName(n) {
    anchor.name = (n || "Your Brand Here").slice(0, 28);
    const b = $("#aName"); if (b) { b.textContent = anchor.name; b.style.fontSize = anchor.name.length > 18 ? "17px" : anchor.name.length > 11 ? "21px" : "26px"; }
  }

  /* props: trees, flags */
  const treeSVG = '<svg viewBox="0 0 90 150"><rect x="40" y="96" width="10" height="50" fill="#7A5A3A" stroke="#14202B" stroke-width="3"/><circle cx="45" cy="62" r="40" fill="#5BA55B" stroke="#14202B" stroke-width="3"/><circle cx="32" cy="50" r="14" fill="#7BC27B"/></svg>';
  for (let x = -880; x <= 880; x += 160) bb("tree", x + (x % 3) * 12, -740, treeSVG);
  for (let y = -500; y <= 500; y += 250) { bb("tree", -960, y, treeSVG); bb("tree", 960, y, treeSVG); }
  [-300, 300].forEach(x => {
    const f = bb("", x, -590, `<div style="width:14px;height:210px;background:var(--ink2);border:3px solid var(--ink)"></div><div class="fl" style="position:absolute;left:14px;top:6px;width:86px;height:52px;background:var(--orange);border:3px solid var(--ink);clip-path:polygon(0 0,100% 12%,100% 88%,0 100%)"></div>`);
    G.to(f.querySelector(".fl"), { rotation: 5, transformOrigin: "0 50%", duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" });
  });

  /* ---------- people ---------- */
  function personSVG(shirt, skin, hair) {
    return `<svg viewBox="0 0 52 100"><rect x="14" y="62" width="10" height="30" rx="4" fill="#2B3A48"/><rect x="28" y="62" width="10" height="30" rx="4" fill="#2B3A48"/><rect x="11" y="88" width="15" height="8" rx="4" fill="#14202B"/><rect x="27" y="88" width="15" height="8" rx="4" fill="#14202B"/><rect x="3" y="34" width="9" height="28" rx="4" fill="${shirt}" stroke="#14202B" stroke-width="3"/><rect x="40" y="34" width="9" height="28" rx="4" fill="${shirt}" stroke="#14202B" stroke-width="3"/><rect x="9" y="30" width="34" height="40" rx="12" fill="${shirt}" stroke="#14202B" stroke-width="3"/><rect x="20" y="42" width="12" height="16" rx="2" fill="#fff" stroke="#14202B" stroke-width="2"/><rect x="22" y="45" width="8" height="3" fill="#FF5A36"/><circle cx="26" cy="19" r="14" fill="${skin}" stroke="#14202B" stroke-width="3"/><path d="M12 18a14 14 0 0 1 28 0c-6-5-22-5-28 0z" fill="${hair}"/></svg>`;
  }
  const SAY = ["Need laser-cut parts", "Anyone doing solar?", "Packaging for 500 units?", "Cold-chain veggies?", "Clinic software demo?", "Collecting my stamps", "Great booth!", "Who sells brackets?"];
  const SK = ["#F2C9A0", "#D9A06F", "#B97A4B", "#8D5A36"], SH = ["#14202B", "#3A2A1E", "#6B4A2B"], SR = ["#3B6BFF", "#E8782B", "#3E9B53", "#B04A8F", "#12A5A5", "#D9A406", "#6C8F1E", "#14202B", "#D9455F"];
  function makePerson(shirt, me, i) {
    const e = bb("person", 0, 0, `<div class="shadow"></div><div class="w">${personSVG(shirt, SK[i % 4], SH[i % 3])}</div>${me ? '<div class="nm">YOU</div>' : '<div class="say"></div>'}`);
    return { el: e, w: e.querySelector(".w"), say: e.querySelector(".say") };
  }
  const P = { x: 0, y: 630, face: 1, goal: null, busy: false, t: 0, stuck: 0, moving: false };
  Object.assign(P, makePerson("#FF5A36", true, 1));
  const npcs = SR.map((c, i) => {
    let x, y; do { x = (Math.random() * 2 - 1) * 820; y = (Math.random() * 2 - 1) * 640; } while (blocked(x, y));
    const n = Object.assign({ x, y, tx: x, ty: y, wait: Math.random() * 3, sp: 70 + Math.random() * 40, face: 1, t: Math.random() * 9 }, makePerson(c, false, i + 2));
    return n;
  });
  function setPos(e, x, y) { e._p = { x, y }; e.style.setProperty("--x", x + "px"); e.style.setProperty("--y", y + "px"); }

  /* coins */
  const coins = [];
  (function () {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    while (coins.length < 14) {
      const x = (rnd() * 2 - 1) * 840, y = (rnd() * 2 - 1) * 620;
      if (blocked(x, y) || Math.hypot(x - P.x, y - P.y) < 120) continue;
      coins.push({ x, y, i: coins.length, el: null });
    }
    coins.forEach(c => {
      if (S.taken.includes(c.i)) return;
      c.el = bb("coin", c.x, c.y, '<div class="cw"><svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" fill="#FFC247" stroke="#14202B" stroke-width="3"/><text x="17" y="23" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="16" fill="#14202B">₹</text></svg></div>');
      G.to(c.el.firstElementChild, { y: -12, duration: 1 + (c.i % 4) * .15, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });
  })();

  /* ---------- score, quests, HUD ---------- */
  const pts = () => S.stamps.length * 50 + S.taken.length * 10 + S.enq * 100 + S.bonus;
  const rank = p => (p < 100 ? "Visitor" : p < 300 ? "Scout" : p < 600 ? "Buyer" : "VIP buyer");
  const shownPts = { v: 0 };
  const QUESTS = [
    ["Visit 3 booths", () => Math.min(3, S.stamps.length), 3],
    ["Collect 6 coins", () => Math.min(6, S.taken.length), 6],
    ["Send 1 enquiry", () => Math.min(1, S.enq), 1]
  ];
  function totalBooths() { return slots.filter(s => s.c).length; }
  function updateHUD() {
    const p = pts();
    G.to(shownPts, { v: p, duration: .6, ease: "power2.out", onUpdate: () => { $("#pts").textContent = Math.round(shownPts.v); } });
    $("#rank").textContent = rank(p);
    $("#stampCount").textContent = S.stamps.length + "/" + totalBooths();
    $("#quests").innerHTML = "<h4>Today’s quests</h4>" + QUESTS.map(q => { const v = q[1](), ok = v >= q[2]; return `<div class="q ${ok ? "ok" : ""}"><i>${ok ? "✓" : ""}</i><span>${q[0]}</span><small>${v}/${q[2]}</small></div>`; }).join("");
    if (!S.reward && QUESTS.every(q => q[1]() >= q[2])) { S.reward = true; save(); setTimeout(showReward, 900); }
  }
  let toastT;
  function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove("show"), 2800); }
  function confetti() {
    if (reduce) return; const box = $("#confetti"), cols = ["#FF5A36", "#FFC247", "#12A5A5", "#3B6BFF", "#FBEFD6"];
    for (let i = 0; i < 70; i++) {
      const d = document.createElement("i"); d.style.left = Math.random() * 100 + "%"; d.style.background = cols[i % 5]; box.appendChild(d);
      G.to(d, { y: innerHeight + 60, x: (Math.random() - .5) * 240, rotation: Math.random() * 720, duration: 1.6 + Math.random() * 1.4, delay: Math.random() * .4, ease: "power1.out", onComplete: () => d.remove() });
    }
  }

  /* ---------- camera ---------- */
  let camTween, heroTween, zoomBase = 70;
  const followPose = () => ({ x: P.x, y: P.y - 40, z: zoomBase, tilt: 52 });
  const heroPose = () => ({ x: narrow() ? 0 : -250, y: narrow() ? -260 : -30, z: narrow() ? -1000 : -720, tilt: 60 });
  function flyTo(t, dur, done) {
    if (camTween) camTween.kill(); if (heroTween) { heroTween.kill(); heroTween = null; }
    mode = "tween";
    camTween = G.to(cs, Object.assign({}, t, { duration: reduce ? .01 : dur, ease: "power3.inOut", onUpdate: applyCam, onComplete: () => done && done() }));
  }
  function startHero() {
    mode = "hero"; Object.assign(cs, heroPose()); applyCam();
    if (!reduce) heroTween = G.to(cs, { x: cs.x + 90, duration: 16, yoyo: true, repeat: -1, ease: "sine.inOut", onUpdate: applyCam });
  }

  /* ---------- panel ---------- */
  const panel = $("#panel");
  let cur = null;
  function boothPose(s, pi) {
    const px = pi != null ? s.x + PXS(s.c.products.length)[pi] : s.x, py = pi != null ? s.y + 34 : s.y - 10;
    if (narrow()) return { x: px, y: py + 60, z: pi != null ? 160 : 10, tilt: 34 };
    return { x: px + 175, y: py, z: pi != null ? 380 : 210, tilt: 34 };
  }
  let faded = [];
  function fadeFront(s) {
    faded = [...cam.querySelectorAll(".bb")].filter(e => e._p && !s.els.includes(e) && e !== anchor.el && !e.classList.contains("beacon") && e._p.y > s.y + 40 && Math.abs(e._p.x - s.x) < 430);
    G.to(faded, { opacity: .1, duration: .5 });
  }
  function unfade() { if (faded.length) G.to(faded, { opacity: 1, duration: .5 }); faded = []; }
  function openSlot(s) {
    if (mode === "booth") return;
    P.goal = null; cur = s; mode = "booth";
    $("#prompt").classList.remove("on"); $("#prompt").style.opacity = 0;
    if (!s.c) { cur = null; mode = "play"; openBuilder(s); return; }
    if (!S.stamps.includes(s.c.id) && !s.c.mine) { S.stamps.push(s.c.id); save(); toast("Stamp collected: " + s.c.name + "  +50 pts"); updateHUD(); }
    renderPanel(s); fadeFront(s); document.body.classList.add("in-booth");
    flyTo(boothPose(s), 1.3);
    mode = "booth";
  }
  function renderPanel(s) {
    const c = s.c, p = D.PLANS[c.plan];
    const owner = c.mine;
    panel.style.setProperty("--c", c.color);
    panel.innerHTML = `<div class="ph"><button class="x" data-close aria-label="Close booth">✕</button><h2>${esc(c.name)}</h2><p>${esc(c.tag)}</p>
      <div class="badges"><span class="bdg">${esc(c.cat)}</span><span class="bdg">${p.name} booth</span>${c.spot ? '<span class="bdg gold">Top spot</span>' : ""}<span class="bdg">${owner ? "Your booth" : "Sample company"}</span></div></div>
      <div class="pb">
      ${owner ? `<div><h3>Sample analytics · what you would see</h3><div class="stats"><div><b data-n="${120 + Math.floor(Math.random() * 90)}">0</b><span>views today</span></div><div><b data-n="${6 + Math.floor(Math.random() * 8)}">0</b><span>enquiries</span></div><div><b data-n="${2 + Math.floor(Math.random() * 4)}">0</b><span>meetings</span></div></div><p class="note">Demo numbers only. The real expo shows your own visitors, enquiries and meetings here.</p></div>` : ""}
      <div><h3>About</h3><p>${esc(c.desc)}</p></div>
      <div><h3>Products on stage · tap to look closer</h3><div class="prods">${c.products.map((pr, k) => `<button class="prod" data-prod="${k}"><div class="pi">${D.icon(pr[0], c.color)}</div><div><b>${esc(pr[1])}</b><span>${esc(pr[2])}</span></div><em>Look →</em></button>`).join("")}</div></div>
      ${owner ? "" : `<div><h3>Book a 15-minute meeting</h3><div class="slots">${["Today 4:30 pm", "Tomorrow 11:00 am", "Tomorrow 3:00 pm"].map((t, i) => `<button class="slot" data-slot="${i}">${t}</button>`).join("")}</div></div>
      <form class="f" id="enq"><h3>Send an enquiry</h3><input name="n" placeholder="Your name" required autocomplete="name"><input name="e" type="email" placeholder="Work email" required autocomplete="email"><textarea name="m" placeholder="What are you looking for? Quantity, timeline, budget." required></textarea>
      <label class="chk"><input type="checkbox" required> I agree that ${esc(c.name)} may contact me about this enquiry.</label><button class="btn primary" type="submit">Send enquiry · +100 pts</button></form>`}
      ${owner ? "" : '<div class="stampline">✓ Stamp collected in your passport</div>'}</div>`;
    panel.classList.add("open");
    panel.querySelectorAll("[data-n]").forEach(b => { const o = { v: 0 }; G.to(o, { v: +b.dataset.n, duration: 1.2, onUpdate: () => { b.textContent = Math.round(o.v); } }); });
    if (G.from && !reduce) G.from(panel.querySelectorAll(".prod"), { opacity: 0, y: 14, stagger: .08, duration: .4, delay: .35 });
  }
  function closePanel() {
    if (mode !== "booth") return;
    panel.classList.remove("open"); cur = null; unfade(); document.body.classList.remove("in-booth");
    flyTo(followPose(), 1.1, () => { mode = "play"; });
  }
  panel.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) return closePanel();
    const pr = e.target.closest("[data-prod]");
    if (pr && cur) {
      const k = +pr.dataset.prod;
      panel.querySelectorAll(".prod").forEach(x => x.classList.toggle("on", x === pr));
      camTween && camTween.kill(); camTween = G.to(cs, Object.assign(boothPose(cur, k), { duration: reduce ? .01 : 1, ease: "power3.inOut", onUpdate: applyCam }));
      const spot = cur.prods[k].querySelector(".pr");
      G.to(spot, { scale: 1.35, duration: .35, yoyo: true, repeat: 1, ease: "power2.out" });
      return;
    }
    const sl = e.target.closest("[data-slot]");
    if (sl) {
      panel.querySelectorAll(".slot").forEach(x => x.classList.toggle("on", x === sl));
      S.bonus += 25; save(); updateHUD(); toast("Meeting request sent to " + cur.c.name + "  +25 pts");
    }
  });
  panel.addEventListener("submit", e => {
    e.preventDefault(); if (!cur) return;
    const f = new FormData(e.target);
    try { S.leads.push({ booth: cur.c.name, n: f.get("n"), e: f.get("e"), m: f.get("m"), t: Date.now() }); } catch (x) {}
    S.enq++; save(); updateHUD();
    e.target.innerHTML = `<h3>Enquiry sent</h3><p>${esc(cur.c.name)} will reply by email. <b>+100 pts</b>. This demo stores it only in your browser.</p>`;
    toast("Sent to " + cur.c.name);
  });

  /* ---------- modals ---------- */
  const modal = $("#modal"), mbox = $("#mbox");
  function openModal(html, onOpen) {
    mbox.innerHTML = `<button class="x mx" data-x aria-label="Close">✕</button>` + html;
    modal.classList.remove("hidden");
    if (!reduce) G.from(mbox, { y: 36, opacity: 0, duration: .35, ease: "power3.out" });
    onOpen && onOpen();
  }
  function closeModal() { modal.classList.add("hidden"); }
  modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-x]")) closeModal(); });

  function plansHTML() {
    return `<h2>Booth plans, kept cheap</h2><p class="sub">Founding exhibitors get the first 90 days free and keep the launch price for 12 months.</p>
    <div class="plans">${Object.values(D.PLANS).map(p => `<div class="plan ${p.hot ? "hot" : ""}"><h3>${p.name}</h3><div class="pr">${inr(p.price)} <small>/ month</small></div><s>was ${inr(p.was)}</s><br><span class="free">90 days free</span><ul>${p.pts.map(x => `<li>${x}</li>`).join("")}</ul></div>`).join("")}
    <div class="plan"><h3>Top spot</h3><div class="pr">${inr(D.SPOT.price)} <small>/ week</small></div><s>was ${inr(D.SPOT.was)}</s><ul><li>Gold beacon over your booth</li><li>Shown first in the directory</li><li>Max 3 booths per category</li></ul></div></div>
    <div class="pill-row"><button class="btn primary" data-go="builder">Build my booth</button><a class="btn" href="evaluation.html">Read the idea review</a></div>`;
  }
  function partnerHTML() {
    return `<h2>Anchor hall: the first big name</h2><p class="sub">One large company gets the tower at the centre of the expo, free for 6 months. Their suppliers and dealers fill the booths around it.</p>
    <div class="grid2"><div><label class="fld">Type the company you are pitching<input id="pName" maxlength="28" placeholder="e.g. Acme Industries" value="${esc(anchor.name === "Your Brand Here" ? "" : anchor.name)}"></label>
    <p class="note" style="margin-top:0">This only changes the sign in your own copy of the demo. Use a real company’s name or logo in public only after they agree in writing.</p>
    <div class="pill-row"><button class="btn primary" id="pShow">Show me the hall</button></div></div>
    <div class="pill-row" style="margin:0;flex-direction:column"><div class="perk"><b>Free pavilion for 6 months</b>Tower, banner wall and stage slot in the centre of the hall.</div><div class="perk"><b>Their vendors, one click away</b>Invite up to 50 suppliers or dealers to list free for 90 days.</div><div class="perk"><b>Monthly report</b>Visitors, enquiries and vendor sign-ups. No IT work on their side.</div></div></div>`;
  }
  function passportHTML() {
    const got = slots.filter(s => s.c && S.stamps.includes(s.c.id));
    return `<h2>Expo passport</h2><p class="sub">${got.length} of ${totalBooths()} stamps. Visit every booth to fill it.</p><div class="stamps">${slots.filter(s => s.c).map((s, i) => S.stamps.includes(s.c.id) ? `<div class="st got" style="--c:${s.c.color};--r:${(i * 37) % 17 - 8}deg"><div><b>${esc(s.c.name[0])}</b>${esc(s.c.name)}</div></div>` : `<div class="st">?<br>Not visited</div>`).join("")}</div>
    <p class="note">Points: ${pts()} · Rank: ${rank(pts())} · Coins: ${S.taken.length}/14 · Enquiries sent: ${S.enq}</p>`;
  }
  let dirCat = "All", dirQ = "";
  function directoryHTML() {
    const cats = ["All", ...Object.keys(D.CATS)];
    return `<h2>Directory</h2><p class="sub">Prefer search to walking? Jump straight to a booth.</p>
    <div class="f"><input id="dq" type="search" placeholder="Search companies or products" value="${esc(dirQ)}"></div>
    <div class="cats" style="margin-top:10px">${cats.map(c => `<button class="cat ${c === dirCat ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="dir" id="dlist">${dirList()}</div>`;
  }
  function dirList() {
    const q = dirQ.toLowerCase();
    const l = slots.filter(s => s.c && (dirCat === "All" || s.c.cat === dirCat) && (s.c.name + s.c.tag + s.c.products.map(p => p[1]).join(" ")).toLowerCase().includes(q))
      .sort((a, b) => (b.c.spot - a.c.spot) || a.c.name.localeCompare(b.c.name));
    return l.map(s => `<button class="dr" data-go-slot="${s.i}" style="--c:${s.c.color}"><div class="mn">${esc(s.c.name[0])}</div><div><b>${esc(s.c.name)}</b><span>${esc(s.c.cat)} · ${esc(s.c.products.map(p => p[1]).join(", "))}</span></div><em>${s.c.spot ? "TOP SPOT · " : ""}Go →</em></button>`).join("") || '<p class="note">No booths match.</p>';
  }
  function showReward() {
    confetti();
    openModal(`<h2>Expo Pass unlocked</h2><p class="sub">You finished today’s quests. Founding-visitor perks are yours.</p><div class="pill-row"><div class="perk"><b>Code: FOUNDING-VISITOR</b>Priority replies from every booth you visited (demo).</div><div class="perk"><b>${pts()} points · ${rank(pts())}</b>Keep exploring to reach VIP buyer.</div></div><div class="pill-row"><button class="btn primary" data-x>Keep exploring</button></div>`);
  }

  /* builder */
  const B = { name: "Your Company", tag: "What you sell, in one sentence", cat: "Technology", color: "#3B6BFF", plan: "growth", spot: false, kinds: ["box", "laptop", "gear"], slot: null };
  function builderHTML() {
    const kinds = Object.entries(D.KINDS);
    return `<h2>Build your booth</h2><p class="sub">Free for 90 days. It appears in the hall the moment you press the button.</p>
    <div class="grid2"><div id="bf">
    <label class="fld">Company name<input id="bName" maxlength="26" value="${esc(B.name)}"></label>
    <label class="fld">One-line pitch<input id="bTag" maxlength="60" value="${esc(B.tag)}"></label>
    <label class="fld">Category<select id="bCat">${Object.keys(D.CATS).map(c => `<option ${c === B.cat ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
    <div class="fld">Brand colour<div class="swatches">${["#3B6BFF", "#E8782B", "#3E9B53", "#D9455F", "#12A5A5", "#D9A406", "#B04A8F", "#14202B"].map(c => `<button type="button" class="sw ${c === B.color ? "on" : ""}" data-col="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join("")}</div></div>
    <div class="fld">Plan<div class="radios">${Object.entries(D.PLANS).map(([k, p]) => `<button type="button" class="rad ${k === B.plan ? "on" : ""}" data-plan="${k}"><b>${p.name} · ${p.products} products</b><span>${inr(p.price)}/mo</span></button>`).join("")}</div></div>
    <label class="chk" style="margin-bottom:10px"><input type="checkbox" id="bSpot" ${B.spot ? "checked" : ""}> <span><b>Top spot</b> · gold beacon, shown first (${inr(D.SPOT.price)} / week)</span></label>
    <div class="fld">Products on stage<div class="f">${[0, 1, 2].map(i => `<select data-kind="${i}">${kinds.map(([k, n]) => `<option value="${k}" ${k === B.kinds[i] ? "selected" : ""}>${n}</option>`).join("")}</select>`).join("")}</div></div></div>
    <div><div class="prev" id="bp"></div><div class="pill-row"><button class="btn primary" id="bGo">Put my booth in the expo →</button></div><p class="note">Demo only: nothing is charged and your booth is saved in this browser.</p></div></div>`;
  }
  function builderPreview() {
    const p = D.PLANS[B.plan], n = p.products;
    const total = p.price + (B.spot ? D.SPOT.price * 4 : 0);
    $("#bp").style.setProperty("--c", B.color);
    $("#bp").innerHTML = `<div class="top">${esc(B.name || "Your Company")}</div><div class="mid">${B.kinds.slice(0, n).map(k => `<span>${D.icon(k, B.color)}</span>`).join("")}</div>
    <div class="bot"><div>${esc(B.tag)}</div><p style="margin:8px 0 0"><b>${inr(total)}</b> / month <s>${inr(p.was + (B.spot ? D.SPOT.was * 4 : 0))}</s><br><span class="free">Pay today ₹0 · 90 days free</span></p></div>`;
  }
  function openBuilder(slot) {
    const free = slots.filter(s => !s.c);
    B.slot = slot ? slot.i : (free.length ? free.slice().sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0].i : null);
    openModal(builderHTML(), builderPreview);
  }
  mbox.addEventListener("input", e => {
    if (e.target.id === "bName") B.name = e.target.value; if (e.target.id === "bTag") B.tag = e.target.value;
    if (e.target.id === "bCat") { B.cat = e.target.value; }
    if (e.target.id === "bSpot") B.spot = e.target.checked;
    if (e.target.dataset.kind != null) B.kinds[+e.target.dataset.kind] = e.target.value;
    if (e.target.id === "pName") setAnchorName(e.target.value);
    if (e.target.id === "dq") { dirQ = e.target.value; $("#dlist").innerHTML = dirList(); }
    if ($("#bp")) builderPreview();
  });
  mbox.addEventListener("click", e => {
    const t = e.target;
    const col = t.closest("[data-col]"); if (col) { B.color = col.dataset.col; mbox.querySelectorAll(".sw").forEach(x => x.classList.toggle("on", x === col)); builderPreview(); }
    const pl = t.closest("[data-plan]"); if (pl) { B.plan = pl.dataset.plan; mbox.querySelectorAll(".rad").forEach(x => x.classList.toggle("on", x === pl)); builderPreview(); }
    const ct = t.closest("[data-cat]"); if (ct) { dirCat = ct.dataset.cat; mbox.querySelectorAll(".cat").forEach(x => x.classList.toggle("on", x === ct)); $("#dlist").innerHTML = dirList(); }
    const gs = t.closest("[data-go-slot]"); if (gs) { closeModal(); goToSlot(slots[+gs.dataset.goSlot]); }
    const go = t.closest("[data-go]"); if (go) { closeModal(); setTimeout(() => openBuilder(), 60); }
    if (t.id === "bGo") buildMine();
    if (t.id === "pShow") { closeModal(); showAnchor(); }
  });

  function makeMine() {
    const p = D.PLANS[B.plan];
    return { id: "mine", mine: true, name: (B.name || "Your Company").trim(), tag: B.tag, cat: B.cat, plan: B.plan, spot: B.spot, color: B.color, city: "Your city",
      desc: "This is your booth. In the real expo, visitors would read your story here, see your products and message you directly.",
      products: B.kinds.slice(0, p.products).map(k => [k, D.KINDS[k], "your price here"]) };
  }
  function buildMine(silent) {
    const free = slots.filter(s => !s.c || s.c.mine);
    const s = slots[B.slot] && (!slots[B.slot].c || slots[B.slot].c.mine) ? slots[B.slot] : free[0];
    if (!s) { toast("All demo plots are taken"); return; }
    s.c = makeMine(); S.mine = { B: Object.assign({}, B), slot: s.i }; save();
    buildSlot(s); updateHUD(); setupMini();
    if (silent) return;
    closeModal(); P.goal = null;
    const start = () => {
      if (G.from && s.fa) G.from(s.fa, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%", duration: 1, ease: "elastic.out(1,0.5)" });
      s.prods.forEach((e, k) => G.from(e, { opacity: 0, duration: .4, delay: .5 + k * .2 }));
      confetti(); toast(s.c.name + " is live in the expo");
      setTimeout(() => { if (mode !== "booth") { cur = s; mode = "tween"; renderPanel(s); fadeFront(s); document.body.classList.add("in-booth"); mode = "booth"; flyTo(boothPose(s), 1.2, () => { mode = "booth"; }); } }, 1500);
    };
    if (mode === "hero") { flyTo({ x: s.x, y: s.y, z: -250, tilt: 48 }, 1.6, start); }
    else { mode = "tween"; flyTo({ x: s.x, y: s.y, z: -120, tilt: 48 }, 1.3, start); }
  }

  function showAnchor() {
    const back = mode === "hero" ? "hero" : "play";
    if (back === "hero") G.to("#hero", { opacity: 0, duration: .4 });
    flyTo({ x: anchor.x, y: anchor.y + 60, z: -80, tilt: 40 }, 1.5, () => {
      G.delayedCall(3.4, () => { if (back === "hero") { G.to("#hero", { opacity: 1, duration: .5 }); flyTo(heroPose(), 1.6, startHero); } else flyTo(followPose(), 1.4, () => { mode = "play"; }); });
    });
  }
  function goToSlot(s) {
    if (mode === "hero") { enterExpo(() => walkTo(gate(s), () => openSlot(s))); return; }
    if (mode === "booth") closePanelThen(() => walkTo(gate(s), () => openSlot(s)));
    else walkTo(gate(s), () => openSlot(s));
  }
  function closePanelThen(fn) { panel.classList.remove("open"); cur = null; unfade(); document.body.classList.remove("in-booth"); mode = "play"; fn(); }

  /* ---------- movement ---------- */
  const keys = {};
  const SPEED = 340, HALF = 14;
  function step(e, dx, dy) {
    let nx = Math.max(-BX, Math.min(BX, e.x + dx)), ny = Math.max(BY0, Math.min(BY1, e.y + dy));
    if (!blocked(nx, e.y)) e.x = nx; if (!blocked(e.x, ny)) e.y = ny;
  }
  function walkTo(g, done) {
    if (mode !== "play") { setTimeout(() => walkTo(g, done), 120); return; }
    if (Math.hypot(g.x - P.x, g.y - P.y) < 70) { done && done(); return; }
    P.goal = { x: g.x, y: g.y, done };
  }
  function fastTravel(g) {
    P.busy = true; G.to(P, { x: g.x, y: g.y, duration: .7, ease: "power2.inOut", onComplete: () => { P.busy = false; g.done && g.done(); } });
  }
  function interactables() { return slots.map(s => ({ s, p: gate(s) })).concat([{ s: null, p: { x: anchor.x, y: anchor.y + 112 } }]); }
  let near = null;
  function updateNear() {
    let best = null, bd = 105;
    for (const it of interactables()) { const d = Math.hypot(it.p.x - P.x, it.p.y - P.y); if (d < bd) { bd = d; best = it; } }
    if (best !== near) {
      near = best;
      slots.forEach(s => s.ring && s.ring.classList.toggle("near", !!(best && best.s === s)));
      anchor.ring.classList.toggle("near", !!(best && !best.s));
      const pr = $("#prompt");
      if (best && mode === "play") {
        const label = best.s ? (best.s.c ? "Enter " + esc(best.s.c.name) : "Reserve this plot") : "Visit the Anchor Hall";
        pr.innerHTML = `<kbd>${narrow() ? "TAP" : "E"}</kbd>${label}`; pr.classList.add("on"); pr.style.opacity = 1; pr.style.transform = "translateX(-50%) translateY(0)";
      } else { pr.classList.remove("on"); pr.style.opacity = 0; pr.style.transform = "translateX(-50%) translateY(20px)"; }
    }
  }
  function interact() {
    if (mode !== "play" || !near) return;
    if (near.s) openSlot(near.s); else openAnchorInfo();
  }
  $("#prompt").addEventListener("click", interact);
  function openAnchorInfo() { openModal(partnerHTML()); }

  addEventListener("keydown", e => {
    if (e.key === "Escape") { if (!modal.classList.contains("hidden")) closeModal(); else closePanel(); return; }
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    if (!modal.classList.contains("hidden")) return;
    const k = e.key.toLowerCase();
    if (k === "e" || k === "enter") { if (mode === "play") { interact(); e.preventDefault(); } return; }
    if ("wasd".includes(k) || k.startsWith("arrow")) { keys[k] = true; P.goal = null; e.preventDefault(); }
  });
  addEventListener("keyup", e => { delete keys[e.key.toLowerCase()]; });
  addEventListener("blur", () => { for (const k in keys) delete keys[k]; });
  addEventListener("wheel", e => { if (mode === "play") { zoomBase = Math.max(-120, Math.min(300, zoomBase - e.deltaY * .2)); } }, { passive: true });

  cam.addEventListener("click", e => {
    if (mode !== "play" || !modal.classList.contains("hidden")) return;
    const hit = e.target.closest(".hit");
    if (hit) {
      if (hit.dataset.anchor) { walkTo({ x: anchor.x, y: anchor.y + 112 }, openAnchorInfo); return; }
      const s = slots[+hit.dataset.slot]; walkTo(gate(s), () => openSlot(s)); return;
    }
    if (e.target === ground) {
      let x = e.offsetX - 1000, y = e.offsetY - 750;
      x = Math.max(-BX, Math.min(BX, x)); y = Math.max(BY0, Math.min(BY1, y));
      for (let i = 0; i < 40 && blocked(x, y); i++) { x += (P.x - x) * .08; y += (P.y - y) * .08; }
      P.goal = { x, y };
      const m = flat("ring near", x - 18, y - 18, 36, 36, { "--c": "#FF5A36" }); G.to(m, { opacity: 0, duration: .8, onComplete: () => m.remove() });
    }
  });

  /* ---------- minimap ---------- */
  const mm = $("#minimap"), MS = .095;
  let mmMe;
  function setupMini() {
    mm.innerHTML = "";
    const mk = (x, y, w, h, c, cls) => { const i = document.createElement("i"); i.style.cssText = `left:${95 + x * MS}px;top:${65 + y * MS}px;width:${w}px;height:${h}px;background:${c}`; if (cls) i.className = cls; mm.appendChild(i); return i; };
    slots.forEach(s => mk(s.x, s.y, 28, 14, s.c ? s.c.color : "transparent", "").style.border = s.c ? "1px solid #14202B" : "1.5px dashed #14202B");
    mk(anchor.x, anchor.y, 26, 14, "#FFC247").style.border = "1.5px solid #14202B";
    mmMe = mk(0, 0, 10, 10, "", "me");
  }

  /* ---------- main loop ---------- */
  let last = performance.now(), sayT = 4;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    // player
    if (mode === "play" && modal.classList.contains("hidden") && !P.busy) {
      let dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
      let moved = false;
      if (dx || dy) { const l = Math.hypot(dx, dy); step(P, dx / l * SPEED * dt, dy / l * SPEED * dt); if (dx) P.face = dx > 0 ? 1 : -1; moved = true; }
      else if (P.goal) {
        const gx = P.goal.x - P.x, gy = P.goal.y - P.y, d = Math.hypot(gx, gy);
        if (d < 12) { const g = P.goal; P.goal = null; g.done && g.done(); }
        else {
          const bx = P.x, by = P.y; step(P, gx / d * SPEED * dt, gy / d * SPEED * dt); if (Math.abs(gx) > 4) P.face = gx > 0 ? 1 : -1; moved = true;
          P.stuck = Math.hypot(P.x - bx, P.y - by) < SPEED * dt * .3 ? P.stuck + dt : 0;
          if (P.stuck > .35) { const g = P.goal; P.goal = null; P.stuck = 0; fastTravel(g); }
        }
      }
      P.moving = moved;
    } else if (!P.busy) P.moving = false;
    P.t += dt * (P.moving || P.busy ? 11 : 2);
    P.w.style.transform = `translateY(${P.moving || P.busy ? -Math.abs(Math.sin(P.t)) * 5 : Math.sin(P.t) * 1.2}px) scaleX(${P.face})`;
    setPos(P.el, P.x, P.y);
    // npcs
    npcs.forEach(n => {
      n.wait -= dt;
      if (n.wait <= 0) {
        const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
        if (d < 14 || n.stuck > .6) { let tx, ty; do { tx = (Math.random() * 2 - 1) * 820; ty = (Math.random() * 2 - 1) * 640; } while (blocked(tx, ty)); n.tx = tx; n.ty = ty; n.wait = Math.random() * 2.5; n.stuck = 0; }
        else { const bx = n.x, by = n.y; step(n, dx / d * n.sp * dt, dy / d * n.sp * dt); n.face = dx > 0 ? 1 : -1; n.t += dt * 9; n.stuck = Math.hypot(n.x - bx, n.y - by) < n.sp * dt * .3 ? (n.stuck || 0) + dt : 0; }
      }
      n.w.style.transform = `translateY(${-Math.abs(Math.sin(n.t)) * 4}px) scaleX(${n.face})`;
      setPos(n.el, n.x, n.y);
    });
    sayT -= dt;
    if (sayT <= 0) { sayT = 5 + Math.random() * 5; const n = npcs[Math.floor(Math.random() * npcs.length)]; n.say.textContent = SAY[Math.floor(Math.random() * SAY.length)]; G.to(n.say, { opacity: 1, duration: .3 }); G.to(n.say, { opacity: 0, duration: .4, delay: 3 }); }
    // coins
    if (mode === "play") coins.forEach(c => {
      if (c.el && Math.hypot(c.x - P.x, c.y - P.y) < 46) {
        const e = c.el; c.el = null; S.taken.push(c.i); save(); updateHUD();
        G.to(e.firstElementChild, { scale: 2, opacity: 0, duration: .35, onComplete: () => e.remove() });
        toast("+10 pts · coin " + S.taken.length + "/14");
      }
    });
    // camera + HUD bits
    if (mode === "play") {
      const t = followPose(), k = 1 - Math.exp(-5 * dt);
      cs.x += (t.x - cs.x) * k; cs.y += (t.y - cs.y) * k; cs.z += (t.z - cs.z) * k; cs.tilt += (t.tilt - cs.tilt) * k; applyCam();
      updateNear();
    } else if (near) { near = null; updateNearReset(); }
    if (mmMe) { mmMe.style.left = 95 + P.x * MS + "px"; mmMe.style.top = 65 + P.y * MS + "px"; }
    requestAnimationFrame(frame);
  }
  function updateNearReset() { slots.forEach(s => s.ring && s.ring.classList.remove("near")); anchor.ring.classList.remove("near"); const pr = $("#prompt"); pr.classList.remove("on"); pr.style.opacity = 0; }

  /* ---------- enter / exit ---------- */
  function enterExpo(done) {
    if (mode !== "hero") { done && done(); return; }
    document.body.classList.add("playing");
    G.to("#hero", { opacity: 0, y: -24, duration: .5, onComplete: () => $("#hero").classList.add("hidden") });
    $("#hud").classList.remove("hidden");
    if (!reduce) G.from("#hud .hud-tl, #hud .hud-tr, #hud .hud-bl, #hud .hud-br", { opacity: 0, y: -14, stagger: .1, duration: .5, delay: .6 });
    updateHUD();
    flyTo(followPose(), 2.2, () => { mode = "play"; toast("Walk to a glowing ring, then press E"); if (done) done(); });
  }
  function exitExpo() {
    closeModal(); panel.classList.remove("open"); cur = null; P.goal = null; unfade(); document.body.classList.remove("in-booth");
    document.body.classList.remove("playing"); $("#hud").classList.add("hidden");
    const h = $("#hero"); h.classList.remove("hidden"); G.to(h, { opacity: 1, y: 0, duration: .5 });
    flyTo(heroPose(), 1.8, startHero);
  }
  $("#enter").addEventListener("click", () => enterExpo());
  $("#exit").addEventListener("click", exitExpo);
  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open]"); if (!o) return;
    const w = o.dataset.open;
    if (w === "plans") openModal(plansHTML());
    if (w === "partner") openModal(partnerHTML());
    if (w === "passport") openModal(passportHTML());
    if (w === "directory") openModal(directoryHTML());
    if (w === "builder") openBuilder();
  });
  addEventListener("resize", () => { if (mode === "hero") { Object.assign(cs, heroPose()); applyCam(); } });

  /* ---------- boot ---------- */
  setupMini();
  if (S.mine && S.mine.B) { Object.assign(B, S.mine.B); B.slot = S.mine.slot; buildMine(true); }
  startHero(); updateHUD(); requestAnimationFrame(frame);
  setTimeout(() => { const l = $("#loader"); l.classList.add("gone"); setTimeout(() => l.remove(), 600); }, 500);
  if (!reduce) G.from(".hero-card > *", { opacity: 0, y: 24, stagger: .09, duration: .7, delay: .6, ease: "power3.out" });
  window.__expo = { S, P, cs, slots, anchor, coins, openSlot, enterExpo, exitExpo, setAnchorName, mode: () => mode };
})();
