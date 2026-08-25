# LibreChart marketing site — Astro 7 on Cloudflare Workers

> **First build action:** create `~/Sites/librechart-www/` and save this document there as `PROJECT-PLAN.md`, then `git init`. (Plan mode can only write to the plan file, so the copy into the new directory is step B0 rather than something I could do while planning.)

## Context

LibreChart needs a public project home. Today the only outward-facing artifacts live **untracked** inside the Drupal repo: a brand strategy, a logo set, and — importantly — **a complete, already-designed marketing homepage** at `branding/marketing-homepage.html` (664 lines, self-contained CSS, no build step).

So this isn't "design a website." It's three jobs:

1. Port a finished design into a templating system so it can grow (blog, more pages) without copy-pasting nav markup.
2. Close the two production gaps the file flags in its own comments — Google Fonts must become self-hosted, and the GitHub links need verifying (they're correct; `origin` is `github.com:LibreChart/LibreChart.git`).
3. Get it onto a real domain with a working contact path.

Outcome: `librechart.org` serving the existing design, plus a markdown blog and a demo-request form, on Cloudflare's free tier for roughly **$22/yr total** (two domains at cost; hosting $0).

Everything below happens **outside** the Drupal repo, in a new directory and a new GitHub repo.

---

## Part 1 — Technology evaluation

### Astro — yes, correct choice

Right tool for your constraints:

- **Zero JS by default.** Every page ships as static HTML; no framework runtime added on top of your one small nav script.
- **Content collections** validate `.md` frontmatter against a Zod schema *at build time*. A typo fails the build instead of rendering a broken page. This is the single biggest reason to pick Astro over hand-written HTML.
- **Components without a framework.** `.astro` files are HTML with scoped CSS and props.
- **Per-route server rendering.** Keep the whole site static and mark *only* the form endpoint server-rendered. Most SSGs are all-or-nothing.

Alternatives, honestly: **11ty** is leaner and would work, but you'd hand-roll the asset pipeline. **Next/Nuxt** are heavier than this needs. **Plain HTML** is viable for a one-pager — but the second blog post is where you start duplicating the nav, and that's exactly what Astro removes. **No change recommended.**

Versions verified against npm today: **astro 7.2.6**, **@astrojs/cloudflare 14.2.4** (peer-requires `astro ^7.2.0`, `wrangler ^4.83.0`), **wrangler 4.125.0**. Astro 7 needs **Node ≥ 22.12**.

### Cloudflare — yes, but Workers, not Pages

One correction to the plan as stated. Cloudflare shipped native static-asset serving on Workers in late 2024 and now steers all new projects there; Pages still works but receives little new feature work. Starting on Pages means migrating later the moment you want KV, D1, or cron.

Practical upshot: **one Worker serves the static site *and* the form endpoint** — one deploy, one config, one dashboard entry.

The cost objection doesn't apply. With `assets` configured and `run_worker_first` at its default, a request matching a static asset is served from Cloudflare's asset CDN **without invoking your Worker at all**. Static asset requests are free and unmetered; only `POST /api/contact` starts an isolate. "Single Worker" costs exactly what "pure static" costs for ~99.99% of traffic. **Expected hosting bill: $0.**

### KV — right instinct, and there's now a good reason to use it

Not for page state — as a **durability backstop for the contact form**. Write the submission to KV *first*, then attempt the email. If Resend is down, the enquiry is still safely stored and you return success to the user. Three extra lines for meaningful reliability.

### Workers for dynamic bits — exactly one endpoint

Which surfaces the thing that will bite you if unplanned:

> **Cloudflare discontinued its free MailChannels relay in June 2024.** A Worker can no longer send email on its own. You need a real provider.

**Resend** (your pick) is right: free tier ~3k emails/month, a single `fetch` call, and domain verification is just DNS records in a zone you already control. Paired with **Cloudflare Turnstile** for spam.

Worth noting on positioning: a third-party form service (Formspree/Web3Forms) would be faster to wire up, but for a project whose entire pitch is *self-hosted, no cloud lock-in, data stays on site*, routing enquiries through a SaaS form gateway is a small but real credibility leak. Resend + your own KV is the on-brand choice.

### GitHub — confirms the deploy path, changes nothing architecturally

Use **Workers Builds**, Cloudflare's native Git integration: authorize the Cloudflare GitHub App on the repo, and every push to `main` builds and deploys. Preview URLs per PR come free.

The alternative — GitHub Actions with `cloudflare/wrangler-action` — gives more control but requires storing a Cloudflare API token as a GitHub secret. Not worth it here; Workers Builds needs no secrets in GitHub at all.

Three consequences worth having in front of you:

- **Repo will be public.** `PUBLIC_TURNSTILE_SITE_KEY` is public by design and safe to commit. `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` are Wrangler secrets and must never enter the repo — `.dev.vars` goes in `.gitignore` on day one, with a committed `.dev.vars.example` template.
- **Opposite convention to the Drupal repo.** There, GitHub `origin` is a stale mirror and you deploy with `git push laughh main`. Here, **pushing to GitHub `main` ships to production.** Two repos, inverted meanings for the same command.
- **This repo rescues the branding work.** `branding/` and the theme's fonts/tokens are currently untracked in one working copy on one machine. Committing them here is the first time they're backed up.

Put it at `github.com/LibreChart/librechart-www`, alongside the existing `LibreChart/LibreChart`.

### Two additions you didn't mention

- **Cloudflare Web Analytics** — free, cookieless, no consent banner. On-brand for LibreChart's privacy posture in a way Google Analytics is not.
- **`OFL.txt`** shipped with the fonts. The theme's font README cites SIL OFL 1.1 but ships no licence text; redistributing publicly should include it.

---

## Part 2 — Architecture

**Astro 7, `output: 'static'`, `@astrojs/cloudflare` adapter, `prerender = false` on exactly one route.**

`output: 'hybrid'` no longer exists; `'static'` (default) plus a per-route opt-out is the supported pattern, and it's the correct polarity — static by default, one deliberate exception.

```
   git push main ──► GitHub ──► Workers Builds (Cloudflare CI)
                                  npm ci && npx astro build
                                          │
                                          ▼
                          ┌───────────────────────────────┐
        librechart.org ──►│  ONE Worker                   │
                          │   ├─ static assets (free,     │
                          │   │   never invokes Worker)   │
                          │   └─ POST /api/contact        │
                          │        ├─► Turnstile verify   │
                          │        ├─► KV  (write first)  │
                          │        └─► Resend (best effort)│
                          └───────────────────────────────┘
        librechart.dev ──► Redirect Rule 301 ──► librechart.org
```

### Project structure

```
~/Sites/librechart-www/
├── PROJECT-PLAN.md          # this document
├── wrangler.jsonc
├── astro.config.mjs
├── .dev.vars                # GITIGNORED — local secrets
├── .dev.vars.example        # committed template
├── worker-configuration.d.ts # generated by `wrangler types`
├── public/
│   ├── favicon.svg, favicon-32.png, apple-touch-icon-180.png, icon-512.png
│   ├── robots.txt, _headers  # CSP, HSTS, immutable font caching
│   └── fonts/*.woff2 + OFL.txt
├── src/
│   ├── content.config.ts     # Astro 5+ location, NOT src/content/config.ts
│   ├── styles/               # tokens.css, fonts.css, global.css, prose.css
│   ├── layouts/              # BaseLayout, PageLayout, BlogPostLayout
│   ├── components/
│   │   ├── Head, Header, Footer, Logo, Button, GithubIcon, CheckIcon
│   │   ├── home/             # Hero, Pillars, ProductMockup, HowItWorks, CommunityBand
│   │   └── contact/          # ContactForm
│   ├── content/blog/*.md
│   └── pages/
│       ├── index, 404, contact, contact/thanks, contact/error/[kind]
│       ├── docs/getting-started, blog/index, blog/[...slug], rss.xml.ts
│       └── api/contact.ts    # the ONLY on-demand route
└── src/assets/logos/*.svg
```

`src/fetch.ts` is a **reserved filename** in Astro 7 (advanced routing entrypoint) — don't create one.

### Site map — launch vs later

**Launch:** `/`, `/docs/getting-started`, `/contact` (+ `/contact/thanks`, `/contact/error/[kind]`), `/blog`, `/blog/<slug>`, `/404`, `/rss.xml`, `/sitemap-index.xml`.

An OSS project home has three jobs: *explain the thing*, *let me install it*, *let me reach a human*. Home + getting-started + contact covers all three. Blog earns its slot because you already have publishable material and a project with zero posts reads as abandoned — **ship with two posts minimum**, drawn from `docs/presentation/session-proposal.md` and the mission figures.

**Later:** `/about`, `/screenshots` (needs real de-identified captures — do **not** ship a dedicated page of the fake mockup; that's where the trick stops being charming and starts being misleading), `/docs/architecture`, `/docs/clinic-workflow`, `/docs/deployment`, `/roadmap`.

Do **not** stand up Starlight at launch. A sparse docs sidebar full of stubs actively signals immaturity; revisit at five-plus real doc pages.

---

## Part 3 — Track A: your tasks (Cloudflare / accounts / dashboard)

These need your card, your inbox, and your credentials. I can't do any of them.

### A1 · Cloudflare account
1. Sign up at `dash.cloudflare.com`, verify your email. Free plan.
2. **Enable 2FA immediately** — this account will hold the domain, DNS, and deploy pipeline.
3. Add a payment method (My Profile → Billing → Payment info). Registrar requires one on file.

### A2 · Register both domains
1. Go to **Register Domains** (`dash.cloudflare.com/?to=/:account/registrar/register`). Search `librechart`.
2. Purchase **librechart.org** — choose term, enter registrant details in **ASCII only**, accept the Domain Registration Agreement, complete (~30s).
3. Repeat for **librechart.dev**.
4. **Click the ICANN registrant-verification email.** Skip this and ICANN puts the domain on hold and the site goes dark. Not optional.

At-cost, no markup. Registrar domains are locked to Cloudflare nameservers — fine, we want that. Both zones are created automatically; no nameserver change needed.

> If `librechart.org` is taken, fall back to `librechart.app` or `getlibrechart.org` and tell me — the domain string is baked into `astro.config.mjs`, `wrangler.jsonc`, and the Resend sender.

### A3 · GitHub repo
Create **`LibreChart/librechart-www`**, public, empty (no README/licence — I'll populate it). `gh` isn't installed locally; either `brew install gh` or create it in the browser.

### A4 · Turnstile widget
Dashboard → **Turnstile** → Add widget. Hostname `librechart.org` (add `localhost` too, for local testing). Mode: **Managed**.
→ **Hand me the Site Key.** Keep the Secret Key for A7.

### A5 · Resend account
1. Sign up at `resend.com`, add **librechart.org** as a sending domain.
2. Paste the DKIM/SPF/DMARC records it gives you into the Cloudflare DNS zone (same account, ~2 min). Wait for **Verified**.
3. Create an API key, scoped to sending only.
→ Keep the key for A7. Also decide the destination inbox (`CONTACT_TO`).

### A6 · Connect Workers Builds *(after I push in B7)*
Dashboard → **Compute → Workers & Pages → Create → Import a repository**. Authorize the Cloudflare GitHub App, pick `librechart-www`, set:
- Build command: `npx astro build`
- Deploy command: `npx wrangler deploy`
- **Build variable** (not runtime): `PUBLIC_TURNSTILE_SITE_KEY` = your A4 site key

> **The gotcha that costs an afternoon.** The Turnstile *site* key is needed at **build** time (it's rendered into the HTML); the secrets are needed at **runtime**. Dashboard "runtime variables" are invisible to the build. Site key → build variable. Secrets → A7.

### A7 · Secrets and KV *(after B7, from the project directory)*
```bash
npx wrangler kv namespace create CONTACT_KV   # → hand me the returned id
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
```

### A8 · Attach domains *(after the first green deploy)*
1. Worker → Settings → **Domains & Routes** → Add custom domain: `librechart.org`, then `www.librechart.org`. Cloudflare provisions DNS and the cert.
2. **librechart.dev** zone → **Rules → Redirect Rules**: `Hostname equals librechart.dev` → dynamic redirect to `concat("https://librechart.org", http.request.uri.path)`, **301**, preserve query string.
3. SSL/TLS mode → **Full (strict)**.
4. Confirm **Auto Minify is off** — Astro's docs flag it as a cause of broken hydration.

### A9b · Cloudflare Email Routing (delivers `hello@librechart.org`)

The site publishes `hello@librechart.org` in the footer, the `<noscript>`
fallback, and the "something went wrong" page, and the contact endpoint sends
there. Nothing receives it until this is done.

1. Zone → **Email → Email Routing** → enable. Cloudflare adds MX + SPF records
   to the **apex** automatically.
2. Add a custom address `hello@librechart.org` → forward to your real inbox.
3. Click the verification link Cloudflare sends to that inbox.

These records do **not** conflict with Resend: Email Routing uses the apex,
Resend uses the `send` subdomain (see `docs/DNS-RECORDS.md`).

Note the asymmetry — Email Routing handles **inbound** only. Outbound is
Resend, sending as `site@librechart.org`. Replies to an enquiry go to the
submitter directly via `reply_to`, not through either system.

### A9 · Hardening and analytics
1. **Security → WAF → Rate limiting rule**: `POST /api/contact`, 5 requests / 10 min / IP. The free plan allows exactly one rule — this is the right one to spend it on.
2. **Web Analytics** → add `librechart.org` → hand me the beacon token.
3. Confirm **github.com/LibreChart/LibreChart is public**. The homepage links to it as the primary CTA; a 404 there is worse than no link.

### What I need back from you

| Value | From | Blocks |
|---|---|---|
| Final domain (confirmed available) | A2 | B1 |
| Turnstile **site** key | A4 | B6 |
| Turnstile **secret** key | A4 | A7 |
| Resend API key + `CONTACT_TO` | A5 | A7 |
| KV namespace id | A7 | B6 |
| Web Analytics beacon token | A9 | B5 |

---

## Part 4 — Track B: build tasks (mine)

### B0 · Scaffold
Create `~/Sites/librechart-www/`, save this plan as `PROJECT-PLAN.md`, then:
```bash
npm create astro@latest librechart-www -- --template minimal --typescript strict --install --git
npx astro add cloudflare && npx astro add sitemap
npm install @astrojs/rss sharp
npm install -D wrangler@^4.125.0 prettier prettier-plugin-astro
npx astro --version    # expect 7.2.x
```
`.gitignore` gets `.dev.vars` **before the first commit**.

Deliberately **not** installing: `@astrojs/mdx` (plain `.md` suffices; drags in the Sätteri/remark chain), `@fontsource/*` (fonts are committed for stable preload URLs and self-hosting ethos), the `resend` SDK (raw `fetch` is 15 lines, no Node shim), and Tailwind (you have 330 lines of finished CSS — a utility framework means rewriting all of it for nothing).

### B1 · Config

`astro.config.mjs`:
```js
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://librechart.org',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [sitemap({ filter: (p) => !p.includes('/contact/error/') })],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  env: {
    schema: {
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CONTACT_TO: envField.string({ context: 'server', access: 'public' }),
      CONTACT_FROM: envField.string({ context: 'server', access: 'public' }),
    },
  },
});
```

`wrangler.jsonc` — note `main` points at the **adapter entrypoint**, and `assets.directory` is **injected automatically** by `@cloudflare/vite-plugin` from Astro's client build output. Hand-writing either is a common and confusing error:
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "librechart-www",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-08-24",
  "assets": { "html_handling": "drop-trailing-slash", "not_found_handling": "404-page" },
  "observability": { "enabled": true },
  "vars": { "CONTACT_TO": "…", "CONTACT_FROM": "LibreChart <site@librechart.org>" },
  "kv_namespaces": [{ "binding": "CONTACT_KV", "id": "<from A7>" }]
}
```
`nodejs_compat` is **not** required — add it only if a dependency reaches for `node:*`.

`trailingSlash: 'never'` + `format: 'directory'` + `drop-trailing-slash` gives one canonical URL shape with no redirect chains.

### B2 · Assets and fonts
Copy from the Drupal repo: `branding/logos/*.svg` → `src/assets/logos/`, the favicon/PNG set → `public/`, and the four Public Sans woff2 → `public/fonts/`. Also copy `BRAND_STRATEGY.md` and `logos/README.md` into the new repo — that material exists only in one working copy today.

Two fonts must be **downloaded** (not in the repo): Public Sans 400-italic, and Source Serif 4. For Source Serif take the **`wght`-only variable file (50 KB)**, not the `opsz` one (122 KB) — the optical-size axis buys nothing at heading sizes and 72 KB on a render-blocking preload is a bad trade.

Delete the three Google Fonts `<link>` tags (source lines 13–16) and write `@font-face` rules. **Preload only two faces** — Public Sans 400 and the Source Serif variable. `crossorigin` is required on font preloads even same-origin; omit it and the browser fetches each file twice. Add `OFL.txt`.

### B3 · Homepage port

The source CSS carries section comments that map almost 1:1 onto components: `:root`+reset → `tokens.css`/`global.css`; buttons, `.wrap`, `.kicker`, `.section-head`, logo classes → `global.css` (all cross-cutting); Nav → `Header`; Hero (+ ECG keyframes) → `home/Hero`; Pillars, Product mockup, How-it-works, Community band, Footer → their own components.

> **The one real hazard.** Source lines 313–345 are four media queries (`920/780/560/480px`) whose rules reach across *every* section. Move them wholesale into `global.css` and Astro's scoped-style hashing makes those selectors miss their targets — the layout breaks **only at breakpoints**, which is nearly invisible until you resize. Split the responsive block by target selector and put each rule in the same component whose scoped `<style>` owns the base rule. `@media` inside a scoped block works normally.

> **Astro 7 compiler.** The compiler is now Rust and no longer auto-corrects HTML — unclosed or misnested tags become errors (useful here). The dangerous one is **whitespace, which now follows JSX rules**: a newline between two inline elements no longer renders as a space, and this **fails silently in production**. Watch for words glued together across line breaks in `<a>`/`<strong>`/`<em>` runs.

**Port sequence — this is where the project succeeds or fails.** The homepage is already good; the entire risk is degrading it during decomposition.
1. Paste the *entire* `<style>` verbatim into `global.css` and the *entire* `<body>` verbatim into `index.astro`. Fix compiler complaints. **Verify pixel-identical against the original at 1440/920/780/560/480.** This is the reference build.
2. Extract `Header` + `Footer`, moving their CSS *and matching media rules*. Re-verify.
3. Extract the five `home/*` components **one at a time**, re-verifying after each.
4. Extract `Button`, `Logo`, icons last.

De-duplication wins: the GitHub icon path appears 4×, the checkmark 6×, the logo mark 3× with different fills → `Logo.astro` with a `variant` prop. And nav anchors `#features`/`#how`/`#community` must become `/#features` etc., or they 404 from `/blog`.

Token naming: keep the marketing names (`--chart-blue`, `--ink`, `--mist`) as the surface API to avoid churning 330 lines of CSS, and add `--lc-*` aliases so Drupal-theme components drop in unchanged. Keep the deliberate divergence — marketing `--radius: 12px` vs product `--lc-radius: 6px`. Don't unify.

### B4 · Blog
`src/content.config.ts` (Astro 5+ location; `src/content/config.ts` no longer works, legacy collections removed in Astro 6):
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';          // note: 'astro/zod', not 'astro:content'

const blog = defineCollection({
  // [^_] lets you park work-in-progress as _draft.md and have the loader skip it
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().max(120),
    description: z.string().max(300),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Aaron Ellison'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: image().optional(),
    heroAlt: z.string().optional(),
  }),
});

export const collections = { blog };
```
**Zod 4** (since Astro 6): write `z.email()` / `z.url()`, not `z.string().email()`.

Filter drafts with `import.meta.env.PROD ? data.draft !== true : true` — they render in `dev`, vanish from `build`. Plus `rss.xml.ts`. Two seed posts from the Colombia mission and the spec-driven-development argument.

### B5 · Layouts, SEO, headers
`BaseLayout` + `Head` (canonical, OG/Twitter, JSON-LD, font preloads, Web Analytics beacon), `404.astro`, `robots.txt`, and `public/_headers` with immutable font caching plus CSP. CSP needs `style-src 'unsafe-inline'` (Astro emits inline `<style>` for scoped CSS) and `challenges.cloudflare.com` in `script-src`/`frame-src` for Turnstile.

### B6 · Contact form
Real `<form method="POST">` that works without JS. **Four layered defences:** server-verified Turnstile (a client widget alone verifies nothing), a visually-hidden honeypot field, a time-to-submit floor (~3s), and your A9 WAF rate limit.

`src/pages/api/contact.ts` — the only route with `export const prerender = false`. Order matters: verify Turnstile → **write to KV first** → then best-effort Resend. A send failure must not lose the message.
```ts
import { env } from 'cloudflare:workers';   // Astro 6+ — locals.runtime.env was removed
```
Details that matter: the honeypot path returns *success*, not an error (telling a bot it was caught is free intelligence for the bot); `303 See Other` for POST→GET, which kills back-button resubmission; `reply_to` is **snake_case** in Resend's raw HTTP API; and `from` must be your own domain — setting it to the submitter's address fails DMARC and lands in spam.

**One structural consequence:** a prerendered `/contact` can't read `?error=…` server-side. I'll generate `/contact/error/[kind]` pages via `getStaticPaths` — five lines each, fully static, works without JS, and preserves the "exactly one dynamic route" invariant.

### B7 · Ship
`.dev.vars.example`, README, licence declaration (site source and prose are not the EMR — recommend MIT or GPL-2.0 for the source, CC BY-SA 4.0 for prose, brand marks reserved), then push to GitHub. Hand off to A6/A7.

---

## Part 5 — Interleaving

| # | Track | Work | Gate |
|---|---|---|---|
| 1 | **A** | A1–A3: account, domains, GitHub repo | Zone active, ICANN email clicked |
| 2 | **B** | B0–B2: scaffold, config, assets, fonts | `astro check` clean; two self-hosted font requests, zero Google Fonts |
| 3 | **B** | B3: verbatim paste → reference build | Pixel-identical at 5 breakpoints |
| 4 | **B** | B3: incremental extraction | Re-verify after **each** component |
| 5 | **B** | B4–B5: blog, RSS, SEO, headers | Schema-failure test passes; Lighthouse ≥95 |
| 6 | **A** | A4–A5: Turnstile + Resend → hand me keys | Resend domain **Verified** |
| 7 | **B** | B6: contact form + endpoint | All 8 local form tests below |
| 8 | **B** | B7: push to GitHub | Repo public, `.dev.vars` absent |
| 9 | **A** | A6–A7: Workers Builds, secrets, KV | First build green |
| 10 | **A** | A8–A9: domains, redirect, WAF, analytics | Production checks below |
| 11 | — | Tier 2: `/about`, real screenshots, docs | — |

A1–A3 and B0–B5 run in parallel — I don't need the domain live to build, only to know the final string.

---

## Verification

**Local build** — `npm run dev` (Astro 7 runs dev on the real `workerd` runtime, so dev/prod diverge far less than they used to). Open `branding/marketing-homepage.html` and `localhost:4321` side by side at **1440/920/780/560/480px** — those are the exact source breakpoints, and a scoped-style regression appears *only* there.

**Fonts** — DevTools → Network, filter `Font`: exactly two woff2 on first paint, both same-origin, **zero** requests to `fonts.googleapis.com`/`gstatic.com`. Console: `document.fonts.check('700 1rem "Source Serif 4 Variable"')` → `true`.

**Accessibility** — Tab from the top: skip link appears first and jumps to `#main`; every control shows the focus ring. Under `prefers-reduced-motion: reduce`, the ECG animation stops. No CSP violations in console.

**Blog schema** — set `pubDate: "not a date"`; the dev server must **fail** with a Zod error naming the file and field. If it doesn't, `content.config.ts` is in the wrong place. Set `draft: true` → visible in `dev`, absent from `dist/`.

**Form, locally** (`npm run preview`, using Turnstile's documented test keys — always-pass sitekey `1x00000000000000000000AA` / secret `1x0000000000000000000000000000000AA`; always-fail `2x…AB` / `2x…AA`):
1. Happy path → 303 to `/contact/thanks`
2. `wrangler kv key list --binding CONTACT_KV --local` shows the submission
3. Always-fail keys → `/contact/error/turnstile`
4. `curl -X POST … -d 'website=spam&…'` → 303 to thanks, **no** KV key written
5. `rendered_at=Date.now()` → validation error
6. `email=notanemail` → validation error
7. JS disabled → `<noscript>` mailto fallback visible
8. Real Resend key → mail arrives, **Reply pre-fills the submitter's address**, not in spam

**Build output** — `find dist -name '*.html'` shows every page *except* `api/contact`. A missing page means a stray `prerender = false`. Then `npx wrangler deploy --dry-run --outdir=/tmp/lc` validates config and confirms the vite plugin injected `assets.directory` — without touching production.

**Production**
```bash
curl -sI https://librechart.org/                    # 200, cf-cache-status present
curl -sI https://librechart.org/fonts/…woff2        # immutable, max-age=31536000
curl -sI https://librechart.org/blog/               # 301 → /blog
curl -sI https://librechart.dev                     # 301 → https://librechart.org
curl -s  https://librechart.org/nope -o /dev/null -w '%{http_code}\n'   # 404, styled
```
Then the proof that static assets bypass the Worker: run `npx wrangler tail`, submit the form → **exactly one** invocation logged; hard-reload the homepage → **zero** additional invocations.

Finally: Turnstile renders with the production sitekey on a hostname matching its dashboard registration (mismatch fails silently); submit 6× in a minute and confirm the 6th is rate-limited; Lighthouse 100 on Accessibility and ≥95 Performance (if Performance dips, the usual culprit is preloading too many fonts); validate the feed; submit the sitemap to Search Console.

---

## Open items

- **Domain availability is unverified** — checked live at A2. A different final string means updating `astro.config.mjs`, `wrangler.jsonc`, and the Resend sender.
- **Confirm `LibreChart/LibreChart` is public** (A9.3). It's the homepage's primary CTA.
- **Real screenshots.** The homepage uses a hand-built HTML mockup of the chart UI, which is fine in context. Real de-identified captures would be stronger but need a demo instance — Tier 2, and a prerequisite for any dedicated `/screenshots` page.
- **Resend API key exposure — accepted, closed.** The key was pasted into a
  chat transcript and the decision was to keep it rather than rotate. Recorded
  here so it is a known state rather than an oversight.
- **Licence for the site repo** is your call: GPL-2.0-or-later for consistency with the EMR, or MIT since this is marketing code, not the product.

---

# Implementation notes (B0–B5 as built)

Where reality differed from the plan above. The plan text is left unedited; this
section is the correction.

## Corrected by measurement

- **Source Serif 4: ship the `opsz` file (122 KB), not `wght` (50 KB).** The plan
  argued the optical-size axis "buys almost nothing at heading sizes." Measured
  with both fonts fully loaded, pinning `opsz` renders headings **~11% wider**,
  costing the h1 and two h2s an extra line at 480px. Fidelity wins; the design was
  authored against the optical-size version.

- **CSP is emitted by Astro, not by `public/_headers`.** Astro 7's
  `security.csp` hashes the scripts and styles it emits. Two policies would not
  add up — browsers enforce the *intersection*, so a header `script-src 'self'`
  blocks Astro's own hashed inline script no matter what the meta allows. Astro
  owns the policy; `_headers` keeps `X-Frame-Options: DENY`, because
  `frame-ancestors` is ignored in a meta policy. Bonus: no `'unsafe-inline'`
  anywhere, which the plan's hand-written policy required for scoped styles.

- **`session: false`.** Left at its default the Cloudflare adapter auto-binds a
  `SESSION` KV namespace. This site has no sessions; opting out keeps the deploy
  binding-free and removes a namespace from A7.

## Corrected by the toolchain

- **`wrangler.jsonc`**: `main` is `@astrojs/cloudflare/entrypoints/server`, and
  the adapter rewrites `assets.directory` at deploy time via a generated
  `dist/client/wrangler.json`. Not `./dist/_worker.js/index.js`.
  `nodejs_compat` is not needed; the adapter picks `global_fetch_strictly_public`.
- **`z` comes from `astro/zod`**, not `astro:content`. Zod 4 — use `z.email()`,
  not `z.string().email()`.
- **Trailing-slash canonicalisation returns 307, not 301** (`html_handling:
  drop-trailing-slash`). Adjust the verification step's expectation.

## The cascade trap (the expensive one)

Six elements carry `.wrap` alongside a block class. At ≤480px the global
`.wrap{padding:0 18px}` is meant to win on source order — both selectors are
0-1-0. Moving a `padding` declaration for one of those classes into a
component's scoped `<style>` rewrites it as `.x.astro-HASH` (0-2-0), which beats
`.wrap` and strips side gutters on phones. **Padding for any `.wrap`-combined
class stays in `global.css`**; only layout properties are safe to scope. See the
CASCADE TRAP comment in `src/styles/global.css`.

This cost three separate regressions during the port, none of which produced a
build error or a console warning. `scripts/compare.sh` caught all three.

## Still to do

- **B6** — contact form. Needs the A4/A5/A7 keys. `frame-src`/`script-src`
  already allow `challenges.cloudflare.com`.
- **`/docs/getting-started`** — the header's "Docs" link currently points at the
  GitHub README.
- **Blog posts are `draft: true`.** Two seed posts are written but unpublished:
  they are drafts under Aaron's byline making factual claims about a real
  mission, so they need his review before `draft: false`.
- **Web Analytics beacon** — needs the A9 token.
- **Button / Logo / icon components** — the GitHub icon path appears 4×, the
  checkmark 6×, the logo mark 3×. Deferred deliberately: the footer recolours
  the logo via `.footer .logo-lockup`, which stops working once the logo moves
  into its own component, so that extraction should introduce a `variant` prop
  at the same time.
