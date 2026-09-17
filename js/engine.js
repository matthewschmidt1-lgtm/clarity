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

  /* Voice. The status quo is referred to by what it is in the person's life, never by quoting a label. */
  const domain = q => { q = (q || "").toLowerCase();
    if (/job|work|career|role|offer|company|boss|promotion|startup|quit|resign|retire/.test(q)) return "job";
    if (/relationship|partner|marriage|marry|divorce|spouse|boyfriend|girlfriend|break ?up|husband|wife/.test(q)) return "relationship";
    if (/move|relocat|city|country|abroad|apartment|house|home|rent|buy/.test(q)) return "place";
    if (/school|degree|study|program|course|mba|phd|university|college/.test(q)) return "path";
    if (/business|start|launch|freelance|found/.test(q)) return "work";
    return "situation"; };
  const isStatusQuo = l => /^(stay|keep|don't|do not|remain|not |where i am|as things are)/i.test((l || "").trim());
  /* "your current job" / "where you live now" / "this relationship" … */
  const here = s => {
    if (!isStatusQuo(s.options.b.label)) return null;
    return { job: "your current job", relationship: "this relationship", place: "where you live now", path: "where you are now", work: "your current work", situation: "your current situation" }[domain(s.question)];
  };
  const hereRef = s => here(s) || quote(label(s, "b"));          // subject of a sentence
  const stayVerb = s => { const d = domain(s.question); return here(s) ? ({ job: "stay", relationship: "stay", place: "stay", path: "stay where you are", work: "keep what you have", situation: "keep things as they are" })[d] : `choose ${quote(label(s, "b"))}`; };
  const goVerb = s => lower(label(s, "a"));
  /* "without leaving" / "without moving" / "without it" */
  const without = s => { const d = domain(s.question), q = (s.question || "").toLowerCase();
    if (!here(s)) return "either way";
    if (d === "job" || d === "relationship") return "without leaving";
    if (d === "place" && /move|relocat/.test(q)) return "without moving";
    return "where you are"; };

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
      if (here(s)) out.push({ kind: "hope", impact: s.stillWant === "no" ? "high" : "medium", question: `Can ${hereRef(s)} actually ${giveYou(s.hope)}?`, statement: `whether ${hereRef(s)} can actually ${giveYou(s.hope)}` });
      else out.push({ kind: "hope", twoSided: true, impact: s.stillWant === "no" ? "high" : "medium", question: `Could either option ${giveYou(s.hope)}?`, statement: `whether either option can ${giveYou(s.hope)}` });
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

  /* 5b. The voice at the second question: name the tension, ask once, then notice. */
  function tension(s) {
    if (!s.hope || !s.hope.trim()) return null;
    return here(s) ? `You want to ${goVerb(s)}. What you've described is what you hope it changes. One way to test that:` : `What you've described is what you hope changes. One way to test whether the choice itself matters:`;
  }
  function hopeQuestion(s) { return here(s) ? `What are you hoping changes if you ${goVerb(s)}?` : `What are you hoping changes?`; }
  function stillWantQuestion(s) {
    const h = here(s);
    return h ? `If ${h} gave you what you want, would you still want to ${goVerb(s)}?` : `If the other option gave you exactly that, would you still want to ${goVerb(s)}?`;
  }
  function discovery(s) {
    if (!s.stillWant || !s.hope) return null;
    const h = here(s);
    if (s.stillWant === "no") return h ? `Maybe the question isn't whether to ${goVerb(s)}. It's whether you can get what you want ${without(s)}.` : `Maybe the question isn't which one. It's whether you can get what you want either way.`;
    if (s.stillWant === "unsure") return `You want to ${goVerb(s)}. But you're not sure it's the only way to get what you want. That's worth knowing.`;
    return `Then you want the change itself, not only what it brings.`;
  }

  /* 6. The report. Decision → real question → Pivot → evidence → tradeoff → next. */
  function report(s) {
    const L = id => label(s, id);
    const st = structure(s), pv = pivot(s);
    const lean = s.lean && s.lean !== "torn" ? s.lean : null;
    const A = L("a"), B = L("b");

    let reframe = null;
    if (s.stillWant === "no" && s.hope) {
      reframe = [`You don't just want to ${goVerb(s)}. You ${wantTo(s.hope)}.`, s.hopeRuledOut ? `You've said ${hereRef(s)} can't give you that. So this is about the change itself.` : here(s) ? `If ${hereRef(s)} could give you that, you'd ${stayVerb(s)}.` : `If the other option could give you that, you'd take it.`];
    } else if (s.stillWant === "unsure" && s.hope) {
      reframe = [`You ${wantTo(s.hope)}. You're not sure the only way to get it is to ${goVerb(s)}.`, s.hopeRuledOut ? `You've since said ${hereRef(s)} can't give you that.` : `That comes before anything else.`];
    }

    let pivotNote, observation = null;
    if (pv.kind === "hope" && pv.twoSided) { observation = `You know what you want. You don't know which option can give it to you.`; pivotNote = `If both can, this isn't what decides it. If only one can, it is.`; }
    else if (pv.kind === "hope") { observation = `You know what you want. You don't know whether you can get it ${without(s)}.`; pivotNote = pv.secondary ? `If it can, you don't need to ${goVerb(s)}. If it can't, the next question is ${pv.secondary.statement}.` : `If it can, you don't need to ${goVerb(s)}. If it can't, the case for it gets much stronger.`; }
    else if (pv.kind === "factor") { observation = pv.f.winner === "unknown" ? `The options aren't the uncertainty. ${pv.f.label} is.` : `${quote(L(pv.f.winner))} isn't the uncertainty. ${pv.f.label} is.`; pivotNote = lean ? `If that's true, ${quote(L(lean))} has a strong case. If it isn't, the decision changes.` : `That's the question that changes the decision.`; }
    else if (pv.kind === "robust") pivotNote = `You may be more decided than you feel.`;
    else pivotNote = `You have enough to decide. This comes down to what you prefer.`;

    const pairs = s.factors.filter(f => f.winner && f.winner !== "unknown").map(f => ({ factor: f.label, option: L(f.winner) }));
    const sideA = pairs.filter(p => p.option === A), sideB = pairs.filter(p => p.option === B);
    let tradeoffLine = null;
    if (sideA.length && sideB.length) tradeoffLine = `That's the exchange: ${sideA[0].factor.toLowerCase()} for ${sideB[0].factor.toLowerCase()}.`;
    else if (pairs.length) tradeoffLine = `On everything you named, ${quote(pairs[0].option)} is stronger. The tradeoff isn't between the options; it's between what you're sure of and what you're not.`;
    else tradeoffLine = `You couldn't say which option is stronger on anything you named. That isn't indecision. It's a decision made too early.`;

    let next, wait = null, how = null;
    const rev = s.reversibility, leanLabel = lean ? L(lean) : A;
    const heavy = window.Content && Content.tone(s.question) === "heavy";
    if (pv.statement) {
      how = pv.kind === "hope" ? (pv.twoSided ? "Ask both sides the same question, in the same words." : "Ask for it directly. The answer to a real request is information.") : (window.Content && Content.how[pv.f.id]) || "Ask someone who's already there. Ask about specifics, not the vibe.";
      if (s.findOut === "soon") { next = pv.question; wait = `You don't need to decide yet. You need to know this first.`; }
      else if (s.findOut === "while") { next = pv.question; wait = `This will take time to learn. Decide whether waiting costs you more than choosing without it, and give yourself a date.`; }
      else { next = heavy ? `The only way to know is to live it.` : `The only way to know is to try.`; how = heavy ? "That's a bigger ask than it sounds. Worth saying out loud to someone before you do." : null; wait = rev === "hard" ? `You said ${quote(leanLabel)} would be hard to undo. A choice you can't test in advance and can't reverse is worth taking slowly.` : `You said ${quote(leanLabel)} would be easy to undo. A choice you can test and reverse is a smaller decision than it feels.`; }
    } else if (pv.kind === "robust") {
      next = `Not more thinking.`;
      wait = rev === "hard" ? `${quote(leanLabel)} would be hard to undo, so take one more look at what you're assuming. But you already know which way you're facing.` : `${quote(leanLabel)} would be easy to undo, and nothing you're unsure of changes the picture.`;
    } else {
      next = `Nothing. You already have what you need.`;
      wait = `What's left is what you prefer. That's yours to weigh, and it isn't a smaller thing than a fact.`;
    }

    // When there is no Pivot, say so plainly and never use the word.
    let settled = null;
    if (pv.kind === "none") settled = { title: "You already know enough.", body: "There's no unknown left that would materially change this decision. What's left is preference, and that's yours." };
    else if (pv.kind === "robust") settled = { title: "You already know enough.", body: `Nothing you're unsure about would change your mind. You may be more decided than you feel.` };

    return { reframe, structure: st, pivot: pv, pivotNote, observation, settled, pairs, tradeoffLine, next, wait, how, lean, hard: s.hard };
  }

  window.Engine = { lower, toYou, structure, uncertain, candidates, pivot, tension, hopeQuestion, stillWantQuestion, discovery, model, report };
})();
