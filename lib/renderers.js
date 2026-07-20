const { escapeHtml, slugify, buildAbsoluteUrl } = require("./utils");

const POPULAR_TOPICS = ["Web Hosting", "Email", "Cloud", "Websites", "Security"];

function createRenderer({ site }) {
  function absoluteUrl(pathname) {
    return buildAbsoluteUrl(site.baseUrl, pathname);
  }

  function buildShareMessage(post) {
    const parts = [post.title];
    if (post.summary) parts.push(post.summary);
    parts.push(absoluteUrl(`/post/${encodeURIComponent(post.slug)}`));
    return parts.join("\n\n");
  }

  function renderShareLink(post) {
    return `<a class="share-link" href="${escapeHtml(absoluteUrl(`/post/${encodeURIComponent(post.slug)}`))}" data-share-title="${escapeHtml(post.title)}" data-share-text="${escapeHtml(buildShareMessage(post))}">Share</a>`;
  }

  function renderPlatformShareLinks(post) {
    const postUrl = absoluteUrl(`/post/${encodeURIComponent(post.slug)}`);
    const shareMessage = buildShareMessage(post);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

    return `<div class="platform-share-links">
  ${renderShareLink(post)}
  <a class="share-button whatsapp" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noreferrer">WhatsApp</a>
  <a class="share-button linkedin" href="${escapeHtml(linkedInUrl)}" target="_blank" rel="noreferrer">LinkedIn</a>
</div>`;
  }

  function renderTagLink(tag, activeTag, basePath = "/feed") {
    const tagSlug = slugify(tag);
    const activeClass = tagSlug === activeTag ? " active" : "";

    return `<a class="tag-chip${activeClass}" href="${basePath}?tag=${encodeURIComponent(tagSlug)}">${escapeHtml(tag)}</a>`;
  }

  function renderLayout({ title, description, body, pathname = "/", ogType = "website" }) {
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description || site.description);
    const canonicalUrl = absoluteUrl(pathname);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="theme-color" content="#0F3F7A" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="icon" type="image/png" href="/KTBlog.png" />
    <link rel="apple-touch-icon" href="/KTBlog.png" />
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.name)} RSS Feed" href="/rss.xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="/">
          <svg class="brand-logo" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="6" y="6" rx="8" width="48" height="68" fill="#0F3F7A" />
            <path d="M38 18 58 40 38 62" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none" />
          </svg>
          <span>
            <strong>${escapeHtml(site.shortName)}</strong>
            <small>${escapeHtml(site.domain)}</small>
          </span>
        </a>
        <nav class="nav">
          <a href="/">Home</a>
          <a href="/feed">Feed</a>
          <a href="/about">About</a>
          <a href="/rss.xml">RSS</a>
        </nav>
      </div>
    </header>
    <main class="container">
      ${body}
    </main>
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <svg viewBox="0 0 300 80" width="150" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="6" y="6" rx="8" width="48" height="68" fill="#FFFFFF" />
            <path d="M38 18 58 40 38 62" stroke="#0F3F7A" stroke-width="6" stroke-linecap="round" fill="none" />
            <text fill="#FFFFFF" font-family="Inter,Roboto,Arial" font-weight="700" font-size="32" x="80" y="50">Kuber</text>
          </svg>
          <p>${escapeHtml(site.description)}</p>
        </div>
        <div class="footer-links">
          <a href="/feed">Latest posts</a>
          <a href="/about">Work with Kuber Technologies</a>
          <a href="https://${escapeHtml(site.domain)}" target="_blank" rel="noreferrer">Visit ${escapeHtml(site.domain)}</a>
        </div>
      </div>
    </footer>
    <script>
      document.addEventListener("click", async (event) => {
        const shareLink = event.target.closest(".share-link");
        if (!shareLink) return;

        event.preventDefault();

        const title = shareLink.dataset.shareTitle || document.title;
        const text = shareLink.dataset.shareText || shareLink.href;
        const url = shareLink.href;

        try {
          if (navigator.share) {
            await navigator.share({ title, text, url });
            return;
          }

          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            const originalText = shareLink.textContent;
            shareLink.textContent = "Copied";
            setTimeout(() => {
              shareLink.textContent = originalText;
            }, 1600);
            return;
          }

          window.prompt("Copy this share message:", text);
        } catch {
          window.prompt("Copy this share message:", text);
        }
      });
    </script>
  </body>
</html>`;
  }

  function renderHero(filters, totalPosts) {
    const tagPills = POPULAR_TOPICS.map((tag) => renderTagLink(tag, filters.tag, "/feed")).join("");
    const resultLabel = filters.query || filters.tag
      ? `${totalPosts} result${totalPosts === 1 ? "" : "s"}`
      : `${totalPosts} published article${totalPosts === 1 ? "" : "s"}`;

    return `<section class="hero">
  <div class="hero-copy">
    <span class="eyebrow">${escapeHtml(site.heroKicker)}</span>
    <h1>${escapeHtml(site.tagline)}</h1>
    <p>${escapeHtml(site.description)}</p>
    <div class="hero-actions">
      <a class="button primary" href="https://${escapeHtml(site.domain)}" target="_blank" rel="noreferrer">Visit ${escapeHtml(site.domain)}</a>
      <a class="button secondary" href="/rss.xml">Subscribe via RSS</a>
    </div>
  </div>
  <aside class="hero-panel">
    <div class="stat-card">
      <strong>${escapeHtml(resultLabel)}</strong>
      <span>Guides, explainers, and practical business tech tips.</span>
    </div>
    <form class="search-card" method="GET" action="/feed">
      <label for="q">Search articles</label>
      <div class="search-row">
        <input id="q" name="q" type="search" placeholder="Search hosting, websites, email..." value="${escapeHtml(filters.query || "")}" />
        <button type="submit">Search</button>
      </div>
      ${filters.tag ? `<input type="hidden" name="tag" value="${escapeHtml(filters.tag)}" />` : ""}
    </form>
  </aside>
  <div class="topic-row">${tagPills}</div>
</section>`;
  }

  function renderHomePage(posts) {
    const latestPost = posts[0];
    const recentPosts = posts.slice(1, 4);

    const spotlight = latestPost
      ? `<article class="homepage-feature">
  <span class="eyebrow">Latest Feature</span>
  <h2><a href="/post/${encodeURIComponent(latestPost.slug)}">${escapeHtml(latestPost.title)}</a></h2>
  <p class="summary">${escapeHtml(latestPost.summary)}</p>
  <div class="meta-row">
    <span class="meta">${escapeHtml([latestPost.displayDate, `${latestPost.readingTime} min read`].filter(Boolean).join(" • "))}</span>
    <div class="post-link-actions">
      ${renderShareLink(latestPost)}
      <a class="read-more" href="/post/${encodeURIComponent(latestPost.slug)}">Read featured post</a>
    </div>
  </div>
</article>`
      : `<article class="empty-state">
  <h2>No posts yet</h2>
  <p>Add markdown files in <code>posts/</code> to start publishing.</p>
</article>`;

    const recentCards = recentPosts
      .map(
        (post) => `<article class="mini-post-card">
  <span class="meta">${escapeHtml(post.displayDate || `${post.readingTime} min read`)}</span>
  <h3><a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
  <p>${escapeHtml(post.summary)}</p>
</article>`
      )
      .join("");

    const body = `<section class="hero home-hero">
  <div class="hero-copy">
    <span class="eyebrow">${escapeHtml(site.heroKicker)}</span>
    <h1>${escapeHtml(site.tagline)}</h1>
    <p>${escapeHtml(site.description)}</p>
    <div class="hero-actions">
      <a class="button primary" href="/feed">Open the feed</a>
      <a class="button secondary" href="https://${escapeHtml(site.domain)}" target="_blank" rel="noreferrer">Visit ${escapeHtml(site.domain)}</a>
    </div>
  </div>
  <aside class="hero-panel home-panel">
    <div class="stat-card">
      <strong>${posts.length} published article${posts.length === 1 ? "" : "s"}</strong>
      <span>Fresh insights on hosting, email, websites, and digital growth.</span>
    </div>
    <div class="quick-links">
      <a class="quick-link" href="/feed">Browse the feed</a>
      <a class="quick-link" href="/rss.xml">Subscribe via RSS</a>
      <a class="quick-link" href="/about">About Kuber Technologies</a>
    </div>
  </aside>
</section>
<section class="homepage-grid">
  ${spotlight}
  <div class="homepage-side">
    <article class="info-card">
      <h3>What you’ll find here</h3>
      <p>Clear, business-friendly articles that help teams choose better tools and build a stronger online presence.</p>
    </article>
    ${recentCards}
  </div>
</section>
<section class="feature-strip">
  <article>
    <h3>Hosting that performs</h3>
    <p>Learn how speed, uptime, and the right infrastructure affect business outcomes.</p>
  </article>
  <article>
    <h3>Email that builds trust</h3>
    <p>See why custom domain email matters for credibility, deliverability, and team workflows.</p>
  </article>
  <article>
    <h3>Digital systems that scale</h3>
    <p>Understand the practical setup decisions that help growing companies stay reliable online.</p>
  </article>
</section>`;

    return renderLayout({
      title: `${site.name} • Home`,
      description: site.description,
      body,
      pathname: "/",
    });
  }

  function renderFeedPage(posts, filters) {
    const [featuredPost, ...restPosts] = posts;

    const featuredCard = featuredPost
      ? `<article class="featured-feed-card">
  <div class="featured-label">Featured</div>
  <span class="meta">${escapeHtml([featuredPost.displayDate, `${featuredPost.readingTime} min read`].filter(Boolean).join(" • "))}</span>
  <h2><a href="/post/${encodeURIComponent(featuredPost.slug)}">${escapeHtml(featuredPost.title)}</a></h2>
  <p class="summary">${escapeHtml(featuredPost.summary)}</p>
  <div class="tag-list">${featuredPost.tags.map((tag) => renderTagLink(tag, filters.tag, "/feed")).join("")}</div>
  <div class="post-link-actions">
    ${renderShareLink(featuredPost)}
    <a class="read-more" href="/post/${encodeURIComponent(featuredPost.slug)}">Open article</a>
  </div>
</article>`
      : "";

    const feedCards = restPosts
      .map((post) => {
        const meta = [post.displayDate, `${post.readingTime} min read`].filter(Boolean).join(" • ");
        const tags = post.tags.map((tag) => renderTagLink(tag, filters.tag, "/feed")).join("");

        return `<article class="feed-card">
  <div class="feed-card-header">
    <div class="feed-avatar">K</div>
    <div>
      <strong>${escapeHtml(site.name)}</strong>
      <div class="meta">${escapeHtml(meta || "Latest update")}</div>
    </div>
  </div>
  <h2><a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>
  <p class="summary">${escapeHtml(post.summary)}</p>
  <div class="tag-list">${tags}</div>
  <div class="feed-actions">
    <span>💬 Discuss</span>
    ${renderShareLink(post)}
    <a class="read-more" href="/post/${encodeURIComponent(post.slug)}">Read more</a>
  </div>
</article>`;
      })
      .join("\n");

    const emptyState = `<article class="empty-state">
  <h2>No matching posts yet</h2>
  <p>Try a different keyword or remove the tag filter to browse everything.</p>
  <a class="button secondary" href="/feed">Clear filters</a>
</article>`;

    const sidebar = `<aside class="feed-sidebar">
  <article class="info-card">
    <h3>About the feed</h3>
    <p>This page is styled like a professional social platform so new content feels active, timely, and easy to scan.</p>
  </article>
  <article class="info-card">
    <h3>Popular topics</h3>
    <div class="tag-list">${POPULAR_TOPICS.map((tag) => renderTagLink(tag, filters.tag, "/feed")).join("")}</div>
  </article>
</aside>`;

    const body = `<section class="feed-layout">
  <div class="feed-main">
    ${featuredCard || emptyState}
    <section class="feed-list">
      ${feedCards}
    </section>
  </div>
  ${sidebar}
</section>`;

    return renderLayout({
      title: `${site.name} • Feed`,
      description: site.description,
      body,
      pathname: filters.query || filters.tag
        ? `/feed?q=${encodeURIComponent(filters.query || "")}&tag=${encodeURIComponent(filters.tag || "")}`
        : "/feed",
    });
  }

  function renderAboutPage() {
    const body = `<article class="prose prose-page">
  <span class="eyebrow">About ${escapeHtml(site.shortName)}</span>
  <h1>${escapeHtml(site.name)}</h1>
  <p>${escapeHtml(site.shortName)} publishes clear, business-friendly technology content for teams building their presence online.</p>
  <p>We focus on topics that matter in the real world: fast websites, reliable hosting, branded email, cloud tools, security, and the small technical details that improve trust.</p>
  <h2>What this blog covers</h2>
  <ul>
    <li>Hosting and website performance</li>
    <li>Custom domain email and communications</li>
    <li>Cloud services for growing businesses</li>
    <li>Practical security habits and setup guides</li>
  </ul>
  <!-- <h2>How the project works</h2>
  <p>This site is intentionally lightweight: posts live in <code>posts/</code>, pages are rendered by <code>server.js</code>, and the styling lives in <code>public/styles.css</code>.</p>
  <p><a href="https://${escapeHtml(site.domain)}" target="_blank" rel="noreferrer">Explore the main Kuber Technologies site</a> to connect the blog with your broader services and lead-generation flow.</p> -->
  </article>`;

    return renderLayout({
      title: `About • ${site.name}`,
      description: `About ${site.name}.`,
      body,
      pathname: "/about",
    });
  }

  function renderRelatedPosts(currentPost, posts) {
    const related = posts
      .filter((post) => post.slug !== currentPost.slug)
      .filter((post) => post.tags.some((tag) => currentPost.tags.includes(tag)))
      .slice(0, 3);

    if (!related.length) return "";

    const items = related
      .map(
        (post) => `<article class="related-card">
  <span class="meta">${escapeHtml(post.displayDate || `${post.readingTime} min read`)}</span>
  <h3><a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
  <p>${escapeHtml(post.summary)}</p>
</article>`
      )
      .join("");

    return `<section class="related-section">
  <h2>Related reading</h2>
  <div class="related-grid">${items}</div>
</section>`;
  }

  function renderPostPage(post, posts) {
    const meta = [post.displayDate, `${post.readingTime} min read`].filter(Boolean).join(" • ");
    const tags = post.tags.map((tag) => renderTagLink(tag, "", "/feed")).join("");
    const related = renderRelatedPosts(post, posts);
    const body = `<article class="prose article-shell">
  <a class="back" href="/feed">← Back to feed</a>
  <span class="eyebrow">Article</span>
  <h1>${escapeHtml(post.title)}</h1>
  ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}
  ${tags ? `<div class="tag-list post-tags">${tags}</div>` : ""}
  ${post.summary ? `<p class="lede">${escapeHtml(post.summary)}</p>` : ""}
  <section class="post-share-panel">
    <div>
      <strong>Share this article</strong>
      <p>Send a ready-made excerpt with the link to your audience.</p>
    </div>
    ${renderPlatformShareLinks(post)}
  </section>
  ${post.html}
</article>
${related}`;

    return renderLayout({
      title: `${post.title} • ${site.name}`,
      description: post.summary || site.description,
      body,
      pathname: `/post/${encodeURIComponent(post.slug)}`,
      ogType: "article",
    });
  }

  function renderNotFoundPage() {
    return renderLayout({
      title: `404 • ${site.name}`,
      description: "Not found",
      pathname: "/404",
      body: `<article class="prose prose-page">
  <h1>404</h1>
  <p>We couldn’t find that page.</p>
  <p><a href="/">Go back to the latest articles</a></p>
</article>`,
    });
  }

  function renderRss(posts) {
    const items = posts
      .map((post) => {
        const url = absoluteUrl(`/post/${encodeURIComponent(post.slug)}`);

        return `<item>
  <title>${escapeHtml(post.title)}</title>
  <link>${escapeHtml(url)}</link>
  <guid>${escapeHtml(url)}</guid>
  <description>${escapeHtml(post.summary)}</description>
  <pubDate>${escapeHtml(new Date(post.date || Date.now()).toUTCString())}</pubDate>
</item>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(site.name)}</title>
    <link>${escapeHtml(site.baseUrl)}</link>
    <description>${escapeHtml(site.description)}</description>
    ${items}
  </channel>
</rss>`;
  }

  return {
    renderHomePage,
    renderFeedPage,
    renderAboutPage,
    renderPostPage,
    renderNotFoundPage,
    renderRss,
  };
}

module.exports = {
  createRenderer,
};
