// @ts-check
import { defineConfig } from 'astro/config';

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

  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  // NOTE: the `env.schema` block (PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY,
  // RESEND_API_KEY, CONTACT_TO, CONTACT_FROM) is deliberately deferred to B6.
  // Declaring required vars before the keys exist would fail every build.
});
