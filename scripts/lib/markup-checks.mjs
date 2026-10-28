const IMG_TAG = /<(?:img|Picture)\b[\s\S]*?>/g;
const ANCHOR_TAG = /<a\b[\s\S]*?>/gi;
const H1_TAG = /<h1\b/gi;
const EMPTY_HREF = /\bhref\s*=\s*(["'])\s*\1/i;

export function findImgsMissingAlt(html = '') {
  return [...html.matchAll(IMG_TAG)]
    .map((match) => match[0])
    .filter((tag) => !/\balt\s*=/i.test(tag));
}

export function findEmptyHrefs(html = '') {
  const empty = [];
  for (const match of html.matchAll(ANCHOR_TAG)) {
    const tag = match[0];
    if (EMPTY_HREF.test(tag) || !/\bhref\s*=/i.test(tag)) {
      empty.push(tag);
    }
  }
  return empty;
}

export function countH1(html = '') {
  return [...html.matchAll(H1_TAG)].length;
}
