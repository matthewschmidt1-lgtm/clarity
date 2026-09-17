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

Seven questions, one screen each, then the report. Each question narrows the problem. Answers persist locally.

1. **What's on your mind?** The question and the two ways, inferred and editable.
2. **What's making this hard?** In their own words.
3. **What are you hoping changes?** Then: *if the other way gave you exactly that tomorrow, would you still want to?*
4. **What does this come down to?** Up to four factors, most important first.
5. **Which is stronger on each?** This option, that option, or *don't know*. Don't-knows become unknowns.
6. **Do you know that, or are you assuming it?** Sorts every claim into known or assumed. Skipped if there's nothing to sort.
7. **Which way are you leaning?** Then, for each uncertain factor: *if you were wrong about this, would you still lean that way?* The first "no" is the Pivot.
8. **Could you find that out before deciding? How hard would it be to undo?**
9. **The report.** Your decision · what you're really asking · the Pivot · known / assumed / unknown · the tradeoff · what to find out next · *Now you know what you're deciding.*

### The engine (`js/engine.js`)

Deterministic and small. `structure` sorts factors into known / assumed / unknown. `pivot` returns the first uncertain factor that flips the lean (or the most important unknown when the person is torn, or "robust" when nothing flips). `report` composes the reframe, the tradeoff, the next step and the "don't decide yet" line from those plus reversibility.

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
