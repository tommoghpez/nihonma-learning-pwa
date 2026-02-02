import axios from 'axios'
import type { Video } from '@/types'

const API_KEY = import.meta.env.VITE_YT_API_KEY
const CHANNEL_ID = import.meta.env.VITE_CHANNEL_ID
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

interface YouTubePlaylistItem {
  snippet: {
    title: string
    description: string
    thumbnails: { medium?: { url: string }; default?: { url: string } }
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
  const allItems: YouTubePlaylistItem[] = []
  let pageToken: string | undefined

  do {
    const result = await fetchPlaylistItems(playlistId, pageToken)
    allItems.push(...result.items)
    pageToken = result.nextPageToken
  } while (pageToken)

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
  return allItems.map((item) => {
    const videoId = item.snippet.resourceId.videoId
    return {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description || null,
      thumbnail_url: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || null,
      duration_seconds: detailsMap.get(videoId) ?? null,
      published_at: item.snippet.publishedAt,
      playlist_position: item.snippet.position,
      created_at: now,
      updated_at: now,
    }
  })
}
