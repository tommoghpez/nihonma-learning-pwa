import { db } from './db'
import { supabase } from './supabase'

// 1項目が繰り返し失敗してもキュー全体を永久にブロックしないための試行上限
const MAX_SYNC_ATTEMPTS = 5

export async function enqueueSync(
  table: string,
  action: 'upsert' | 'insert',
  data: Record<string, unknown>,
  onConflict?: string
): Promise<void> {
  await db.pendingSync.add({
    table,
    action,
    data,
    onConflict,
    attempts: 0,
    timestamp: Date.now(),
  })
}

export async function processQueue(): Promise<void> {
  const items = await db.pendingSync.orderBy('timestamp').toArray()

  for (const item of items) {
    try {
      if (item.action === 'upsert') {
        const { error } = await supabase
          .from(item.table)
          .upsert(item.data as never, (item.onConflict ? { onConflict: item.onConflict } : undefined) as never)
        if (error) throw error
      } else {
        const { error } = await supabase.from(item.table).insert(item.data as never)
        if (error) throw error
      }
      if (item.id !== undefined) {
        await db.pendingSync.delete(item.id)
      }
    } catch {
      // この項目は失敗。キューを止めず次へ進む（以前は break で全同期が詰まっていた）。
      // 試行回数を加算し、上限を超えた毒項目は破棄して後続の同期を守る。
      if (item.id !== undefined) {
        const attempts = (item.attempts ?? 0) + 1
        if (attempts >= MAX_SYNC_ATTEMPTS) {
          await db.pendingSync.delete(item.id)
        } else {
          await db.pendingSync.update(item.id, { attempts })
        }
      }
      continue
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
