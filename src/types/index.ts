export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  published_at: string | null
  playlist_position: number | null
  created_at: string
  updated_at: string
}

export interface WatchProgress {
  id: string
  user_id: string
  video_id: string
  watched_seconds: number
  total_seconds: number | null
  completed: boolean
  completed_at: string | null
  last_position_seconds: number
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  video_id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
  order_index: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QuizResult {
  id: string
  user_id: string
  video_id: string
  score: number
  total_questions: number
  answers: QuizAnswer[] | null
  completed_at: string
}

export interface QuizAnswer {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
}

export interface Summary {
  id: string
  user_id: string
  video_id: string
  content: string
  created_at: string
  updated_at: string
}

export type VideoStatus = 'all' | 'unwatched' | 'watching' | 'completed'
export type SortOrder = 'published_asc' | 'published_desc' | 'title'

export interface VideoFilter {
  status: VideoStatus
  sortOrder: SortOrder
}
