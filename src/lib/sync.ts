import { db } from './db'
import { supabase } from './supabase'

export async function enqueueSync(
  table: string,
  action: 'upsert' | 'insert',
  data: Record<string, unknown>
): Promise<void> {
  await db.pendingSync.add({
    table,
    action,
    data,
    timestamp: Date.now(),
  })
}

export async function processQueue(): Promise<void> {
  const items = await db.pendingSync.orderBy('timestamp').toArray()

  for (const item of items) {
    try {
      if (item.action === 'upsert') {
        const { error } = await supabase.from(item.table).upsert(item.data as never)
        if (error) throw error
      } else {
        const { error } = await supabase.from(item.table).insert(item.data as never)
        if (error) throw error
      }
      if (item.id !== undefined) {
        await db.pendingSync.delete(item.id)
      }
    } catch {
      break
    }
  }
}

export function setupOnlineListener(): () => void {
  const handler = () => {
    if (navigator.onLine) {
      processQueue()
    }
  }
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
