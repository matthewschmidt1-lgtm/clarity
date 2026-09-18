/* Clarity — copy and reference data. All user-facing words and the libraries the person builds from. */
window.Content = {
  /* How people frame decisions. Each pattern presets the options. */
  patterns: [
    { id: "stay-leave", label: "Stay or leave", options: ["Leave", "Stay"] },
    { id: "move-stay", label: "Move or stay", options: ["Move", "Stay where I am"] },
    { id: "buy-rent", label: "Buy or rent", options: ["Buy", "Keep renting"] },
    { id: "change-keep", label: "Change or keep", options: ["Make the change", "Keep things as they are"] },
    { id: "start-wait", label: "Start now or wait", options: ["Start now", "Wait"] },
    { id: "take-decline", label: "Take it or turn it down", options: ["Take it", "Turn it down"] },
    { id: "commit-hold", label: "Commit or hold off", options: ["Commit", "Hold off"] },
    { id: "invest-save", label: "Spend or save", options: ["Spend it", "Save it"] },
    { id: "a-b", label: "A or B", options: ["", ""] },
    { id: "other", label: "Something else", options: ["", ""] }
  ],

  /* What could matter. Grouped so a person can find their own words. */
  criteria: [
    { cat: "Money", items: [["income", "Income"], ["security", "Financial security"], ["cost", "Cost"], ["debt", "Debt"], ["savings", "Savings"]] },
    { cat: "Work", items: [["growth", "Career growth"], ["learning", "Learning"], ["opportunity", "Opportunity"], ["reputation", "Reputation"], ["autonomy", "Autonomy"], ["manager", "Manager and team"]] },
    { cat: "Life", items: [["time", "Time"], ["flexibility", "Flexibility"], ["location", "Location"], ["home", "Home"], ["health", "Health and energy"], ["stress", "Stress"]] },
    { cat: "People", items: [["family", "Family"], ["partner", "Partner"], ["friends", "Friends"], ["community", "Community"], ["culture", "Culture"]] },
    { cat: "Risk", items: [["stability", "Stability"], ["uncertainty", "Uncertainty"], ["reversibility", "Reversibility"], ["safety", "Safety"]] },
    { cat: "Self", items: [["meaning", "Meaning"], ["identity", "Identity"], ["freedom", "Freedom"], ["adventure", "Adventure"], ["peace", "Peace of mind"], ["growing", "Growing as a person"]] }
  ],
  label(id) { for (const g of this.criteria) for (const [k, l] of g.items) if (k === id) return l; return null; },

  /* One concrete way to find each criterion out. */
  how: {
    income: "Get the number in writing, and the date it starts.",
    security: "Run the numbers for the worst realistic month, not the average one.",
    cost: "Add up a full year, including the things that only happen once.",
    debt: "Write down the balance, the rate, and the month it would be gone.",
    savings: "Look at the account, not the plan.",
    growth: "Ask two people who joined a year ago what actually changed for them.",
    learning: "Ask what you'd know in a year that you don't know now.",
    opportunity: "Ask what the last three people in this position went on to do.",
    reputation: "Ask someone whose opinion you trust, and let them be honest.",
    autonomy: "Ask who would be able to say no to you.",
    manager: "Ask what a bad week looks like, and who decides.",
    time: "Count the hours in a real week, not the promise.",
    flexibility: "Ask what happens the first time you need to change the plan.",
    location: "Spend a weekend there in the off-season.",
    home: "Stay a night, or picture an ordinary Tuesday there.",
    health: "Notice a full week honestly, not a good day.",
    stress: "Name the last three things that kept you up. Would they still exist?",
    family: "Say it out loud to the people it's about.",
    partner: "Ask them the question you've been asking yourself.",
    friends: "Look at who you actually saw last month.",
    community: "Go once without a reason to be there.",
    culture: "Ask what people complain about when they're being honest.",
    stability: "Ask how the last hard year went, and who left.",
    uncertainty: "Write down the three things you'd need to know, and whether anyone can tell you.",
    reversibility: "Ask what it would take to undo this in a year.",
    safety: "Ask what the worst realistic outcome is, and whether you could live with it.",
    meaning: "Ask what you'd be doing on an ordinary Tuesday.",
    identity: "Notice how you describe yourself to a stranger in each version.",
    freedom: "Ask who decides your Saturday.",
    adventure: "Ask what story you'd tell about this in five years.",
    peace: "Notice which version lets you sleep.",
    growing: "Ask which version you'd be prouder of, regardless of how it turned out."
  },

  importance: [[1, "Not much"], [2, "A little"], [3, "Important"], [4, "Very important"], [5, "Critical"]],
  confidence: [[1, "Guessing"], [2, "Leaning"], [3, "Fairly sure"], [4, "Nearly certain"], [5, "I know this"]],

  /* Emotional intensity changes the interaction, never the engine. */
  tone(q) {
    return /(relationship|marriage|marry|divorce|partner|spouse|boyfriend|girlfriend|break ?up|husband|wife|child|kid|baby|pregnan|parent|family|mother|father|health|cancer|surgery|dying|death|grief|therapy|depress|anxious|anxiety|faith|leave him|leave her|sober)/.test((q || "").toLowerCase()) ? "heavy" : "plain";
  },

  /* "Should I take the new job?" → a title and two options, for people arriving from the homepage field. */
  inferOptions(q) {
    let t = (q || "").trim().replace(/[?.!]+$/, "").replace(/\s+/g, " ");
    const cap = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
    const lead = /^(should|do|shall|could|can|would|will)\s+(i|we)\s+/i;
    const stripLead = x => x.replace(lead, "").replace(/^(to\s+)/i, "").trim();
    const both = t.match(/^(.*?)\s+(?:or|vs\.?|versus)\s+(.+)$/i);
    if (both) {
      let a = stripLead(both[1]), b = stripLead(both[2]);
      if (/^not$/i.test(b) || /^(not|don't|do not)\b/i.test(b) && b.split(" ").length <= 2) b = "";
      if (a && b && !/\s/.test(b)) { const m = a.match(/^(.+\s(?:to|in|at|for|with|on)\s)(\S+)$/i); if (m) b = m[1] + b; }
      if (a && b && /^(the|a|an|my|our|this|that)\b/i.test(b)) { const m = a.match(/^(\S+)\s+(the|a|an|my|our|this|that)\b/i); if (m) b = m[1] + " " + b; }
      if (a && b) return { a: cap(a), b: cap(b) };
      if (a) t = a;
    }
    let act = t.match(lead) ? stripLead(t) : t;
    if (!act) act = "Make the change";
    act = cap(act);
    const l = act.toLowerCase();
    let stay = "Keep things as they are";
    if (/^(take|accept|join)/.test(l)) stay = "Stay where I am"; else if (/^(buy|sell|invest)/.test(l)) stay = "Don't, for now"; else if (/^(move|relocate)/.test(l)) stay = "Stay here"; else if (/^(break up|end|leave|quit|resign)/.test(l)) stay = "Stay"; else if (/^(start|launch|apply|have|get|try|go)/.test(l)) stay = "Wait";
    if (/^stay/.test(l)) return { a: "Stay", b: "Leave" };
    return { a: act, b: stay };
  },

  steps: ["Framing", "Options", "What matters", "How much", "Each option", "Context", "The Pivot", "What this depends on"]
};
