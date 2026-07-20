const path = require("node:path");

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");
const PUBLIC_DIR = path.join(ROOT, "public");

const SITE = {
  name: "Kuber Tech Blog",
  shortName: "Kuber Technologies",
  domain: "kuber.co.zw",
  baseUrl: process.env.SITE_URL || `http://blog.kuber.co.zw`,
  description: "Practical insights on websites, hosting, email, cloud tools, and digital growth for Zimbabwean businesses.",
  tagline: "Build smarter online systems for growing businesses.",
  heroKicker: "Kuber Technologies Insights",
};

module.exports = {
  PORT,
  POSTS_DIR,
  PUBLIC_DIR,
  SITE,
};
