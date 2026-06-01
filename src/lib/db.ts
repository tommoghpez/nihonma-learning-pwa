import Dexie, { type Table } from 'dexie'
import type { Video, WatchProgress, Summary } from '@/types'

export interface PendingSyncItem {
  id?: number
  table: string
  action: 'upsert' | 'insert'
  data: Record<string, unknown>
  timestamp: number
  /** upsert時の衝突解決キー（例: 'user_id,video_id'）。未指定だと主キー基準になる */
  onConflict?: string
  /** 同期試行回数。上限を超えたら破棄してキューの詰まりを防ぐ */
  attempts?: number
}

export class AppDatabase extends Dexie {
  videos!: Table<Video, string>
  watchProgress!: Table<WatchProgress, string>
  summaries!: Table<Summary, string>
  pendingSync!: Table<PendingSyncItem, number>

  constructor() {
    super('nihonma-learning')
    this.version(1).stores({
      videos: 'id, title, published_at',
      watchProgress: 'id, user_id, video_id, [user_id+video_id]',
      summaries: 'id, user_id, video_id, [user_id+video_id]',
      pendingSync: '++id, table, timestamp',
    })
  }
}

export const db = new AppDatabase()
