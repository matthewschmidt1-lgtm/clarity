/* Clarity — site behaviors: loader, lens field, reveals, header, theme, prefill. */
(function () {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem("clarity-theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $$(".theme-toggle").forEach(b => b.addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("clarity-theme", root.dataset.theme); } catch (e) {}
  }));

  /* ---------- loader ---------- */
  const loader = $(".loader");
  const heroMark = $("[data-clover='hero']");
  const heroClover = heroMark ? Clover.mount(heroMark) : null;
  if (loader) {
    const mark = Clover.mount($(".loader .mark"));
    let seen = false;
    try { seen = sessionStorage.getItem("clarity-seen") === "1"; } catch (e) {}
    const finishLoader = () => {
      loader.classList.add("word-in");
      setTimeout(() => { loader.classList.add("done"); document.body.classList.add("ready"); heroClover && heroClover.play(); }, seen ? 250 : 1900);
      try { sessionStorage.setItem("clarity-seen", "1"); } catch (e) {}
    };
    if (seen || REDUCED) { mark.finish(); finishLoader(); }
    else mark.play().then(finishLoader);
  } else if (heroClover) heroClover.play();
  if (heroClover) $("[data-clover='hero']").addEventListener("click", () => heroClover.play());

  /* ---------- header ---------- */
  const header = $(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal").forEach(n => io.observe(n));

  /* ---------- the lens: scattered → resolved ----------
     A field of points. As the user scrolls, noise resolves into one line. */
  function field(canvas, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, pts = [], progress = 0, target = 0, visible = true, raf = 0;
    const N = Math.round((opts.count || 260) * (window.innerWidth < 720 ? 0.4 : 1));
    const rnd = (a, b) => a + Math.random() * (b - a);
    function css() {
      const s = getComputedStyle(document.documentElement);
      return { ink: s.getPropertyValue("--ink").trim(), moss: s.getPropertyValue("--moss").trim(), gold: s.getPropertyValue("--gold").trim(), fog: s.getPropertyValue("--fog").trim() };
    }
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: N }, (_, i) => {
        const u = i / N;
        // resolved position: a soft line low in the viewport, with one bright point
        const rx = w * (0.08 + 0.84 * u), ry = h * 0.9 + Math.sin(u * Math.PI) * -h * 0.05;
        return { sx: rnd(0, w), sy: rnd(0, h), rx, ry, r: rnd(0.8, 2.2), a: rnd(0.25, 0.8), ph: rnd(0, 6.28), sp: rnd(0.3, 1) };
      });
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const c = css();
      progress += (target - progress) * 0.06;
      const p = progress, e = p * p * (3 - 2 * p);
      // faint threads between neighbors when resolved
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const q = pts[i];
        const drift = REDUCED ? 0 : Math.sin(t * 0.0004 * q.sp + q.ph) * 10 * (1 - e) * (1 - e);
        const x = q.sx + (q.rx - q.sx) * e + drift, y = q.sy + (q.ry - q.sy) * e + drift * 0.6;
        q.x = x; q.y = y;
        ctx.beginPath(); ctx.arc(x, y, q.r * (1 - e * 0.45), 0, 6.283);
        ctx.fillStyle = c.ink; ctx.globalAlpha = q.a * (0.55 + 0.45 * (1 - e)) * (opts.alpha || 1);
        ctx.fill();
      }
      if (e > 0.85) {
        const k2 = (e - 0.85) / 0.15;
        ctx.globalAlpha = k2 * 0.55; ctx.strokeStyle = c.moss; ctx.beginPath();
        pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
        // the one point that matters
        const k = pts[Math.floor(pts.length * 0.62)];
        ctx.globalAlpha = k2; ctx.fillStyle = c.gold; ctx.beginPath(); ctx.arc(k.x, k.y, 5 + 3 * k2, 0, 6.283); ctx.fill();
        ctx.globalAlpha = k2 * 0.25; ctx.beginPath(); ctx.arc(k.x, k.y, 18 + 10 * Math.sin(t * 0.002), 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (visible) raf = requestAnimationFrame(draw);
    }
    size(); window.addEventListener("resize", size);
    new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } }).observe(canvas);
    return { set(v) { if (Number.isFinite(v)) target = Math.max(0, Math.min(1, v)); } };
  }

  // hero: resolves as the user scrolls the first screen
  const lens = field($("#lens"), { count: 220, alpha: 0.7 });
  // enemy section: resolves as the section reaches center
  const fld = field($("#field"), { count: 320 });
  function scrollFields() {
    const vh = window.innerHeight || 1;
    const total = Math.max(1, document.documentElement.scrollHeight - vh);
    if (lens) lens.set(window.scrollY / (total * 0.62));
    if (fld) {
      const r = $("#field").getBoundingClientRect();
      const v = 1 - (r.top - vh * 0.2) / (vh * 0.55);
      fld.set(v);
    }
  }
  window.addEventListener("scroll", scrollFields, { passive: true }); scrollFields();
  if (REDUCED) { lens && lens.set(1); fld && fld.set(1); }

  /* ---------- ask → app ---------- */
  $$("form.ask").forEach(f => f.addEventListener("submit", ev => {
    ev.preventDefault();
    const v = f.querySelector("input").value.trim();
    location.href = "app.html" + (v ? "?q=" + encodeURIComponent(v) : "");
  }));
  $$(".chip[data-q]").forEach(c => c.addEventListener("click", () => {
    location.href = "app.html?q=" + encodeURIComponent(c.dataset.q);
  }));

})();
