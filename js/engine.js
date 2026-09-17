/* Clarity — decision engine.
   Deterministic. No language model decides a number here.
   Input: a session (see app.js for shape). Output: a structured report.
   The engine discovers the structure of the decision; it never says "do X". */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

  /* ---- 1. Value-weighted comparison ----
     score(option) = Σ weight_v × rating_v(option), ratings 1–5, weights 1–5. */
  function valueScores(s) {
    const rows = s.values.map(v => {
      const r = s.ratings[v.id] || { a: 3, b: 3 };
      return { id: v.id, label: v.label, w: v.weight, a: r.a, b: r.b, contrib: v.weight * (r.a - r.b) };
    });
    const total = rows.reduce((t, r) => t + r.w * 4, 0) || 1;   // max possible |margin|
    const margin = rows.reduce((t, r) => t + r.contrib, 0);
    return { rows, margin, total, lean: margin / total };          // lean ∈ [-1, 1], + favours A
  }

  /* ---- 2. Horizons: short vs long-term conflict ---- */
  function horizons(s) {
    const h = s.horizons;
    const shortGap = h.a.short - h.b.short, longGap = h.a.long - h.b.long;
    const conflict = Math.sign(shortGap) !== Math.sign(longGap) && Math.abs(shortGap) >= 1 && Math.abs(longGap) >= 1;
    return { shortGap, longGap, conflict, shortWinner: shortGap > 0 ? "a" : shortGap < 0 ? "b" : null, longWinner: longGap > 0 ? "a" : longGap < 0 ? "b" : null };
  }

  /* ---- 3. Sensitivity: which single factor could flip the lean? ----
     For each value, the fraction of its contribution that must vanish to flip the margin.
     Smaller = more sensitive. */
  function sensitivity(vs) {
    const M = vs.margin;
    const cands = vs.rows
      .filter(r => r.contrib !== 0 && Math.sign(r.contrib) === Math.sign(M || 1))
      .map(r => ({ ...r, need: Math.abs(M) / Math.abs(r.contrib) }))   // need ≤ 1 → removing it flips
      .sort((x, y) => x.need - y.need);
    const top = cands[0] || null;
    const level = Math.abs(vs.lean) < 0.12 ? "High" : Math.abs(vs.lean) < 0.3 ? "Medium" : "Low";
    return { top, level, flippable: cands.filter(c => c.need <= 1).length };
  }

  /* ---- 4. Epistemics: facts, beliefs, unknowns ---- */
  function epistemics(s) {
    const facts = s.items.filter(i => i.kind === "fact");
    const beliefs = s.items.filter(i => i.kind === "belief");
    const unknowns = s.items.filter(i => i.kind === "unknown");
    const lean = valueScores(s).lean;
    const side = lean >= 0 ? "a" : "b";
    const leaningBeliefs = beliefs.filter(b => b.side === side);
    return { facts, beliefs, unknowns, leaningBeliefs, restsOnBeliefs: beliefs.length > facts.length || leaningBeliefs.length >= 2 };
  }

  /* ---- 5. Defensible range vs the user's own prediction ----
     Map lean to a probability that A leaves them better off, then widen for what isn't known. */
  function modelRange(s, vs, ep) {
    const centre = clamp(0.5 + vs.lean * 0.42, 0.12, 0.88);
    const width = clamp(0.05 + 0.025 * ep.unknowns.length + 0.02 * ep.beliefs.length + (s.stress ? 0.025 * s.stress.filter(x => x.plausible).length : 0), 0.05, 0.2);
    const lo = clamp(centre - width, 0.05, 0.95), hi = clamp(centre + width, 0.05, 0.95);
    const p = s.prediction / 100;
    const gap = p > hi ? p - hi : p < lo ? p - lo : 0;
    return { lo: round(lo * 100), hi: round(hi * 100), centre: round(centre * 100), gap: round(gap * 100), user: s.prediction };
  }

  /* ---- 6. Risk: reversibility, regret asymmetry, waiting ---- */
  function risk(s, side) {
    const rev = s.reversibility;                  // 1 = permanent, 5 = easy to undo
    const other = side === "a" ? "b" : "a";
    const leanHarder = rev[side] < rev[other];    // the option you lean to is harder to undo
    const bothHigh = s.regret.act >= 4 && s.regret.inact >= 4;
    const regretLean = s.regret.act - s.regret.inact; // + fears action more
    const wait = s.wait || { cost: "medium", info: "no" };
    const waitVerdict =
      wait.info === "yes" && wait.cost === "low" ? "cheap-and-useful" :
      wait.info === "yes" && wait.cost === "medium" ? "useful-but-costly" :
      wait.info === "no" && wait.cost === "low" ? "cheap-but-empty" : "costly";
    return { rev, leanHarder, bothHigh, regretLean, waitVerdict };
  }

  /* ---- 7. Clarity level: quality of the decision *process*, not the option ---- */
  function clarity(s, vs, sens, ep, hz, rk) {
    const reasons = [], warnings = [];
    let pts = 0;
    if (s.values.length >= 3) { pts++; reasons.push("Your values are named, not implied."); }
    const topV = [...vs.rows].sort((x, y) => y.w - x.w)[0];
    if (topV && Math.abs(topV.a - topV.b) >= 2) { pts++; reasons.push(`Your options clearly differ on what you say matters most (${topV.label.toLowerCase()}).`); }
    if (ep.restsOnBeliefs) warnings.push(ep.beliefs.length > ep.facts.length ? `${ep.beliefs.length} belief${ep.beliefs.length === 1 ? "" : "s"} carry more weight than your ${ep.facts.length} fact${ep.facts.length === 1 ? "" : "s"}.` : `Your lean rests on ${ep.leaningBeliefs.length} beliefs you haven't verified.`);
    else if (ep.facts.length >= 2) { pts++; reasons.push("Most of what you're working from is fact, not belief."); }
    if (ep.unknowns.length <= 2) { pts++; reasons.push(ep.unknowns.length === 0 ? "You haven't named any unknowns. Either the picture is complete, or one is hiding." : "Only one or two unknowns materially affect the decision."); }
    else warnings.push(`${ep.unknowns.length} unknowns could still move the picture.`);
    if (sens.level === "Low") { pts++; reasons.push("Your lean holds under plausible changes to any single factor."); }
    else warnings.push(sens.level === "High" ? "Your lean flips under small changes to how you weigh things." : "Your lean is moderately sensitive to one factor.");
    if (!hz.conflict) { pts++; reasons.push("Short-term and long-term point the same way."); }
    else warnings.push("Six months and five years disagree.");
    if (s.stress && s.stress.filter(x => x.plausible).length >= 2) warnings.push("You found more than one plausible way the other option could be right.");
    else if (s.stress) { pts++; reasons.push("The strongest case for the other side didn't hold up for you."); }
    const level = pts >= 6 ? "High" : pts >= 4 ? "Medium" : "Low";
    return { level, pts, reasons, warnings };
  }

  /* ---- 8. The stress test: what would have to be true for the other option? ---- */
  function stressConditions(s) {
    const vs = valueScores(s), ep = epistemics(s);
    const side = vs.lean >= 0 ? "a" : "b", other = side === "a" ? "b" : "a";
    const L = id => s.options[id].label;
    const out = [];
    vs.rows.filter(r => (side === "a" ? r.contrib > 0 : r.contrib < 0)).sort((x, y) => Math.abs(y.contrib) - Math.abs(x.contrib)).slice(0, 3)
      .forEach(r => out.push({ id: "v-" + r.id, text: `“${L(side)}” delivers less ${r.label.toLowerCase()} than you expect, or “${L(other)}” delivers more.` }));
    ep.leaningBeliefs.slice(0, 2).forEach((b, i) => out.push({ id: "b-" + i, text: `It turns out not to be true that ${lower(b.text)}` }));
    ep.unknowns.slice(0, 2).forEach((u, i) => out.push({ id: "u-" + i, text: `What you don't know (${lower(u.text)}) resolves against “${L(side)}”.` }));
    if (s.horizons) {
      const hz = horizons(s);
      if (hz.conflict && hz.longWinner === other) out.push({ id: "h", text: `The five-year picture matters more to you than the six-month one.` });
      if (hz.conflict && hz.shortWinner === other) out.push({ id: "h", text: `The next six months matter more to you than you're admitting.` });
    }
    return out.slice(0, 6);
  }

  function lower(t) {
    t = (t || "").trim().replace(/[.?!]+$/, "").replace(/^(i think|i believe|i assume|i'm assuming|i am assuming|i feel like|i guess|i suspect|probably|maybe|i'm pretty sure|i'm sure)\s+(that\s+)?/i, "");
    return t.charAt(0) === "I" && t.charAt(1) !== " " && t.charAt(1) !== "'" ? t.charAt(0).toLowerCase() + t.slice(1) : t.charAt(0) === "I" ? t : t.charAt(0).toLowerCase() + t.slice(1);
  }

  /* ---- 9. Compose the report ---- */
  function report(s) {
    const vs = valueScores(s), sens = sensitivity(vs), ep = epistemics(s), hz = horizons(s);
    const side = vs.lean >= 0 ? "a" : "b", other = side === "a" ? "b" : "a";
    const rk = risk(s, side), rng = modelRange(s, vs, ep), cl = clarity(s, vs, sens, ep, hz, rk);
    const L = id => s.options[id].label;
    const byW = [...vs.rows].sort((x, y) => y.w - x.w);
    const forA = vs.rows.filter(r => r.contrib > 0).sort((x, y) => y.contrib - x.contrib)[0];
    const forB = vs.rows.filter(r => r.contrib < 0).sort((x, y) => x.contrib - y.contrib)[0];
    const plausible = (s.stress || []).filter(x => x.plausible);
    const ambiguous = Math.abs(vs.lean) < 0.12;

    // The Pivot: a belief the lean rests on beats a value if the margin is thin.
    let pivot;
    if (ep.leaningBeliefs.length && Math.abs(vs.lean) < 0.35) {
      const b = ep.leaningBeliefs[0];
      pivot = { kind: "belief", text: `Whether it's actually true that ${lower(b.text)}.`, ifYes: L(side), ifNo: L(other) };
    } else if (s.stillWant === "no" && s.hope) {
      pivot = { kind: "hope", text: `Whether “${L(other)}” could give you “${s.hope.trim().replace(/[.?!]+$/, "")}” without the change.`, ifYes: L(other), ifNo: L(side) };
    } else if (sens.top) {
      pivot = { kind: "value", text: `How much ${sens.top.label.toLowerCase()} really matters to you compared with everything else.`, ifYes: L(side), ifNo: L(other), need: sens.top.need };
    } else {
      pivot = { kind: "none", text: "No single factor flips this. The lean is robust." };
    }

    // The Next Question: the unknown the user flagged, else the first unknown, else verify the top belief.
    let next;
    const flagged = ep.unknowns.find(u => u.key) || ep.unknowns[0];
    if (flagged) next = `Find out: ${lower(flagged.text)}.`;
    else if (ep.leaningBeliefs[0]) next = `Before deciding, test the belief that ${lower(ep.leaningBeliefs[0].text)}. What would you need to see to lower your confidence in it?`;
    else if (rk.waitVerdict === "cheap-and-useful") next = "Waiting looks cheap and informative. Decide what you'd want to learn in the next six months, then set a date.";
    else next = `Speak to two people who have already chosen “${L(side)}”. Ask what they wish they'd known.`;

    // The tradeoff, in one line.
    let tradeoff;
    if (hz.conflict) tradeoff = `You're not choosing between two options. You're choosing between ${hz.shortWinner === side ? "short-term comfort and long-term opportunity" : "long-term opportunity and short-term comfort"}.`;
    else if (forA && forB) tradeoff = `${forA.label} against ${forB.label.toLowerCase()}. That's the real exchange.`;
    else tradeoff = `On what you say matters, “${L(side)}” wins on every count. The question is whether your ratings are honest.`;

    // Regret / risk read.
    let riskRead;
    if (rk.bothHigh) riskRead = "You'd regret this going badly, and you'd regret not trying. The real decision isn't risk versus safety. Both options involve risk. They're different kinds of risk.";
    else if (rk.regretLean >= 2) riskRead = "You fear acting and having it go badly far more than you fear standing still. Check that fear against the reversibility below.";
    else if (rk.regretLean <= -2) riskRead = "You fear the regret of not trying more than the regret of failing. That's worth knowing about yourself.";
    else riskRead = "Your regret is roughly balanced between acting and not acting.";
    const revRead = rk.leanHarder
      ? `The option you lean toward, “${L(side)}”, is the harder one to undo. That asks for more confidence than an easy-to-reverse choice would.`
      : rk.rev[side] >= 4 ? `“${L(side)}” is relatively easy to undo. A risky decision that's easy to reverse is a fundamentally different thing from a permanent one.` : `Neither option is easy to undo. Take that as a reason to learn one more thing before moving.`;
    const waitRead = {
      "cheap-and-useful": "Waiting six months costs little and would tell you something. Not deciding yet is a real option here, not avoidance.",
      "useful-but-costly": "Waiting would teach you something, but it isn't free. Decide what you'd learn and whether it's worth the price.",
      "cheap-but-empty": "Waiting is cheap, but you don't expect to learn anything by waiting. Delay would be comfort, not information.",
      "costly": "Waiting has a real cost and wouldn't tell you much. \"Not yet\" is the expensive option here."
    }[rk.waitVerdict];

    // Prediction vs model.
    let calib;
    if (rng.gap > 0) calib = `You said ${rng.user}%. The defensible range from your own answers is ${rng.lo}–${rng.hi}%. You're more optimistic about “${L("a")}” than your ratings support. ${ep.unknowns.length ? "The gap is probably living in what you don't know yet." : "Ask what you might be forgetting."}`;
    else if (rng.gap < 0) calib = `You said ${rng.user}%. The defensible range from your own answers is ${rng.lo}–${rng.hi}%. Your gut is more cautious about “${L("a")}” than your ratings are. One of them is wrong. ${ep.leaningBeliefs.length ? "It may be the belief you're leaning on." : "It may be a fear you haven't named."}`;
    else calib = `You said ${rng.user}%. The defensible range from your own answers is ${rng.lo}–${rng.hi}%. Your instinct and your reasoning agree. That's not proof, but it's a good sign.`;

    // Your thinking: the sentence.
    let thinking;
    if (s.stillWant === "no" && s.hope) thinking = `What you want is “${s.hope.trim().replace(/[.?!]+$/, "")}”. If you could have that without the change, you'd keep things as they are. So this isn't really a question about “${L("a")}”. It's a question about whether “${L("b")}” can give you that.`;
    else if (ep.restsOnBeliefs) thinking = "You didn't need more information. You needed to separate what you know from what you're assuming.";
    else if (ambiguous) thinking = "The decision is genuinely ambiguous. Both options have attractive outcomes on what matters to you. The most important question is which downside you're willing to live with.";
    else if (ep.unknowns.length) thinking = `You know what you want. The uncertainty is whether “${L(side)}” can deliver it.`;
    else thinking = `You appear less uncertain about what you want than about whether you're allowed to want it. On your own numbers, “${L(side)}” is the clearer fit.`;

    return {
      lean: vs.lean, side, other, ambiguous,
      matters: byW.slice(0, 3).map(r => r.label),
      strongest: {
        a: forA ? `“${L("a")}” delivers more ${forA.label.toLowerCase()}, which you weight ${forA.w} out of 5.` : `On what you say matters, “${L("a")}” doesn't win a single count.`,
        b: forB ? `“${L("b")}” delivers more ${forB.label.toLowerCase()}, which you weight ${forB.w} out of 5.` : `On what you say matters, “${L("b")}” doesn't win a single count.`
      },
      epistemics: ep, assumption: ep.leaningBeliefs[0] ? ep.leaningBeliefs[0].text : (ep.beliefs[0] ? ep.beliefs[0].text : null),
      unknown: flagged ? flagged.text : null,
      horizons: hz, tradeoff, sensitivity: sens, pivot, next, risk: rk, riskRead, revRead, waitRead,
      range: rng, calib, threshold: s.threshold, fear: s.fear, plausible, clarity: cl, thinking
    };
  }

  window.Engine = { lower, valueScores, horizons, sensitivity, epistemics, modelRange, risk, clarity, stressConditions, report };
})();
