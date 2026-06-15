import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Scores from './pages/Scores'
import Methodology from './pages/Methodology'
import Company from './pages/Company'
import About from './pages/About'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="site-header">
          <NavLink to="/" className="site-logo">
            <span className="logo-nesi">NESI</span>
            <span className="logo-full">Net Extractor Scoring Index</span>
          </NavLink>
          <nav className="site-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Scores</NavLink>
            <NavLink to="/methodology" className={({ isActive }) => isActive ? 'active' : ''}>Methodology</NavLink>
            <NavLink to="/philosophy" className={({ isActive }) => isActive ? 'active' : ''}>Philosophy</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Scores />} />
            <Route path="/scores/:ticker" element={<Company />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/philosophy" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <p>NESI — Net Extractor Scoring Index. Data sourced from SEC EDGAR 10-K filings. Not investment advice.</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}
