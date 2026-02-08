import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  AVATAR_CHARACTERS,
  AVATAR_COLORS,
  getAvatarDataUrl,
  CHARACTER_NAMES,
  COLOR_NAMES,
  type AvatarCharacter,
  type AvatarColorName,
  type AvatarConfig,
} from '@/lib/avatars'

interface AvatarPickerProps {
  value: AvatarConfig
  onChange: (config: AvatarConfig) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<AvatarCharacter>(value.character)
  const [selectedColor, setSelectedColor] = useState<AvatarColorName>(value.colorName)

  const handleCharacterSelect = (character: AvatarCharacter) => {
    setSelectedCharacter(character)
    onChange({ character, colorName: selectedColor })
  }

  const handleColorSelect = (colorName: AvatarColorName) => {
    setSelectedColor(colorName)
    onChange({ character: selectedCharacter, colorName })
  }

  return (
    <div className="space-y-6">
      {/* プレビュー */}
      <div className="flex flex-col items-center gap-2">
        <img
          src={getAvatarDataUrl(selectedCharacter, selectedColor)}
          alt="選択中のアバター"
          className="w-24 h-24 rounded-full shadow-lg"
        />
        <p className="text-sm text-text-secondary">
          {CHARACTER_NAMES[selectedCharacter]}（{COLOR_NAMES[selectedColor]}）
        </p>
      </div>

      {/* キャラクター選択 */}
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-3">キャラクターを選ぶ</h4>
        <div className="grid grid-cols-5 gap-2">
          {AVATAR_CHARACTERS.map((character) => (
            <button
              key={character}
              onClick={() => handleCharacterSelect(character)}
              className={`relative p-1 rounded-lg transition-all ${
                selectedCharacter === character
                  ? 'bg-navy/10 ring-2 ring-navy'
                  : 'hover:bg-gray-100'
              }`}
            >
              <img
                src={getAvatarDataUrl(character, selectedColor)}
                alt={CHARACTER_NAMES[character]}
                className="w-12 h-12 mx-auto"
              />
              {selectedCharacter === character && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-navy rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* カラー選択 */}
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-3">色を選ぶ</h4>
        <div className="grid grid-cols-5 gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorSelect(color.name)}
              className={`relative w-12 h-12 rounded-full transition-all ${
                selectedColor === color.name
                  ? 'ring-2 ring-offset-2 ring-navy scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color.bg }}
              title={COLOR_NAMES[color.name]}
            >
              {selectedColor === color.name && (
                <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
