# Productive Reinvestment Rating System
**Formula Specification — Version 3**

---

## Purpose

NESI scores every company on one question: of the capital it moves deliberately, what share goes toward building productive capacity versus extracting value for shareholders?

The score is adjusted downward for companies with high FCF margins — businesses generating exceptional cash relative to revenue have less excuse not to reinvest it.

**Final Score = (Productive / (Productive + Extractive)) × (1 − FCF Margin)**

The score naturally falls in [0, 1], displayed as 0–100.

---

## Data Sources

All variables are pulled from the most recent annual 10-K filing via the SEC EDGAR XBRL API.

| Variable | Description | XBRL Tag(s) |
|---|---|---|
| OCF | Operating Cash Flow | NetCashProvidedByUsedInOperatingActivities |
| CX | Capital Expenditures | PaymentsToAcquirePropertyPlantAndEquipment |
| RD | R&D Expense | ResearchAndDevelopmentExpense |
| DA | Depreciation & Amortization | DepreciationDepletionAndAmortization (+ fallbacks) |
| DR | Debt Repayment | RepaymentsOfLongTermDebt (+ fallback) |
| DI | Debt Issuance | ProceedsFromIssuanceOfLongTermDebt (+ fallback) |
| DIV | Dividends Paid | PaymentsOfDividends (+ fallback) |
| SBB | Share Buybacks | PaymentsForRepurchaseOfCommonStock |
| Revenue | Total Revenue | Revenues (+ fallbacks) |
| ACQ | Acquisitions | PaymentsToAcquireBusinessesNetOfCashAcquired (+ fallbacks) — disclosed only, not scored |
| ΔCash | Change in Cash | CashAndCashEquivalentsPeriodIncreaseDecrease (+ fallbacks) — disclosed only |

---

## Step 1 — Productive Inputs

**Productive = max(CX − DA, 0) + RD + max(DR − DI, 0)**

Three things raise the score:

**Growth CapEx** = max(CX − DA, 0)
Capital spending above the depreciation threshold. Only the portion of CapEx that exceeds D&A counts as genuine growth investment — spending that expands productive capacity rather than merely maintaining it. If CX < DA, this term is zero and the shortfall moves to extractive inputs instead. The two CapEx terms are mutually exclusive.

**R&D** = RD
Investment in future productive capacity through research and development.

**Net Debt Repayment** = max(DR − DI, 0)
Only the net reduction in debt earns productive credit. A company that borrows $1B and repays $1B has not reduced its debt burden and receives no credit. This prevents refinancing activity from inflating the score.

---

## Step 2 — Extractive Inputs

**Extractive = max(DA − CX, 0) + DIV + SBB**

Three things lower the score:

**Underfunded CapEx** = max(DA − CX, 0)
When capital spending falls below depreciation, the company is not replacing assets as fast as they wear out — quietly liquidating its productive base. This is the mirror of Growth CapEx. Mutually exclusive with the productive CapEx term.

**Dividends** = DIV
Cash returned to shareholders rather than reinvested in the enterprise.

**Share Buybacks** = SBB
Cash used to repurchase equity.

---

## Step 3 — Allocation Score

**Allocation Score = Productive / (Productive + Extractive)**

The productive share of all deliberate capital moves. Ranges from 0 to 1.

Only capital that goes somewhere clearly productive or clearly extractive is counted. Cash that stays on the balance sheet, is used for acquisitions, or flows through other neutral channels does not affect this ratio.

**Gate check:** If Productive + Extractive = 0, flag as unscored. There is nothing to evaluate.

---

## Step 4 — FCF Margin Adjustment

**FCF = OCF − CX − SBC** (SBC removed as non-cash distortion)
**FCF Margin = max(OCF / Revenue, 0)**
**Final Score = Allocation Score × (1 − FCF Margin)**

A company with a very high FCF margin — generating exceptional cash relative to revenue — has more capacity to reinvest productively and less excuse not to. The adjustment applies a penalty proportional to how cash-generative the business is.

- A company with 40% FCF margin: Allocation Score × 0.60
- A company with 5% FCF margin: Allocation Score × 0.95
- FCF margin is floored at 0 — negative FCF does not boost the score

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
Productive   = max(CX − DA, 0) + RD + max(DR − DI, 0)
Extractive   = max(DA − CX, 0) + DIV + SBB
Gate         : if Productive + Extractive = 0 → unscored
Alloc        = Productive / (Productive + Extractive)
FCF          = OCF − CX − SBC
FCF Margin   = max(OCF / Revenue, 0)   [floor at 0]
Score        = Alloc × (1 − FCF Margin)
NESI Score   = round(Score × 100)      [0–100]
```

---

## Edge Cases

- RD, DIV, SBB, DR, DI default to 0 if XBRL tag absent
- Revenue defaults to 0 if absent — FCF margin treated as 0 (no adjustment)
- CX, DR, DI, DIV, SBB are converted to absolute values before calculation
- Acquisitions (ACQ) are disclosed in the company breakdown but do not affect the score in either direction — their productive or extractive character cannot be determined from 10-K data alone
- All scores reflect the most recent annual 10-K filing only
