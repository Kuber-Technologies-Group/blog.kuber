# Kuber Tech Blog

A lightweight Node.js tech blog for `Kuber.co.zw`, built without frameworks or external runtime dependencies.

## What’s included

- Branded homepage and about page for `Kuber.co.zw`
- Markdown-driven posts from `posts/`
- Search and tag filtering on the home page
- Reading-time badges and related articles
- Basic SEO metadata and an RSS feed at `/rss.xml`

## Run locally

```bash
node server.js
```

Then open `http://localhost:3000`.

## Content workflow

Create a markdown file in `posts/`:

`posts/my-first-post.md`

Optional front matter:

```md
---
title: "My First Post"
date: "2026-04-24"
tags: "hosting, websites, kuber"
summary: "One sentence summary."
slug: "my-first-post"
---
```

If `slug` is omitted, the app generates one from the title.

## Files

- `server.js` — HTTP server, markdown rendering, routes, RSS, and SEO metadata
- `public/styles.css` — site styling
- `posts/` — markdown articles
