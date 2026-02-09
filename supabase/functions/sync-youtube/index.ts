// Supabase Edge Function: YouTube動画同期
// 毎日深夜3時に自動実行、または手動トリガー可能

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!
const YOUTUBE_CHANNEL_ID = Deno.env.get('YOUTUBE_CHANNEL_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3'

interface YouTubePlaylistItem {
  snippet: {
    title: string
    description: string
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
    publishedAt: string
    resourceId: { videoId: string }
    position: number
  }
}

interface YouTubeVideoDetail {
  id: string
  contentDetails: { duration: string }
}

interface Video {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  published_at: string
  playlist_position: number
  created_at: string
  updated_at: string
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

async function getUploadsPlaylistId(): Promise<string> {
  const url = `${YOUTUBE_BASE_URL}/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.items[0].contentDetails.relatedPlaylists.uploads
}

async function fetchPlaylistItems(
  playlistId: string,
  pageToken?: string
): Promise<{ items: YouTubePlaylistItem[]; nextPageToken?: string }> {
  let url = `${YOUTUBE_BASE_URL}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
  if (pageToken) url += `&pageToken=${pageToken}`

  const res = await fetch(url)
  const data = await res.json()
  return {
    items: data.items || [],
    nextPageToken: data.nextPageToken,
  }
}

async function fetchVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetail[]> {
  if (videoIds.length === 0) return []
  const url = `${YOUTUBE_BASE_URL}/videos?part=contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.items || []
}

function isShorts(item: YouTubePlaylistItem, durationSeconds: number | undefined): boolean {
  const title = item.snippet.title.toLowerCase()
  const desc = (item.snippet.description || '').toLowerCase()
  const text = `${title} ${desc}`

  // タイトルや説明文に #shorts / #short / #youtubeshorts が含まれるか
  if (/#shorts?\b/.test(text) || /#youtubeshorts/.test(text)) return true

  // 3分（180秒）以下の動画はショートとみなす
  if (durationSeconds !== undefined && durationSeconds <= 180) return true

  return false
}

async function syncVideosFromYouTube(): Promise<Video[]> {
  console.log('Starting YouTube sync...')

  const playlistId = await getUploadsPlaylistId()
  console.log('Playlist ID:', playlistId)

  const allItems: YouTubePlaylistItem[] = []
  let pageToken: string | undefined
  let pageCount = 0

  do {
    const result = await fetchPlaylistItems(playlistId, pageToken)
    allItems.push(...result.items)
    pageToken = result.nextPageToken
    pageCount++
    console.log(`Fetched page ${pageCount}, items so far: ${allItems.length}`)
  } while (pageToken)

  console.log(`Total items from YouTube: ${allItems.length}`)

  // 動画の詳細情報を取得
  const videoIds = allItems.map((item) => item.snippet.resourceId.videoId)
  const detailsMap = new Map<string, number>()

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const details = await fetchVideoDetails(batch)
    details.forEach((d) => {
      detailsMap.set(d.id, parseISO8601Duration(d.contentDetails.duration))
    })
  }

  // ショート動画をフィルタリング
  const filteredItems = allItems.filter((item) => {
    const videoId = item.snippet.resourceId.videoId
    const duration = detailsMap.get(videoId)
    return !isShorts(item, duration)
  })

  console.log(`After filtering shorts: ${filteredItems.length} videos`)

  const now = new Date().toISOString()

  return filteredItems.map((item) => {
    const videoId = item.snippet.resourceId.videoId
    return {
      id: videoId,
      title: item.snippet.title.replace(/\s*#[\w\u3000-\u9FFFぁ-んァ-ヶー]+/g, '').trim(),
      description: item.snippet.description || null,
      thumbnail_url:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url ||
        null,
      duration_seconds: detailsMap.get(videoId) ?? null,
      published_at: item.snippet.publishedAt,
      playlist_position: item.snippet.position,
      created_at: now,
      updated_at: now,
    }
  })
}

Deno.serve(async (req) => {
  try {
    // CORSヘッダー
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // 認証チェック
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')

      // JWTのペイロードをデコードしてroleを確認
      let isServiceRole = false
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role === 'service_role') {
          isServiceRole = true
        }
      } catch {
        // デコード失敗 — service_roleではない
      }

      if (isServiceRole) {
        // サーバーサイドからの呼び出し（GitHub Actions / cron）— 認証OK
        console.log('Authenticated as service_role')
      } else {
        // ユーザートークンの場合は認証を確認（手動トリガー）
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { data: { user }, error } = await supabaseClient.auth.getUser(token)

        if (error || !user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // 開発者メールのチェック
        const DEVELOPER_EMAILS = ['tim.tom.0510@gmail.com']
        if (!DEVELOPER_EMAILS.includes(user.email || '')) {
          return new Response(JSON.stringify({ error: 'Forbidden: Developer only' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // YouTube同期実行
    const videos = await syncVideosFromYouTube()

    // Supabaseに保存（upsertのみ — DELETEは使わない）
    // ※ videosテーブルにはwatch_progress/summariesからのCASCADE外部キーがあるため
    //    DELETEすると視聴履歴・ノートも全て消えてしまう
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // バッチでupsert（50件ずつ）— 既存レコードは更新、新規は挿入
    for (let i = 0; i < videos.length; i += 50) {
      const batch = videos.slice(i, i + 50)
      const { error } = await supabase.from('videos').upsert(batch, { onConflict: 'id' })
      if (error) {
        console.error('Upsert error:', error)
        throw error
      }
    }

    // YouTubeから削除された動画をDBから削除（CASCADE注意：個別に処理）
    const youtubeVideoIds = new Set(videos.map((v) => v.id))
    const { data: existingVideos } = await supabase.from('videos').select('id')
    if (existingVideos) {
      const removedIds = existingVideos
        .map((v) => v.id)
        .filter((id) => !youtubeVideoIds.has(id))
      if (removedIds.length > 0) {
        console.log(`Removing ${removedIds.length} videos no longer on YouTube`)
        // CASCADE削除を避けるため、外部キー参照がないものだけ削除
        for (const id of removedIds) {
          const { data: hasProgress } = await supabase
            .from('watch_progress')
            .select('id')
            .eq('video_id', id)
            .limit(1)
          const { data: hasSummary } = await supabase
            .from('summaries')
            .select('id')
            .eq('video_id', id)
            .limit(1)
          if ((!hasProgress || hasProgress.length === 0) && (!hasSummary || hasSummary.length === 0)) {
            await supabase.from('videos').delete().eq('id', id)
          }
        }
      }
    }

    // 同期履歴を記録（オプション）
    try {
      await supabase.from('sync_logs').insert({
        type: 'youtube',
        video_count: videos.length,
        synced_at: new Date().toISOString(),
      })
    } catch {
      // sync_logsテーブルがない場合は無視
    }

    console.log(`Sync completed: ${videos.length} videos`)

    return new Response(
      JSON.stringify({
        success: true,
        videoCount: videos.length,
        syncedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
