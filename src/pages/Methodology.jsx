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
            The system produces a single Composite Score between 0 and 100:
          </p>
          <ul>
            <li><strong>Score = (Productive / (Productive + Extractive)) × (1 − FCF Margin)</strong></li>
          </ul>
          <p>
            A score near 100 indicates a company that reinvests nearly all deliberate capital moves productively, with thin margins that make that reinvestment more meaningful. A score near 0 indicates a company that extracts nearly all surplus, or one that generates so much cash relative to revenue that reinvestment becomes less urgent. All inputs are drawn exclusively from SEC 10-K filings using standardized XBRL tags.
          </p>
          <p>
            The formula below is applied to <strong>each fiscal year on its own</strong>, back to
            FY2018. The headline score shown for a company is the <strong>average of its
            single-year scores over the most recent seven fiscal years</strong>, and every company
            page charts how that single-year score has moved over time. See{' '}
            <em>Multi-year scoring</em> below for the details.
          </p>
        </section>

        <section className="method-section">
          <h2>Data sources</h2>
          <p>All variables are pulled from every annual 10-K filing back to fiscal year 2018, via the SEC EDGAR XBRL API. Each value represents one full fiscal year; a single API call per company returns its entire history.</p>
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
          <h2>Step 1 — Productive inputs</h2>
          <div className="formula">Productive = max(CX − DA, 0) + RD + max(DR − DI, 0)</div>
          <p>Three things raise the score:</p>
          <ul>
            <li><strong>Growth CapEx</strong> — capital spending above the depreciation threshold. Only spending that exceeds D&A counts as genuine growth investment. Spending at or below D&A is maintenance — neutral, not counted. If CX &lt; DA, this term is zero and the shortfall appears in extractive inputs instead.</li>
            <li><strong>R&D</strong> — investment in future productive capacity.</li>
            <li><strong>Net Debt Repayment</strong> — max(DR − DI, 0). Only the portion of debt repayment that exceeds new debt issuance earns credit. A company that borrows $1B and repays $1B in the same year has not reduced its debt burden. This prevents refinancing from inflating the score.</li>
          </ul>
        </section>

        <section className="method-section">
          <h2>Step 2 — Extractive inputs</h2>
          <div className="formula">net SBB = max(SBB − SBC, 0)</div>
          <div className="formula">Extractive = (max(DA − CX, 0) + DIV + net SBB) × Debt Multiplier</div>
          <p>Three things lower the score, with an optional multiplier for debt-fueled extraction:</p>
          <ul>
            <li><strong>Underfunded CapEx</strong> — when CX &lt; DA, the company is not replacing assets as fast as they depreciate. The shortfall max(DA − CX, 0) represents implicit extraction — quietly liquidating the productive base. This is the mirror of Growth CapEx: the two terms are mutually exclusive by construction.</li>
            <li><strong>Dividends</strong> — cash returned to shareholders rather than reinvested.</li>
            <li><strong>Share Buybacks (net of SBC)</strong> — only the portion of buybacks that exceeds stock-based compensation (SBC) counts as extractive. Buybacks up to the SBC amount merely offset the dilution created by paying employees in equity — economically equivalent to paying those employees in cash, which would already have reduced OCF. Only the excess beyond SBC genuinely reduces the share count and returns capital to outside shareholders.</li>
          </ul>
          <p className="method-note">
            <em>Note:</em> earlier versions added a government-assistance penalty (0.5 × GA)
            here. As of the per-year methodology (v5) that term has been removed — government
            assistance only exists for recent years and can't be applied consistently across
            the full 2018+ history. The data is still shown on each company page for context,
            but it no longer affects any score.
          </p>
          <h3>Debt-fueled extraction multiplier</h3>
          <div className="formula">Net New Debt = max(DI − DR, 0)</div>
          <div className="formula">Debt Multiplier = 1 + min((Net New Debt / (DIV + net SBB)) × 0.25, 0.25)</div>
          <p>
            When a company is a net new borrower (issuing more debt than it repays) while simultaneously returning capital to shareholders, it is borrowing to extract — mortgaging the company's future to fund dividends or buybacks today. The multiplier applies a penalty of up to 25% on the extractive total. It reaches its maximum (1.25×) when net new debt equals or exceeds 100% of shareholder returns, and scales linearly below that. It only triggers on net new debt to avoid penalizing routine refinancing.
          </p>
          <div className="method-callout">
            <strong>Gate check:</strong> If Extractive = 0, the company is flagged as unscored. A score of 1.0 by default (when there is no extractive activity) is not meaningful — it may simply reflect an early-stage company that hasn’t yet begun returning capital.
          </div>
        </section>

        <section className="method-section">
          <h2>Step 3 — Allocation Score</h2>
          <div className="formula">Allocation Score = Productive ÷ (Productive + Extractive)</div>
          <p>
            The allocation score is simply the productive share of all deliberate capital moves. It ranges from 0 to 1. Cash that stays on the balance sheet, is used for acquisitions, or flows through other neutral channels does not affect this ratio — only capital that goes somewhere clearly productive or clearly extractive is considered.
          </p>
          <div className="method-callout">
            <strong>Gate check:</strong> If Productive + Extractive = 0, the company is flagged as unscored. There is nothing to evaluate.
          </div>
        </section>

        <section className="method-section">
          <h2>Step 4 — FCF Margin adjustment</h2>
          <div className="formula">FCF Margin = max(FCF ÷ Revenue, 0)</div>
          <div className="formula">Final Score = Allocation Score × (1 − FCF Margin)</div>
          <p>
            A company with a very high FCF margin — generating exceptional cash relative to revenue — has more capacity to reinvest productively and less excuse not to. The FCF margin adjustment applies a penalty proportional to how cash-generative the business is. A company with a 40% FCF margin sees its allocation score multiplied by 0.6. A company with a 5% margin is barely affected.
          </p>
          <p>
            FCF margin is floored at zero. A company with negative free cash flow does not receive a bonus — it is simply treated as if the margin adjustment is neutral (multiplier of 1.0).
          </p>
          <p>
            The final score naturally falls in [0, 1], which is multiplied by 100 for display.
          </p>
        </section>

        <section className="method-section">
          <h2>Step 5 — Score conversion and grades</h2>
          <div className="formula">NESI Score = round(Final Score × 100)</div>
          <div className="method-table-wrap">
            <table className="method-table">
              <thead><tr><th>Score</th><th>Grade</th><th>Interpretation</th></tr></thead>
              <tbody>
                <tr><td className="mono positive">80–100</td><td>A</td><td>Strongly productive</td></tr>
                <tr><td className="mono positive">65–79</td><td>B</td><td>Net productive</td></tr>
                <tr><td className="mono">45–64</td><td>C</td><td>Mixed</td></tr>
                <tr><td className="mono negative">30–44</td><td>D</td><td>Net extractive</td></tr>
                <tr><td className="mono negative">0–29</td><td>F</td><td>Strongly extractive</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="method-section">
          <h2>Multi-year scoring</h2>
          <p>
            The five steps above produce a score for a <strong>single fiscal year</strong>. NESI
            runs them independently for every fiscal year a company has filed since FY2018, giving
            a series of single-year scores — the line you see on each company page's
            <em> Score over time</em> chart.
          </p>
          <div className="formula">Headline Score = average of single-year scores over the most recent 7 fiscal years</div>
          <p>
            The headline number the site lists and ranks on is the <strong>average of those
            single-year scores across the most recent seven scored fiscal years</strong>. Averaging
            smooths out the lumpiness of any one year — a single large buyback or debt repayment no
            longer swings the headline — while the underlying chart still shows the year-to-year
            movement. A company needs at least <strong>three</strong> scored years to receive a
            headline; newer companies are averaged over the years they have.
          </p>
          <p>
            Each page also shows a <strong>trend</strong> — the change in single-year score from the
            first to the most recent year in the window — so you can see whether a company has been
            getting more productive or more extractive over time, independent of its average level.
          </p>
          <div className="method-callout">
            <strong>Why per-year instead of one multi-year sum?</strong> Earlier versions summed
            three years of cash flows and scored the total once. Scoring each year on its own and
            then averaging gives the same smoothing benefit but also yields a real, comparable score
            for every individual year — which is what makes the long-run trend visible.
          </div>
        </section>

        <section className="method-section">
          <h2>Government assistance (ASC 832 + USAspending.gov) — context only</h2>
          <div className="method-callout">
            <strong>Not part of the score.</strong> As of the per-year methodology, government
            assistance no longer affects any NESI score. It only exists for recent years
            (ASC 832 began ~FY2022; USAspending coverage used here is FY2022–2024) and cannot be
            applied consistently across the full 2018+ history. The figures below are still
            collected and displayed on each company page as context, and the "took public money
            while extracting" flag still appears — but neither changes a score.
          </div>
          <p>
            NESI combines two complementary sources to measure public-money inflows. First, the new disclosure standard from the Financial Accounting Standards Board: <strong>ASC 832 — Disclosures by Business Entities about Government Assistance</strong>. Effective for fiscal years beginning after December 15, 2021, it requires publicly traded companies to disclose in their annual reports the grants, forgivable loans, tax abatements, and other below-market government transfers they received during the period. Second, <strong>USAspending.gov</strong>, the federal government's official transparency database of grants, loans, and other financial-assistance awards paid from the U.S. Treasury.
          </p>
          <p>
            Crucially, both sources <strong>exclude</strong> ordinary revenue from government contracts. A defense contractor selling fighter jets to the DoD does not appear here; that is a commercial transaction priced at arm's length and is already reflected in the company's cash flows. What these sources capture is money that flowed from the public to the company without a corresponding service in exchange — the "free money" bucket.
          </p>
          <div className="formula">GA = max( SEC ASC 832 3-year total, USAspending.gov FY2022–2024 total )</div>
          <p>
            NESI takes the <em>higher</em> of the two sources rather than summing them, since the same award often surfaces in both. This avoids double-counting while ensuring coverage for companies that disclose under ASC 832 but are not easily matched on USAspending, and vice versa. Combining the two lifts coverage from roughly 4% (SEC-only) to over 12% of companies with detected public-money inflows.
          </p>
          <h3>How NESI extracts the data</h3>
          <p>
            <strong>SEC source:</strong> values are pulled directly from XBRL-tagged 10-K filings. Because ASC 832 adoption has produced a fragmented tag vocabulary, NESI walks a priority list of annual-flow concepts and takes the first one a company actually reports, in this order:
          </p>
          <ul>
            <li><code>GovernmentAssistanceAmount</code> — the primary catch-all</li>
            <li><code>GovernmentAssistanceExpense</code> — recognized in P&L as expense offset</li>
            <li><code>GovernmentAssistanceOperatingExpense</code> — operating-expense reduction</li>
            <li><code>GovernmentAssistanceAssetDecrease</code> — grant capitalized against PP&E (typical CHIPS Act treatment)</li>
            <li><code>RevenueFromGrants</code> — last-resort fallback</li>
          </ul>
          <p>
            Balance-sheet tags (<code>*Liability</code>, <code>*Cumulative</code>, <code>GrantsReceivable</code>) are intentionally excluded because they represent stocks rather than flows and would double-count period-recognized amounts.
          </p>
          <p>
            <strong>USAspending source:</strong> NESI queries the USAspending.gov public API in two steps. First, the <code>/api/v2/recipient/</code> endpoint resolves each ticker to its canonical legal entity name (e.g. MRNA → "MODERNATX, INC.", BA → "THE BOEING COMPANY"). Second, the <code>/api/v2/search/spending_by_award/</code> endpoint pulls award-level records for fiscal years 2022–2024 across three assistance categories — grants (award-type codes 02–05), loans (07–08), and other financial assistance (06, 10, 11) — post-filtered to recipients whose normalized name matches the canonical entity or a direct subsidiary. Ordinary procurement contracts are excluded by design, since USAspending's assistance-award endpoint does not return them.
          </p>
          <h3>How it affects the score</h3>
          <p>
            It doesn't. Earlier versions added half the reported government-assistance amount
            (0.5 × GA) to the Extractive side of the formula. That penalty has been removed in the
            per-year methodology, because the data only exists for recent years and applying it to
            some years but not others would distort the long-run trend. The amounts are reported
            here purely as context.
          </p>
          <h3>The "Took public money while extracting" flag</h3>
          <p>
            A company page displays a red alert at the top when the company received any government assistance AND paid dividends or repurchased shares in the same fiscal year. The flag has no effect on the score — it is purely a narrative signal: in the same year this company accepted taxpayer-subsidized capital, it also returned cash to shareholders.
          </p>
          <h3>Limitations</h3>
          <ul>
            <li><strong>Coverage gap.</strong> ASC 832 is new; not all companies tag values consistently yet. USAspending closes part of this gap for federal awards, but a zero on both sources does not mean the company received no government assistance — only that no matching record was found.</li>
            <li><strong>Tax credits excluded.</strong> Tax credits claimed on corporate tax returns (IRA §45X EV manufacturing credits, §48 clean energy credits, R&D credits) are neither ASC 832 disclosures nor USAspending awards. EV, clean energy, and semiconductor companies claiming production credits are likely understated.</li>
            <li><strong>CHIPS Act disbursements lag.</strong> The largest CHIPS Act subsidies (Intel, Micron, TSMC-US, Samsung, GlobalFoundries) were announced in 2023–2024 but many have not yet been obligated and paid, and so do not yet appear as disbursed assistance on USAspending. Semiconductor companies in particular will show larger figures in future updates.</li>
            <li><strong>State and local incentives may be missing.</strong> USAspending covers federal awards only. For systematic state/local coverage, Good Jobs First's Subsidy Tracker is more complete.</li>
            <li><strong>Entity resolution is imperfect.</strong> Matching a stock ticker to the exact legal entities USAspending uses requires hand-curated overrides in edge cases (e.g. Alphabet vs Google LLC, Berkshire Hathaway vs its hundreds of operating subsidiaries). Only assistance paid to the filing entity or a direct subsidiary is captured.</li>
          </ul>
        </section>

        <section className="method-section">
          <h2>Supplementary metric — Extraction per employee</h2>
          <div className="formula">Extraction per Employee = (DIV + net SBB + max(DA − CX, 0)) ÷ Full-time Employees</div>
          <p>
            Shown on every company page alongside the main score, this metric divides the dollar value of a single year's extractive activity by the company's full-time headcount. It expresses how much value management chose to return to shareholders — or quietly liquidate from the asset base — per worker employed.
          </p>
          <p>
            Two of the three numerator components are actual cash outflows: dividends paid and net share buybacks. The third, underfunded CapEx (max(DA − CX, 0)), is not a cash flow — it is an accounting measure of how far capital spending fell short of keeping pace with asset depreciation. It is included because the economic claim is real: assets that are not replaced as they wear out eventually must be, and the cost of that deferred reinvestment is borne by whoever owns the company in the future. Choosing not to reinvest today transfers value to current shareholders in the same way a cash dividend does, just on a deferred timeline and in a less visible form. The debt multiplier applied in the main score is intentionally excluded here — it is a scoring mechanism, not an observable dollar amount, and including it would make the per-employee figure uninterpretable as an actual value transfer.
          </p>
          <p>
            <strong>What it demonstrates.</strong> A large number does not automatically mean a company is doing something wrong — capital-intensive businesses with small headcounts will mechanically produce higher per-employee values than labor-intensive ones. But within a sector, it surfaces a real allocation choice: two peers with similar economics can return very different amounts per worker, and that gap reflects deliberate decisions about dividends, buybacks, and reinvestment priorities. Each company's value is shown next to its sector median for this reason.
          </p>
          <p>
            <strong>Limitations.</strong> Employee counts come from Yahoo Finance (full-time only) rather than SEC filings, so reporting conventions vary. The numerator uses a single year of flows and imputed costs, which can be lumpy — a one-time special dividend or large buyback will distort a single year. The underfunded CapEx term is an imperfect proxy for asset depletion; it will overstate the problem for companies in secular decline and understate it for those with very long-lived assets. The metric ignores part-time, contract, and outsourced labor, which can meaningfully understate the true workforce for some businesses. Cross-sector comparisons are misleading; intra-sector comparisons are informative.
          </p>
        </section>

        <section className="method-section">
          <h2>Edge cases & data notes</h2>
          <h3>Missing XBRL tags</h3>
          <p>RD, DIV, SBB, ACQ, and DI default to 0 if absent — many companies legitimately don't engage in these activities. If OCF, CX, or DA are missing, the company is flagged as unscored.</p>

          <h3>Negative values</h3>
          <p>Some tags may return negative values depending on the company's XBRL sign convention. CX, DR, DI, ACQ, DIV, SBB, and SBC are all converted to positive outflow amounts before calculation.</p>

          <h3>Debt treatment</h3>
          <p>Debt issuance (DI) is excluded from TAC entirely because it cannot be reliably classified as allocable capital — it often represents refinancing rather than new funds. Debt repayment only earns productive credit on a net basis: max(DR − DI, 0). A company that issues and repays equal amounts of debt in the same period receives no credit in either direction.</p>

          <h3>Per-year history and averaging</h3>
          <p>Each fiscal year is scored on its own data, back to FY2018, and the headline is the average of the most recent seven single-year scores. Capital allocation decisions are lumpy — a major acquisition or debt repayment in one year can swing that year's score — which is exactly why the headline averages multiple years. The <em>Score over time</em> chart on each company page shows the individual years so the lumpiness, and the long-run trend, are both visible.</p>

          <h3>Financials, REITs, and unscored companies</h3>
          <p>Banks and insurers frequently don't report PP&E capital expenditures or a consolidated depreciation line under standard XBRL tags, so they fail the OCF/CX/DA gate and are left unscored — the productive-vs-extractive framing built around capex and depreciation doesn't fit their balance sheets. A small number of other companies tag capex only in company-specific extension namespaces NESI doesn't parse.</p>
          <p><strong>Equity REITs</strong> don't tag PP&E capex either — they invest by acquiring and developing real estate. NESI now reads those real-estate-acquisition tags (<span className="mono">PaymentsToAcquireRealEstate</span>, <span className="mono">…HeldForInvestment</span>, <span className="mono">…DevelopRealEstateAssets</span>) as capital expenditure, so most equity REITs are now scored. Mortgage REITs, which hold loans rather than property, have no such capex and remain unscored.</p>
          <div className="method-callout">
            <strong>Read scored REITs and financials with caution.</strong> REITs that report capex — now including real-estate acquisition — and depreciation pass the gate and receive a score, but the operating-company model still misreads them, so their grades are not directly comparable to ordinary companies. Three structural distortions stack up for a REIT: (1) revenue is just rental income, a thin slice of the asset base, while operating cash flow adds back large real-estate depreciation — so the <strong>FCF margin runs structurally high</strong> (UHT shows ~43%) without indicating cash hoarding; (2) real estate is depreciated far faster than it is recapitalized, so depreciation routinely exceeds maintenance capex and trips the <strong>underfunded-capex extractive penalty</strong> even when the business is healthy; and (3) a REIT must distribute roughly 90% of taxable income as dividends by law, and those mandatory payouts are <strong>counted as extractive shareholder returns</strong>. The net effect is that scored REITs cluster at the bottom of the rankings as an artifact of their structure rather than their actual capital allocation. A REIT-appropriate framework would use FFO/AFFO rather than the capex-vs-depreciation lens; until that exists, treat any REIT or financial score as indicative at best.</div>

          <h3>Negative operating cash flow</h3>
          <p>Companies with negative average operating cash flow over their scored window are left unscored at this time. NESI measures how a company allocates its operating <em>surplus</em>, and a business that is burning cash has no surplus to allocate — without this gate the formula would hand pre-revenue and cash-burning companies an inflated score. Their underlying data is still ingested and retained.</p>
        </section>

      </div>
    </div>
  )
}
