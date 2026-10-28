/** Lowercase a–z, 0–9, hyphens; no leading, trailing, or double hyphens. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value) {
  return typeof value === 'string' && SLUG_RE.test(value);
}

export function collectSlugErrors(posts = []) {
  const errors = [];
  const current = new Map();

  for (const post of posts) {
    const where = post.file ? ` in ${post.file}` : '';
    if (post.slug == null || post.slug === '') {
      errors.push(`missing slug${where}`);
      continue;
    }
    if (!isValidSlug(post.slug)) {
      errors.push(`invalid slug ${JSON.stringify(post.slug)}${where}`);
      continue;
    }
    if (current.has(post.slug)) {
      errors.push(
        `duplicate slug ${JSON.stringify(post.slug)}${where} (also ${current.get(post.slug)})`,
      );
    } else {
      current.set(post.slug, post.file || post.slug);
    }
  }

  const oldSeen = new Map();
  for (const post of posts) {
    const where = post.file ? ` in ${post.file}` : '';
    const olds = Array.isArray(post.old_slugs) ? post.old_slugs : [];
    for (const old of olds) {
      if (!isValidSlug(old)) {
        errors.push(`invalid old_slug ${JSON.stringify(old)}${where}`);
        continue;
      }
      if (old === post.slug) {
        errors.push(`old_slug ${JSON.stringify(old)} equals current slug${where}`);
      }
      if (current.has(old) && current.get(old) !== (post.file || post.slug)) {
        errors.push(
          `old_slug ${JSON.stringify(old)}${where} collides with current slug of ${current.get(old)}`,
        );
      }
      if (oldSeen.has(old)) {
        errors.push(
          `duplicate old_slug ${JSON.stringify(old)}${where} (also ${oldSeen.get(old)})`,
        );
      } else {
        oldSeen.set(old, post.file || post.slug);
      }
    }
  }

  return errors;
}

export function assertSlugs(posts) {
  const errors = collectSlugErrors(posts);
  if (errors.length) {
    throw new Error(`Blog slug check failed:\n- ${errors.join('\n- ')}`);
  }
}

export function netlifyRedirectLines(posts = []) {
  const lines = [];
  for (const post of posts) {
    if (!isValidSlug(post.slug)) continue;
    for (const old of post.old_slugs || []) {
      if (!isValidSlug(old)) continue;
      lines.push(`/blog/${old}/ /blog/${post.slug}/ 301`);
    }
  }
  return lines;
}

export function postSlug(post) {
  const slug = post?.data?.slug;
  if (!isValidSlug(slug)) {
    throw new Error(`Post is missing a valid slug: ${JSON.stringify(slug)}`);
  }
  return slug;
}
