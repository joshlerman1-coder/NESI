# Productive Reinvestment Rating System
**Formula Specification — Version 4**

---

## Purpose

NESI scores every company on one question: of the capital it moves deliberately, what share goes toward building productive capacity versus extracting value for shareholders?

The score is adjusted downward for companies with high FCF margins, and applies an additional penalty when extraction is funded by net new debt.

**Final Score = (Productive / (Productive + Extractive)) × (1 − FCF Margin)**

The score naturally falls in [0, 1], displayed as 0–100.

---

## Data Sources

All variables are pulled from the most recent annual 10-K filing via the SEC EDGAR XBRL API (entries from 2022 onward only, to avoid stale historical tags).

| Variable | Description | XBRL Tag(s) |
|---|---|---|
| OCF | Operating Cash Flow | NetCashProvidedByUsedInOperatingActivities |
| CX | Capital Expenditures | PaymentsToAcquirePropertyPlantAndEquipment (+ fallbacks) |
| RD | R&D Expense | ResearchAndDevelopmentExpense |
| DA | Depreciation & Amortization | DepreciationDepletionAndAmortization (+ fallbacks) |
| DR | Debt Repayment | RepaymentsOfLongTermDebt (+ fallback) |
| DI | Debt Issuance | ProceedsFromIssuanceOfLongTermDebt (+ fallback) |
| DIV | Dividends Paid | PaymentsOfDividends (+ fallback) |
| SBB | Share Buybacks | PaymentsForRepurchaseOfCommonStock |
| Revenue | Total Revenue | Revenues (+ fallbacks) |
| ACQ | Acquisitions | PaymentsToAcquireBusinessesNetOfCashAcquired (+ fallbacks) — disclosed only |
| ΔCash | Change in Cash | CashAndCashEquivalentsPeriodIncreaseDecrease (+ fallbacks) — disclosed only |

---

## Step 1 — Productive Inputs

**Productive = max(CX − DA, 0) + RD + max(DR − DI, 0)**

Three things raise the score:

**Growth CapEx** = max(CX − DA, 0)
Capital spending above the depreciation threshold. Only the portion of CapEx that exceeds D&A counts as genuine growth investment. If CX < DA, this term is zero and the shortfall appears in extractive inputs. Mutually exclusive with underfunded CapEx.

**R&D** = RD
Investment in future productive capacity.

**Net Debt Repayment** = max(DR − DI, 0)
Only the net reduction in debt earns productive credit. Refinancing activity (borrowing and repaying equal amounts) earns no credit.

---

## Step 2 — Extractive Inputs

**Extractive = (max(DA − CX, 0) + DIV + SBB) × Debt Multiplier**

Three things lower the score, with an optional multiplier for debt-fueled extraction:

**Underfunded CapEx** = max(DA − CX, 0)
When capital spending falls below depreciation, the company is quietly liquidating its productive base. Mutually exclusive with Growth CapEx.

**Dividends** = DIV
Cash returned to shareholders rather than reinvested.

**Share Buybacks** = SBB
Cash used to repurchase equity.

**Debt-fueled extraction multiplier:**
```
Net New Debt    = max(DI − DR, 0)
Debt Multiplier = 1 + min((Net New Debt / (DIV + SBB)) × 0.25, 0.25)
```
When a company is a net new borrower while simultaneously returning capital to shareholders, it is borrowing to extract — mortgaging the company's future to fund dividends or buybacks. The multiplier scales from 1.0× to a maximum of 1.25×, reached when net new debt equals or exceeds 100% of shareholder returns. It only triggers when both net new debt > 0 and shareholder returns > 0.

**Gate checks:**
- If Productive + Extractive = 0 → unscored (no activity to evaluate)
- If Extractive = 0 → unscored (score of 1.0 by default is not meaningful)

---

## Step 3 — Allocation Score

**Allocation Score = Productive / (Productive + Extractive)**

The productive share of all deliberate capital moves. Ranges from 0 to 1.

---

## Step 4 — FCF Margin Adjustment

**FCF = OCF − CX − SBC**
**FCF Margin = max(OCF / Revenue, 0)**
**Final Score = Allocation Score × (1 − FCF Margin)**

A company with a very high FCF margin has more capacity to reinvest and less excuse not to. FCF margin is floored at 0 — negative FCF does not boost the score.

---

## Step 5 — Score Conversion and Grades

**NESI Score = round(Final Score × 100)** → [0, 100]

| Score | Grade | Interpretation |
|---|---|---|
| 80–100 | A | Strongly productive |
| 65–79 | B | Net productive |
| 45–64 | C | Mixed |
| 30–44 | D | Net extractive |
| 0–29 | F | Strongly extractive |

---

## Complete Formula Reference

```
Productive      = max(CX − DA, 0) + RD + max(DR − DI, 0)
net_new_debt    = max(DI − DR, 0)
debt_multiplier = 1 + min((net_new_debt / (DIV + SBB)) × 0.25, 0.25)
                  [only when DIV + SBB > 0 and net_new_debt > 0, else 1.0]
Extractive      = (max(DA − CX, 0) + DIV + SBB) × debt_multiplier
Gate            : if Productive + Extractive = 0 → unscored
Gate            : if Extractive = 0 → unscored
Alloc           = Productive / (Productive + Extractive)
FCF             = OCF − CX − SBC
FCF Margin      = max(OCF / Revenue, 0)  [floor at 0]
Score           = Alloc × (1 − FCF Margin)
NESI Score      = round(Score × 100)     [0–100]
```

---

## Edge Cases

- RD, DIV, SBB, DR, DI default to 0 if XBRL tag absent
- Revenue defaults to 0 if absent — FCF margin treated as 0 (no adjustment)
- CX, DR, DI, DIV, SBB converted to absolute values before calculation
- Only entries with fiscal year end ≥ 2022-01-01 are accepted — older tags are ignored
- Acquisitions (ACQ) disclosed but not scored
- All scores reflect the most recent annual 10-K filing only
