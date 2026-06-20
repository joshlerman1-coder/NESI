// Central definition of the database tables the frontend reads.
//
// The canonical tables are company_* (renamed from sp500_* when the universe grew
// past the S&P 500). Names are still overridable via Vite env vars for local
// preview against an isolated branch/preview tables.
export const SCORES_TABLE         = import.meta.env.VITE_SCORES_TABLE         || 'company_scores'
export const SCORES_YEARLY_TABLE  = import.meta.env.VITE_SCORES_YEARLY_TABLE  || 'company_scores_yearly'
export const METRICS_TABLE        = import.meta.env.VITE_METRICS_TABLE        || 'company_metrics'
export const METRICS_YEARLY_TABLE = import.meta.env.VITE_METRICS_YEARLY_TABLE || 'company_metrics_yearly'
