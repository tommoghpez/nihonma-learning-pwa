import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '@/stores/useProgressStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Card } from '@/components/common/Card'
import {
  calculateTyranState,
  getTyranSVG,
  getTyranMessage,
  TYRAN_STAGES,
  type TyranState,
} from '@/lib/tyran'
import { DEVELOPER_EMAILS } from '@/lib/constants'
import { Flame, Skull, Egg, Eye } from 'lucide-react'

export function TyranStreak() {
  const navigate = useNavigate()
  const progressMap = useProgressStore((s) => s.progressMap)
  const user = useAuthStore((s) => s.user)
  const [frame, setFrame] = useState(0)
  const [position, setPosition] = useState(0) // -100 ~ 100 の範囲で位置
  const [direction, setDirection] = useState(1) // 1: 右向き, -1: 左向き

  // 開発者かどうか
  const isDeveloper = user && DEVELOPER_EMAILS.includes(user.email as typeof DEVELOPER_EMAILS[number])

  const tyranState = useMemo<TyranState>(() => {
    // 学習した日付を取得
    const learnedDates = Object.values(progressMap)
      .filter((p) => p.watched_seconds > 0)
      .map((p) => p.updated_at)

    return calculateTyranState(learnedDates)
  }, [progressMap])

  // アニメーションフレームと位置の更新
  useEffect(() => {
    if (!tyranState.isAlive) return

    // 機嫌順: ecstatic(0) > happy(1) > normal(2) > worried(3) > sad(4) > dying(5)
    const animationSpeed = tyranState.mood === 'ecstatic' ? 300 :
                          tyranState.mood === 'happy' ? 400 :
                          tyranState.mood === 'normal' ? 500 :
                          tyranState.mood === 'worried' ? 700 :
                          tyranState.mood === 'sad' ? 800 : 1000

    const walkSpeed = tyranState.mood === 'ecstatic' ? 8 :
                     tyranState.mood === 'happy' ? 6 :
                     tyranState.mood === 'normal' ? 4 :
                     tyranState.mood === 'worried' ? 2 :
                     tyranState.mood === 'sad' ? 1 : 0.5

    const interval = setInterval(() => {
      setFrame(f => f + 1)

      setPosition(p => {
        const newPos = p + direction * walkSpeed
        // 端に到達したら方向転換
        if (newPos > 60) {
          setDirection(-1)
          return 60
        }
        if (newPos < -60) {
          setDirection(1)
          return -60
        }
        return newPos
      })
    }, animationSpeed)

    return () => clearInterval(interval)
  }, [tyranState.isAlive, tyranState.mood, direction])

  const stageInfo = TYRAN_STAGES[tyranState.stage]
  // 向き（direction: 1=右, -1=左）をfacingRightに変換
  const facingRight = direction === 1
  const tyranSVG = getTyranSVG(tyranState.stage, tyranState.mood, tyranState.isAlive, frame, facingRight)
  const message = getTyranMessage(tyranState)

  // 週間カレンダーを生成
  const weekDays = useMemo(() => {
    const today = new Date()
    const days = []
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']

    // 学習した日付のセット
    const learnedDatesSet = new Set(
      Object.values(progressMap)
        .filter((p) => p.watched_seconds > 0)
        .map((p) => p.updated_at.split('T')[0])
    )

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const isToday = i === 0
      const hasLearned = learnedDatesSet.has(dateStr)

      days.push({
        dayName: dayNames[date.getDay()],
        date: date.getDate(),
        isToday,
        hasLearned,
      })
    }

    return days
  }, [progressMap])

  return (
    <Card className="overflow-hidden p-0">
      {/* ヘッダー */}
      <div className={`p-4 ${tyranState.isAlive ? 'bg-gradient-to-r from-green-500 to-teal' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tyranState.isAlive ? (
              <>
                <Flame className="w-5 h-5" />
                <span className="font-bold">
                  {tyranState.streakDays > 0 ? `${tyranState.streakDays}日連続学習中！` : '今日から始めよう！'}
                </span>
              </>
            ) : (
              <>
                <Skull className="w-5 h-5" />
                <span className="font-bold">ティランが眠ってしまった...</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tyranState.longestStreak > 0 && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                最長 {tyranState.longestStreak}日
              </span>
            )}
{isDeveloper && (
              <button
                onClick={() => navigate('/tyran-preview')}
                className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                title="ティランプレビュー"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-4">
        {/* ティランの歩行エリア */}
        <div className={`relative mb-3 bg-gradient-to-b from-sky-100 to-green-100 rounded-lg overflow-hidden border-b-4 border-green-300 ${
          tyranState.stage === 'king' ? 'h-36' : tyranState.stage === 'adult' ? 'h-28' : 'h-24'
        }`}>
          {/* 地面の草 */}
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-green-400 to-green-300" />

          {/* 雲（背景装飾） */}
          {tyranState.isAlive && (
            <>
              <div className="absolute top-2 left-1/4 text-3xl opacity-30">☁️</div>
              <div className="absolute top-4 right-1/4 text-xl opacity-20">☁️</div>
            </>
          )}

          {/* ティラン */}
          <div
            className="absolute bottom-3 transition-all duration-100"
            style={{
              left: `calc(50% + ${position}px - ${
                tyranState.stage === 'king' ? 40 :
                tyranState.stage === 'adult' ? 32 :
                tyranState.stage === 'teen' ? 28 : 20
              }px)`,
            }}
          >
            <div
              className={`${
                tyranState.stage === 'king' ? 'w-24 h-24' :
                tyranState.stage === 'adult' ? 'w-20 h-20' :
                tyranState.stage === 'teen' ? 'w-16 h-16' :
                tyranState.stage === 'child' ? 'w-14 h-14' : 'w-12 h-12'
              }`}
              dangerouslySetInnerHTML={{ __html: tyranSVG }}
            />
          </div>
        </div>

        {/* ステージ名とメッセージ */}
        <div className="flex items-center gap-3 mb-3">
          {tyranState.isAlive && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
              {stageInfo.name}
            </span>
          )}
          <p className="text-sm text-text-primary flex-1">{message}</p>
        </div>

        <div className="space-y-3">

            {/* 成長プログレス */}
            {tyranState.isAlive && tyranState.stage !== 'king' && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>次のステージまで</span>
                  <span>{getNextStageInfo(tyranState)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-teal rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercent(tyranState)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 危険度インジケーター（見ていない日数が多い時） */}
            {tyranState.isAlive && tyranState.daysSinceLastLearned >= 2 && (
              <div className="flex items-center gap-1 text-xs text-warning bg-orange-50 px-2 py-1 rounded">
                <span>⚠️</span>
                <span>あと{5 - tyranState.daysSinceLastLearned}日でティランが眠ってしまうよ！</span>
              </div>
            )}

          {/* 死んでしまった場合の復活ボタン */}
          {!tyranState.isAlive && (
            <div className="flex items-center gap-2 text-xs text-text-secondary bg-gray-50 px-3 py-2 rounded-lg">
              <Egg className="w-4 h-4" />
              <span>動画を視聴すると新しいティランが生まれるよ！</span>
            </div>
          )}
        </div>

        {/* 週間カレンダー */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between">
            {weekDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] ${day.isToday ? 'font-bold text-navy' : 'text-text-secondary'}`}>
                  {day.dayName}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                    ${day.hasLearned
                      ? 'bg-teal text-white'
                      : day.isToday
                        ? 'bg-navy-100 text-navy border-2 border-navy'
                        : 'bg-gray-100 text-text-secondary'
                    }`}
                >
                  {day.hasLearned ? '✓' : day.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 次のステージまでの情報を取得
function getNextStageInfo(state: TyranState): string {
  const stageOrder: Array<{ stage: string; days: number }> = [
    { stage: 'baby', days: 1 },
    { stage: 'child', days: 3 },
    { stage: 'teen', days: 7 },
    { stage: 'adult', days: 14 },
    { stage: 'king', days: 30 },
  ]

  const currentIndex = stageOrder.findIndex((s) => s.stage === state.stage)
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return ''
  }

  const nextStage = stageOrder[currentIndex + 1]
  const remaining = nextStage.days - state.streakDays

  return `あと${remaining}日`
}

// 次のステージまでの進捗％を取得
function getProgressPercent(state: TyranState): number {
  const stageThresholds = [
    { stage: 'egg', min: 0, max: 1 },
    { stage: 'baby', min: 1, max: 3 },
    { stage: 'child', min: 3, max: 7 },
    { stage: 'teen', min: 7, max: 14 },
    { stage: 'adult', min: 14, max: 30 },
    { stage: 'king', min: 30, max: 30 },
  ]

  const current = stageThresholds.find((s) => s.stage === state.stage)
  if (!current || current.stage === 'king') return 100

  const progress = state.streakDays - current.min
  const range = current.max - current.min

  return Math.min(100, Math.round((progress / range) * 100))
}
