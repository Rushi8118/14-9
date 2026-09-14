import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

type ChangeFilter = {
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  schema?: string
  table: string
  filter?: string
}

/**
 * Safely create a postgres_changes subscription.
 * Prevents "cannot add callbacks after subscribe()" under React Strict Mode
 * and when multiple components reuse the same channel name.
 */
export function subscribePostgresChanges(
  client: SupabaseClient,
  channelName: string,
  filters: ChangeFilter | ChangeFilter[],
  onChange: (payload: unknown) => void,
  onStatusChange?: (status: string) => void,
): () => void {
  const list = Array.isArray(filters) ? filters : [filters]
  const uniqueName = `${channelName}:${Math.random().toString(36).slice(2, 9)}`

  // Drop any leftover channels with the same logical prefix
  for (const existing of client.getChannels()) {
    if (existing.topic.includes(channelName)) {
      void client.removeChannel(existing)
    }
  }

  let channel: RealtimeChannel = client.channel(uniqueName)
  for (const item of list) {
    channel = channel.on(
      'postgres_changes',
      {
        event: item.event ?? '*',
        schema: item.schema ?? 'public',
        table: item.table,
        filter: item.filter,
      },
      (payload) => onChange(payload),
    )
  }

  channel.subscribe((status) => onStatusChange?.(status))

  return () => {
    void client.removeChannel(channel)
  }
}
