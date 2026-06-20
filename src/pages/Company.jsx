import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../neonClient'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import './Company.css'

const SECTOR_MAP = {
  AAPL:'Information Technology',MSFT:'Information Technology',NVDA:'Information Technology',
  AVGO:'Information Technology',ORCL:'Information Technology',CRM:'Information Technology',
  AMD:'Information Technology',QCOM:'Information Technology',TXN:'Information Technology',
  IBM:'Information Technology',NOW:'Information Technology',ANET:'Information Technology',
  MU:'Information Technology',ADI:'Information Technology',KLAC:'Information Technology',
  LRCX:'Information Technology',AMAT:'Information Technology',SNPS:'Information Technology',
  CDNS:'Information Technology',MCHP:'Information Technology',FTNT:'Information Technology',
  PANW:'Information Technology',
  GOOG:'Communication Services',GOOGL:'Communication Services',META:'Communication Services',
  NFLX:'Communication Services',DIS:'Communication Services',CMCSA:'Communication Services',
  T:'Communication Services',VZ:'Communication Services',TMUS:'Communication Services',
  LYV:'Communication Services',EA:'Communication Services',
  AMZN:'Consumer Discretionary',TSLA:'Consumer Discretionary',HD:'Consumer Discretionary',
  MCD:'Consumer Discretionary',NKE:'Consumer Discretionary',SBUX:'Consumer Discretionary',
  LOW:'Consumer Discretionary',TJX:'Consumer Discretionary',BKNG:'Consumer Discretionary',
  MAR:'Consumer Discretionary',HLT:'Consumer Discretionary',GM:'Consumer Discretionary',
  EBAY:'Consumer Discretionary',DHI:'Consumer Discretionary',TPR:'Consumer Discretionary',
  DRI:'Consumer Discretionary',YUM:'Consumer Discretionary',CMG:'Consumer Discretionary',
  WMT:'Consumer Staples',PG:'Consumer Staples',KO:'Consumer Staples',PEP:'Consumer Staples',
  COST:'Consumer Staples',PM:'Consumer Staples',MO:'Consumer Staples',
  MDLZ:'Consumer Staples',CL:'Consumer Staples',KHC:'Consumer Staples',
  GIS:'Consumer Staples',HSY:'Consumer Staples',CHD:'Consumer Staples',
  XOM:'Energy',CVX:'Energy',COP:'Energy',EOG:'Energy',SLB:'Energy',
  MPC:'Energy',VLO:'Energy',PSX:'Energy',OXY:'Energy',HAL:'Energy',
  JNJ:'Health Care',UNH:'Health Care',LLY:'Health Care',ABBV:'Health Care',
  MRK:'Health Care',PFE:'Health Care',TMO:'Health Care',DHR:'Health Care',
  BMY:'Health Care',AMGN:'Health Care',GILD:'Health Care',ISRG:'Health Care',
  SYK:'Health Care',MDT:'Health Care',HUM:'Health Care',CI:'Health Care',
  CVS:'Health Care',INCY:'Health Care',VRTX:'Health Care',REGN:'Health Care',
  BA:'Industrials',HON:'Industrials',UPS:'Industrials',CAT:'Industrials',
  DE:'Industrials',GE:'Industrials',RTX:'Industrials',LMT:'Industrials',
  NOC:'Industrials',GD:'Industrials',MMM:'Industrials',EMR:'Industrials',
  ETN:'Industrials',FDX:'Industrials',UNP:'Industrials',CSX:'Industrials',
  NSC:'Industrials',DAL:'Industrials',LUV:'Industrials',PWR:'Industrials',EME:'Industrials',
  JPM:'Financials',BAC:'Financials',GS:'Financials',MS:'Financials',
  C:'Financials',AXP:'Financials',BLK:'Financials',SCHW:'Financials',
  CB:'Financials',SPGI:'Financials',MCO:'Financials',ICE:'Financials',
  CME:'Financials',V:'Financials',MA:'Financials',PYPL:'Financials',
  AMT:'Real Estate',PLD:'Real Estate',CCI:'Real Estate',EQIX:'Real Estate',
  PSA:'Real Estate',WELL:'Real Estate',O:'Real Estate',SPG:'Real Estate',
  SBAC:'Real Estate',DOC:'Real Estate',
  NEE:'Utilities',DUK:'Utilities',SO:'Utilities',AEP:'Utilities',
  EXC:'Utilities',SRE:'Utilities',XEL:'Utilities',WEC:'Utilities',
  ETR:'Utilities',AWK:'Utilities',AEE:'Utilities',CNP:'Utilities',
  EVRG:'Utilities',PEG:'Utilities',VST:'Utilities',
  LIN:'Materials',SHW:'Materials',ECL:'Materials',NEM:'Materials',
  FCX:'Materials',NUE:'Materials',STLD:'Materials',DOW:'Materials',
  LYB:'Materials',PPG:'Materials',IFF:'Materials',
}

function getSector(ticker) { return SECTOR_MAP[ticker] || 'Other' }
function fmt(n) { if (n == null) return '—'; return (n / 1e9).toFixed(2) + 'B' }
function fmtAbs(n) { if (n == null) return '—'; return '$' + Math.abs(n / 1e9).toFixed(2) + 'B' }
function fmtPerEmp(n) {
  if (n == null || !isFinite(n)) return '—'
  const v = Math.abs(n)
  if (v >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return '$' + Math.round(n / 1e3).toLocaleString() + 'K'
  return '$' + Math.round(n).toLocaleString()
}
function fmtCount(n) {
  if (n == null || !isFinite(n)) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toLocaleString()
}

function scoreColor(s) {
  if (s >= 80) return 'var(--green)'
  if (s >= 65) return '#2d8a50'
  if (s >= 45) return '#c07020'
  if (s >= 30) return '#b04010'
  return 'var(--red)'
}

function gradeClass(grade) {
  return { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' }[grade] || ''
}

function joinList(items) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

// One-sentence, plain-English summary of why this company got its grade,
// built from the driver breakdown and FCF margin. Top positive + top negative
// factor each get a human-readable phrase; grade sets the framing.
function buildWhySentence(company, drivers) {
  if (!company) return ''
  const { positive, negative } = drivers
  const grade = company.grade
  const fcfMargin = Number(company.fcf_margin) || 0

  const gradePhrase = {
    A: 'top grade',
    B: 'strong grade',
    C: 'middling grade',
    D: 'poor grade',
    F: 'failing grade',
  }[grade] || 'grade'

  const positiveLabels = {
    'Growth Capital Expenditures': 'growth capex that expands capacity',
    'R&D Investment': 'meaningful R&D spending',
    'Net Debt Repayment': 'paying down debt',
  }
  const negativeLabels = {
    'Dividends Paid': 'heavy dividend payouts',
    'Share Buybacks': 'large share buybacks',
    'Underfunded CapEx': 'underfunded capex that depreciates the asset base',
    'Debt-Fueled Extraction': 'borrowing new debt to fund shareholder returns',
  }

  const topPos = positive[0]
  const topNeg = negative[0]
  const posPhrase = topPos ? (positiveLabels[topPos.label] || topPos.label.toLowerCase()) : null
  const negPhrase = topNeg ? (negativeLabels[topNeg.label] || topNeg.label.toLowerCase()) : null

  const fcfNote =
    fcfMargin >= 0.3 ? 'notably high FCF margins (which trigger a penalty)' :
    fcfMargin >= 0.15 ? 'moderate FCF margins' : null

  const helpers = []
  if (posPhrase) helpers.push(posPhrase)

  const hurts = []
  if (negPhrase) hurts.push(negPhrase)
  if (fcfNote && (grade === 'D' || grade === 'F' || grade === 'C')) hurts.push(fcfNote)

  if (!helpers.length && !hurts.length) {
    return `It earned a ${gradePhrase} based on a balanced capital allocation mix.`
  }

  if (grade === 'A' || grade === 'B') {
    const base = `It earned a ${gradePhrase}`
    const driven = helpers.length ? ` driven by ${joinList(helpers)}` : ''
    const despite = hurts.length ? `, despite ${joinList(hurts)}` : ''
    return `${base}${driven}${despite}.`
  }

  const base = `It received a ${gradePhrase}`
  const weighed = hurts.length ? ` weighed down by ${joinList(hurts)}` : ''
  const offset = helpers.length ? `, partially offset by ${joinList(helpers)}` : ''
  return `${base}${weighed}${offset}.`
}

// Compute extraction dollars per employee for a metrics row, mirroring the
// negative-driver components used on the page (div + sbb + underfunded capex
// + net new debt when shareholder returns are positive). Returns null when
// employees or extraction is unavailable.
function computeExtractionPerEmployee(m) {
  if (!m) return null
  const cx = Math.abs(m.cx || 0)
  const da = Math.abs(m.da || 0)
  const div = Math.abs(m.div || 0)
  const sbb = Math.abs(m.sbb || 0)
  const underfunded = Math.max(da - cx, 0)
  // Per-employee extraction reflects actual value leaving the enterprise:
  // cash returned to shareholders (dividends + buybacks) plus the non-cash
  // but real cost of running down the asset base (underfunded capex). The
  // debt-fueled multiplier is a scoring mechanism, not a dollar outflow, so
  // it is excluded here — see the Methodology page.
  const total = div + sbb + underfunded
  if (!m.employees || m.employees <= 0 || total <= 0) return null
  return total / m.employees
}

// Build the driver items from raw metrics + scores
function buildDrivers(company, metrics) {
  if (!company || !metrics) return { positive: [], negative: [] }

  const cx = Math.abs(metrics.cx || 0)
  const da = Math.abs(metrics.da || 0)
  const rd = Math.abs(metrics.rd || 0)
  const dr = Math.abs(metrics.dr || 0)
  const di = Math.abs(metrics.di || 0)
  const div = Math.abs(metrics.div || 0)
  const sbb = Math.abs(metrics.sbb || 0)

  // Productive and extractive totals — matches the formula exactly
  const growthCapex   = Math.max(cx - da, 0)
  const netDr         = Math.max(dr - di, 0)
  const productive    = growthCapex + rd + netDr

  const underfunded   = Math.max(da - cx, 0)
  const shareholder   = div + sbb
  const netNewDebt    = Math.max(di - dr, 0)
  const debtMult      = (shareholder > 0 && netNewDebt > 0)
    ? 1 + Math.min((netNewDebt / shareholder) * 0.25, 0.25)
    : 1.0
  const extractive    = (underfunded + div + sbb) * debtMult

  // Use productive + extractive as denominator — same as the scoring formula
  const total = productive + extractive || 1

  const positive = []
  const negative = []

  if (growthCapex > 0) positive.push({
    label: 'Growth Capital Expenditures',
    detail: 'Investing above the depreciation threshold — expanding capacity',
    value: growthCapex,
    pct: growthCapex / total,
  })
  if (rd > 0) positive.push({
    label: 'R&D Investment',
    detail: 'Funding future innovation and productive capacity',
    value: rd,
    pct: rd / total,
  })
  if (netDr > 0) positive.push({
    label: 'Net Debt Repayment',
    detail: 'Debt repaid beyond new borrowing — strengthening the balance sheet',
    value: netDr,
    pct: netDr / total,
  })

  if (div > 0) negative.push({
    label: 'Dividends Paid',
    detail: 'Cash returned to shareholders rather than reinvested',
    value: div,
    pct: (div * debtMult) / total,
  })
  if (sbb > 0) negative.push({
    label: 'Share Buybacks',
    detail: 'Cash used to repurchase equity',
    value: sbb,
    pct: (sbb * debtMult) / total,
  })
  if (underfunded > 0) negative.push({
    label: 'Underfunded CapEx',
    detail: 'Spending below depreciation — quietly running down the asset base',
    value: underfunded,
    pct: (underfunded * debtMult) / total,
  })
  if (netNewDebt > 0 && shareholder > 0) negative.push({
    label: 'Debt-Fueled Extraction',
    detail: `Borrowing net new debt to fund shareholder returns (${debtMult.toFixed(2)}× multiplier)`,
    value: netNewDebt,
    pct: Math.min((netNewDebt / shareholder) * 0.25, 0.25),
  })

  // Sort by impact
  positive.sort((a, b) => b.value - a.value)
  negative.sort((a, b) => b.value - a.value)

  return { positive, negative }
}

export default function Company() {
  const { ticker } = useParams()
  const [company, setCompany] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [sectorPeers, setSectorPeers] = useState([])
  const [peerMetrics, setPeerMetrics] = useState([])
  const [allScores, setAllScores] = useState([])
  const [yearly, setYearly] = useState([])
  const [yearMetrics, setYearMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const t = ticker.toUpperCase()
      const sector = getSector(t)

      const [scoreRes, metricsRes, allRes, yearlyRes, yearMetricsRes] = await Promise.all([
        db.from('sp500_scores').select('*').eq('ticker', t).single(),
        db.from('sp500_metrics').select('*').eq('ticker', t).single(),
        db.from('sp500_scores').select('ticker, score_100, grade').eq('unscored', false),
        db.from('sp500_scores_yearly')
          .select('fiscal_year, score_100, grade, unscored, b_productive, b_extractive, b_acquisitions, b_retained')
          .eq('ticker', t)
          .order('fiscal_year', { ascending: true }),
        db.from('sp500_metrics_yearly')
          .select('*')
          .eq('ticker', t)
          .order('fiscal_year', { ascending: true }),
      ])

      setCompany(scoreRes.data)
      setMetrics(metricsRes.data)
      setAllScores(allRes.data || [])
      setYearly(yearlyRes.data || [])
      setYearMetrics(yearMetricsRes.data || [])

      const sectorTickers = Object.entries(SECTOR_MAP)
        .filter(([, s]) => s === sector).map(([tick]) => tick).filter(tick => tick !== t)

      // Include the current ticker in the metrics pull so sector-median calcs
      // aren't biased by excluding the company being viewed.
      const sectorTickersWithSelf = [...sectorTickers, t]

      const [peersRes, peerMetricsRes] = await Promise.all([
        db
          .from('sp500_scores')
          .select('ticker, name, score_100, grade, label')
          .in('ticker', sectorTickers)
          .eq('unscored', false)
          .order('score_100', { ascending: false }),
        db
          .from('sp500_metrics')
          .select('ticker, div, sbb, cx, da, di, dr, employees')
          .in('ticker', sectorTickersWithSelf),
      ])

      setSectorPeers(peersRes.data || [])
      setPeerMetrics(peerMetricsRes.data || [])
      setLoading(false)
    }
    load()
  }, [ticker])

  if (loading) return (
    <div className="scores-loading">
      <div className="loading-spinner" />
      <p>Loading {ticker}…</p>
    </div>
  )

  if (!company) return (
    <div className="page">
      <p>Company not found or unscored.</p>
      <Link to="/scores">← Back to scores</Link>
    </div>
  )

  const sector = getSector(ticker.toUpperCase())
  const allSorted = [...allScores].sort((a, b) => b.score_100 - a.score_100)
  const rank = allSorted.findIndex(c => c.ticker === ticker.toUpperCase()) + 1

  // Per-year single-year scores for the time series. The hero/headline number is
  // the average of these over the most recent window (see compute_scores_yearly.py).
  const scoredYearly = (yearly || []).filter(y => !y.unscored)
  const chartData = scoredYearly.map(y => ({ year: y.fiscal_year, score: y.score_100, grade: y.grade }))

  // The drivers panel and raw-input table describe the MOST RECENT fiscal year.
  // Prefer the per-year metrics (the same source the score uses); fall back to the
  // wide table per field so we never lose a value the per-year row happens to miss.
  const latestYearMetrics = yearMetrics.length ? yearMetrics[yearMetrics.length - 1] : null
  const latestYear = latestYearMetrics ? latestYearMetrics.fiscal_year
    : (scoredYearly.length ? scoredYearly[scoredYearly.length - 1].fiscal_year : null)
  const driverMetrics = (() => {
    if (!latestYearMetrics) return metrics
    const merged = { ...metrics }
    for (const k of ['ocf', 'cx', 'rd', 'da', 'dr', 'di', 'acq', 'div', 'sbb', 'sbctotal', 'dcash', 'revenue']) {
      if (latestYearMetrics[k] != null) merged[k] = latestYearMetrics[k]
    }
    return merged
  })()

  const { positive, negative } = buildDrivers(company, driverMetrics)
  const whySentence = buildWhySentence(company, { positive, negative })
  const description = company.description || 'A publicly traded U.S. company.'

  // Total dollars extracted = dividends + buybacks + underfunded capex. The
  // debt-fueled driver is excluded: it is a scoring multiplier, not a dollar
  // outflow, so it would make the per-employee figure misrepresent actual
  // value leaving the enterprise. Matches computeExtractionPerEmployee.
  const totalExtraction = negative
    .filter(d => d.label !== 'Debt-Fueled Extraction')
    .reduce((s, d) => s + (d.value || 0), 0)
  const employees = metrics?.employees || 0
  const extractionPerEmployee = employees > 0 && totalExtraction > 0
    ? totalExtraction / employees
    : null

  // Sector median — sharpens the reading against industry structure.
  const sectorMedianExtractionPerEmployee = (() => {
    const values = peerMetrics
      .map(computeExtractionPerEmployee)
      .filter(v => v != null && isFinite(v))
    if (values.length === 0) return null
    values.sort((a, b) => a - b)
    const mid = Math.floor(values.length / 2)
    return values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid]
  })()

  // Government-assistance signal. Two complementary sources:
  //  - SEC ASC 832 disclosures (self-reported in 10-K filings)
  //  - USAspending.gov federal awards (grants + loans + other financial
  //    assistance, FY2022-2024)
  // The score penalty uses max(SEC 3y, USAspending 3y) to avoid double-counting
  // overlapping disclosures.
  const govAssistCurrent = metrics?.ga || 0
  const govAssistY2 = metrics?.ga_y2 || 0
  const govAssistY3 = metrics?.ga_y3 || 0
  const gaSec3y = company.ga_sec_3y || (govAssistCurrent + govAssistY2 + govAssistY3)
  const gaFederal3y = company.ga_federal_3y || 0
  const govAssist3y = company.gov_assist_3y || Math.max(gaSec3y, gaFederal3y)
  const currentYearExtraction = (driverMetrics?.div || 0) + (driverMetrics?.sbb || 0)
  const showGovFlag = govAssistCurrent > 0 && currentYearExtraction > 0

  // Normalized bucket pie — use latest fiscal year's buckets so it matches
  // the drivers panel (both describe the same year). company.b_* is the 7yr
  // average and would contradict a year where extraction dropped to zero.
  const latestYearScore = scoredYearly.length ? scoredYearly[scoredYearly.length - 1] : null
  const bucketSrc = latestYearScore || company
  const rawBuckets = [
    { name: 'Productive',   value: Math.max(Number(bucketSrc.b_productive)   || 0, 0), fill: 'var(--green)' },
    { name: 'Extractive',   value: Math.max(Number(bucketSrc.b_extractive)   || 0, 0), fill: 'var(--red)' },
    { name: 'Acquisitions', value: Math.max(Number(bucketSrc.b_acquisitions) || 0, 0), fill: 'var(--gray-400)' },
    { name: 'Retained',     value: Math.max(Number(bucketSrc.b_retained)     || 0, 0), fill: 'var(--neutral)' },
  ].filter(b => b.value > 0)
  const bucketTotal = rawBuckets.reduce((sum, b) => sum + b.value, 0)
  const buckets = bucketTotal > 0 ? rawBuckets.map(b => ({ ...b, value: b.value / bucketTotal })) : rawBuckets

  // Sector comparison
  const sectorData = [
    ...sectorPeers.slice(0, 12),
    { ticker: ticker.toUpperCase(), name: company.name, score_100: company.score_100, _isThis: true }
  ].sort((a, b) => b.score_100 - a.score_100)

  return (
    <div className="company-page">
      <div className="breadcrumb">
        <Link to="/scores">← All scores</Link>
        <span>/</span>
        <span>{ticker.toUpperCase()}</span>
      </div>

      {/* ── Hero ── */}
      <div className="company-hero">
        <div className="company-hero-left">
          <div className="company-ticker">{ticker.toUpperCase()}</div>
          <h1 className="company-name">{company.name || ticker.toUpperCase()}</h1>
          <div className="company-meta">
            <span className="company-sector">{sector}</span>
            <span className="company-rank">#{rank} of {allScores.length}</span>
          </div>
        </div>
        <div className="company-hero-right">
          <div className="big-score" style={{ color: scoreColor(company.score_100) }}>
            {company.score_100}<span className="big-score-denom">/100</span>
          </div>
          <span className={`grade-badge grade-badge-large ${gradeClass(company.grade)}`}>{company.grade}</span>
          <span className="company-label">{company.label}</span>
          {company.years_scored > 1 && (
            <span className="score-window">
              {company.years_scored}-yr average · FY{company.first_year}–FY{company.last_year}
            </span>
          )}
          {company.score_trend != null && company.score_trend !== 0 && (
            <span className={`score-trend ${company.score_trend > 0 ? 'up' : 'down'}`}>
              {company.score_trend > 0 ? '▲' : '▼'} {Math.abs(company.score_trend)} pts since FY{company.first_year}
            </span>
          )}
        </div>
      </div>

      {showGovFlag && (
        <div className="gov-flag">
          <span className="gov-flag-icon">⚠</span>
          <div className="gov-flag-body">
            <strong>Took public money while extracting.</strong>
            <span>
              Received {fmt(govAssistCurrent)} in government assistance (grants,
              forgivable loans, or tax abatements) in the same year it paid{' '}
              {fmt(currentYearExtraction)} in dividends and buybacks.
            </span>
          </div>
        </div>
      )}

      {/* ── Score over time ── */}
      {chartData.length >= 2 && (
        <div className="trend-section">
          <div className="trend-header">
            <h2 className="trend-title">Score over time</h2>
            <p className="trend-sub">
              Each point is that fiscal year scored on its own. The dashed line is the{' '}
              {company.years_scored}-year average ({company.score_100}/100) shown above.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 16, right: 40, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="year" tickFormatter={y => `'${String(y).slice(2)}`}
                tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return <div className="dist-tooltip"><strong>FY{d.year}</strong><span>{d.score}/100 · {d.grade}</span></div>
              }} />
              {!company.unscored && (
                <ReferenceLine y={company.score_100} stroke="var(--black)" strokeDasharray="4 4"
                  label={{ value: `avg ${company.score_100}`, position: 'right', fontSize: 10, fill: 'var(--gray-600)' }} />
              )}
              <Line type="monotone" dataKey="score" stroke="var(--gray-400)" strokeWidth={2}
                isAnimationActive={false}
                dot={({ cx, cy, payload, index }) => (
                  <circle key={index} cx={cx} cy={cy} r={4} fill={scoreColor(payload.score)}
                    stroke="var(--white)" strokeWidth={1.5} />
                )}
                activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="card-note">
            Single-year NESI score, FY{chartData[0].year}–FY{chartData[chartData.length - 1].year}. Dots colored by grade band.
          </p>
        </div>
      )}

      {/* ── Score drivers — most prominent section ── */}
      <div className="drivers-section">
        <div className="drivers-header">
          <h2 className="drivers-title">What's driving this score</h2>
          {latestYear && <p className="drivers-sub">Most recent fiscal year · FY{latestYear}</p>}
          <p className="drivers-desc">{description}</p>
          <p className="drivers-why">{whySentence}</p>
        </div>
        <div className="drivers-grid">

          <div className="drivers-col drivers-col-positive">
            <div className="drivers-col-label">
              <span className="drivers-col-icon">↑</span>
              Raises the score
            </div>
            {positive.length === 0 ? (
              <p className="drivers-empty">No productive reinvestment factors this year.</p>
            ) : positive.map((d, i) => (
              <div key={i} className="driver-item driver-item-positive">
                <div className="driver-bar-wrap">
                  <div className="driver-bar driver-bar-positive" style={{ width: `${Math.min(d.pct * 100, 100)}%` }} />
                </div>
                <div className="driver-info">
                  <div className="driver-label">{d.label}</div>
                  <div className="driver-detail">{d.detail}</div>
                </div>
                <div className="driver-values">
                  <span className="driver-amt">{fmtAbs(d.value)}</span>
                  <span className="driver-pct positive">+{(d.pct * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="drivers-col drivers-col-negative">
            <div className="drivers-col-label">
              <span className="drivers-col-icon">↓</span>
              Lowers the score
            </div>
            {negative.length === 0 ? (
              <p className="drivers-empty">No extractive factors this year.</p>
            ) : negative.map((d, i) => (
              <div key={i} className="driver-item driver-item-negative">
                <div className="driver-bar-wrap">
                  <div className="driver-bar driver-bar-negative" style={{ width: `${Math.min(d.pct * 100, 100)}%` }} />
                </div>
                <div className="driver-info">
                  <div className="driver-label">{d.label}</div>
                  <div className="driver-detail">{d.detail}</div>
                </div>
                <div className="driver-values">
                  <span className="driver-amt">{fmtAbs(d.value)}</span>
                  <span className="driver-pct negative">−{(d.pct * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="company-grid">

        <div className="card">
          <h3 className="card-title">Capital allocation{latestYear ? ` · FY${latestYear}` : ''}</h3>
          {buckets.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={buckets} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {buckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                </Pie>
                <Legend formatter={(value, entry) => (
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-800)' }}>
                    {value}: {(entry.payload.value * 100).toFixed(0)}%
                  </span>
                )} />
                <Tooltip formatter={v => `${(v * 100).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: '0.8rem' }}>No allocation data.</p>}
        </div>

        <div className="card">
          <h3 className="card-title">FCF margin adjustment</h3>
          <div className="fcf-margin-display">
            <div className="fcf-margin-number" style={{
              color: company.fcf_margin > 0.3 ? 'var(--red)' : company.fcf_margin > 0.15 ? '#c07020' : 'var(--green)'
            }}>
              {company.fcf_margin > 0
                ? `${(company.fcf_margin * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
            <div className="fcf-margin-label">FCF Margin (OCF ÷ Revenue)</div>
          </div>
          <div className="fcf-margin-bar-wrap">
            <div className="fcf-margin-track">
              <div className="fcf-margin-fill" style={{
                width: `${Math.min((company.fcf_margin || 0) * 200, 100)}%`,
                background: company.fcf_margin > 0.3 ? 'var(--red)' : company.fcf_margin > 0.15 ? '#c07020' : 'var(--green)'
              }} />
              <div className="fcf-margin-marker" style={{ left: '30%' }} />
            </div>
            <div className="fcf-margin-axis">
              <span>0%</span>
              <span style={{ position: 'absolute', left: '30%', transform: 'translateX(-50%)' }}>15%</span>
              <span>50%+</span>
            </div>
          </div>
          <div className="fcf-margin-impact">
            {company.fcf_margin > 0 ? (
              <>
                <p>Score multiplied by <strong>{(1 - company.fcf_margin).toFixed(2)}×</strong> due to FCF margin.</p>
                <p className="fcf-margin-explain">
                  {company.fcf_margin >= 0.3
                    ? 'High cash generation relative to revenue — significant penalty applied.'
                    : company.fcf_margin >= 0.15
                    ? 'Moderate cash generation — modest penalty applied.'
                    : 'Low FCF margin — minimal penalty. Score nearly unaffected.'}
                </p>
              </>
            ) : (
              <p className="fcf-margin-explain">FCF margin not applied — revenue data unavailable or margin unreliable.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Extraction per employee</h3>
          <div className="extraction-pair">
            <div className="extraction-col">
              <div className="extraction-value" style={{
                color: extractionPerEmployee == null ? 'var(--gray-400)'
                  : extractionPerEmployee >= 1e6 ? 'var(--red)'
                  : extractionPerEmployee >= 2.5e5 ? '#c07020'
                  : 'var(--green)'
              }}>
                {extractionPerEmployee != null ? fmtPerEmp(extractionPerEmployee) : 'N/A'}
              </div>
              <div className="extraction-caption">{ticker.toUpperCase()}</div>
            </div>
            <div className="extraction-col">
              <div className="extraction-value extraction-value-peer">
                {sectorMedianExtractionPerEmployee != null
                  ? fmtPerEmp(sectorMedianExtractionPerEmployee)
                  : '—'}
              </div>
              <div className="extraction-caption">{sector} median</div>
            </div>
          </div>
          <div className="fcf-margin-impact">
            {extractionPerEmployee != null ? (
              <>
                <p>
                  <strong>{fmtAbs(totalExtraction)}</strong> returned to shareholders or lost to underfunding, across <strong>{fmtCount(employees)}</strong> employees.
                </p>
                <p className="fcf-margin-explain">
                  {sectorMedianExtractionPerEmployee != null && extractionPerEmployee > sectorMedianExtractionPerEmployee * 1.5
                    ? `Well above the ${sector} median — management is returning more cash per worker than peers.`
                    : sectorMedianExtractionPerEmployee != null && extractionPerEmployee < sectorMedianExtractionPerEmployee * 0.67
                    ? `Below the ${sector} median — less cash diverted to shareholders per worker than peers.`
                    : `Roughly in line with ${sector} peers — the level reflects industry structure as much as company choice.`}
                </p>
              </>
            ) : (
              <p className="fcf-margin-explain">
                {employees > 0 ? 'No extractive outflows this year.' : 'Employee count unavailable.'}
              </p>
            )}
          </div>
        </div>

        <div className="card card-wide">
          <h3 className="card-title">Government assistance received</h3>
          {govAssist3y > 0 ? (
            <>
              <div className="gov-assist-pair">
                <div className="gov-assist-col">
                  <div className="gov-assist-label">SEC ASC 832 (3y)</div>
                  <div className="gov-assist-value">{fmt(gaSec3y)}</div>
                </div>
                <div className="gov-assist-col">
                  <div className="gov-assist-label">USAspending federal (3y)</div>
                  <div className="gov-assist-value">{fmt(gaFederal3y)}</div>
                </div>
                <div className="gov-assist-col">
                  <div className="gov-assist-label">Effect on score</div>
                  <div className="gov-assist-value">Not scored</div>
                </div>
              </div>
              <p className="fcf-margin-impact gov-assist-note">
                Two sources: <strong>SEC ASC 832</strong> disclosures (grants, forgivable loans, tax abatements self-reported in 10-Ks) and <strong>USAspending.gov</strong> federal awards (grants + loans + other financial assistance, FY2022–2024). <strong>Excludes</strong> ordinary revenue from government contracts. Shown here for context only — government assistance is <strong>not part of the NESI score</strong> under the 2018-onward per-year methodology (the data doesn't exist consistently across all years).
                {metrics?.ga_recipient && <span className="gov-assist-tag"> Top federal recipient: <code>{metrics.ga_usaspending_recipient || '—'}</code></span>}
                {metrics?.ga_tag && <span className="gov-assist-tag"> SEC tag: <code>{metrics.ga_tag}</code></span>}
              </p>
            </>
          ) : (
            <p className="fcf-margin-explain">
              No government assistance detected in either SEC ASC 832 disclosures or USAspending.gov federal awards (FY2022–2024). This does <em>not</em> rule out state/local tax breaks, federal tax credits claimed on returns, or subsidies not routed through USAspending.
            </p>
          )}
        </div>

        <div className="card card-wide">
          <h3 className="card-title">Score vs. {sector} peers</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <XAxis dataKey="ticker" tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                interval={0} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return <div className="dist-tooltip"><strong>{d.ticker}</strong><span>{d.score_100}/100</span></div>
              }} />
              <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="3 3" />
              <Bar dataKey="score_100" radius={[2, 2, 0, 0]}>
                {sectorData.map((d, i) => (
                  <Cell key={i} fill={d._isThis ? 'var(--black)' : scoreColor(d.score_100)} opacity={d._isThis ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="card-note">Current company shown in black. Dashed line at score 50.</p>
        </div>

      </div>

      {/* ── Detailed numbers (for those who want to dig in) ── */}
      <details className="details-section">
        <summary className="details-toggle">Show detailed financial data ↓</summary>
        <div className="company-grid details-grid">

          <div className="card">
            <h3 className="card-title">Score breakdown{company.years_scored ? ` · ${company.years_scored}-yr avg` : ''}</h3>
            <div className="breakdown-rows">
              <div className="breakdown-row">
                <span className="br-label">Productive Reinvestment Score (PRS)</span>
                <span className="br-val mono positive">{company.prs?.toFixed(3)}</span>
              </div>
              <div className="breakdown-row">
                <span className="br-label">Extraction Score (ES)</span>
                <span className="br-val mono negative">−{company.es?.toFixed(3)}</span>
              </div>
              <div className="breakdown-row">
                <span className="br-label">Composite (PRS − ES)</span>
                <span className="br-val mono">{company.score >= 0 ? '+' : ''}{company.score?.toFixed(3)}</span>
              </div>
              <div className="breakdown-row total">
                <span className="br-label">NESI Score (0–100)</span>
                <span className="br-val mono" style={{ color: scoreColor(company.score_100) }}>
                  {company.score_100}/100 &nbsp;·&nbsp; {company.grade}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Raw cash flow inputs{latestYear ? ` · FY${latestYear}` : ''}</h3>
            <div className="metrics-grid">
              {[
                { label: 'Operating Cash Flow', key: 'ocf' },
                { label: 'Capital Expenditures', key: 'cx' },
                { label: 'R&D Expense', key: 'rd' },
                { label: 'Depreciation & Amortization', key: 'da' },
                { label: 'Debt Repayment', key: 'dr' },
                { label: 'Debt Issuance', key: 'di' },
                { label: 'Acquisitions', key: 'acq' },
                { label: 'Dividends Paid', key: 'div' },
                { label: 'Share Buybacks', key: 'sbb' },
                { label: 'Stock-Based Comp', key: 'sbctotal' },
                { label: 'Change in Cash', key: 'dcash' },
              ].map(({ label, key }) => (
                <div key={key} className="metric-row">
                  <span className="metric-label">{label}</span>
                  <span className="metric-val mono">{driverMetrics ? fmt(driverMetrics[key]) : '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Derived quantities</h3>
            <div className="breakdown-rows">
              <div className="breakdown-row">
                <span className="br-label">Free Cash Flow (FCF)</span>
                <span className="br-val mono">{fmt(company.fcf)}</span>
              </div>
              <div className="breakdown-row">
                <span className="br-label">Net CapEx (CX − DA)</span>
                <span className="br-val mono">{fmt(company.net_capex)}</span>
              </div>
              <div className="breakdown-row total">
                <span className="br-label">Total Allocable Cash (TAC)</span>
                <span className="br-val mono">{fmt(company.tac)}</span>
              </div>
            </div>
          </div>

        </div>
      </details>

      <div className="company-footer-note">
        Data from SEC EDGAR 10-K filing. <Link to="/methodology">Read the full methodology →</Link>
      </div>
    </div>
  )
}
