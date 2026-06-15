# NESI — Project Context
**Net Extractor Scoring Index**
*Last updated: April 2026*

---

## What This Project Is

NESI is a financial ratings website that scores every S&P 500 company on a single question: **what does it do with its surplus capital?** Does it reinvest productively — building capacity, funding R&D, paying down debt — or does it extract value for shareholders through dividends, buybacks, and asset liquidation?

The project was built entirely from scratch using free public data (SEC EDGAR) and open-source tools. No paid data providers. No Bloomberg terminal.

---

## Who Built It

Josh Lerman. Built collaboratively with Claude over a single extended session in April 2026.

---

## The Core Philosophy

Profit is legitimate. But profit is a starting point, not an end. The question NESI asks is what happens next.

Most financial ratings systems measure how much a company earns. NESI measures what a company **does** with what it earns. A company can be highly profitable and deeply extractive at the same time — returning nearly all surplus to shareholders while starving its own productive capacity of investment.

Companies that deploy surplus into productive uses create durable value. Companies that extract surplus transfer value away from the enterprise without creating anything new. The ratio between the two is meaningful information that most financial data platforms don't surface clearly.

NESI does not argue that extraction is always wrong or reinvestment always right. It surfaces the ratio so users can judge for themselves.

---

## The Formula (Current: Version 5 — per-year scoring)

**v5 update (June 2026):** scores are now computed **per fiscal year** (FY2018 onward),
and a company's headline score is the **average of its single-year scores over the most
recent 7 fiscal years**. The government-assistance penalty has been **removed** from the
formula entirely (the data is still ingested and shown on each company page for context
only). The single-year formula below is otherwise unchanged from v4. Each company page now
charts its single-year score over time. Full spec: `PRR_System_v5.md`.

```
Productive      = max(CX − DA, 0) + RD + max(DR − DI, 0)
net_new_debt    = max(DI − DR, 0)
debt_multiplier = 1 + min((net_new_debt / (DIV + SBB)) × 0.25, 0.25)
                  [only when DIV + SBB > 0 and net_new_debt > 0, else 1.0]
Extractive      = (max(DA − CX, 0) + DIV + SBB) × debt_multiplier
Alloc           = Productive / (Productive + Extractive)
FCF             = OCF − CX − SBC
FCF Margin      = max(OCF / Revenue, 0)
Score           = Alloc × (1 − FCF Margin)
NESI Score      = round(Score × 100)    [0–100]
```

**What raises the score:**
- Growth CapEx (CX above depreciation threshold)
- R&D investment
- Net debt repayment (DR above DI)

**What lowers the score:**
- Underfunded CapEx (CX below depreciation — quietly liquidating assets)
- Dividends paid
- Share buybacks
- Debt-fueled extraction (borrowing net new debt while paying dividends/buybacks — up to 1.25× multiplier)

**FCF margin adjustment:** High FCF margin companies (cash-generative relative to revenue) are penalized — they have more capacity to reinvest and less excuse not to. Floored at 0 so negative FCF doesn't boost scores.

**Gate checks:**
- If Productive + Extractive = 0 → unscored
- If Extractive = 0 → unscored (score of 1.0 by default is not meaningful)

**Score conversion:**
- 80–100 = A (Strongly Productive)
- 65–79 = B (Net Productive)
- 45–64 = C (Mixed)
- 30–44 = D (Net Extractive)
- 0–29 = F (Strongly Extractive)

Full spec: `PRR_System_v5.md` in this folder (v4 retained for reference).

---

## Data Pipeline

All data comes from **SEC EDGAR XBRL API** — free, no API key required.

### Metrics pulled (12 total):
| Field | Description |
|---|---|
| OCF | Operating Cash Flow |
| CX | Capital Expenditures |
| RD | R&D Expense |
| DA | Depreciation & Amortization |
| DR | Debt Repayment |
| DI | Debt Issuance |
| ACQ | Acquisitions (disclosed, not scored) |
| DIV | Dividends Paid |
| SBB | Share Buybacks |
| SBCtotal | Stock-Based Compensation |
| DCash | Change in Cash |
| Revenue | Total Revenue |

### Key data quality notes:
- Per-year ingestion (`fetch_yearly.py`) accepts fiscal year ends ≥ 2018-01-01, restricted to ~annual (330–400 day) FY periods to reject quarterly values mis-tagged as FY
- Restatement-aware: the most recently *filed* 10-K wins for each (metric, fiscal year)
- CX, DA, and Revenue have extended fallback XBRL tag lists to handle non-standard reporting
- ~11 companies are unscored due to zero extractive activity (early-stage/growth companies)
- Banks and financial companies often have unusual XBRL structures (JPM, WFC, GS etc.)
- BRK.B and BF.B excluded entirely — non-standard EDGAR filings

---

## Tech Stack

| Component | Tool |
|---|---|
| Data fetch | Python (`fetch_all.py`, `fetch_fix_metrics.py`, `fetch_revenue.py`) |
| Scoring | Python (`compute_scores.py`) |
| Database | Supabase (PostgreSQL) |
| Auto-refresh | GitHub Actions (runs 1st of each month) |
| Frontend | React + Vite + Recharts |
| Hosting | Local dev only as of April 2026 — not yet deployed |

---

## Folder Structure

```
~/Desktop/nesi/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── Home.jsx/css          # About page — philosophy and caveats
│   │   ├── Scores.jsx/css        # Searchable/filterable company list
│   │   ├── Company.jsx/css       # Individual company detail page
│   │   └── Methodology.jsx/css   # Full formula documentation
│   ├── App.jsx/css               # Router and nav
│   └── supabaseClient.js         # Supabase JS client
├── sec-project/                  # Python data pipeline
│   ├── fetch_yearly.py          # v5: per-(ticker,year) pull FY2018+ → sp500_metrics_yearly
│   ├── compute_scores_yearly.py # v5: single-year scores + 7yr-avg headline
│   ├── fetch_all.py              # (legacy) full single-year pull for all 501 companies
│   ├── fetch_revenue.py          # One-time revenue backfill script
│   ├── fetch_fix_metrics.py      # Re-fetches CX, DA, Revenue with better tags
│   ├── compute_scores.py         # (legacy v4) 3-year-sum scoring
│   ├── refresh_on_new_filings.py # Monthly auto-refresh (runs via GitHub Actions)
│   ├── upload_to_supabase.py     # Original CSV upload script (one-time use)
│   ├── my_sp500.txt              # 503 S&P 500 tickers
│   └── sp500_ciks.csv            # Ticker → SEC CIK mapping
├── PRR_System_v4.md              # Current formula spec (authoritative)
├── PRR_System_v3.md              # Previous version for reference
└── PROJECT_CONTEXT.md            # This file
```

---

## Supabase Database

- **Project:** sp500-ratings
- **URL:** https://wndfbqqefvwtejxcepru.supabase.co
- **Tables:**
  - `sp500_metrics` — raw EDGAR data (most-recent-year wide form), 501 rows; retained for employees / description / gov-assistance display
  - `sp500_scores` — headline scores, 501 rows; score now = 7yr average, plus `years_scored`, `first_year`, `last_year`, `score_trend`
  - `sp500_metrics_yearly` — **v5**: raw per-(ticker, fiscal_year) metrics, FY2018+ (~3,966 rows)
  - `sp500_scores_yearly` — **v5**: single-year scores per (ticker, fiscal_year), drives the score-over-time chart
- **RLS:** Disabled on both tables — publicly readable with anon key
- **Auth:** Service role key required for writes (stored in GitHub Actions secrets)

---

## GitHub

- **Repo:** github.com/joshlerman1-coder/sp500-ratings
- **GitHub Actions:** Monthly refresh workflow at `.github/workflows/monthly_refresh.yml`
  - Runs 1st of each month at 6am UTC
  - Can also be triggered manually from the Actions tab
  - Secrets needed: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

---

## Running the Project Locally

**Start the frontend:**
```bash
cd ~/Desktop/nesi && npm run dev
# Open http://localhost:5173
```

**Re-run scoring (after any formula change):**
```bash
cd ~/Desktop/nesi/sec-project
SUPABASE_URL="https://wndfbqqefvwtejxcepru.supabase.co" SUPABASE_SERVICE_KEY="your-key" python3 compute_scores.py
```

**Re-fetch problem metrics (CX, DA, Revenue):**
```bash
python3 fetch_fix_metrics.py
```

**Full data re-pull (takes ~45 min):**
```bash
python3 fetch_all.py
```

---

## Current State (April 2026)

- ✅ 490 companies scored, 11 unscored
- ✅ Formula v4 live in Supabase
- ✅ Monthly auto-refresh running on GitHub Actions
- ✅ Frontend built and running locally
- ⬜ Not yet deployed publicly (next step: Netlify)
- ⬜ Sector map in Scores.jsx and Company.jsx is hardcoded — could be improved

---

## Known Limitations

- Some XBRL tags still missing for certain companies (CX = 0 for a handful)
- Revenue missing for a few companies (XEL, DTE, etc.) — FCF margin treated as 0
- Financial companies (banks, insurers) often have unusual structures that don't fit the formula well
- Single-year snapshot only — lumpy capital decisions can distort scores
- Sector map is a manual hardcoded dictionary in the frontend, not pulled from data
- The formula has evolved significantly — v1 through v4 exist in this session; v4 is authoritative
