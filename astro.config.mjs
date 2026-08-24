// @ts-check
import { defineConfig, envField } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://librechart.org',

  // Static by default. Exactly one route opts out with `export const
  // prerender = false`: src/pages/api/contact.ts (added in B6).
  output: 'static',

  // One canonical URL shape (/blog/my-post) with no redirect chains. Pairs
  // with "html_handling": "drop-trailing-slash" in wrangler.jsonc.
  trailingSlash: 'never',
  build: { format: 'directory' },

  adapter: cloudflare({
    // Optimise images at build time with sharp rather than requiring a
    // Cloudflare Images binding at runtime. Correct for a prerendered site.
    imageService: 'compile',
  }),

  integrations: [
    sitemap({
      // Error pages are reachable only by redirect; keep them out of the index.
      filter: (page) => !page.includes('/contact/error/'),
    }),
  ],

  // No sessions anywhere on this site (static pages + one stateless form
  // endpoint). Left at the default, the Cloudflare adapter auto-binds a
  // "SESSION" KV namespace we would then have to provision. Opt out.
  session: false,

  security: {
    // Astro computes SHA-256 hashes for the scripts and styles it emits and
    // publishes them in a <meta http-equiv="content-security-policy">.
    //
    // This is the ONLY CSP on the site. A second policy in public/_headers
    // would not add protection - browsers enforce the intersection of all
    // policies, so a header `script-src 'self'` would block Astro's hashed
    // inline script regardless of what the meta allows. Hashes also beat the
    // 'unsafe-inline' that scoped component styles would otherwise force.
    //
    // frame-ancestors is ignored in a meta policy, so X-Frame-Options: DENY in
    // public/_headers covers clickjacking instead.
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // Turnstile XHRs to challenges.cloudflare.com, so 'self' alone breaks it.
        "connect-src 'self' https://challenges.cloudflare.com",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        // Turnstile's widget iframe (B6).
        'frame-src https://challenges.cloudflare.com',
      ],
      scriptDirective: {
        resources: ["'self'", 'https://challenges.cloudflare.com'],
      },
    },
  },

  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  env: {
    schema: {
      // The Turnstile SITE key is public by definition - it is rendered into
      // the contact page's HTML. Committing it as the default is deliberate:
      // this value is needed at BUILD time, and supplying it as a Workers
      // Builds "build variable" is the classic way to have the widget render
      // with an empty key and silently never appear. A default removes that
      // failure mode entirely. Override with PUBLIC_TURNSTILE_SITE_KEY in
      // .env when testing with Turnstile's always-pass test keys.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '0x4AAAAAAEanWjZIZR-tG2cl',
      }),

      // Secrets. Never in the repo - set with `wrangler secret put`.
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Plain vars, set in wrangler.jsonc.
      CONTACT_TO: envField.string({ context: 'server', access: 'public', optional: true }),
      CONTACT_FROM: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
});
