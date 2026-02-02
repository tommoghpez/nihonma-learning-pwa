import { ProgressBar } from '@/components/common/ProgressBar'
import type { QuizQuestion as QuizQuestionType } from '@/types'

interface QuizQuestionProps {
  question: QuizQuestionType
  currentIndex: number
  totalQuestions: number
  onAnswer: (selectedIndex: number) => void
}

export function QuizQuestionView({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
}: QuizQuestionProps) {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-secondary">
            問題 {currentIndex + 1}/{totalQuestions}
          </span>
        </div>
        <ProgressBar
          value={currentIndex + 1}
          max={totalQuestions}
          color="navy"
        />
      </div>

      <div className="card mb-6">
        <p className="text-base font-medium text-text-primary">{question.question}</p>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            className="w-full text-left p-4 rounded-card border border-border bg-bg-secondary hover:border-navy hover:bg-navy/5 transition-colors"
          >
            <span className="text-sm font-medium text-text-secondary mr-2">
              {String.fromCharCode(65 + index)}.
            </span>
            <span className="text-sm text-text-primary">{option}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
