import { useMemo, useState, useEffect, useCallback } from 'react'
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
import { Egg, Eye } from 'lucide-react'

// 時間帯の判定（ローカル時間）
function getTimeOfDay(): 'morning' | 'afternoon' | 'night' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'night'
}

// 時間帯別の背景スタイル（ピクセルアート風）
const SKY_STYLES = {
  morning: {
    background: 'linear-gradient(to bottom, #FB923C 0%, #FDE68A 40%, #BAE6FD 100%)',
    borderColor: 'border-green-400',
  },
  afternoon: {
    background: 'linear-gradient(to bottom, #0EA5E9 0%, #38BDF8 50%, #E0F2FE 100%)',
    borderColor: 'border-green-300',
  },
  night: {
    background: 'linear-gradient(to bottom, #0F172A 0%, #1E1B4B 60%, #312E81 100%)',
    borderColor: 'border-green-900',
  },
} as const

const PET_COUNT_KEY = 'nihonma-tyran-pet-count'
function getPetCount(): number {
  try { return parseInt(localStorage.getItem(PET_COUNT_KEY) ?? '0', 10) } catch { return 0 }
}
function incrementPetCount(): number {
  const count = getPetCount() + 1
  localStorage.setItem(PET_COUNT_KEY, String(count))
  return count
}
function getPetMessage(count: number): string {
  if (count >= 100) return 'いつもありがとう！大好き！💖'
  if (count >= 50) return 'もっとなでて〜！😆'
  if (count >= 20) return 'なでなで嬉しい！😊'
  if (count >= 10) return 'きもちいい〜♪'
  if (count >= 5) return 'えへへ😄'
  return 'わーい！🎵'
}

// 全学習日付を取得するヘルパー（created_at と updated_at の両方を含む）
function getAllLearnedDates(progressMap: Record<string, { watched_seconds: number; created_at: string; updated_at: string }>): Set<string> {
  const dates = new Set<string>()
  for (const p of Object.values(progressMap)) {
    if (p.watched_seconds > 0) {
      dates.add(p.created_at.split('T')[0])
      dates.add(p.updated_at.split('T')[0])
    }
  }
  return dates
}

// マイルストーン定義
const MILESTONES = [
  { days: 1, emoji: '🥚' },
  { days: 3, emoji: '🦎' },
  { days: 7, emoji: '🦖' },
  { days: 14, emoji: '🐉' },
  { days: 30, emoji: '👑' },
]

export function TyranStreak() {
  const navigate = useNavigate()
  const progressMap = useProgressStore((s) => s.progressMap)
  const user = useAuthStore((s) => s.user)
  const [frame, setFrame] = useState(0)
  const [position, setPosition] = useState(0) // -100 ~ 100 の範囲で位置
  const [direction, setDirection] = useState(1) // 1: 右向き, -1: 左向き
  const [isJumping, setIsJumping] = useState(false)
  const [hearts, setHearts] = useState<Array<{ id: number; x: number }>>([])
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null)
  const [petCount, setPetCount] = useState(getPetCount)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay)

  // 時間帯を1分ごとに更新
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // ティランタップハンドラー
  const handleTyranTap = useCallback(() => {
    if (!tyranState?.isAlive) return

    // ジャンプアニメーション
    setIsJumping(true)
    setTimeout(() => setIsJumping(false), 400)

    // ハートエフェクト
    const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 }
    setHearts((prev) => [...prev, newHeart])
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id))
    }, 1000)

    // なでなでカウント更新
    const count = incrementPetCount()
    setPetCount(count)

    // 吹き出しメッセージ
    setBubbleMessage(getPetMessage(count))
    setTimeout(() => setBubbleMessage(null), 2000)
  }, [])

  // 開発者かどうか
  const isDeveloper = user && DEVELOPER_EMAILS.includes(user.email as typeof DEVELOPER_EMAILS[number])

  const tyranState = useMemo<TyranState>(() => {
    // 学習した全日付を取得（created_at + updated_at）
    const learnedDates: string[] = []
    for (const p of Object.values(progressMap)) {
      if (p.watched_seconds > 0) {
        learnedDates.push(p.created_at)
        learnedDates.push(p.updated_at)
      }
    }
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

  // 30日間カレンダーを生成（月曜始まり）
  const calendarData = useMemo(() => {
    const today = new Date()
    const dayNames = ['月', '火', '水', '木', '金', '土', '日']

    // 学習した日付のセット（created_at + updated_at の両方）
    const learnedDatesSet = getAllLearnedDates(progressMap)

    // 30日前を起点（今日含めて30日間）
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 29)

    // startDate を含む週の月曜日まで巻き戻す
    const mondayOffset = (startDate.getDay() + 6) % 7
    const calendarStart = new Date(startDate)
    calendarStart.setDate(calendarStart.getDate() - mondayOffset)

    // today を含む週の日曜日まで拡張
    const todayMondayOffset = (today.getDay() + 6) % 7
    const sundayOffset = 6 - todayMondayOffset
    const calendarEnd = new Date(today)
    calendarEnd.setDate(calendarEnd.getDate() + sundayOffset)

    const todayStr = today.toISOString().split('T')[0]
    const startStr = startDate.toISOString().split('T')[0]

    // 週ごとのグリッドを生成
    const weeks: Array<Array<{
      dateStr: string
      dayOfMonth: number
      isToday: boolean
      hasLearned: boolean
      isInRange: boolean
      isFuture: boolean
    }>> = []

    const cursor = new Date(calendarStart)
    while (cursor <= calendarEnd) {
      const week: typeof weeks[0] = []
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0]
        const isInRange = dateStr >= startStr && dateStr <= todayStr
        const isFuture = dateStr > todayStr

        week.push({
          dateStr,
          dayOfMonth: cursor.getDate(),
          isToday: dateStr === todayStr,
          hasLearned: learnedDatesSet.has(dateStr),
          isInRange,
          isFuture,
        })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }

    return { dayNames, weeks }
  }, [progressMap])

  return (
    <Card className="overflow-hidden p-0">
      {/* ヘッダー（コンパクト） */}
      <div className={`px-3 py-1.5 ${tyranState.isAlive ? 'bg-gradient-to-r from-green-500 to-teal' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            {tyranState.isAlive ? (
              <span className="font-bold">🔥 {tyranState.streakDays > 0 ? `${tyranState.streakDays}日` : 'Start!'}</span>
            ) : (
              <span className="font-bold">💤 おやすみ中</span>
            )}
            {tyranState.longestStreak > 0 && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                最長{tyranState.longestStreak}日
              </span>
            )}
          </div>
          {isDeveloper && (
            <button
              onClick={() => navigate('/tyran-preview')}
              className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title="ティランプレビュー"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-3">
        {/* ティランの歩行エリア（拡大） */}
        <div
          className={`relative mb-2 rounded-lg overflow-hidden border-b-4 ${SKY_STYLES[timeOfDay].borderColor} ${
            tyranState.stage === 'king' ? 'h-28' : tyranState.stage === 'adult' ? 'h-24' : 'h-20'
          }`}
          style={{ background: SKY_STYLES[timeOfDay].background }}
        >
          {/* 夜空のピクセルアート星 */}
          {timeOfDay === 'night' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60" preserveAspectRatio="none">
              <rect x="8"  y="5"  width="1.5" height="1.5" fill="white" opacity="0.9"/>
              <rect x="20" y="12" width="1"   height="1"   fill="white" opacity="0.7"/>
              <rect x="35" y="6"  width="2"   height="2"   fill="white" opacity="0.85"/>
              <rect x="50" y="4"  width="1"   height="1"   fill="white" opacity="0.6"/>
              <rect x="63" y="9"  width="1.5" height="1.5" fill="white" opacity="0.9"/>
              <rect x="78" y="5"  width="1"   height="1"   fill="white" opacity="0.7"/>
              <rect x="14" y="20" width="1"   height="1"   fill="white" opacity="0.5"/>
              <rect x="44" y="17" width="1.5" height="1.5" fill="white" opacity="0.75"/>
              <rect x="72" y="22" width="1"   height="1"   fill="white" opacity="0.6"/>
              <rect x="28" y="25" width="1"   height="1"   fill="white" opacity="0.5"/>
              <rect x="88" y="14" width="1"   height="1"   fill="white" opacity="0.8"/>
              <rect x="56" y="28" width="1"   height="1"   fill="white" opacity="0.4"/>
              <rect x="92" y="8"  width="1"   height="1"   fill="white" opacity="0.65"/>
              {/* 十字型の明るい星 */}
              <rect x="40" y="9"  width="1"   height="3"   fill="white" opacity="0.95"/>
              <rect x="39" y="10" width="3"   height="1"   fill="white" opacity="0.95"/>
            </svg>
          )}

          {/* 朝焼けの光彩（morning） */}
          {timeOfDay === 'morning' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60" preserveAspectRatio="none">
              <radialGradient id="sunrise-glow" cx="85%" cy="20%" r="30%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0"/>
              </radialGradient>
              <rect x="0" y="0" width="100" height="60" fill="url(#sunrise-glow)"/>
            </svg>
          )}

          {/* 地面の草（多層） */}
          <div className={`absolute bottom-0 left-0 right-0 h-3 ${
            timeOfDay === 'night'
              ? 'bg-gradient-to-t from-green-900 via-green-800 to-green-700'
              : 'bg-gradient-to-t from-green-500 via-green-400 to-green-300'
          }`} />
          {/* 草のディテール */}
          <svg className="absolute bottom-1 left-0 right-0 h-3 w-full opacity-40" viewBox="0 0 200 10" preserveAspectRatio="none">
            <path d="M0,10 L5,4 L10,10 L15,5 L20,10 L25,3 L30,10 L35,6 L40,10 L45,4 L50,10 L55,5 L60,10 L65,3 L70,10 L75,6 L80,10 L85,4 L90,10 L95,5 L100,10 L105,3 L110,10 L115,6 L120,10 L125,4 L130,10 L135,5 L140,10 L145,3 L150,10 L155,6 L160,10 L165,4 L170,10 L175,5 L180,10 L185,3 L190,10 L195,6 L200,10" fill={timeOfDay === 'night' ? '#14532D' : '#2E7D32'}/>
          </svg>

          {/* 太陽 / 月 */}
          {timeOfDay === 'night' ? (
            <div className="absolute top-1 right-3 text-xl">🌙</div>
          ) : (
            <div className="absolute top-1 right-3 text-xl" style={{ animation: 'spin 20s linear infinite' }}>☀️</div>
          )}

          {/* 雲（朝・昼のみ） */}
          {tyranState.isAlive && timeOfDay !== 'night' && (
            <>
              <div className="absolute top-2 text-lg opacity-30" style={{ animation: 'drift 25s linear infinite' }}>☁️</div>
              <div className="absolute top-4 text-sm opacity-20" style={{ animation: 'drift 18s linear infinite', animationDelay: '-8s' }}>☁️</div>
            </>
          )}

          {/* 木（左端・右端）夜は暗め */}
          <div className={`absolute bottom-2 left-2 text-lg ${timeOfDay === 'night' ? 'opacity-30' : 'opacity-50'}`}>🌳</div>
          <div className={`absolute bottom-2 right-3 text-base ${timeOfDay === 'night' ? 'opacity-25' : 'opacity-40'}`}>🌲</div>

          {/* ティラン（タップ可能） */}
          <div
            className={`absolute bottom-0 transition-all duration-100 cursor-pointer ${
              isJumping ? 'animate-bounce' : ''
            }`}
            style={{
              left: `calc(50% + ${position}px - ${
                tyranState.stage === 'king' ? 24 :
                tyranState.stage === 'adult' ? 20 :
                tyranState.stage === 'teen' ? 16 : 12
              }px)`,
              transform: isJumping ? 'translateY(-20px)' : 'translateY(0)',
            }}
            onClick={handleTyranTap}
          >
            {/* 吹き出し */}
            {bubbleMessage && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-text-primary text-[10px] px-2 py-1 rounded-full shadow-md animate-fade-in z-10">
                {bubbleMessage}
              </div>
            )}

            {/* ハートエフェクト */}
            {hearts.map((heart) => (
              <span
                key={heart.id}
                className="absolute -top-4 text-sm pointer-events-none animate-slide-up"
                style={{ left: `calc(50% + ${heart.x}px)`, opacity: 0 }}
              >
                ❤️
              </span>
            ))}

            <div
              className={`${
                tyranState.stage === 'king' ? 'w-16 h-16' :
                tyranState.stage === 'adult' ? 'w-14 h-14' :
                tyranState.stage === 'teen' ? 'w-12 h-12' :
                tyranState.stage === 'child' ? 'w-10 h-10' : 'w-8 h-8'
              }`}
              dangerouslySetInnerHTML={{ __html: tyranSVG }}
            />
          </div>
        </div>

        {/* ステージ名とメッセージ */}
        <div className="flex items-center gap-2 mb-2">
          {tyranState.isAlive && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
              {stageInfo.name}
            </span>
          )}
          <p className="text-sm text-text-primary flex-1">{message}</p>
          {petCount > 0 && (
            <span className="text-[10px] text-text-secondary">
              なでなで×{petCount}
            </span>
          )}
        </div>

        <div className="space-y-2">

            {/* 成長プログレス */}
            {tyranState.isAlive && tyranState.stage !== 'king' && (
              <div className="mb-2">
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

        {/* 30日間カレンダー */}
        <div className="mt-2 pt-2 border-t border-border">
          {/* ヘッダー + 曜日 + グリッドをコンパクトに */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-text-primary">
              30日間の学習記録
            </span>
            <span className="text-[11px] font-medium text-text-primary">
              {tyranState.totalLearnedDays}/30日
            </span>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-[1px] mb-[1px]">
            {calendarData.dayNames.map((name) => (
              <div key={name} className="text-center text-[8px] font-medium text-text-secondary">
                {name}
              </div>
            ))}
          </div>

          {/* 週グリッド - GitHub風コンパクト */}
          <div className="space-y-[1px]">
            {calendarData.weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-[1px]">
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`h-5 rounded-[2px] flex items-center justify-center transition-all
                      ${day.isFuture
                        ? ''
                        : !day.isInRange
                          ? 'bg-gray-50'
                          : day.hasLearned
                            ? 'bg-emerald-400 shadow-sm'
                            : day.isToday
                              ? 'ring-1 ring-navy/40 bg-blue-50'
                              : 'bg-gray-100'
                      }`}
                    title={day.isInRange ? `${day.dateStr}${day.hasLearned ? ' ✓' : ''}` : ''}
                  >
                    {day.isInRange && (
                      <span className={`text-[8px] leading-none font-medium ${
                        day.hasLearned ? 'text-white' : day.isToday ? 'text-navy' : 'text-gray-400'
                      }`}>
                        {day.dayOfMonth}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* マイルストーン - コンパクトな進捗バー風 */}
          {tyranState.isAlive && (
            <div className="mt-1 flex items-center gap-[2px]">
              {MILESTONES.map((m, i) => {
                const reached = tyranState.totalLearnedDays >= m.days
                const prev = i > 0 ? MILESTONES[i - 1].days : 0
                const segmentWidth = ((m.days - prev) / 30) * 100
                return (
                  <div
                    key={m.days}
                    className="relative flex items-center"
                    style={{ width: `${segmentWidth}%` }}
                  >
                    <div className={`h-1 w-full rounded-full ${reached ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                    <span className="absolute -top-[2px] -right-[6px] text-[10px] leading-none" title={`${m.days}日`}>
                      {m.emoji}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
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
  const remaining = nextStage.days - state.totalLearnedDays

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

  const progress = state.totalLearnedDays - current.min
  const range = current.max - current.min

  return Math.min(100, Math.round((progress / range) * 100))
}
