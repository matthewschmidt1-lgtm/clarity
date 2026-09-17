/* Clarity — the person builds the model, one confirmed step at a time. */
(function () {
  const C = window.Content, E = window.Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#stage"), progress = $("#progress"), toast = $("#toast");
  const KEY = "clarity-session-3";

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? "" : v);
    }
    kids.flat(Infinity).forEach(k => { if (k === null || k === undefined || k === false) return; n.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uid = () => "o" + Math.random().toString(36).slice(2, 7);

  function fresh(q) {
    const s = { step: 0, pattern: null, title: "", options: [{ id: uid(), label: "" }, { id: uid(), label: "" }], criteria: [], evals: {}, notes: { hope: "", stillWant: null, worry: "" }, ruledOut: {}, feedback: null, feeling: null, missing: null };
    if (q) { const o = C.inferOptions(q); s.title = q.replace(/[?.!]+$/, "").replace(/^(should|do|shall|could|can|would|will)\s+(i|we)\s+/i, ""); s.title = s.title.charAt(0).toLowerCase() + s.title.slice(1); s.options[0].label = o.a; s.options[1].label = o.b; s.pattern = "other"; }
    return s;
  }
  let S;
  const params = new URLSearchParams(location.search);
  try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
  if (params.get("q") && (!S || S.source !== params.get("q"))) { S = fresh(params.get("q")); S.source = params.get("q"); }
  if (!S) S = fresh("");
  if (params.get("q")) history.replaceState(null, "", "app.html");
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const root = document.documentElement;
  try { const t = localStorage.getItem("clarity-theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $(".theme-toggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("clarity-theme", root.dataset.theme); } catch (e) {}
  });
  $("#restart").addEventListener("click", () => { if (S.step === 0 || confirm("Start over? Your answers here will be cleared.")) { S = fresh(""); save(); go(0); } });

  function say(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1800); }
  const L = o => E.toYou(o.label);
  const short = l => l.length > 22 ? l.slice(0, 20).trim() + "…" : l;
  const opts = () => S.options.filter(o => o.label.trim());

  function who() { return h("p", { class: "who" }, "Clarity"); }
  function prompt(html) { return h("h1", { class: "prompt", html }); }
  function hint(html) { return h("p", { class: "hint", html }); }
  function actions(canNext, nudge, label) {
    const wrap = h("div", { class: "actions" });
    if (S.step > 0) wrap.appendChild(h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(S.step - 1) }, "Back"));
    wrap.appendChild(h("button", { class: "btn", type: "button", onclick: () => { if (canNext()) go(S.step + 1); else say(nudge || "A little more first."); } }, label || "Continue", h("span", { class: "arrow", "aria-hidden": "true" }, "→")));
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

  const steps = [];

  // 0 · Framing
  steps.push(() => {
    const title = h("input", { class: "input big", type: "text", value: S.title, placeholder: "…", maxlength: 120, "aria-label": "I'm deciding whether to" });
    title.addEventListener("input", () => { S.title = title.value; save(); });
    const tone = h("p", { class: "hint" });
    const setTone = () => { tone.textContent = C.tone(S.title) === "heavy" ? "The facts and your feelings may be pulling in different directions here. We'll take it slowly." : "Clarity won't tell you what to do. It shows you which uncertainty matters."; };
    title.addEventListener("input", setTone); setTone();
    const pats = choices(C.patterns.map(p => [p.id, p.label]), S.pattern, id => {
      S.pattern = id; const p = C.patterns.find(x => x.id === id);
      if (p && p.options[0] && !S.options[0].label.trim() && !S.options[1].label.trim()) { S.options[0].label = p.options[0]; S.options[1].label = p.options[1]; }
      save();
    });
    return [
      who(), prompt("What are you deciding?"), tone,
      h("div", { class: "field" }, h("label", {}, "I'm deciding whether to"), title),
      h("div", { class: "field" }, h("label", {}, "It's a question of"), pats),
      actions(() => S.title.trim().length > 2 && S.pattern, "Say what you're deciding, and what kind of question it is.")
    ];
  });

  // 1 · Options
  steps.push(() => {
    const list = h("div", { class: "rows" });
    function render() {
      list.innerHTML = "";
      S.options.forEach((o, i) => {
        const inp = h("input", { class: "input", type: "text", value: o.label, maxlength: 60, placeholder: i === 0 ? "One way" : i === 1 ? "The other" : "Another way", "aria-label": `Option ${i + 1}` });
        inp.addEventListener("input", () => { o.label = inp.value; save(); });
        list.appendChild(h("div", { class: "optrow" }, h("span", { class: "opt-label " + (i === 1 ? "b" : "") }, h("i", { class: "dot" })), inp, S.options.length > 2 ? h("button", { class: "del", type: "button", "aria-label": "Remove", onclick: () => { S.options.splice(i, 1); save(); render(); } }, "×") : null));
      });
    }
    render();
    return [
      who(), prompt("Name the ways this could go."),
      hint("Two is usual. Three is fine. Plain words, the way you'd say them to a friend."),
      list,
      S.options.length < 4 ? h("button", { class: "link-btn", type: "button", onclick: () => { S.options.push({ id: uid(), label: "" }); save(); render(); } }, "+ Add another way") : null,
      actions(() => opts().length >= 2, "Name at least two ways this could go.")
    ];
  });

  // 2 · Criteria
  steps.push(() => {
    const picked = () => new Set(S.criteria.map(c => c.id));
    const groups = C.criteria.map(g => h("div", { class: "group" }, h("p", { class: "eyebrow-plain" }, g.cat),
      h("div", { class: "choices" }, g.items.map(([id, label]) => h("button", { class: "choice small", type: "button", "data-id": id, "aria-pressed": String(picked().has(id)), onclick: e => {
        if (picked().has(id)) S.criteria = S.criteria.filter(c => c.id !== id); else S.criteria.push({ id, label, importance: null });
        e.currentTarget.setAttribute("aria-pressed", String(picked().has(id))); save(); tally();
      } }, label)))));
    const own = h("input", { class: "input", type: "text", placeholder: "Something else…", maxlength: 40, "aria-label": "Add your own" });
    const ownForm = h("form", { class: "add", onsubmit: e => { e.preventDefault(); const t = own.value.trim(); if (!t) return; S.criteria.push({ id: "own-" + uid(), label: t.charAt(0).toUpperCase() + t.slice(1), importance: null }); own.value = ""; save(); tally(); } }, own, h("button", { class: "btn btn-ghost", type: "submit" }, "Add"));
    const count = h("p", { class: "hint" });
    const tally = () => { const n = S.criteria.length; count.textContent = n ? `${n} chosen.${n > 7 ? " That's a lot. It's fine for now; weighting comes next." : ""}` : ""; };
    tally();
    return [
      who(), prompt("What could matter here?"),
      hint("Pick everything that matters. Don't rank yet."),
      groups, ownForm, count,
      actions(() => S.criteria.length >= 2, "Pick at least two things that matter.")
    ];
  });

  // 3 · Importance
  steps.push(() => [
    who(), prompt("If you couldn't have everything, what would you protect?"),
    hint("How much does each one matter?"),
    h("div", { class: "rows" }, S.criteria.map(c => h("div", { class: "qrow" }, h("div", { class: "lbl" }, c.label),
      choices(C.importance, c.importance, v => { c.importance = v; save(); }, "small")))),
    actions(() => S.criteria.every(c => c.importance), "Weigh each one, even roughly.")
  ]);

  // 4 · Assess each option, and how sure you are
  steps.push(() => {
    const os = opts();
    const rows = S.criteria.map(c => {
      const ev = S.evals[c.id] || (S.evals[c.id] = { pref: null, ratings: {}, conf: null });
      let control;
      if (os.length === 2) {
        const [a, b] = os;
        control = choices([[2, `${short(L(a))}, clearly`], [1, short(L(a))], [0, "About the same"], [-1, short(L(b))], [-2, `${short(L(b))}, clearly`]], ev.pref, v => { ev.pref = v; save(); }, "small");
      } else {
        control = h("div", { class: "rows" }, os.map(o => h("div", { class: "subrow" }, h("span", { class: "sub" }, L(o)), choices([[1, "Poor"], [2, "Weak"], [3, "Okay"], [4, "Good"], [5, "Strong"]], ev.ratings[o.id], v => { ev.ratings[o.id] = v; save(); }, "small"))));
      }
      return h("div", { class: "qrow" }, h("div", { class: "lbl" }, c.label), h("p", { class: "sub" }, os.length === 2 ? "Which is better on this?" : "How does each one do on this?"), control,
        h("p", { class: "sub", style: "margin-top:6px" }, "How sure are you?"), choices(C.confidence, ev.conf, v => { ev.conf = v; save(); }, "small"));
    });
    const done = () => S.criteria.every(c => { const ev = S.evals[c.id]; return ev && ev.conf && (os.length === 2 ? typeof ev.pref === "number" : os.every(o => ev.ratings[o.id])); });
    return [
      who(), prompt("For each one: which is better, and how sure are you?"),
      hint("Your read and your confidence are stored separately. Guessing is a real answer."),
      h("div", { class: "rows" }, rows),
      actions(done, "Answer both parts for each one.")
    ];
  });

  // 5 · Context (optional)
  steps.push(() => {
    const n = S.notes;
    const hope = h("textarea", { class: "input", placeholder: "Less stress. More money. To feel like myself again…", "aria-label": "What are you hoping changes?" }, n.hope);
    const worry = h("textarea", { class: "input", placeholder: "The outcome I keep picturing is…", "aria-label": "What are you most worried about?" }, n.worry);
    worry.addEventListener("input", () => { n.worry = worry.value; save(); });
    const test = h("div", { class: "test" }), disc = h("div", { class: "discovery", "aria-live": "polite" });
    function renderTest() {
      test.innerHTML = ""; disc.innerHTML = "";
      const t = E.tension(S); if (!t) return;
      test.appendChild(who()); test.appendChild(h("p", { class: "hint", style: "color:var(--ink)" }, t));
      test.appendChild(prompt(esc(E.stillWantQuestion(S))));
      test.appendChild(choices([["yes", "Yes, I'd still want to"], ["no", "No, probably not"], ["unsure", "I'm not sure"]], n.stillWant, v => { n.stillWant = v; delete S.ruledOut.hope; save(); renderDisc(); }));
      renderDisc();
    }
    function renderDisc() { disc.innerHTML = ""; const d = E.discovery(S); if (!d) return; disc.appendChild(who()); disc.appendChild(h("p", { class: "prompt small" }, d)); }
    hope.addEventListener("input", () => { n.hope = hope.value; save(); renderTest(); });
    renderTest();
    const sq = E.statusQuo(S);
    const act = actions(() => !n.hope.trim() || !sq || n.stillWant, "If you've said what you hope for, answer the test too.", n.hope.trim() || n.worry.trim() ? "Continue" : "Skip");
    const relabel = () => { const b = act.querySelector(".btn:not(.btn-ghost)"); if (b) b.firstChild.textContent = (n.hope.trim() || n.worry.trim()) ? "Continue" : "Skip"; };
    hope.addEventListener("input", relabel); worry.addEventListener("input", relabel);
    return [
      who(), prompt("A little context. Optional."),
      hint("Nothing here is calculated. It's kept in your words, and one of it becomes a test."),
      h("div", { class: "field" }, h("label", {}, sq ? `What are you hoping changes if you ${esc(E.changeVerb(S))}?` : "What are you hoping changes?"), hope),
      test, disc,
      h("div", { class: "field" }, h("label", {}, "What are you most worried about?"), worry),
      act
    ];
  });

  // 6 · Confirm the Pivot
  steps.push(() => {
    const pv = E.pivot(S);
    if (pv.kind === "none" || pv.kind === "robust") {
      return [who(), prompt(pv.kind === "none" ? "Everything you named, you're sure of." : "Nothing you're unsure about would change the order."), hint("There isn't a question left that would change this. The report says so, plainly."),
        h("div", { class: "actions" }, h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(S.step - 1) }, "Back"), h("button", { class: "btn", type: "button", onclick: () => think() }, "Show me what this depends on", h("span", { class: "arrow", "aria-hidden": "true" }, "→")))];
    }
    const key = pv.kind === "hope" ? "hope" : pv.r.c.id;
    return [
      who(), prompt("If you knew the answer to this, could it change your decision?"),
      h("p", { class: "you" }, pv.question),
      hint("This is the uncertainty that moves the result most, given how much it matters to you and how sure you are. You get the final say on whether it's real."),
      choices([["yes", "Yes, it could"], ["no", "No, not really"], ["unsure", "I'm not sure"]], S.confirm === key ? "yes" : null, v => {
        if (v === "no") { S.ruledOut[key] = true; S.confirm = null; save(); go(6); }
        else { S.confirm = key; save(); }
      }),
      h("div", { class: "actions" }, h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(S.step - 1) }, "Back"), h("button", { class: "btn", type: "button", onclick: () => { if (S.confirm === key) think(); else say("Say whether knowing this could change your decision."); } }, "Show me what this depends on", h("span", { class: "arrow", "aria-hidden": "true" }, "→")))
    ];
  });

  // 7 · The synthesis
  steps.push(() => {
    const r = E.report(S);
    const row = (k, ...v) => h("div", { class: "row" }, h("span", { class: "k" }, k), ...v);
    const items = xs => xs.length ? h("ul", { class: "plain" }, xs.map(x => h("li", {}, x.text))) : h("span", { class: "v quiet" }, "Nothing here.");
    const report = h("article", { class: "report", "aria-label": "What this depends on" },
      h("h3", {}, S.title.replace(/^(i'm |i am )?deciding whether to /i, "").replace(/^./, c => c.toUpperCase()) + "?"),
      h("p", { class: "v quiet", style: "margin-top:4px" }, opts().map(L).join(" · ")),
      row("What matters most", h("span", { class: "v" }, r.matters.join(" · "))),
      r.reframe ? row("What you're really asking", h("p", { class: "v big" }, r.reframe[0]), h("p", { class: "v", style: "margin-top:6px" }, r.reframe[1])) : null,
      row("What appears clear", items(r.clear.concat(r.same))),
      row("What you're less certain about", items(r.unsure)),
      row("The tension", h("span", { class: "v" }, r.tensionLine.text)),
      r.settled
        ? h("div", { class: "row pivot-row" }, h("span", { class: "k" }, "Where you are"), h("p", { class: "v", style: "margin-bottom:6px" }, "Based on what you've told me:"), h("span", { class: "v big" }, r.settled.title), h("p", { class: "v", style: "margin-top:6px" }, r.settled.body))
        : h("div", { class: "row pivot-row" }, h("span", { class: "k" }, "The Pivot"), r.observation ? h("p", { class: "v", style: "margin-bottom:6px" }, r.observation) : null, h("span", { class: "v big" }, r.pivotBlock), h("p", { class: "v", style: "margin-top:6px" }, r.stability)),
      r.changeMind ? row("What could change your mind", h("span", { class: "v" }, r.changeMind)) : null,
      r.learn ? row("What might be worth learning", h("span", { class: "v big" }, r.learn.text), r.learn.rest.length ? h("p", { class: "v quiet", style: "margin-top:8px" }, `Less important: ${r.learn.rest.join(", ")}.`) : null, h("p", { class: "v", style: "margin-top:8px" }, "You don't need more information about everything. You need better information about this.")) : null,
      r.worry ? row("In your words", h("span", { class: "v quiet" }, `“${r.worry.trim()}”`)) : null,
      h("p", { class: "closing" }, "Now you know what you're deciding.")
    );
    const missing = h("div", { class: "after missing" });
    function renderMissing() {
      missing.innerHTML = "";
      missing.appendChild(h("h4", {}, "Does this feel right?"));
      if (S.feedback === "yes") { missing.appendChild(h("p", { class: "thanks" }, "Then this is your decision, as you've described it. Clarity only ever sees what's been put into it.")); return; }
      if (S.feedback === "no") {
        missing.appendChild(h("p", { class: "hint" }, "What's missing?"));
        missing.appendChild(choices([["factor", "Something that matters"], ["option", "Another way this could go"], ["assumption", "An assumption I've made"], ["other", "Something else"]], S.missing, v => { S.missing = v; save(); renderMissing(); }));
        if (S.missing === "factor") missing.appendChild(h("p", { class: "hint" }, "Add it on the “what could matter” screen; the rest of your answers are kept."), h("button", { class: "btn", type: "button", onclick: () => { S.feedback = null; save(); go(2); } }, "Add what matters"));
        if (S.missing === "option") missing.appendChild(h("button", { class: "btn", type: "button", onclick: () => { S.feedback = null; S.options.push({ id: uid(), label: "" }); save(); go(1); } }, "Add another way"));
        if (S.missing === "assumption") missing.appendChild(h("p", { class: "hint" }, "Go back to “each option” and lower your confidence on the thing you've been assuming. The Pivot will move if it should."), h("button", { class: "btn", type: "button", onclick: () => { S.feedback = null; save(); go(4); } }, "Revisit my confidence"));
        if (S.missing === "other") { const inp = h("input", { class: "input", type: "text", placeholder: "In a few words", maxlength: 120, "aria-label": "What's missing?" }); missing.appendChild(h("form", { class: "add", onsubmit: e => { e.preventDefault(); S.notes.missing = inp.value.trim(); S.feedback = "noted"; save(); renderMissing(); } }, inp, h("button", { class: "btn", type: "submit" }, "Keep this"))); }
        return;
      }
      if (S.feedback === "noted") { missing.appendChild(h("p", { class: "thanks" }, "Kept, in your words. It isn't calculated, but it's part of the record.")); return; }
      missing.appendChild(choices([["yes", "Yes, this captures it"], ["no", "Not quite"]], null, v => { S.feedback = v; save(); renderMissing(); }));
    }
    renderMissing();
    const feel = h("div", { class: "after" }, h("h4", {}, "And compared with before?"), S.feeling ? h("p", { class: "thanks" }, S.feeling === "lighter" ? "That's the whole point." : "Thank you for saying so.") : choices([["lighter", "Lighter"], ["same", "About the same"], ["heavier", "Heavier"]], null, v => { S.feeling = v; save(); feel.replaceWith(steps[7]().find(n => n.classList && n.classList.contains("after") && !n.classList.contains("missing"))); }));
    const text = () => [
      `CLARITY · ${S.title}`, opts().map(L).join(" · "), ``, `What matters most: ${r.matters.join(", ")}`,
      r.reframe ? `What you're really asking: ${r.reframe.join(" ")}` : null,
      `What appears clear: ${r.clear.concat(r.same).map(x => x.text).join(" ") || "—"}`, `What you're less certain about: ${r.unsure.map(x => x.text).join(" ") || "—"}`,
      `The tension: ${r.tensionLine.text}`, ``,
      r.settled ? `Based on what you've told me: ${r.settled.title} ${r.settled.body}` : `THE PIVOT: ${r.observation ? r.observation + " " : ""}${r.pivotBlock} ${r.stability}`, ``,
      r.changeMind ? `What could change your mind: ${r.changeMind}` : null,
      r.learn ? `What might be worth learning: ${r.learn.text}${r.learn.rest.length ? ` Less important: ${r.learn.rest.join(", ")}.` : ""} You don't need more information about everything. You need better information about this.` : null,
      ``, `Now you know what you're deciding.`].filter(x => x !== null).join("\n");
    return [
      who(), prompt("Here's what this depends on."),
      hint("Based on what you've told me. No score, no verdict. Which uncertainty matters, and what to do about it."),
      report,
      h("div", { class: "report-actions" },
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => navigator.clipboard.writeText(text()).then(() => say("Copied."), () => say("Couldn't copy.")) }, "Copy"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => window.print() }, "Print"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(4) }, "Change an answer"),
        h("button", { class: "btn", type: "button", onclick: () => { S = fresh(""); save(); go(0); } }, "Another decision")),
      missing, feel
    ];
  });

  function think() {
    save(); stage.innerHTML = "";
    const m = h("div", { class: "mark" });
    stage.appendChild(h("div", { class: "thinking" }, m, h("p", {}, "Letting one thing fall.")));
    Clover.mount(m).play().then(() => setTimeout(() => go(7), 400));
  }
  function renderProgress() {
    progress.innerHTML = "";
    C.steps.forEach((label, i) => progress.appendChild(h("i", { class: i < S.step ? "done" : i === S.step ? "now" : "", title: label })));
    progress.setAttribute("aria-valuemax", String(C.steps.length - 1));
    progress.setAttribute("aria-valuenow", String(S.step));
    progress.setAttribute("aria-valuetext", `${C.steps[S.step]}, step ${S.step + 1} of ${C.steps.length}`);
  }
  function go(i) {
    S.step = Math.max(0, Math.min(steps.length - 1, i)); save();
    const old = stage.firstElementChild;
    const paint = () => {
      stage.innerHTML = "";
      const step = h("div", { class: "step", "data-step": String(S.step) }, steps[S.step]());
      stage.appendChild(step);
      renderProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
      const first = step.querySelector("input:not([type=range]), textarea");
      if (first && window.innerWidth > 720 && S.step <= 1) first.focus();
    };
    if (old && !matchMedia("(prefers-reduced-motion: reduce)").matches) { old.classList.add("out"); setTimeout(paint, 300); } else paint();
  }
  go(S.step);
})();
