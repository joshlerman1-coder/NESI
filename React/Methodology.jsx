import './Methodology.css'

export default function Methodology() {
  return (
    <div className="page methodology">
      <div className="method-header">
        <p className="method-eyebrow">Documentation</p>
        <h1>Methodology</h1>
        <p className="method-subtitle">
          How NESI converts SEC EDGAR cash flow data into a single Composite Score.
        </p>
      </div>

      <div className="method-body">

        <section className="method-section">
          <h2>Purpose</h2>
          <p>
            NESI evaluates publicly traded companies based on what they do with surplus capital. The underlying philosophy is that profit is legitimate and desirable, but what matters is how that profit is reinvested. Companies that deploy surplus into productive uses — growing their productive capacity, funding innovation, and retiring debt — create durable value. Companies that extract surplus through dividends, share repurchases, and underfunded asset maintenance transfer value away from the enterprise without creating new productive capacity.
          </p>
          <p>
            The system produces two component scores and one composite:
          </p>
          <ul>
            <li><strong>Productive Reinvestment Score (PRS)</strong> — the share of allocable cash directed toward productive ends</li>
            <li><strong>Extraction Score (ES)</strong> — the share of allocable cash directed toward extractive ends</li>
            <li><strong>Composite Score</strong> = PRS − ES</li>
          </ul>
          <p>
            A positive score indicates a company that reinvests more than it extracts. A negative score indicates the reverse. All inputs are drawn exclusively from SEC 10-K filings using standardized XBRL tags.
          </p>
        </section>

        <section className="method-section">
          <h2>Data sources</h2>
          <p>All variables are pulled from the most recent annual 10-K filing via the SEC EDGAR XBRL API. Values represent the full fiscal year.</p>
          <div className="method-table-wrap">
            <table className="method-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Description</th>
                  <th>XBRL Tag</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['OCF', 'Operating Cash Flow', 'NetCashProvidedByUsedInOperatingActivities'],
                  ['CX', 'Capital Expenditures', 'PaymentsToAcquirePropertyPlantAndEquipment'],
                  ['RD', 'R&D Expense', 'ResearchAndDevelopmentExpense'],
                  ['DA', 'Depreciation & Amortization', 'DepreciationDepletionAndAmortization'],
                  ['DR', 'Debt Repayment', 'RepaymentsOfLongTermDebt'],
                  ['DI', 'Debt Issuance', 'ProceedsFromIssuanceOfLongTermDebt'],
                  ['ACQ', 'Acquisitions (net of cash)', 'PaymentsToAcquireBusinessesNetOfCashAcquired'],
                  ['DIV', 'Dividends Paid', 'PaymentsOfDividends'],
                  ['SBB', 'Share Buybacks', 'PaymentsForRepurchaseOfCommonStock'],
                  ['SBC', 'Stock-Based Compensation', 'ShareBasedCompensation'],
                  ['ΔCash', 'Change in Cash Balance', 'CashAndCashEquivalentsPeriodIncreaseDecrease'],
                ].map(([v, d, t]) => (
                  <tr key={v}>
                    <td className="mono">{v}</td>
                    <td>{d}</td>
                    <td className="mono tag">{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="method-section">
          <h2>Step 1 — Derived quantities</h2>

          <h3>Free Cash Flow (FCF)</h3>
          <div className="formula">FCF = OCF − CX − SBC</div>
          <p>
            FCF strips out capital expenditures and stock-based compensation from operating cash flow. SBC is a non-cash add-back in OCF that inflates the reported figure — removing it ensures SBC dollars are treated as a neutral labor cost equivalent to cash wages.
          </p>

          <h3>Net CapEx</h3>
          <div className="formula">NetCapEx = CX − DA</div>
          <p>
            Net CapEx measures whether capital spending exceeds the rate at which existing assets are wearing out. Spending above D&A indicates genuine growth investment. Spending below D&A means the company is running down its asset base.
          </p>

          <h3>Total Allocable Cash (TAC)</h3>
          <div className="formula">TAC = FCF + DI − ACQ</div>
          <p>
            TAC is the pool of capital available for allocation decisions during the period. Acquisitions are excluded because their productive or extractive character cannot be determined objectively from 10-K data alone.
          </p>
          <div className="method-callout">
            <strong>Gate check:</strong> If TAC ≤ 0, the company is flagged as unscored. Ratios computed against a near-zero or negative denominator are not meaningful.
          </div>
        </section>

        <section className="method-section">
          <h2>Step 2 — Productive Reinvestment Score (PRS)</h2>
          <div className="formula">PRS = [ max(NetCapEx, 0) + RD + DR ] ÷ TAC</div>
          <p>The three components are:</p>
          <ul>
            <li><strong>Growth CapEx</strong> — capital spending above the D&A threshold. Only the portion of CapEx that exceeds D&A counts as productive investment.</li>
            <li><strong>R&D</strong> — investment in future productive capacity through research and development.</li>
            <li><strong>Debt Repayment</strong> — retiring debt strengthens the balance sheet and reduces future interest obligations.</li>
          </ul>
          <p>PRS can exceed 1.0 if the company is funding productive reinvestment heavily from debt issuance. This is not an error.</p>
        </section>

        <section className="method-section">
          <h2>Step 3 — Extraction Score (ES)</h2>
          <div className="formula">ES = [ DIV + SBB + max(DA − CX, 0) ] ÷ TAC</div>
          <p>The three components are:</p>
          <ul>
            <li><strong>Dividends</strong> — cash returned to shareholders rather than reinvested.</li>
            <li><strong>Share Buybacks</strong> — cash used to repurchase equity.</li>
            <li><strong>Underfunded CapEx</strong> — when CX &lt; DA, the company is not replacing assets as fast as they depreciate. The shortfall represents implicit extraction.</li>
          </ul>
          <p>The CapEx terms in PRS and ES are mutually exclusive by construction — only one is ever nonzero in a given period.</p>
        </section>

        <section className="method-section">
          <h2>Step 4 — Composite Score</h2>
          <div className="formula">Score = PRS − ES</div>
          <div className="method-table-wrap">
            <table className="method-table">
              <thead>
                <tr><th>Score Range</th><th>Interpretation</th></tr>
              </thead>
              <tbody>
                <tr><td className="mono positive">Above +0.5</td><td>Strongly productive — reinvestment substantially dominates extraction</td></tr>
                <tr><td className="mono positive">0.0 to +0.5</td><td>Net productive — more capital going to reinvestment than extraction</td></tr>
                <tr><td className="mono negative">−0.5 to 0.0</td><td>Net extractive — more capital going to extraction than reinvestment</td></tr>
                <tr><td className="mono negative">Below −0.5</td><td>Strongly extractive — extraction substantially dominates reinvestment</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Scores outside the range of −3 to +3 are flagged as unscored. These extreme values result from very small TAC denominators and are not meaningfully comparable to other companies.
          </p>
        </section>

        <section className="method-section">
          <h2>Step 5 — Disclosure buckets</h2>
          <p>In addition to the Composite Score, four allocation buckets describe where all capital went. They are not used in scoring but provide context.</p>
          <div className="method-table-wrap">
            <table className="method-table">
              <thead>
                <tr><th>Bucket</th><th>Formula</th><th>Scored?</th></tr>
              </thead>
              <tbody>
                <tr><td>Productive</td><td className="mono">PRS</td><td>Yes — drives score positively</td></tr>
                <tr><td>Extractive</td><td className="mono">ES</td><td>Yes — drives score negatively</td></tr>
                <tr><td>Acquisitions</td><td className="mono">ACQ ÷ TAC</td><td>No — neutral</td></tr>
                <tr><td>Retained Cash</td><td className="mono">ΔCash ÷ TAC</td><td>No — neutral</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="method-section">
          <h2>Edge cases & data notes</h2>
          <h3>Missing XBRL tags</h3>
          <p>RD, DIV, SBB, ACQ, and DI default to 0 if absent — many companies legitimately don't engage in these activities. If OCF, CX, or DA are missing, the company is flagged as unscored.</p>

          <h3>Negative values</h3>
          <p>Some tags may return negative values depending on the company's XBRL sign convention. CX, DR, DI, ACQ, DIV, SBB, and SBC are all converted to positive outflow amounts before calculation.</p>

          <h3>Debt issuance vs. net debt</h3>
          <p>DI represents gross new debt issuance, not net debt change. This avoids penalizing companies that raise debt to fund acquisitions — since acquisitions are already removed from TAC.</p>

          <h3>Single-year snapshot</h3>
          <p>All scores reflect the most recent 10-K filing only. Capital allocation decisions are lumpy — a major acquisition or debt repayment in one year can significantly distort the score. Treat single-year scores as a starting point for investigation.</p>
        </section>

      </div>
    </div>
  )
}
