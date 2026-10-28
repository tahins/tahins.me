const UNSPLASH_PHOTO = /^(https:\/\/images\.unsplash\.com\/photo-[^?]+)/i;

export function unsplashBase(src = '') {
  const match = String(src).match(UNSPLASH_PHOTO);
  return match ? match[1] : String(src).split('?')[0];
}

export function unsplashSized(src, width = 800) {
  return `${unsplashBase(src)}?w=${width}&fm=webp&q=75`;
}

export function unsplashSrcset(src, widths = [400, 800, 1200]) {
  return widths.map((width) => `${unsplashSized(src, width)} ${width}w`).join(', ');
}
