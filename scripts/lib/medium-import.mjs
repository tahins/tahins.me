/**
 * Convert Medium posts (official export zip, RSS, or post HTML)
 * into Markdown files for the Astro blog collection.
 */
import { Buffer } from 'node:buffer';
import { mkdir, readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import JSZip from 'jszip';
import TurndownService from 'turndown';
import { stringify as stringifyYaml } from 'yaml';

export const DEFAULT_RSS_URL = 'https://medium.com/feed/@tahins';
export const SITE_ORIGIN = 'https://tahins.me';

/**
 * Readable slugs for Bangla posts. Medium export filenames for these are
 * mostly dashes, and the URL path is percent-encoded Bengali.
 * Tahin can rename any of these in git; list them in the PR.
 */
export const SLUG_BY_STORY_ID = {
  df686b6e20f5: 'nyay-o-ihsan',
  eb3e2a421c17: 'tin-ti-jama-surah-yusuf',
  '79348dc0e0b1': 'protita-kajer-samne-duto-proshno',
  eef7ed9450d4: 'shotto-ki-ar-mithya-ki',
  '691e2717e8fc': 'durbol-sei-onneshonkari',
  '597067493830': 'mobile-e-thakun-gr-er-sathe',
  b0898a050790: 'enable-google-now-in-non-supported-countries',
};

/**
 * Medium export filenames for responses use the parent story title.
 * These two are comments, not posts — import as draft even if the HTML
 * is missing p-in-reply-to.
 */
export const RESPONSE_FILENAME_HINTS = [
  /your[-_. ]*dramatic[-_. ]*intro/i,
  /one[-_. ]*might[-_. ]*never[-_. ]*figure[-_. ]*it[-_. ]*out/i,
];

export const MEDIUM_IMAGE_HOST =
  /(?:cdn-images-\d+\.medium\.com|miro\.medium\.com)/i;
const MEDIUM_CDN = MEDIUM_IMAGE_HOST;
const TRACKING_IMG = /medium\.com\/_\/stat/i;
const UNSPLASH_HOST = /(?:images\.)?unsplash\.com/i;

/**
 * Medium CDN copies of Unsplash photos found in Tahin's public RSS.
 * RSS wraps Unsplash as cdn-images-1.medium.com; we hotlink the original.
 * Verified by comparing the Medium CDN image to the Unsplash original.
 */
export const KNOWN_UNSPLASH_ORIGINALS = {
  '0*bxqz9ssorobrdb2q': {
    url: 'https://images.unsplash.com/photo-1542219550-2da790bf52e9?auto=format&fit=crop&w=1600&q=80',
    photographer: 'Mnz',
    photographerUrl: 'https://unsplash.com/@mnzoutfits',
    unsplashUrl: 'https://unsplash.com/photos/AIE1_Kp5Zp4',
  },
  '0*vvakigagswt02g4z': {
    url: 'https://images.unsplash.com/photo-1429743305873-d4065c15f93e?auto=format&fit=crop&w=1600&q=80',
    photographer: 'Jens Lelie',
    photographerUrl: 'https://unsplash.com/@madebyjens',
    unsplashUrl: 'https://unsplash.com/photos/u0vgcIOQG08',
  },
  '0*tm5mqiojf42cmzkj': {
    url: 'https://images.unsplash.com/photo-1484069560501-87d72b0c3669?auto=format&fit=crop&w=1600&q=80',
    photographer: 'Emily Morter',
    photographerUrl: 'https://unsplash.com/@emilymorter',
    unsplashUrl: 'https://unsplash.com/photos/8xAA0f9yQnE',
  },
  '0*hiy3jgwyb0fl39sn': {
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=80',
    photographer: 'Robert Collins',
    photographerUrl: 'https://unsplash.com/@robbie36',
    unsplashUrl: 'https://unsplash.com/photos/tvc5imO5pXk',
  },
};

export function mediumImageKey(src = '') {
  const decoded = decodeURIComponent(String(src));
  const match = decoded.match(/((?:0|1)\*[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)?)/);
  if (!match) return '';
  return match[1].replace(/\.$/, '').toLowerCase();
}

export function isMediumCdn(src = '') {
  return MEDIUM_CDN.test(src);
}

export function findMediumImageHosts(text = '') {
  const urls = String(text).match(/https?:\/\/[^\s"'<>]+/gi) || [];
  return urls.filter((url) => isMediumCdn(url));
}

export function isUnsplashUrl(src = '') {
  return UNSPLASH_HOST.test(src);
}

export function isTrackingPixel(src = '') {
  return TRACKING_IMG.test(src);
}

export function canonicalMediumUrl(url = '') {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return String(url).split('?')[0];
  }
}

export function mediumStoryId(url = '', filename = '') {
  const texts = [];
  if (url) {
    try {
      const parsed = new URL(url);
      texts.push(decodeURIComponent(parsed.pathname));
    } catch {
      texts.push(String(url).split('?')[0].split('#')[0]);
    }
  }
  if (filename) texts.push(filename);
  for (const value of texts) {
    const match = String(value).match(/([a-f0-9]{12,16})(?:\.html)?\/?$/i);
    if (match) return match[1].toLowerCase();
  }
  return '';
}

export function storyPermalink(url = '', filename = '') {
  const id = mediumStoryId(url, filename);
  return id ? `https://tahins.medium.com/${id}` : canonicalMediumUrl(url);
}

export function isDashHeavySlug(slug = '') {
  const ascii = String(slug).replace(/[^a-z0-9]/gi, '');
  return ascii.length < 3;
}

export function isStoryIdSlug(slug = '') {
  return /^[a-f0-9]{12,16}$/i.test(slug);
}

export function slugFromMediumUrl(url = '', title = '', filename = '') {
  const id = mediumStoryId(url, filename);
  if (id && SLUG_BY_STORY_ID[id]) return SLUG_BY_STORY_ID[id];

  let fromPath = '';
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const last = pathname.split('/').filter(Boolean).pop() || '';
    const withoutId = last.replace(/-[a-f0-9]{8,16}$/i, '');
    fromPath = sanitizeSlug(withoutId && withoutId !== last ? withoutId : last);
  } catch {
    // fall through
  }

  if (
    fromPath &&
    !isDashHeavySlug(fromPath) &&
    !isStoryIdSlug(fromPath) &&
    !/[\u0980-\u09FF]/.test(fromPath)
  ) {
    return fromPath;
  }

  const fromTitle = slugifyTitle(title);
  if (fromTitle && fromTitle !== 'post') return fromTitle;
  if (id) return `post-${id}`;
  return fromPath || 'post';
}

export function slugifyTitle(title = '') {
  const ascii = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return ascii || 'post';
}

export function sanitizeSlug(value = '') {
  return String(value)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[/?#]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'post';
}

export function excerptFromHtml(html = '', maxLength = 220) {
  const $ = load(`<div>${html}</div>`);
  $('script, style, figure, img, iframe').remove();
  $('p, h1, h2, h3, h4, li, blockquote').each((_, node) => {
    const el = $(node);
    el.append(' ');
  });
  const text = $('div')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

export function parseRssXml(xml = '') {
  const $ = load(xml, { xml: true });
  const items = [];
  $('item').each((_, item) => {
    const el = $(item);
    const title = textOf(el.find('title').first());
    const link = textOf(el.find('link').first());
    const guid = textOf(el.find('guid').first());
    const pubDate = parseDate(textOf(el.find('pubDate').first()));
    const updated =
      parseDate(textOf(el.find('atom\\:updated, updated').first())) || undefined;
    const tags = el
      .find('category')
      .toArray()
      .map((node) => textOf($(node)))
      .filter((tag) => tag && tag.toLowerCase() !== 'tahin rahman');
    const html =
      el.find('content\\:encoded').html() ||
      el.find('encoded').html() ||
      el.find('description').html() ||
      '';
    items.push({
      title,
      originalUrl: storyPermalink(link || guid),
      slug: slugFromMediumUrl(link || guid, title),
      pubDate,
      updatedDate: updated && updated.getTime() !== pubDate?.getTime() ? updated : undefined,
      tags,
      html: decodeRssHtml(html),
      source: 'rss',
    });
  });
  return items;
}

function textOf(node) {
  if (!node || node.length === 0) return '';
  return node.text().replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function decodeRssHtml(html = '') {
  return html
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
}

export function parseDate(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function parseExportHtml(html = '', filename = '') {
  const $ = load(html);
  const article = $('article').first();
  const title =
    article.find('h1.p-name, h1').first().text().trim() ||
    $('title').first().text().trim();
  const canonical =
    article.find('a.p-canonical').attr('href') ||
    $('link[rel="canonical"]').attr('href') ||
    '';
  const published =
    article.find('time.dt-published').attr('datetime') ||
    article.find('time').attr('datetime') ||
    '';
  const updated =
    article.find('time.dt-updated').attr('datetime') || '';
  const tags = article
    .find('footer a[href*="/tagged/"], footer .p-category, a.p-category')
    .toArray()
    .map((node) => $(node).text().trim())
    .filter(Boolean);
  const contentHtml =
    article.find('section.e-content').html() ||
    article.find('.e-content').html() ||
    article.find('section').last().html() ||
    article.html() ||
    $('body').html() ||
    '';

  let pubDate = parseDate(published);
  if (!pubDate && filename) {
    const fromName = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (fromName) pubDate = parseDate(`${fromName[1]}T00:00:00.000Z`);
  }

  const draft = isMediumResponse(html, filename);
  return {
    title,
    originalUrl: storyPermalink(canonical, filename),
    slug: slugFromMediumUrl(canonical, title, filename),
    pubDate,
    updatedDate: parseDate(updated),
    tags,
    html: contentHtml,
    source: 'export',
    filename,
    draft,
  };
}

export function isMediumResponse(html = '', filename = '') {
  if (RESPONSE_FILENAME_HINTS.some((re) => re.test(filename))) return true;
  const $ = load(html);
  if ($('.p-in-reply-to, a.p-in-reply-to').length) return true;
  const footer = $('footer').text();
  if (/in response to/i.test(footer)) return true;
  if (/response/i.test(filename) && /in-reply-to|p-in-reply-to/i.test(html)) return true;
  return false;
}

function createTurndown() {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
  });

  turndown.addRule('mediumPre', {
    filter: 'pre',
    replacement(_, node) {
      const text = (node.textContent || '').replace(/\u00a0/g, ' ').replace(/\n$/, '');
      return `\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
    },
  });

  turndown.addRule('unsplashFigure', {
    filter(node) {
      if (node.nodeName !== 'FIGURE') return false;
      const img = firstDescendant(node, 'IMG');
      return Boolean(img && isUnsplashUrl(img.getAttribute('src') || ''));
    },
    replacement(_, node) {
      const img = firstDescendant(node, 'IMG');
      return `\n\n${unsplashFigureHtml({
        src: img?.getAttribute('src') || '',
        alt: img?.getAttribute('alt') || '',
        credit: creditFromCaptionNode(firstDescendant(node, 'FIGCAPTION')),
      })}\n\n`;
    },
  });

  turndown.addRule('figcaption', {
    filter: 'figcaption',
    replacement(content) {
      const text = content.trim();
      return text ? `\n\n*${text}*\n\n` : '';
    },
  });

  // Keep Unsplash as a raw HTML hotlink so Astro does not download/optimize it.
  turndown.addRule('unsplashImg', {
    filter: (node) =>
      node.nodeName === 'IMG' && isUnsplashUrl(node.getAttribute('src') || ''),
    replacement(_, node) {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      return `\n\n${unsplashFigureHtml({ src, alt })}\n\n`;
    },
  });

  turndown.addRule('iframeEmbed', {
    filter: 'iframe',
    replacement(_, node) {
      const src = node.getAttribute('src') || '';
      if (!src) return '';
      return `\n\n[Embedded media](${src})\n\n`;
    },
  });

  turndown.addRule('gistLink', {
    filter: (node) =>
      node.nodeName === 'A' && /gist\.github\.com/i.test(node.getAttribute('href') || ''),
    replacement(content, node) {
      const href = node.getAttribute('href');
      return `[${content || 'Gist'}](${href})`;
    },
  });

  return turndown;
}

function creditFromFigure($, figure) {
  const caption = figure.find('figcaption').text().replace(/\s+/g, ' ').trim();
  const unsplashLinks = figure
    .find('a[href*="unsplash.com"]')
    .toArray()
    .map((a) => $(a).attr('href'))
    .filter(Boolean);
  const photographerLink = unsplashLinks.find((href) => /unsplash\.com\/@/i.test(href));
  const photoLink = unsplashLinks.find((href) => /unsplash\.com\/photos\//i.test(href));
  const unsplashHome = unsplashLinks.find((href) => /unsplash\.com\/?$/i.test(href.split('?')[0]));
  const byMatch = caption.match(/Photo by\s+(.+?)\s+on\s+Unsplash/i);
  if (!byMatch && !photographerLink && !photoLink) {
    return caption.toLowerCase().includes('unsplash')
      ? {
          photographer: (photographerLink || '').split('/').pop() || 'Unsplash photographer',
          photographerUrl: cleanUnsplashHref(photographerLink),
          unsplashUrl: cleanUnsplashHref(photoLink || unsplashHome || 'https://unsplash.com'),
        }
      : null;
  }
  const photographer = (byMatch?.[1] || figure.find('a[href*="unsplash.com/@"]').text() || '').trim();
  return {
    photographer: photographer || 'Unsplash photographer',
    photographerUrl: cleanUnsplashHref(photographerLink),
    unsplashUrl: cleanUnsplashHref(photoLink || unsplashHome || 'https://unsplash.com'),
  };
}

function cleanUnsplashHref(href = '') {
  if (!href) return undefined;
  try {
    const u = new URL(href);
    u.search = '';
    return u.toString();
  } catch {
    return href.split('?')[0];
  }
}

function pickUnsplashPage(...urls) {
  const photos = urls.find((url) => url && /unsplash\.com\/photos\//i.test(url));
  if (photos) return photos;
  return urls.find(Boolean);
}

function unsplashOriginalFromHref(href = '') {
  const match = String(href).match(/unsplash\.com\/photos\/(?:[\w-]+-)?([A-Za-z0-9_-]{8,})/);
  if (!match) return null;
  return `https://unsplash.com/photos/${match[1]}`;
}

function lookupKnownUnsplash(src, credit) {
  const key = mediumImageKey(src);
  const known = KNOWN_UNSPLASH_ORIGINALS[key];
  if (known) {
    return {
      url: known.url,
      credit: {
        photographer: credit?.photographer || known.photographer,
        photographerUrl: credit?.photographerUrl || known.photographerUrl,
        unsplashUrl: pickUnsplashPage(credit?.unsplashUrl, known.unsplashUrl),
      },
    };
  }
  return null;
}

export function rewriteImages(html = '', { slug = 'post' } = {}) {
  const $ = load(`<div id="root">${html}</div>`);
  $('pre br').replaceWith('\n');
  const images = [];
  let mediumIndex = 0;

  $('img').each((_, node) => {
    const img = $(node);
    const src = img.attr('src') || img.attr('data-src') || '';
    if (!src || isTrackingPixel(src)) {
      img.remove();
      return;
    }

    const figure = img.closest('figure');
    const credit = figure.length ? creditFromFigure($, figure) : null;
    const alt = img.attr('alt') || '';
    const key = mediumImageKey(src);
    const looksUnsplash = Boolean(credit) || isUnsplashUrl(src);

    if (looksUnsplash) {
      const known = lookupKnownUnsplash(src, credit);
      const fromHref = credit?.unsplashUrl && /\/photos\//.test(credit.unsplashUrl)
        ? unsplashOriginalFromHref(credit.unsplashUrl)
        : null;
      const resolvedUrl =
        (isUnsplashUrl(src) ? src : null) ||
        known?.url ||
        (fromHref ? `${fromHref}` : null) ||
        src;
      const resolvedCredit = known?.credit || credit;
      images.push({
        originalUrl: src,
        rewrittenUrl: resolvedUrl,
        kind: 'unsplash',
        credit: resolvedCredit,
        localized: false,
        key,
      });
      img.attr('src', isUnsplashUrl(resolvedUrl) ? resolvedUrl : src);
      if (resolvedCredit && figure.length) {
        const photographerLabel = resolvedCredit.photographerUrl
          ? `<a href="${resolvedCredit.photographerUrl}">${resolvedCredit.photographer}</a>`
          : resolvedCredit.photographer;
        const unsplashLabel = resolvedCredit.unsplashUrl
          ? `<a href="${resolvedCredit.unsplashUrl}">Unsplash</a>`
          : 'Unsplash';
        figure.find('figcaption').remove();
        figure.append(
          `<figcaption>Photo by ${photographerLabel} on ${unsplashLabel}</figcaption>`,
        );
      }
      return;
    }

    if (isMediumCdn(src)) {
      mediumIndex += 1;
      const ext = extensionFromUrl(src) || 'jpg';
      const filename = `image-${mediumIndex}${ext.startsWith('.') ? ext : `.${ext}`}`;
      const localRel = `../../assets/blog/${slug}/${filename}`;
      images.push({
        originalUrl: miroUrl(src),
        rewrittenUrl: localRel,
        kind: 'medium',
        localized: true,
        filename,
        key,
      });
      img.attr('src', localRel);
      return;
    }

    images.push({
      originalUrl: src,
      rewrittenUrl: src,
      kind: 'remote',
      localized: false,
      key,
    });
  });

  $('iframe').each((_, node) => {
    const iframe = $(node);
    const src = iframe.attr('src') || '';
    if (!src) return;
    if (/youtube\.com|youtu\.be/i.test(src)) {
      iframe.replaceWith(`<p><a href="${src}">Watch on YouTube</a></p>`);
    } else if (/gist\.github\.com/i.test(src)) {
      iframe.replaceWith(`<p><a href="${src}">View gist</a></p>`);
    }
  });

  const body = $('#root').html() || '';
  return { html: body, images };
}

function extensionFromUrl(src = '') {
  const clean = src.split('?')[0];
  const ext = path.extname(clean);
  if (ext && ext.length <= 5) return ext;
  if (/\.gif$/i.test(clean) || src.includes('.gif')) return '.gif';
  if (/\.png$/i.test(clean) || src.includes('.png')) return '.png';
  if (/\.webp$/i.test(clean)) return '.webp';
  return '.jpg';
}

export function miroUrl(src = '') {
  if (/miro\.medium\.com/i.test(src)) return src;
  const keyMatch = src.match(/((?:0|1)\*[^*\s/?]+)/);
  if (keyMatch) {
    return `https://miro.medium.com/v2/resize:fit:1400/${keyMatch[1]}`;
  }
  return src;
}

export function htmlToMarkdown(html = '', { slug = 'post' } = {}) {
  const rewritten = rewriteImages(html, { slug });
  const turndown = createTurndown();
  let markdown = turndown.turndown(rewritten.html).trim();
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  // Astro's image pipeline drops an empty alt attribute, so give
  // Medium's blank alts a decorative label the checker can see.
  markdown = markdown.replace(/!\[\]\(/g, '![Illustration](');
  return {
    markdown,
    images: rewritten.images,
  };
}

export function toMarkdownFile(post) {
  const slug =
    post.slug || slugFromMediumUrl(post.originalUrl, post.title, post.filename);
  const converted = htmlToMarkdown(post.html || '', { slug });
  const hero = converted.images.find((img) => img.kind === 'unsplash' || img.kind === 'medium' || img.kind === 'remote');
  const frontmatter = {
    title: post.title,
    description: post.description || excerptFromHtml(post.html || ''),
    pubDate: formatDay(post.pubDate),
    tags: post.tags || [],
    draft: Boolean(post.draft),
  };
  if (post.updatedDate) frontmatter.updatedDate = formatDay(post.updatedDate);
  if (hero) frontmatter.heroImage = hero.rewrittenUrl;
  if (hero?.credit) frontmatter.heroImageCredit = hero.credit;
  if (post.originalUrl) frontmatter.originalUrl = storyPermalink(post.originalUrl, post.filename);

  const yaml = stringifyYaml(frontmatter, { lineWidth: 0 }).trimEnd();
  let body = converted.markdown;
  if (hero?.kind === 'unsplash' && hero.rewrittenUrl) {
    const figure = unsplashFigureHtml({
      src: hero.rewrittenUrl,
      alt: '',
      credit: hero.credit,
    });
    if (!body.includes(hero.rewrittenUrl)) {
      body = `${figure}\n\n${body}`;
    }
  }

  return {
    slug,
    filename: `${slug}.md`,
    markdown: `---\n${yaml}\n---\n\n${body}\n`,
    images: converted.images,
    frontmatter,
  };
}

export function unsplashFigureHtml({ src, alt = '', credit } = {}) {
  const img = `<img src="${src}" alt="${escapeAttr(alt)}" loading="lazy" />`;
  if (!credit?.photographer) {
    return `<figure>\n${img}\n</figure>`;
  }
  const name = credit.photographerUrl
    ? `<a href="${escapeAttr(credit.photographerUrl)}">${escapeHtml(credit.photographer)}</a>`
    : escapeHtml(credit.photographer);
  const unsplash = credit.unsplashUrl
    ? `<a href="${escapeAttr(credit.unsplashUrl)}">Unsplash</a>`
    : 'Unsplash';
  return `<figure>\n${img}\n<figcaption class="unsplash-credit">Photo by ${name} on ${unsplash}</figcaption>\n</figure>`;
}

function firstDescendant(root, tagName) {
  const want = String(tagName).toUpperCase();
  const visit = (node) => {
    if (!node) return null;
    if (String(node.nodeName || '').toUpperCase() === want) return node;
    const children = node.childNodes || node.children || [];
    for (let i = 0; i < children.length; i += 1) {
      const found = visit(children[i]);
      if (found) return found;
    }
    return null;
  };
  const children = root?.childNodes || root?.children || [];
  for (let i = 0; i < children.length; i += 1) {
    const found = visit(children[i]);
    if (found) return found;
  }
  return null;
}

function creditFromCaptionNode(caption) {
  if (!caption) return null;
  const links = [];
  const walk = (node) => {
    if (!node) return;
    if (String(node.nodeName || '').toUpperCase() === 'A') links.push(node);
    const children = node.childNodes || node.children || [];
    for (let i = 0; i < children.length; i += 1) walk(children[i]);
  };
  walk(caption);
  const photographerLink = links.find((a) => /unsplash\.com\/@/i.test(a.getAttribute?.('href') || ''));
  const photoLink = links.find((a) => /unsplash\.com\/photos\//i.test(a.getAttribute?.('href') || ''));
  const byMatch = (caption.textContent || '').match(/Photo by\s+(.+?)\s+on\s+Unsplash/i);
  const photographer = (photographerLink?.textContent || byMatch?.[1] || '').trim();
  if (!photographer && !photographerLink && !photoLink) return null;
  return {
    photographer: photographer || 'Unsplash photographer',
    photographerUrl: photographerLink?.getAttribute?.('href') || undefined,
    unsplashUrl: photoLink?.getAttribute?.('href') || undefined,
  };
}

function creditMarkdown(credit) {
  const name = credit.photographerUrl
    ? `[${credit.photographer}](${credit.photographerUrl})`
    : credit.photographer;
  const unsplash = credit.unsplashUrl ? `[Unsplash](${credit.unsplashUrl})` : 'Unsplash';
  return `${name} on ${unsplash}`;
}

function escapeAttr(value = '') {
  return String(value).replace(/"/g, '&quot;');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDay(date) {
  const d = parseDate(date);
  if (!d) return undefined;
  return d.toISOString();
}

export async function importFromRssXml(xml, options = {}) {
  const items = parseRssXml(xml);
  return writePosts(items, options);
}

export async function parseExportZip(zipBuffer) {
  const zip = await JSZip.loadAsync(zipBuffer);
  const posts = [];
  const files = Object.keys(zip.files).filter((name) =>
    /(?:^|\/)posts\/.+\.html$/i.test(name) && !zip.files[name].dir,
  );
  for (const name of files) {
    const html = await zip.files[name].async('string');
    posts.push(parseExportHtml(html, path.basename(name)));
  }
  return posts;
}

export async function importFromExportZip(zipBuffer, options = {}) {
  const posts = await parseExportZip(zipBuffer);
  return writePosts(posts, options);
}

export async function importFromHtmlFiles(files, options = {}) {
  const posts = files.map(({ filename, html }) => parseExportHtml(html, filename));
  return writePosts(posts, options);
}

export async function writePosts(posts, options = {}) {
  const outDir = options.outDir;
  const assetsDir = options.assetsDir;
  const download = options.download !== false;
  const written = [];
  const report = {
    found: posts.length,
    imported: 0,
    localizedImages: [],
    unsplashImages: [],
    remainingMediumCdn: [],
    skipped: [],
  };

  const seen = new Set();
  for (const post of posts) {
    if (!post.title || !post.html) {
      report.skipped.push({ reason: 'missing-title-or-html', originalUrl: post.originalUrl });
      continue;
    }
    const file = toMarkdownFile(post);
    if (seen.has(file.slug)) {
      report.skipped.push({ reason: 'duplicate-slug', slug: file.slug, originalUrl: post.originalUrl });
      continue;
    }
    seen.add(file.slug);

    if (outDir) {
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, file.filename), file.markdown, 'utf8');
    }

    for (const image of file.images) {
      if (image.kind === 'unsplash') {
        report.unsplashImages.push({
          slug: file.slug,
          originalMediumUrl: image.originalUrl,
          unsplashUrl: image.rewrittenUrl,
          photographer: image.credit?.photographer,
        });
      } else if (image.kind === 'medium') {
        const destDir = assetsDir
          ? path.join(assetsDir, file.slug)
          : undefined;
        let destPath;
        if (destDir && image.filename) {
          await mkdir(destDir, { recursive: true });
          destPath = path.join(destDir, image.filename);
          if (download) {
            await downloadBinary(image.originalUrl, destPath);
          }
        }
        report.localizedImages.push({
          slug: file.slug,
          originalUrl: image.originalUrl,
          localPath: destPath
            ? path.posix.join('src/assets/blog', file.slug, image.filename)
            : image.rewrittenUrl,
        });
      } else if (isMediumCdn(image.originalUrl) || isMediumCdn(image.rewrittenUrl)) {
        report.remainingMediumCdn.push({
          slug: file.slug,
          url: image.rewrittenUrl || image.originalUrl,
        });
      }
    }

    report.imported += 1;
    written.push({
      ...file,
      originalUrl: post.originalUrl,
      title: post.title,
      draft: Boolean(post.draft),
    });
  }

  if (options.replaceExisting && outDir) {
    await removeStaleOutputs(outDir, assetsDir, written);
  }

  return { written, report };
}

async function removeStaleOutputs(outDir, assetsDir, written) {
  const keepFiles = new Set(written.map((file) => file.filename));
  const keepSlugs = new Set(written.map((file) => file.slug));
  try {
    const names = await readdir(outDir);
    for (const name of names) {
      if (name.endsWith('.md') && !keepFiles.has(name)) {
        await unlink(path.join(outDir, name));
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!assetsDir) return;
  try {
    const dirs = await readdir(assetsDir, { withFileTypes: true });
    for (const entry of dirs) {
      if (entry.isDirectory() && !keepSlugs.has(entry.name)) {
        await rm(path.join(assetsDir, entry.name), { recursive: true, force: true });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function downloadBinary(url, destPath) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'tahins.me-medium-import/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

export async function readHtmlDir(dir) {
  const names = await readdir(dir);
  const files = [];
  for (const name of names) {
    if (!name.endsWith('.html')) continue;
    const html = await readFile(path.join(dir, name), 'utf8');
    files.push({ filename: name, html });
  }
  return files;
}

export function mergePosts(groups) {
  const byKey = new Map();
  for (const post of groups.flat()) {
    const id = mediumStoryId(post.originalUrl, post.filename);
    const key = id || canonicalMediumUrl(post.originalUrl) || post.title;
    if (!byKey.has(key)) byKey.set(key, post);
  }
  return [...byKey.values()];
}

export async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'tahins.me-medium-import/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}
