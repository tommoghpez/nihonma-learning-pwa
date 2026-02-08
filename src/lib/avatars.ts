// 10種類の文房具キャラクター × 10色 = 100通りのアバター

export const AVATAR_CHARACTERS = [
  'pencil',      // えんぴつくん
  'eraser',      // けしごむちゃん
  'ruler',       // ものさしさん
  'scissors',    // はさみん
  'glue',        // のりぼう
  'stapler',     // ホッチキスくん
  'clip',        // クリップちゃん
  'notebook',    // ノートさん
  'pen',         // ペンたろう
  'marker',      // マーカーちゃん
] as const

export const AVATAR_COLORS = [
  { name: 'navy', bg: '#1B365D', accent: '#2B4A7D' },
  { name: 'coral', bg: '#FF6B6B', accent: '#FF8E8E' },
  { name: 'mint', bg: '#4ECDC4', accent: '#7EDDD6' },
  { name: 'lavender', bg: '#9B8AC4', accent: '#B5A8D4' },
  { name: 'peach', bg: '#FFB07C', accent: '#FFC49E' },
  { name: 'sky', bg: '#74B9FF', accent: '#A0CFFF' },
  { name: 'lime', bg: '#A8E6CF', accent: '#C4EDDD' },
  { name: 'pink', bg: '#F8A5C2', accent: '#FAC0D4' },
  { name: 'yellow', bg: '#FDCB6E', accent: '#FDD98A' },
  { name: 'gray', bg: '#636E72', accent: '#808A8E' },
] as const

export type AvatarCharacter = typeof AVATAR_CHARACTERS[number]
export type AvatarColorName = typeof AVATAR_COLORS[number]['name']

export interface AvatarConfig {
  character: AvatarCharacter
  colorName: AvatarColorName
}

// キャラクターごとのSVGパスを生成
function getCharacterPath(character: AvatarCharacter): string {
  switch (character) {
    case 'pencil':
      return `
        <polygon points="20,8 28,8 32,40 16,40" fill="ACCENT"/>
        <polygon points="16,40 32,40 24,52" fill="#FFE4B5"/>
        <rect x="18" y="6" width="12" height="6" rx="1" fill="#FF69B4"/>
        <circle cx="24" cy="24" r="2" fill="#333"/>
        <circle cx="24" cy="30" r="1.5" fill="#333"/>
      `
    case 'eraser':
      return `
        <rect x="10" y="16" width="28" height="20" rx="4" fill="ACCENT"/>
        <rect x="10" y="16" width="28" height="8" rx="2" fill="BG" opacity="0.7"/>
        <circle cx="18" cy="28" r="2" fill="#333"/>
        <circle cx="30" cy="28" r="2" fill="#333"/>
        <path d="M22 32 Q24 35 26 32" stroke="#333" stroke-width="1.5" fill="none"/>
      `
    case 'ruler':
      return `
        <rect x="8" y="12" width="32" height="28" rx="2" fill="ACCENT"/>
        <line x1="12" y1="16" x2="12" y2="36" stroke="BG" stroke-width="1"/>
        <line x1="18" y1="16" x2="18" y2="32" stroke="BG" stroke-width="1"/>
        <line x1="24" y1="16" x2="24" y2="36" stroke="BG" stroke-width="1"/>
        <line x1="30" y1="16" x2="30" y2="32" stroke="BG" stroke-width="1"/>
        <line x1="36" y1="16" x2="36" y2="36" stroke="BG" stroke-width="1"/>
        <circle cx="20" cy="26" r="2" fill="#333"/>
        <circle cx="28" cy="26" r="2" fill="#333"/>
        <path d="M22 32 Q24 34 26 32" stroke="#333" stroke-width="1.5" fill="none"/>
      `
    case 'scissors':
      return `
        <ellipse cx="16" cy="20" rx="8" ry="10" fill="ACCENT"/>
        <ellipse cx="32" cy="20" rx="8" ry="10" fill="ACCENT"/>
        <rect x="20" y="28" width="8" height="16" rx="2" fill="#888"/>
        <circle cx="16" cy="20" r="3" fill="BG"/>
        <circle cx="32" cy="20" r="3" fill="BG"/>
        <circle cx="14" cy="18" r="1.5" fill="#333"/>
        <circle cx="34" cy="18" r="1.5" fill="#333"/>
      `
    case 'glue':
      return `
        <rect x="14" y="20" width="20" height="24" rx="3" fill="ACCENT"/>
        <rect x="18" y="10" width="12" height="12" rx="2" fill="BG"/>
        <circle cx="21" cy="30" r="2" fill="#333"/>
        <circle cx="29" cy="30" r="2" fill="#333"/>
        <ellipse cx="25" cy="38" rx="4" ry="2" fill="#FFF" opacity="0.6"/>
      `
    case 'stapler':
      return `
        <rect x="8" y="24" width="32" height="12" rx="3" fill="ACCENT"/>
        <rect x="10" y="16" width="28" height="10" rx="2" fill="BG"/>
        <circle cx="18" cy="20" r="2" fill="#333"/>
        <circle cx="30" cy="20" r="2" fill="#333"/>
        <rect x="14" y="36" width="20" height="4" rx="1" fill="#666"/>
      `
    case 'clip':
      return `
        <path d="M16 12 L16 36 Q16 44 24 44 Q32 44 32 36 L32 20 Q32 14 26 14 L26 32" stroke="ACCENT" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="18" cy="24" r="2" fill="#333"/>
        <circle cx="28" cy="24" r="2" fill="#333"/>
        <path d="M20 30 Q24 34 28 30" stroke="#333" stroke-width="1.5" fill="none"/>
      `
    case 'notebook':
      return `
        <rect x="10" y="10" width="28" height="34" rx="2" fill="ACCENT"/>
        <rect x="14" y="14" width="20" height="26" fill="BG"/>
        <line x1="14" y1="20" x2="34" y2="20" stroke="#DDD" stroke-width="1"/>
        <line x1="14" y1="26" x2="34" y2="26" stroke="#DDD" stroke-width="1"/>
        <line x1="14" y1="32" x2="34" y2="32" stroke="#DDD" stroke-width="1"/>
        <circle cx="20" cy="24" r="2" fill="#333"/>
        <circle cx="28" cy="24" r="2" fill="#333"/>
        <path d="M22 30 Q24 32 26 30" stroke="#333" stroke-width="1.5" fill="none"/>
      `
    case 'pen':
      return `
        <rect x="18" y="8" width="12" height="30" rx="2" fill="ACCENT"/>
        <polygon points="18,38 30,38 24,50" fill="#888"/>
        <rect x="18" y="8" width="12" height="6" fill="BG"/>
        <circle cx="24" cy="22" r="2" fill="#333"/>
        <circle cx="24" cy="28" r="1.5" fill="#333"/>
        <circle cx="20" y="11" r="1" fill="#FFD700"/>
      `
    case 'marker':
      return `
        <rect x="14" y="12" width="20" height="24" rx="4" fill="ACCENT"/>
        <rect x="18" y="36" width="12" height="8" rx="2" fill="BG"/>
        <rect x="16" y="8" width="16" height="6" rx="2" fill="#666"/>
        <circle cx="20" cy="24" r="2" fill="#333"/>
        <circle cx="28" cy="24" r="2" fill="#333"/>
        <path d="M22 30 Q24 33 26 30" stroke="#333" stroke-width="1.5" fill="none"/>
      `
  }
}

// アバターSVGを生成
export function generateAvatarSVG(character: AvatarCharacter, colorName: AvatarColorName): string {
  const color = AVATAR_COLORS.find(c => c.name === colorName) ?? AVATAR_COLORS[0]
  const path = getCharacterPath(character)
    .replace(/BG/g, color.bg)
    .replace(/ACCENT/g, color.accent)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="24" fill="${color.bg}"/>
    ${path}
  </svg>`
}

// アバターをData URLとして生成
export function getAvatarDataUrl(character: AvatarCharacter, colorName: AvatarColorName): string {
  const svg = generateAvatarSVG(character, colorName)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// アバター文字列からパース (例: "pencil-navy")
export function parseAvatarString(avatarStr: string | null | undefined): AvatarConfig {
  if (!avatarStr) {
    return { character: 'pencil', colorName: 'navy' }
  }
  const [character, colorName] = avatarStr.split('-') as [AvatarCharacter, AvatarColorName]
  return {
    character: AVATAR_CHARACTERS.includes(character) ? character : 'pencil',
    colorName: AVATAR_COLORS.some(c => c.name === colorName) ? colorName : 'navy',
  }
}

// アバター設定を文字列に変換
export function avatarConfigToString(config: AvatarConfig): string {
  return `${config.character}-${config.colorName}`
}

// キャラクター名（日本語）
export const CHARACTER_NAMES: Record<AvatarCharacter, string> = {
  pencil: 'えんぴつくん',
  eraser: 'けしごむちゃん',
  ruler: 'ものさしさん',
  scissors: 'はさみん',
  glue: 'のりぼう',
  stapler: 'ホッチキスくん',
  clip: 'クリップちゃん',
  notebook: 'ノートさん',
  pen: 'ペンたろう',
  marker: 'マーカーちゃん',
}

// 色名（日本語）
export const COLOR_NAMES: Record<AvatarColorName, string> = {
  navy: 'ネイビー',
  coral: 'コーラル',
  mint: 'ミント',
  lavender: 'ラベンダー',
  peach: 'ピーチ',
  sky: 'スカイ',
  lime: 'ライム',
  pink: 'ピンク',
  yellow: 'イエロー',
  gray: 'グレー',
}
