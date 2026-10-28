import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SLUG_RE } from './lib/slugs.js';

const slugField = z
  .string()
  .regex(
    SLUG_RE,
    'slug must be lowercase a-z, 0-9, and hyphens (no leading, trailing, or double hyphens)',
  );

const unsplashCredit = z
  .object({
    photographer: z.string(),
    photographerUrl: z.string().optional(),
    unsplashUrl: z.string().optional(),
  })
  .optional();

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    slug: slugField,
    old_slugs: z.array(slugField).default([]),
    title: z.string(),
    description: z.string(),
    excerpt: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    heroImage: z.string().optional(),
    heroImageCredit: unsplashCredit,
    originalUrl: z.string().url().optional(),
  }),
});

export const collections = { blog };
