/* Clarity — the conversation. One question at a time. The report is the payoff. */
(function () {
  const C = window.Content, E = window.Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#stage"), progress = $("#progress"), toast = $("#toast");
  const KEY = "clarity-session";

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach(k => { if (k === null || k === undefined || k === false) return; n.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lower = t => E.lower(t);

  /* ---------- state ---------- */
  function fresh(q) {
    const o = C.inferOptions(q);
    return {
      step: 0, question: q || "", options: { a: { label: o.a }, b: { label: o.b } }, optionsEdited: false,
      hope: "", stillWant: null, items: [], values: [], ratings: {},
      horizons: { a: { short: 6, long: 6 }, b: { short: 6, long: 6 } },
      reversibility: { a: 3, b: 3 }, regret: { act: 3, inact: 3 }, threshold: "", fear: "",
      wait: { cost: null, info: null }, prediction: 60, stress: null, feedback: null
    };
  }
  let S;
  const params = new URLSearchParams(location.search);
  try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
  if (params.get("q") && (!S || S.question !== params.get("q"))) S = fresh(params.get("q"));
  if (!S) S = fresh("");
  if (params.get("q")) history.replaceState(null, "", "app.html");
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem("clarity-theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $(".theme-toggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("clarity-theme", root.dataset.theme); } catch (e) {}
  });
  $("#restart").addEventListener("click", () => { if (S.step === 0 || confirm("Start over? Your answers here will be cleared.")) { S = fresh(""); save(); go(0); } });

  function say(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1800); }
  const A = () => S.options.a.label, B = () => S.options.b.label;
  const short = l => l.length > 22 ? l.slice(0, 20).trim() + "…" : l;

  /* ---------- shared widgets ---------- */
  function who(t = "Clarity") { return h("p", { class: "who" }, t); }
  function prompt(html) { return h("h1", { class: "prompt", html }); }
  function hint(html) { return h("p", { class: "hint", html }); }
  function actions(nextLabel, canNext, extra) {
    const wrap = h("div", { class: "actions" });
    if (S.step > 0) wrap.appendChild(h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(S.step - 1) }, "Back"));
    const next = h("button", { class: "btn", type: "button", id: "next", onclick: () => { if (canNext()) go(S.step + 1); else say(extra || "A little more first."); } }, nextLabel || "Continue", h("span", { class: "arrow", "aria-hidden": "true" }, "→"));
    wrap.appendChild(next);
    return wrap;
  }
  function choices(list, current, onpick, cls = "") {
    const wrap = h("div", { class: "choices", role: "group" });
    list.forEach(([val, label]) => {
      const b = h("button", { class: "choice " + cls, type: "button", "aria-pressed": String(current === val), onclick: () => { onpick(val); wrap.querySelectorAll(".choice").forEach(x => x.setAttribute("aria-pressed", String(x === b))); } }, label);
      wrap.appendChild(b);
    });
    return wrap;
  }
  function slider(opts) {
    const { min, max, value, onchange, ends, cls } = opts;
    const val = h("span", { class: "val" }, String(value));
    const input = h("input", { type: "range", min, max, step: 1, value, class: cls || "", "aria-label": opts.label || "", oninput: e => { val.textContent = e.target.value; onchange(+e.target.value); } });
    const box = h("div", { class: "row-s" }, h("div", {}, h("div", { class: "lbl" }, opts.label), opts.sub ? h("div", { class: "sub" }, opts.sub) : null), val, input, ends ? h("div", { class: "range-ends", style: "grid-column:1/-1" }, h("span", {}, ends[0]), h("span", {}, ends[1])) : null);
    return box;
  }

  /* ---------- steps ---------- */
  const steps = [];

  // 0 · Deciding
  steps.push(() => {
    const tone = C.tone(S.question);
    const q = h("input", { class: "input big", type: "text", value: S.question, placeholder: "Should I…", maxlength: 160, "aria-label": "What are you trying to decide?" });
    const a = h("input", { class: "input", type: "text", value: A(), maxlength: 60, "aria-label": "Option A" });
    const b = h("input", { class: "input", type: "text", value: B(), maxlength: 60, "aria-label": "Option B" });
    const toneLine = h("p", { class: "hint" });
    const setTone = () => { toneLine.innerHTML = C.tone(S.question) === "heavy" ? "This sounds like a decision where the facts and your feelings may be pulling in different directions. We'll separate those before we look at anything." : "Let's make the tradeoffs explicit. Nothing gets calculated until you've explored the decision."; };
    setTone();
    q.addEventListener("input", () => { S.question = q.value; if (!S.optionsEdited) { const o = C.inferOptions(S.question); S.options.a.label = o.a; S.options.b.label = o.b; a.value = o.a; b.value = o.b; } setTone(); });
    a.addEventListener("input", () => { S.options.a.label = a.value; S.optionsEdited = true; });
    b.addEventListener("input", () => { S.options.b.label = b.value; S.optionsEdited = true; });
    return [
      who(), prompt(S.question ? "Let's look at it clearly." : "Tell me what you're trying to decide."), toneLine,
      h("div", { class: "field" }, h("label", { for: "q" }, "The decision"), q),
      hint("Most decisions are two paths. Name them plainly. <b>Don't decide yet</b> is always on the table too; we'll come to it."),
      h("div", { class: "two" },
        h("div", { class: "field" }, h("label", { class: "opt-label" }, h("i", { class: "dot" }), "Option A"), a),
        h("div", { class: "field" }, h("label", { class: "opt-label b" }, h("i", { class: "dot" }), "Option B"), b)),
      actions("Continue", () => S.question.trim().length > 2 && A().trim() && B().trim(), "Name the decision and both options first.")
    ];
  });

  // 1 · Hoping
  steps.push(() => {
    const ta = h("textarea", { class: "input", placeholder: "Less stress. More money. To feel like myself again…", "aria-label": "What are you hoping changes?" }, S.hope);
    ta.addEventListener("input", () => { S.hope = ta.value; });
    return [
      who(), prompt(`What are you hoping changes if you <em>${esc(lower(A()))}</em>?`),
      hint("Not the option. The outcome. What would be different in your life?"),
      ta,
      h("div", { class: "rule" }),
      who(), prompt(`If <em>${esc(lower(B()))}</em> gave you exactly that tomorrow, would you still want to ${esc(lower(A()))}?`),
      choices([["yes", "Yes, I'd still want to"], ["no", "No, probably not"], ["unsure", "I'm not sure"]], S.stillWant, v => { S.stillWant = v; }),
      actions("Continue", () => S.hope.trim().length > 1 && S.stillWant, "Tell me what you hope changes, and whether you'd still go.")
    ];
  });

  // 2 · Knowing
  steps.push(() => {
    const list = h("div", { class: "items" });
    const tally = h("div", { class: "tally" });
    function renderTally() {
      const f = S.items.filter(i => i.kind === "fact").length, b = S.items.filter(i => i.kind === "belief").length, u = S.items.filter(i => i.kind === "unknown").length;
      tally.innerHTML = `<span><b>${f}</b> known</span><span><b>${b}</b> assumed</span><span><b>${u}</b> unknown</span>`;
    }
    function renderItems() {
      list.innerHTML = "";
      S.items.forEach((it, idx) => {
        const kinds = h("div", { class: "ctl" });
        [["fact", "Fact"], ["belief", "Belief"], ["unknown", "Unknown"]].forEach(([k, l]) => {
          kinds.appendChild(h("button", { class: "kind " + k, type: "button", "aria-pressed": String(it.kind === k), onclick: () => { it.kind = k; save(); renderItems(); renderTally(); } }, l));
        });
        const sides = h("div", { class: "ctl" });
        [["a", "Favours " + short(A())], ["b", "Favours " + short(B())], [null, "Neither"]].forEach(([k, l]) => {
          sides.appendChild(h("button", { class: "side", type: "button", "aria-pressed": String(it.side === k), onclick: () => { it.side = k; save(); renderItems(); } }, l));
        });
        list.appendChild(h("div", { class: "item" },
          h("div", {}, h("div", { class: "txt" }, it.text), h("div", { class: "ctl", style: "justify-content:flex-start;margin-top:8px" }, sides)),
          h("div", { class: "ctl" }, kinds, h("button", { class: "del", type: "button", "aria-label": "Remove", onclick: () => { S.items.splice(idx, 1); save(); renderItems(); renderTally(); } }, "×"))));
      });
    }
    const input = h("input", { class: "input", type: "text", placeholder: "Add something you know, believe, or don't know", maxlength: 140, "aria-label": "Add an item" });
    function add() {
      const t = input.value.trim(); if (!t) return;
      const guess = /^(i think|i believe|probably|i assume|i'?m assuming|likely|should|will|would|i'?ll|i'?d)/i.test(t) || /\b(will|would|probably|likely|think|believe|assume)\b/i.test(t) ? "belief" : /^(whether|how|if|what|when|who|will i|do i|can i|don'?t know|not sure|unsure)/i.test(t) || /\?$/.test(t) ? "unknown" : "fact";
      S.items.push({ text: t, kind: guess, side: null }); input.value = ""; save(); renderItems(); renderTally(); input.focus();
    }
    input.addEventListener("keydown", e => { if (e.key === "Enter" || e.keyCode === 13) { e.preventDefault(); add(); } });
    const seeds = h("div", { class: "seeds" }, C.seeds(S.question).map(s => h("button", { class: "choice small", type: "button", onclick: () => { input.value = s; input.focus(); input.setSelectionRange(input.value.length, input.value.length); } }, s)));
    renderItems(); renderTally();
    return [
      who(), prompt("What do you know? What do you <em>believe</em>? What don't you know?"),
      hint("Add each piece of information on its own. Then sort it: a <b>fact</b> you could verify today, a <b>belief</b> you're treating as true, or an <b>unknown</b> that could change the picture. Say which option it favours, if any."),
      h("form", { class: "add", onsubmit: e => { e.preventDefault(); add(); } }, input, h("button", { class: "btn", type: "submit" }, "Add")),
      seeds, list, tally,
      actions("Continue", () => S.items.length >= 3, "Give me at least three things: what you know, believe, or don't know.")
    ];
  });

  // 3 · Weighing
  steps.push(() => {
    const picked = new Set(S.values.map(v => v.id));
    const sliders = h("div", { class: "rows" });
    function renderSliders() {
      sliders.innerHTML = "";
      S.values.forEach(v => sliders.appendChild(slider({ label: v.label, sub: "How much does this matter here?", min: 1, max: 5, value: v.weight, ends: ["A little", "Enormously"], onchange: n => { v.weight = n; save(); } })));
    }
    const chips = h("div", { class: "choices" }, C.values.map(v => h("button", { class: "choice", type: "button", "aria-pressed": String(picked.has(v.id)), onclick: e => {
      if (picked.has(v.id)) { picked.delete(v.id); S.values = S.values.filter(x => x.id !== v.id); }
      else { if (picked.size >= 5) return say("Five is plenty. Focus is the point."); picked.add(v.id); S.values.push({ id: v.id, label: v.label, weight: 3 }); }
      e.currentTarget.setAttribute("aria-pressed", String(picked.has(v.id))); save(); renderSliders();
    } }, v.label)));
    renderSliders();
    return [
      who(), prompt("What actually <em>matters</em> to you in this?"),
      hint("Pick three to five. Then weigh each one. Nobody else gets to tell you what to value; this is where Clarity listens."),
      chips, sliders,
      actions("Continue", () => S.values.length >= 3, "Pick at least three things that matter.")
    ];
  });

  // 4 · Comparing
  steps.push(() => {
    const rows = h("div", { class: "compare" });
    S.values.forEach(v => {
      const r = S.ratings[v.id] || (S.ratings[v.id] = { a: 3, b: 3 });
      const mk = (side, cls) => {
        const n = h("span", { class: "n" }, String(r[side]));
        const inp = h("input", { type: "range", min: 1, max: 5, step: 1, value: r[side], class: cls, "aria-label": `${S.options[side].label}: ${v.label}`, oninput: e => { r[side] = +e.target.value; n.textContent = e.target.value; save(); } });
        return h("div", {}, h("span", { class: "opt-label " + (side === "b" ? "b" : "") }, h("i", { class: "dot" }), short(S.options[side].label)), n, inp);
      };
      rows.appendChild(h("div", {}, h("div", { class: "lbl", style: "font-weight:500;margin:10px 0 6px" }, v.label), h("div", { class: "pair" }, mk("a", ""), mk("b", "b-thumb"))));
    });
    return [
      who(), prompt("Honestly: how well does each option deliver each of those?"),
      hint("1 means poorly, 5 means fully. If you catch yourself guessing, that's a belief. Note it; we'll come back to it."),
      rows,
      actions("Continue", () => true)
    ];
  });

  // 5 · Horizons
  steps.push(() => {
    const hz = S.horizons;
    return [
      who(), prompt("Six months from now. Then <em>five years</em> from now."),
      hint("People routinely compare “this feels better now” against “this might be better in five years”, without noticing. Rate each option at each horizon, 1 to 10."),
      h("div", { class: "rows" },
        slider({ label: `${A()} · in six months`, min: 1, max: 10, value: hz.a.short, ends: ["Worse", "Better"], onchange: n => { hz.a.short = n; save(); } }),
        slider({ label: `${A()} · in five years`, min: 1, max: 10, value: hz.a.long, ends: ["Worse", "Better"], onchange: n => { hz.a.long = n; save(); } }),
        slider({ label: `${B()} · in six months`, min: 1, max: 10, value: hz.b.short, ends: ["Worse", "Better"], cls: "b-thumb", onchange: n => { hz.b.short = n; save(); } }),
        slider({ label: `${B()} · in five years`, min: 1, max: 10, value: hz.b.long, ends: ["Worse", "Better"], cls: "b-thumb", onchange: n => { hz.b.long = n; save(); } })),
      actions("Continue", () => true)
    ];
  });

  // 6 · Risk
  steps.push(() => {
    const th = h("textarea", { class: "input", placeholder: "Even if everything else goes well, this isn't worth it if…", "aria-label": "Minimum acceptable outcome" }, S.threshold);
    th.addEventListener("input", () => { S.threshold = th.value; });
    const fe = h("textarea", { class: "input", placeholder: "The outcome I keep picturing is…", "aria-label": "What are you most afraid of?" }, S.fear);
    fe.addEventListener("input", () => { S.fear = fe.value; });
    return [
      who(), prompt("If you chose it and disliked it, how easy would it be to <em>undo</em>?"),
      hint("A risky decision that's easy to reverse is a fundamentally different thing from a risky decision that's permanent."),
      h("div", { class: "rows" },
        slider({ label: A(), min: 1, max: 5, value: S.reversibility.a, ends: ["Permanent", "Easily undone"], onchange: n => { S.reversibility.a = n; save(); } }),
        slider({ label: B(), min: 1, max: 5, value: S.reversibility.b, ends: ["Permanent", "Easily undone"], cls: "b-thumb", onchange: n => { S.reversibility.b = n; save(); } })),
      h("div", { class: "rule" }),
      who(), prompt("Two different regrets."),
      h("div", { class: "rows" },
        slider({ label: `How much would you regret choosing “${A()}” and having it go badly?`, min: 1, max: 5, value: S.regret.act, ends: ["Barely", "Deeply"], onchange: n => { S.regret.act = n; save(); } }),
        slider({ label: `How much would you regret not choosing it, and later wishing you had?`, min: 1, max: 5, value: S.regret.inact, ends: ["Barely", "Deeply"], onchange: n => { S.regret.inact = n; save(); } })),
      h("div", { class: "rule" }),
      who(), prompt("What's the worst outcome you're genuinely willing to accept?"),
      hint("Not the ideal. The floor. This is <b>the Threshold</b>."), th,
      who(), prompt("And what are you most <em>afraid</em> of?"),
      hint("Name it. A fear that's named can be weighed. One that isn't runs the whole decision from the back seat."), fe,
      actions("Continue", () => S.threshold.trim().length > 1, "Name the floor: the worst outcome you'd still accept.")
    ];
  });

  // 7 · Waiting
  steps.push(() => [
    who(), prompt("There's always a third option: <em>don't decide yet</em>."),
    hint("Sometimes waiting buys information and preserves options at little cost. Sometimes it quietly costs the opportunity. Which is this?"),
    h("div", { class: "field" }, h("label", {}, "If you waited six months, what would it cost you?"),
      choices([["low", "Very little"], ["medium", "Something real"], ["high", "The opportunity itself"]], S.wait.cost, v => { S.wait.cost = v; save(); })),
    h("div", { class: "field" }, h("label", {}, "Would waiting actually tell you anything you don't know now?"),
      choices([["yes", "Yes, something important"], ["no", "No, I'd just be delaying"]], S.wait.info, v => { S.wait.info = v; save(); })),
    actions("Continue", () => S.wait.cost && S.wait.info, "Answer both, then we can weigh waiting properly.")
  ]);

  // 8 · Predicting
  steps.push(() => {
    const pct = h("div", { class: "pct" }, String(S.prediction), h("small", {}, "%"));
    const inp = h("input", { type: "range", min: 0, max: 100, step: 5, value: S.prediction, "aria-label": "Your estimate", oninput: e => { S.prediction = +e.target.value; pct.firstChild.textContent = e.target.value; save(); } });
    const unknowns = S.items.filter(i => i.kind === "unknown");
    const block = [
      who(), prompt("Before we calculate anything: what do <em>you</em> think will happen?"),
      hint(`Your gut, in a number. The chance that “${esc(A())}” leaves you better off than “${esc(B())}”. We'll compare it with what your own answers imply.`),
      pct, inp, h("div", { class: "range-ends" }, h("span", {}, "No chance"), h("span", {}, "Certain"))
    ];
    if (unknowns.length) {
      block.push(h("div", { class: "rule" }), who(), prompt("Of the things you don't know, which one would most change your mind if you found it out?"),
        choices(unknowns.map((u, i) => [i, u.text]), unknowns.findIndex(u => u.key), i => { unknowns.forEach((u, j) => { u.key = j === i; }); save(); }));
    }
    block.push(actions("Continue", () => !unknowns.length || unknowns.some(u => u.key), "Pick the unknown that matters most."));
    return block;
  });

  // 9 · Stress test
  steps.push(() => {
    const vs = E.valueScores(S);
    const side = vs.lean >= 0 ? "a" : "b", other = side === "a" ? "b" : "a";
    const conds = E.stressConditions(S);
    if (!S.stress || S.stress.length !== conds.length || S.stress.some((x, i) => x.id !== conds[i].id)) S.stress = conds.map(c => ({ ...c, plausible: false }));
    const checks = h("div", { class: "checks" }, S.stress.map(c => h("button", { class: "check", type: "button", "aria-pressed": String(c.plausible), onclick: e => { c.plausible = !c.plausible; e.currentTarget.setAttribute("aria-pressed", String(c.plausible)); save(); } },
      h("span", { class: "box" }, h("svg", { width: 12, height: 12, viewBox: "0 0 12 12", html: '<path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' })),
      h("span", { class: "t" }, c.text))));
    const conclude = h("div", { class: "actions" },
      h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(S.step - 1) }, "Back"),
      h("button", { class: "btn", type: "button", onclick: () => think() }, "Show me the report", h("span", { class: "arrow", "aria-hidden": "true" }, "→")));
    return [
      who(), prompt(`Now let's argue the other side.`),
      hint(`On what you've said matters, you lean toward <b>“${esc(S.options[side].label)}”</b>${Math.abs(vs.lean) < 0.12 ? ", barely" : ""}. If <b>“${esc(S.options[other].label)}”</b> were actually the better decision, what would need to be true? Mark each one that's genuinely plausible.`),
      checks,
      hint("This isn't a trick. Marking several doesn't mean you're wrong. It means the decision is sensitive, and that's worth knowing."),
      conclude
    ];
  });

  // 10 · Report
  steps.push(() => {
    const r = E.report(S);
    const L = id => S.options[id].label;
    const row = (k, v, cls = "") => h("div", { class: "row " + cls }, h("span", { class: "k" }, k), typeof v === "string" ? h("span", { class: "v" }, v) : v);
    const leanPct = 50 + r.lean * 50;
    const ep = r.epistemics;
    const feedback = h("div", { class: "after" },
      h("h4", {}, "Did anything become clearer?"),
      S.feedback ? h("p", { class: "thanks" }, "Thank you. That's the only metric Clarity cares about.") :
        choices([["do", "Yes, I know what I need to do"], ["find", "Yes, I know what I need to find out"], ["struggle", "Yes, I understand what I'm actually struggling with"], ["not", "Not yet"]], null, v => { S.feedback = v; save(); feedback.replaceWith(steps[10]().find(n => n.classList && n.classList.contains("after"))); }));
    const report = h("article", { class: "report", "aria-label": "Your Clarity Report" },
      h("p", { class: "k" }, "Clarity Report"),
      h("h3", { style: "margin-top:8px" }, S.question.replace(/[.?!]+$/, "")),
      h("div", { class: "lean" }, h("span", {}, short(L("b"))), h("div", { class: "lean-bar" }, h("i", { style: `left:${leanPct}%` })), h("span", {}, short(L("a")))),
      row("What appears to matter most", r.matters.join(" · ")),
      row("What you know, assume, and don't know", h("div", {}, h("div", { class: "chips-k" }, ep.facts.map(i => h("span", { class: "fact" }, i.text)), ep.beliefs.map(i => h("span", { class: "belief" }, i.text)), ep.unknowns.map(i => h("span", { class: "unknown" }, i.text))),
        ep.restsOnBeliefs ? h("p", { class: "v", style: "margin-top:10px" }, ep.beliefs.length > ep.facts.length ? `Your decision currently depends more on ${ep.beliefs.length === 1 ? "a belief" : ep.beliefs.length + " beliefs"} than on established facts.` : `Your lean toward “${L(r.side)}” rests on ${ep.leaningBeliefs.length} beliefs you haven't verified yet.`) : null)),
      row(`Strongest argument for “${L("a")}”`, r.strongest.a),
      row(`Strongest argument for “${L("b")}”`, r.strongest.b),
      r.assumption ? row("Biggest assumption", `That ${lower(r.assumption)}.`) : null,
      r.unknown ? row("Biggest unknown", r.unknown) : null,
      row("The Tradeoff", r.tradeoff),
      h("div", { class: "row pivot-row" }, h("span", { class: "k" }, "The Pivot"), h("span", { class: "v big" }, r.pivot.text),
        r.pivot.kind !== "none" ? h("p", { class: "v", style: "margin-top:6px" }, `If yes, “${r.pivot.ifYes}” becomes more attractive. If no, “${r.pivot.ifNo}” does.`) : null),
      row("Decision sensitivity", h("span", { class: "v" }, h("span", { class: "tag" }, r.sensitivity.level), " ", r.sensitivity.level === "High" ? "The answer changes considerably under small shifts in what you weigh." : r.sensitivity.level === "Medium" ? `The answer leans one way but could shift if ${r.sensitivity.top ? r.sensitivity.top.label.toLowerCase() : "one factor"} mattered less than you think.` : "Your lean holds up under plausible changes to any single factor.",
        r.plausible.length ? ` You marked ${r.plausible.length} way${r.plausible.length === 1 ? "" : "s"} the other side could be right.` : "")),
      row("Downside and reversibility", h("div", {}, h("p", { class: "v" }, r.revRead), h("p", { class: "v", style: "margin-top:8px" }, r.riskRead), S.threshold ? h("p", { class: "v quiet", style: "margin-top:8px" }, `Your threshold: “${S.threshold.trim()}”. Everything above should be judged against that floor, not against the ideal.`) : null)),
      row("Not deciding yet", r.waitRead),
      row("Your estimate vs. your own answers", r.calib),
      row("Most valuable next step", h("span", { class: "v big" }, r.next)),
      row("Clarity", h("div", {}, h("div", { class: "clar " + r.clarity.level }, h("span", { class: "tag" }, r.clarity.level)),
        h("ul", { class: "plain" }, r.clarity.reasons.map(t => h("li", {}, t))),
        r.clarity.warnings.length ? h("ul", { class: "plain warn" }, r.clarity.warnings.map(t => h("li", {}, t))) : null)),
      row("Your thinking", h("span", { class: "v big" }, r.thinking))
    );
    const text = () => [
      `CLARITY REPORT · ${S.question}`, ``, `What appears to matter most: ${r.matters.join(", ")}`,
      `Known: ${ep.facts.map(i => i.text).join("; ") || "—"}`, `Assumed: ${ep.beliefs.map(i => i.text).join("; ") || "—"}`, `Unknown: ${ep.unknowns.map(i => i.text).join("; ") || "—"}`, ``,
      `Strongest argument for “${L("a")}”: ${r.strongest.a}`, `Strongest argument for “${L("b")}”: ${r.strongest.b}`,
      r.assumption ? `Biggest assumption: that ${lower(r.assumption)}.` : null, r.unknown ? `Biggest unknown: ${r.unknown}` : null,
      `The Tradeoff: ${r.tradeoff}`, ``, `THE PIVOT: ${r.pivot.text}`, ``,
      `Decision sensitivity: ${r.sensitivity.level}`, `Reversibility: ${r.revRead}`, `Regret: ${r.riskRead}`, `Not deciding yet: ${r.waitRead}`,
      `Your estimate vs your answers: ${r.calib}`, ``, `Most valuable next step: ${r.next}`, ``,
      `Clarity: ${r.clarity.level}`, ...r.clarity.reasons.map(t => `  + ${t}`), ...r.clarity.warnings.map(t => `  ! ${t}`), ``, `Your thinking: ${r.thinking}`, ``, `The decision remains yours.`
    ].filter(x => x !== null).join("\n");
    return [
      who(), prompt("Here's what you're <em>actually</em> deciding."),
      hint("Not an answer. A map. Read it slowly. The last line is the one people remember."),
      report,
      h("div", { class: "report-actions" },
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => navigator.clipboard.writeText(text()).then(() => say("Copied."), () => say("Couldn't copy.")) }, "Copy report"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => window.print() }, "Print"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(9) }, "Revisit the stress test"),
        h("button", { class: "btn", type: "button", onclick: () => { S = fresh(""); save(); go(0); } }, "Another decision")),
      feedback,
      h("p", { class: "hint", style: "margin-top:20px" }, "Once you know the Pivot, you may not need Clarity anymore. That's the point.")
    ];
  });

  /* ---------- interstitial: the mark, then the report ---------- */
  function think() {
    save();
    stage.innerHTML = "";
    const m = h("div", { class: "mark" });
    const box = h("div", { class: "thinking" }, m, h("p", {}, "Letting one thing fall."));
    stage.appendChild(box);
    const c = Clover.mount(m);
    c.play().then(() => setTimeout(() => go(10), 400));
  }

  /* ---------- navigation ---------- */
  function renderProgress() {
    progress.innerHTML = "";
    C.steps.forEach((label, i) => progress.appendChild(h("i", { class: i < S.step ? "done" : i === S.step ? "now" : "", title: label })));
    progress.setAttribute("aria-valuenow", String(S.step));
    progress.setAttribute("aria-valuetext", `${C.steps[S.step]}, step ${S.step + 1} of ${C.steps.length}`);
  }
  function go(i) {
    S.step = Math.max(0, Math.min(steps.length - 1, i)); save();
    const old = stage.firstElementChild;
    const paint = () => {
      stage.innerHTML = "";
      const step = h("div", { class: "step" }, steps[S.step]());
      stage.appendChild(step);
      renderProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
      const first = step.querySelector("input:not([type=range]), textarea");
      if (first && window.innerWidth > 720 && S.step === 0) first.focus();
    };
    if (old && !matchMedia("(prefers-reduced-motion: reduce)").matches) { old.classList.add("out"); setTimeout(paint, 300); } else paint();
  }
  go(S.step);
})();
