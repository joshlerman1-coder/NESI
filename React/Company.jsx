import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell,
  PieChart, Pie, Legend
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
  PANW:'Information Technology',CRWD:'Information Technology',
  GOOG:'Communication Services',GOOGL:'Communication Services',META:'Communication Services',
  NFLX:'Communication Services',DIS:'Communication Services',CMCSA:'Communication Services',
  T:'Communication Services',VZ:'Communication Services',TMUS:'Communication Services',
  LYV:'Communication Services',EA:'Communication Services',TTWO:'Communication Services',
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
  ETN:'Industrials',ROK:'Industrials',FDX:'Industrials',UNP:'Industrials',
  CSX:'Industrials',NSC:'Industrials',DAL:'Industrials',LUV:'Industrials',
  PWR:'Industrials',EME:'Industrials',
  JPM:'Financials',BAC:'Financials',GS:'Financials',MS:'Financials',
  C:'Financials',AXP:'Financials',BLK:'Financials',SCHW:'Financials',
  CB:'Financials',SPGI:'Financials',MCO:'Financials',ICE:'Financials',
  CME:'Financials',V:'Financials',MA:'Financials',PYPL:'Financials',
  AMT:'Real Estate',PLD:'Real Estate',CCI:'Real Estate',EQIX:'Real Estate',
  PSA:'Real Estate',WELL:'Real Estate',O:'Real Estate',SPG:'Real Estate',
  SBAC:'Real Estate',DOC:'Real Estate',
  NEE:'Utilities',DUK:'Utilities',SO:'Utilities',AEP:'Utilities',
  EXC:'Utilities',SRE:'Utilities',NEE:'Utilities',XEL:'Utilities',
  WEC:'Utilities',ETR:'Utilities',AWK:'Utilities',AEE:'Utilities',
  CNP:'Utilities',EVRG:'Utilities',PEG:'Utilities',VST:'Utilities',
  LIN:'Materials',APD:'Materials',SHW:'Materials',ECL:'Materials',
  NEM:'Materials',FCX:'Materials',NUE:'Materials',STLD:'Materials',
  DOW:'Materials',LYB:'Materials',PPG:'Materials',IFF:'Materials',
}

function getSector(ticker) { return SECTOR_MAP[ticker] || 'Other' }
function fmt(n) { if (n == null) return '—'; return (n / 1e9).toFixed(2) + 'B' }
function scoreColor(s) {
  if (s >= 0.5) return 'var(--green)'
  if (s >= 0)   return '#2d8a50'
  if (s >= -0.5) return '#c07020'
  return 'var(--red)'
}
function labelClass(label) {
  if (!label) return ''
  return label.toLowerCase().replace(/ /g, '-')
}

export default function Company() {
  const { ticker } = useParams()
  const [company, setCompany] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [sectorPeers, setSectorPeers] = useState([])
  const [allScores, setAllScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const t = ticker.toUpperCase()
      const sector = getSector(t)

      const [scoreRes, metricsRes, allRes] = await Promise.all([
        supabase.from('sp500_scores').select('*').eq('ticker', t).single(),
        supabase.from('sp500_metrics').select('*').eq('ticker', t).single(),
        supabase.from('sp500_scores').select('ticker, score, label').eq('unscored', false),
      ])

      setCompany(scoreRes.data)
      setMetrics(metricsRes.data)
      setAllScores(allRes.data || [])

      // Sector peers
      const sectorTickers = Object.entries(SECTOR_MAP)
        .filter(([, s]) => s === sector)
        .map(([tick]) => tick)
        .filter(tick => tick !== t)

      const peersRes = await supabase
        .from('sp500_scores')
        .select('ticker, name, score, label')
        .in('ticker', sectorTickers)
        .eq('unscored', false)
        .order('score', { ascending: false })

      setSectorPeers(peersRes.data || [])
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
  const allSorted = [...allScores].sort((a, b) => b.score - a.score)
  const rank = allSorted.findIndex(c => c.ticker === ticker.toUpperCase()) + 1

  // Bucket pie data
  const buckets = [
    { name: 'Productive', value: Math.max(company.b_productive || 0, 0), fill: 'var(--green)' },
    { name: 'Extractive', value: Math.max(company.b_extractive || 0, 0), fill: 'var(--red)' },
    { name: 'Acquisitions', value: Math.max(company.b_acquisitions || 0, 0), fill: 'var(--gray-400)' },
    { name: 'Retained', value: Math.max(company.b_retained || 0, 0), fill: 'var(--neutral)' },
  ].filter(b => b.value > 0)

  // Sector comparison bar data
  const sectorData = [
    ...sectorPeers.slice(0, 12),
    { ticker: ticker.toUpperCase(), name: company.name, score: company.score, _isThis: true }
  ].sort((a, b) => b.score - a.score)

  return (
    <div className="company-page">

      {/* ── Breadcrumb ── */}
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
          <div className="big-score" style={{ color: scoreColor(company.score) }}>
            {company.score >= 0 ? '+' : ''}{company.score?.toFixed(3)}
          </div>
          <span className={`label-pill ${labelClass(company.label)}`}>{company.label}</span>
        </div>
      </div>

      <div className="company-grid">

        {/* ── Score breakdown ── */}
        <div className="card">
          <h3 className="card-title">Score breakdown</h3>
          <div className="breakdown-rows">
            <div className="breakdown-row">
              <span className="br-label">Productive Reinvestment Score (PRS)</span>
              <span className="br-val mono positive">{company.prs?.toFixed(3)}</span>
            </div>
            <div className="breakdown-row">
              <span className="br-label">Extraction Score (ES)</span>
              <span className="br-val mono negative">−{company.es?.toFixed(3)}</span>
            </div>
            <div className="breakdown-row total">
              <span className="br-label">Composite Score (PRS − ES)</span>
              <span className="br-val mono" style={{ color: scoreColor(company.score) }}>
                {company.score >= 0 ? '+' : ''}{company.score?.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Raw metrics ── */}
        <div className="card">
          <h3 className="card-title">Raw cash flow inputs</h3>
          <div className="metrics-grid">
            {[
              { label: 'Operating Cash Flow', key: 'ocf', sign: 1 },
              { label: 'Capital Expenditures', key: 'cx', sign: -1 },
              { label: 'R&D Expense', key: 'rd', sign: -1 },
              { label: 'Depreciation & Amortization', key: 'da', sign: 0 },
              { label: 'Debt Repayment', key: 'dr', sign: 1 },
              { label: 'Debt Issuance', key: 'di', sign: 0 },
              { label: 'Acquisitions', key: 'acq', sign: 0 },
              { label: 'Dividends Paid', key: 'div', sign: -1 },
              { label: 'Share Buybacks', key: 'sbb', sign: -1 },
              { label: 'Stock-Based Comp', key: 'sbctotal', sign: 0 },
              { label: 'Change in Cash', key: 'dcash', sign: 0 },
            ].map(({ label, key, sign }) => (
              <div key={key} className="metric-row">
                <span className="metric-label">{label}</span>
                <span className={`metric-val mono ${sign === 1 ? 'positive' : sign === -1 ? 'negative' : ''}`}>
                  {metrics ? fmt(metrics[key]) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Derived quantities ── */}
        <div className="card">
          <h3 className="card-title">Derived quantities</h3>
          <div className="breakdown-rows">
            <div className="breakdown-row">
              <span className="br-label">Free Cash Flow (FCF = OCF − CX − SBC)</span>
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

        {/* ── Capital allocation buckets ── */}
        <div className="card">
          <h3 className="card-title">Capital allocation</h3>
          {buckets.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={buckets}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {buckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                </Pie>
                <Legend
                  formatter={(value, entry) => (
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-800)' }}>
                      {value}: {(entry.payload.value * 100).toFixed(0)}%
                    </span>
                  )}
                />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: '0.8rem' }}>No allocation data available.</p>}
        </div>

        {/* ── Sector comparison ── */}
        <div className="card card-wide">
          <h3 className="card-title">Score vs. {sector} peers</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <XAxis
                dataKey="ticker"
                tick={{ fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10 }} domain={[-3, 3]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="dist-tooltip">
                      <strong>{d.ticker}</strong>
                      <span>{d.score >= 0 ? '+' : ''}{d.score?.toFixed(3)}</span>
                    </div>
                  )
                }}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                {sectorData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d._isThis ? 'var(--black)' : scoreColor(d.score)}
                    opacity={d._isThis ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="card-note">Current company shown in black.</p>
        </div>

      </div>

      <div className="company-footer-note">
        Data from SEC EDGAR 10-K filing. <Link to="/methodology">Read the full methodology →</Link>
      </div>
    </div>
  )
}
