# Clarity

**See what your decision depends on.**
When you're stuck, Clarity separates what you know from what you're assuming, finds what's uncertain, and identifies the one thing that could change your mind.

Clarity doesn't tell you what to do. It shows you what you're actually deciding: what you know, what you're assuming, what could happen, how much each outcome matters to you, what the answer is sensitive to, and the one thing you could learn that would most improve your decision.

Live: https://clarity-production-957b.up.railway.app (once deployed; see below)

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
| **Type** | One family: Instrument Sans, a humanist sans. Display at weight 500 with tight tracking; body at 400. Editorial, modern, calm. No serif, no second typeface. (Markkula: impute. One voice reads as one mind.) |
| **Materials & light** | Paper grain over the whole page, soft top-left daylight, long soft shadows, frosted-glass inputs. Nothing hard-edged. |
| **Motion** | Messy → organised. Blurred → focused. Many → few. Long easings (`cubic-bezier(.22,.72,.18,1)`, 700–1100 ms). The dot field in the hero and the "Noise" section literally resolves from scatter into one line and one gold point as you scroll. Reduced-motion is respected everywhere. |
| **Rule** | Sophisticated engine. Simple experience. One question, one insight, one thing to consider next. |

## The site

Follows the cognitive journey in `BRAND.md`: recognition (*What's on your mind?*), reassurance (*It won't tell you what to do*), one demonstrated question, the CTA. Below that, for the curious: a big question becoming a small one, how Clarity thinks in four lines, and the report as the payoff. About 400 words.

## The app (`app.html`)

The person builds the decision model in constrained steps; decision theory does the intelligence; free text is optional context. Every step is a confirmation point. Answers persist locally.

1. **Framing.** "I'm deciding whether to…" plus a pattern (stay or leave, buy or rent, move or stay, start now or wait, take it or turn it down, commit or hold off, A or B, something else).
2. **Options.** Two or more, editable, add another.
3. **What could matter.** A library grouped by money, work, life, people, risk and self, plus custom. Pick everything; don't rank yet.
4. **How much.** Not much · Somewhat · Important · Very important · Critical (stored 1–5).
5. **Each option.** Which is better on each criterion (a five-point comparison for two options, a five-point rating per option for three or more) and how sure you are (Guessing · Somewhat sure · Fairly sure · Very sure · I know this, stored as belief strengths 0.25 to 0.98). Preference and belief are kept apart.
6. **Context, optional.** What you hope changes; if a status quo option exists, the test "if it gave you what you want, would you still want to…?"; what you're most worried about. Kept in the person's words.
7. **The Pivot, confirmed.** "If you knew the answer to this, could it change your decision?" A "no" rules it out and the next candidate is offered.
8. **What this depends on.** What matters most · what you're really asking · what appears clear · what you're less certain about · the tension · the Pivot (or "you already know enough") · what could change your mind · what might be worth learning. Then "Does this feel right?" with a way to add a factor, an option or an assumption without starting over.

### The engine (`js/engine.js`)

Deterministic multi-attribute analysis. Never shows a score, never recommends.

- `utilities`: each option's read on each criterion mapped into [0.1, 0.9].
- `analyze`: weights from importance; expected utility per option; leader and runner-up; for each criterion the swing needed to reorder them (sensitivity), the person's uncertainty (1 − belief strength) and the weight, multiplied into a **hinge score**.
- `pivot`: the highest hinge the person hasn't ruled out, or the hope test when they'd stay if they got what they want. "None" when everything is known; "robust" when no single uncertainty can reorder the options. The ranked remainder is the value-of-information list ("less important: …").
- `report`: the synthesis, in the Clarity voice.
- `model`: the structured intermediate representation the test harness inspects.

## Testing the engine

`qa/` is a unit-test suite for decisions: gold scenarios, anti-Pivot cases and mutation tests that run the real engine in headless Chrome. `sh qa/run.sh` with the local server running. The rubric and the principle under test (unknown ≠ Pivot) are in `qa/EVALUATION.md`.

## Stack

Static HTML, CSS and vanilla JS. No build step, no framework, no bundler. One font from Google Fonts. Everything else inline. Brand strategy in `BRAND.md`.

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

**Railway.** New project → Deploy from GitHub repo → pick `clarity`. `railway.json` tells Nixpacks to run `npx serve -s . -l $PORT`; `serve.json` adds clean URLs (`/app` works) and cache headers. Generate a domain under Settings → Networking. Every push to `main` redeploys. If the generated domain differs from `clarity-production-957b.up.railway.app`, update the canonical/OG URLs in `index.html`, `robots.txt` and `sitemap.xml`.

## Accessibility & performance

Semantic landmarks, skip link, visible focus rings, `aria-pressed` on every toggle, `aria-live` stage, labelled sliders, `prefers-reduced-motion` and `prefers-color-scheme` honoured, keyboard-complete. Canvases pause when off-screen. No JS on the critical render path (all scripts `defer`). Total JS ≈ 40 KB unminified.
