import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { generateQuizFromVideo } from '@/lib/quizGenerator'
import { useAuthStore } from '@/stores/useAuthStore'
import type { QuizQuestion, QuizAnswer, QuizResult, Video } from '@/types'

type QuizPhase = 'quiz' | 'results' | 'summary'

export function useQuiz(videoId: string) {
  const user = useAuthStore((s) => s.user)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('quiz')
  const [isLoading, setIsLoading] = useState(true)

  const loadQuestions = useCallback(async (video: Video) => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('video_id', videoId)
        .order('order_index')

      if (data && data.length > 0) {
        setQuestions(data.map((q) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        })) as QuizQuestion[])
      } else {
        const generated = generateQuizFromVideo(video)
        setQuestions(generated.map((q, i) => ({
          id: `generated-${i}`,
          video_id: videoId,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation,
          order_index: i,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })))
      }
    } catch {
      // fallback to generated
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  const submitAnswer = useCallback((selectedIndex: number) => {
    const question = questions[currentIndex]
    if (!question) return

    const isCorrect = selectedIndex === question.correct_index
    const answer: QuizAnswer = {
      questionId: question.id,
      selectedIndex,
      isCorrect,
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      finishQuiz(newAnswers)
    }
  }, [currentIndex, questions, answers])

  const finishQuiz = useCallback(async (finalAnswers: QuizAnswer[]) => {
    const score = finalAnswers.filter((a) => a.isCorrect).length
    const quizResult: QuizResult = {
      id: crypto.randomUUID(),
      user_id: user?.id ?? '',
      video_id: videoId,
      score,
      total_questions: questions.length,
      answers: finalAnswers,
      completed_at: new Date().toISOString(),
    }

    setResult(quizResult)
    setPhase('results')

    if (user && navigator.onLine) {
      await supabase.from('quiz_results').upsert({
        user_id: user.id,
        video_id: videoId,
        score,
        total_questions: questions.length,
        answers: finalAnswers,
        completed_at: quizResult.completed_at,
      })
    }
  }, [user, videoId, questions.length])

  const goToSummary = useCallback(() => {
    setPhase('summary')
  }, [])

  const retryQuiz = useCallback(() => {
    setCurrentIndex(0)
    setAnswers([])
    setResult(null)
    setPhase('quiz')
  }, [])

  return {
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    answers,
    result,
    phase,
    isLoading,
    loadQuestions,
    submitAnswer,
    goToSummary,
    retryQuiz,
  }
}
