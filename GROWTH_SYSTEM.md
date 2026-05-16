# Growth System — Da Vinci Studio
**Phase 18 · Lead Quality, Portfolio Intelligence & Business Evolution**

This document is the operating manual for the studio as a business.  
It is not aspirational. It describes concrete systems, decision rules, and thresholds.  
Review quarterly. Update when evidence changes the model.

---

## Part I — Lead Quality System (Step 1)

### Inquiry classification

Every inquiry that arrives at `sajed@davincistudio.ae` is classified within 24 hours.
Use `docs/ops/INQUIRY_LOG_TEMPLATE.md` to record it.

**Four inquiry types:**

| Type | Description | Action |
|---|---|---|
| **A — Aligned** | Named business, specific brief, budget language present | Respond within 24h. Full qualification call. |
| **B — Potential** | Real project but underdeveloped brief or unclear budget | Respond within 48h. Qualifying questions only. |
| **C — Misaligned** | Real person, wrong fit (commodity, no budget, wrong sector) | Polite, brief decline. No time investment. |
| **D — Noise** | Spam, recruitment, cold outreach, generic "can you do websites?" | No response or one-line reply. |

### Budget signal detection

The inquiry doesn't need to state a number. Look for signals:

**High-budget signals:**
- References an existing agency or previous design investment
- Mentions a launch date with commercial pressure
- Describes the project in business terms, not aesthetic preferences
- Is from a registered business email (not Gmail)
- References competitors or aspirational brands

**Low-budget signals:**
- Starts with "I need something simple" or "just a basic site"
- Mentions DIY attempts first ("I've been trying to do it myself")
- Multiple requests for scope reduction before a conversation has happened
- No business context — personal project framing

**Red flags regardless of stated budget:**
- Wants to "start small and see how it goes" with a fixed-price first phase
- References "my friend who does websites" as a price comparison
- Asks for mockups or concepts before agreeing to any engagement
- Wants everything decided before a discovery call

### Scoring an inquiry (internal use only)

Rate each inquiry 1–3 on three dimensions:

| Dimension | 1 | 2 | 3 |
|---|---|---|---|
| **Project clarity** | Vague wish | General category known | Specific deliverable and context |
| **Business seriousness** | No business context | Existing business, unclear stakes | Business with market pressure, named outcomes |
| **Positioning alignment** | Wrong fit | Partial fit | Exactly the kind of work the studio does |

**Score 7–9:** Pursue. This is an A/B inquiry.  
**Score 4–6:** Qualify further before investing time.  
**Score 1–3:** Decline or ignore.

### Quarterly lead review

At the end of each quarter, review all logged inquiries and answer:

1. What was the most common inquiry type?
2. What was the most common misalignment reason?
3. Did any messaging change this quarter correlate with a shift in inquiry quality?
4. Are the right clients finding the portfolio? If not — what is the referral source of the misaligned inquiries?

---

## Part II — Portfolio Performance Intelligence (Step 2)

### What to measure in Umami

The analytics infrastructure is live (once `PUBLIC_UMAMI_URL` is set).
These are the metrics that matter for the studio — not vanity metrics.

**Funnel depth (scene_reached events):**

The cinematic scroll creates a natural funnel. Track completion rates:

```
Hero scene reached       → 100% baseline (every visitor)
Philosophy scene reached → target: > 60% (filters casual visitors)
Services scene reached   → target: > 45%
Work scene reached       → target: > 35%
CTA scene reached        → target: > 25%
```

If philosophy drop-off is > 50%, the first two scenes are not connecting.
If work drop-off is > 60% from services, the services copy is not qualifying.
If CTA drop-off is > 60% from work, the work projects are not building enough trust.

**Conversion events:**
```
cta_click (email)    → target: > 0.5% of homepage visitors
whatsapp_click       → track separately — different client type
case_study_open      → signals high-intent, technical visitor
linkedin_click       → outbound signal, not conversion
```

**Case study behavior:**
```
/case-study page views  → ratio vs homepage = interest level
/architecture views     → technical peer signal
Time on /case-study     → > 4 minutes = deeply engaged
```

### What to NOT optimize for

- **Bounce rate** — the platform is designed to filter. High bounce rate from the wrong audience is working correctly.
- **Page views** — a portfolio is not a media property. Volume is irrelevant.
- **Session duration** — a 90-second session that ends with a CTA click is worth more than a 10-minute session that exits from /case-study.
- **Social shares** — irrelevant to business acquisition. Shares bring peers and observers, not clients.

### Decision thresholds

These thresholds trigger action, not observation:

| Signal | Threshold | Action |
|---|---|---|
| CTA click rate < 0.3% for 30 days | Low | Review CTA scene copy; check mobile CTA tap target |
| Philosophy drop-off > 60% | High | Review philosophy copy; test hero descriptor variants |
| `webgl_failed` events > 5% of sessions | High | Investigate device/browser distribution; check fallback rendering |
| Case study views < 10% of homepage | Low | Review case study link placement in CTA footer |
| LinkedIn as #1 referral source | — | Good signal — continue LinkedIn activity |

---

## Part III — Case Study Conversion Intelligence (Step 3)

### What the case study is for

The case study serves two distinct audiences:

1. **Design-conscious founders** — they skim for confidence signals: named stack, specific constraints, named outcomes. They read section 01 (Vision) and section 05 (Decisions) most carefully. They want to know "does this person think well" not "is the code good."

2. **Technical peers / decision-makers at agencies or startups** — they read sections 03 (Architecture), 06 (Accessibility), and 07 (Timeline). They evaluate the engineering rigor.

### What makes it convert

Based on the document's structure and the positioning:
- The **callout boxes** ("Design constraint: every element must earn its place...") carry disproportionate trust weight. They signal standards, not just skill.
- The **"What This Demonstrates"** section (section 09) is the explicit conversion section. It names transferable capabilities. If a reader reaches this section, they are evaluating whether to contact.
- The **meta bar** (entry bundle 10.7 kB, Solo scope, CSS + RAF) converts technical readers who scan before committing to reading.

### Measurement

When Umami is live, add scroll depth tracking to `/case-study`:

This requires one code addition to `case-study.astro` — a lightweight scroll depth observer that fires events at 25%, 50%, 75%, 100% completion. Use this pattern in a `<script>` tag at the bottom of the page:

```javascript
// Add to case-study.astro <script> block when analytics is active
const depths = [25, 50, 75, 100];
const fired = new Set();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !fired.has(e.target.dataset.depth)) {
      fired.add(e.target.dataset.depth);
      window.umami?.track('case_study_depth', { depth: e.target.dataset.depth });
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-depth]').forEach(el => observer.observe(el));
```

Add `data-depth="25"` / `"50"` / `"75"` / `"100"` attributes to appropriate section elements.

**Do this when:** Umami is configured and generating data. Not before — instrumenting before traffic exists produces noise, not insight.

---

## Part IV — Traffic Source Quality (Step 4)

### Expected source hierarchy (in value order)

1. **Direct** — someone who typed the URL or used a bookmark. Highest intent. Usually a referral from a known person or a returning evaluator.

2. **LinkedIn** — professional context, strongest channel for this studio's positioning. Visitors from LinkedIn have seen the profile headline before arriving. Expect high alignment rate.

3. **GitHub** — technical audience. Peers, potential collaborators, CTOs evaluating engineering quality. Not primary clients but high-trust signal when they contact.

4. **Email referral** — someone forwarded the link. Very high intent. Treat with maximum response speed.

5. **Search (organic)** — long-tail queries like "Wix designer Abu Dhabi" or "web designer UAE cinematic". Lower intent but captures active buyers.

6. **Social (other)** — Instagram, Twitter/X. Generally low conversion to inquiry. Treat as awareness, not acquisition.

### Source quality evaluation

Umami reports referrer domains. Map each significant source to inquiry quality monthly:

```
Source          → Inquiry rate     → Average inquiry quality
linkedin.com    → ___% of visits   → A/B/C/D distribution
github.com      → ___% of visits   → A/B/C/D distribution
(direct)        → ___% of visits   → A/B/C/D distribution
google           → ___% of visits   → A/B/C/D distribution
```

Fill this in after 60 days of live data. The pattern determines where to invest attention.

### Channel investment rules

**Invest more time on a channel when:** > 30% of its visitors become Type A/B inquiries.

**Reduce time on a channel when:** It generates volume with < 10% Type A/B inquiry rate and no trend of improvement.

**Never abandon LinkedIn.** For a UAE-based premium studio, LinkedIn is the primary professional discovery channel. Consistency > cleverness there.

---

## Part V — Brand Message Evolution Rules (Step 5)

### What may change

- Project descriptions in WorkScene (as new work is added)
- Stats in LogosScene (as practice grows — update `200+`, `6+`, `8` when they change significantly, not annually)
- CTA availability status (when genuinely unavailable, change "Available" to "Selective capacity")
- The hero descriptor — may evolve as positioning sharpens over years
- The case study — can be expanded with new sections; existing sections should only be tightened, not rewritten

### What must never change without deliberate review

These are load-bearing elements of the identity. Changing them casually causes drift:

- The three Philosophy principles (Restraint / Precision / Narrative) — these are the value system of the studio, not just copy
- The CTA scarcity signal structure ("small number of clients at a time — by design") — removing this removes a key positioning element
- The eyeline format (dash · LABEL · dash) — this is visual DNA, not decorative
- The motion philosophy documented in the case study — the published constraints are now a public commitment
- "Abu Dhabi, UAE" — market specificity is an intentional positioning choice, not a disclaimer

### How to prevent agency drift

**Agency drift** is when a portfolio or studio slowly begins to look and sound like everyone else — through accumulated small compromises.

Prevention rules:

1. **The "why" test.** Before changing any copy, state why in one sentence. If the answer is "to appeal to more people," the change is drift. If the answer is "because this is now more precisely true," proceed.

2. **The contrast test.** Read the proposed change. Then read it on a generic agency website. If it would fit there without feeling out of place, it does not belong here.

3. **The subtraction test.** When editing, try removing the sentence first. If the page is stronger without it, it was not earning its place.

4. **Annual identity review.** Once per year, re-read `BRAND_STRATEGY.md` and this document. Ask: has the work drifted from the stated positioning? Is the positioning still correct, or has the practice evolved? One of these documents should be updated — never let them diverge silently.

---

## Part VI — Content Expansion Framework (Step 6)

### Adding new work to the portfolio

The Work scene currently shows three projects. The maximum sustainable number is five. Beyond five, the editorial weight of each project decreases and the scene becomes a catalogue, not a selection.

**Criteria for replacing or adding a project:**

A project qualifies when all four conditions are met:
1. Named, consenting client
2. Specific measurable outcome (conversion rate, engagement metric, or documented business impact)
3. The work demonstrates a capability not already demonstrated by existing projects
4. The work was delivered in the last 24 months (older than 24 months: case study only, not Work scene)

**Criteria for retiring a project:**
- Replaced by newer work that demonstrates the same or greater capability
- Client has withdrawn consent
- The project no longer represents current standards

### Adding new case studies

The current case study is a self-referential engineering case study. Future case studies should be client work.

**Minimum structure for a client case study:**

```
1. Client context (industry, what they needed, why it mattered)
2. The constraint (what made this non-trivial)
3. The decisions (at least one counterintuitive choice, with reasoning)
4. The outcome (specific, measured or observable)
5. What it demonstrates about the studio's approach
```

**Publishing threshold:** A case study is published when it adds a perspective not already covered. If it would be redundant, it dilutes rather than strengthens.

### Evaluating technical improvements

Before adding any new technical feature or visual element:

1. **Does it serve an existing user need or a documented problem?** If the answer is "it would be interesting," it is not ready.
2. **Can it be explained in the case study?** If it cannot be documented with reasoning, it should not be added.
3. **Does it violate any established constraint?** (Motion ceiling values, bundle budget, no external animation libraries, no layout thrash)

---

## Part VII — Client Conversion Feedback Loop (Step 7)

### Signals from inquiries that should update the portfolio

Every inquiry carries information about whether the messaging is working. Track these patterns:

**If inquiries frequently ask "what do you specialise in?"**  
→ The Services scene is not communicating scope clearly enough. Tighten the service card subtitles.

**If inquiries mention "I saw your case study"**  
→ The case study is converting. Do not change the case study. Reinforce the link to it.

**If inquiries are mostly from the wrong sector (e.g. commodity work, small personal projects)**  
→ The hero descriptor is not filtering correctly. Review the positioning language — it may be too broad.

**If inquiries mention specific project titles (Al Rafidain, LifePoint)**  
→ The Work scene is doing its job. Ensure those projects stay prominent.

**If inquiries are high-quality but mention they "weren't sure if you were taking clients"**  
→ The availability signal is working as designed. Keep the scarcity language.

**If no inquiries arrive in 30 days**  
→ First check: is the site live? Is the email correctly linked? Check analytics for traffic volume. If traffic exists but no inquiries: review the CTA scene on mobile — tap targets, copy, button visibility.

### The feedback loop structure

```
Inquiry arrives
    ↓
Classify (A/B/C/D)
    ↓
Note: what in the inquiry tells me which page/scene referred them?
    ↓
After 3 inquiries of the same misalignment type:
    ↓
Review the corresponding scene — is the copy the problem
or is it a traffic source problem?
    ↓
If copy: test one change against the brand evolution rules
If traffic: address the referral source strategy
    ↓
Log the change in BRAND_STRATEGY.md with the reason
```

**Critical rule:** Never make a copy change based on a single inquiry. Patterns require at least three data points. Individual feedback may be noise.

---

## Part VIII — Business Scaling Strategy (Step 8)

### Stage 1: The current state (months 0–6 live)

A solo studio with a premium portfolio. The constraint is time, not demand.  
The correct focus: **inquiry quality over inquiry volume.** One exceptional project per month is more valuable than ten commodity projects per month — in financial terms, in portfolio terms, and in positioning terms.

**Do not do:**
- Lower pricing to fill capacity
- Take misaligned projects "to keep busy"
- Add services that dilute the positioning (e.g., adding social media management because a client asked)

**Do:**
- Be willing to say no, with a brief, respectful explanation
- Refer misaligned inquiries to other designers when possible (builds goodwill, signals confidence)
- Document every project rigorously — the next case study is already happening

### Stage 2: When demand exceeds capacity (months 6–18)

When regularly declining aligned Type A inquiries due to capacity:

**Option A — Increase rates.** The cleanest response to excess demand. Rates rise until demand matches capacity. The portfolio already supports premium pricing — use it.

**Option B — Selective partnerships.** If a specific project type recurs but is outside your core focus, a trusted partner handles it under the studio name. Only if quality can be guaranteed.

**Option C — Increase selectivity further.** Accept only the highest-scoring inquiries. Shorter portfolio of deeper relationships.

**Option D — Add a collaborator.** Only if the studio identity can be maintained. Any person who represents Da Vinci Studio must understand and embody the positioning.

### How scarcity positioning is maintained

The portfolio itself communicates scarcity without performing it:
- "I work with a small number of clients at a time — by design." — this is present and accurate
- No pricing page — price is discussed only in the context of a specific project
- Response time matters: a 24h response time signals this is a real business; a 3-week response signals disorganisation

**Never fabricate scarcity.** If you have capacity, say you are available. The current hero availability dot reads "Available for new projects." When at full capacity, change it to "Selective capacity — inquire." Do not pretend unavailability that is not true — it damages trust when discovered.

### Pricing perception

The portfolio communicates premium positioning. This justifies — and requires — pricing that matches.

**Anchoring principle:** The first price a client hears sets the frame for all subsequent negotiation. Never give a number before understanding the project scope. When asked "how much?" before a discovery call, respond:

> "Project scope varies significantly. My typical engagements range from [minimum] to [maximum] depending on complexity and timeline. I'd need to understand your project before quoting accurately — happy to have a 20-minute call."

This response: communicates a range, maintains authority, and moves toward a real conversation.

**What to charge for:**
- Time for discovery and specification (billable)
- Design and production (billable)
- Revisions beyond a defined number (billable)
- Ongoing maintenance and updates (retainer)

**What not to discount:**
- Initial rates to win work — this sets a precedent
- Rates for "prestigious" clients who have no budget — prestige does not pay operations

---

## Part IX — 12-Month Evolution Map (Step 9)

### The operating principle

The platform is finished. The identity is established. Growth comes from refining and expanding — not from rebuilding or redesigning.

**What changes on a cadence:**

| Frequency | What changes |
|---|---|
| **Monthly** | Inquiry log reviewed. Analytics reviewed against thresholds. Availability status updated if needed. |
| **Quarterly** | Brand strategy review against evidence. Social profiles updated with new work. Portfolio work descriptions refreshed if better outcomes can now be stated. |
| **Every 6 months** | Review whether any existing project in Work scene should be retired. Consider whether a new case study is ready to publish. Review if any copy has drifted. |
| **Annually** | Full identity review: re-read BRAND_STRATEGY.md. Does the positioning still match the work being done? Does the case study still represent the current technical standard? Is the hero descriptor still accurate? |

### What must remain static

These elements are the foundation. They do not change without a deliberate strategic decision reviewed against the full brand framework:

- The cinematic scroll experience — this is the product
- The motion philosophy and its documented constraints
- The three Philosophy principles (Restraint / Precision / Narrative)
- The scarcity signal in the CTA
- The case study's documented decisions (they are published commitments)
- "Abu Dhabi, UAE" — market specificity is intentional
- The visual DNA: dark canvas, Bebas Neue + Outfit, eyeline format

### Identity drift prevention: the gate system

Before any change to the platform (copy, code, or positioning), it must pass through this gate:

```
Is this change evidence-driven?
  No  → Do not make it
  Yes ↓

Does it serve an existing documented problem?
  No  → Do not make it
  Yes ↓

Does it violate a stated constraint in BRAND_STRATEGY.md?
  Yes → Do not make it without updating BRAND_STRATEGY.md first
  No  ↓

Can the change be explained in one sentence of reasoning?
  No  → It is not clear enough to implement
  Yes ↓

Make the change. Log it with the reason.
```

### The 12-month milestone targets

These are not promises — they are benchmarks for evaluating whether the system is working.

**Month 1–2 (live, warming):**
- Site is publicly live with custom domain
- Analytics active, baseline data collecting
- First Type A/B inquiry received through the portfolio
- GitHub README linked; LinkedIn profile updated per SOCIAL_PROFILES.md

**Month 3 (first data review):**
- Funnel depth analysis: which scenes are causing drop-off?
- Traffic source analysis: which channels are producing which inquiry types?
- First copy refinement if evidence supports it

**Month 6:**
- At least one new client project completed that could become a Work scene entry
- Case study linked in at least three external contexts (LinkedIn post, GitHub README, direct referrals)
- Analytics producing consistent pattern data (not just noise)
- Pricing reviewed against market response

**Month 9:**
- If demand has exceeded capacity at current rates: rates reviewed upward
- If specific inquiry types recur: corresponding copy refined
- First consideration of whether a new case study is ready to write

**Month 12:**
- Full identity review against BRAND_STRATEGY.md
- Portfolio work: at least one project refreshed or added
- Analytics reviewed for 12-month trend: funnel depth, inquiry quality, conversion rate
- Decision: does the studio expand its positioning, deepen it, or hold it?
- This document reviewed and updated

---

## How to use this document

This document is a decision-making tool, not a vision statement.  
When a question arises about the business, check here first.  
When evidence changes the model, update here first.  
When a temptation exists to "just quickly change something," run it through the gate system.

The discipline of documented reasoning is the same discipline that produced the platform.  
Apply it to the business with the same rigor.
