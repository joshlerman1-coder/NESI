# Productive Reinvestment Rating System
**Formula Specification — Version 5**

*Supersedes v4. The per-fiscal-year scoring model.*

---

## What changed from v4

v4 produced **one score per company** by summing up to three fiscal years of cash
flows and scoring the sum once. v5 scores **each fiscal year on its own** and makes
the published headline an **average of those single-year scores**:

1. **Per-year scoring.** Every fiscal year from **FY2018** onward is scored
   independently using one year of cash flows. These per-year scores drive the
   "Score over time" chart on each company page.
2. **Headline = rolling average.** The number the site lists and ranks on is the
   **average of the single-year scores over the most recent `AVG_WINDOW` (= 7)
   scored fiscal years**. A company needs at least `MIN_YEARS` (= 3) scored years
   to receive a headline; otherwise it is unscored.
3. **Government assistance removed from the formula.** The ASC 832 / USAspending
   government-assistance penalty (the `0.5 × GA` term in v4) has been **dropped
   entirely**. It only exists for ~FY2022+ and cannot be backfilled consistently
   across the full 2018+ history, so including it would make the time series
   apples-to-oranges. The gov-assistance amounts are still ingested and shown on
   the company page **for context only** — they no longer affect any score.

Everything else (the productive/extractive decomposition, the debt-fueled
extraction multiplier, the FCF-margin adjustment, the grade bands) is unchanged.

---

## Single-year formula (applied to each fiscal year independently)

```
Productive      = max(CX − DA, 0) + RD + max(DR − DI, 0)
net_new_debt    = max(DI − DR, 0)
debt_multiplier = 1 + min((net_new_debt / (DIV + SBB)) × 0.25, 0.25)
                  [only when DIV + SBB > 0 and net_new_debt > 0, else 1.0]
Extractive      = (max(DA − CX, 0) + DIV + SBB) × debt_multiplier   ← no GA term
Gate            : if Productive + Extractive = 0 → that year is unscored
Alloc           = Productive / (Productive + Extractive)
FCF             = OCF − CX − SBC
FCF Margin      = clamp(FCF / Revenue, 0, 0.50)
                  [0 when revenue ≤ 0 or revenue < 10% of |OCF|]
Score(year)     = Alloc × (1 − FCF Margin)              in [0, 1]
score_100(year) = round(Score × 100)                   in [0, 100]
```

## Headline aggregation (per company)

```
scored_years = fiscal years (FY2018+) with a valid single-year score, ascending
window       = the most recent AVG_WINDOW (= 7) scored years
if |window| < MIN_YEARS (= 3):  company is unscored
else:
    headline_score = mean( Score(y) for y in window )
    score_100      = round(headline_score × 100)
    grade / label  = from score_100 / headline_score
    score_trend    = score_100(latest year in window) − score_100(earliest in window)
    first_year, last_year, years_scored recorded for display
```

The averaged PRS/ES/FCF-margin and the productive/extractive/acquisition/retained
buckets shown on the page are window averages too, so the breakdown panel and the
hero number stay consistent.

---

## Grade bands (unchanged)

| Score | Grade | Interpretation |
|---|---|---|
| 80–100 | A | Strongly productive |
| 65–79 | B | Net productive |
| 45–64 | C | Mixed |
| 30–44 | D | Net extractive |
| 0–29 | F | Strongly extractive |

---

## Data ingestion (FY2018+)

All variables come from the SEC EDGAR XBRL `companyfacts` API — one call per
company returns every year, so extending history back to 2018 adds no request
volume. Scripts: `fetch_yearly.py` (ingest) → `compute_scores_yearly.py` (score).

Accuracy rules enforced in `fetch_yearly.py`:

- **Annual periods only.** Each value must come from an `fp=FY` entry in a
  `10-K`/`10-K/A` whose period length is ~a full year (330–400 days). This
  excludes quarterly/partial periods that SEC frequently mis-tags as `FY` and
  that would otherwise clobber the true annual value (e.g. an Apple Q4 ending in
  the same calendar year as the fiscal year).
- **Restatement-aware.** For each (metric, fiscal year) the value from the most
  recently *filed* 10-K wins.
- **Consistent tag, gap-filled.** Per metric, the fallback XBRL tag with the most
  year coverage is the primary series; missing years are filled from the other
  fallbacks (handles the `SalesRevenueNet` → `RevenueFromContractWithCustomer…`
  transition around 2018 without dropping the early year).
- **Fiscal year = calendar year of the period end**, applied identically to every
  metric so a company's year buckets line up.
- **Missing = NULL.** A missing metric is stored as NULL (not 0) so the OCF/CX/DA
  gate can tell a genuine zero from missing data.

### Metrics and primary XBRL tags

| Variable | Description | Primary tag (+ fallbacks) |
|---|---|---|
| OCF | Operating Cash Flow | NetCashProvidedByUsedInOperatingActivities (+ …ContinuingOperations) |
| CX | Capital Expenditures | PaymentsToAcquirePropertyPlantAndEquipment (+ fallbacks incl. …OtherPropertyPlantAndEquipment) |
| RD | R&D Expense | ResearchAndDevelopmentExpense (+ fallbacks) |
| DA | Depreciation & Amortization | DepreciationDepletionAndAmortization (+ fallbacks) |
| DR | Debt Repayment | RepaymentsOfLongTermDebt (+ fallback) |
| DI | Debt Issuance | ProceedsFromIssuanceOfLongTermDebt (+ fallback) |
| DIV | Dividends Paid | PaymentsOfDividends (+ fallback) |
| SBB | Share Buybacks | PaymentsForRepurchaseOfCommonStock |
| SBC | Stock-Based Compensation | ShareBasedCompensation (+ fallback) |
| Revenue | Total Revenue | Revenues (+ fallbacks) |
| ACQ | Acquisitions | PaymentsToAcquireBusinessesNetOfCashAcquired (+ fallbacks) — disclosed, not scored |
| ΔCash | Change in Cash | CashCashEquivalents…PeriodIncreaseDecrease… (+ fallbacks) — disclosed, not scored |

---

## Database tables

- `sp500_metrics_yearly` — one row per (ticker, fiscal_year); raw per-year metrics.
- `sp500_scores_yearly` — one row per (ticker, fiscal_year); single-year scores.
- `sp500_scores` — one row per ticker; the rolling N-year-average headline, plus
  `years_scored`, `first_year`, `last_year`, `score_trend` for the page. The wide
  `sp500_metrics` table is retained for employees / description / gov-assistance
  display fields.

---

## Known limitations

- **Financials & REITs.** Banks, insurers, and REITs often don't report PP&E
  capex (CX) or a consolidated D&A line under standard tags, so they fail the
  OCF/CX/DA gate and remain unscored — a structural mismatch with a formula built
  around capex-vs-depreciation. ~48 companies are unscored for this reason.
- **Custom XBRL extensions.** A few companies (e.g. PSX) tag capex only in a
  company-specific extension namespace NESI does not parse, so they're unscored.
- **Short histories.** Companies that IPO'd or joined the index after 2018 are
  averaged over the years they have (minimum 3).
- **Single-year lumpiness.** Individual years can swing on one-off buybacks or
  debt moves; the rolling average tames the headline while the chart deliberately
  shows the swings.
- **Off-calendar fiscal years** are labeled by the calendar year of their period
  end (e.g. a Walmart FY ending Jan 2026 is "FY2026").
