import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../neonClient'
import { SCORES_TABLE } from '../dataConfig'
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
  'Information Technology','Materials','Real Estate','Utilities','Other'
]

// Sector is now data-driven (SIC-derived `sector` column on the scores row),
// so the universe can grow past the S&P 500 without a hand-maintained map.

const INDEXES = [
  { value: 'all', label: 'All Indexes' },
  { value: 'sp500', label: 'S&P 500' },
  { value: 'russell2000', label: 'Russell 2000' },
]

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
  const [index, setIndex] = useState('all')
  const [sort, setSort] = useState('name')

  useEffect(() => {
    async function load() {
      const { data } = await db
        .from(SCORES_TABLE)
        .select('*')
        .eq('unscored', false)
        .eq('eligible', true)
        .order('score_100', { ascending: false })
      setCompanies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = companies.map(c => ({ ...c, sector: c.sector || 'Other' }))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.ticker.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
      )
    }
    if (index !== 'all') list = list.filter(c => c.index_membership === index)
    if (sector !== 'All Sectors') list = list.filter(c => c.sector === sector)
    switch (sort) {
      case 'score_desc': list.sort((a, b) => b.score_100 - a.score_100); break
      case 'score_asc':  list.sort((a, b) => a.score_100 - b.score_100); break
      case 'ticker':     list.sort((a, b) => a.ticker.localeCompare(b.ticker)); break
      case 'name':       list.sort((a, b) => (a.name||'').localeCompare(b.name||'')); break
    }
    return list
  }, [companies, search, sector, index, sort])

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
            Aggregate productive vs extractive cash use across large U.S. public
            companies, 2010–2025. Ratio = Σ Extractive / (Σ Productive + Σ Extractive).
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
        <select className="filter-select" value={index} onChange={e => setIndex(e.target.value)}>
          {INDEXES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
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
