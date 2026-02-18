// ティラン（ティラノサウルス）の成長システム
// 連続学習日数に応じて成長し、5日間見ないと死んでしまう

export interface TyranState {
  stage: TyranStage
  mood: TyranMood
  streakDays: number
  totalLearnedDays: number // 現生涯の累計学習日数（死亡でリセット）
  longestStreak: number
  lastLearnedAt: string | null
  daysSinceLastLearned: number
  isAlive: boolean
}

export type TyranStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'king'
export type TyranMood = 'ecstatic' | 'happy' | 'normal' | 'worried' | 'sad' | 'dying'

// 成長ステージの定義（累計学習日数ベース、死亡でリセット）
export const TYRAN_STAGES: Record<TyranStage, { minDays: number; name: string; description: string }> = {
  egg: { minDays: 0, name: 'たまご', description: '学習を始めよう！' },
  baby: { minDays: 1, name: 'ベビーティラン', description: '生まれたて！' },
  child: { minDays: 3, name: 'こどもティラン', description: '元気いっぱい！' },
  teen: { minDays: 7, name: '少年ティラン', description: 'すくすく成長中！' },
  adult: { minDays: 14, name: 'おとなティラン', description: '立派に成長！' },
  king: { minDays: 30, name: 'キングティラン', description: '最強の王者！' },
}

// 機嫌の定義（最終学習からの経過日数）- 3日=worried(心配)、4日=sad(悲しい)
export const TYRAN_MOODS: Record<TyranMood, { maxDays: number; message: string }> = {
  ecstatic: { maxDays: 0, message: '今日も学習したね！最高！✨' },
  happy: { maxDays: 1, message: 'いい調子だよ！♪' },
  normal: { maxDays: 2, message: '今日も学習しよう！' },
  worried: { maxDays: 3, message: 'ちょっと心配...学習して？' },
  sad: { maxDays: 4, message: '悲しいな...会いたいよ...' },
  dying: { maxDays: 5, message: '...もうダメかも...' },
}

// ステージを計算（累計学習日数ベース）
export function calculateStage(totalLearnedDays: number): TyranStage {
  if (totalLearnedDays >= 30) return 'king'
  if (totalLearnedDays >= 14) return 'adult'
  if (totalLearnedDays >= 7) return 'teen'
  if (totalLearnedDays >= 3) return 'child'
  if (totalLearnedDays >= 1) return 'baby'
  return 'egg'
}

// 機嫌を計算
export function calculateMood(daysSinceLastLearned: number): TyranMood {
  if (daysSinceLastLearned <= 0) return 'ecstatic'
  if (daysSinceLastLearned <= 1) return 'happy'
  if (daysSinceLastLearned <= 2) return 'normal'
  if (daysSinceLastLearned <= 3) return 'worried'
  if (daysSinceLastLearned <= 4) return 'sad'
  return 'dying'
}

// ティランの状態を計算
export function calculateTyranState(
  progressDates: string[],
  today: Date = new Date()
): TyranState {
  const todayStr = today.toISOString().split('T')[0]
  const uniqueDates = [...new Set(progressDates.map(d => d.split('T')[0]))].sort()

  if (uniqueDates.length === 0) {
    return {
      stage: 'egg',
      mood: 'normal',
      streakDays: 0,
      totalLearnedDays: 0,
      longestStreak: 0,
      lastLearnedAt: null,
      daysSinceLastLearned: 999,
      isAlive: true,
    }
  }

  const lastLearnedAt = uniqueDates[uniqueDates.length - 1]
  const lastLearnedDate = new Date(lastLearnedAt)
  const daysSinceLastLearned = Math.floor(
    (today.getTime() - lastLearnedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isAlive = daysSinceLastLearned < 5

  let streakDays = 0
  let checkDate = new Date(today)

  if (!uniqueDates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0]
    if (uniqueDates.includes(checkStr)) {
      streakDays++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  if (!isAlive) {
    streakDays = 0
  }

  // 現生涯の累計学習日数を算出（最後の5日以上の空白=死亡境界以降のみカウント）
  let lastDeathIndex = -1
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const d1 = new Date(uniqueDates[i])
    const d2 = new Date(uniqueDates[i + 1])
    const gapDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
    if (gapDays >= 5) {
      lastDeathIndex = i
    }
  }
  const currentLifeDates = lastDeathIndex >= 0
    ? uniqueDates.slice(lastDeathIndex + 1)
    : uniqueDates
  const totalLearnedDays = isAlive ? currentLifeDates.length : 0

  let longestStreak = 0
  let currentStreak = 0
  let prevDate: Date | null = null

  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr)
    if (prevDate) {
      const diffDays = Math.floor(
        (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays === 1) {
        currentStreak++
      } else {
        longestStreak = Math.max(longestStreak, currentStreak)
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }
    prevDate = date
  }
  longestStreak = Math.max(longestStreak, currentStreak)

  const stage = isAlive ? calculateStage(totalLearnedDays) : 'egg'
  const mood = isAlive ? calculateMood(daysSinceLastLearned) : 'normal'

  return {
    stage,
    mood,
    streakDays,
    totalLearnedDays,
    longestStreak,
    lastLearnedAt,
    daysSinceLastLearned,
    isAlive,
  }
}

// ドット絵を描画
function drawPixels(pixels: string[], colors: Record<string, string>, offsetX = 0, offsetY = 0): string {
  let svg = ''
  pixels.forEach((row, y) => {
    row.split('').forEach((char, x) => {
      if (char !== ' ' && colors[char]) {
        svg += `<rect x="${offsetX + x}" y="${offsetY + y}" width="1" height="1" fill="${colors[char]}"/>`
      }
    })
  })
  return svg
}

// ティランのSVGを生成（向きを含む）
export function getTyranSVG(
  stage: TyranStage,
  mood: TyranMood,
  isAlive: boolean,
  frame: number = 0,
  facingRight: boolean = true
): string {
  // 基本色
  const baseColors: Record<string, string> = {
    // 体
    D: '#1B5E20', // 濃い緑（輪郭）
    G: '#2E7D32', // 緑（メイン）
    g: '#4CAF50', // 明るい緑
    L: '#81C784', // ライト緑（ハイライト）
    // お腹
    C: '#FFF9C4', // クリーム
    c: '#FFF59D', // 明るいクリーム
    // 顔
    E: '#212121', // 黒（目）
    W: '#FFFFFF', // 白
    P: '#FF8A80', // ほっぺ
    M: '#D32F2F', // 赤（口）
    // 足
    T: '#5D4037', // 茶色
    t: '#795548', // 明るい茶色
    // 翼
    V: '#1B5E20', // 翼輪郭
    v: '#2E7D32', // 翼メイン
    u: '#4CAF50', // 翼ハイライト
    // 王冠
    Y: '#FFC107', // 黄色
    y: '#FFD54F', // 明るい黄色
    // 炎
    F: '#FF5722', // 赤
    f: '#FF9800', // オレンジ
    O: '#FFEB3B', // 黄色
    // 卵
    S: '#EFEBE9', // 殻
    s: '#D7CCC8', // 殻（影）
    // エフェクト
    B: '#64B5F6', // 涙・汗
    K: '#FFD700', // キラキラ
    X: '#757575', // X目
  }

  // 機嫌による色変化
  let colors = { ...baseColors }
  switch (mood) {
    case 'ecstatic':
      colors.P = '#FF5252' // ほっぺ真っ赤
      break
    case 'happy':
      colors.P = '#FF8A80'
      break
    case 'normal':
      colors.P = 'transparent'
      break
    case 'worried':
      colors.P = 'transparent'
      colors.G = '#558B2F'
      colors.g = '#7CB342'
      break
    case 'sad':
      colors.P = 'transparent'
      colors.G = '#689F38'
      colors.g = '#8BC34A'
      break
    case 'dying':
      colors.P = 'transparent'
      colors.G = '#9E9E9E'
      colors.g = '#BDBDBD'
      colors.D = '#757575'
      colors.L = '#E0E0E0'
      // 翼もグレーに
      colors.V = '#757575'
      colors.v = '#9E9E9E'
      colors.u = '#BDBDBD'
      break
  }

  let pixels: string[] = []
  let width = 24
  let height = 24

  if (!isAlive) {
    // 死亡状態
    pixels = [
      '                        ',
      '        WWWWWW          ',
      '       W      W         ',
      '      W        W        ',
      '       W      W         ',
      '        WWWWWW          ',
      '                        ',
      '       ssssssss         ',
      '      sSSSSSSSSs        ',
      '     sSSSSSSSSSSSs      ',
      '    sSSSSSSSSSSSSss     ',
      '    SSSSSSSSSSSSSS      ',
      '    sSSSSSSSSSSSSSs     ',
      '     ssSSSSSSSSSss      ',
      '        ssssssss        ',
      '                        ',
    ]
    width = 24
    height = 16
  } else {
    switch (stage) {
      case 'egg': {
        const wobble = frame % 4 < 2
        pixels = wobble ? [
          '                        ',
          '       ssssssss         ',
          '     ssSSSSSSSSSs       ',
          '    sSSSSSSSSSSSSs      ',
          '   sSSSSSSSSSSSSSSs     ',
          '   SSSS  WEW WEW SS     ',
          '   SSS   WEW WEW  S     ',
          '   SSSS          SS     ',
          '   sSSSSSSSSSSSSSSs     ',
          '    sSSSSSSSSSSSSs      ',
          '     ssSSSSSSSSSs       ',
          '       ssssssss         ',
          '                        ',
        ] : [
          '                        ',
          '        ssssssss        ',
          '      ssSSSSSSSSSs      ',
          '     sSSSSSSSSSSSSs     ',
          '    sSSSSSSSSSSSSSSs    ',
          '    SSSS  WEW WEW SS    ',
          '    SSS   WEW WEW  S    ',
          '    SSSS          SS    ',
          '    sSSSSSSSSSSSSSSs    ',
          '     sSSSSSSSSSSSSs     ',
          '      ssSSSSSSSSSs      ',
          '        ssssssss        ',
          '                        ',
        ]
        width = 24
        height = 13
        break
      }

      case 'baby': {
        // ベビー - 丸くてかわいい、縦長
        const bounce = frame % 2 === 0
        const eyeChar = mood === 'dying' ? 'X' : 'E'
        const cheek = mood === 'ecstatic' || mood === 'happy' ? 'P' : ' '
        const tear = mood === 'sad' ? 'B' : ' '
        const sweat = mood === 'worried' ? 'B' : ' '
        const sparkle = mood === 'ecstatic' ? 'K' : ' '

        pixels = bounce ? [
          `       ${sparkle}                `,
          '        DDDDD           ',
          '       DGGGGGD          ',
          '      DGgLLLgGD         ',
          `     DGg W${eyeChar}W W${eyeChar}W gD       `,
          `     DGg${cheek}      ${cheek}gD  ${sweat}    `,
          `    ${tear}DGgMMMMMgGD${tear}        `,
          '       DDDGGGDD         ',
          '        DcCCcD          ',
          '       DcCCCCcD         ',
          '      DcCCCCCCcD        ',
          '       DcCCCCcD         ',
          '        DcCCcD          ',
          '       Dt    tD         ',
          '      TTT    TTT        ',
          '                        ',
        ] : [
          `       ${sparkle}                `,
          '        DDDDD           ',
          '       DGGGGGD          ',
          '      DGgLLLgGD         ',
          `     DGg W${eyeChar}W W${eyeChar}W gD       `,
          `     DGg${cheek}      ${cheek}gD  ${sweat}    `,
          `    ${tear}DGgMMMMMgGD${tear}        `,
          '       DDDGGGDD         ',
          '        DcCCcD          ',
          '       DcCCCCcD         ',
          '      DcCCCCCCcD        ',
          '       DcCCCCcD         ',
          '        DcCCcD          ',
          '      Dt      tD        ',
          '     TTT      TTT       ',
          '                        ',
        ]
        width = 24
        height = 16
        break
      }

      case 'child': {
        // こども - トゲトゲが出始める
        const bounce = frame % 2 === 0
        const eyeChar = mood === 'dying' ? 'X' : 'E'
        const cheek = mood === 'ecstatic' || mood === 'happy' ? 'P' : ' '
        const tear = mood === 'sad' ? 'B' : ' '
        const sweat = mood === 'worried' ? 'B' : ' '
        const sparkle = mood === 'ecstatic' ? 'K' : ' '

        pixels = bounce ? [
          `     ${sparkle}                     `,
          '          D D D           ',
          '        DDDDDDDDD         ',
          '       DGGGGGGGggD        ',
          '      DGgLLLLLGggGD       ',
          `     DGg  W${eyeChar}W W${eyeChar}W gD  ${sweat}    `,
          `     DGg ${cheek}      ${cheek}gD       `,
          `   ${tear} DGgWMMMMMWgD ${tear}        `,
          '       DDDGGGGGDDD        ',
          '         DcCCCCDDD        ',
          '        DcCCCCCCDDD       ',
          '       DcCCCCCCCCDD       ',
          '        DcCCCCCCDD        ',
          '         DcCCCCDD         ',
          '        Dt      tD        ',
          '       TTT      TTT       ',
          '                          ',
        ] : [
          `     ${sparkle}                     `,
          '          D D D           ',
          '        DDDDDDDDD         ',
          '       DGGGGGGGggD        ',
          '      DGgLLLLLGggGD       ',
          `     DGg  W${eyeChar}W W${eyeChar}W gD  ${sweat}    `,
          `     DGg ${cheek}      ${cheek}gD       `,
          `   ${tear} DGgWMMMMMWgD ${tear}        `,
          '       DDDGGGGGDDD        ',
          '         DcCCCCDDD        ',
          '        DcCCCCCCDDD       ',
          '       DcCCCCCCCCDD       ',
          '        DcCCCCCCDD        ',
          '         DcCCCCDD         ',
          '       Dt        tD       ',
          '      TTT        TTT      ',
          '                          ',
        ]
        width = 26
        height = 17
        break
      }

      case 'teen': {
        // 少年 - しっぽが見える
        const walk = frame % 2 === 0
        const eyeChar = mood === 'dying' ? 'X' : 'E'
        const cheek = mood === 'ecstatic' || mood === 'happy' ? 'P' : ' '
        const tear = mood === 'sad' ? 'B' : ' '
        const sweat = mood === 'worried' ? 'B' : ' '
        const sparkle = mood === 'ecstatic' ? 'K' : ' '

        pixels = walk ? [
          `    ${sparkle}                             `,
          '           D   D   D            ',
          '         DDDDDDDDDDDDD          ',
          '        DGGGGGGGGGGggD          ',
          '       DGgLLLLLLLGggGDD         ',
          `      DGg  W${eyeChar}W W${eyeChar}W  gGGD  ${sweat}     `,
          `      DGg ${cheek}       ${cheek}gGGD        `,
          `    ${tear} DGgWMMMMMMWgGGGD ${tear}        `,
          '        DDDGGGGGGGGGDDD         ',
          '          DcCCCCCGGGDDD         ',
          '         DcCCCCCCGGGGDD         ',
          '        DcCCCCCCCCGGGGD         ',
          '         DcCCCCCCGGGGD          ',
          '          DcCCCCGGGD  DDDDD     ',
          '         Dt        tDDDDDDDD    ',
          '        TTT        TTT          ',
          '                                ',
        ] : [
          `    ${sparkle}                             `,
          '           D   D   D            ',
          '         DDDDDDDDDDDDD          ',
          '        DGGGGGGGGGGggD          ',
          '       DGgLLLLLLLGggGDD         ',
          `      DGg  W${eyeChar}W W${eyeChar}W  gGGD  ${sweat}     `,
          `      DGg ${cheek}       ${cheek}gGGD        `,
          `    ${tear} DGgWMMMMMMWgGGGD ${tear}        `,
          '        DDDGGGGGGGGGDDD         ',
          '          DcCCCCCGGGDDD         ',
          '         DcCCCCCCGGGGDD         ',
          '        DcCCCCCCCCGGGGD         ',
          '         DcCCCCCCGGGGD          ',
          '          DcCCCCGGGD  DDDDD     ',
          '        Dt          tDDDDDDDD   ',
          '       TTT          TTT         ',
          '                                ',
        ]
        width = 32
        height = 17
        break
      }

      case 'adult': {
        // おとな - 両翼付き、右向き
        const wingUp = frame % 2 === 0
        const eyeChar = mood === 'dying' ? 'X' : 'E'
        const cheek = mood === 'ecstatic' || mood === 'happy' ? 'P' : ' '
        const tear = mood === 'sad' ? 'B' : ' '
        const sweat = mood === 'worried' ? 'B' : ' '
        const sparkle = mood === 'ecstatic' ? 'K' : ' '

        if (wingUp) {
          pixels = [
            `         ${sparkle}                           `,
            '              vV                    ',
            '        D   D VvvV D   D            ',
            '      DDDDDDDDVvuvvVDDDDD           ',
            '     DGGGGGGGGVvuvVGGGggD           ',
            '    DGgLLLLLLLLVvvVLGggGGD          ',
            `   DGg  W${eyeChar}W W${eyeChar}W  VVgGGGDD ${sweat}       `,
            `   DGg ${cheek}          ${cheek}gGGGDD         `,
            `  ${tear}DGgWMMMMMMMWgGGGGD${tear}           `,
            '    DDDGGGGGGGGGGGDDD              ',
            '      DcCCCCCGGGGDDDD              ',
            '     DcCCCCCCGGGGGDDD              ',
            '    DcCCCCCCCCGGGGGDD              ',
            '     DcCCCCCCGGGGGDD  DDD          ',
            '      DcCCCCGGGGDD DDDDDDD         ',
            '     Dt        tDDDDDDDDDD         ',
            '    TTT        TTT                 ',
            '                                   ',
          ]
        } else {
          pixels = [
            `         ${sparkle}                           `,
            '             VvV                    ',
            '        D   DVvvvV  D   D           ',
            '      DDDDDDDVvuvVDDDDDDD           ',
            '     DGGGGGGGGVvvVGGGGggD           ',
            '    DGgLLLLLLLLVvVLGggGGD           ',
            `   DGg  W${eyeChar}W W${eyeChar}W  VVgGGGDD ${sweat}       `,
            `   DGg ${cheek}          ${cheek}gGGGDD         `,
            `  ${tear}DGgWMMMMMMMWgGGGGD${tear}           `,
            '    DDDGGGGGGGGGGGDDD              ',
            '      DcCCCCCGGGGDDDD              ',
            '     DcCCCCCCGGGGGDDD              ',
            '    DcCCCCCCCCGGGGGDD              ',
            '     DcCCCCCCGGGGGDD  DDD          ',
            '      DcCCCCGGGGDD DDDDDDD         ',
            '    Dt          tDDDDDDDDD         ',
            '   TTT          TTT                ',
            '                                   ',
          ]
        }
        width = 36
        height = 18
        break
      }

      case 'king': {
        // キング - 王冠、両翼、右向き口から炎
        const wingUp = frame % 2 === 0
        const eyeChar = mood === 'dying' ? 'X' : 'E'
        const cheek = mood === 'ecstatic' || mood === 'happy' ? 'P' : ' '
        const tear = mood === 'sad' ? 'B' : ' '
        const sweat = mood === 'worried' ? 'B' : ' '
        const sparkle = mood === 'ecstatic' ? 'K' : ' '
        // 炎（dying以外）
        const flame1 = mood !== 'dying' ? 'f' : ' '
        const flame2 = mood !== 'dying' ? 'F' : ' '
        const flame3 = mood !== 'dying' ? 'O' : ' '

        if (wingUp) {
          pixels = [
            `           ${sparkle}                                   `,
            '                   vV                       ',
            '              Y   YVvvV   Y   Y             ',
            '              yYyYyVvuvvVyYyYy              ',
            '               yyyyVvuvVyyyyy               ',
            '             DDDDDDVvvVDDDDDDD              ',
            '            DGGGGGGVVGGGGGggD               ',
            '           DGgLLLLLLLLLGggGGD               ',
            `          DGg  W${eyeChar}W W${eyeChar}W  gGGGDD${flame1}${flame2}${flame3} ${sweat}    `,
            `          DGg ${cheek}        ${cheek}gGGGDD${flame2}${flame3}${flame1}      `,
            `        ${tear} DGgWMMMMMMMWgGGGGD${flame3}${flame1}${flame2} ${tear}      `,
            '            DDDGGGGGGGGGGGDDD               ',
            '              DcCCCCCGGGGDDDD               ',
            '             DcCCCCCCGGGGGDDD               ',
            '            DcCCCCCCCCGGGGGDD               ',
            '             DcCCCCCCGGGGGDD  DDD           ',
            '              DcCCCCGGGGDD DDDDDDD          ',
            '             Dt        tDDDDDDDDDD          ',
            '            TTT        TTT                  ',
            '                                            ',
          ]
        } else {
          pixels = [
            `           ${sparkle}                                   `,
            '                  VvV                       ',
            '              Y   VvvvV  Y   Y              ',
            '              yYyYVvuvVyYyYyYy              ',
            '               yyyVvvVyyyyyyy               ',
            '             DDDDDDVvVDDDDDDDD              ',
            '            DGGGGGGGVGGGGGGD                ',
            '           DGgLLLLLLLLLGggGGD               ',
            `          DGg  W${eyeChar}W W${eyeChar}W  gGGGDD${flame3}${flame1}${flame2} ${sweat}    `,
            `          DGg ${cheek}        ${cheek}gGGGDD${flame1}${flame2}${flame3}      `,
            `        ${tear} DGgWMMMMMMMWgGGGGD${flame2}${flame3}${flame1} ${tear}      `,
            '            DDDGGGGGGGGGGGDDD               ',
            '              DcCCCCCGGGGDDDD               ',
            '             DcCCCCCCGGGGGDDD               ',
            '            DcCCCCCCCCGGGGGDD               ',
            '             DcCCCCCCGGGGGDD  DDD           ',
            '              DcCCCCGGGGDD DDDDDDD          ',
            '            Dt          tDDDDDDDDD          ',
            '           TTT          TTT                 ',
            '                                            ',
          ]
        }
        width = 44
        height = 20
        break
      }
    }
  }

  const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${drawPixels(pixels, colors, 0, 0)}</svg>`

  // 左向きの場合は反転
  if (!facingRight && isAlive && stage !== 'egg') {
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><g transform="scale(-1,1) translate(-${width},0)">${drawPixels(pixels, colors, 0, 0)}</g></svg>`
  }

  return svg
}

// 機嫌エフェクトは廃止（体の表現に統合済み）
export function getMoodEffectSVG(_mood: TyranMood, _frame: number): string {
  return '' // 機嫌は体の表現で示すため、頭上エフェクトは廃止
}

// ティランのメッセージを取得
export function getTyranMessage(state: TyranState): string {
  if (!state.isAlive) {
    return 'ティランは眠りについてしまいました...でも大丈夫！また学習すれば新しいティランが生まれるよ！'
  }

  const stageInfo = TYRAN_STAGES[state.stage]
  const moodInfo = TYRAN_MOODS[state.mood]

  if (state.totalLearnedDays === 0) {
    return '今日から学習を始めて、ティランを育てよう！'
  }

  if (state.mood === 'ecstatic') {
    return `${state.totalLearnedDays}日学習達成！${stageInfo.name}は大喜び！🎉`
  }

  return `${moodInfo.message}（累計${state.totalLearnedDays}日）`
}
