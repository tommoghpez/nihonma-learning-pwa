import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/common/Button'
import type { QuizQuestion, QuizAnswer } from '@/types'

interface QuizResultProps {
  score: number
  totalQuestions: number
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  onGoToSummary: () => void
  onRetry: () => void
}

export function QuizResultView({
  score,
  totalQuestions,
  questions,
  answers,
  onGoToSummary,
  onRetry,
}: QuizResultProps) {
  const percentage = Math.round((score / totalQuestions) * 100)

  return (
    <div>
      <div className="card text-center mb-6">
        <div className="text-4xl font-bold text-navy mb-2">
          {score}/{totalQuestions}
        </div>
        <p className="text-lg text-text-primary">
          正解率 {percentage}%
        </p>
        <p className="text-sm text-text-secondary mt-1">
          {percentage >= 80 ? 'すばらしい！' : percentage >= 60 ? 'よくできました！' : 'もう一度挑戦しましょう'}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((question, index) => {
          const answer = answers[index]
          const isCorrect = answer?.isCorrect

          return (
            <div key={question.id} className="card">
              <div className="flex items-start gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium text-text-primary">
                  {question.question}
                </p>
              </div>

              <div className="ml-7 space-y-1">
                {!isCorrect && answer && (
                  <p className="text-sm text-error">
                    あなたの回答: {question.options[answer.selectedIndex]}
                  </p>
                )}
                <p className="text-sm text-success">
                  正解: {question.options[question.correct_index]}
                </p>
                {question.explanation && (
                  <p className="text-xs text-text-secondary mt-1">
                    {question.explanation}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onRetry} className="flex-1">
          もう一度
        </Button>
        <Button onClick={onGoToSummary} className="flex-1">
          要約を書く
        </Button>
      </div>
    </div>
  )
}
