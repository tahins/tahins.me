export const blogImages = import.meta.glob('../assets/blog/**/*.{jpeg,jpg,png,gif,webp}', {
  eager: true,
  import: 'default',
});

export function localBlogImage(src = '') {
  if (!src || /^https?:\/\//i.test(src)) return null;
  const needle = String(src).replace(/^.*assets\/blog\//, '');
  const key = Object.keys(blogImages).find((path) => path.endsWith(needle));
  return key ? blogImages[key] : null;
}
