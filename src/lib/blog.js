import { getCollection } from 'astro:content';
import { readingLabel, readingMinutes } from './reading-time.js';
import { postSlug } from './slugs.js';

export { readingLabel, readingMinutes };

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postPath(post) {
  return `/blog/${postSlug(post)}/`;
}

const BENGALI_SCRIPT = /[\u0980-\u09FF]/;

/** Bangla posts get lang="bn" on the article. */
export function postLang(post) {
  const title = post?.data?.title || '';
  const body = post?.body || '';
  return BENGALI_SCRIPT.test(title) || BENGALI_SCRIPT.test(body) ? 'bn' : 'en';
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function isRemoteImage(src = '') {
  return /^https?:\/\//.test(src);
}

export function isUnsplashImage(src = '') {
  return /images\.unsplash\.com/i.test(src);
}

export function firstContentImage(body = '') {
  const markdown = String(body).match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  if (markdown) return markdown[1];
  const html = String(body).match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return html ? html[1] : null;
}

export function previewSource(post) {
  return post?.data?.heroImage || firstContentImage(post?.body || '');
}

/** List, RSS, and share text. `excerpt` overrides the imported Medium description. */
export function postExcerpt(post) {
  const excerpt = post?.data?.excerpt;
  if (typeof excerpt === 'string' && excerpt.trim()) return excerpt.trim();
  return post?.data?.description || '';
}

export function tagCounts(posts, limit = 10) {
  const map = new Map();
  for (const post of posts) {
    for (const tag of post.data.tags || []) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export function featuredPosts(posts, limit = 5) {
  return posts.filter((post) => post.data.featured).slice(0, limit);
}
