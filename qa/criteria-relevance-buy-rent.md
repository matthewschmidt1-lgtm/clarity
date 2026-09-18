# Criteria-library relevance QA — "Buy or rent"

**Persona:** couple, early 30s, renting a 2BR in a mid-sized US city, first child due in 5 months, combined savings that would just cover a 10% down payment, one partner remote. Typed "buy a house" → pattern "Buy or rent" → options "Buy" / "Keep renting". Now on step 2, "What could matter here?" ("Pick everything that matters. Don't rank yet.").

Mechanics confirmed in code: `js/app.js` step 2 renders every group in `Content.criteria` (`js/content.js`) as tap-toggle chips, plus a free-text "own-…" add box; step 3 then asks the person to rate each *selected* item's importance (1–5). No filtering happens anywhere in the current code — every person sees all 32 items regardless of pattern.

No files under `js/` or `css/` were edited. Nothing was committed.

---

## 1. Every library item, rated for "Buy or rent"

| Group | Item | Rating | Why |
|---|---|---|---|
| Money | Income | RELEVANT | Determines what mortgage/rent they can carry with a baby coming and one remote income. |
| Money | Financial security | RELEVANT | Central: does buying erode their cushion right as a baby arrives? |
| Money | Cost | RELEVANT | The core monthly-payment-vs-rent comparison. |
| Money | Debt | RELEVANT | Existing debt affects mortgage qualification and how thin buying stretches them. |
| Money | Savings | RELEVANT | Their savings *just* covers the down payment — this is literally the constraint they're deciding around. |
| Work | Career growth | IRRELEVANT | Nothing about this decision changes their career trajectory. |
| Work | Learning | IRRELEVANT | No skill/learning dimension to buy-vs-rent. |
| Work | Opportunity | IRRELEVANT | "Opportunity" here means job opportunity; not in play. |
| Work | Reputation | IRRELEVANT | No professional-reputation stake in a housing choice. |
| Work | Autonomy | IRRELEVANT | Job-autonomy framing doesn't map to housing (home-improvement freedom is covered better by "Freedom" below). |
| Work | Manager and team | IRRELEVANT | Explicitly workplace language; jarring to see on a housing screen. |
| Life | Time | PLAUSIBLE | Some would tap it for commute or for maintenance time eating into new-parent time. |
| Life | Flexibility | RELEVANT | Buying trades away the ability to move quickly if the job, family, or city situation changes. |
| Life | Location | RELEVANT | Buying commits them to a neighborhood/commute/schools in a way renting doesn't. |
| Life | Home | RELEVANT | Literally what's being decided — space, feel, whether it's "theirs." |
| Life | Health and energy | PLAUSIBLE | Some would tap it for stress-on-body of moving/renovating with a newborn, or a healthier space to raise a baby in. |
| Life | Stress | PLAUSIBLE | Financial stress of a mortgage vs. the instability stress of renting. |
| People | Family | RELEVANT | The baby is the reason this decision has urgency; space and stability for the family is a driving criterion. |
| People | Partner | PLAUSIBLE | Tapped when the couple isn't aligned and that gap itself is a factor to weigh. |
| People | Friends | PLAUSIBLE | Some would tap it if buying means moving away from their current social network. |
| People | Community | PLAUSIBLE | Buying often means putting down roots in a specific community; some would name that explicitly. |
| People | Culture | IRRELEVANT | This label reads as "company/city culture" fit; doesn't map to a housing decision. |
| Risk | Stability | RELEVANT | Housing stability is one of the two headline stakes of this decision (vs. a landlord's plans). |
| Risk | Uncertainty | RELEVANT | Captures the market-timing worry, rate uncertainty, and whether income holds after the baby. |
| Risk | Reversibility | RELEVANT | The single biggest structural difference between buying and renting — very hard to undo a purchase. |
| Risk | Safety | PLAUSIBLE | Tapped for neighborhood safety with a baby, or as "financial safety" restated. |
| Self | Meaning | PLAUSIBLE | Some feel homeownership is meaningful; others would find this too abstract to bother with. |
| Self | Identity | PLAUSIBLE | "Homeowner" as an identity marker matters to some, not most. |
| Self | Freedom | PLAUSIBLE | Freedom to renovate/paint/have a dog, versus freedom to relocate on short notice — cuts both ways, real for some. |
| Self | Adventure | IRRELEVANT | Buy-vs-rent isn't experienced as an adventure/risk-seeking choice by most people in this situation. |
| Self | Peace of mind | RELEVANT | Which choice lets them sleep — directly ties together the financial and stability worries. |
| Self | Growing as a person | IRRELEVANT | Too abstract/self-development-framed for a logistics-and-money decision; almost nobody reaches for this here. |

---

## 2. What's missing

Real considerations this couple would want to tap, and whether they're already covered:

| Real concern | Covered already? | Verdict |
|---|---|---|
| Monthly payment vs. rent | Yes — "Cost" | Covered under existing label. |
| Being tied to a place / can't easily move | Yes — "Flexibility" + "Reversibility" together | Covered, arguably better split across two existing labels than combined. |
| Market-timing worry / rates might change | Yes — "Uncertainty" | Covered, though generically; a person with a specific rate-anxiety might not recognize it under this word. |
| Commute | Partially — "Location" | Covered loosely; most people would fold commute into "Location" without missing a separate item. |
| **Maintenance and repairs** | No | **Absent.** Renting means a landlord fixes the furnace; buying means they pay for it. Nothing in the library names this. |
| **Equity / building wealth** | No | **Absent.** "Savings" and "Financial security" describe having money, not the wealth-building argument for buying (paying down principal vs. paying a landlord). Distinct enough to need its own label. |
| **Landlord risk** | No | **Absent.** The renting-side risk (rent hikes, lease non-renewal, being forced to move) has no home on the Risk side; "Uncertainty" and "Stability" are too generic to surface it reliably. |
| **Space for the baby** | Partially — "Home" | "Home" is close but generic; a person weighing "do we need a 3rd bedroom" may not connect that to the single word "Home." Worth calling out on its own given this is the reason the decision exists. |
| Schools | No | **Absent.** With a baby 5 months out this is early for most couples, but some future-planners would want it, and nothing today covers it. |
| Interest rates specifically | Weakly — "Uncertainty" | Covered only in the loosest sense; a rate-driven worry is common enough to deserve its own word, but it can ride on "Uncertainty" without real loss. |

Genuinely absent → proposed additions:

| Proposed label (≤3 words) | Group |
|---|---|
| Maintenance costs | Money |
| Building equity | Money |
| Landlord risk | Risk |
| Space for baby | Life |
| Schools | Life |

---

## 3. Count and the screen's feel

Out of 32 items: **9 are IRRELEVANT** for "Buy or rent" (all 6 Work items, plus Culture, Adventure, Growing as a person). **0 are MISLEADING** — nothing actively distorts the model, the failure mode here is dead weight, not bad framing. That's **9/32 ≈ 28%**, just under a third on its own — but another **10 items are only PLAUSIBLE** (Time, Health, Stress, Partner, Friends, Community, Safety, Meaning, Identity, Freedom), meaning a full **19 of 32 (about 60%)** require the person to stop and decide "does this apply to me" rather than recognizing it as obviously theirs. Only 13 items (41%) are cleanly RELEVANT on sight.

For this specific couple — tired, anxious, five months out from a baby — a whole labeled group ("Work," six items) that plainly doesn't apply to a housing decision reads as **noise, not a library**. A library implies curation toward what's actually there to find; seeing "Manager and team" and "Career growth" on a screen about buying a house signals the tool didn't tailor itself to what they told it two screens ago (they picked "Buy or rent" — the pattern already encodes the domain). The cost isn't just wasted taps; it's a small but real trust hit ("does this thing actually know what I'm deciding?") at a moment when the person is already carrying decision fatigue.

---

## 4. Same exercise for two other patterns (quick pass)

**"Stay or leave" — a job**

| Item | Rating |
|---|---|
| Income | RELEVANT |
| Financial security | RELEVANT |
| Cost | PLAUSIBLE |
| Debt | PLAUSIBLE |
| Savings | PLAUSIBLE |
| Career growth | RELEVANT |
| Learning | RELEVANT |
| Opportunity | RELEVANT |
| Reputation | RELEVANT |
| Autonomy | RELEVANT |
| Manager and team | RELEVANT |
| Time | RELEVANT |
| Flexibility | PLAUSIBLE |
| Location | PLAUSIBLE |
| Home | IRRELEVANT |
| Health and energy | RELEVANT |
| Stress | RELEVANT |
| Family | PLAUSIBLE |
| Partner | PLAUSIBLE |
| Friends | PLAUSIBLE |
| Community | IRRELEVANT |
| Culture | RELEVANT |
| Stability | RELEVANT |
| Uncertainty | RELEVANT |
| Reversibility | PLAUSIBLE |
| Safety | PLAUSIBLE |
| Meaning | RELEVANT |
| Identity | PLAUSIBLE |
| Freedom | PLAUSIBLE |
| Adventure | PLAUSIBLE |
| Peace of mind | RELEVANT |
| Growing as a person | RELEVANT |

IRRELEVANT count: 2 (Home, Community) — a much cleaner fit than buy-rent, because the Work group (6 items, a fifth of the whole library) is written for exactly this pattern.

**"Stay or leave" — a relationship**

| Item | Rating |
|---|---|
| Income | PLAUSIBLE |
| Financial security | PLAUSIBLE |
| Cost | IRRELEVANT |
| Debt | PLAUSIBLE |
| Savings | PLAUSIBLE |
| Career growth | IRRELEVANT |
| Learning | IRRELEVANT |
| Opportunity | IRRELEVANT |
| Reputation | IRRELEVANT |
| Autonomy | PLAUSIBLE |
| Manager and team | IRRELEVANT |
| Time | PLAUSIBLE |
| Flexibility | PLAUSIBLE |
| Location | PLAUSIBLE |
| Home | PLAUSIBLE |
| Health and energy | RELEVANT |
| Stress | RELEVANT |
| Family | RELEVANT |
| Partner | RELEVANT |
| Friends | RELEVANT |
| Community | PLAUSIBLE |
| Culture | IRRELEVANT |
| Stability | RELEVANT |
| Uncertainty | RELEVANT |
| Reversibility | RELEVANT |
| Safety | RELEVANT |
| Meaning | RELEVANT |
| Identity | RELEVANT |
| Freedom | RELEVANT |
| Adventure | PLAUSIBLE |
| Peace of mind | RELEVANT |
| Growing as a person | RELEVANT |

IRRELEVANT count: 7 (Cost, Career growth, Learning, Opportunity, Reputation, Manager and team, Culture) — nearly the entire Work group again, for the opposite reason: none of it applies to a relationship decision.

**Cross-pattern comparison**

- **Irrelevant in all three patterns tested: none.** Every item that's dead weight for buy-rent (the Work group, Culture, Adventure, Growing) turns out to be exactly the relevant core of the job pattern. Irrelevance is domain-specific, not a property of any one label being generically bad — which is itself the strongest argument for filtering by pattern rather than trimming the master library.
- **Relevant in only one of the three:** "Manager and team" (job only), "Culture" (job only), "Career growth"/"Learning"/"Opportunity"/"Reputation" (job only), "Home" (housing only — the one item that's cleanly relevant for buy-rent and cleanly irrelevant for the other two).

---

## 5. Recommendation

**(a) Filter by pattern, with "Show everything" underneath — don't ship one undifferentiated library.**

From what this person experiences: they already told the app the shape of their decision by picking "Buy or rent" on the previous screen. Re-showing them six Work-labeled items and three Self-labeled abstractions that plainly don't apply doesn't feel neutral — it reads as the tool not having listened, and it adds a real tax (skimming ~19 of 32 items just to find the ~13 that are obviously theirs) at a moment they're already stretched thin. Part 4 shows this isn't a case for deleting anything — "Manager and team" is dead weight here but the backbone of the job pattern — so a universal trim would just break a different pattern. Filtering per-pattern is the only approach that removes noise for everyone without ever deleting a label outright.

The risk of hiding a criterion that would have mattered is real (e.g., "Freedom" or "Meaning" is PLAUSIBLE, not IRRELEVANT, for a house purchase, and someone should be able to reach it), which is exactly why "Show everything" needs to sit directly underneath the curated set, one tap away, rather than being buried in a menu — it should read as an expansion, not an escape hatch, so nobody feels the tool decided for them what could matter.

**(b) Proposed default subset for "Buy or rent"** (existing labels plus the 3 new ones proposed in §2 that fit within 14 — Schools and Interest rates left out of the default 14 as lower-frequency, still reachable via "Show everything"):

1. Cost
2. Financial security
3. Savings
4. Debt
5. Home
6. Space for baby *(new)*
7. Location
8. Flexibility
9. Reversibility
10. Building equity *(new)*
11. Maintenance costs *(new)*
12. Landlord risk *(new)*
13. Uncertainty
14. Peace of mind
