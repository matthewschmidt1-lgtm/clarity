/* Clarity — decision engine.
   Deterministic. Its whole job: turn a tangled decision into what it depends on.
   Input: a session (see app.js). Output: the Pivot, the structure, the next thing to learn. */
(function () {
  const lower = t => {
    t = (t || "").trim().replace(/[.?!]+$/, "").replace(/^(i think|i believe|i assume|i'm assuming|i am assuming|i feel like|i guess|i suspect|probably|maybe|i'm pretty sure|i'm sure)\s+(that\s+)?/i, "");
    return t.charAt(0) === "I" && (t.charAt(1) === " " || t.charAt(1) === "'") ? t : t.charAt(0).toLowerCase() + t.slice(1);
  };
  const quote = t => `“${t}”`;

  /* Sort the factors into what the person knows, assumes, and doesn't know. */
  function structure(s) {
    const L = id => s.options[id].label;
    const known = [], assumed = [], unknown = [];
    s.factors.forEach(f => {
      if (!f.winner) return;
      if (f.winner === "unknown") unknown.push({ f, text: `Which option is stronger on ${f.label.toLowerCase()}.` });
      else if (f.basis === "know") known.push({ f, text: `${quote(L(f.winner))} is stronger on ${f.label.toLowerCase()}.` });
      else assumed.push({ f, text: `${quote(L(f.winner))} is stronger on ${f.label.toLowerCase()}.` });
    });
    return { known, assumed, unknown };
  }

  /* The factors the person is unsure about, in the order they said they matter. */
  function uncertain(s) {
    return s.factors.filter(f => f.winner === "unknown" || (f.winner && f.basis === "assume"));
  }

  /* The Pivot: the first uncertain factor that would change the lean. */
  function pivot(s) {
    const L = id => s.options[id].label;
    const unc = uncertain(s);
    const statement = f => f.winner === "unknown" ? `which option is stronger on ${f.label.toLowerCase()}` : `whether ${quote(L(f.winner))} really is stronger on ${f.label.toLowerCase()}`;
    if (!unc.length) return { kind: "none", text: "Nothing you're unsure about would change your mind." };
    if (s.lean === "torn" || !s.lean) {
      const f = unc.find(x => x.winner === "unknown") || unc[0];
      return { kind: "torn", f, statement: statement(f), text: cap(statement(f)) + "." };
    }
    const f = unc.find(x => x.flips === true);
    if (f) return { kind: "flip", f, statement: statement(f), text: cap(statement(f)) + "." };
    return { kind: "robust", text: `Nothing you're unsure about would change your mind. Your lean toward ${quote(L(s.lean))} holds.` };
  }
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  function report(s) {
    const L = id => s.options[id].label;
    const st = structure(s), pv = pivot(s);
    const lean = s.lean && s.lean !== "torn" ? s.lean : null;
    const other = lean ? (lean === "a" ? "b" : "a") : null;
    const winsA = s.factors.filter(f => f.winner === "a").map(f => f.label.toLowerCase());
    const winsB = s.factors.filter(f => f.winner === "b").map(f => f.label.toLowerCase());
    const list = xs => xs.length > 1 ? xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1] : xs[0];

    // What you're really asking (the "Oh" from step two).
    let reframe = null;
    if (s.stillWant === "no" && s.hope) {
      const hope = lower(s.hope);
      reframe = `You want ${quote(hope)}. If ${quote(L("b"))} could give you that, you'd keep things as they are. So the real question isn't ${quote(L("a"))}. It's whether ${quote(L("b"))} can give you that.`;
    }

    // The tradeoff, one line.
    let tradeoff;
    if (winsA.length && winsB.length) tradeoff = `${quote(L("a"))} wins on ${list(winsA)}. ${quote(L("b"))} wins on ${list(winsB)}. That's the exchange.`;
    else if (winsA.length) tradeoff = `On what matters to you, ${quote(L("a"))} wins every count you're sure of.`;
    else if (winsB.length) tradeoff = `On what matters to you, ${quote(L("b"))} wins every count you're sure of.`;
    else tradeoff = `You couldn't say which option is stronger on anything that matters. That isn't indecision. It's a decision made too early.`;

    // The pivot, explained.
    let pivotNote = null;
    if (pv.kind === "flip") pivotNote = `If yes, ${quote(L(lean))} holds. If no, you're looking at a different decision.`;
    else if (pv.kind === "torn") pivotNote = `Until you know this, being torn is the honest position.`;
    else if (pv.kind === "robust") pivotNote = `You may be more decided than you feel.`;
    else pivotNote = `Everything you named, you already know. What's left isn't information.`;

    // What to find out next, and whether to decide yet.
    let next, wait = null;
    const rev = s.reversibility;
    const leanLabel = lean ? L(lean) : L("a");
    if (pv.f) {
      if (s.findOut === "soon") { next = `Find out ${pv.statement}.`; wait = `You don't need to decide yet. You need to know this first.`; }
      else if (s.findOut === "while") { next = `Find out ${pv.statement}. It will take time, so decide whether waiting costs you more than choosing without it.`; wait = `Not deciding yet is a real option here. Give it a date.`; }
      else { next = `The only way to know ${pv.statement} is to try it.`; wait = rev === "hard" ? `That makes reversibility the real question, and you said ${quote(leanLabel)} would be hard to undo. Decisions that can't be tested and can't be reversed are worth taking slowly.` : `You said ${quote(leanLabel)} would be easy to undo. A choice you can test and reverse is a smaller decision than it feels.`; }
    } else if (pv.kind === "robust") {
      next = `The next step isn't more thinking.`;
      wait = rev === "hard" ? `${quote(leanLabel)} would be hard to undo, so take one more look at the assumptions before you move. But you already know which way you're facing.` : `${quote(leanLabel)} would be easy to undo, and nothing you're unsure of changes the picture.`;
    } else {
      next = `Name one thing you'd want to be true before you'd feel settled. That's your real question.`;
    }

    return { reframe, structure: st, pivot: pv, pivotNote, tradeoff, next, wait, lean, other, uncertain: uncertain(s).length, hard: s.hard };
  }

  window.Engine = { lower, structure, uncertain, pivot, report };
})();
