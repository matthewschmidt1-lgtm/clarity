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

## The model under test (v3)

Sessions now carry `title`, `options`, `criteria` (`[id, label, importance]`), `evals` (`{pref: -2..2, conf: 1..5}` for two options; `{ratings: {label: 1..5}, conf}` for more), optional `notes` (`hope`, `stillWant`, `worry`) and `ruledOut`. The engine computes weights, expected utility, sensitivity (the swing needed to reorder the top two), uncertainty and a hinge score; the Pivot is the top hinge the person hasn't ruled out. Invariants added: the rendered report contains no digits or percent signs; the word Pivot never appears when the verdict is "none" or "robust". Persona evaluations v1 and v2 were run against the earlier seven-question engine and are kept for history.

## The principle under test

**Unknown ≠ Pivot.** A person can have ten unknowns and one Pivot. The Pivot is the uncertainty that would change the choice: the assumption or unknown the person themselves said would flip their lean, ranked by how much they said it matters. When they are torn, it is the most important uncertainty. When they would stay if their current situation gave them what they want, it is that, not a factor. When nothing is uncertain, there is no Pivot, and the engine must say so.

## The invariants

The engine must not: invent a factor; treat an unexpressed motive as fact; manufacture an unknown; claim completeness; imply the Pivot is necessarily the real-world crux. Every report is prefaced *based on what you've told me*, and every report ends with *One thing to check*, which lets the person add what's missing and rerun. The `fidelity`, `no-pivot` and `boundary` checks enforce the first four; the fifth is wording, and the check for hedged verbs guards it.

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

## Persona tests (a model in the loop)

`qa/personas/` holds the first agent-run evaluation. A Sonnet agent answered the seven questions as eight people (`sessions.json`), `sh qa/replay.sh` replayed them through the real engine (`transcripts.txt`), and the agent then judged each report in the person's own voice on the Meaningful / Different / Salient questions plus a skeptical read (`evaluation.md`). Its four engine findings (the "give you to …" grammar, first-person labels leaking, the hope Pivot firing on fully-known facts, and "unsure" never producing a hope Pivot) are fixed and now covered by scenarios in `scenarios.json`. Re-run the protocol after any change to the questions or the report copy. The second run (`evaluation-v2.md`, same eight people plus three harder cases, with a line-by-line ambiguity audit) found the want/do ambiguity in the test question, the two-sided and custom-factor template breaks, and the contradiction after "you already know enough"; all fixed and covered by scenarios.

## What needs a model, and isn't built yet

Three agent evaluators belong on top of this once an API key is in play. Their prompts, in one line each:

- **Skeptical user.** *You are the person who gave these answers. Read the report. What feels wrong, overstated, obvious, or not what you said?*
- **Independent Pivot.** *Given only the answers, what does this decision actually depend on?* Compare semantically with the engine's Pivot.
- **Red team.** *Find the strongest argument that this Pivot is wrong.*

Each should score 0–2 on the dimensions above and name a failure category: `PIVOT_WRONG`, `INTENT_MISREAD`, `FACT_MISCLASSIFIED`, `UNNECESSARY_PIVOT`, `ACTION_NOT_USEFUL`, `OVERCONFIDENT`, `USER_DISAGREEMENT`. Their value is in disagreement with the engine, not agreement. A human gold set of 100 to 200 scenarios should be built before their scores are trusted.
