# Deployment Runbook — Da Vinci Studio
**davincistudio.ae · Cloudflare Pages · Astro static**

This is the single authoritative operator guide.  
Follow sections in order for a fresh deployment.  
For updates to an already-live site, skip to §4.

---

## §1 — Domain Registration

### Recommended registrar
Register `davincistudio.ae` at one of:
- **Namecheap** — cheapest renewal rates for `.ae`
- **GoDaddy** — direct `.ae` registration
- **Cloudflare Registrar** — preferred (zero markup, auto-renew, nameservers handled)

> `.ae` domains require UAE business/resident verification documents.  
> Processing can take 24–72 hours after submission.

### If registering at Cloudflare Registrar
1. Cloudflare → **Domain Registration** → search `davincistudio.ae`
2. Complete identity verification
3. Skip §2 below — nameservers are already Cloudflare's

### If registering elsewhere
Proceed to §2 after registration is confirmed.

---

## §2 — Move DNS to Cloudflare (if not using CF Registrar)

1. **Create a Cloudflare account** at https://dash.cloudflare.com/sign-up
2. **Add site** → enter `davincistudio.ae` → choose **Free plan**
3. Cloudflare scans existing DNS records (import any that appear)
4. Cloudflare provides two nameserver hostnames, e.g.:
   ```
   aria.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
5. Log into your registrar → find **"Change Nameservers"** for `davincistudio.ae`
6. Replace existing nameservers with Cloudflare's two
7. Save. Propagation: 5 min – 48 hours (usually < 1 hour)
8. Back in Cloudflare dashboard, click **"Check nameservers"** — wait for green ✓

---

## §3 — Cloudflare Pages: First Deployment

### 3.1 Create the project

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**
2. Click **"Connect to Git"** → authorize GitHub
3. Select repository: `sajedhamouda/sajed-portfolio`
4. Click **"Begin setup"**

### 3.2 Configure build settings

| Field | Value |
|---|---|
| Project name | `davincistudio` |
| Production branch | `astro-dark` *(promote to `main` when ready)* |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |

### 3.3 Environment variables

Click **"Environment variables (advanced)"** and add:

| Variable | Environment | Value |
|---|---|---|
| `NODE_VERSION` | Production + Preview | `22` |
| `PUBLIC_UMAMI_URL` | Production only | `https://umami.davincistudio.ae` *(when set up)* |
| `PUBLIC_UMAMI_SITE_ID` | Production only | *(from Umami dashboard)* |

> Analytics variables are optional. Leave blank to deploy without analytics.  
> They can be added later without redeploying the codebase.

### 3.4 Deploy

Click **"Save and Deploy"**.  
First build takes ~60–90 seconds.  
On success, Cloudflare assigns a preview URL like:
```
https://davincistudio.pages.dev
```
Bookmark this — it's your permanent staging URL.

### 3.5 Verify the preview deployment

Open `https://davincistudio.pages.dev` and confirm:
- [ ] Cinematic boot sequence plays
- [ ] Scroll progresses through all 5 scenes
- [ ] `/case-study` direct navigation works
- [ ] `/architecture` direct navigation works
- [ ] `/404` returns custom 404 page (try `/nonexistent`)
- [ ] No console errors in DevTools

---

## §4 — Connect Custom Domain

1. Cloudflare Pages → your project → **"Custom domains"** tab
2. Click **"Set up a custom domain"**
3. Enter: `davincistudio.ae`
4. Cloudflare will prompt you to add a DNS record. Since your DNS is already on Cloudflare:
   - It offers to add the record automatically → click **"Activate domain"**
5. Repeat for `www.davincistudio.ae`:
   - Add second custom domain: `www.davincistudio.ae`
   - This creates a CNAME pointing to the Pages project

### DNS records Cloudflare creates automatically:

| Type | Name | Value | Proxy |
|---|---|---|---|
| `CNAME` | `davincistudio.ae` | `davincistudio.pages.dev` | Proxied (orange cloud) |
| `CNAME` | `www` | `davincistudio.ae` | Proxied (orange cloud) |

### SSL/TLS
1. Cloudflare → **SSL/TLS** → set mode to **"Full (strict)"**
2. Cloudflare → **SSL/TLS** → **Edge Certificates** → enable:
   - **Always Use HTTPS**: ON
   - **Automatic HTTPS Rewrites**: ON
   - **Minimum TLS Version**: TLS 1.2
3. Certificate provisioning: automatic, usually < 5 minutes

### www redirect
Cloudflare Pages handles `www` → apex redirect automatically when both custom domains are added. Verify:
```
curl -I https://www.davincistudio.ae
# Expect: 301 → https://davincistudio.ae
```

---

## §5 — GitHub Actions Integration

### Add repository secrets
GitHub → repository → **Settings** → **Secrets and variables** → **Actions**

| Secret name | Where to find it |
|---|---|
| `CF_API_TOKEN` | Cloudflare → **My Profile** → **API Tokens** → Create token → "Edit Cloudflare Pages" template → scope to `davincistudio` project |
| `CF_ACCOUNT_ID` | Cloudflare dashboard URL: `dash.cloudflare.com/` **{this number}** `/...` |
| `PUBLIC_UMAMI_URL` | Your Umami instance (optional) |
| `PUBLIC_UMAMI_SITE_ID` | Your Umami dashboard (optional) |

### Verify pipeline works
Push any commit to `astro-dark` → GitHub Actions → confirm:
1. `Build` job passes (type-check + build + audit)
2. `Deploy Production` job passes
3. Cloudflare Pages shows new deployment in dashboard

---

## §6 — Rollback Procedure

### Option A — Cloudflare dashboard (fastest, no code)
1. Cloudflare Pages → project → **Deployments** tab
2. Find the last known-good deployment (by date/commit)
3. Click **"•••"** → **"Rollback to this deployment"**
4. Instant — < 10 seconds, no rebuild

### Option B — Git revert (auditable, creates a paper trail)
```bash
# Identify the bad commit
git log --oneline -10

# Create a revert commit (non-destructive)
git revert HEAD --no-edit
git push origin astro-dark

# GitHub Actions will build and redeploy automatically
```

### Option C — Force reset (destructive — use only if revert is insufficient)
```bash
git reset --hard <known-good-sha>
git push --force-with-lease origin astro-dark
```

---

## §7 — Cache Purge After Deployment

Cloudflare Pages **automatically purges** the CDN cache for every new deployment.  
No manual cache purge needed for routine deployments.

If you need a manual purge (e.g., after DNS changes or header updates):
1. Cloudflare → **Caching** → **Configuration** → **Purge Cache** → **Purge Everything**

> **Do not purge Everything** routinely — it evicts `/_astro/*` immutable assets  
> and forces all users to re-download the full Three.js bundle.  
> Only use "Purge Everything" after changing `_headers` or `_redirects`.

---

## §8 — Environment Updates Without Redeployment

To add/change environment variables without a code push:
1. Cloudflare Pages → project → **Settings** → **Environment variables**
2. Edit variable → **Save**
3. Trigger a new deployment: go to **Deployments** → click **"Retry deployment"** on the latest

---

## §9 — Monitoring Deployment Health

After every production deployment, verify:

```bash
# Check live headers
curl -sI https://davincistudio.ae | grep -E "cache-control|x-frame|content-security|cf-ray"

# Verify sitemap
curl -s https://davincistudio.ae/sitemap-index.xml | head -5

# Verify robots.txt
curl -s https://davincistudio.ae/robots.txt

# Verify 404
curl -sI https://davincistudio.ae/nonexistent-page | grep "HTTP/"

# Check www redirect
curl -sI https://www.davincistudio.ae | grep -E "location|HTTP/"
```

Expected results:
- `cache-control: public, max-age=0, must-revalidate` on HTML
- `x-frame-options: DENY` present
- Sitemap returns XML with 3 URLs
- 404 returns `HTTP/2 404`
- www returns `301` → `https://davincistudio.ae`
