import { createClient } from '@neondatabase/neon-js'

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL
const NEON_DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL

// Public, read-only access. allowAnonymous makes the client fetch and cache a
// short-lived anonymous JWT automatically, so visitors never sign in. The
// `anonymous` Postgres role is granted SELECT on sp500_scores / sp500_metrics
// and RLS allows public reads; no write access is exposed to the browser.
export const db = createClient({
  auth: {
    url: NEON_AUTH_URL,
    allowAnonymous: true,
  },
  dataApi: {
    url: NEON_DATA_API_URL,
  },
})
