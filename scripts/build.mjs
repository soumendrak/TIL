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
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const FEED_FILE = join(ROOT, 'public', 'feed.atom');
const SITE = 'https://til.soumendrak.com';
const FEED_TITLE = 'Dev Journal — Today I Learned';

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

/** Escapes the five XML special characters for text/attribute content. */
function xmlEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Serializes posts to a valid Atom 1.0 feed string. */
function buildAtom(posts) {
  const permalink = (slug) => `${SITE}/til.html?id=${encodeURIComponent(slug)}`;
  // Post dates are date-only; Atom needs an xsd:dateTime. Midnight UTC is fine.
  const stamp = (date) => `${date}T00:00:00Z`;
  // posts arrive newest-first, so posts[0] is the freshest post.
  const updated = posts.length ? stamp(posts[0].date) : '1970-01-01T00:00:00Z';

  const entries = posts.map((p) => {
    const url = permalink(p.slug);
    const cats = p.tags
      .map((t) => `    <category term="${xmlEscape(t)}"/>`)
      .join('\n');
    return `  <entry>
    <title>${xmlEscape(p.title)}</title>
    <link href="${xmlEscape(url)}"/>
    <id>${xmlEscape(url)}</id>
    <updated>${stamp(p.date)}</updated>
    <published>${stamp(p.date)}</published>
    <summary>${xmlEscape(p.preview)}</summary>
${cats}
  </entry>`;
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(FEED_TITLE)}</title>
  <link href="${SITE}/"/>
  <link rel="self" type="application/atom+xml" href="${SITE}/feed.atom"/>
  <id>${SITE}/</id>
  <updated>${updated}</updated>
  <author><name>Soumendra Kumar Sahoo</name></author>
${entries.join('\n')}
</feed>
`;
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
  writeFileSync(FEED_FILE, buildAtom(posts));

  const version = stampAssets();

  console.log(
    c.green(`✓ wrote ${posts.length} post(s) → public/data.js, public/feed.atom`) +
      c.dim(` · assets stamped ?v=${version}`) +
      (warnCount ? c.yellow(` (${warnCount} warning(s))`) : ''),
  );
}

main();
