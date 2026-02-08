import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/common/Card'
import {
  getTyranSVG,
  TYRAN_STAGES,
  TYRAN_MOODS,
  type TyranStage,
  type TyranMood,
} from '@/lib/tyran'

const stages: TyranStage[] = ['egg', 'baby', 'child', 'teen', 'adult', 'king']
// 機嫌順: ecstatic(0日) > happy(1日) > normal(2日) > worried(3日心配) > sad(4日悲しい) > dying(5日)
const moods: TyranMood[] = ['ecstatic', 'happy', 'normal', 'worried', 'sad', 'dying']

// 機嫌の日本語ラベル
const moodLabels: Record<TyranMood, string> = {
  ecstatic: 'Ecstatic (0日)',
  happy: 'Happy (1日)',
  normal: 'Normal (2日)',
  worried: 'Worried (3日)',
  sad: 'Sad (4日)',
  dying: 'Dying (5日)',
}

// 機嫌の説明
const moodDescriptions: Record<TyranMood, string> = {
  ecstatic: 'ほっぺ真っ赤、キラキラ付き',
  happy: 'ほっぺピンク',
  normal: '普通の表情',
  worried: '汗マーク、色がやや暗い',
  sad: '涙目、色が暗い',
  dying: '目がX、グレー色',
}

export function TyranPreviewPage() {
  const [frame, setFrame] = useState(0)
  const [selectedStage, setSelectedStage] = useState<TyranStage>('baby')
  const [selectedMood, setSelectedMood] = useState<TyranMood>('happy')
  const [showDead, setShowDead] = useState(false)

  // アニメーション用のフレーム更新
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => f + 1)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-text-primary">ティランプレビュー</h1>
      </div>

      {/* コントロール */}
      <Card>
        <h2 className="font-bold mb-3">表示設定</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-2 block">ステージ</label>
            <div className="flex flex-wrap gap-2">
              {stages.map(stage => (
                <button
                  key={stage}
                  onClick={() => { setSelectedStage(stage); setShowDead(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedStage === stage && !showDead
                      ? 'bg-teal text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {TYRAN_STAGES[stage].name}
                </button>
              ))}
              <button
                onClick={() => setShowDead(true)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  showDead
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                死亡
              </button>
            </div>
          </div>

          {!showDead && (
            <div>
              <label className="text-sm text-text-secondary mb-2 block">機嫌（学習していない日数）</label>
              <div className="flex flex-wrap gap-2">
                {moods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedMood === mood
                        ? 'bg-navy text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {moodLabels[mood]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 選択中のティラン大きく表示 */}
      <Card className="text-center">
        <h2 className="font-bold mb-4">
          {showDead ? '死亡状態' : `${TYRAN_STAGES[selectedStage].name}（${moodLabels[selectedMood]}）`}
        </h2>
        <div className="relative flex justify-center items-center min-h-[200px] bg-gradient-to-b from-sky-100 to-green-100 rounded-xl p-8">
          {/* 地面 */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-green-400 to-green-300 rounded-b-xl" />
          <div
            className="w-48 h-44"
            dangerouslySetInnerHTML={{
              __html: getTyranSVG(
                selectedStage,
                selectedMood,
                !showDead,
                frame,
                true
              )
            }}
          />
        </div>
        <p className="mt-4 text-sm text-text-secondary">
          {showDead
            ? 'ティランは眠りについてしまいました...'
            : `${TYRAN_MOODS[selectedMood].message} - ${moodDescriptions[selectedMood]}`
          }
        </p>
      </Card>

      {/* 全ステージ一覧 */}
      <Card>
        <h2 className="font-bold mb-4">全ステージ一覧</h2>
        <div className="grid grid-cols-3 gap-4">
          {stages.map(stage => (
            <div key={stage} className="text-center">
              <div className="bg-gradient-to-b from-sky-50 to-green-50 rounded-lg p-3 mb-2 min-h-[100px] flex items-center justify-center">
                <div
                  className={`${
                    stage === 'king' ? 'w-24 h-20' :
                    stage === 'adult' ? 'w-20 h-20' :
                    stage === 'teen' ? 'w-16 h-16' : 'w-14 h-14'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: getTyranSVG(stage, 'happy', true, frame, true)
                  }}
                />
              </div>
              <p className="text-xs font-bold text-text-primary">{TYRAN_STAGES[stage].name}</p>
              <p className="text-[10px] text-text-secondary">{TYRAN_STAGES[stage].minStreak}日〜</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 機嫌別一覧 */}
      <Card>
        <h2 className="font-bold mb-4">機嫌による変化（こどもティラン）</h2>
        <p className="text-xs text-text-secondary mb-4">
          機嫌は表情・ほっぺ・涙/汗・体の色で表現されます
        </p>
        <div className="grid grid-cols-3 gap-4">
          {moods.map(mood => (
            <div key={mood} className="text-center">
              <div className="relative bg-gradient-to-b from-sky-50 to-green-50 rounded-lg p-3 mb-2 min-h-[100px] flex flex-col items-center justify-center">
                <div
                  className="w-14 h-14"
                  dangerouslySetInnerHTML={{
                    __html: getTyranSVG('child', mood, true, frame, true)
                  }}
                />
              </div>
              <p className="text-xs font-bold text-text-primary capitalize">{mood}</p>
              <p className="text-[10px] text-text-secondary">{TYRAN_MOODS[mood].maxDays}日目</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{moodDescriptions[mood]}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* キングティランの炎 */}
      <Card>
        <h2 className="font-bold mb-4">キングティランの特徴</h2>
        <div className="bg-gradient-to-b from-sky-50 to-green-100 rounded-lg p-6 flex justify-center items-center min-h-[150px]">
          <div
            className="w-32 h-28"
            dangerouslySetInnerHTML={{
              __html: getTyranSVG('king', 'ecstatic', true, frame, true)
            }}
          />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <span>王冠を被っている</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-lg">🦋</span>
            <span>背中から翼が生えている</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span>向いている方向に炎を吹く</span>
          </p>
        </div>
      </Card>

      {/* 成長過程説明 */}
      <Card>
        <h2 className="font-bold mb-4">成長システム</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <span className="text-xl">🥚</span>
            <div>
              <p className="font-bold">たまご → ベビー</p>
              <p className="text-text-secondary">1日学習でたまごから孵化！</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
            <span className="text-xl">🦖</span>
            <div>
              <p className="font-bold">成長段階</p>
              <p className="text-text-secondary">3日→こども、7日→少年、14日→おとな（翼付き）、30日→キング（王冠・炎）</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-xl">😊</span>
            <div>
              <p className="font-bold">機嫌システム</p>
              <p className="text-text-secondary">学習していない日数で機嫌が変化。表情・色・エフェクトで表現</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <span className="text-xl">💔</span>
            <div>
              <p className="font-bold">注意！</p>
              <p className="text-text-secondary">5日間学習しないとティランは眠ってしまいます...</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
