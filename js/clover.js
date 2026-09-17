/* Clarity — the five-leaf clover mark.
   Five leaves. One falls. What remains is a four-leaf clover.
   Usage: const c = Clover.mount(el, { size }); c.play() -> Promise; c.finish(); c.reset(); */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const LEAF = "M0 0 C -16 -8, -28 -26, -18 -40 C -10 -50, 0 -44, 0 -34 C 0 -44, 10 -50, 18 -40 C 28 -26, 16 -8, 0 0 Z";
  const START = [0, 72, 144, 216, 288];       // five leaves
  const FALL_INDEX = 1;                         // the upper-right leaf lets go
  const END = { 0: 45, 2: 135, 3: 225, 4: 315 }; // the four settle into true symmetry
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function mount(container, opts = {}) {
    container.innerHTML = "";
    const svg = el("svg", { viewBox: "-70 -70 140 160", class: "clover", role: "img", "aria-label": opts.label || "Clarity: a five-leaf clover whose fifth leaf falls, leaving a four-leaf clover" }, container);
    el("title", {}, svg).textContent = "Clarity";
    el("line", { class: "ground", x1: -56, y1: 74, x2: 56, y2: 74 }, svg);
    el("path", { class: "stem", d: "M0 2 C 2 26, 0 46, 6 72" }, svg);
    const leaves = START.map((a, i) => {
      const g = el("g", { class: "leaf-g" }, svg);
      const inner = el("g", { transform: "translate(0,-3)" }, g);
      el("path", { class: "leaf", d: LEAF }, inner);
      el("path", { class: "leaf-vein", d: "M0 -3 L0 -30" }, inner);
      return { g, inner, angle: a, scale: 0, i };
    });

    // Fallen leaf state: translate + rotate + gold
    const state = { leaves, phase: "idle", raf: 0 };

    function draw() {
      leaves.forEach(l => {
        const t = l.fall
          ? `translate(${l.fall.x} ${l.fall.y}) rotate(${l.fall.r}) scale(${l.scale})`
          : `rotate(${l.angle}) scale(${l.scale})`;
        l.g.setAttribute("transform", t);
      });
    }

    function reset() {
      cancelAnimationFrame(state.raf);
      leaves.forEach((l, i) => { l.angle = START[i]; l.scale = 0; l.fall = null; l.g.style.display = ""; l.g.querySelector(".leaf").classList.remove("fallen"); });
      draw();
    }

    function finish() {
      cancelAnimationFrame(state.raf);
      leaves.forEach((l, i) => {
        l.scale = 1; l.fall = null;
        if (i === FALL_INDEX) { l.fall = { x: 46, y: 74, r: 100 }; l.g.querySelector(".leaf").classList.add("fallen"); }
        else l.angle = END[i];
      });
      draw();
    }

    function play() {
      reset();
      if (REDUCED) { finish(); return Promise.resolve(); }
      return new Promise(resolve => {
        const t0 = performance.now();
        const GROW = 900, HOLD = 500, FALL = 1500, SETTLE = 900;
        const fallStart = GROW + HOLD, settleStart = fallStart + 350;
        const total = settleStart + SETTLE + 100;
        const f = leaves[FALL_INDEX];
        function frame(now) {
          const t = now - t0;
          // 1. grow in, staggered
          leaves.forEach((l, i) => {
            const s = Math.min(1, Math.max(0, (t - i * 110) / (GROW - 440)));
            l.scale = 0.001 + easeOut(s) * 0.999;
          });
          // 2. the fifth leaf lets go
          if (t >= fallStart) {
            const p = Math.min(1, (t - fallStart) / FALL);
            const e = easeInOut(p);
            const sway = Math.sin(p * Math.PI * 2.2) * (1 - p) * 10;
            f.fall = {
              x: 6 + 40 * e + sway,
              y: 74 * (p < 0.15 ? easeOut(p / 0.15) * 0.04 : 0.04 + 0.96 * easeInOut((p - 0.15) / 0.85)),
              r: 72 + 28 * e + Math.sin(p * Math.PI * 2.4) * 18 * (1 - p)
            };
            if (p > 0.25) f.g.querySelector(".leaf").classList.add("fallen");
          }
          // 3. the four settle into symmetry
          if (t >= settleStart) {
            const p = easeInOut(Math.min(1, (t - settleStart) / SETTLE));
            leaves.forEach((l, i) => { if (i !== FALL_INDEX) l.angle = START[i] + (END[i] - START[i]) * p; });
          }
          draw();
          if (t < total) state.raf = requestAnimationFrame(frame);
          else { finish(); resolve(); }
        }
        state.raf = requestAnimationFrame(frame);
      });
    }

    reset();
    return { svg, play, reset, finish };
  }

  window.Clover = { mount };
})();
