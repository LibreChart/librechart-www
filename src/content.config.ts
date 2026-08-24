import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Note: from 'astro/zod', not 'astro:content'. And this is Zod 4 - top-level
// validators (z.email(), z.url()), not the chained z.string().email() form.
import { z } from 'astro/zod';

const blog = defineCollection({
  // `[^_]` lets a work-in-progress be parked as _draft-name.md and skipped
  // by the loader entirely, rather than needing a frontmatter flag.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(300),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Aaron Ellison'),
    tags: z.array(z.string()).default([]),
    // Drafts render in `astro dev` and are excluded from `astro build`.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
