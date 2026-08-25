# Launch checklist

Everything needed to get librechart.org live. **A** items need your accounts and
your card — I cannot do them. **C** items are code changes I make.

Order matters in two places, flagged below. Roughly 60–90 minutes of your time,
most of it waiting for DNS.

---

## Already done

- [x] Site built — 9 pages: home, docs, contact (+ thanks and 3 error pages), blog, 404
- [x] Repo public at `github.com/LibreChart/librechart-www`, pushed
- [x] Turnstile **site** key committed (public by design, baked in so no build variable can go missing)
- [x] Resend account and API key created
- [x] Resend DNS records captured in `docs/DNS-RECORDS.md`
- [x] `CONTACT_TO` set to `hello@librechart.org`

---

## Phase 1 — Domain (do first, everything waits on it)

- [ ] **A1** Cloudflare account, email verified, **2FA on**, payment method added
- [ ] **A2** Register **librechart.org** — Register Domains → search → purchase.
      ASCII-only registrant details.
- [ ] **A3** Register **librechart.dev** (redirect target, optional but cheap)
- [ ] **A4** ⚠️ **Click the ICANN verification email.** Miss this and ICANN puts
      the domain on hold and the site goes dark. Not optional.

> If `librechart.org` is taken, stop and tell me. It is baked into
> `astro.config.mjs`, `wrangler.jsonc`, `robots.txt` and the Resend sender.

## Phase 2 — Mail (slowest; start as soon as the zone exists)

- [ ] **A5** Add the three Resend records from `docs/DNS-RECORDS.md` to Cloudflare DNS
      (DKIM TXT, `send` MX, `send` SPF TXT). Set them **DNS only** — grey cloud.
- [ ] **A6** Wait for Resend to show the domain **Verified**
- [ ] **A7** Add DMARC: TXT `_dmarc` = `v=DMARC1; p=none;`
- [ ] **A8** ⚠️ **NOT DONE — checked 25 Aug 2026.** `librechart.org` has no apex
      MX and no apex TXT record, which means Email Routing has never been
      enabled. `CONTACT_TO` is `hello@librechart.org`, so until this is done
      **every contact form submission emails an address that bounces.**

      Cloudflare → the `librechart.org` zone → **Email → Email Routing** →
      *Get started*. Cloudflare adds the apex MX and SPF records itself. Then
      add a custom address `hello@librechart.org` forwarding to your real
      inbox, and click the verification link it emails you.

      Verify with: `dig +short MX librechart.org` — should list
      `route1/2/3.mx.cloudflare.net`.

> Email Routing (inbound) puts MX/SPF on the apex; Resend (outbound) uses the
> `send` subdomain. They do not collide.

## Phase 3 — Secrets and storage

All of this happens in `~/Sites/librechart-www`. Run `cd ~/Sites/librechart-www`
first; every `npx wrangler` command reads `wrangler.jsonc` from the working
directory.

### 3.1 Authenticate wrangler

You are not currently logged in — this blocks every other step in this phase.

```
npx wrangler login
```

Opens a browser for Cloudflare OAuth. Approve the requested scopes. Confirm it
worked:

```
npx wrangler whoami
```

Expect your email and account id. If it still says *not authenticated*, the
browser callback did not complete — run `npx wrangler login` again rather than
retrying `whoami`.

### 3.2 Add the production hostnames to Turnstile

Cloudflare dashboard → **Turnstile** → your widget → **Settings**.

Under *Hostnames*, add:

- `librechart.org`
- `www.librechart.org`

Keep `localhost` if it is there — it is what makes local testing work.

> A hostname mismatch does not raise an error. The widget simply never appears
> and the form cannot be submitted, which looks like a code bug and is not one.
> This is the single most common Turnstile failure.

Do **not** create a second widget. Two widgets means two key pairs, and mixing a
site key from one with a secret from the other is the second most common
failure. The site key already in `astro.config.mjs`
(`0x4AAAAAAEanWjZIZR-tG2cl`) must stay paired with the secret you set in 3.5.

### 3.3 Create the KV namespace

```
npx wrangler kv namespace create CONTACT_KV --binding CONTACT_KV --update-config
```

`--update-config` writes the binding and its id straight into `wrangler.jsonc`,
so there is nothing to copy by hand and nothing to send me.

Check it landed:

```
grep -A3 kv_namespaces wrangler.jsonc
```

You should see a real 32-character hex id. If the block is still commented out,
the flag did not apply — tell me and I will paste it in manually.

### 3.4 First deploy (creates the Worker)

Secrets attach to a Worker that already exists, so the Worker has to be created
before 3.5. This deploy is safe: `wrangler.jsonc` sets `"workers_dev": false`,
so the Worker is created with **no public URL at all**. Nothing is reachable
until a custom domain is attached in Phase 4.

```
npm run deploy
```

Expect `Total Upload: ~550 KiB`, a `CONTACT_KV` binding listed, and no
`workers.dev` URL in the output. If it prints a `*.workers.dev` address, stop —
`workers_dev: false` did not take effect and the broken-form window is open.

### 3.5 Set the two secrets

Each prompts for the value on stdin, so it never enters a file, your shell
history, or this transcript.

```
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
```

- `TURNSTILE_SECRET_KEY` — Turnstile → your widget → Settings → **Secret key**.
  Starts `0x4...`. This is *not* the site key.
- `RESEND_API_KEY` — the Resend key you already have. Starts `re_`.

Verify both are attached (names only; values are never readable back):

```
npx wrangler secret list
```

Expect exactly `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY`.

### Phase 3 done when

- [ ] `npx wrangler whoami` shows your account
- [ ] Turnstile widget lists `librechart.org` and `www.librechart.org`
- [ ] `wrangler.jsonc` contains a real `CONTACT_KV` id
- [ ] `npm run deploy` succeeded and printed **no** workers.dev URL
- [ ] `npx wrangler secret list` shows both secrets

## Phase 4 — Deploy

> ⚠️ **Do not connect Workers Builds before Phase 3.** The build will succeed and
> publish to a `workers.dev` URL with no secrets set, so anyone who finds it gets
> a broken contact form.

- [ ] **A12** Cloudflare → Compute → Workers & Pages → **Import a repository** →
      `LibreChart/librechart-www`
      - Build command: `npx astro build`
      - Deploy command: `npx wrangler deploy`
- [ ] **A13** Confirm the first build goes green
- [ ] **A14** Worker → Settings → **Domains & Routes** → add `librechart.org`,
      then `www.librechart.org`
- [ ] **A15** SSL/TLS mode → **Full (strict)**
- [ ] **A16** Confirm **Auto Minify is off** (Astro docs flag it as a cause of
      broken hydration)
- [ ] **A17** On the `librechart.dev` zone → Rules → Redirect Rules:
      `Hostname equals librechart.dev` → dynamic redirect to
      `concat("https://librechart.org", http.request.uri.path)`, **301**,
      preserve query string

## Phase 5 — Harden

- [ ] **A18** Security → WAF → **Rate limiting rule**: `POST /api/contact`,
      5 requests / 10 min / IP. The free plan allows one rule; this is the one to spend it on.
- [ ] **A19** Web Analytics → add `librechart.org` → send me the beacon token
- [ ] **C2** *(me)* Add the beacon to `BaseLayout.astro` and extend the CSP to allow it

## Phase 6 — Verify in production

- [ ] Submit the contact form for real. Confirm the mail arrives at
      `hello@librechart.org`, **and that hitting Reply addresses the submitter**,
      not yourself.
- [ ] Confirm the submission also landed in KV (Workers → KV → CONTACT_KV)
- [ ] Turnstile widget visibly renders (with the real key it shows a challenge,
      unlike the test key)
- [ ] Submit 6 times in a minute — the 6th should be rate-limited
- [ ] `curl -sI https://librechart.dev` → 301 to librechart.org
- [ ] `curl -sI https://librechart.org/blog/` → redirects to `/blog`
- [ ] A nonexistent path returns the styled 404 with status 404
- [ ] Lighthouse: 100 Accessibility, ≥95 Performance
- [ ] Submit `https://librechart.org/sitemap-index.xml` to Google Search Console

## Phase 7 — Content before announcing

- [ ] **Review the two blog posts** in `src/content/blog/`. Both are
      `draft: true` and invisible until you change that. They carry your byline
      and make factual claims about the June 2026 mission — 705 patients, 383
      lab orders, García Rovira — so they need your eyes before they publish.
- [ ] **C3** *(me)* Flip `draft: false` once you approve
- [ ] Decide whether `docs/BRAND_STRATEGY.md` should stay in a public repo. It is
      internal brand deliberation, including three directions you did not pick.

---

## Not blocking launch

- Real de-identified product screenshots — the homepage currently uses a
  hand-built HTML mockup. Fine in context, but real ones are stronger, and a
  dedicated screenshots page should wait for them.
- An `/about` page. The story works as blog post #1 for now.
- More docs: architecture, clinic workflow, deployment. The station diagrams in
  `documentation/patient-flow.md` would pre-render to static SVG nicely.
- Extracting `Logo`/`Button`/icon components. The GitHub icon appears 4×, the
  checkmark 6×, the mark 3×. Safe to do now that the gutter rules use
  `padding-block`.

## Known and accepted

- The Resend API key was pasted into a chat transcript and the decision was to
  keep it rather than rotate. Recorded so it is a known state, not an oversight.
