# Productive Reinvestment Rating System
**Formula Specification and Calculation Instructions — Version 2**

*Updated to reflect revised TAC definition and net debt treatment*

---

## Purpose

This rating system evaluates publicly traded companies based on what they do with surplus capital. The underlying philosophy is that profit is legitimate and desirable, but what matters is how that profit is reinvested. Companies that deploy surplus into productive uses — growing their productive capacity, funding innovation, and retiring debt — create durable value. Companies that extract surplus through dividends, share repurchases, and underfunded asset maintenance transfer value away from the enterprise without creating new productive capacity.

The system produces two scores:

- **Productive Reinvestment Score (PRS)** — the share of allocable cash directed toward productive ends
- **Extraction Score (ES)** — the share of allocable cash directed toward extractive ends

The **Composite Score** is PRS minus ES. A positive score indicates a company that reinvests more than it extracts. A negative score indicates the reverse.

All inputs are drawn exclusively from SEC 10-K filings using standardized XBRL tags.

---

## Data Sources and Input Variables

| Variable | Description | XBRL Tag |
|---|---|---|
| OCF | Operating Cash Flow | NetCashProvidedByUsedInOperatingActivities |
| CX | Capital Expenditures | PaymentsToAcquirePropertyPlantAndEquipment |
| RD | R&D Expense | ResearchAndDevelopmentExpense |
| DA | Depreciation & Amortization | DepreciationDepletionAndAmortization (+ fallbacks) |
| DR | Debt Repayment | RepaymentsOfLongTermDebt (+ fallback) |
| DI | Debt Issuance | ProceedsFromIssuanceOfLongTermDebt (+ fallback) |
| ACQ | Acquisitions (net of cash) | PaymentsToAcquireBusinessesNetOfCashAcquired (+ fallbacks) |
| DIV | Dividends Paid | PaymentsOfDividends (+ fallback) |
| SBB | Share Buybacks | PaymentsForRepurchaseOfCommonStock |
| SBC | Stock-Based Compensation | ShareBasedCompensation (+ fallback) |
| ΔCash | Change in Cash Balance | CashAndCashEquivalentsPeriodIncreaseDecrease (+ fallbacks) |

---

## Step 1 — Compute Derived Quantities

### Free Cash Flow (FCF)

**FCF = OCF − CX − SBC**

FCF strips out capital expenditures and stock-based compensation from operating cash flow. SBC is a non-cash add-back in OCF that inflates the reported figure — removing it ensures SBC dollars are treated as a neutral labor cost equivalent to cash wages, neither credited as productive nor penalized as extractive.

### Net CapEx

**NetCapEx = CX − DA**

Net CapEx measures whether capital spending exceeds the rate at which existing assets are wearing out. Spending above D&A indicates genuine growth investment. Spending below D&A means the company is running down its asset base — a form of implicit extraction.

### Total Allocable Cash (TAC)

**TAC = FCF**

TAC is the cash the business actually generated and controlled — nothing more. Two adjustments that appeared in earlier versions of this formula have been deliberately removed:

**Debt issuance (DI) is excluded from TAC.** Debt issuance frequently represents refinancing of existing obligations rather than genuinely new capital available for allocation. A company rolling over a maturing bond, for example, issues new debt and repays old debt in the same period — neither transaction represents a real allocation decision. Because EDGAR data does not allow us to distinguish refinancing from new borrowing, debt issuance is excluded from TAC entirely.

**Acquisitions (ACQ) are excluded from TAC.** The productive or extractive character of acquisition spending cannot be determined objectively from 10-K data alone. Excluding ACQ from TAC prevents large one-time acquisition events from distorting the denominator and all resulting ratios. Acquisitions are disclosed separately as a neutral bucket.

⚠ **Gate Check:** If TAC ≤ 0, flag this company as unscored. A company whose operations do not generate positive free cash flow has no allocable surplus to meaningfully score.

---

## Step 2 — Productive Reinvestment Score (PRS)

**PRS = [ max(NetCapEx, 0) + RD + max(DR − DI, 0) ] ÷ TAC**

The three components are:

**Growth CapEx** — capital spending above the D&A threshold. Only the portion of CapEx that exceeds D&A counts as productive investment. Maintenance CapEx (replacing worn assets at the rate they depreciate) is treated as neutral. If CX < DA, this term is zero.

**R&D** — investment in future productive capacity through research and development.

**Net Debt Repayment** — only the portion of debt repayment that exceeds new debt issuance in the same period earns productive credit: max(DR − DI, 0). A company that borrows $1B and repays $1B in the same year has not reduced its debt burden and receives no credit. This prevents refinancing activity from inflating PRS. When DR > DI, the net paydown reflects a genuine reduction in financial obligations and is credited accordingly.

---

## Step 3 — Extraction Score (ES)

**ES = [ DIV + SBB + max(DA − CX, 0) ] ÷ TAC**

The three components are:

**Dividends** — cash returned to shareholders rather than reinvested in the enterprise.

**Share Buybacks** — cash used to repurchase equity, reducing share count and transferring value to selling shareholders.

**Underfunded CapEx** — when CX < DA, the company is not replacing assets as fast as they depreciate. The shortfall [ max(DA − CX, 0) ] represents implicit extraction: the company is quietly liquidating its productive base without a visible cash transaction. This term is the mirror of the Growth CapEx term in PRS.

Note: The CapEx terms in PRS and ES are mutually exclusive by construction. Only one of the two CapEx terms is ever nonzero in a given period.

---

## Step 4 — Composite Score

**Score = PRS − ES**

| Score Range | Interpretation |
|---|---|
| Above +0.5 | Strongly productive — reinvestment substantially dominates extraction |
| +0.0 to +0.5 | Net productive — more capital going to reinvestment than extraction |
| −0.5 to 0.0 | Net extractive — more capital going to extraction than reinvestment |
| Below −0.5 | Strongly extractive — extraction substantially dominates reinvestment |

Scores outside the range of −3 to +3 are flagged as unscored. These extreme values result from very small TAC denominators (low FCF relative to the size of allocation decisions) and are not meaningfully comparable to other companies.

### NESI Score (0–100)

The composite score is converted to a 0–100 scale by mapping the −3 to +3 range linearly:

**NESI Score = round( (Score + 3) / 6 × 100 )**

Clamped to [0, 100]. Letter grades are assigned as follows:

| Score | Grade |
|---|---|
| 80–100 | A |
| 65–79 | B |
| 45–64 | C |
| 30–44 | D |
| 0–29 | F |

---

## Step 5 — Disclosure Buckets

In addition to the Composite Score, four allocation buckets describe where all capital went. These are not used in scoring but provide context for interpreting the score.

| Bucket | Formula | Scored? | Notes |
|---|---|---|---|
| Productive | PRS | Yes | Drives score positively |
| Extractive | ES | Yes (inverse) | Drives score negatively |
| Acquisitions | ACQ ÷ TAC | No — neutral | Cannot be scored objectively |
| Retained Cash | ΔCash ÷ TAC | No — neutral | Cash accumulated on balance sheet |

Buckets are normalized to sum to 100% for display purposes. Raw values may not sum to exactly 1.0 due to timing differences across financial statements.

---

## Edge Cases and Data Notes

### Missing XBRL Tags

- RD = 0 if tag absent. Many industries do not conduct formal R&D.
- DIV = 0 if tag absent. Companies that do not pay dividends will not report this tag.
- SBB = 0 if tag absent.
- ACQ = 0 if tag absent. Treat as no acquisition activity.
- DI = 0 if tag absent. Treat as no new debt raised.
- DR = 0 if tag absent.
- If OCF, CX, or DA are missing, flag the company as unscored. These are essential inputs.

### Negative Values

Some tags may return negative values depending on the company's XBRL sign convention. Before computing, confirm that CX, DR, DI, ACQ, DIV, SBB, and SBC are all expressed as positive amounts. If any are reported as negative (outflow convention), take the absolute value before applying the formula.

### Debt Treatment

Debt issuance is excluded from TAC entirely — it is not treated as allocable capital. Debt repayment earns productive credit only on a net basis: max(DR − DI, 0). A company that issues and repays equal amounts of debt in the same period receives no credit in either direction. This prevents routine refinancing from affecting the score.

### Single-Year Snapshot

Capital allocation decisions are lumpy. A major acquisition, one-time debt repayment, or unusual operating year can significantly distort a single-year score. Treat single-year scores as a starting point for investigation, not a final verdict.

---

## Complete Formula Reference

**Inputs:** OCF, CX, RD, DA, DR, DI, ACQ, DIV, SBB, SBC, ΔCash

**Derived:**
- FCF = OCF − CX − SBC
- NetCapEx = CX − DA
- TAC = FCF
- net_DR = max(DR − DI, 0)

**Gate:** If TAC ≤ 0 → flag as unscored

**Scores:**
- PRS = [ max(NetCapEx, 0) + RD + net_DR ] ÷ TAC
- ES = [ DIV + SBB + max(DA − CX, 0) ] ÷ TAC
- Score = PRS − ES
- NESI Score = round((Score + 3) / 6 × 100), clamped to [0, 100]

**Grade:**
- A: 80–100 | B: 65–79 | C: 45–64 | D: 30–44 | F: 0–29
