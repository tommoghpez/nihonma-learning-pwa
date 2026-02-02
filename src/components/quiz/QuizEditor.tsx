import { useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/useUIStore'
import type { QuizQuestion } from '@/types'

interface QuizEditorProps {
  videoId: string
  initialQuestions: QuizQuestion[]
  onSaved: () => void
}

interface EditableQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  isNew: boolean
}

export function QuizEditor({ videoId, initialQuestions, onSaved }: QuizEditorProps) {
  const addToast = useUIStore((s) => s.addToast)
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initialQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: [...q.options],
      correct_index: q.correct_index,
      explanation: q.explanation || '',
      isNew: false,
    }))
  )
  const [saving, setSaving] = useState(false)

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
        isNew: true,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: string | number) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(
      questions.map((q, i) => {
        if (i !== qIndex) return q
        const options = [...q.options]
        options[oIndex] = value
        return { ...q, options }
      })
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const q of questions) {
        const data = {
          id: q.isNew ? undefined : q.id,
          video_id: videoId,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation || null,
          order_index: questions.indexOf(q),
        }

        if (q.isNew) {
          await supabase.from('quiz_questions').insert(data)
        } else {
          await supabase.from('quiz_questions').update(data).eq('id', q.id)
        }
      }

      const existingIds = questions.filter((q) => !q.isNew).map((q) => q.id)
      const removedIds = initialQuestions
        .filter((q) => !existingIds.includes(q.id))
        .map((q) => q.id)

      for (const id of removedIds) {
        await supabase.from('quiz_questions').delete().eq('id', id)
      }

      addToast('クイズを保存しました', 'success')
      onSaved()
    } catch {
      addToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => (
        <div key={q.id} className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">
              問題 {qIndex + 1}
            </span>
            <button
              onClick={() => removeQuestion(qIndex)}
              className="text-error hover:text-error/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <Input
            placeholder="問題文を入力"
            value={q.question}
            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
            className="mb-3"
          />

          <div className="space-y-2 mb-3">
            {q.options.map((option, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={q.correct_index === oIndex}
                  onChange={() => updateQuestion(qIndex, 'correct_index', oIndex)}
                  className="text-navy"
                />
                <Input
                  placeholder={`選択肢${String.fromCharCode(65 + oIndex)}`}
                  value={option}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                />
              </div>
            ))}
          </div>

          <Input
            placeholder="解説（任意）"
            value={q.explanation}
            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
          />
        </div>
      ))}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={addQuestion} className="flex-1">
          <Plus className="w-4 h-4 mr-1" /> 問題を追加
        </Button>
        <Button onClick={handleSave} isLoading={saving} className="flex-1">
          <Save className="w-4 h-4 mr-1" /> 保存
        </Button>
      </div>
    </div>
  )
}
