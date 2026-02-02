import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useVideoStore } from '@/stores/useVideoStore'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizQuestionView } from '@/components/quiz/QuizQuestion'
import { QuizResultView } from '@/components/quiz/QuizResult'
import { SummaryEditor } from '@/components/summary/SummaryEditor'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'

export function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentVideo, fetchVideoById } = useVideoStore()
  const {
    questions,
    currentIndex,
    currentQuestion,
    answers,
    result,
    phase,
    isLoading,
    loadQuestions,
    submitAnswer,
    goToSummary,
    retryQuiz,
  } = useQuiz(id ?? '')

  useEffect(() => {
    if (id) fetchVideoById(id)
  }, [id])

  useEffect(() => {
    if (currentVideo) loadQuestions(currentVideo)
  }, [currentVideo])

  if (!id) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/videos/${id}`)} className="text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">復習</h1>
          {currentVideo && (
            <p className="text-sm text-text-secondary truncate max-w-[250px]">
              {currentVideo.title}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : phase === 'quiz' && currentQuestion ? (
        <QuizQuestionView
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          onAnswer={submitAnswer}
        />
      ) : phase === 'results' && result ? (
        <QuizResultView
          score={result.score}
          totalQuestions={result.total_questions}
          questions={questions}
          answers={answers}
          onGoToSummary={goToSummary}
          onRetry={retryQuiz}
        />
      ) : phase === 'summary' ? (
        <div>
          <SummaryEditor
            videoId={id}
            onSaved={() => navigate(`/videos/${id}`)}
          />
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full mt-4"
          >
            ダッシュボードに戻る
          </Button>
        </div>
      ) : (
        <div className="text-center py-12 text-text-secondary">
          クイズが見つかりません
        </div>
      )}
    </div>
  )
}
