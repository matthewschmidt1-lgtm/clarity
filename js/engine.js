/* Clarity — decision engine.
   Deterministic. Its whole job: turn a tangled decision into what it depends on.
   Unknown ≠ Pivot. The Pivot is the uncertainty that would actually change the choice. */
(function () {
  const lower = t => {
    t = (t || "").trim().replace(/[.?!]+$/, "").replace(/^(i think|i believe|i assume|i'm assuming|i am assuming|i feel like|i guess|i suspect|probably|maybe|i'm pretty sure|i'm sure)\s+(that\s+)?/i, "");
    return t.charAt(0) === "I" && (t.charAt(1) === " " || t.charAt(1) === "'") ? t : t.charAt(0).toLowerCase() + t.slice(1);
  };
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const quote = t => `“${t}”`;
  /* "you want less stress and a manager who respects me" → "…respects you" */
  const toYou = t => (t || "").replace(/\bme\b/g, "you").replace(/\bmy\b/gi, m => m === "My" ? "Your" : "your").replace(/\bmyself\b/g, "yourself").replace(/\bmine\b/g, "yours").replace(/\bI am\b/g, "you are").replace(/\bI'm\b/g, "you're").replace(/\bI'd\b/g, "you'd").replace(/\bI've\b/g, "you've").replace(/\bI'll\b/g, "you'll").replace(/\bI\b/g, "you");
  /* "less stress" → "give you less stress"; "to feel like myself" → "let you feel like yourself" */
  const giveYou = hope => { const h = lower(toYou(hope)); return /^to\s+/.test(h) ? `let you ${h.replace(/^to\s+/, "")}` : `give you ${h}`; };
  const wantTo = hope => { const h = lower(toYou(hope)); return /^to\s+/.test(h) ? `want ${h}` : `want ${h}`; };

  /* 1. Sort the factors the person named into known, assumed, unknown. */
  const label = (s, id) => toYou(s.options[id].label);
  function structure(s) {
    const L = id => label(s, id);
    const known = [], assumed = [], unknown = [];
    s.factors.forEach(f => {
      if (!f.winner) return;
      const fl = f.label.toLowerCase();
      if (f.winner === "unknown") unknown.push({ f, text: `Which option is stronger on ${fl}.` });
      else if (f.basis === "know") known.push({ f, text: `${quote(L(f.winner))} is stronger on ${fl}.` });
      else assumed.push({ f, text: `${quote(L(f.winner))} is stronger on ${fl}.` });
    });
    return { known, assumed, unknown };
  }

  /* 2. The uncertainties, in the order the person said they matter. */
  const uncertain = s => s.factors.filter(f => f.winner === "unknown" || (f.winner && f.basis === "assume"));

  /* 3. Candidate pivots, ranked. Each carries a question a person could go and answer. */
  function candidates(s) {
    const L = id => label(s, id);
    const out = [];
    if ((s.stillWant === "no" || s.stillWant === "unsure") && s.hope && s.hope.trim() && !s.hopeRuledOut) {
      out.push({ kind: "hope", impact: s.stillWant === "no" ? "high" : "medium", question: `Can ${quote(L("b"))} actually ${giveYou(s.hope)}?`, statement: `whether ${quote(L("b"))} can actually ${giveYou(s.hope)}` });
    }
    uncertain(s).forEach((f, i) => {
      const fl = f.label.toLowerCase();
      const q = f.winner === "unknown" ? `Which option is actually stronger on ${fl}?` : `Is ${quote(L(f.winner))} really stronger on ${fl}?`;
      const st = f.winner === "unknown" ? `which option is actually stronger on ${fl}` : `whether ${quote(L(f.winner))} really is stronger on ${fl}`;
      const impact = f.flips === true ? "high" : f.flips === false ? "none" : (s.lean === "torn" || !s.lean) ? (i === 0 ? "high" : "medium") : "unknown";
      out.push({ kind: "factor", f, impact, question: q, statement: st });
    });
    return out;
  }

  /* 4. The Pivot: the highest-impact candidate. Never manufactured. */
  function pivot(s) {
    const cands = candidates(s);
    const hope = cands.find(c => c.kind === "hope");
    const factorPivot = cands.find(c => c.kind === "factor" && c.impact === "high") || cands.find(c => c.kind === "factor" && c.impact === "medium");
    // A firm "no" outranks any factor. An "unsure" yields to a factor the person said would flip them.
    if (hope && (hope.impact === "high" || !factorPivot || factorPivot.impact !== "high")) return { ...hope, secondary: factorPivot || null };
    if (factorPivot) return factorPivot;
    if (!uncertain(s).length) return { kind: "none", question: "There doesn't appear to be a decision-critical unknown.", statement: null };
    return { kind: "robust", question: "Nothing you're unsure about would change your mind.", statement: null, lean: s.lean };
  }

  /* 5. Structured model: what the evaluator inspects instead of prose. */
  function model(s) {
    const st = structure(s), pv = pivot(s);
    return {
      decision: { question: s.question, options: [s.options.a.label, s.options.b.label] },
      desired_outcome: s.hope || null, still_want: s.stillWant, hard: s.hard || null,
      factors: s.factors.map((f, i) => ({ name: f.label, rank: i + 1, advantage: f.winner === "unknown" ? null : f.winner, status: f.winner === "unknown" ? "unknown" : f.basis === "know" ? "known" : "assumed", would_flip: f.flips })),
      lean: s.lean, candidate_pivots: candidates(s).map(c => ({ question: c.question, impact: c.impact })),
      pivot: { kind: pv.kind, question: pv.question, factor: pv.f ? pv.f.label : null },
      find_out: s.findOut, reversibility: s.reversibility,
      known: st.known.map(x => x.text), assumed: st.assumed.map(x => x.text), unknown: st.unknown.map(x => x.text)
    };
  }

  /* 5b. The Discovery line, shown the moment the person answers "would you still want to?" */
  function discovery(s) {
    const A = label(s, "a"), B = label(s, "b");
    if (!s.stillWant || !s.hope) return null;
    if (s.stillWant === "no") return `Then you may not be deciding whether to ${lower(A)}. You may be deciding whether you can get what you need without it.`;
    if (s.stillWant === "unsure") return `Worth noticing. You're not sure ${quote(A)} is the only way to get that.`;
    return `Then this really is about ${quote(A)}. Let's find what it depends on.`;
  }

  /* 6. The report. Decision → real question → Pivot → evidence → tradeoff → next. */
  function report(s) {
    const L = id => label(s, id);
    const st = structure(s), pv = pivot(s);
    const lean = s.lean && s.lean !== "torn" ? s.lean : null;
    const A = L("a"), B = L("b");

    let reframe = null;
    if (s.stillWant === "no" && s.hope) {
      reframe = [`You don't just want to ${lower(A)}. You ${wantTo(s.hope)}.`, s.hopeRuledOut ? `You've already said ${quote(B)} can't give you that. So this really is about ${quote(A)}.` : `If ${quote(B)} could give you that, you'd choose it.`];
    } else if (s.stillWant === "unsure" && s.hope) {
      reframe = [`You ${wantTo(s.hope)}, and you're not sure ${quote(A)} is the only way to get it.`, s.hopeRuledOut ? `You've since said ${quote(B)} can't give you that.` : `Worth settling before anything else.`];
    }

    let pivotNote;
    if (pv.kind === "hope") pivotNote = pv.secondary ? `If it can, you don't need to ${lower(A)}. If it can't, the next question is ${pv.secondary.statement}.` : `If it can, you don't need to ${lower(A)}. If it can't, the case for it gets much stronger.`;
    else if (pv.kind === "factor") pivotNote = lean ? `If that's true, ${quote(L(lean))} has a strong case. If it isn't, the decision changes.` : `That's the question that changes the decision.`;
    else if (pv.kind === "robust") pivotNote = `You may be more decided than you feel.`;
    else pivotNote = `You have enough to decide. This comes down to what you prefer.`;

    const pairs = s.factors.filter(f => f.winner && f.winner !== "unknown").map(f => ({ factor: f.label, option: L(f.winner) }));
    const sideA = pairs.filter(p => p.option === A), sideB = pairs.filter(p => p.option === B);
    let tradeoffLine = null;
    if (sideA.length && sideB.length) tradeoffLine = `More ${sideA[0].factor.toLowerCase()} against more ${sideB[0].factor.toLowerCase()}. That's the exchange.`;
    else if (pairs.length) tradeoffLine = `On everything you named, ${quote(pairs[0].option)} is stronger. The tradeoff isn't between the options; it's between what you're sure of and what you're not.`;
    else tradeoffLine = `You couldn't say which option is stronger on anything you named. That isn't indecision. It's a decision made too early.`;

    let next, wait = null, how = null;
    const rev = s.reversibility, leanLabel = lean ? L(lean) : A;
    const heavy = window.Content && Content.tone(s.question) === "heavy";
    if (pv.statement) {
      how = pv.kind === "hope" ? "Ask for it directly. The answer to a real request is information." : (window.Content && Content.how[pv.f.id]) || "Ask someone who's already there. Ask about specifics, not the vibe.";
      if (s.findOut === "soon") { next = pv.question; wait = `You don't need to decide yet. You need to know this first.`; }
      else if (s.findOut === "while") { next = pv.question; wait = `This will take time to learn. Decide whether waiting costs you more than choosing without it, and give yourself a date.`; }
      else { next = heavy ? `The only way to know is to live it.` : `The only way to know is to try.`; how = heavy ? "That's a bigger ask than it sounds. Worth saying out loud to someone before you do." : null; wait = rev === "hard" ? `You said ${quote(leanLabel)} would be hard to undo. A choice you can't test in advance and can't reverse is worth taking slowly.` : `You said ${quote(leanLabel)} would be easy to undo. A choice you can test and reverse is a smaller decision than it feels.`; }
    } else if (pv.kind === "robust") {
      next = `Not more thinking.`;
      wait = rev === "hard" ? `${quote(leanLabel)} would be hard to undo, so take one more look at what you're assuming. But you already know which way you're facing.` : `${quote(leanLabel)} would be easy to undo, and nothing you're unsure of changes the picture.`;
    } else {
      next = `Nothing. You already have what you need.`;
      wait = `Name the one thing you'd want to be true before you'd feel settled. If you can't, that's your answer.`;
    }

    // When there is no Pivot, say so plainly and never use the word.
    let settled = null;
    if (pv.kind === "none") settled = { title: "You already know enough.", body: "There's no unknown left that would materially change this decision. What's left is preference, and that's yours." };
    else if (pv.kind === "robust") settled = { title: "You already know enough.", body: `Nothing you're unsure about would change your mind. You may be more decided than you feel.` };

    return { reframe, structure: st, pivot: pv, pivotNote, settled, pairs, tradeoffLine, next, wait, how, lean, hard: s.hard };
  }

  window.Engine = { lower, toYou, structure, uncertain, candidates, pivot, discovery, model, report };
})();
