/* Clarity — the conversation. Seven questions. Each one makes the problem smaller. */
(function () {
  const C = window.Content, E = window.Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#stage"), progress = $("#progress"), toast = $("#toast");
  const KEY = "clarity-session-2";

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
  const lower = t => E.lower(t);

  function fresh(q) {
    const o = C.inferOptions(q);
    return { step: 0, question: q || "", options: { a: { label: o.a }, b: { label: o.b } }, optionsEdited: false,
      hard: "", hope: "", stillWant: null, hopeRuledOut: false, checked: null, factors: [], lean: null, findOut: null, reversibility: null, feedback: null };
  }
  let S;
  const params = new URLSearchParams(location.search);
  try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
  if (params.get("q") && (!S || S.question !== params.get("q"))) S = fresh(params.get("q"));
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
  const A = () => E.toYou(S.options.a.label), B = () => E.toYou(S.options.b.label);
  const short = l => l.length > 22 ? l.slice(0, 20).trim() + "…" : l;

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
  const nextFactorsNeedingBasis = () => S.factors.filter(f => f.winner && f.winner !== "unknown");

  const steps = [];

  // 0 · The decision
  steps.push(() => {
    const q = h("input", { class: "input big", type: "text", value: S.question, placeholder: "Should I…", maxlength: 160, "aria-label": "What's on your mind?" });
    const a = h("input", { class: "input", type: "text", value: A(), maxlength: 60, "aria-label": "Option A" });
    const b = h("input", { class: "input", type: "text", value: B(), maxlength: 60, "aria-label": "Option B" });
    const toneLine = h("p", { class: "hint" });
    const setTone = () => { toneLine.textContent = C.tone(S.question) === "heavy" ? "This sounds like one where the facts and your feelings are pulling in different directions. We'll take it slowly." : "We won't tell you what to do. We'll find what this depends on."; };
    setTone();
    q.addEventListener("input", () => { S.question = q.value; if (!S.optionsEdited) { const o = C.inferOptions(S.question); S.options.a.label = o.a; S.options.b.label = o.b; a.value = o.a; b.value = o.b; } setTone(); });
    a.addEventListener("input", () => { S.options.a.label = a.value; S.optionsEdited = true; });
    b.addEventListener("input", () => { S.options.b.label = b.value; S.optionsEdited = true; });
    return [
      who(), prompt("What's on your mind?"), toneLine,
      q,
      h("div", { class: "two" },
        h("div", { class: "field" }, h("label", { class: "opt-label" }, h("i", { class: "dot" }), "One way"), a),
        h("div", { class: "field" }, h("label", { class: "opt-label b" }, h("i", { class: "dot" }), "The other"), b)),
      actions(() => S.question.trim().length > 2 && A().trim() && B().trim(), "Name the decision and both ways first.")
    ];
  });

  // 1 · What's making this hard?
  steps.push(() => {
    const ta = h("textarea", { class: "input", placeholder: "In your own words.", "aria-label": "What's making this hard?" }, S.hard);
    ta.addEventListener("input", () => { S.hard = ta.value; });
    return [who(), prompt("What's making this hard?"), hint("Not the options. The knot."), ta,
      actions(() => S.hard.trim().length > 1, "A sentence is enough.")];
  });

  // 2 · What are you hoping changes? Would you still want it?
  steps.push(() => {
    const ta = h("textarea", { class: "input", placeholder: "Less stress. More money. To feel like myself again…", "aria-label": "What are you hoping changes?" }, S.hope);
    ta.addEventListener("input", () => { S.hope = ta.value; renderDiscovery(); });
    const disc = h("div", { class: "discovery", "aria-live": "polite" });
    function renderDiscovery() {
      const line = E.discovery(S);
      disc.innerHTML = "";
      if (!line) return;
      disc.appendChild(who());
      disc.appendChild(h("p", { class: "prompt small" }, line));
    }
    renderDiscovery();
    return [
      who(), prompt(`What are you hoping changes if you <em>${esc(lower(A()))}</em>?`), ta,
      h("div", { class: "rule" }),
      who(), prompt(`If <em>${esc(lower(B()))}</em> gave you exactly that tomorrow, would you still want to ${esc(lower(A()))}?`),
      choices([["yes", "Yes, I'd still want to"], ["no", "No, probably not"], ["unsure", "I'm not sure"]], S.stillWant, v => { S.stillWant = v; S.hopeRuledOut = false; save(); renderDiscovery(); }),
      disc,
      actions(() => S.hope.trim().length > 1 && S.stillWant, "Say what you're hoping for, and whether you'd still go.")
    ];
  });

  // 3 · What does this come down to?
  steps.push(() => {
    const picked = () => S.factors.map(f => f.id);
    const list = h("div", { class: "picked" });
    function renderList() {
      list.innerHTML = "";
      S.factors.forEach((f, i) => list.appendChild(h("span", { class: "pick" }, `${i + 1}. ${f.label}`, h("button", { type: "button", "aria-label": "Remove " + f.label, onclick: () => { S.factors.splice(i, 1); save(); renderList(); chips.querySelectorAll(".choice").forEach(c => c.setAttribute("aria-pressed", String(picked().includes(c.dataset.id)))); } }, "×"))));
    }
    function add(id, label) {
      if (picked().includes(id)) { S.factors = S.factors.filter(f => f.id !== id); }
      else { if (S.factors.length >= 4) return say("Four is plenty. Leave out what wouldn't change your mind."); S.factors.push({ id, label, winner: null, basis: null, flips: null }); }
      save(); renderList();
    }
    const chips = h("div", { class: "choices" }, C.factors.map(v => h("button", { class: "choice", type: "button", "data-id": v.id, "aria-pressed": String(picked().includes(v.id)), onclick: e => { add(v.id, v.label); e.currentTarget.setAttribute("aria-pressed", String(picked().includes(v.id))); } }, v.label)));
    const own = h("input", { class: "input", type: "text", placeholder: "Something else…", maxlength: 40, "aria-label": "Add your own" });
    const ownForm = h("form", { class: "add", onsubmit: e => { e.preventDefault(); const t = own.value.trim(); if (!t) return; add("own-" + Date.now(), t.charAt(0).toUpperCase() + t.slice(1)); own.value = ""; } }, own, h("button", { class: "btn btn-ghost", type: "submit" }, "Add"));
    renderList();
    return [
      who(), prompt("What does this decision come down to?"),
      hint("Pick up to four, most important first. Leave out anything that wouldn't change your mind."),
      chips, ownForm, list,
      actions(() => S.factors.length >= 2, "Pick at least two.")
    ];
  });

  // 4 · Which option is stronger on each?
  steps.push(() => {
    const rows = h("div", { class: "rows" }, S.factors.map(f => h("div", { class: "qrow" }, h("div", { class: "lbl" }, f.label),
      choices([["a", short(A())], ["b", short(B())], ["unknown", "Don't know"]], f.winner, v => { f.winner = v; if (v === "unknown") f.basis = null; save(); }, "small"))));
    return [
      who(), prompt("For each one: which is stronger?"),
      hint("“Don't know” is a real answer. It's often the most useful one."),
      rows,
      actions(() => S.factors.every(f => f.winner), "Answer each one, even if the answer is “don't know”.")
    ];
  });

  // 5 · Do you know that, or are you assuming it?
  steps.push(() => {
    const need = nextFactorsNeedingBasis();
    const rows = h("div", { class: "rows" }, need.map(f => h("div", { class: "qrow" }, h("div", { class: "lbl" }, `${quoteL(f.winner)} is stronger on ${f.label.toLowerCase()}.`),
      choices([["know", "I know that"], ["assume", "I'm assuming it"]], f.basis, v => { f.basis = v; save(); }, "small"))));
    return [
      who(), prompt("Do you know that, or are you assuming it?"),
      hint("Known means you could verify it today."),
      rows,
      actions(() => need.every(f => f.basis), "Say which ones you actually know.")
    ];
  });
  const quoteL = id => `“${S.options[id].label}”`;

  // 6 · Which way are you leaning? Would you still lean if you were wrong?
  steps.push(() => {
    const flipsBox = h("div", { class: "rows", style: "margin-top:8px" });
    function renderFlips() {
      flipsBox.innerHTML = "";
      if (!S.lean || S.lean === "torn") return;
      const unc = E.uncertain(S);
      if (!unc.length) return;
      flipsBox.appendChild(h("div", { class: "rule" }));
      flipsBox.appendChild(who());
      flipsBox.appendChild(prompt("And if you were wrong?"));
      flipsBox.appendChild(hint("Take each thing you're unsure about. If it went the other way, would you still lean the same way?"));
      unc.forEach(f => {
        const claim = f.winner === "unknown" ? `If ${quoteL(S.lean === "a" ? "b" : "a")} turned out stronger on ${f.label.toLowerCase()}` : `If ${quoteL(f.winner)} turned out not to be stronger on ${f.label.toLowerCase()}`;
        flipsBox.appendChild(h("div", { class: "qrow" }, h("div", { class: "lbl" }, `${claim}, would you still lean ${quoteL(S.lean)}?`),
          choices([["still", "Yes, still"], ["flip", "No, that changes it"]], f.flips === null ? null : (f.flips ? "flip" : "still"), v => { f.flips = v === "flip"; save(); }, "small")));
      });
    }
    renderFlips();
    return [
      who(), prompt("Right now, which way are you leaning?"),
      choices([["a", A()], ["b", B()], ["torn", "Honestly torn"]], S.lean, v => { S.lean = v; save(); renderFlips(); }),
      flipsBox,
      actions(() => S.lean && (S.lean === "torn" || E.uncertain(S).every(f => f.flips !== null)), "Say which way you lean, and answer each “if you were wrong”.")
    ];
  });

  // 7 · Can you find it out? Can you undo it?
  steps.push(() => {
    const pv = E.pivot(S);
    const leanLabel = S.lean && S.lean !== "torn" ? S.options[S.lean].label : A();
    const block = [];
    if (pv.statement) {
      const opts = [["soon", "Yes, within a few weeks"], ["while", "Yes, but it would take a while"], ["doing", "Only by doing it"]];
      if (pv.kind === "hope") opts.push(["cant", "No. I already know it can't."]);
      block.push(who(), prompt(`Could you find out ${esc(pv.statement)} <em>before</em> deciding?`),
        choices(opts, S.findOut, v => { if (v === "cant") { S.hopeRuledOut = true; S.findOut = null; save(); go(7); } else { S.findOut = v; save(); } }));
    } else {
      block.push(who(), prompt("One last thing."), hint("Nothing you're unsure about would change your mind. So the remaining question is about the cost of being wrong."));
      S.findOut = S.findOut || "none";
    }
    block.push(h("div", { class: "rule" }), who(), prompt(`If you chose <em>${esc(lower(leanLabel))}</em> and it didn't work out, how hard would it be to undo?`),
      choices([["easy", "Easy enough"], ["hard", "Hard, or impossible"]], S.reversibility, v => { S.reversibility = v; save(); }),
      h("div", { class: "actions" },
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(S.step - 1) }, "Back"),
        h("button", { class: "btn", type: "button", onclick: () => { if (S.findOut && S.reversibility) think(); else say("Both answers matter here."); } }, "Show me what this depends on", h("span", { class: "arrow", "aria-hidden": "true" }, "→"))));
    return block;
  });

  // 8 · The report
  steps.push(() => {
    const r = E.report(S);
    const L = id => S.options[id].label;
    const row = (k, v, cls = "") => h("div", { class: "row " + cls }, h("span", { class: "k" }, k), typeof v === "string" ? h("span", { class: "v" }, v) : v);
    const items = xs => xs.length ? h("ul", { class: "plain" }, xs.map(x => h("li", {}, x.text))) : h("span", { class: "v quiet" }, "Nothing here.");
    const refresh = () => feedback.replaceWith(steps[8]().find(n => n.classList && n.classList.contains("after")));
    const feedback = h("div", { class: "after" },
      h("h4", {}, "Did anything become clearer?"),
      S.feedback ? h("p", { class: "thanks" }, "Thank you.") :
        choices([["do", "Yes, I know what I need to do"], ["find", "Yes, I know what I need to find out"], ["struggle", "Yes, I understand what I'm actually struggling with"], ["not", "Not yet"]], null, v => { S.feedback = v; save(); refresh(); }),
      h("h4", { style: "margin-top:10px" }, "And compared with before?"),
      S.feeling ? h("p", { class: "thanks" }, S.feeling === "lighter" ? "That's the whole point." : "Thank you for saying so.") :
        choices([["lighter", "Lighter"], ["same", "About the same"], ["heavier", "Heavier"]], null, v => { S.feeling = v; save(); refresh(); }));
    const report = h("article", { class: "report", "aria-label": "Your Clarity Report" },
      h("h3", {}, S.question.replace(/[.?!]+$/, "") + "?"),
      h("p", { class: "v quiet", style: "margin-top:4px" }, `${L("a")} · ${L("b")}`),
      r.reframe ? h("div", { class: "row" }, h("span", { class: "k" }, "What you're really asking"), h("p", { class: "v big" }, r.reframe[0]), h("p", { class: "v", style: "margin-top:6px" }, r.reframe[1])) : null,
      r.settled
        ? h("div", { class: "row pivot-row" }, h("span", { class: "k" }, "Where you are"), h("p", { class: "v", style: "margin-bottom:6px" }, "Based on what you've told me:"), h("span", { class: "v big" }, r.settled.title), h("p", { class: "v", style: "margin-top:6px" }, r.settled.body))
        : h("div", { class: "row pivot-row" }, h("span", { class: "k" }, "The Pivot"), h("p", { class: "v", style: "margin-bottom:6px" }, "Based on what you've told me, this appears to hinge on:"), h("span", { class: "v big" }, r.pivot.question), h("p", { class: "v", style: "margin-top:6px" }, r.pivotNote)),
      h("div", { class: "row" }, h("span", { class: "k" }, "Right now"),
        h("dl", { class: "now" },
          h("dt", {}, "Known"), h("dd", {}, r.structure.known.length ? r.structure.known.map(x => h("span", {}, x.text)) : h("span", { class: "quiet" }, "Nothing you named.")),
          h("dt", {}, "Assumed"), h("dd", {}, r.structure.assumed.length ? r.structure.assumed.map(x => h("span", {}, x.text)) : h("span", { class: "quiet" }, "Nothing you named.")),
          h("dt", {}, "Unknown"), h("dd", {}, r.structure.unknown.length ? r.structure.unknown.map(x => h("span", {}, x.text)) : h("span", { class: "quiet" }, "Nothing you named.")))),
      h("div", { class: "row" }, h("span", { class: "k" }, "The tradeoff"),
        r.pairs.length ? h("dl", { class: "now" }, r.pairs.map(p => [h("dt", {}, p.factor), h("dd", {}, p.option)])) : null,
        h("p", { class: "v", style: r.pairs.length ? "margin-top:8px" : "" }, r.tradeoffLine)),
      h("div", { class: "row" }, h("span", { class: "k" }, r.settled ? "What's left" : "Find out this first"), h("span", { class: "v big" }, r.next), r.how ? h("p", { class: "v", style: "margin-top:8px" }, r.how) : null, r.wait ? h("p", { class: "v", style: "margin-top:8px" }, r.wait) : null, !r.settled ? h("p", { class: "v", style: "margin-top:8px" }, "You don't have to solve everything. Just this.") : null),
      h("p", { class: "closing" }, "Now you know what you're deciding.")
    );
    const text = () => [
      `CLARITY · ${S.question}`, `${L("a")} · ${L("b")}`, ``,
      r.reframe ? `What you're really asking: ${r.reframe.join(" ")}\n` : null,
      r.settled ? `${r.settled.title} ${r.settled.body}` : `THE PIVOT: ${r.pivot.question} ${r.pivotNote}`, ``,
      `Known: ${r.structure.known.map(x => x.text).join(" ") || "—"}`,
      `Assumed: ${r.structure.assumed.map(x => x.text).join(" ") || "—"}`,
      `Unknown: ${r.structure.unknown.map(x => x.text).join(" ") || "—"}`, ``,
      `The tradeoff: ${r.pairs.map(p => `${p.factor}: ${p.option}`).join(" · ")}${r.pairs.length ? ". " : ""}${r.tradeoffLine}`, ``,
      `Find out this first: ${r.next}${r.how ? " " + r.how : ""}${r.wait ? " " + r.wait : ""}`, ``, `Now you know what you're deciding.`
    ].filter(x => x !== null).join("\n");
    const check = h("div", { class: "after missing" });
    function renderCheck() {
      check.innerHTML = "";
      check.appendChild(h("h4", {}, "One thing to check"));
      check.appendChild(h("p", { class: "hint" }, "Clarity can only see what's been put into the decision. Is there anything important you're worried about that isn't represented above?"));
      if (S.checked === "no") { check.appendChild(h("p", { class: "thanks" }, "Then this is the whole picture, as far as you've described it.")); return; }
      if (S.checked === "yes") {
        const inp = h("input", { class: "input", type: "text", placeholder: "What is it? A few words.", maxlength: 40, "aria-label": "What's missing?" });
        check.appendChild(h("form", { class: "add", onsubmit: e => {
          e.preventDefault(); const t = inp.value.trim(); if (!t) return say("Name it in a few words.");
          S.factors.push({ id: "own-" + Date.now(), label: t.charAt(0).toUpperCase() + t.slice(1), winner: null, basis: null, flips: null });
          S.checked = null; S.findOut = null; save(); go(4);
        } }, inp, h("button", { class: "btn", type: "submit" }, "Add it and look again")));
        check.appendChild(h("p", { class: "hint" }, "It becomes part of the decision. Clarity will ask about it and look again."));
        return;
      }
      check.appendChild(choices([["yes", "Yes, there's something"], ["no", "No, that's everything"]], null, v => { S.checked = v; save(); renderCheck(); }));
    }
    renderCheck();
    return [
      who(), prompt("Here's what this depends on."),
      hint("Based on what you've told me. If something important isn't here, you can add it below."),
      report, check,
      h("div", { class: "report-actions" },
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => navigator.clipboard.writeText(text()).then(() => say("Copied."), () => say("Couldn't copy.")) }, "Copy"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => window.print() }, "Print"),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => go(6) }, "Change an answer"),
        h("button", { class: "btn", type: "button", onclick: () => { S = fresh(""); save(); go(0); } }, "Another decision")),
      feedback
    ];
  });

  function think() {
    save(); stage.innerHTML = "";
    const m = h("div", { class: "mark" });
    stage.appendChild(h("div", { class: "thinking" }, m, h("p", {}, "Letting one thing fall.")));
    Clover.mount(m).play().then(() => setTimeout(() => go(8), 400));
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
      // step 5 may skip itself when there is nothing to ask
      if (S.step === 5 && !nextFactorsNeedingBasis().length) { S.step = old && old.dataset.step === "6" ? 4 : 6; save(); }
      const step = h("div", { class: "step", "data-step": String(S.step) }, steps[S.step]());
      stage.appendChild(step);
      renderProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
      const first = step.querySelector("input:not([type=range]), textarea");
      if (first && window.innerWidth > 720) first.focus();
    };
    if (old && !matchMedia("(prefers-reduced-motion: reduce)").matches) { old.classList.add("out"); setTimeout(paint, 300); } else paint();
  }
  go(S.step);
})();
