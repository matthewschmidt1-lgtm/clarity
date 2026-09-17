# Evaluating the Clarity engine

The engine is deterministic, so most of what matters can be tested without a model in the loop. This folder is a unit-test suite for decisions.

## Run it

```bash
python3 -m http.server 8960        # from the Clarity folder, in one terminal
sh qa/run.sh                       # in another
```

`run.html` loads the real `content.js` and `engine.js`, runs every scenario and mutation in `scenarios.json`, and prints a scorecard. Exit code 2 means something failed.

## What "good Clarity" means

| Dimension | Question | Tested by |
|---|---|---|
| Decision fidelity | Did it understand what the person is deciding? | `options` expectation |
| Intent fidelity | Did it find what they actually want? | `reframe` expectation |
| Known / assumed / unknown | Did it keep facts, assumptions and unknowns apart? | classification counts |
| Pivot quality | Could this uncertainty actually change the choice? | `pivot_kind`, `pivot_factor`, mutations |
| No false Pivot | Does it refuse to invent one when nothing is uncertain? | `no-pivot` check on every scenario |
| Chain | Does the next action resolve the Pivot? | `chain` check |
| Agency | Does it avoid telling the person what to choose? | `agency` regex on the whole report |
| Fidelity | Does it only mention factors the person named? | `fidelity` check |
| Sensitivity | If one important answer changes, does the right thing change? | `mutations` |

Scores are pass/fail per check, not a 1–100 number. The failure names are the useful part.

## The principle under test

**Unknown ≠ Pivot.** A person can have ten unknowns and one Pivot. The Pivot is the uncertainty that would change the choice: the assumption or unknown the person themselves said would flip their lean, ranked by how much they said it matters. When they are torn, it is the most important uncertainty. When they would stay if their current situation gave them what they want, it is that, not a factor. When nothing is uncertain, there is no Pivot, and the engine must say so.

## Intermediate representation

`Engine.model(session)` returns the structure an evaluator should inspect instead of the prose:

```json
{ "decision": { "question": "…", "options": ["…", "…"] },
  "desired_outcome": "…", "still_want": "no",
  "factors": [ { "name": "Career growth", "rank": 1, "advantage": "a", "status": "assumed", "would_flip": true } ],
  "lean": "a", "candidate_pivots": [ { "question": "…", "impact": "high" } ],
  "pivot": { "kind": "hope", "question": "…", "factor": null },
  "known": ["…"], "assumed": ["…"], "unknown": ["…"] }
```

Reasoning and writing are already separate: `model` and `pivot` are the reasoning; `report` is the writing.

## Adding a scenario

Copy one in `scenarios.json`. A session needs `question`, `hope`, `stillWant`, `factors` (each with `winner` a / b / unknown, `basis` know / assume, `flips` true / false / null), `lean`, `findOut`, `reversibility`. Put only what you're sure of in `expect`.

A mutation names a base scenario, one `set` of dotted paths, and an expectation: `pivot_changes`, `pivot_same`, `pivot_kind:<kind>` or `pivot_factor:<label>`.

## What needs a model, and isn't built yet

Three agent evaluators belong on top of this once an API key is in play. Their prompts, in one line each:

- **Skeptical user.** *You are the person who gave these answers. Read the report. What feels wrong, overstated, obvious, or not what you said?*
- **Independent Pivot.** *Given only the answers, what does this decision actually depend on?* Compare semantically with the engine's Pivot.
- **Red team.** *Find the strongest argument that this Pivot is wrong.*

Each should score 0–2 on the dimensions above and name a failure category: `PIVOT_WRONG`, `INTENT_MISREAD`, `FACT_MISCLASSIFIED`, `UNNECESSARY_PIVOT`, `ACTION_NOT_USEFUL`, `OVERCONFIDENT`, `USER_DISAGREEMENT`. Their value is in disagreement with the engine, not agreement. A human gold set of 100 to 200 scenarios should be built before their scores are trusted.
