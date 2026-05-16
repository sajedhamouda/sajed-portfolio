# Analytics Playbook — Da Vinci Studio
**What to measure · How to interpret it · When to act**

This is the operational companion to `GROWTH_SYSTEM.md Part II`.  
Run through this playbook once per month after Umami is live.

---

## §1 — Setup Checklist

Before using this playbook, confirm:

- [ ] `PUBLIC_UMAMI_URL` set in Cloudflare Pages environment
- [ ] `PUBLIC_UMAMI_SITE_ID` set in Cloudflare Pages environment
- [ ] Site redeployed after vars were set (Astro bakes them at build time)
- [ ] Verified: visit site in incognito → Umami Realtime shows the visit
- [ ] Verified: scroll to CTA → `scene_reached` events appear in Umami

---

## §2 — Monthly Review (30 minutes)

Run this at the start of each month for the previous month's data.

### 2.1 Traffic volume

```
Metric: Unique visitors (Umami → Overview)
Record: ___

Is this growing, stable, or declining?
→ Growing: note what activity preceded the growth (LinkedIn post? Referral?)
→ Declining: check for broken links, domain issues, or traffic source changes
→ Stable: expected for a passive portfolio without active promotion
```

### 2.2 Scene funnel depth

Pull `scene_reached` event counts from Umami → Events:

```
hero         count: ___   rate vs total: 100% (baseline)
philosophy   count: ___   rate vs hero: ___%   target > 60%
services     count: ___   rate vs hero: ___%   target > 45%
work         count: ___   rate vs hero: ___%   target > 35%
cta          count: ___   rate vs hero: ___%   target > 25%
```

**Interpretation:**

| Drop-off location | Likely cause | Check |
|---|---|---|
| Hero → Philosophy > 50% drop | First impression not connecting | Hero descriptor, boot timing, mobile rendering |
| Philosophy → Services > 40% drop | Philosophy not qualifying well | Philosophy copy length, reading pace |
| Services → Work > 30% drop | Services not building enough interest | Service card descriptions, bento layout |
| Work → CTA > 40% drop | Projects not convincing | Project descriptions, outcome specificity |

**Rule:** Do not act on a single month's data. Act on a consistent 3-month pattern.

### 2.3 Conversion events

```
cta_click (email)    count: ___   rate vs unique visitors: ___%
whatsapp_click       count: ___   rate vs unique visitors: ___%
case_study_open      count: ___   rate vs unique visitors: ___%
linkedin_click       count: ___   (outbound, not conversion — monitor trend only)
```

**Minimum targets (after 90 days live, not before):**

| Event | Minimum | Concern threshold |
|---|---|---|
| cta_click | > 0.5% | < 0.2% for 60+ days |
| case_study_open | > 8% | < 3% for 60+ days |

**Note:** These are thresholds for action, not success metrics. A 0.5% CTR with 1000 visitors is 5 serious inquiries per month — more than enough for a selective solo studio.

### 2.4 Error monitoring

```
webgl_failed         count: ___   rate vs sessions: ___%
```

If `webgl_failed` > 3% of sessions:
→ Check if a specific browser or device type is causing it (Umami shows device/OS breakdowns)
→ Verify the fallback rendering (canvas hidden, rest of experience continues)
→ Check if the issue correlates with mobile sessions

### 2.5 Traffic sources

Pull top referrers from Umami → Sources:

```
Source 1: ___   visits: ___
Source 2: ___   visits: ___
Source 3: ___   visits: ___
Direct:         visits: ___
```

Map sources against inquiry log (from `INQUIRY_LOG_TEMPLATE.md`):
- Which source produced the most A/B inquiries this month?
- Which source produced the most C/D inquiries?

---

## §3 — Quarterly Review (60 minutes)

### 3.1 Funnel trend

Compare funnel depth rates month over month for the quarter:

```
Scene    Month 1    Month 2    Month 3    Trend
hero     100%       100%       100%       —
philo    ___%       ___%       ___%       ↑/↓/→
service  ___%       ___%       ___%       ↑/↓/→
work     ___%       ___%       ___%       ↑/↓/→
cta      ___%       ___%       ___%       ↑/↓/→
```

A consistent downward trend in one transition = a copy or experience problem at that transition.  
An improvement after a copy change = evidence the change was correct.

### 3.2 Source quality correlation

Cross-reference Umami referrers with the inquiry log for the quarter:

```
Source        Visitors    Inquiries    Inquiry rate    Avg quality (A/B/C/D)
LinkedIn      ___         ___          ___%            ___
Direct        ___         ___          ___%            ___
GitHub        ___         ___          ___%            ___
Search        ___         ___          ___%            ___
```

Invest in channels where inquiry rate × inquiry quality is highest.

### 3.3 Case study engagement

```
/case-study unique visitors:    ___   (__ % of homepage visitors)
/architecture unique visitors:  ___   (__ % of homepage visitors)

Case study to contact conversion:
Of visitors who opened /case-study, how many became inquiries?
(Cross-reference timing: inquiry within 7 days of case study visit)
Estimated rate: ___
```

If `/case-study` visitors convert to inquiries at a noticeably higher rate than homepage-only visitors:
→ The case study is the primary trust mechanism. Make it easier to find (review CTA footer link visibility).

### 3.4 Mobile vs desktop split

```
Desktop sessions:  ___%
Mobile sessions:   ___%
Tablet sessions:   ___%
```

If mobile > 40% of sessions:
→ Run through the mobile checklist in `docs/ops/VALIDATION_MATRIX.md §4` again
→ Verify CTA tap targets, typography scaling, scroll behavior on iOS Safari

---

## §4 — Interpreting Anomalies

### Spike in traffic, no change in inquiries
**Likely:** A social share or Reddit/HN post brought observers (peers, not clients). Monitor referrer. If GitHub-sourced: technical audience, not client audience. Normal.

### Drop in traffic month-over-month
**Likely:** A LinkedIn post drove temporary traffic in the previous month. Steady state is the baseline. Not a problem unless it continues declining for 3+ months.

### Traffic stable, CTA clicks drop
**Likely:** A mobile UX issue (button not visible on scroll, iOS tap target). Check on a real device. Or: the mix of traffic sources shifted toward lower-intent visitors.

### `webgl_failed` rate rises suddenly
**Likely:** A new browser version changed WebGL policy (common on iOS Safari updates). Check which device type is generating the events. The fallback exists — verify it renders correctly on the affected device.

### High case study views, no inquiries
**Expected for the first 30–60 days.** The case study builds reputation gradually. Peers sharing it increases studio visibility before it converts to client inquiries. Not a problem — it is a different kind of value (positioning with technical collaborators, CTOs, future referrers).

---

## §5 — When to Conclude Analytics Are Not the Problem

Before attributing a low conversion rate to a messaging problem, verify:

1. **Is the email link working?** Send a test email from the CTA. Check it arrives.
2. **Is the WhatsApp number correct?** Open it on mobile — does it launch the app?
3. **Is the site indexed?** Search `site:davincistudio.ae` in Google.
4. **Is traffic volume sufficient?** Below 200 unique visitors/month, conversion rates are statistically meaningless. Focus on traffic generation before conversion optimization.

**Minimum viable data threshold:** 500 unique visitors before making any copy change based on analytics. Below that threshold, the data is noise.

---

## §6 — Reporting Template

After each monthly review, write one paragraph:

```
## Analytics Report — [Month Year]

Visitors: ___ (vs ___ last month, trend: ↑/↓/→)
Funnel: Hero → Philosophy __% → Services __% → Work __% → CTA __%
CTA clicks: ___ (___%)
Case study opens: ___ (___% of visitors)
Top source: ___
Notable pattern: [one sentence]
Action taken: [one sentence or "none — continuing to monitor"]
```

File this paragraph in `INQUIRY_LOG_TEMPLATE.md` monthly summary or as a comment in this file.
