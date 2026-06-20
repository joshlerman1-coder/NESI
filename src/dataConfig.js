// Central definition of the database tables the frontend reads.
//
// Overridable via Vite env vars so a *local* build can point at the isolated
// Russell 2000 preview tables (sp500_scores_preview / ..._yearly_preview) while
// production reads the live tables. After the sp500_* -> company_* rename, the
// defaults below move to the company_* names and the env overrides go away.
export const SCORES_TABLE         = import.meta.env.VITE_SCORES_TABLE         || 'sp500_scores'
export const SCORES_YEARLY_TABLE  = import.meta.env.VITE_SCORES_YEARLY_TABLE  || 'sp500_scores_yearly'
export const METRICS_TABLE        = import.meta.env.VITE_METRICS_TABLE        || 'sp500_metrics'
export const METRICS_YEARLY_TABLE = import.meta.env.VITE_METRICS_YEARLY_TABLE || 'sp500_metrics_yearly'
