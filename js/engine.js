/* Clarity — decision engine, version 2.
   The person builds the model. Clarity calculates. The person decides.
   Multi-attribute utility, sensitivity analysis, a hinge score, and a value-of-information ranking.
   Deterministic. No score is ever shown. Nothing is ever recommended. */
(function () {
  const lower = t => { t = (t || "").trim().replace(/[.?!]+$/, ""); return t.charAt(0) === "I" && (t.charAt(1) === " " || t.charAt(1) === "'") ? t : t.charAt(0).toLowerCase() + t.slice(1); };
  const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  const quote = t => `“${t}”`;
  const toYou = t => (t || "").replace(/\bme\b/g, "you").replace(/\bmy\b/gi, m => m === "My" ? "Your" : "your").replace(/\bmyself\b/g, "yourself").replace(/\bmine\b/g, "yours").replace(/\bI am\b/g, "you are").replace(/\bI'm\b/g, "you're").replace(/\bI'd\b/g, "you'd").replace(/\bI've\b/g, "you've").replace(/\bI'll\b/g, "you'll").replace(/\bI\b/g, "you");
  const giveYou = hope => { const h = lower(toYou(hope)); return /^to\s+/.test(h) ? `let you ${h.replace(/^to\s+/, "")}` : `give you ${h}`; };

  /* Belief-strength parameters, not probabilities. */
  const CONF = { 1: 0.25, 2: 0.5, 3: 0.7, 4: 0.9, 5: 0.98 };
  const CONF_WORD = { 1: "guessing", 2: "only leaning that way", 3: "fairly sure", 4: "nearly certain", 5: "sure" };
  const PREF_WORD = ["much better", "better", "about the same", "better", "much better"]; // index by pref+2, from the favoured side

  const isStatusQuo = l => /^(stay|keep|don't|do not|remain|not |hold|wait|as things are|where i am|current)/i.test((l || "").trim());
  const statusQuo = s => s.options.find(o => isStatusQuo(o.label)) || null;

  /* ---- 1. Utilities per option per criterion, in [0.1, 0.9] ---- */
  function utilities(s) {
    const U = {};
    s.criteria.forEach(c => {
      const ev = s.evals[c.id] || {};
      U[c.id] = {};
      if (s.options.length === 2 && typeof ev.pref === "number") {
        U[c.id][s.options[0].id] = 0.5 + ev.pref * 0.2;
        U[c.id][s.options[1].id] = 0.5 - ev.pref * 0.2;
      } else {
        s.options.forEach(o => { const r = ev.ratings && ev.ratings[o.id]; U[c.id][o.id] = typeof r === "number" ? 0.1 + (r - 1) * 0.2 : 0.5; });
      }
    });
    return U;
  }

  /* ---- 2. Expected utility, sensitivity, hinge ---- */
  function analyze(s) {
    const crit = s.criteria.filter(c => c.importance);
    const total = crit.reduce((t, c) => t + c.importance, 0) || 1;
    const U = utilities(s);
    const EU = {};
    s.options.forEach(o => { EU[o.id] = crit.reduce((t, c) => t + (c.importance / total) * U[c.id][o.id], 0); });
    const ranked = [...s.options].sort((a, b) => EU[b.id] - EU[a.id]);
    const leader = ranked[0], runner = ranked[1] || ranked[0];
    const margin = EU[leader.id] - EU[runner.id];
    const rows = crit.map(c => {
      const w = c.importance / total;
      const conf = CONF[(s.evals[c.id] || {}).conf] || 0.5;
      const unc = 1 - conf;
      const diff = U[c.id][leader.id] - U[c.id][runner.id];          // + favours the leader
      const best = [...s.options].sort((a, b) => U[c.id][b.id] - U[c.id][a.id]);
      const favours = Math.abs(U[c.id][best[0].id] - U[c.id][best[1] ? best[1].id : best[0].id]) < 0.05 ? null : best[0];
      // how far this criterion's read would have to move to flip leader and runner-up
      const needed = w > 0 ? margin / w : Infinity;                   // change in (u_leader - u_runner)
      const maxSwing = diff + 0.8;                                    // to fully favouring the runner-up
      const flippable = needed <= maxSwing + 1e-9 && s.options.length > 1;
      const sens = flippable ? Math.max(0, 1 - needed / maxSwing) : 0;
      const hinge = sens * unc * w;
      return { c, w, conf, unc, diff, favours, needed, flippable, sens, hinge, flipDiff: diff - needed };
    });
    const byHinge = [...rows].sort((a, b) => (b.hinge - a.hinge) || (b.w - a.w) || (b.unc - a.unc));
    const uncertainRows = rows.filter(r => r.conf < 0.9);
    const stable = margin > 0.08 && !rows.some(r => r.flippable && r.conf < 0.9);
    return { crit, U, EU, leader, runner, margin, rows, byHinge, uncertainRows, stable, allKnown: rows.length > 0 && rows.every(r => r.conf >= 0.9) };
  }

  /* ---- 3. The Pivot: highest hinge that the person hasn't ruled out ---- */
  function pivotQuestion(s, r) {
    const L = o => toYou(o.label);
    if (r.favours) return `Is ${quote(L(r.favours))} really stronger on ${r.c.label.toLowerCase()}?`;
    return `Which option is actually stronger on ${r.c.label.toLowerCase()}?`;
  }
  function pivotStatement(s, r) {
    const L = o => toYou(o.label);
    if (r.favours) return `whether ${quote(L(r.favours))} really is stronger on ${r.c.label.toLowerCase()}`;
    return `which option is actually stronger on ${r.c.label.toLowerCase()}`;
  }
  function pivot(s) {
    const a = analyze(s);
    const ruled = s.ruledOut || {};
    const cands = a.byHinge.filter(r => r.hinge > 0.005 && r.conf < 0.9 && !ruled[r.c.id]);
    const hope = hopeCandidate(s);
    const HOPE_WEIGHT = { high: 0.1, medium: 0.05 };
    const top = cands[0];
    if (hope && !ruled.hope && (!top || top.hinge < HOPE_WEIGHT[hope.impact])) return { kind: "hope", ...hope, next: top || null };
    if (cands.length) return { kind: "criterion", r: top, question: pivotQuestion(s, top), statement: pivotStatement(s, top), voi: cands, hopeAlso: hope && !ruled.hope ? hope : null };
    if (a.allKnown) return { kind: "none" };
    return { kind: "robust", a };
  }
  function hopeCandidate(s) {
    const n = s.notes || {};
    if (!n.hope || !(n.stillWant === "no" || n.stillWant === "unsure")) return null;
    const sq = statusQuo(s);
    if (!sq) return null;
    const here = hereNoun(s);
    return { question: `Can ${here} actually ${giveYou(n.hope)}?`, statement: `whether you can get what you want ${without(s)}`, impact: n.stillWant === "no" ? "high" : "medium" };
  }

  /* ---- voice helpers ---- */
  const domain = q => { q = (q || "").toLowerCase();
    if (/job|work|career|role|offer|company|boss|promotion|startup|quit|resign|retire|hire/.test(q)) return "job";
    if (/relationship|partner|marriage|marry|divorce|spouse|boyfriend|girlfriend|break ?up|husband|wife|dating/.test(q)) return "relationship";
    if (/move|relocat|city|country|abroad|apartment|house|home|rent|buy|neighbo/.test(q)) return "place";
    if (/school|degree|study|program|course|mba|phd|university|college|train/.test(q)) return "path";
    if (/business|launch|freelance|found|product|invest|save|money|loan/.test(q)) return "work";
    if (/health|surgery|treatment|doctor|therap|diet|sober/.test(q)) return "health";
    if (/child|kid|baby|adopt|parent|family/.test(q)) return "family";
    return "situation"; };
  const hereNoun = s => ({ job: "your current job", relationship: "this relationship", place: "where you live now", path: "where you are now", work: "what you have now", health: "what you're doing now", family: "how things are now", situation: "your current situation" })[domain(s.title)];
  const without = s => { const d = domain(s.title), q = (s.title || "").toLowerCase(); if (d === "job" || d === "relationship") return "without leaving"; if (d === "place" && /move|relocat/.test(q)) return "without moving"; return "where you are"; };
  const changeVerb = s => { const sq = statusQuo(s); const other = s.options.find(o => o !== sq) || s.options[0]; return lower(toYou(other.label)); };

  function tension(s) { const n = s.notes || {}; if (!n.hope || !statusQuo(s)) return null; return `You want to ${changeVerb(s)}. What you've described is what you hope it changes. One way to test that:`; }
  function stillWantQuestion(s) { return `If ${hereNoun(s)} gave you what you want, would you still want to ${changeVerb(s)}?`; }
  function discovery(s) {
    const n = s.notes || {}; if (!n.stillWant || !n.hope || !statusQuo(s)) return null;
    if (n.stillWant === "no") return `Maybe the question isn't whether to ${changeVerb(s)}. It's whether you can get what you want ${without(s)}.`;
    if (n.stillWant === "unsure") return `You want to ${changeVerb(s)}. But you're not sure it's the only way to get what you want. That's worth knowing.`;
    return `Then you want the change itself, not only what it brings.`;
  }

  /* ---- 4. Structured model for evaluators ---- */
  function model(s) {
    const a = analyze(s), pv = pivot(s);
    return {
      decision: { title: s.title, options: s.options.map(o => o.label) },
      criteria: a.rows.map(r => ({ name: r.c.label, importance: r.c.importance, confidence: r.conf, favours: r.favours ? r.favours.label : null, flippable: r.flippable, sensitivity: +r.sens.toFixed(3), hinge: +r.hinge.toFixed(4) })),
      leader: a.leader ? a.leader.label : null, margin: +a.margin.toFixed(3), stable: a.stable, all_known: a.allKnown,
      notes: s.notes || {}, ruled_out: s.ruledOut || {},
      pivot: { kind: pv.kind, question: pv.question || null, criterion: pv.r ? pv.r.c.label : null },
      voi: (pv.voi || []).map(r => ({ criterion: r.c.label, hinge: +r.hinge.toFixed(4) }))
    };
  }

  /* ---- 5. The synthesis ---- */
  function report(s) {
    const a = analyze(s), pv = pivot(s);
    const L = o => toYou(o.label);
    const n = s.notes || {};
    const sq = statusQuo(s);
    const byW = [...a.rows].sort((x, y) => y.w - x.w);
    const matters = byW.slice(0, 3).map(r => r.c.label);
    const clear = a.rows.filter(r => r.conf >= 0.7 && r.favours).map(r => ({ r, text: `${quote(L(r.favours))} is stronger on ${r.c.label.toLowerCase()}.` }));
    const unsure = a.rows.filter(r => r.conf < 0.7).map(r => ({ r, text: r.favours ? `You expect ${quote(L(r.favours))} to be stronger on ${r.c.label.toLowerCase()}, but you're ${CONF_WORD[(s.evals[r.c.id] || {}).conf] || "not sure"}.` : `You don't know which option is stronger on ${r.c.label.toLowerCase()}.` }));
    const same = a.rows.filter(r => !r.favours && r.conf >= 0.7).map(r => ({ r, text: `The options are about the same on ${r.c.label.toLowerCase()}.` }));

    // The tension: the top-weighted criterion favouring each of the top two options.
    const dominated = s.options.filter(o => o !== a.leader && o !== a.runner).map(o => { const best = byW.find(r => r.favours && r.favours.id === o.id); return best ? `${quote(L(o))} is strongest on ${best.c.label.toLowerCase()} but falls behind on the things you weighed most, so the choice narrows to ${quote(L(a.leader))} and ${quote(L(a.runner))}.` : `${quote(L(o))} isn't strongest on anything you named, so the choice narrows to ${quote(L(a.leader))} and ${quote(L(a.runner))}.`; });
    const forLeader = byW.find(r => r.favours && r.favours.id === a.leader.id);
    const forRunner = byW.find(r => r.favours && r.favours.id === a.runner.id);
    const dom = dominated.length ? " " + dominated.join(" ") : "";
    const tensionLine = forLeader && forRunner ? { a: forLeader.c.label, b: forRunner.c.label, text: `${forLeader.c.label} pulls toward ${quote(L(a.leader))}. ${forRunner.c.label} pulls toward ${quote(L(a.runner))}.${dom}` } : forLeader ? { text: `On what you've said, ${quote(L(a.leader))} is stronger on everything you're sure of. The tension is between what you know and what you don't.${dom}` } : { text: `You couldn't say which option is stronger on anything that matters. That isn't indecision. It's a decision made too early.${dom}` };

    // What you're really asking (from optional context)
    let reframe = null;
    if (n.hope && sq && n.stillWant === "no") reframe = [`You don't just want to ${changeVerb(s)}. You want ${lower(toYou(n.hope))}.`, s.ruledOut && s.ruledOut.hope ? `You've said ${hereNoun(s)} can't give you that. So this is about the change itself.` : `If ${hereNoun(s)} could give you that, you'd stay.`];
    else if (n.hope && sq && n.stillWant === "unsure") reframe = [`You want ${lower(toYou(n.hope))}. You're not sure the only way to get it is to ${changeVerb(s)}.`, `That comes before anything else.`];

    // The Pivot, what could change your mind, what's worth learning
    let pivotBlock = null, changeMind = null, learn = null, settled = null, observation = null;
    if (pv.kind === "hope") {
      observation = `You know what you want. You don't know whether you can get it ${without(s)}.`;
      pivotBlock = pv.question;
      changeMind = `If it can, you don't need to ${changeVerb(s)}.${pv.next ? ` If it can't, the next question is ${pivotStatement(s, pv.next)}.` : ""}`;
      const d = domain(s.title);
      learn = { text: d === "relationship" || d === "family" ? "Say it out loud to the person it's about. That's a bigger ask than it sounds, and it comes before anything else." : d === "place" ? "Live a month as if you'd already decided to stay, and notice." : d === "job" ? "Ask for it directly. The answer to a real request is information." : "Name what would have to change where you are, and ask whether it can.", rest: [] };
    } else if (pv.kind === "criterion") {
      const r = pv.r;
      const cl = r.c.label.toLowerCase();
      const flipSentence = r.diff > 0.05
        ? `That depends on ${cl} favouring ${quote(L(a.leader))} as much as you think. If it favours ${quote(L(a.leader))} only a little${r.flipDiff <= -0.05 ? ", or not at all" : ""}, ${quote(L(a.runner))} would be the lean instead.`
        : r.diff < -0.05
        ? `If ${cl} favours ${quote(L(a.runner))} even more than you think, ${quote(L(a.runner))} would be the lean instead.`
        : `If ${cl} turns out to favour ${quote(L(a.runner))}, ${quote(L(a.runner))} would be the lean instead.`;
      observation = r.favours ? `${quote(L(r.favours))} isn't the uncertainty. ${r.c.label} is.` : `The options aren't the uncertainty. ${r.c.label} is.`;
      pivotBlock = pv.question;
      changeMind = `On what you've told me, ${quote(L(a.leader))} is the current lean. ${flipSentence} Nothing else you're unsure about moves it that far.${pv.hopeAlso ? ` And the question above it, whether you can get what you want ${without(s)}, still stands.` : ""}`;
      const how = (window.Content && Content.how[r.c.id]) || "Ask someone who's already there. Ask about specifics, not the vibe.";
      const rest = pv.voi.slice(1, 3).map(x => x.c.label);
      learn = { text: how, rest };
    } else if (pv.kind === "none") {
      settled = { title: "You already know enough.", body: `Everything you named, you're sure of. What's left is what you prefer, and that's yours to weigh.` };
    } else {
      settled = { title: "Nothing you're unsure about would change this.", body: `The result holds however the uncertain parts turn out. You may be more decided than you feel.` };
    }
    const stability = pv.kind === "hope" ? "Everything else waits on this." : a.margin < 0.04 ? "The two options come out very close on what you've told me." : a.stable ? "The result is stable. Changing any one thing you're unsure about wouldn't reorder the options." : `The result is sensitive to ${pv.r ? pv.r.c.label.toLowerCase() : "what you're unsure about"}.`;

    return { matters, clear, unsure, same, tensionLine, reframe, observation, pivot: pv, pivotBlock, changeMind, learn, settled, stability, leader: a.leader, runner: a.runner, worry: n.worry || null };
  }

  window.Engine = { lower, toYou, CONF, CONF_WORD, isStatusQuo, statusQuo, utilities, analyze, pivot, pivotQuestion, pivotStatement, hopeCandidate, tension, stillWantQuestion, discovery, hereNoun, changeVerb, model, report };
})();
