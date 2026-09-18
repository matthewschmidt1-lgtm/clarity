# Clarity 2.0 — persona evaluation v3 (structured-steps rebuild)

The same eleven people from v1/v2, rebuilt into the new eight-step model (`qa/personas/sessions.json` → `qa/replay.sh` → `qa/personas/transcripts.txt`). All eleven replayed cleanly on the first attempt; no JSON fixes were needed. The rebuild replaces seven conversational questions with eight confirmed steps (frame, options, criteria, importance, per-criterion preference + confidence, optional context, a confirmed Pivot, and a synthesis) and a deterministic engine (weighted expected utility, sensitivity analysis, a hinge score, a value-of-information ranking) in place of the earlier heuristic engine.

Promise under test, unchanged: *"See what your decision depends on."* Brand rule under test, unchanged: never a score, never a verdict, never a recommendation.

---

## A. Ambiguity audit

Quotes are exact, pulled from `qa/personas/transcripts.txt`. "Likely read" is what a first-time reader takes away without re-reading or consulting the model JSON.

### The word scales

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| Importance: "Not much · Somewhat · Important · Very important · Critical" | Five evenly-spaced steps of weight | The jump from "Somewhat" to "Important" is the one soft spot — "Important" is also the category name for the whole screen ("What could matter here?" / "important" implicitly means "picked at all"), so a person who already thinks everything they picked is important by definition may default to the middle-to-high end and rarely use "Not much" or "Somewhat." Every persona in this set used "Somewhat" only once (job-change's Time) and "Not much" zero times across 44 criterion-importance answers | AMBIGUOUS (mild, distributional not comprehension) | Rename the middle rung away from the screen's own vocabulary, e.g. "Not much · A little · Matters · Matters a lot · Can't compromise" |
| Confidence: "Guessing · Somewhat sure · Fairly sure · Very sure · I know this" | Five evenly-spaced belief strengths (0.25/0.5/0.7/0.9/0.98) | "Fairly sure" and "Very sure" read as close synonyms on a fast read — the model treats them as meaningfully different (0.7 vs 0.9, a 0.2 swing in belief strength, larger than the 0.15 gaps elsewhere), but the words themselves don't signal that this particular gap is the biggest one on the scale | AMBIGUOUS (mild) | Widen the wording gap to match the numeric gap: "Guessing · Leaning one way · Fairly sure · Confident · I know this" |

### The comparison controls

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "Take the offer at the startup, clearly" / "Take the offer at the startup" / "About the same" / "Stay in your job" / "Stay in your job, clearly" (job-change) | A five-point comparison, symmetric around "about the same" | Matches — the label-first, "clearly" appended pattern reads naturally and the symmetry is visible at a glance | CLEAR | — |
| "Poor / Weak / Okay / Good / Strong" per option (denver-austin, 3+ options) | A per-option five-point rating, independent across options | Matches, and avoids the forced-comparison feel of the two-option control | CLEAR | — |

### The synthesis: "what could change your mind"

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "Right now “Start the business” comes out ahead on what you've said. If “Start the business” came out only a little better on career growth, “Stay in your job” would come out ahead instead." (start-business) | If the guessed advantage on career growth turns out to be *smaller* than assumed, the leader flips | "Only a little better" reads as *still better*, i.e. still favouring "Start the business" — a first-time reader has no cue that "a little better" here means "less better than you're currently assuming," which is the opposite direction from what "better" normally signals in a comparison. The sentence describes a shrinking margin using the same word ("better") used everywhere else to describe a growing one | **MISLEADING**, present in every criterion-kind Pivot (start-business, denver-austin) | Name the direction explicitly: "...comes out ahead. That depends on career growth turning out to favor it as much as you're guessing. If it turns out to favor it only a little, “Stay in your job” would come out ahead instead." |
| "Is “Move to Austin” really stronger on career growth?" then "If “Move to Austin” came out better on career growth, “Move to Austin” would come out ahead instead." (denver-austin) | Same sensitivity sentence, three-option case | Same ambiguity as above, compounded: here the direction implied by "came out better" is the *opposite* of the start-business case (an increase, not a decrease, flips the result), because Austin is the runner-up, not the leader, on this criterion. The sentence template silently reverses meaning depending on whether the flippable criterion favours the leader or the runner-up, with no textual signal to the reader that the direction changed | **MISLEADING**, systemic to the template (`flipDiff` branch in `js/engine.js`) | Since the direction is arbitrary per case, state it as a threshold rather than a comparative: "The two are close on career growth. If it turns out to favor 'Move to Austin' more clearly, 'Move to Austin' would come out ahead." |
| "Nothing else you're unsure about moves it that far." (every criterion-kind Pivot) | Reassurance that this is genuinely the single biggest lever | Matches, and is honestly earned — it's the correct plain-English gloss of "hinge is the max of `byHinge`" | CLEAR | — |

### The confirmation question

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "If you knew the answer to this, could it change your decision?" followed immediately by the quoted candidate question, e.g. "Is “Start the business” really stronger on career growth?" | Confirm this specific candidate is worth pursuing before committing to it as the Pivot | Matches — the quoted question directly beneath removes any referent ambiguity that a bare "this" would have had | CLEAR | — |
| Same confirmation question, but routed to a hope candidate: "Can your current job actually let you feel excited about work again, not dread Mondays?" (job-change) | Confirm the hope test is the right thing to check first | Matches on its own, but see Section E — the person never sees the criterion-based alternative (career growth, the largest hinge in their own model) at this stage, so "could it change your decision" only ever gets asked about the hope test, never the analytically larger uncertainty it silently pre-empted | CLEAR (as written) but incomplete — see model-fidelity finding in Section E | Offer the runner-up candidate as a visible fallback in the same screen even when hope is present, not only after a "no": "This is what I'd ask first. [Career growth is close behind.]" |

### "Less important: …"

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "Ask two people who joined a year ago what actually changed for them. Less important: stress." (start-business — Ola rated Stress "Important," 3/5) | Rank by value-of-information (hinge), not by how much the person said it matters | The word "important" was defined two screens earlier as the person's own stated weight ("Not much · Somewhat · **Important** · Very important · Critical"). Reusing "important" here for a different axis (how much *learning about it* would move the result) reads as a contradiction: Ola rated stress "Important" and is now told, in the same voice, that it's "less important." The report never says "less useful to check" or "less likely to change anything" — it borrows the exact word whose meaning it just changed | **MISLEADING**, present in both criterion-kind transcripts (start-business, denver-austin) | Don't reuse the importance vocabulary for the VOI ranking: "Ask two people who joined a year ago what actually changed for them. Stress could matter too, but it wouldn't move this as much." |

### The two settled verdicts

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "You already know enough." / "Everything you named, you're sure of. What's left is what you prefer, and that's yours to weigh." (already-knows — Tom) | Permission to stop, no hedge | Matches cleanly — and, confirmed against `js/app.js`, the v2-flagged contradiction ("name the one thing you'd want to be true before you'd feel settled," arriving right after this verdict) is gone. Nothing in Tom's transcript walks the verdict back | CLEAR | — |
| "Nothing you're unsure about would change this." / "The result holds however the uncertain parts turn out. You may be more decided than you feel." (`js/engine.js`, the `robust` branch — not triggered by any of the eleven, read from source) | Distinguish "nothing to check" (no unknowns at all) from "unknowns exist but none of them are big enough to matter" | Matches on a careful read, and the distinction from "You already know enough" is real and worth having, but the two verdicts are similar enough in tone and length that a person who saw only one of them wouldn't necessarily notice which one they got, or that there's a difference between "I have no doubts" and "I have doubts, but none of them are decisive" | CLEAR (untested by this persona set — no session reached `all_known: false, stable: true`) | Sharpen the second one to name what makes it different: "You have real doubts here. None of them are big enough to change the answer." |

### Repetition (new to the structured rebuild)

| Line | Intended | Likely read | Verdict | Fix |
|---|---|---|---|---|
| "You're not sure the only way to get it is to take the offer at the startup. **That comes before anything else.**" (reframe) … "You know what you want. You don't know whether you can get it without leaving. Can your current job actually let you feel excited about work again, not dread Mondays? **This comes before anything else.**" (Pivot block, same report, four lines later) | Emphasize, twice, that the hope test outranks everything else | The near-identical clause appears twice in the same short report ("comes before anything else" / "This comes before anything else"), in every hope-kind transcript (8 of 11: job-change, move-home, grad-school, heavy-hearted, buy-vs-rent, torn-many, own-factor, heavy-marriage). On a second read it's reinforcement; on a first read it reads as the report repeating itself rather than building | AMBIGUOUS (mild, systemic across all hope-kind reports) | Say it once. Drop the reframe's "That comes before anything else" and let the Pivot block's version carry it |

**Tally:** 2 MISLEADING line-templates specific to criterion-kind Pivots (the sensitivity-flip sentence, the "less important" term-clash) — both fire together whenever the Pivot is a criterion rather than the hope test (2 of 11 transcripts here: start-business, denver-austin, but structurally guaranteed for any future criterion-kind report). 1 systemic AMBIGUOUS repetition across all 8 hope-kind transcripts. 2 mild AMBIGUOUS word-scale issues that would recur across every session. All of the v2 top-five (want/do ambiguity, dangling "this," two-sided hope-grantor grammar, custom-factor tradeoff grammar, the already-knows contradiction) are confirmed fixed — see Section F.

---

## B. Agency and scoring

**"Right now “Start the business” comes out ahead on what you've said."** and its siblings ("comes out ahead on what you've said," used in both criterion-kind transcripts) sit closer to a verdict-in-disguise than anything else in the report. It names a single winner, in the present tense, with no hedge in the sentence itself — the hedge ("on what you've said") is doing real but quiet work, and a skimming reader gets "X comes out ahead" before "on what you've said" registers as the qualifier that makes it provisional. It is never followed by an instruction to act on it ("so choose X"), and the very next sentence undercuts it with the flip condition — so in context, across the whole report, it does not cross into recommendation. Taken as a standalone sentence, though, it is the single line in either transcript closest to violating "never a score, never a verdict."

**Verdict: soften, don't cut.** The sentence is doing necessary work — without it, "what could change your mind" has no baseline to change *from*. Proposed rewording, keeping the hedge but moving it to the front where it can't be skimmed past:

> "On what you've told me, “Start the business” is the current lean. If career growth turns out to favor it only a little, “Stay in your job” would be the lean instead. Nothing else you're unsure about moves it that far."

"Current lean" replaces "comes out ahead" throughout — it's the same information, but "lean" is inherently provisional in a way "ahead" (a race metaphor with a finish line) is not.

No other line in either the criterion-kind or hope-kind reports crosses into recommendation. "What might be worth learning" always frames the next action as information-gathering, never as a choice; "What appears clear" and "What you're less certain about" both stay descriptive; the closing line ("Now you know what you're deciding," not "now you know what to do") holds the line consistently across all eleven transcripts.

---

## C. Quantitative

### All eleven personas (0–2 each)

| Dimension | job-change | move-home | grad-school | heavy-hearted | buy-vs-rent | start-business | already-knows | torn-many | denver-austin | own-factor | heavy-marriage |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Decision fidelity | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Intent fidelity | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 2 |
| Known/assumed/unknown | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 |
| Pivot quality | 1 | 2 | 1 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 2 |
| Next-step actionability | 2 | 2 | 1 | 1 | 1 | 2 | 2 | 1 | 2 | 1 | 1 |
| Agency | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Clarity of writing | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 2 |
| Voice (calm intelligence) | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 1 |
| Ambiguity (2/1/0 = 0/1/2+ ambiguous lines) | 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 0 | 1 | 1 |
| **Model fidelity (new)** | 1 | 2 | 1 | 2 | 1 | 2 | 2 | 1 | 2 | 1 | 2 |

### Delta vs evaluation-v2.md (same eleven, shared dimensions)

| Dimension | job-change | move-home | grad-school | heavy-hearted | buy-vs-rent | start-business | already-knows | torn-many | denver-austin | own-factor | heavy-marriage |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Decision fidelity | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) |
| Intent fidelity | 2→2 (0) | 2→2 (0) | 2→1 (−1) | 2→2 (0) | 2→1 (−1) | 1→2 (+1) | 2→2 (0) | 2→1 (−1) | 2→2 (0) | 2→1 (−1) | 2→2 (0) |
| Known/assumed/unknown | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 1→2 (+1) | 2→2 (0) | 2→2 (0) | 1→1 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) |
| Pivot quality | 2→1 (−1) | 2→2 (0) | 1→1 (0) | 2→2 (0) | 2→1 (−1) | 1→2 (+1) | 2→2 (0) | 2→1 (−1) | 1→2 (+1) | 1→1 (0) | 2→2 (0) |
| Next-step actionability | 2→2 (0) | 1→2 (+1) | 1→1 (0) | 2→1 (−1) | 1→1 (0) | 1→2 (+1) | 2→2 (0) | 2→1 (−1) | 1→2 (+1) | 2→1 (−1) | 2→1 (−1) |
| Agency | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) |
| Clarity of writing | 1→2 (+1) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→1 (−1) | 2→2 (0) | 2→2 (0) | 1→1 (0) | 1→2 (+1) | 1→2 (+1) |
| Voice | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→1 (−1) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 2→2 (0) | 1→2 (+1) | 1→2 (+1) | 2→1 (−1) |
| Ambiguity | 2→1 (−1) | 1→1 (0) | 1→1 (0) | 2→1 (−1) | 1→1 (0) | 1→0 (−1) | 2→2 (0) | 2→1 (−1) | 2→0 (−2) | 2→1 (−1) | 2→1 (−1) |

**Net: 22 of 99 shared-dimension cells moved. 9 up, 13 down.** The gains cluster on *writing mechanics* — every structural grammar bug flagged in v2 (the two-sided hope-grantor sentence, the custom-factor tradeoff template, the want/do ambiguity, the dangling "this," Tom's contradiction) is confirmed fixed, and Known/assumed/unknown improved for buy-vs-rent now that "financial security: guessing" is rendered with an explicit confidence word rather than folded into a flat "assumed." The losses cluster on *the hinge-vs-hope tradeoff*: wherever a hope candidate exists, it always pre-empts the criterion-based Pivot regardless of relative hinge size (see Section E), so Pivot quality, next-step actionability, intent fidelity and model fidelity all took hits for personas whose real crux was analytical (buy-vs-rent's financial-security math, grad-school's job-market risk, torn-many's growth/partner tie, own-factor's stability question) rather than emotional. Ambiguity dropped hardest of all (−1 or −2 for 7 of 11) because the new engine's sensitivity analysis introduces two brand-new sentence templates (the flip-direction sentence, the "less important" term-clash) that didn't exist in the simpler v1/v2 engine — a more sophisticated model bought new prose to get wrong.

### Counts across all eleven transcripts

- Total Clarity-authored sentences (dialogue prompts + full report, both counted from `transcripts.txt`): **405**
- Total words in those sentences: **3,548**
- Mean words per sentence: **8.8**
- Questions: **88** — Declarative observations: **317** (roughly 1 question for every 3.6 declaratives — more declarative than v2's 1:2.8, consistent with fewer conversational questions and more confirmed-step summaries)
- Lines containing a quoted option label (“…”): **45**
- Taps/answers required per persona (framing 2 + one per option + one pick per criterion + one importance per criterion + eval [pref+confidence per criterion, or rating-per-option+confidence for 3+ options] + up to 3 optional-context answers + 1 Pivot confirmation + 2 closing):

| Persona | Options | Criteria | Total taps/answers |
|---|---|---|---|
| job-change | 2 | 4 | 26 |
| move-home | 2 | 4 | 26 |
| grad-school | 2 | 4 | 26 |
| heavy-hearted-relationship | 2 | 4 | 26 |
| buy-vs-rent | 2 | 4 | 26 |
| start-business (skips context) | 2 | 4 | 23 |
| already-knows (skips context) | 2 | 4 | 23 |
| torn-many-unknowns | 2 | 4 | 26 |
| denver-austin (3 options, skips context) | 3 | 4 | 32 |
| own-factor-relocation | 2 | 4 | 26 |
| heavy-marriage | 2 | 4 | 26 |

Median **26 answers** to go from a blank title field to a full report — noticeably more deliberate friction than v1/v2's seven open-ended questions, by design (every step is a confirmation point).

---

## D. Qualitative (first person, brief)

**job-change — Priya.** Before: circling the same argument for weeks. After: **lighter**. *Clearer:* I know what I need to find out — though it told me to find out whether my current job could give me the excitement, not whether the startup's growth is even real, which is the question I actually walked in with. It felt like building my own decision through the criteria and importance steps, then tipped toward filling in a form at the eval step, where "Career growth: Take the offer at the startup, clearly · Guessing" made my biggest uncertainty sound as flatly formatted as my smallest certainty. Line I'd repeat: "You know what you want. You don't know whether you can get it without leaving." Line that made me wince: "This comes before anything else," twice in five lines. The Pivot confirmation felt like the final say — I could have said no and gotten a different question.

**move-home — Daniel.** Before: guilt-paralyzed. After: **lighter**. *Clearer:* I know what I need to find out. Building my own decision the whole way through — the hope test landed exactly where my guilt actually lives. Repeat line: "Maybe the question isn't whether to move back home. It's whether you can get what you want without moving." Wince line: none. The confirmation question felt like being asked, not graded — genuinely my call whether that's the real question.

**grad-school — Marisol.** Before: torn between purpose and stability. After: **lighter**, but with a residual itch. *Clearer:* I know what I need to find out, in theory — but "find out" here means "ask my current job for real research work," and the report never surfaces that the job-market risk I'm actually most scared of (career growth, guessing) is a bigger and separate uncertainty from the hope question. It tipped toward questionnaire right at the eval step, where "Career growth: Start the PhD · Guessing" got buried under a much more confident-sounding hope test. Repeat line: "Meaning pulls toward 'Start the PhD'. Income pulls toward 'Stay in your job and look for a raise elsewhere'." Wince line: "Ask for it directly. The answer to a real request is information" — I can't "ask" my current job for research work the way I could ask a manager for a raise; that phrase assumes a kind of request my situation doesn't actually support.

**heavy-hearted-relationship — Aisha.** Before: crying on both sides. After: **lighter**. *Clearer:* I understand what I'm actually struggling with. Building my own decision throughout — the numbness/meaning framing is exactly right. Repeat line, no contest: "On everything you named, 'Stay' is stronger." Wince line: "Ask for it directly. The answer to a real request is information" — for a six-year relationship, that's the same glibness the old "just try it" line had, just relocated. The confirmation question felt like the final say, and I appreciated that it didn't pretend to know more than I told it.

**buy-vs-rent — Ken.** Before: anxious, parroting other people's certainty. After: **about the same** — the "behind everyone else" reframe is real, but it isn't the number I actually need. *Clearer:* Sort of — I know I need to ask whether renting can kill the feeling, but I still don't know if we can afford to buy, which was my actual question, and "Financial security: guessing" (the biggest number in my whole model, 0.233 hinge) never got its own moment. This is the one where it tipped hardest toward questionnaire, right at "What are you hoping changes?" — the app decided my emotional read mattered more than my financial one. Repeat line: "Can where you live now actually let you stop feeling like we're behind everyone else our age?" Wince line: "Ask for it directly" — you can't "ask" a spreadsheet for a feeling.

**start-business — Ola.** Before: guilty for wanting this. After: **about the same** — organized the fear, didn't reduce it. *Clearer:* I know what I need to find out, and "ask two people who joined a year ago" (adapted here to "ask two people who've done this") is genuinely concrete. Building my own decision the whole way. Repeat line: "'Start the business' isn't the uncertainty. Career growth is." Wince line: "If “Start the business” came out only a little better on career growth, “Stay in your job” would come out ahead instead" — I read that twice and still had to think about which direction it meant. The Pivot confirmation felt like being asked, not graded.

**already-knows — Tom.** Before: not conflicted, just scared to say it. After: **lighter**. *Clearer:* I know what I need to do. This is the one persona for whom the whole eight-step structure felt like building my own decision start to finish — there was nothing left to fill in questionnaire-style because I actually knew everything. Repeat line: "Everything you named, you're sure of. What's left is what you prefer, and that's yours to weigh." Wince line: none — the contradiction from before (being told to test whether I'm really settled, right after being told I'm settled) is gone. No Pivot confirmation screen at all for me, since there was no Pivot to confirm — which itself felt honest, not like a missing feature.

**torn-many-unknowns — Jae.** Before: excited and scared, deciding on no information. After: **lighter**, and a little surprised. *Clearer:* I know what I need to find out — but the report's computed lean is toward *staying*, which caught me off guard, since I walked in feeling like I was leaning toward taking it. Sitting with it, that's probably right: I rated the relationship and stability higher than I usually admit out loud. It tipped toward questionnaire at the "how much does each matter" step, where ranking four things in the abstract felt disconnected from the actual pull I feel day to day. Repeat line: "Partner pulls toward 'Stay in your current role'. Career growth pulls toward 'Take the assignment'." Wince line: "You're not sure the only way to get it is to take the assignment" — the hope test picked "prove myself" as the frame, but career growth and my relationship are genuinely tied in my head (and, it turns out, nearly tied in the numbers), and only one of them got asked about.

**denver-austin — Sam.** Before: flip-flopping between two unfamiliar futures, half-forgetting Chicago was even an option. After: **lighter**, mostly because it took Chicago off the table for me without me having to argue myself out of it — the math shows staying loses on three of four things I said matter, even though it wins clean on friends. *Clearer:* I know what I need to find out. Felt like building my own decision the whole way, including the criteria and rating screens, which worked better here than a stay/leave pref slider would have. Repeat line: "'Move to Austin' isn't the uncertainty. Career growth is." Wince line: "If 'Move to Austin' came out better on career growth, 'Move to Austin' would come out ahead instead" — a little dizzying to read, since it names Austin twice for two different roles in the same sentence. Confirmation question felt like being asked, not graded.

**own-factor-relocation — Priyanka.** Before: torn between ambition and my kids' stability. After: **lighter**, mostly. It correctly separated "career growth: known, favors the move" from "my kids' school: known, favors staying" — cleanly written this time, no broken grammar. *Clearer:* I understand what I'm actually struggling with, though the report never gets around to asking about stability (the one thing I'm genuinely unsure of) because the hope test — whether I can prove myself without sacrificing my kids — got asked first and I said "unsure," which settled the question before stability ever came up. It tipped toward questionnaire at the criteria step, where "My kids' school" sat in a list next to "Income" as if they were the same kind of thing. Repeat line, no contest: "Career growth pulls toward 'Take the relocation'. My kids' school pulls toward 'Stay where we are'." Wince line: none this time, which is new — the "more X against more my kids' school" grammar break is gone. Confirmation question: final say, and I used it.

**heavy-marriage — Linh.** Before: I'd already built the case against him in my head. After: **lighter**, and unsettled in a good way — it named the thing I actually hadn't tested. *Clearer:* I understand what I'm actually struggling with. Building my own decision throughout, right up until the last screen. Repeat line: "You know what you want. You don't know whether you can get it without leaving." Wince line: "Ask for it directly. The answer to a real request is information" — nineteen years in, "ask for it directly" undersells what that conversation would actually cost me; it's the same glibness Aisha hit, and it lands harder here because the stakes are higher. The confirmation question felt like the final say, not a grade — though I noticed the report never got to ask about my husband specifically (Partner, hinge 0.017) the way it would have if the hope test hadn't come first.

---

## E. Engine findings

**1. The hope candidate always pre-empts the criterion candidate, regardless of relative hinge size — this is the single biggest driver of the v2→v3 deltas in Section C.** `pivot()` in `js/engine.js` checks `hopeCandidate(s)` first and returns it unconditionally whenever it exists and isn't ruled out; the criterion-based `byHinge` ranking is only consulted if there's no hope, or after the hope is explicitly ruled out. This is deliberate (the README calls the hope test out as taking priority when "they'd stay if they got what they want"), but it means hinge size never gets compared between the two kinds of candidate. The clearest case: **buy-vs-rent (Ken)** — Financial security has hinge **0.2333**, the single largest hinge across all eleven models, more than 17× the next-largest thing anyone in this set is unsure about — yet Ken's report never mentions it, because his hope ("stop feeling like we're behind everyone else") pre-empts it entirely. His own worry text — *"That we buy at the wrong time and end up house-poor"* — is a financial-security worry, not a keeping-up-with-the-Joneses one, and the report never gets there. Similar, smaller-margin versions of the same effect: **job-change** (Career growth hinge 0.1473 buried), **grad-school** (Career growth hinge 0.1167 buried, matching Marisol's own stated worry about the academic job market), **torn-many** (Career growth and Partner tied at hinge 0.1071 each, both buried behind "prove to myself"), **own-factor-relocation** (Stability hinge 0.1071 buried).

**2. A near-exact hinge tie, order-dependent.** In **torn-many-unknowns**, Career growth (importance 5, confidence 0.25) and Partner (importance 4, confidence 0.5) land on identical hinge values — 0.1071 each — to four decimal places:
```
{"name":"Career growth", ..., "hinge":0.1071}
{"name":"Partner", ..., "hinge":0.1071}
```
`byHinge` is a plain `.sort()`, which is stable in modern JS engines, so Career growth wins the tie only because it was declared first in `s.criteria`. Nothing in the model or the report discloses that this was a coin flip decided by list order rather than by any property of the decision. It never surfaces in Jae's report because the hope candidate pre-empts both anyway, but the moment a future persona has no hope note and this exact tie, the choice of "the" Pivot will be arbitrary and silent.

**3. Chicago is correctly, silently dominated.** In **denver-austin**, Stay in Chicago wins Friends outright (0.9 utility vs Denver's 0.3 and Austin's 0.1, the widest margin of any option-criterion pair in the whole dataset) but never becomes the leader or the runner-up (computed EU: Denver 0.600, Austin 0.5625, Chicago 0.4125) because it's weak on the other three criteria, including the two most heavily weighted ones. This is the model working correctly — a real three-way choice degenerating to an effective two-way Pivot is a legitimate outcome, not a bug — but the report never tells Sam that Chicago fell out of contention or why; "Stay in Chicago" simply stops appearing after the opening options line. A person who most values Friends could read the report and wonder why their strongest-scoring option isn't even in "the tension."

**4. A known, highly-ranked custom factor structurally can never be the Pivot — same finding as v2, confirmed unchanged.** In **own-factor-relocation**, "My kids' school" is ranked #2 by importance and answered with full confidence (`"conf": 5`), so by the engine's own rule (only genuine unknowns can be a Pivot) it is correctly excluded — `"flippable": false, "hinge": 0` in the model. This is by design, not a defect, but it means the one thing Priyanka named herself, in her own words, outside the fixed list, can never be the sentence the report ends on. The Pivot instead has to come from Stability (hinge 0.1071) or the hope test — and here the hope test wins, so even Stability never gets asked about either (see finding 1).

**5. "You already know enough" and the no-hope path both fire correctly for the cases that should trigger them.** Tom's `pivot.kind` is `"none"` with `"all_known": true` — every one of his four confidences is 0.98, and the verdict text matches exactly. No case in this set reaches the `"robust"` kind (real uncertainty exists, but none of it is decisive), so it remains untested by personas, though the source text (Section A) reads correctly on inspection.

**6. Preference and confidence stay cleanly separated everywhere.** No transcript conflates "how much better" with "how sure" in its prose — the model's `pref` and `conf` fields are stored and rendered independently in every case, and the report's "What appears clear" / "What you're less certain about" split tracks `conf >= 0.7` vs `conf < 0.7` consistently against what each persona actually answered (e.g., Jae's Partner and Meaning, both answered "Somewhat sure," land correctly in "less certain," not "clear," even though a "somewhat sure" answer is more confident than a guess).

---

## F. Summary

**What 2.0 fixed, versus v2 (quotes from v2 beside quotes from this pass, same personas):**

- The want/do ambiguity in the central test question. v2: *"If your current job gave you what you want, would you still take the new job at the startup?"* → v3: *"If your current job gave you what you want, would you still **want to** take the offer at the startup?"* (job-change) — the fix v2 recommended first, landed exactly as proposed, everywhere it's used.
- The dangling "this" in the unsure-branch reframe. v2: *"You're not sure this is the only way to get it."* → v3: *"You're not sure **the only way to get it is to leave**."* (heavy-hearted-relationship) — the action is now named explicitly rather than left to a pronoun.
- The two-sided hope-grantor grammar break. v2: *"If “Take the offer in Austin” gave you what you want, would you still take the offer in Denver?"* → v3: for a genuinely two-sided decision with no status quo (denver-austin), the hope test doesn't fire at all — `statusQuo(s)` returns null, so `hopeCandidate` short-circuits before it can produce the broken sentence. This sidesteps the grammar bug rather than repairing it (see below).
- The broken tradeoff grammar for a noun-phrase custom factor. v2: *"More career growth against more my kids' school. That's the exchange."* → v3: *"Career growth pulls toward “Take the relocation”. My kids' school pulls toward “Stay where we are”."* — grammatical regardless of the factor's part of speech, exactly the fix v2 proposed.
- Tom's "you already know enough, but here's a test to see if you're really settled" contradiction. v2 flagged this as unaddressed through two passes; v3's `settled` block for the `"none"` kind ends cleanly at *"What's left is what you prefer, and that's yours to weigh"* with no trailing test.

**What it lost, or never regained (be honest about the earlier version's strengths):**

- The earlier conversational engine's heavy-tone branch — the thing that turned "the only way to know is to try" into "The only way to know is to live it. That's a bigger ask than it sounds. Worth saying out loud to someone before you do" for Aisha in v2 — has no equivalent in the new hope-kind report. Every hope-kind Pivot, regardless of whether the decision is a job offer or a nineteen-year marriage, gets the same generic *"Ask for it directly. The answer to a real request is information."* This is a real regression in tone-matching for exactly the two heaviest personas in the set (heavy-hearted-relationship, heavy-marriage), both of whose wince lines in Section D name this same sentence.
- The old engine had a `findOut` field the person answered directly, which meant every persona's next-step text was actually about *their* situation. The new engine's `how` library (`js/content.js`) is keyed to the *criterion*, not the decision domain — so "ask two people who joined a year ago" (perfect for start-business and torn-many, both job-shaped) is the same text a person deciding about a relationship or a house would never get, because the hope test pre-empts the criterion-based `how` text for 8 of 11 personas here. The specificity the fixed criterion library promises rarely reaches the personas who'd benefit most.
- The rebuild trades one class of bug (grammar breaks) for a new class (sensitivity-analysis prose that's mathematically correct but easy to misread — see Section A's "only a little better" and "less important" findings). A more capable engine bought new ways to be unclear, not fewer.

**Top five ambiguities, ranked by reach:**

1. The hope-vs-hinge pre-emption (Section E, finding 1) — not a wording ambiguity but a structural one, and the widest-reaching: it silently changes what "the Pivot" means for 8 of 11 personas, always in the same direction (emotional test over analytical uncertainty), regardless of which one the person's own worry text points to.
2. The sensitivity-flip sentence's unsignalled direction reversal ("came out only a little better" / "came out better," meaning opposite things depending on whether the criterion favours the leader or the runner-up) — present in both criterion-kind transcripts, structurally guaranteed in every future one.
3. The "Less important: X" term-clash with the importance scale's own "Important" — same reach as #2.
4. The doubled "comes before anything else" / "This comes before anything else" — present in all 8 hope-kind transcripts.
5. The importance and confidence word-scale compression (the underused "Somewhat"/"Not much," the close-reading synonymy of "Fairly sure"/"Very sure") — present in every session, though it affects data quality more than report comprehension.

**Three line replacements, most confident first:**

1. The sensitivity-flip sentence: replace the comparative ("came out only a little better" / "came out better") with an explicit magnitude claim that doesn't rely on the reader inferring direction: `` `That depends on ${criterion} turning out to favor ${leader} as much as you're guessing. If it favors ${leader} only a little, ${runner} would be the lean instead.` ``
2. "Less important: X" → `` `${X} could matter too, but it wouldn't move this as much.` `` — removes the collision with the importance scale's own vocabulary.
3. "Right now “X” comes out ahead on what you've said" → `` `On what you've told me, “X” is the current lean.` `` — replaces a race-finish-line metaphor with an explicitly provisional one, in the one sentence of the whole report closest to reading as a verdict.

**Is the experience now Meaningful, Different and Salient — and does it feel like a perceptive instrument, a questionnaire, or a calculator?** Meaningful and Different, clearly: no persona in this set could have gotten "Career growth pulls toward X, Financial security pulls toward Y — that's the tension, and here's the one hinge that would move it" from a friend, a search engine, or a plain pros-and-cons list, and the discipline of keeping preference and confidence apart (Section E, finding 6) is intact and still the app's sharpest idea. It reads as a genuine decision-theory instrument, not a chat transcript pretending to reason — which is a real gain over the conversational version's occasional therapist cadence. But it is not yet uniformly a *perceptive* instrument: for roughly a third of this set (buy-vs-rent, grad-school, own-factor-relocation, torn-many) the structured steps produced a mathematically defensible Pivot that is not the thing the person would say their decision turns on, because the hope mechanism's fixed priority overrides the hinge ranking every time both exist — the engine is choosing the *kind* of Pivot before it looks at the numbers, and only asks "how big is this uncertainty" after that choice is already made. Several personas (Marisol, Ken, Priyanka in Section D) describe the experience tipping from "building my own decision" toward "filling in a questionnaire" at exactly the moment their real uncertainty went unasked-about. The eight-step structure itself never felt like a form for its own sake — even Tom, who had nothing left to discover, described it as complete rather than padded — so the risk the spec named (structured steps feeling like a questionnaire) shows up not from the steps, but from the one place the engine still decides something on the person's behalf before asking them: which kind of question to lead with.
