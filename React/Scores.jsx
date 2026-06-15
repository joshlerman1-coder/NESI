import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import './Scores.css'

const SECTORS = [
  'All Sectors',
  'Communication Services','Consumer Discretionary','Consumer Staples',
  'Energy','Financials','Health Care','Industrials',
  'Information Technology','Materials','Real Estate','Utilities'
]

// Sector map — approximate, based on GICS
const SECTOR_MAP = {
  AAPL:'Information Technology',MSFT:'Information Technology',NVDA:'Information Technology',
  AVGO:'Information Technology',ORCL:'Information Technology',CRM:'Information Technology',
  AMD:'Information Technology',INTC:'Information Technology',QCOM:'Information Technology',
  TXN:'Information Technology',IBM:'Information Technology',NOW:'Information Technology',
  ANET:'Information Technology',MU:'Information Technology',ADI:'Information Technology',
  KLAC:'Information Technology',LRCX:'Information Technology',AMAT:'Information Technology',
  SNPS:'Information Technology',CDNS:'Information Technology',MCHP:'Information Technology',
  TEL:'Information Technology',STX:'Information Technology',WDC:'Information Technology',
  HPQ:'Information Technology',HPE:'Information Technology',KEYS:'Information Technology',
  MPWR:'Information Technology',FTNT:'Information Technology',PANW:'Information Technology',
  CRWD:'Information Technology',ZBRA:'Information Technology',TDY:'Information Technology',
  GOOG:'Communication Services',GOOGL:'Communication Services',META:'Communication Services',
  NFLX:'Communication Services',DIS:'Communication Services',CMCSA:'Communication Services',
  T:'Communication Services',VZ:'Communication Services',TMUS:'Communication Services',
  CHTR:'Communication Services',PARA:'Communication Services',WBD:'Communication Services',
  OMC:'Communication Services',IPG:'Communication Services',LYV:'Communication Services',
  EA:'Communication Services',TTWO:'Communication Services',
  AMZN:'Consumer Discretionary',TSLA:'Consumer Discretionary',HD:'Consumer Discretionary',
  MCD:'Consumer Discretionary',NKE:'Consumer Discretionary',SBUX:'Consumer Discretionary',
  LOW:'Consumer Discretionary',TJX:'Consumer Discretionary',BKNG:'Consumer Discretionary',
  MAR:'Consumer Discretionary',HLT:'Consumer Discretionary',GM:'Consumer Discretionary',
  F:'Consumer Discretionary',EBAY:'Consumer Discretionary',ETSY:'Consumer Discretionary',
  DHI:'Consumer Discretionary',LEN:'Consumer Discretionary',PHM:'Consumer Discretionary',
  TPR:'Consumer Discretionary',RL:'Consumer Discretionary',VFC:'Consumer Discretionary',
  DRI:'Consumer Discretionary',YUM:'Consumer Discretionary',CMG:'Consumer Discretionary',
  WMT:'Consumer Staples',PG:'Consumer Staples',KO:'Consumer Staples',PEP:'Consumer Staples',
  COST:'Consumer Staples',PM:'Consumer Staples',MO:'Consumer Staples',
  MDLZ:'Consumer Staples',CL:'Consumer Staples',KHC:'Consumer Staples',
  GIS:'Consumer Staples',HSY:'Consumer Staples',CAG:'Consumer Staples',
  SJM:'Consumer Staples',CHD:'Consumer Staples',CLX:'Consumer Staples',
  KMB:'Consumer Staples',EL:'Consumer Staples',KVUE:'Consumer Staples',
  XOM:'Energy',CVX:'Energy',COP:'Energy',EOG:'Energy',SLB:'Energy',
  MPC:'Energy',VLO:'Energy',PSX:'Energy',PXD:'Energy',OXY:'Energy',
  HAL:'Energy',DVN:'Energy',HES:'Energy',FANG:'Energy',APA:'Energy',
  JNJ:'Health Care',UNH:'Health Care',LLY:'Health Care',ABBV:'Health Care',
  MRK:'Health Care',PFE:'Health Care',TMO:'Health Care',ABT:'Health Care',
  DHR:'Health Care',BMY:'Health Care',AMGN:'Health Care',GILD:'Health Care',
  ISRG:'Health Care',SYK:'Health Care',MDT:'Health Care',ZBH:'Health Care',
  EW:'Health Care',GEHC:'Health Care',HUM:'Health Care',CI:'Health Care',
  CVS:'Health Care',MCK:'Health Care',CAH:'Health Care',ABC:'Health Care',
  MRNA:'Health Care',BIIB:'Health Care',REGN:'Health Care',VRTX:'Health Care',
  INCY:'Health Care',ILMN:'Health Care',DXCM:'Health Care',HOLX:'Health Care',
  BA:'Industrials',HON:'Industrials',UPS:'Industrials',CAT:'Industrials',
  DE:'Industrials',GE:'Industrials',RTX:'Industrials',LMT:'Industrials',
  NOC:'Industrials',GD:'Industrials',MMM:'Industrials',EMR:'Industrials',
  ETN:'Industrials',ROK:'Industrials',PH:'Industrials',DOV:'Industrials',
  XYL:'Industrials',OTIS:'Industrials',CARR:'Industrials',TT:'Industrials',
  WAB:'Industrials',GWW:'Industrials',FAST:'Industrials',SWK:'Industrials',
  FDX:'Industrials',UNP:'Industrials',CSX:'Industrials',NSC:'Industrials',
  DAL:'Industrials',UAL:'Industrials',LUV:'Industrials',AAL:'Industrials',
  PWR:'Industrials',EME:'Industrials',
  JPM:'Financials',BAC:'Financials',WFC:'Financials',GS:'Financials',
  MS:'Financials',C:'Financials',AXP:'Financials',BLK:'Financials',
  SCHW:'Financials',CB:'Financials',PNC:'Financials',USB:'Financials',
  TFC:'Financials',SPGI:'Financials',MCO:'Financials',ICE:'Financials',
  CME:'Financials',COF:'Financials',DFS:'Financials',SYF:'Financials',
  V:'Financials',MA:'Financials',PYPL:'Financials',
  AMT:'Real Estate',PLD:'Real Estate',CCI:'Real Estate',EQIX:'Real Estate',
  PSA:'Real Estate',WELL:'Real Estate',AVB:'Real Estate',EQR:'Real Estate',
  O:'Real Estate',SPG:'Real Estate',SBAC:'Real Estate',DOC:'Real Estate',
  NEE:'Utilities',DUK:'Utilities',SO:'Utilities',D:'Utilities',
  AEP:'Utilities',EXC:'Utilities',SRE:'Utilities',PCG:'Utilities',
  XEL:'Utilities',ES:'Utilities',WEC:'Utilities',ETR:'Utilities',
  AWK:'Utilities',AEE:'Utilities',CNP:'Utilities',EVRG:'Utilities',
  PEG:'Utilities',VST:'Utilities',
  LIN:'Materials',APD:'Materials',SHW:'Materials',ECL:'Materials',
  NEM:'Materials',FCX:'Materials',NUE:'Materials',STLD:'Materials',
  DOW:'Materials',LYB:'Materials',PPG:'Materials',IFF:'Materials',
  PKG:'Materials',IP:'Materials',CF:'Materials',MOS:'Materials',
}

function getSector(ticker) {
  return SECTOR_MAP[ticker] || 'Other'
}

function scoreColor(score) {
  if (score >= 0.5) return 'var(--green)'
  if (score >= 0)   return '#2d8a50'
  if (score >= -0.5) return '#c07020'
  return 'var(--red)'
}

function labelClass(label) {
  if (!label) return ''
  return label.toLowerCase().replace(/ /g, '-')
}

export default function Scores() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All Sectors')
  const [sort, setSort] = useState('score_desc')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sp500_scores')
        .select('*')
        .eq('unscored', false)
        .order('score', { ascending: false })
      setCompanies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = companies.map(c => ({ ...c, sector: getSector(c.ticker) }))

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.ticker.toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q)
      )
    }

    if (sector !== 'All Sectors') {
      list = list.filter(c => c.sector === sector)
    }

    switch (sort) {
      case 'score_desc': list.sort((a, b) => b.score - a.score); break
      case 'score_asc':  list.sort((a, b) => a.score - b.score); break
      case 'ticker':     list.sort((a, b) => a.ticker.localeCompare(b.ticker)); break
      case 'name':       list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
    }

    return list
  }, [companies, search, sector, sort])

  // Distribution chart data
  const distData = useMemo(() => {
    const buckets = []
    for (let i = -3; i < 3; i += 0.25) {
      const lo = i, hi = i + 0.25
      buckets.push({
        range: lo.toFixed(2),
        count: companies.filter(c => c.score >= lo && c.score < hi).length,
        lo, hi
      })
    }
    return buckets
  }, [companies])

  if (loading) return (
    <div className="scores-loading">
      <div className="loading-spinner" />
      <p>Loading scores from Supabase…</p>
    </div>
  )

  return (
    <div className="scores-page">

      {/* ── Distribution chart ── */}
      <div className="dist-bar">
        <div className="dist-inner">
          <div className="dist-label">Score distribution — {companies.length} companies</div>
          <div className="dist-chart">
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={distData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="range" hide />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="dist-tooltip">
                        <span>{d.lo.toFixed(2)} to {d.hi.toFixed(2)}</span>
                        <strong>{d.count} companies</strong>
                      </div>
                    )
                  }}
                />
                <ReferenceLine x="0.00" stroke="var(--border)" strokeWidth={1} />
                {distData.map((d, i) => (
                  <Bar key={i} dataKey="count" fill={d.lo >= 0 ? 'var(--green)' : 'var(--red)'} opacity={0.7} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="scores-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search ticker or company name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={sector} onChange={e => setSector(e.target.value)}>
          {SECTORS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="score_desc">Score: High → Low</option>
          <option value="score_asc">Score: Low → High</option>
          <option value="ticker">Ticker A–Z</option>
          <option value="name">Name A–Z</option>
        </select>
        <span className="results-count">{filtered.length} companies</span>
      </div>

      {/* ── Table ── */}
      <div className="scores-table-wrap">
        <table className="scores-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company</th>
              <th>Sector</th>
              <th>Score</th>
              <th>Rating</th>
              <th className="th-right">PRS</th>
              <th className="th-right">ES</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.ticker} className="score-row">
                <td className="td-ticker">
                  <Link to={`/scores/${c.ticker}`}>{c.ticker}</Link>
                </td>
                <td className="td-name">{c.name || '—'}</td>
                <td className="td-sector">{c.sector}</td>
                <td className="td-score">
                  <div className="score-bar-wrap">
                    <div
                      className="score-bar"
                      style={{
                        width: `${Math.abs(c.score) / 3 * 50}%`,
                        background: scoreColor(c.score),
                        marginLeft: c.score >= 0 ? '50%' : `${50 - Math.abs(c.score) / 3 * 50}%`
                      }}
                    />
                    <span className="score-val mono" style={{ color: scoreColor(c.score) }}>
                      {c.score >= 0 ? '+' : ''}{c.score?.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td><span className={`label-pill ${labelClass(c.label)}`}>{c.label}</span></td>
                <td className="td-right mono">{c.prs?.toFixed(2)}</td>
                <td className="td-right mono">{c.es?.toFixed(2)}</td>
                <td className="td-link">
                  <Link to={`/scores/${c.ticker}`} className="row-link">Detail →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
