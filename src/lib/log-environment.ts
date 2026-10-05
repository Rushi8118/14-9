/**
 * Reading logs by environment.
 *
 * Every log table carries an `environment` column (see the log-environment
 * migration) so localhost and build-time activity can be shown separately from
 * real activity on the live site. That migration is applied by hand, so each
 * reader has to work both before and after it: the first query the database
 * rejects for a missing column clears the flag below, and from then on the
 * whole app reads the log unseparated instead of showing nothing.
 */

import {
  LOG_ENVIRONMENT_FILTER_VALUES,
  isMissingEnvironmentColumn,
  type LogEnvironmentFilter,
} from '@/lib/runtime-env'

let available = true

/** False once the database has reported that the migration is still pending. */
export function isLogEnvironmentColumnAvailable(): boolean {
  return available
}

/** Minimal shape of the PostgREST builder methods used for filtering. */
type Filterable<T> = {
  in: (column: string, values: readonly string[]) => T
  or: (filter: string) => T
}

/**
 * Narrow a Supabase query to the selected environments. Rows written before the
 * migration have no value; it backfills them to `production`, and a NULL is
 * read as production here too so nothing disappears in between.
 */
export function applyLogEnvironmentFilter<T>(query: T, filter: LogEnvironmentFilter): T {
  if (!available || filter === 'all') return query
  const values = LOG_ENVIRONMENT_FILTER_VALUES[filter]
  const q = query as unknown as Filterable<T>
  return filter === 'production'
    ? q.or(`environment.is.null,environment.in.(${values.join(',')})`)
    : q.in('environment', values)
}

/**
 * Run a query that may use the environment filter. If the column turns out to
 * be missing, record that and run the caller's query once more — by then
 * `applyLogEnvironmentFilter` is a no-op, so the retry succeeds unseparated.
 */
export async function withLogEnvironmentFallback<R extends { error: unknown }>(
  run: () => PromiseLike<R>,
): Promise<R> {
  const result = await run()
  if (available && isMissingEnvironmentColumn(result.error)) {
    available = false
    return run()
  }
  return result
}

/** As above, for a batch of queries issued together. */
export async function withLogEnvironmentFallbackAll<
  T extends readonly { error: unknown }[],
>(run: () => Promise<T>): Promise<T> {
  const results = await run()
  if (available && results.some((r) => isMissingEnvironmentColumn(r?.error))) {
    available = false
    return run()
  }
  return results
}
