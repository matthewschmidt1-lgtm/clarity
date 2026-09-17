/* Clarity — copy and reference data. All user-facing words live here. */
window.Content = {
  values: [
    { id: "income", label: "Income" },
    { id: "growth", label: "Career growth" },
    { id: "environment", label: "Day-to-day environment" },
    { id: "time", label: "Free time" },
    { id: "relationships", label: "Relationships" },
    { id: "security", label: "Financial security" },
    { id: "health", label: "Health and energy" },
    { id: "meaning", label: "Meaning" },
    { id: "location", label: "Location" },
    { id: "freedom", label: "Freedom and control" },
    { id: "learning", label: "Learning" },
    { id: "stability", label: "Stability" }
  ],

  /* Emotional intensity changes the interaction, never the engine. */
  tone(q) {
    const t = (q || "").toLowerCase();
    const heavy = /(relationship|marriage|marry|divorce|partner|spouse|boyfriend|girlfriend|break ?up|husband|wife|child|kid|baby|pregnan|parent|family|mother|father|health|cancer|surgery|dying|death|grief|therapy|depress|anxious|anxiety|faith|leave him|leave her)/.test(t);
    return heavy ? "heavy" : "plain";
  },

  /* Turn "Should I take the new job?" into two options and a "current state".
     "Should I take the job or go back to school?" becomes two named options. */
  inferOptions(q) {
    let t = (q || "").trim().replace(/[?.!]+$/, "").replace(/\s+/g, " ");
    const cap = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
    const lead = /^(should|do|shall|could|can|would|will)\s+(i|we)\s+/i;
    const stripLead = x => x.replace(lead, "").replace(/^(to\s+)/i, "").trim();
    const both = t.match(/^(.*?)\s+(?:or|vs\.?|versus)\s+(.+)$/i);
    if (both) {
      let a = stripLead(both[1]), b = stripLead(both[2]);
      // "…or not" / "…or stay put" style tails
      if (/^not$/i.test(b) || /^(not|don't|do not)\b/i.test(b) && b.split(" ").length <= 2) b = "";
      // "move to Austin or Denver" → carry the verb phrase across
      if (a && b && !/\s/.test(b)) {
        const m = a.match(/^(.+\s(?:to|in|at|for|with|on)\s)(\S+)$/i);
        if (m) b = m[1] + b;
      }
      if (a && b) return { a: cap(a), b: cap(b) };
      if (a) t = a;
    }
    const m = t.match(lead);
    let act = m ? stripLead(t) : t;
    if (!act) act = "Make the change";
    act = cap(act);
    const l = act.toLowerCase();
    let stay = "Stay as things are";
    if (/^(leave|quit|resign|move|relocate|break up|end|sell|go back|return|start|launch|take|accept|buy|switch|change|apply|join|invest|have|get|try)/.test(l)) stay = /^(take|accept|join)/.test(l) ? "Stay where I am" : /^(buy|sell|invest)/.test(l) ? "Don't, for now" : /^(move|relocate)/.test(l) ? "Stay here" : /^(break up|end|leave|quit|resign)/.test(l) ? "Stay" : "Keep things as they are";
    if (/^stay/.test(l)) return { a: "Stay", b: "Leave" };
    return { a: act, b: stay };
  },

  seeds(q) {
    const t = (q || "").toLowerCase();
    if (/job|work|career|role|offer|company|boss|promotion/.test(t)) return ["The new role pays…", "I'll get promoted within…", "How many hours I'd actually work", "The culture there is better", "My current company is stable"];
    if (/move|relocat|city|country|apartment|house|home/.test(t)) return ["Rent there is…", "I'd make friends quickly", "Whether I'd miss my people here", "My job allows remote work", "The commute would be…"];
    if (/school|degree|study|program|course|mba|phd/.test(t)) return ["Tuition is…", "The degree will raise my income", "Whether I'd finish it", "It takes two years", "I'd enjoy studying again"];
    if (/relationship|partner|stay|leave|marr|breakup|break up/.test(t)) return ["We've been together for…", "Things would improve if…", "Whether the pattern would repeat", "I'd be lonely at first", "We want different things"];
    if (/business|start|company|found|freelance/.test(t)) return ["I have … months of runway", "I'd find customers within a year", "Whether I can sell", "My savings are…", "The market is growing"];
    return ["Something I could verify today", "Something I'm treating as true", "Something I don't know yet", "What it costs", "What it would give me"];
  },

  steps: ["Deciding", "Hoping", "Knowing", "Weighing", "Comparing", "Horizons", "Risk", "Waiting", "Predicting", "Stress test", "Report"]
};
