import Dexie, { type Table } from 'dexie'
import type { Video, WatchProgress, Summary } from '@/types'

export interface PendingSyncItem {
  id?: number
  table: string
  action: 'upsert' | 'insert'
  data: Record<string, unknown>
  timestamp: number
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
