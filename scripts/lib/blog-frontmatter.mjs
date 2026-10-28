import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export async function loadBlogFrontmatter(blogDir) {
  const names = (await readdir(blogDir)).filter((name) => /\.mdx?$/.test(name)).sort();
  const posts = [];
  for (const name of names) {
    const file = path.join(blogDir, name);
    const raw = await readFile(file, 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
      throw new Error(`Missing frontmatter in ${name}`);
    }
    const data = parseYaml(match[1]) ?? {};
    posts.push({
      file: name,
      slug: data.slug,
      old_slugs: Array.isArray(data.old_slugs) ? data.old_slugs : [],
    });
  }
  return posts;
}
