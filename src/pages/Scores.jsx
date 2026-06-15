import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../neonClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid } from 'recharts'
import './Scores.css'

const EXTRACTION_TREND = [
  { year: 2010, ratio: 50.8 }, { year: 2011, ratio: 54.3 },
  { year: 2012, ratio: 52.0 }, { year: 2013, ratio: 57.2 },
  { year: 2014, ratio: 59.9 }, { year: 2015, ratio: 62.8 },
  { year: 2016, ratio: 62.4 }, { year: 2017, ratio: 61.7 },
  { year: 2018, ratio: 64.3 }, { year: 2019, ratio: 65.4 },
  { year: 2020, ratio: 64.0 }, { year: 2021, ratio: 64.8 },
  { year: 2022, ratio: 65.8 }, { year: 2023, ratio: 63.6 },
  { year: 2024, ratio: 61.1 }, { year: 2025, ratio: 59.6 },
]

const SECTORS = [
  'All Sectors',
  'Communication Services','Consumer Discretionary','Consumer Staples',
  'Energy','Financials','Health Care','Industrials',
  'Information Technology','Materials','Real Estate','Utilities'
]

const SECTOR_MAP = {
  AAPL:'Information Technology',MSFT:'Information Technology',NVDA:'Information Technology',
  AVGO:'Information Technology',ORCL:'Information Technology',CRM:'Information Technology',
  AMD:'Information Technology',INTC:'Information Technology',QCOM:'Information Technology',
  TXN:'Information Technology',IBM:'Information Technology',NOW:'Information Technology',
  ANET:'Information Technology',MU:'Information Technology',ADI:'Information Technology',
  KLAC:'Information Technology',LRCX:'Information Technology',AMAT:'Information Technology',
  SNPS:'Information Technology',CDNS:'Information Technology',MCHP:'Information Technology',
  TEL:'Information Technology',FTNT:'Information Technology',PANW:'Information Technology',
  GOOG:'Communication Services',GOOGL:'Communication Services',META:'Communication Services',
  NFLX:'Communication Services',DIS:'Communication Services',CMCSA:'Communication Services',
  T:'Communication Services',VZ:'Communication Services',TMUS:'Communication Services',
  CHTR:'Communication Services',LYV:'Communication Services',EA:'Communication Services',
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

export default function Scores() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All Sectors')
  const [sort, setSort] = useState('name')

  useEffect(() => {
    async function load() {
      const { data } = await db
        .from('sp500_scores')
        .select('*')
        .eq('unscored', false)
        .order('score_100', { ascending: false })
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
        c.ticker.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
      )
    }
    if (sector !== 'All Sectors') list = list.filter(c => c.sector === sector)
    switch (sort) {
      case 'score_desc': list.sort((a, b) => b.score_100 - a.score_100); break
      case 'score_asc':  list.sort((a, b) => a.score_100 - b.score_100); break
      case 'ticker':     list.sort((a, b) => a.ticker.localeCompare(b.ticker)); break
      case 'name':       list.sort((a, b) => (a.name||'').localeCompare(b.name||'')); break
    }
    return list
  }, [companies, search, sector, sort])

  const distData = useMemo(() => {
    const buckets = []
    for (let i = 0; i <= 95; i += 5) {
      buckets.push({ range: i, count: companies.filter(c => c.score_100 >= i && c.score_100 < i + 5).length })
    }
    return buckets
  }, [companies])

  if (loading) return (
    <div className="scores-loading">
      <div className="loading-spinner" />
      <p>Loading scores…</p>
    </div>
  )

  return (
    <div className="scores-page">
      <div className="trend-card">
        <div className="trend-header">
          <h2 className="trend-title">Percent of Surplus Extracted each year</h2>
          <p className="trend-sub">
            Aggregate of every S&amp;P 500 company's productive vs extractive
            cash use, 2010–2025. Ratio = Σ Extractive / (Σ Productive + Σ Extractive).
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={EXTRACTION_TREND} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }} />
            <YAxis domain={[40, 70]} tickFormatter={v => `${v}%`}
              tick={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="dist-tooltip">
                  <span>Fiscal {d.year}</span>
                  <strong>{d.ratio.toFixed(1)}% extracted</strong>
                </div>
              )
            }} />
            <Line type="monotone" dataKey="ratio" stroke="var(--red)"
              strokeWidth={2.5} dot={{ r: 3.5, fill: 'var(--red)' }}
              activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="dist-bar">
        <div className="dist-inner">
          <div className="dist-label">Score distribution — {companies.length} companies</div>
          <div className="dist-chart">
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={distData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="range" hide />
                <YAxis hide />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return <div className="dist-tooltip"><span>Score {d.range}–{d.range+5}</span><strong>{d.count} companies</strong></div>
                }} />
                {distData.map((d, i) => (
                  <Bar key={i} dataKey="count" fill={scoreColor(d.range + 2.5)} opacity={0.8} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="scores-controls">
        <input className="search-input" type="text" placeholder="Search ticker or company name…"
          value={search} onChange={e => setSearch(e.target.value)} />
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

      <div className="scores-table-wrap">
        <table className="scores-table">
          <thead>
            <tr>
              <th>Ticker</th><th>Company</th><th>Sector</th>
              <th>Score</th><th>Grade</th>
              <th className="th-right">PRS</th><th className="th-right">ES</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.ticker} className="score-row">
                <td className="td-ticker"><Link to={`/scores/${c.ticker}`}>{c.ticker}</Link></td>
                <td className="td-name"><Link to={`/scores/${c.ticker}`}>{c.name || '—'}</Link></td>
                <td className="td-sector">{c.sector}</td>
                <td className="td-score">
                  <div className="score-bar-wrap">
                    <div className="score-bar" style={{ width: `${c.score_100}%`, background: scoreColor(c.score_100) }} />
                    <span className="score-val mono" style={{ color: scoreColor(c.score_100) }}>{c.score_100}/100</span>
                  </div>
                </td>
                <td><span className={`grade-badge ${gradeClass(c.grade)}`}>{c.grade}</span></td>
                <td className="td-right mono">{c.prs?.toFixed(2)}</td>
                <td className="td-right mono">{c.es?.toFixed(2)}</td>
                <td className="td-link"><Link to={`/scores/${c.ticker}`} className="row-link">Detail →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
