const { escapeHtml } = require("./utils");

function parseFrontMatter(markdown) {
  if (!markdown.startsWith("---\n")) return { meta: {}, body: markdown };
  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) return { meta: {}, body: markdown };

  const rawMeta = markdown.slice(4, end).trim();
  const body = markdown.slice(end + "\n---\n".length);
  const meta = {};

  for (const line of rawMeta.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    meta[key] = value;
  }

  return { meta, body };
}

function renderInlineMarkdown(text) {
  let formatted = escapeHtml(text);

  formatted = formatted.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeLabel = escapeHtml(label);
    const safeHref = escapeHtml(href);
    const isExternal = !safeHref.startsWith("/");
    const rel = isExternal ? ' rel="noreferrer"' : "";
    const target = isExternal ? ' target="_blank"' : "";

    return `<a href="${safeHref}"${target}${rel}>${safeLabel}</a>`;
  });

  return formatted;
}

function renderMarkdown(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const output = [];

  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines = [];
  let inList = false;

  function closeList() {
    if (!inList) return;
    output.push("</ul>");
    inList = false;
  }

  function closeCodeBlock() {
    if (!inCodeBlock) return;

    const code = escapeHtml(codeLines.join("\n"));
    const className = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : "";
    output.push(`<pre><code${className}>${code}</code></pre>`);

    inCodeBlock = false;
    codeLanguage = "";
    codeLines = [];
  }

  for (const line of lines) {
    const fence = line.match(/^```(\w+)?\s*$/);

    if (fence) {
      if (inCodeBlock) {
        closeCodeBlock();
      } else {
        closeList();
        inCodeBlock = true;
        codeLanguage = fence[1] || "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem) {
      if (!inList) {
        output.push("<ul>");
        inList = true;
      }
      output.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    closeList();
    output.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  closeList();
  closeCodeBlock();

  return output.join("\n");
}

module.exports = {
  parseFrontMatter,
  renderMarkdown,
};
