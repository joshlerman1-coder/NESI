import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="mono">S&P 500 — 2024 10-K Data</span>
          </div>
          <h1 className="hero-title">
            What companies do<br />
            <em>with their money</em><br />
            matters more than<br />
            how much they make.
          </h1>
          <p className="hero-sub">
            NESI scores every S&P 500 company on one question: does it reinvest surplus capital into productive capacity, or extract it for shareholders?
          </p>
          <Link to="/scores" className="hero-cta">Explore the scores →</Link>
        </div>
        <div className="hero-ticker-strip">
          <div className="ticker-scroll">
            {['AAPL','MSFT','NVDA','GOOG','META','AMZN','TSLA','JPM','V','MA','UNH','HD','PG','JNJ','XOM','CVX','ABBV','MRK','LLY','PEP','KO','BAC','WMT','DIS','NFLX','AAPL','MSFT','NVDA','GOOG','META'].map((t, i) => (
              <span key={i} className="ticker-item">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ethos ── */}
      <section className="page">
        <div className="ethos-grid">
          <div className="ethos-lead">
            <h2 className="section-title">The philosophy</h2>
            <p className="ethos-intro">
              Profit is legitimate. But profit is a starting point, not an end. The question NESI asks is what happens next.
            </p>
          </div>
          <div className="ethos-body">
            <p>
              Most financial ratings systems measure how much a company earns. NESI measures what a company <em>does</em> with what it earns. The distinction is fundamental: a company can be highly profitable and deeply extractive at the same time, returning nearly all of its surplus to shareholders while starving its own productive capacity of investment.
            </p>
            <p>
              Companies that deploy surplus into productive uses — expanding physical and technological capacity, funding research and innovation, retiring debt — build durable value. Companies that extract surplus through dividends, share buybacks, and underfunded asset maintenance transfer value away from the enterprise without creating anything new.
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
              <h4>~60 companies are unscored</h4>
              <p>Companies with negative Total Allocable Cash (meaning free cash flow plus debt raised cannot cover acquisition spending) or extreme scores caused by near-zero denominators are flagged as unscored rather than assigned a misleading number. Banks are disproportionately represented here due to how debt functions differently in financial businesses.</p>
            </div>
            <div className="caveat">
              <div className="caveat-num">06</div>
              <h4>Data is self-reported</h4>
              <p>All inputs come from XBRL tags in SEC 10-K filings. Companies choose which tags to use. Variation in reporting conventions means some metrics may be zero because the company doesn't engage in that activity, or because they use a non-standard tag NESI doesn't yet capture.</p>
            </div>
          </div>
        </div>

        <div className="home-cta-bar">
          <Link to="/scores" className="hero-cta">Explore all 440 scored companies →</Link>
          <Link to="/methodology" className="cta-secondary">Read the full methodology →</Link>
        </div>
      </section>
    </div>
  )
}
