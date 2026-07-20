const path = require("node:path");
const { readFile, readdir } = require("node:fs/promises");
const { parseFrontMatter, renderMarkdown } = require("./markdown");
const {
  slugify,
  slugToTitle,
  normalizeDate,
  formatDisplayDate,
  splitTags,
  estimateReadingTime,
} = require("./utils");

function createPostService({ postsDir, site }) {
  async function loadPostFromFile(fileName) {
    const filePath = path.join(postsDir, fileName);
    const raw = await readFile(filePath, "utf8");
    const { meta, body } = parseFrontMatter(raw);
    const sourceSlug = fileName.replace(/\.md$/i, "");
    const title = meta.title || slugToTitle(sourceSlug);

    return {
      slug: meta.slug || slugify(title || sourceSlug),
      sourceSlug,
      title,
      date: normalizeDate(meta.date),
      displayDate: formatDisplayDate(meta.date),
      summary: meta.summary || `${title} from ${site.name}.`,
      tags: splitTags(meta.tags),
      readingTime: estimateReadingTime(body),
      html: renderMarkdown(body),
      body,
    };
  }

  async function listPosts() {
    let names;

    try {
      names = await readdir(postsDir);
    } catch {
      return [];
    }

    const posts = [];
    const markdownFiles = names.filter((name) => name.toLowerCase().endsWith(".md"));

    for (const fileName of markdownFiles) {
      try {
        posts.push(await loadPostFromFile(fileName));
      } catch {
        // Ignore unreadable posts.
      }
    }

    posts.sort((left, right) => (right.date || "").localeCompare(left.date || ""));

    return posts;
  }

  function filterPosts(posts, filters) {
    const normalizedQuery = (filters.query || "").toLowerCase();
    const normalizedTag = filters.tag || "";

    return posts.filter((post) => {
      const matchesQuery = !normalizedQuery
        || `${post.title} ${post.summary} ${post.tags.join(" ")} ${post.body}`.toLowerCase().includes(normalizedQuery);
      const matchesTag = !normalizedTag || post.tags.some((tag) => slugify(tag) === normalizedTag);

      return matchesQuery && matchesTag;
    });
  }

  return {
    listPosts,
    filterPosts,
  };
}

module.exports = {
  createPostService,
};
