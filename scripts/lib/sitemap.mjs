/**
 * Re-export of the sitemap core.
 *
 * The implementation lives in supabase/functions/_shared/sitemap.mjs because the
 * Supabase CLI bundles an Edge Function from files inside supabase/functions/ —
 * an import reaching up into scripts/ does not ship. Node-side callers (the build
 * script and the tests) come through this shim so there is exactly one copy of
 * the logic and no risk of the deployed sitemap and the tested sitemap drifting.
 */
export * from '../../supabase/functions/_shared/sitemap.mjs'
