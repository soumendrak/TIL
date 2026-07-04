#!/usr/bin/env node
/* ============================================================
   TIL build — turns posts/*.md into public/data.js
   ------------------------------------------------------------
   Each post is a Markdown file with YAML front matter. This
   script validates every post, renders the body to HTML, fills
   in derived fields (read time, preview) and writes a single
   generated data.js consumed by the static site.

   Run:  pnpm build         (write public/data.js)
         pnpm check         (validate only, no write)

   A validation error fails the build with a non-zero exit code
   so a malformed post can never reach production.
   ============================================================ */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { marked } from 'marked';

/* Parse front matter with the JSON schema so YAML never coerces a value
   behind our back — e.g. "2026-13-99" stays a string we can reject,
   instead of js-yaml rolling it into a valid Date. */
const MATTER_OPTS = {
  engines: { yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) },
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = join(ROOT, 'posts');
const OUT_FILE = join(ROOT, 'public', 'data.js');

const SITE = 'https://til.soumendrak.com';
const OG_IMAGE = `${SITE}/icon-180.png`; // ponytail: reuse the app icon; swap for a 1200×630 og-image.png when one exists
const AUTHOR = 'Soumendra Kumar Sahoo';
/* Root-level pages that share the public/ dir with per-post files — never
   treat these as stale post pages to delete. */
const RESERVED_HTML = new Set(['index.html', 'til.html', 'topic.html']);

const CHECK_ONLY = process.argv.includes('--check');

/* ---- field rules -------------------------------------------------- */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KNOWN_KEYS = new Set(['title', 'date', 'tags', 'read', 'preview']);
const TITLE_MAX = 80;
const PREVIEW_MAX = 280;
const READ_MIN = 1;
const READ_MAX = 30;
const WORDS_PER_MIN = 200;

/* ---- console helpers ---------------------------------------------- */
const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

/**
 * Collects validation errors and warnings for a single post so the
 * build can report every problem at once instead of failing on the
 * first one.
 */
class PostIssues {
  constructor(file) {
    this.file = file;
    this.errors = [];
    this.warnings = [];
  }
  error(msg) {
    this.errors.push(msg);
  }
  warn(msg) {
    this.warnings.push(msg);
  }
}

/** Returns true when `value` is a non-empty, non-whitespace string. */
function isFilledString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validates that `date` is a real calendar date in YYYY-MM-DD form. */
function isRealDate(date) {
  if (!DATE_RE.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Estimates reading time in minutes from the raw Markdown body. */
function estimateReadMinutes(body) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(READ_MIN, Math.round(words / WORDS_PER_MIN) || READ_MIN);
}

/** Strips HTML tags and collapses whitespace into plain text. */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Builds a preview string from the first paragraph of rendered HTML. */
function derivePreview(html) {
  const match = html.match(/<p>([\s\S]*?)<\/p>/i);
  const text = stripHtml(match ? match[1] : html);
  if (text.length <= PREVIEW_MAX) return text;
  const clipped = text.slice(0, PREVIEW_MAX - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 40 ? lastSpace : clipped.length)}…`;
}

/**
 * Parses and validates one Markdown post.
 *
 * @param {string} file  Markdown filename, e.g. "my-post.md".
 * @param {string} raw   Full file contents.
 * @returns {{post: object|null, issues: PostIssues}}
 */
function parsePost(file, raw) {
  const issues = new PostIssues(file);
  const slug = basename(file, '.md');

  if (!SLUG_RE.test(slug)) {
    issues.error(
      `filename "${file}" is not a kebab-case slug (lowercase, digits, single hyphens)`,
    );
  }

  let parsed;
  try {
    parsed = matter(raw, MATTER_OPTS);
  } catch (err) {
    issues.error(`front matter is not valid YAML: ${err.message}`);
    return { post: null, issues };
  }

  const fm = parsed.data || {};
  const body = parsed.content || '';

  for (const key of Object.keys(fm)) {
    if (!KNOWN_KEYS.has(key)) {
      issues.warn(`unknown front matter key "${key}" — ignored`);
    }
  }

  /* title */
  if (!isFilledString(fm.title)) {
    issues.error('missing required field "title"');
  } else {
    if (fm.title.length > TITLE_MAX) {
      issues.warn(`title is ${fm.title.length} chars (recommended ≤ ${TITLE_MAX})`);
    }
    if (fm.title.trim().endsWith('.')) {
      issues.warn('title should not end with a period');
    }
  }

  /* date */
  if (fm.date == null) {
    issues.error('missing required field "date"');
  } else {
    const dateStr = fm.date instanceof Date
      ? fm.date.toISOString().slice(0, 10)
      : String(fm.date).trim();
    if (!isRealDate(dateStr)) {
      issues.error(`"date" must be a real YYYY-MM-DD date (got "${fm.date}")`);
    } else {
      fm.date = dateStr;
    }
  }

  /* tags */
  if (!Array.isArray(fm.tags) || fm.tags.length === 0) {
    issues.error('"tags" must be a non-empty list, e.g. tags: [python, cli]');
  } else {
    for (const tag of fm.tags) {
      if (typeof tag !== 'string' || !TAG_RE.test(tag)) {
        issues.error(`tag "${tag}" must be lowercase kebab-case`);
      }
    }
    if (fm.tags.length > 4) {
      issues.warn(`${fm.tags.length} tags — 1 to 3 keeps the feed tidy`);
    }
  }

  /* read (optional, auto-derived) */
  let read = fm.read;
  if (read == null) {
    read = estimateReadMinutes(body);
  } else if (
    typeof read !== 'number' ||
    !Number.isInteger(read) ||
    read < READ_MIN ||
    read > READ_MAX
  ) {
    issues.error(`"read" must be a whole number of minutes (${READ_MIN}-${READ_MAX})`);
    read = estimateReadMinutes(body);
  }

  /* body */
  if (!isFilledString(body)) {
    issues.error('post body is empty — write the Markdown content below the front matter');
  }
  if (/^#\s/m.test(body)) {
    issues.warn('body uses a level-1 heading (#) — the title is already the page H1, use ## instead');
  }

  /* render */
  let html = '';
  try {
    html = marked.parse(body, { async: false, gfm: true, breaks: false }).trim();
  } catch (err) {
    issues.error(`Markdown failed to render: ${err.message}`);
  }

  /* preview (optional, auto-derived) */
  let preview = fm.preview;
  if (preview == null || !isFilledString(preview)) {
    preview = derivePreview(html);
  } else {
    preview = preview.trim();
    if (preview.length > PREVIEW_MAX) {
      issues.warn(`preview is ${preview.length} chars (max ${PREVIEW_MAX}) — it will be trimmed`);
      preview = `${preview.slice(0, PREVIEW_MAX - 1)}…`;
    }
  }

  if (issues.errors.length) return { post: null, issues };

  return {
    post: {
      slug,
      title: fm.title.trim(),
      date: fm.date,
      read,
      tags: fm.tags,
      preview,
      content: html,
    },
    issues,
  };
}

/** Escapes a string for safe use inside an HTML attribute value. */
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Builds the per-post <head> meta block: Open Graph, Twitter, JSON-LD. */
function metaTags(post) {
  const url = `${SITE}/${post.slug}.html`;
  const title = escAttr(post.title);
  const desc = escAttr(post.preview);
  const tagMeta = post.tags
    .map((t) => `<meta property="article:tag" content="${escAttr(t)}" />`)
    .join('\n');
  /* Escape "<" so post content can never break out of the script element. */
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.preview,
    datePublished: post.date,
    keywords: post.tags.join(', '),
    url,
    author: { '@type': 'Person', name: AUTHOR },
  }).replace(/</g, '\\u003c');
  return [
    '<meta property="og:type" content="article" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="article:published_time" content="${post.date}" />`,
    tagMeta,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="description" content="${desc}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n');
}

/* Render one static HTML file per post so JS-blind social scrapers
   (Twitter/X, LinkedIn, WhatsApp, Slack) and search crawlers see per-post
   title/description/image instead of the shared client-rendered shell.
   Files live at the site root (public/<slug>.html) so the template's
   "./style.css" etc. resolve without rewriting. Each bakes window.__id so
   til.html's script renders the right post without a ?id query. */
function generatePostPages(posts) {
  const pub = join(ROOT, 'public');
  const template = readFileSync(join(pub, 'til.html'), 'utf8');
  const slugs = new Set(posts.map((p) => p.slug));

  /* drop stale per-post pages for deleted/renamed posts */
  for (const f of readdirSync(pub)) {
    if (f.endsWith('.html') && !RESERVED_HTML.has(f) && !slugs.has(basename(f, '.html'))) {
      rmSync(join(pub, f));
    }
  }

  for (const post of posts) {
    let html = template
      .replace(
        '<title>TIL — Dev Journal</title>',
        `<title>${escAttr(post.title)} — Dev Journal</title>`,
      )
      .replace(
        '<link rel="canonical" href="https://til.soumendrak.com/til/" />',
        `<link rel="canonical" href="${SITE}/${post.slug}.html" />`,
      )
      .replace('<meta property="og:type" content="article" />', metaTags(post))
      .replace(
        '<script src="./data.js',
        `<script>window.__id=${JSON.stringify(post.slug)};</script>\n<script src="./data.js`,
      );
    if (!html.includes(`content="${escAttr(post.title)}" />`)) {
      throw new Error(`OG tags not injected for "${post.slug}" — template markers changed?`);
    }
    writeFileSync(join(pub, `${post.slug}.html`), html);
  }
}

/* Stamp a content hash onto the app.js / style.css / data.js references
   in every HTML page. The CDN ignores our cache-control headers, so the
   URL itself is the only reliable cache key — a changed asset gets a new
   ?v= and can never be served stale against fresh HTML. */
function stampAssets() {
  const pub = join(ROOT, 'public');
  const assets = ['app.js', 'style.css', 'data.js'];
  const hash = createHash('sha256');
  for (const a of assets) hash.update(readFileSync(join(pub, a)));
  const version = hash.digest('hex').slice(0, 8);
  for (const file of ['index.html', 'til.html', 'topic.html']) {
    const path = join(pub, file);
    const html = readFileSync(path, 'utf8').replace(
      /\.\/(app\.js|style\.css|data\.js)(?:\?v=[^"']*)?/g,
      `./$1?v=${version}`,
    );
    writeFileSync(path, html);
  }
  return version;
}

/* ---- main --------------------------------------------------------- */
function main() {
  let files;
  try {
    files = readdirSync(POSTS_DIR).filter(
      (f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md',
    );
  } catch {
    console.error(c.red(`✗ posts directory not found: ${POSTS_DIR}`));
    process.exit(1);
  }

  files.sort();

  const posts = [];
  const seenSlugs = new Map();
  let errorCount = 0;
  let warnCount = 0;

  for (const file of files) {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf8');
    const { post, issues } = parsePost(file, raw);
    const slug = basename(file, '.md');

    if (seenSlugs.has(slug)) {
      issues.error(`duplicate slug "${slug}" — also defined by ${seenSlugs.get(slug)}`);
    } else {
      seenSlugs.set(slug, file);
    }

    for (const w of issues.warnings) {
      console.warn(`${c.yellow('⚠')} ${c.dim(file)}  ${w}`);
      warnCount++;
    }
    for (const e of issues.errors) {
      console.error(`${c.red('✗')} ${c.dim(file)}  ${e}`);
      errorCount++;
    }

    if (post && !issues.errors.length) posts.push(post);
  }

  if (errorCount) {
    console.error(
      c.red(`\n✗ build failed — ${errorCount} error(s) across ${files.length} post(s)`),
    );
    process.exit(1);
  }

  /* newest first, stable tiebreak on slug */
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

  if (posts.length === 0) {
    console.warn(c.yellow('⚠ no posts found in posts/ — data.js will be empty'));
  }

  if (CHECK_ONLY) {
    console.log(
      c.green(`✓ ${posts.length} post(s) valid`) +
        (warnCount ? c.yellow(` (${warnCount} warning(s))`) : ''),
    );
    return;
  }

  /* Deterministic output: no timestamp, so the committed data.js only
     changes when the posts change — clean diffs, stable drift checks. */
  const banner =
    '/* AUTO-GENERATED by scripts/build.mjs from posts/*.md — do not edit.\n' +
    '   Run "pnpm build" to regenerate, then commit this file with your post. */\n';
  const body = `window.TILS = ${JSON.stringify(posts, null, 2)};\n`;

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, banner + body);

  const version = stampAssets();
  generatePostPages(posts);

  console.log(
    c.green(`✓ wrote ${posts.length} post(s) → public/data.js`) +
      c.dim(` · assets stamped ?v=${version}`) +
      (warnCount ? c.yellow(` (${warnCount} warning(s))`) : ''),
  );
}

main();
