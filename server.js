const http = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");
const { PORT, POSTS_DIR, PUBLIC_DIR, SITE } = require("./config/site");
const { createPostService } = require("./lib/posts");
const { createRenderer } = require("./lib/renderers");
const { slugify } = require("./lib/utils");

const postService = createPostService({
  postsDir: POSTS_DIR,
  site: SITE,
});

const renderer = createRenderer({ site: SITE });

function send(res, status, contentType, body) {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");

  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": buffer.length,
    "Cache-Control": "no-store",
  });

  res.end(buffer);
}

async function serveStylesheet(reqUrl, res) {
  if (reqUrl.pathname !== "/styles.css" && reqUrl.pathname !== "/KTBlog.png") return false;

  try {
    if (reqUrl.pathname === "/styles.css") {
      const css = await readFile(path.join(PUBLIC_DIR, "styles.css"), "utf8");
      send(res, 200, "text/css; charset=utf-8", css);
      return true;
    }

    const logo = await readFile(path.join(PUBLIC_DIR, "KTBlog.png"));
    send(res, 200, "image/png", logo);
  } catch {
    send(res, 404, "text/plain; charset=utf-8", "Not found");
  }

  return true;
}

function getFeedFilters(reqUrl) {
  return {
    query: reqUrl.searchParams.get("q")?.trim() || "",
    tag: slugify(reqUrl.searchParams.get("tag")?.trim() || ""),
  };
}

async function renderHome(_, res) {
  const posts = await postService.listPosts();
  send(res, 200, "text/html; charset=utf-8", renderer.renderHomePage(posts));
}

async function renderFeed(reqUrl, res) {
  const filters = getFeedFilters(reqUrl);
  const posts = postService.filterPosts(await postService.listPosts(), filters);

  send(res, 200, "text/html; charset=utf-8", renderer.renderFeedPage(posts, filters));
}

function renderAbout(_, res) {
  send(res, 200, "text/html; charset=utf-8", renderer.renderAboutPage());
}

async function renderRss(_, res) {
  const posts = await postService.listPosts();
  send(res, 200, "application/rss+xml; charset=utf-8", renderer.renderRss(posts));
}

async function renderPost(reqUrl, res) {
  const slugMatch = reqUrl.pathname.match(/^\/post\/([^/]+)$/);
  if (!slugMatch) return false;

  const slug = decodeURIComponent(slugMatch[1]);
  const posts = await postService.listPosts();
  const post = posts.find((entry) => entry.slug === slug);

  if (!post) {
    send(res, 404, "text/html; charset=utf-8", renderer.renderNotFoundPage());
    return true;
  }

  send(res, 200, "text/html; charset=utf-8", renderer.renderPostPage(post, posts));
  return true;
}

const routes = {
  "/": renderHome,
  "/feed": renderFeed,
  "/about": renderAbout,
  "/rss.xml": renderRss,
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (await serveStylesheet(reqUrl, res)) return;

  const routeHandler = routes[reqUrl.pathname];
  if (routeHandler) {
    await routeHandler(reqUrl, res);
    return;
  }

  if (await renderPost(reqUrl, res)) return;

  send(res, 404, "text/html; charset=utf-8", renderer.renderNotFoundPage());
});

server.listen(PORT, () => {
  console.log(`Kuber Tech Blog running on http://localhost:${PORT}`);
});
