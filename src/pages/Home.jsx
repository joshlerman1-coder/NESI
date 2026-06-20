import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="mono">U.S. Public Companies · SEC 10-K Data</span>
          </div>
          <h1 className="hero-title">
            Which companies are reinvesting,<br />
            and which are just <em className="hero-extracting">extracting</em>?
          </h1>
          <p className="hero-sub">
            NESI scores U.S. public companies on one question: does it reinvest surplus capital into productive capacity, or extract it for shareholders?
          </p>
          <Link to="/" className="hero-cta">Explore the scores →</Link>
        </div>
      </section>

      {/* ── Ethos ── */}
      <section className="page">
        <div className="ethos-grid">
          <div className="ethos-lead">
            <div className="definition-entry">
              <div className="definition-headword">
                <span className="definition-word">rent-seeking</span>
                <span className="definition-pron">/ˈrent ˌsēkiNG/</span>
              </div>
              <div className="definition-pos"><em>noun</em>, economics</div>
              <p className="definition-meaning">
                the practice of increasing one's share of existing wealth without creating new wealth; the extraction of value from the economy by capturing rents, subsidies, or surplus rather than producing new goods, services, or productive capacity.
              </p>
            </div>
          </div>
          <div className="ethos-body">
            <h2 className="section-title">The philosophy</h2>
            <p>
              Most financial ratings systems measure how much a company earns. NESI measures what a company <em>does</em> with what it earns. Many companies return nearly all of their surplus to shareholders while starving their own productive capacity of investment, underpaying their employees, and avoiding environmental upgrades.
            </p>
            <p>
              Companies that deploy surplus into productive uses, such as expanding physical and technological capacity, funding research and innovation, and retiring debt, build durable value. Companies that extract surplus through dividends, share buybacks, and underfunded asset maintenance transfer value away from the enterprise without creating anything new.
            </p>
            <p>
              NESI does not argue that extraction is always wrong or that reinvestment is always right. It argues that the ratio between the two is meaningful information that most financial data platforms do not surface clearly. NESI surfaces it.
            </p>
          </div>
        </div>

        <hr className="divider" />

        {/* ── How it works ── */}
        <div className="how-grid">
          <div className="how-card productive">
            <div className="how-label">Productive reinvestment</div>
            <h3>What earns a higher score</h3>
            <ul>
              <li>Capital expenditures above the depreciation threshold — investing in new capacity, not just maintaining old</li>
              <li>Research & development spending — investing in future productive capacity</li>
              <li>Debt repayment — strengthening the balance sheet and freeing future cash flow</li>
            </ul>
          </div>
          <div className="how-card extractive">
            <div className="how-label">Extraction</div>
            <h3>What lowers a score</h3>
            <ul>
              <li>Dividends paid — cash returned to shareholders rather than reinvested</li>
              <li>Share buybacks — equity repurchased, transferring value to selling shareholders</li>
              <li>Underfunded CapEx — spending below depreciation, quietly liquidating the asset base</li>
            </ul>
          </div>
        </div>

        <hr className="divider" />

        {/* ── Caveats ── */}
        <div className="caveats">
          <h2 className="section-title">Limitations & caveats</h2>
          <div className="caveat-grid">
            <div className="caveat">
              <div className="caveat-num">01</div>
              <h4>This is not investment advice</h4>
              <p>NESI scores capital allocation behavior. A high score does not mean a company is a good investment. A low score does not mean it is a bad one. Valuation, competitive dynamics, management quality, and many other factors determine investment outcomes.</p>
            </div>
            <div className="caveat">
              <div className="caveat-num">02</div>
              <h4>Industry context matters</h4>
              <p>A utility company that issues debt to build infrastructure will score differently than a software company that generates cash with minimal capital needs. NESI shows sector comparisons alongside absolute scores precisely because industry context is essential for interpretation.</p>
            </div>
            <div className="caveat">
              <div className="caveat-num">03</div>
              <h4>One year is a snapshot</h4>
              <p>Capital allocation decisions are lumpy. A company that makes a major acquisition one year will look very different from its normal pattern. NESI scores the most recent 10-K filing only. Treat single-year scores as a starting point for investigation, not a final verdict.</p>
            </div>
            <div className="caveat">
              <div className="caveat-num">04</div>
              <h4>Acquisitions are excluded from scoring</h4>
              <p>Whether an acquisition creates or destroys productive value cannot be determined from 10-K data alone. Acquisitions are disclosed separately in the company breakdown but do not affect the score in either direction.</p>
            </div>
            <div className="caveat">
              <div className="caveat-num">05</div>
              <h4>Some companies are unscored</h4>
              <p>Companies that don't generate positive operating cash flow (no surplus to allocate), that lack the capital-expenditure and depreciation lines the formula needs, or that have too little filing history are flagged as unscored rather than assigned a misleading number. Banks, insurers, and pre-revenue companies are disproportionately represented here.</p>
            </div>
            <div className="caveat">
              <div className="caveat-num">06</div>
              <h4>Data is self-reported</h4>
              <p>All inputs come from XBRL tags in SEC 10-K filings. Companies choose which tags to use. Variation in reporting conventions means some metrics may be zero because the company doesn't engage in that activity, or because they use a non-standard tag NESI doesn't yet capture.</p>
            </div>
          </div>
        </div>

        <div className="home-cta-bar">
          <Link to="/" className="hero-cta">Explore all scored companies →</Link>
          <Link to="/methodology" className="cta-secondary">Read the full methodology →</Link>
        </div>
      </section>
    </div>
  )
}
