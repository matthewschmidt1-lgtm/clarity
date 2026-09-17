# Clarity — persona evaluation v2 (post voice-rewrite)

Same eight people as v1 (`qa/personas/sessions.json` → `transcripts.txt`), plus three harder scenarios added for this pass (`qa/personas/sessions-extra.json` → `transcripts-extra.txt`): a genuinely two-sided decision where neither option is the status quo (**denver-austin**), a person who names a factor outside the fixed list (**own-factor-relocation**, factor `"My kids' school"`), and a heavy relationship decision answered "unsure" with an assumed factor that would flip the lean if it turned out false (**heavy-marriage-assumed-flip**). All eleven replayed cleanly through `qa/replay.sh` on the first attempt — no JSON fixes were needed.

Promise under test: *"See what your decision depends on."* Voice under test: calm intelligence — fewer words, more observations, fewer questions, a question that has earned the right to be asked, no AI-therapist filler.

---

## A. Ambiguity audit

Grouped by moment. "Likely read" is what a first-time reader takes away without re-reading. Quotes are exact, pulled from `transcripts.txt` / `transcripts-extra.txt`.

### Gathering

| Line (quoted exactly) | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "What's on your mind?" | Open, neutral invitation | Same | CLEAR | — |
| "What's making this hard?" | Ask for the emotional knot, not the logistics | Same, though the app-only hint "Not the options. The knot." (`js/app.js` step 1) is a metaphor a first-time reader could take literally (a literal knot/puzzle) before the sentence lands | CLEAR | — |
| "What are you hoping changes if you take the offer in Denver?" (denver-austin) | Surface the underlying want behind option A | Reads as if Denver is "the" active choice and Austin is the default being compared against, when neither is a default — the question is only ever anchored to option A | MISLEADING (two-sided case only) | Ask about the *decision*, not one option: "What are you hoping changes, whichever way this goes?" when neither option is status quo |
| "What are you hoping changes if you accept the early retirement package?" (single-sided cases) | Same pattern, but here A actually is the "move" option and B is the true status quo | Matches intent | CLEAR | — |

### Tension / test

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "You want to take the new job at the startup. What you've described is what you hope it changes. One way to test that:" | "It" = taking the job; "what you hope [taking the job] changes [about your life]" | Grammatically parseable only by inference — "it" has no explicit antecedent in the sentence itself, only in the sentence before. Most readers will infer correctly from momentum, but it doesn't parse cleanly on a slow read | CLEAR (borderline) | "You want to take the new job at the startup. That's the change you're hoping for. One way to test it:" — removes the dangling "it" |
| "If your current job gave you what you want, would you still take the new job at the startup?" (and all 10 other instances — every transcript has one) | "Would you still *want to*" (the UI's own answer choices are "Yes, I'd still want to" / "No, probably not" / "I'm not sure") | Reads equally well as "would you still go and do it" (an action question) — the bare question text doesn't disambiguate wanting from doing, only the on-screen answer buttons do | **AMBIGUOUS**, systemic — present in all 11 transcripts | Add "want to": "…would you still *want to* take the new job at the startup?" |
| "If “Take the offer in Austin” gave you what you want, would you still take the offer in Denver?" (denver-austin) | Same "would you still want" test, generalized to a case with no status quo | Confusing on top of the want/do ambiguity above: it reads as though Austin could somehow "give" an outcome you'd then evaluate by picking Denver anyway — the hypothetical granter and the actual choice are two different named things, which the status-quo version never has to juggle | MISLEADING (two-sided case) | For the no-status-quo case, ask about the desired outcome directly rather than routing it through the other option: "If nothing about the outcome depended on which city, would you still lean Denver?" |
| "Maybe the question isn't which one. It's whether you can get what you want either way." (denver-austin, "no" + either-way) | "Which one" = which city | Resolves correctly because both options were just named on-screen | CLEAR | — |
| "You want to leave your relationship. But you're not sure it's the only way to get what you want. That's worth knowing." ("unsure" discovery) | "It" = leaving | Clear from proximity | CLEAR | — |
| "Then it's the change you want, not only what it brings." ("yes" discovery, Tom) | Distinguish wanting the change itself from wanting its side-effects | Compressed enough that "it" (the change) doing double duty as both subject and the thing "it brings" requires a re-read; a fast reader could parse "not only what it brings" as "not only what [retirement in general] brings" rather than the sharper "not only the material payoff" | AMBIGUOUS (mild) | "You don't just want what it brings. You want the change itself." |

### Noticing (the Pivot / reframe / observation)

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "You don't just want to move back home to be near your parents. You want to not feel guilty every time your phone rings." | Reframe from action to hope | Matches | CLEAR | — |
| "You're not sure this is the only way to get it." (every "unsure" transcript: job-change, heavy-hearted, torn-many, own-factor-relocation, heavy-marriage) | "This" = taking the named action (option A) | The immediately preceding clause is about *wanting a feeling* ("You want to feel challenged again…"), not about the action — "this" most naturally binds to the nearest noun phrase, which is the feeling, not the act. A reader can walk away thinking "I'm not sure *wanting this* is the only way to get it," which is a different (odder) claim than intended | **AMBIGUOUS**, systemic across every "unsure" transcript | Name the action explicitly: "You're not sure taking the new job is the only way to get it." |
| "If “Take the offer in Austin” could give you that, you'd choose “Take the offer in Austin”." (denver-austin) | Close the loop on the hypothetical | Meaning is technically clear, but repeating the same quoted label as both the hypothetical grantor and the chosen option, back to back, in the same breath, reads as templated substitution rather than a sentence a person would say | CLEAR (but robotic — a quoted label reading oddly as a repeated sentence subject/object) | "If Austin could give you that on its own, the choice would be easy." (drop the second literal quote) |
| "“Take the new job at the startup” isn't the uncertainty. Career growth is." / "“Leave your marriage” isn't the uncertainty. Relationships is." | Redirect attention from the option to the factor | Understandable, but a quoted option label opening a sentence as its grammatical subject reads stiffly — it's the one place the report sounds most like a template filling in blanks rather than a person talking | CLEAR (flagged pattern per spec) | Lead with the factor instead: "Career growth is the uncertainty here — not which job." |
| "You know what you want. You don't know whether you can get it either way." (denver-austin) | "It" = the hoped-for feeling | Clear | CLEAR | — |
| "Name the one thing you'd want to be true before you'd feel settled. If you can't, that's your answer." (Tom, appears directly under "What's left") | A closing test, offered as reassurance | Arrives one paragraph after the report has already declared "There's no unknown left that would materially change this decision" and "You already know enough" — asking him to now pass a test to *prove* he's settled contradicts the verdict just given | **MISLEADING** (contradicts the preceding "settled" verdict) | Drop the conditional framing for the `none` pivot kind: "If a new worry shows up, that's the one thing worth naming. Until then, there's nothing left to check." |

### Report (structure, tradeoff, next step)

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "More career growth against more financial security. That's the exchange." | Career growth favors A, financial security favors B | Matches, once read alongside the Known/Assumed lines directly above it | CLEAR | — |
| "More career growth against more my kids' school. That's the exchange." (own-factor-relocation) | Career growth favors relocating, "my kids' school" favors staying | **Ungrammatical** — "more … my kids' school" doesn't parse as English; a custom factor whose label is a noun phrase with its own possessive breaks the `More {factor} against more {factor}` template | **MISLEADING** (broken grammar, produced directly by testing a custom factor) | Don't force custom (or any noun-phrase) factors through "more ___": "Career growth favors relocating. My kids' school favors staying. That's the exchange." |
| "On everything you named, “Stay” is stronger. The tradeoff isn't between the options; it's between what you're sure of and what you're not." | One-sided case; reframe indecision as asymmetric | Matches, and lands well | CLEAR | — |
| "Say it out loud to the person it's about." (heavy-marriage-assumed-flip, `how.relationships`) | Go ask your husband directly whether he'd change | "It" used twice in five words (the thing to say; the person the assumption concerns) but resolves correctly given the preceding Pivot question | CLEAR | — |
| "This will take time to learn. Decide whether waiting costs you more than choosing without it, and give yourself a date." (`findOut: while`) | "It" = the information being sought | Slight double-back reference but resolves in context | CLEAR | — |
| "Nothing. You already have what you need." | Verdict for the no-Pivot case | Matches | CLEAR | — |

**Tally:** 4 AMBIGUOUS/MISLEADING line-templates recur across the eleven transcripts (the want/do "would you still," the dangling "this" in the unsure reframe, the Tom "settled but still be tested" contradiction, and the two-sided-specific hope framing), plus one broken-grammar defect specific to a custom noun-phrase factor. Two more patterns (dangling "it" in the tension line; quoted label as sentence subject) are flagged per the audit's required checks but read as CLEAR in practice.

---

## B. Quantitative

### All eleven personas (0–2 each)

| Dimension | job-change | move-home | grad-school | heavy-hearted | buy-vs-rent | start-business | already-knows | torn-many | denver-austin | own-factor | heavy-marriage |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Decision fidelity | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Intent fidelity | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 2 |
| Known/assumed/unknown | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 2 |
| Pivot quality | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 1 | 1 | 2 |
| Next-step actionability | 2 | 1 | 1 | 2 | 1 | 1 | 2 | 2 | 1 | 2 | 2 |
| Agency | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Clarity of writing | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 |
| Voice (calm intelligence) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 2 |
| Ambiguity (2/1/0 = 0/1/2+ ambiguous lines) | 0 | 1 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |

### Original eight vs v1

| Dimension | job-change | move-home | grad-school | heavy-hearted | buy-vs-rent | start-business | already-knows | torn-many |
|---|---|---|---|---|---|---|---|---|
| Decision fidelity | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) |
| Intent fidelity | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 1→1 (0) | 2→2 (0) | 2→2 (0) |
| Known/assumed/unknown | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 1→1 (0) | 2→2 (0) | 2→2 (0) | 1→1 (0) |
| Pivot quality | 2→2 (0) | 1→2 (+1) | 1→1 (0) | 2→2 (0) | 2→2 (0) | 1→1 (0) | 2→2 (0) | 2→2 (0) |
| Next-step actionability | 2→2 (0) | 1→1 (0) | 1→1 (0) | 1→2 (+1) | 1→1 (0) | 1→1 (0) | 2→2 (0) | 2→2 (0) |
| Agency | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) |
| Clarity of writing | 1→1 (0) | 1→2 (+1) | 1→2 (+1) | 2→2 (0) | 1→2 (+1) | 1→2 (+1) | 1→2 (+1) | 2→2 (0) |

Net: **6 of 56 cells moved, all upward, zero regressions.** Every clarity gain traces to the same fix (the "give you to ___" grammar and the mine→yours leak, both confirmed repaired — see Section E). The two pivot/next-step gains (move-home, heavy-hearted) trace to the new heavy-tone `findOut: doing` branch ("The only way to know is to live it… worth saying out loud to someone before you do") replacing the old glib "just try it," and to the hope/factor sequencing in move-home now reading as ordered rather than simultaneous.

### Counts across all eleven transcripts

- Total Clarity-authored sentences (dialogue prompts + full report, both files): **446**
- Mean words per sentence: **9.1**
- Questions: **118** — Declarative observations: **328** (roughly 1 question for every 2.8 declaratives)
- Lines containing a quoted option label: **44**
- AMBIGUOUS/MISLEADING verdicts in the Section A audit: **9** distinct line-templates (4 systemic across most/all transcripts, 4 scenario-specific to the three new personas, 1 to Tom's "already-knows" case)

---

## C. Qualitative (first person, brief)

**job-change — Priya.** Before: circling the same fight for weeks. After: **lighter** — it went straight to "is the growth even real" and didn't waste my time on the other three factors. *Did anything become clearer:* I know what I need to find out. Line I'd repeat: "Career growth is. Is 'Take the new job at the startup' really stronger on career growth?" Line that made me wince: "You're not sure this is the only way to get it" — "this" made me stop and reread to figure out what "this" even was. Tension line felt earned — it followed straight from what I'd just said about dreading Mondays. Discovery line landed as noticing, not a trick.

**move-home — Daniel.** Before: guilt-paralyzed. After: **lighter**, and this time the grammar didn't get in the way — "Can where you live now actually let you not feel guilty every time your phone rings?" reads like something a calm person would actually say to me. *Clearer:* I know what I need to find out. Repeat line: "Can where you live now actually let you not feel guilty every time your phone rings?" Wince line: none this time — the "give you to" break from v1 is gone. Tension line earned. Discovery line: noticing.

**grad-school — Marisol.** Before: torn between purpose and stability. After: **lighter.** The fixed grammar ("let you finally be doing the kind of research you actually care about") no longer undercuts the payoff line the way it did in v1. *Clearer:* I know what I need to find out. Repeat line: the tradeoff line, "More meaning against more income." Wince line: still the underlying structural gripe from v1 — career growth (the actual crux, in my view) is still buried as the "if it can't" clause rather than foregrounded. Tension line earned. Discovery: noticing.

**heavy-hearted-relationship — Aisha.** Before: crying on both sides. After: **lighter**, and this time the "find out" step actually respects the stakes: "The only way to know is to live it. That's a bigger ask than it sounds. Worth saying out loud to someone before you do." That's new, and it's the single biggest improvement in this whole pass for me. *Clearer:* I understand what I'm actually struggling with. Repeat line: "On everything you named, 'Stay' is stronger. The tradeoff isn't between the options; it's between what you're sure of and what you're not." Wince line: "You're not sure this is the only way to get it" — same dangling "this" as everyone else. Tension line earned. Discovery: noticing.

**buy-vs-rent — Ken.** Before: anxious, parroting other people's certainty. After: **lighter.** Grammar clean now. *Clearer:* I know what I need to find out. Repeat line: "Can where you live now actually let you stop feeling like we're behind everyone else our age?" Wince line: the report still doesn't tell us the financial-security unknown is resolvable with an afternoon of real math — same gap as v1. Tension line earned. Discovery: noticing.

**start-business — Ola.** Before: guilty about wanting this. After: **about the same** — organized the fear, didn't reduce it, same as v1. "Yours" is fixed now, which matters more than I expected — it no longer sounds like the app is claiming my business for itself. *Clearer:* I know what I need to find out. Repeat line: "More meaning against more financial security." Wince line: still no way for "runway" (three kids, a mortgage) to enter the picture — I never added it as a custom factor either, so I can't blame the engine this time, but I notice the fixed list didn't prompt me to think of it. Tension line earned. Discovery: noticing.

**already-knows — Tom.** Before: not conflicted, just scared to say it. After: **lighter**, specifically relieved of the obligation to keep being thorough. *Clearer:* I know what I need to do. Repeat line: "There's no unknown left that would materially change this decision. What's left is preference, and that's yours." Wince line: "Name the one thing you'd want to be true before you'd feel settled. If you can't, that's your answer" — arriving right after I've been told I'm already settled, it reads like the app doesn't trust its own verdict. Tension line earned (it's honest that the "if it gave me what I want" test still applied even though I answered yes). Discovery landed as noticing — "Then it's the change you want, not only what it brings" is exactly right, just took a second read.

**torn-many-unknowns — Jae.** Before: excited and scared, deciding on no information. After: **lighter.** Same "career growth first" ranking as v1, still correct given what I ranked #1. *Clearer:* I know what I need to find out. Repeat line: "The tradeoff isn't between the options; it's between what you're sure of and what you're not" (via the discovery line and structure). Wince line: same dangling "this" in the reframe. Tension line earned. Discovery: noticing.

**denver-austin — Sam.** Before: flip-flopping between two equally unfamiliar futures. After: **about the same**, maybe slightly heavier — being asked "if Austin gave you what you want, would you still take Denver?" made the two cities sound interchangeable in a way that didn't match how different they actually feel to me. *Clearer:* I know what I need to find out (barely — "find out" here means "ask Austin a hypothetical question," which isn't a real action the way "ask two people who joined a year ago" is for career growth). Repeat line: "Maybe the question isn't which one. It's whether you can get what you want either way" — genuinely useful reframe for a two-sided choice. Wince line: "If 'Take the offer in Austin' could give you that, you'd choose 'Take the offer in Austin'" — reads like a find-and-replace, not a sentence. Tension line felt slightly presumptuous — it assumed my hesitation was about a hope that "either way" could satisfy, when for me the two cities really are different bets, not two paths to the same feeling. Discovery line landed closer to a trick than a notice, the one time in this set that happened.

**own-factor-relocation — Priyanka.** Before: torn between ambition and my kids' stability. After: **lighter**, mostly. It correctly separated "career growth: known, favors the move" from "stability: genuinely unknown" — that part is honest. *Clearer:* I understand what I'm actually struggling with. Repeat line: "Which option is actually stronger on stability?" — fair, concrete, and I know how to go find out ("ask how the last hard year went"). Wince line, no contest: "More career growth against more my kids' school. That's the exchange" — that's not a sentence, and it's the one line in the whole report about the thing I actually care about most. Tension line earned. Discovery landed as noticing, but the report's Pivot chases "Stability" in the abstract rather than "my kids' school" specifically, even though I named the second one and ranked it third — a small fidelity gap, since "known" facts (even a decisive, named one like mine) structurally can't become the Pivot, only genuine unknowns can.

**heavy-marriage-assumed-flip — Linh.** Before: I'd already built the case against him in my head. After: **lighter**, and unsettled in a good way — it caught the one thing I'd never actually tested. *Clearer:* I understand what I'm actually struggling with. Repeat line, no contest: "Say it out loud to the person it's about" — that's the whole nineteen years in five words. Wince line: "'Leave your marriage' isn't the uncertainty. Relationships is" — the quoted-label-as-subject construction makes the sentence about my marriage sound like a spreadsheet cell. Tension line felt earned, not presumptuous — it named exactly the gap I'd described (never asked him). Discovery line landed as noticing, cleanly.

---

## D. Voice consistency

| Moment | Should read as | Example | Fits? |
|---|---|---|---|
| Gathering | Conversational | "What's making this hard?" | Yes — short, plain, no filler |
| Noticing | Reflective, short declaratives | "You know what you want. You don't know whether you can get it either way." | Yes, when the sentence is a fresh observation. Blurs with "challenging" when it immediately follows with a question in the same beat |
| Challenging | Direct | "If your current job gave you what you want, would you still take the new job at the startup?" | Yes in form (short, direct, no hedge), but see Section A — "direct" and "ambiguous" aren't mutually exclusive, and this line is both |
| Crux | Quiet and declarative | "Career growth is. Is 'Take the new job at the startup' really stronger on career growth?" | Mostly — the quoted-label-as-subject habit is the one place the quiet declarative voice slips into template-filling |
| Boundary | Transparent | "Based on what you've told me." / "Clarity can only see what's been put into the decision." | Yes, consistently, across every transcript |
| Next step | Calm | "Say it out loud to the person it's about." | Yes — this is the voice at its best: short, concrete, no hedge, no cheerleading |

**Where two moments blur:** the reframe block does "noticing" and "challenging" in the same three sentences — "You don't just want to X. You want Y. If Z could give you that, you'd stay." — which is fine for status-quo cases but becomes "challenging" language pretending to be "noticing" in the two-sided case (denver-austin), where there's no real "you'd stay" to land on and the engine substitutes a second quoted label instead. The Tom contradiction in Section A (settled verdict immediately followed by "name the one thing…") is also a moment-blur: "crux" (quiet, declarative, closing) bleeding into "challenging" (a live test) right when the voice should be at its calmest.

---

## E. Summary

**What the rewrite fixed** (v1 quote beside v2 quote, same person):
- job-change / move-home / grad-school / buy-vs-rent / start-business — the "give you to ___" grammar break. v1: *"Can 'Stay in my job and look for a raise elsewhere' actually give you to finally be doing the kind of research you actually care about instead of assisting someone else's?"* → v2: *"Can where you are now actually let you finally be doing the kind of research you actually care about instead of assisting someone else's?"*
- start-business — the possessive leak. v1: *"Can 'Stay' actually give you to build something that's actually mine instead of making someone else rich?"* → v2: *"Can your current job actually let you build something that's actually yours instead of making someone else rich?"*
- heavy-hearted-relationship — the glib "just try it" for an irreversible, six-year relationship. v1: *"The only way to know is to try."* → v2: *"The only way to know is to live it. That's a bigger ask than it sounds. Worth saying out loud to someone before you do."*
- move-home — first-person label leak. v1: *"You don't just want to move back home to be near my parents."* → v2: *"You don't just want to move back home to be near your parents."*

**What it broke or made worse:**
- A new, systemic ambiguity was introduced (or rather, never addressed) in the "would you still ___" question — every one of the eleven transcripts carries it, and it's exactly the pattern the brief asked to hunt for (a question ambiguous between wanting and doing).
- The two-sided ("either way") branch, never stress-tested before this pass, produces the report's most template-visible writing: a quoted option label doing double duty as hypothetical grantor and final choice in the same sentence, plus a hope-question ("ask for it directly") that doesn't make sense to "ask" of a city.
- A custom, noun-phrase-with-possessive factor ("My kids' school") breaks the `More {factor} against more {factor}` tradeoff template outright — "More career growth against more my kids' school" is not a sentence.
- The already-knows persona's closing tension ("you already know enough" immediately followed by "name the one thing that would unsettle you") persists unchanged from v1 — it was flagged there and nothing addressed it.

**Top five ambiguities, ranked by how many of the eleven personas they'd confuse:**
1. "Would you still ___?" ambiguous between wanting and doing — present in all 11 transcripts.
2. The dangling "this" in the unsure-branch reframe ("you're not sure *this* is the only way to get it") — present in all 5 "unsure" transcripts (job-change, heavy-hearted, torn-many, own-factor-relocation, heavy-marriage).
3. The two-sided hope-pivot framing (quoted label as both grantor and choice) — denver-austin, but structurally will recur for any future two-option-neither-status-quo decision.
4. The broken tradeoff grammar for noun-phrase custom factors — own-factor-relocation, but will recur for any custom factor with a possessive or article ("the kids," "our savings," "his temper").
5. The "already know enough, but here's a test to check if you're really settled" contradiction — already-knows only in this set, but structurally guaranteed for every `pivot.kind === "none"` report.

**Three proposed line replacements, most confident first:**
1. `stillWantQuestion`: insert "want to" — `` `If ${h} gave you what you want, would you still want to ${goVerb(s)}?` `` — removes the systemic want/do ambiguity in one change, everywhere it's used.
2. The reframe's "unsure" branch: replace the bare "this" with the named action — `` `You're not sure ${goVerb(s)} is the only way to get it.` `` (drop the dead `quote(A)` branch entirely; it never fires).
3. The tradeoff line's `both-sides` template: stop forcing "More {x} against more {y}" onto arbitrary factor labels — use `` `${cap(sideA[0].factor)} favors ${quote(A)}. ${cap(sideB[0].factor)} favors ${quote(B)}. That's the exchange.` `` instead, which is grammatical regardless of what the factor label is.

**Does this now read as a perceptive instrument rather than an assistant?** Mostly, yes, and more so than before. The rewrite's real achievement isn't any single line — it's that the mechanical seams from v1 (the grammar breaks, the possessive leak, the glib "just try it") are gone everywhere they were tested before, and nothing regressed. What's left is a genuine want/do ambiguity baked into the one question the whole "hope" mechanism pivots on, and a set of edge cases — the two-sided decision, the custom factor, the fully-resolved case — that the original eight personas never exercised and that expose where the report's sentence templates were built for one shape of decision (an active change against a named status quo) and strain when a real person hands it a different shape. None of these are voice failures in the AI-therapist sense — no persona transcript in this set contains "it sounds like," "let's unpack," or any of the banned filler — the calm-intelligence register holds. The gaps are structural: places where the underlying template assumes a status quo, a listed factor, or a settled verdict that stays settled, and a real person's answer didn't fit that assumption.
