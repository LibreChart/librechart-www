# LibreChart Brand Strategy

*July 2026 — v1 for review*

## What LibreChart is, in brand terms

LibreChart is a free, open-source EMR built for medical mission clinics running on a local network with no internet dependency. That's a rare and specific promise, and the brand should own it:

> **Patient records that work anywhere care happens.**

Three truths drive every design decision:

1. **It's medical software first.** The name "LibreChart" could be mistaken for a data-viz library. The identity must immediately read *clinical* — the "chart" is the patient chart, not a graph. The logo, imagery, and language all need to disambiguate.
2. **Trust is the product.** Clinics are trusting it with patient data in high-stakes, low-resource settings. The visual system must feel as dependable as Epic or Athena — calm, precise, uncluttered — while staying warmer and more human than enterprise health IT.
3. **Libre is a feature, not just a license.** Self-hosted, offline-capable, GPL, no cloud lock-in. Openness and resilience are selling points to both mission directors and the technical volunteers who deploy it.

## Audiences

- **Mission org directors / clinical leads** — deciding whether to trust it. Need: credibility, data stewardship, "this won't fail us in the field."
- **Volunteer clinicians** — using it at a folding table in a busy clinic. Need: clarity, speed, zero visual noise.
- **Technical volunteers / OSS contributors** — deploying and extending it. Need: signals of engineering quality and an open community.

## Brand personality

**Steady · Clear · Humane · Open.** Never: flashy, corporate-cold, gadgety, or charity-cliché (no hands-holding-globes, no swooshes).

## Voice

Plain, confident, concrete. Say "runs without internet," not "leveraging offline-first architecture." Lead with what clinics can do, not with the tech stack.

## A practical constraint that shapes the system

LibreChart self-hosts all assets — so every brand font must be open-licensed (SIL OFL) and bundled locally. All three directions below use only open fonts. This is also a brand story: *even our typeface works offline.*

---

## The three directions

### Direction 1 — Steady Signal *(recommended)*

*Clinical trust, modern and calm.*

- **Logo concept:** A rounded patient-chart card crossed by a single ECG trace whose baseline extends beyond the card's edges — continuity of care that doesn't stop when the connection does. The trace is the "L."
- **Palette:** Chart Blue `#155B8B` (primary), Vital Teal `#0E8C7F` (support/success), Ink `#14283C` (text), Mist `#F5F8FA` (surface), Amber `#D97706` (alerts, sparing).
- **Type:** **Public Sans** (UI + headings — the U.S. federal open typeface, literally designed for trusted government services) with **Source Serif 4** for marketing display moments.
- **Why:** Maximizes the "trusted medical organization" read. Safe in the best sense; ages well; translates directly into a low-noise product UI.

### Direction 2 — Open Care

*Humanitarian warmth without the clichés.*

- **Logo concept:** Four rounded chart-card squares whose negative space forms a medical cross; one quadrant in warm coral — a community assembling around care, and an open window.
- **Palette:** Deep Teal `#0F766E` (primary), Coral `#E76F51` (accent), Sand `#F7F1E8` (surface), Slate Ink `#253238`.
- **Type:** **Plus Jakarta Sans** (headings) + **Source Sans 3** (body/UI).
- **Why:** Most emotionally resonant for donors, volunteers, and mission storytelling. Slightly softer clinical read than Direction 1.

### Direction 3 — Local Grid

*Open-source engineering, offline resilience.*

- **Logo concept:** A hexagonal node containing a pulse line linking three dots — a LAN of care; the clinic as a self-sufficient cell.
- **Palette:** Steel Navy `#223E5F` (primary), Signal Teal `#2FB5A5` (accent), Amber `#F2A93B` (highlight), Ink `#0F1F2E`, Fog `#F4F6F8`.
- **Type:** **IBM Plex Sans** + **IBM Plex Mono** accents (labels, data, code).
- **Why:** Strongest pull for OSS contributors and technical deployers; most distinctive. Risk: can read more "infrastructure tool" than "medical care."

### Direction 4 — Warm Record

*Claude/Anthropic-inspired warmth, adapted for medical trust.*

- **Logo concept:** An outlined patient-record card in warm ink with a soft index tab and a single contained terracotta pulse — quieter and more humanist than Direction 1's filled mark.
- **Palette:** Ivory `#F0EDE5` (surface), Warm Ink `#2B2620` (text), Terracotta `#C15F3C` (accent; deepened to `#B0512F` for buttons/text to pass AA), Clay `#E8DFD1` (secondary surface), Sage `#6E8B7B` (support).
- **Type:** **Lora** (display serif) + **Inter** (body/UI) — open-licensed stand-ins for the book-ish serif + grotesque pairing; no proprietary Anthropic assets used.
- **Why:** The most humane and distinctive of the four; ivory + serif reads calm and editorial rather than enterprise-cold. Slight risk of feeling "publication" rather than "clinical software," mitigated in the product mockup by strict hierarchy and restrained color.

## Recommendation

**Lead with Direction 1** for the clinical core; if the organization wants a warmer, more humane voice, **Direction 4 is the strongest alternative** — and its ivory + serif marketing layer pairs well over Direction 1's product tokens. Either way, borrow Direction 3's mono-accent idea for data-dense product screens (IBM Plex Mono or Public Sans tabular figures for vitals, IDs, timestamps). If the marketing site needs more warmth, Direction 2's sand surface + coral accent can be adopted as the *marketing* layer over Direction 1's core palette.

## Application plan

**Marketing site:** hero states the promise ("Patient records that work anywhere care happens"), proof points as three pillars (Offline-first · Open source · Built for field clinics), screenshots of the real product, GitHub prominently linked. Light surfaces, one accent color, generous whitespace.

**Product redesign:** tokenize the chosen palette as CSS custom properties in the Drupal theme (`--lc-primary`, `--lc-ink`, `--lc-surface`, `--lc-success`, `--lc-alert`); Public Sans self-hosted via `@font-face`; 4px spacing grid; WCAG AA minimum (AAA for chart data) — all palettes above pass AA on their surfaces. Reserve amber/red strictly for clinical alerts so color carries meaning.

**Logo usage:** mark + wordmark lockup for the site; mark alone at ≤32px (favicon, app header); monochrome ink and reversed-white variants required since field printing is often B/W.

## Next steps

1. Pick a direction (or a hybrid) from the brand board.
2. Refine the chosen mark (grid-true geometry, favicon sizes, print mono).
3. Build the design tokens + Drupal theme starter and the marketing site homepage.
