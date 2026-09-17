# Clarity

**See what you already know.**
A clearer way to think through life's important decisions.

Clarity doesn't tell you what to do. It shows you what you're actually deciding: what you know, what you're assuming, what could happen, how much each outcome matters to you, what the answer is sensitive to, and the one thing you could learn that would most improve your decision.

Live: https://clarity-production.up.railway.app (once deployed; see below)

---

## The mark

A five-leaf clover. One leaf lets go, drifts to the ground and turns gold. The four that remain settle into true symmetry: a four-leaf clover. Clarity isn't adding information. It's letting one thing fall so the rest resolves. The lucky one was there all along.

The animation lives in `js/clover.js` (`Clover.mount(el).play()`), plays once on first load, on the hero mark, and as the interstitial before the report.

## Creative direction

| | |
|---|---|
| **Concept** | *The fifth leaf.* Clarity emerges from complexity by subtraction, not addition. |
| **Enemy** | Noise. Too many opinions, one loud fear, false certainty, going in circles. |
| **Personality** | Calm intelligence. Curious, precise, human, respectful. Never a cheerleader, guru or consultant. |
| **Signature behaviour** | Asks before it advises. |
| **Signature output** | The Pivot: the one variable the decision turns on. |
| **Palette** | Paper `#F3EFE6`, ink `#16201B`, fog `#7C857E`, moss `#1E6B47`, one gold `#C9A24C` reserved for the fallen leaf, the Pivot and "assumed". Dark theme inverts paper/ink and lifts moss. No purple gradients. |
| **Type** | Fraunces (variable, optical size 144, weight 300) for display: editorial, soft, slightly old. Inter for everything else. |
| **Materials & light** | Paper grain over the whole page, soft top-left daylight, long soft shadows, frosted-glass inputs. Nothing hard-edged. |
| **Motion** | Messy → organised. Blurred → focused. Many → few. Long easings (`cubic-bezier(.22,.72,.18,1)`, 700–1100 ms). The dot field in the hero and the "Noise" section literally resolves from scatter into one line and one gold point as you scroll. Reduced-motion is respected everywhere. |
| **Rule** | Sophisticated engine. Simple experience. One question, one insight, one thing to consider next. |

## The experience, first second to final CTA

| # | Section | Job | Interaction |
|---|---|---|---|
| 0 | Loader | The mark plays once (≈3 s), wordmark fades in, page reveals. Skipped on repeat visits and under reduced-motion. | |
| 1 | Hero | *See what you already know.* One input: "What's on your mind?" Five example chips. Dot field drifts. | Typing or a chip goes straight into the app with the question prefilled. Scrolling resolves the dots. |
| 2 | Noise | *The world gives you more information. Clarity helps you make sense of it.* | The scattered field resolves into one line with one gold point as the section reaches centre. |
| 3 | Ask before advise | Side-by-side dialogue: typical AI vs Clarity's "Maybe. But first: what are you hoping changes?" | Staggered reveal. |
| 4 | Know. Weigh. See. | The method in three pillars; the left column is sticky while the pillars scroll. | |
| 5 | The Clarity Lens | The vocabulary: Known, Assumed, Unknown, Tradeoff, Threshold, Next Question, and the Pivot card with rotating examples. | Hover lifts cards. |
| 6 | The Report | A sample Clarity Report rendered like a printed document. The payoff. | |
| 7 | Principles | Seven "Never" rules. Restraint as brand. | |
| 8 | Calibration | It learns how *you* reason about your own future. | |
| 9 | Final CTA | *What's on your mind?* on ink. Same input. | |

## The app (`app.html`)

Ten quiet questions, one at a time, then the report. Answers persist in `localStorage` so a person can leave and come back.

1. **Deciding** — the question, two options (inferred from the question, editable). Emotional intensity changes the tone of the copy, never the engine.
2. **Hoping** — what are you hoping changes? Then: *if the other option gave you that tomorrow, would you still want to?* The "Oh" moment.
3. **Knowing** — every item sorted as Fact / Belief / Unknown and tagged by which option it favours. First-pass classification is automatic from phrasing; the person corrects it.
4. **Weighing** — three to five values, each weighted 1–5.
5. **Comparing** — how well each option delivers each value, 1–5.
6. **Horizons** — each option at six months and at five years.
7. **Risk** — reversibility of each option, regret asymmetry (acting and failing vs not acting and wishing), the Threshold, the fear.
8. **Waiting** — "don't decide yet" as a real option: what it costs, what it teaches.
9. **Predicting** — the person's own probability *before* any calculation, and which unknown would most change their mind.
10. **Stress test** — the engine works out the lean and generates "for the other option to be right, what would need to be true"; the person marks what's plausible.
11. **Clarity Report** — see below.

### The engine (`js/engine.js`)

Deterministic. No language model decides a number.

- `valueScores` — weighted comparison; lean ∈ [−1, 1].
- `sensitivity` — which single factor could flip the lean, and how little it would take.
- `epistemics` — facts vs beliefs vs unknowns; whether the lean rests on beliefs.
- `horizons` — detects short-term vs long-term conflict.
- `risk` — reversibility, regret asymmetry, the value of waiting.
- `modelRange` — maps the lean to a defensible probability range, widened by unknowns, beliefs and plausible counter-conditions, then compares with the person's own estimate.
- `clarity` — grades the quality of the *process* (High/Medium/Low), never the option.
- `report` — composes the Pivot, the Tradeoff, the Next Question and the closing "Your thinking" sentence.

An LLM layer can sit on top later for natural-language extraction, follow-up questions and counterarguments; the numbers stay here.

## Stack

Static HTML, CSS and vanilla JS. No build step, no framework, no bundler. Fonts from Google Fonts. Everything else inline.

```
index.html          marketing site
app.html            the conversation + report
css/site.css        design system + site
css/app.css         app
js/clover.js        the mark
js/site.js          loader, dot field, reveals, theme
js/content.js       all copy, values list, tone + option inference
js/engine.js        decision engine (pure)
js/app.js           the conversation UI
assets/             favicon, icons
og-image.png        social card (rendered from og-image-source.html with headless Chrome)
```

## Run locally

```bash
python3 -m http.server 8960
```

Then open http://127.0.0.1:8960.

## Deploy

**GitHub.** Create an empty repository named `clarity` (no README), then:

```bash
git remote add origin git@github.com:matthewschmidt1-lgtm/clarity.git
git push -u origin main
```

**Railway.** New project → Deploy from GitHub repo → pick `clarity`. `railway.json` tells Nixpacks to run `npx serve -s . -l $PORT`; `serve.json` adds clean URLs (`/app` works) and cache headers. Generate a domain under Settings → Networking. Every push to `main` redeploys. If the generated domain differs from `clarity-production.up.railway.app`, update the canonical/OG URLs in `index.html`, `robots.txt` and `sitemap.xml`.

## Accessibility & performance

Semantic landmarks, skip link, visible focus rings, `aria-pressed` on every toggle, `aria-live` stage, labelled sliders, `prefers-reduced-motion` and `prefers-color-scheme` honoured, keyboard-complete. Canvases pause when off-screen. No JS on the critical render path (all scripts `defer`). Total JS ≈ 40 KB unminified.
