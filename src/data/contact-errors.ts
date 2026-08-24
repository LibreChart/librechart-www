/**
 * Lives outside src/pages/ for two reasons: a .ts file under pages/ would
 * become a route, and Astro hoists getStaticPaths into its own scope where it
 * cannot see consts declared in the same frontmatter block.
 */
export const CONTACT_ERRORS = {
  validation: {
    heading: 'Check the form',
    lede: 'Something in the form did not look right - usually a missing field or an email address with a typo. Nothing was sent.',
  },
  turnstile: {
    heading: 'We could not verify you are human',
    lede: 'The spam check did not complete. That is usually a stale page or a blocked script. Reload the form and try once more.',
  },
  server: {
    heading: 'Something went wrong on our end',
    lede: 'That is our fault, not yours. Please email hello@librechart.org directly and we will pick it up.',
  },
} as const;

export type ContactErrorKind = keyof typeof CONTACT_ERRORS;
