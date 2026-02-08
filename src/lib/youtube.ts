import axios from 'axios'
import type { Video } from '@/types'

const API_KEY = import.meta.env.VITE_YT_API_KEY
const CHANNEL_ID = import.meta.env.VITE_CHANNEL_ID
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

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

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

async function getUploadsPlaylistId(): Promise<string> {
  const res = await axios.get(`${BASE_URL}/channels`, {
    params: {
      part: 'contentDetails',
      id: CHANNEL_ID,
      key: API_KEY,
    },
  })
  return res.data.items[0].contentDetails.relatedPlaylists.uploads
}

async function fetchPlaylistItems(
  playlistId: string,
  pageToken?: string
): Promise<{ items: YouTubePlaylistItem[]; nextPageToken?: string }> {
  const res = await axios.get(`${BASE_URL}/playlistItems`, {
    params: {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
      pageToken,
      key: API_KEY,
    },
  })
  return {
    items: res.data.items,
    nextPageToken: res.data.nextPageToken,
  }
}

async function fetchVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetail[]> {
  if (videoIds.length === 0) return []
  const res = await axios.get(`${BASE_URL}/videos`, {
    params: {
      part: 'contentDetails',
      id: videoIds.join(','),
      key: API_KEY,
    },
  })
  return res.data.items
}

export async function syncVideosFromYouTube(): Promise<Video[]> {
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
    console.log(`Fetched page ${pageCount}, items so far: ${allItems.length}, nextPageToken: ${pageToken}`)
  } while (pageToken)

  console.log(`Total items from YouTube: ${allItems.length}`)

  const videoIds = allItems.map((item) => item.snippet.resourceId.videoId)
  const detailsMap = new Map<string, number>()

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const details = await fetchVideoDetails(batch)
    details.forEach((d) => {
      detailsMap.set(d.id, parseISO8601Duration(d.contentDetails.duration))
    })
  }

  const now = new Date().toISOString()

  // ショート動画を判定する関数
  function isShorts(item: YouTubePlaylistItem, durationSeconds: number | undefined): boolean {
    const title = item.snippet.title.toLowerCase()
    const desc = (item.snippet.description || '').toLowerCase()
    const text = `${title} ${desc}`

    // 1. タイトルや説明文に #shorts / #short / #youtubeshorts が含まれるか
    if (/#shorts?\b/.test(text) || /#youtubeshorts/.test(text)) return true

    // 2. 3分（180秒）以下の動画はショートとみなす
    if (durationSeconds !== undefined && durationSeconds <= 180) return true

    return false
  }

  const filteredItems = allItems.filter((item) => {
    const videoId = item.snippet.resourceId.videoId
    const duration = detailsMap.get(videoId)
    return !isShorts(item, duration)
  })

  console.log(`After filtering shorts: ${filteredItems.length} videos`)

  return filteredItems.map((item) => {
      const videoId = item.snippet.resourceId.videoId
      return {
        id: videoId,
        title: item.snippet.title.replace(/\s*#[\w\u3000-\u9FFFぁ-んァ-ヶー]+/g, '').trim(),
        description: item.snippet.description || null,
        thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || null,
        duration_seconds: detailsMap.get(videoId) ?? null,
        published_at: item.snippet.publishedAt,
        playlist_position: item.snippet.position,
        created_at: now,
        updated_at: now,
      }
    })
}
