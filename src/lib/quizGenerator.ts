import type { Video } from '@/types'

interface GeneratedQuestion {
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
}

export function generateQuizFromVideo(video: Video): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []

  questions.push({
    question: 'この動画の主題は何ですか？',
    options: [
      video.title,
      'M&Aの基礎知識',
      '財務分析の手法',
      '企業価値評価について',
    ],
    correct_index: 0,
    explanation: `この動画のタイトルは「${video.title}」です。`,
  })

  if (video.description) {
    const sentences = video.description
      .split(/[。\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && s.length < 100)

    if (sentences.length > 0) {
      const keyword = sentences[0]
      questions.push({
        question: 'この動画の説明文で最初に触れられている内容は？',
        options: [
          keyword.slice(0, 50),
          '市場動向の分析',
          '人材マネジメント',
          '経営戦略の立案',
        ],
        correct_index: 0,
        explanation: `動画の説明文によると「${keyword.slice(0, 50)}」と記載されています。`,
      })
    }
  }

  questions.push({
    question: 'この動画を視聴して、最も重要だと感じたポイントは何ですか？',
    options: [
      '動画の内容を実務に活かすこと',
      '理論的な知識を深めること',
      '他社の事例を学ぶこと',
      '数値データを分析すること',
    ],
    correct_index: 0,
    explanation: '学んだ内容を実務に活かすことが最も重要です。',
  })

  questions.push({
    question: '次のステップとして最も適切なのはどれですか？',
    options: [
      '学んだ内容をチームに共有する',
      '特に何もしない',
      '別の動画を見る',
      '忘れる前にメモを消す',
    ],
    correct_index: 0,
    explanation: '学んだ内容をチームに共有することで、チーム全体の知識向上につながります。',
  })

  return questions
}
