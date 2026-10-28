# tahins.me

Personal site of E. M. Yeaseenur Rahman Tahin. Static [Astro](https://astro.build) site, hosted on Netlify.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home: hero, current projects, collapsed archive, profile, contact |
| `/#projects` | Current work grid, with Archive as a `<details>` list below |
| `/#profile` | Profile |
| `/#contact` | Contact |
| `/blog/` | Blog index |
| `/blog/<slug>/` | A post |
| `/blog/tags/<tag>/` | Posts with that tag |
| `/blog/rss.xml` | RSS |
| `/sitemap-index.xml` | Sitemap |

## Scripts

```bash
npm install
npm run dev          # local preview
npm run build        # production build + internal link check
npm test             # Medium import + service worker tests
npm run import:medium  # refresh posts from Medium RSS / export zip
```

Requires Node.js 22+.

## Write a post (plain Git)

1. Create a branch from `master`.
2. Add a Markdown (or MDX) file under `src/content/blog/`. The filename is the URL slug: `src/content/blog/my-post.md` becomes `https://tahins.me/blog/my-post/`.
3. Use this frontmatter:

```md
---
title: My post title
description: One or two sentences for listings, RSS, and social cards.
pubDate: 2026-10-28T12:00:00.000Z
updatedDate: 2026-10-29T12:00:00.000Z   # optional
tags:
  - engineering
draft: false
featured: false                        # optional; true lists the post under Popular
heroImage: https://images.unsplash.com/photo-xxxxx
heroImageCredit:                        # optional, shown for Unsplash photos
  photographer: Jane Doe
  photographerUrl: https://unsplash.com/@jane
  unsplashUrl: https://unsplash.com
originalUrl: https://tahins.medium.com/ccf34a785233   # Medium story id
---

Your post in Markdown. Unsplash images stay as remote URLs. Screenshots belong in
`src/assets/blog/<slug>/` and are referenced with a relative path.
```

4. Push the branch. Netlify will build a deploy preview.
5. Check the preview, then merge to publish. `draft: true` posts are omitted from production builds, RSS, and the sitemap.

## Import from Medium

Tahin can download Medium’s official data export (Settings → Download your information). The zip contains `posts/*.html`.

```bash
npm run import:medium -- --zip ~/Downloads/medium-export.zip
```

Without a zip, the script imports the public RSS feed (`https://medium.com/feed/@tahins`, recent posts only) plus HTML under `scripts/data/public-posts/` for older public articles the feed no longer carries. When a zip is passed, it is the source of truth; RSS and the HTML dir merge in without duplicating story ids.

Re-run the importer when a new export is available; it overwrites Markdown for matching slugs and removes posts that are no longer in the sources.

`originalUrl` is stored as `https://tahins.medium.com/<story-id>`. Bangla posts use transliterated English slugs (see `SLUG_BY_STORY_ID` in `scripts/lib/medium-import.mjs`).

## Analytics

Universal Analytics `UA-43970194-1` was removed. There is a marked placeholder in `src/layouts/BaseLayout.astro` for GA4 or Netlify Analytics.
