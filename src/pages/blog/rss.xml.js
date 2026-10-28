import rss from '@astrojs/rss';
import { getPublishedPosts, postExcerpt, postPath } from '../../lib/blog.js';
import { site } from '../../data/site.js';

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${site.shortName} blog`,
    description: site.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: postExcerpt(post),
      pubDate: post.data.pubDate,
      link: postPath(post),
      categories: post.data.tags,
    })),
  });
}
