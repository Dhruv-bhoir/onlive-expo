/* Loaded after the real GSAP from cdnjs. If GSAP loaded, this file does nothing.
   If the CDN is blocked, this small stand-in covers the calls the site uses
   (to / from / fromTo / set / timeline / delayedCall / utils.random) so the page still works. */
(function () {
  if (window.gsap) return;
  const E = {
    none: t => t,
    "power1.out": t => 1 - (1 - t) ** 2, "power2.out": t => 1 - (1 - t) ** 3, "power3.out": t => 1 - (1 - t) ** 4,
    "power2.inOut": t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    "power3.inOut": t => (t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
    "sine.inOut": t => -(Math.cos(Math.PI * t) - 1) / 2,
    "back.out": t => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2,
    "elastic.out": t => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1)
  };
  const ease = n => E[String(n || "power2.out").replace(/\(.*\)/, "")] || E["power2.out"];
  const TR = ["x", "y", "scale", "scaleX", "scaleY", "rotation", "rotationY"];
  const targets = t => (typeof t === "string" ? [...document.querySelectorAll(t)] : t instanceof Element ? [t] : t && t.length != null && !t.nodeType ? [...t] : [t]);
  const cur = (o, k) => {
    if (o instanceof Element) {
      const g = o._g || (o._g = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, rotationY: 0 });
      if (k in g) return g[k];
      if (k === "opacity") return parseFloat(getComputedStyle(o).opacity);
      return parseFloat(getComputedStyle(o)[k]) || 0;
    }
    return o[k] || 0;
  };
  const put = (o, k, v) => {
    if (!(o instanceof Element)) { o[k] = v; return; }
    if (TR.includes(k)) {
      o._g[k] = v; const g = o._g;
      o.style.transform = `translate(${g.x}px,${g.y}px) rotate(${g.rotation}deg) rotateY(${g.rotationY}deg) scale(${g.scale * g.scaleX},${g.scale * g.scaleY})`;
    } else if (k === "opacity") o.style.opacity = v;
    else o.style[k] = typeof v === "number" ? v + "px" : v;
  };
  const live = [];
  let raf = 0;
  function tick(now) {
    for (let i = live.length - 1; i >= 0; i--) { if (live[i](now)) live.splice(i, 1); }
    raf = live.length ? requestAnimationFrame(tick) : 0;
  }
  const add = fn => { live.push(fn); if (!raf) raf = requestAnimationFrame(tick); };

  function tween(tg, vars, from, startDelay) {
    const list = targets(tg), v = Object.assign({}, vars);
    const dur = (v.duration != null ? v.duration : .5) * 1000, delay = ((v.delay || 0) + (startDelay || 0)) * 1000;
    const st = typeof v.stagger === "number" ? v.stagger * 1000 : 0, rep = v.repeat || 0, yoyo = !!v.yoyo, fn = ease(v.ease);
    const meta = ["duration", "delay", "ease", "onUpdate", "onComplete", "repeat", "yoyo", "stagger", "transformOrigin", "overwrite", "transformPerspective", "immediateRender", "clearProps"];
    const keys = Object.keys(v).filter(k => !meta.includes(k));
    if (v.transformOrigin) list.forEach(o => o instanceof Element && (o.style.transformOrigin = v.transformOrigin));
    const t0 = performance.now();
    const spans = list.map(o => keys.map(k => {
      const a = cur(o, k), b = v[k];
      return from ? [k, b, a] : [k, a, b];
    }));
    if (from) list.forEach((o, i) => spans[i].forEach(([k, s]) => put(o, k, s)));
    let done = false, killed = false;
    const total = list.length ? dur + st * (list.length - 1) : dur;
    add(now => {
      if (killed) return true;
      const el = now - t0 - delay;
      if (el < 0) return false;
      let allDone = true;
      list.forEach((o, i) => {
        let p = (el - st * i) / dur;
        if (p < 0) { allDone = false; return; }
        if (rep === -1 || p < (rep + 1)) allDone = false;
        let c = rep === -1 ? p : Math.min(p, rep + 1);
        let cyc = Math.floor(c), frac = c - cyc;
        if (p >= rep + 1 && rep !== -1) { cyc = rep; frac = 1; }
        const q = yoyo && cyc % 2 === 1 ? 1 - frac : frac;
        const e = fn(Math.max(0, Math.min(1, q)));
        spans[i].forEach(([k, a, b]) => put(o, k, a + (b - a) * e));
      });
      if (v.onUpdate) v.onUpdate();
      if (allDone && !done) { done = true; if (v.onComplete) v.onComplete(); return true; }
      return false;
    });
    return { kill() { killed = true; }, duration: () => total / 1000 };
  }

  function timeline(opts) {
    opts = opts || {};
    let end = 0, lastStart = 0;
    const tl = {
      _add(fn, d, pos) {
        let s;
        if (pos === undefined) s = end; else if (pos === "<") s = lastStart;
        else if (typeof pos === "string" && pos[1] === "=") s = end + (pos[0] === "-" ? -1 : 1) * parseFloat(pos.slice(2));
        else s = +pos;
        lastStart = s; end = Math.max(end, s + d); fn(s); return tl;
      },
      to(t, v, pos) { return tl._add(s => tween(t, v, false, s + (opts.delay || 0)), v.duration != null ? v.duration : .5, pos); },
      from(t, v, pos) { return tl._add(s => tween(t, v, true, s + (opts.delay || 0)), v.duration != null ? v.duration : .5, pos); },
      fromTo(t, a, b, pos) { return tl._add(s => { targets(t).forEach(o => Object.keys(a).forEach(k => put(o, k, a[k]))); tween(t, b, false, s + (opts.delay || 0)); }, b.duration != null ? b.duration : .5, pos); },
      set(t, v) { targets(t).forEach(o => Object.keys(v).forEach(k => (cur(o, k), put(o, k, v[k])))); return tl; },
      call(fn, a, pos) { return tl._add(s => setTimeout(fn, (s + (opts.delay || 0)) * 1000), 0, pos); }
    };
    if (opts.onComplete) setTimeout(() => tl.call(opts.onComplete, null, ">"), 0);
    return tl;
  }

  window.gsap = {
    to: (t, v) => tween(t, v, false),
    from: (t, v) => tween(t, v, true),
    fromTo(t, a, b) { targets(t).forEach(o => Object.keys(a).forEach(k => (cur(o, k), put(o, k, a[k])))); return tween(t, b, false); },
    set(t, v) { targets(t).forEach(o => Object.keys(v).forEach(k => { if (k === "transformOrigin" && o instanceof Element) o.style.transformOrigin = v[k]; else (cur(o, k), put(o, k, v[k])); })); },
    timeline, registerPlugin() {},
    delayedCall: (s, fn) => { const id = setTimeout(fn, s * 1000); return { kill: () => clearTimeout(id) }; },
    killTweensOf() {}, utils: { random: (a, b) => a + Math.random() * (b - a) },
    __fallback: true
  };
})();
