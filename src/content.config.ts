import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    title: z.string(),
    description: z.string(),
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
