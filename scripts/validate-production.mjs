#!/usr/bin/env node
/**
 * Da Vinci Studio — Production Validation Script
 *
 * Runs a battery of automated checks against the live URL.
 * Execute AFTER deployment and DNS propagation are complete.
 *
 * Usage:
 *   node scripts/validate-production.mjs
 *   node scripts/validate-production.mjs https://davincistudio.pages.dev   (preview)
 *   node scripts/validate-production.mjs https://davincistudio.ae          (production)
 */

const BASE = process.argv[2] ?? 'https://davincistudio.ae';
const TIMEOUT_MS = 15_000;

// ─── Utilities ───────────────────────────────────────────────────────────────

const pass  = (msg) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const fail  = (msg) => { console.log(`  \x1b[31m[FAIL]\x1b[0m ${msg}`); failures++; };
const warn  = (msg) => console.log(`  \x1b[33m[WARN]\x1b[0m ${msg}`);
const info  = (msg) => console.log(`  \x1b[36m[INFO]\x1b[0m ${msg}`);
const head  = (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`);

let failures = 0;

async function get(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: opts.redirect ?? 'follow',
      ...opts,
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function head_req(path) {
  return get(path, { method: 'HEAD', redirect: 'manual' });
}

// ─── Test suites ─────────────────────────────────────────────────────────────

async function checkRouting() {
  head('§1 Routing & 404');

  // Public pages
  for (const route of ['/', '/case-study/', '/architecture/']) {
    const r = await get(route);
    if (r.ok) pass(`${route} → ${r.status}`);
    else fail(`${route} → ${r.status} (expected 200)`);
  }

  // 404
  const r404 = await get('/this-page-does-not-exist');
  if (r404.status === 404) pass('/nonexistent → 404');
  else fail(`/nonexistent → ${r404.status} (expected 404)`);

  // Dev pages should return 200 but noindex (they exist, just not indexed)
  for (const route of ['/hero-demo/', '/index-new/']) {
    const r = await get(route);
    if (r.ok) {
      const html = await r.text();
      if (html.includes('noindex')) pass(`${route} → 200 + noindex`);
      else warn(`${route} → 200 but noindex not found in HTML`);
    } else {
      info(`${route} → ${r.status}`);
    }
  }
}

async function checkSecurity() {
  head('§2 Security Headers');

  const r = await get('/');
  const h = r.headers;

  const checks = [
    ['x-frame-options',         'DENY',                              'X-Frame-Options'],
    ['x-content-type-options',  'nosniff',                           'X-Content-Type-Options'],
    ['referrer-policy',         'strict-origin-when-cross-origin',   'Referrer-Policy'],
  ];

  for (const [header, expected, label] of checks) {
    const val = h.get(header) ?? '';
    if (val.toLowerCase().includes(expected.toLowerCase())) pass(`${label}: ${val}`);
    else fail(`${label} missing or incorrect (got: "${val}", expected includes: "${expected}")`);
  }

  const csp = h.get('content-security-policy') ?? '';
  if (csp.includes('frame-ancestors')) pass(`CSP present (${csp.length} chars)`);
  else fail(`CSP missing or incomplete`);

  const perms = h.get('permissions-policy') ?? '';
  if (perms.includes('camera=()')) pass(`Permissions-Policy: ${perms.substring(0,60)}...`);
  else warn(`Permissions-Policy not found (may be set at CDN level)`);
}

async function checkCache() {
  head('§3 Cache Headers');

  // HTML should never be cached
  const rHtml = await get('/');
  const htmlCC = rHtml.headers.get('cache-control') ?? '';
  if (htmlCC.includes('max-age=0') || htmlCC.includes('must-revalidate') || htmlCC.includes('no-cache')) {
    pass(`HTML Cache-Control: ${htmlCC}`);
  } else {
    warn(`HTML Cache-Control may be too aggressive: "${htmlCC}" (expected must-revalidate or no-cache)`);
  }

  // _astro/* should be immutable
  // Get the HTML, extract one _astro URL
  const html = await (await get('/')).text();
  const assetMatch = html.match(/\/_astro\/[A-Za-z0-9._%-]+\.(?:js|css)/);
  if (assetMatch) {
    const rAsset = await get(assetMatch[0]);
    const assetCC = rAsset.headers.get('cache-control') ?? '';
    if (assetCC.includes('immutable') || assetCC.includes('max-age=31536000')) {
      pass(`/_astro/* Cache-Control: ${assetCC}`);
    } else {
      fail(`/_astro/* asset not immutable: "${assetCC}"`);
    }
  } else {
    warn('Could not extract _astro asset URL from HTML to test cache');
  }
}

async function checkSEO() {
  head('§4 SEO & Meta');

  const html = await (await get('/')).text();

  const seoChecks = [
    ['<title>',                      'Title tag',                html.includes('<title>')],
    ['meta description',             'Meta description',         html.includes('name="description"')],
    ['canonical',                    'Canonical link',           html.includes('rel="canonical"')],
    ['og:title',                     'OG title',                 html.includes('og:title')],
    ['og:image',                     'OG image',                 html.includes('og:image')],
    ['twitter:card',                 'Twitter card',             html.includes('twitter:card')],
    ['application/ld+json',          'JSON-LD structured data',  html.includes('application/ld+json')],
    ['index, follow',                'Robots index',             html.includes('index, follow')],
  ];

  for (const [, label, result] of seoChecks) {
    if (result) pass(label);
    else fail(`${label} not found in homepage HTML`);
  }

  // Sitemap
  const rSitemap = await get('/sitemap-index.xml');
  if (rSitemap.ok) {
    const xml = await rSitemap.text();
    const urlCount = (xml.match(/<loc>/g) ?? []).length;
    pass(`sitemap-index.xml reachable (${urlCount} sitemap entries)`);
  } else {
    fail(`sitemap-index.xml → ${rSitemap.status}`);
  }

  // Sitemap URLs
  const rSitemap0 = await get('/sitemap-0.xml');
  if (rSitemap0.ok) {
    const xml = await rSitemap0.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    info(`Sitemap URLs: ${urls.join(', ')}`);
    const hasIndex = urls.some(u => u.endsWith('.ae/') || u.endsWith('.ae'));
    const hasCaseStudy = urls.some(u => u.includes('/case-study'));
    const hasArch = urls.some(u => u.includes('/architecture'));
    if (hasIndex && hasCaseStudy && hasArch) pass('All 3 public pages in sitemap');
    else fail(`Sitemap missing expected URLs: ${urls.join(', ')}`);
  }

  // Robots.txt
  const rRobots = await get('/robots.txt');
  if (rRobots.ok) {
    const txt = await rRobots.text();
    if (txt.includes('Sitemap:')) pass('robots.txt reachable + contains Sitemap directive');
    else warn('robots.txt reachable but Sitemap directive not found');
  } else {
    fail(`robots.txt → ${rRobots.status}`);
  }
}

async function checkOGImages() {
  head('§5 OG Images');

  for (const [slug, label] of [
    ['/og/home.svg',         'Homepage OG image'],
    ['/og/case-study.svg',   'Case study OG image'],
    ['/og/architecture.svg', 'Architecture OG image'],
  ]) {
    const r = await get(slug);
    if (r.ok) pass(`${label}: ${slug} → ${r.status}`);
    else fail(`${label}: ${slug} → ${r.status}`);
  }
}

async function checkWwwRedirect() {
  head('§6 www Redirect');

  try {
    const wwwUrl = BASE.replace('https://', 'https://www.');
    if (wwwUrl === BASE) {
      info('Skipping www redirect check — BASE URL already has www');
      return;
    }
    const r = await get(wwwUrl, { redirect: 'manual' });
    if (r.status === 301 || r.status === 308) {
      const loc = r.headers.get('location') ?? '';
      pass(`www → ${r.status} → ${loc}`);
    } else {
      warn(`www returned ${r.status} (may be OK if CF handles at DNS level)`);
    }
  } catch {
    warn('www redirect check skipped (DNS may not be propagated)');
  }
}

async function checkHTTPS() {
  head('§7 HTTPS & Redirects');

  try {
    const httpUrl = BASE.replace('https://', 'http://');
    const r = await get(httpUrl, { redirect: 'manual' });
    if (r.status === 301 || r.status === 308) {
      const loc = r.headers.get('location') ?? '';
      if (loc.startsWith('https://')) pass(`HTTP → HTTPS redirect: ${r.status} → ${loc}`);
      else warn(`HTTP redirect destination is not HTTPS: ${loc}`);
    } else {
      warn(`HTTP → ${r.status} (expected 301 redirect to HTTPS)`);
    }
  } catch {
    warn('HTTP→HTTPS check skipped (may be network-level redirect)');
  }
}

async function checkPerformanceHints() {
  head('§8 Performance Hints');

  const html = await (await get('/')).text();
  const htmlSize = new TextEncoder().encode(html).length;
  info(`Homepage HTML size: ${(htmlSize / 1024).toFixed(1)} KB`);
  if (htmlSize < 50 * 1024) pass('Homepage HTML under 50 KB');
  else warn(`Homepage HTML is ${(htmlSize/1024).toFixed(1)} KB — consider if this is expected`);

  // Check for preconnect hints
  if (html.includes('preconnect')) pass('Font preconnect hints present');
  else warn('No preconnect hints found');

  // Verify Three.js is not loaded from CDN
  if (!html.includes('cdn.jsdelivr.net') && !html.includes('unpkg.com')) {
    pass('Three.js: no CDN dependency detected');
  } else {
    warn('External CDN reference found — verify Three.js is not loading from CDN');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n\x1b[1mDa Vinci Studio — Production Validation\x1b[0m`);
  console.log(`Target: \x1b[36m${BASE}\x1b[0m`);
  console.log(`Time:   ${new Date().toISOString()}\n`);

  try {
    await checkRouting();
    await checkSecurity();
    await checkCache();
    await checkSEO();
    await checkOGImages();
    await checkWwwRedirect();
    await checkHTTPS();
    await checkPerformanceHints();
  } catch (e) {
    console.error('\n\x1b[31mValidation script error:\x1b[0m', e.message);
    process.exit(2);
  }

  console.log('\n' + '─'.repeat(50));
  if (failures === 0) {
    console.log(`\x1b[32m✓ All checks passed.\x1b[0m`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m✗ ${failures} check(s) failed. Review output above.\x1b[0m`);
    process.exit(1);
  }
}

main();
