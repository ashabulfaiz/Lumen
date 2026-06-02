import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { levelNumberBySlug, loadLearningProgress } from '../data/learningData.js'
import api from '../lib/axiosInstance'

export default function LessonPage() {
  const navigate = useNavigate()
  const { level, lessonId } = useParams()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [isFinished, setIsFinished] = useState(false)

  const [quizData, setQuizData] = useState([])
  const [quizId, setQuizId] = useState(null)
  const [judulKuis, setJudulKuis] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitResult, setSubmitResult] = useState(null)
  const [savedAnswers, setSavedAnswers] = useState(null)
  const [isFinishedMode, setIsFinishedMode] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [passThreshold, setPassThreshold] = useState(70)
  const [quizPassed, setQuizPassed] = useState(false)
  // Ordered lesson ids for this level (from the DB), used to find the real next module.
  const [levelLessonIds, setLevelLessonIds] = useState([])

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true)
      try {
        const lessonRes = await api.get(`/learning/lesson/${lessonId}`)
        const lessonMeta = lessonRes.data.data
        const topik = lessonMeta?.kuis_topik_id || 'Article Or No Article'
        const formattedLevel = (lessonMeta?.nama_level || level).charAt(0).toUpperCase()
          + (lessonMeta?.nama_level || level).slice(1).toLowerCase()

        const response = await api.post('/quiz/generate', {
          level_name: formattedLevel,
          lesson_id: parseInt(lessonId, 10),
          kategori_topik: topik,
        })

        const data = response.data.data
        setQuizId(data.quiz_id)
        setQuizData(data.soal)
        setJudulKuis(data.judul_kuis)
        if (data.pass_threshold != null) setPassThreshold(data.pass_threshold)

        try {
          const reviewRes = await api.get(`/quiz/review/${data.quiz_id}`)
          if (reviewRes.data.data && reviewRes.data.data.length > 0) {
            setSavedAnswers(reviewRes.data.data)
            setIsFinishedMode(true)
          }
        } catch (err) {
          console.error('Failed to load the quiz review:', err)
        }
      } catch (error) {
        console.error('Failed to fetch the quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
    setCurrentIndex(0)
    setSelectedOptions({})
    setIsFinished(false)
    setSubmitResult(null)
    setJudulKuis('')
    setSavedAnswers(null)
    setIsFinishedMode(false)
    setModuleComplete(false)
    setQuizPassed(false)
  }, [level, lessonId])

  useEffect(() => {
    if (!level || !lessonId) return

    api.get(`/progress/module-status/${level}`)
      .then((res) => {
        const rows = res.data.data || []
        const row = rows.find((s) => String(s.lesson_id) === String(lessonId))
        setModuleComplete(Boolean(row?.module_completed))
        setLevelLessonIds(rows.map((r) => r.lesson_id))
      })
      .catch(() => {
        setModuleComplete(false)
        setLevelLessonIds([])
      })
  }, [level, lessonId, isFinished])

  const steps = useMemo(() => {
    if (quizData.length === 0) return []

    const dynamicSteps = quizData.map((q) => ({
      id: q.question_id,
      type: 'question',
      prompt: q.pertanyaan,
      options: q.pilihan,
    }))

    return [
      {
        id: 'intro',
        type: 'info',
        title: judulKuis || `${level.charAt(0).toUpperCase() + level.slice(1)} — Lesson ${lessonId}`,
        content:
          "Welcome to the final quiz for this unit! This quiz is designed to test your understanding of the concepts you've learned. Each question will provide new insights, so be sure to read carefully and answer to the best of your ability. Don't worry about the results—what matters most is the process of learning and understanding the material. Good luck!",
      },
      ...dynamicSteps,
    ]
  }, [quizData, level, lessonId, judulKuis])

  const step = steps[currentIndex]
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0
  const selectedOption = step ? selectedOptions[step.id] : null

  const isFirstStep = currentIndex === 0
  // Next module is derived from the real DB lesson order for this level, so it can
  // never resolve back to the current lesson or to a non-existent id.
  const nextLessonId = useMemo(() => {
    if (!Array.isArray(levelLessonIds) || levelLessonIds.length === 0) return null
    const idx = levelLessonIds.findIndex((id) => String(id) === String(lessonId))
    if (idx < 0 || idx + 1 >= levelLessonIds.length) return null
    return levelLessonIds[idx + 1]
  }, [levelLessonIds, lessonId])

  const isLastStep = currentIndex === totalSteps - 1
  const nextLabel = isLastStep ? 'Submit & Finish' : 'Next'

  const canProceed = useMemo(() => {
    if (!step) return false
    if (step.type === 'info') return true
    return selectedOption != null
  }, [step, selectedOption])

  const handleSelect = (option) => {
    if (step.type !== 'question') return
    setSelectedOptions((prev) => ({ ...prev, [step.id]: option }))
  }

  const handleNext = async () => {
    if (!canProceed) return

    if (isLastStep) {
      const user_answers = Object.entries(selectedOptions).map(([qId, ans]) => ({
        question_id: parseInt(qId, 10),
        jawaban: ans,
      }))

      try {
        const res = await api.post('/quiz/submit', {
          quiz_id: quizId,
          user_answers,
        })

        const payload = res.data.data
        setSubmitResult({
          skor_akhir: payload.final_score,
          jawaban_benar: payload.correct_answers,
          total_soal: payload.total_questions,
        })
        if (payload.pass_threshold != null) setPassThreshold(payload.pass_threshold)
        setQuizPassed(Boolean(payload.passed))
        setIsFinished(true)
      } catch (error) {
        console.error('Failed to submit to database:', error)
        alert('Failed to submit answers. Please try again.')
      }
      return
    }
    setCurrentIndex((prev) => prev + 1)
  }

  const handlePrev = () => {
    if (currentIndex === 0) {
      navigate(`/learning/${level}`)
      return
    }
    setCurrentIndex((prev) => prev - 1)
  }

  const handleRetake = () => {
    setIsFinishedMode(false)
    setIsFinished(false)
    setSavedAnswers(null)
    setCurrentIndex(0)
    setSelectedOptions({})
    setSubmitResult(null)
  }

  const reviewScoreInfo = useMemo(() => {
    if (!savedAnswers || savedAnswers.length === 0) return null
    const correctCount = savedAnswers.filter((a) => a.is_correct).length
    const total = savedAnswers.length
    const score = Math.round((correctCount / total) * 100)
    return { correctCount, total, score }
  }, [savedAnswers])

  // Block lessons in levels the learner hasn't unlocked via placement.
  const access = loadLearningProgress()
  const levelNum = levelNumberBySlug[level]
  if (!access.placementCompleted) return <Navigate to="/learning/placement" replace />
  if (levelNum && levelNum > access.highestUnlocked) return <Navigate to="/learning/levels" replace />

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 font-sans">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-indigo-50 bg-gradient-to-b from-white to-indigo-50/50 p-12 text-center shadow-sm">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60 duration-1000" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Preparing your lesson...</h2>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-slate-500">
            We are crafting the best learning materials for you. Hang tight, this will only take a moment!
          </p>
        </div>
      </div>
    )
  }

  if (isFinishedMode && savedAnswers) {
    const info = reviewScoreInfo || { correctCount: 0, total: 0, score: 0 }
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6 font-sans">
        <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center md:p-8">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Review Your Answers</h1>
            <p className="mt-2 text-[16px] text-slate-600">
              You got <span className="font-bold text-slate-900">{info.correctCount}</span> out of{' '}
              <span className="font-bold text-slate-900">{info.total}</span> questions correct (Score:{' '}
              <span className="font-bold text-indigo-600">{info.score}</span>)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate(`/learning/${level}`)}
            >
              Back to course
            </button>
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
              onClick={handleRetake}
            >
              Retake Quiz
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {quizData.map((q, i) => {
            const answerDetail = savedAnswers.find((a) => a.question_id === q.question_id)
            const userAns = answerDetail ? answerDetail.jawaban_teks : null
            const isCorrect = answerDetail ? !!answerDetail.is_correct : false
            const correctAnswer = answerDetail ? answerDetail.jawaban_benar : null

            return (
              <div
                key={q.question_id}
                className={`rounded-2xl border-2 bg-white p-5 sm:p-6 ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[17px] font-bold text-slate-900">Question {i + 1}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="mb-5 text-[15px] text-slate-700">{q.pertanyaan}</p>
                <div className="space-y-3">
                  {q.pilihan.map((opt) => {
                    const isSelected = userAns === opt
                    const isRightAnswer = correctAnswer === opt
                    let borderClass = 'border border-slate-200'
                    let textClass = 'text-slate-700'
                    if (isRightAnswer) {
                      borderClass = 'border-2 border-emerald-500 bg-white'
                      textClass = 'text-emerald-800 font-medium'
                    } else if (isSelected && !isRightAnswer) {
                      borderClass = 'border-2 border-red-500 bg-white'
                      textClass = 'text-slate-900'
                    }
                    return (
                      <div
                        key={opt}
                        className={`flex min-h-[52px] items-center justify-between gap-4 rounded-xl px-4 py-3 ${borderClass}`}
                      >
                        <span className={`text-[15px] ${textClass}`}>{opt}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 text-center">
          <button
            type="button"
            className="rounded-xl border-2 border-slate-200 bg-white px-8 py-3 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => navigate(`/learning/${level}`)}
          >
            Done Reviewing
          </button>
        </div>
      </div>
    )
  }

  if (isFinished && submitResult) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-[30px] font-bold tracking-tight text-slate-900">Quiz complete!</h1>
          {!quizPassed ? (
            <p className="mt-2 text-amber-700">
              Your score is below the {passThreshold}% passing score, so this quiz isn&apos;t passed yet. Retake it to
              complete the module.
            </p>
          ) : moduleComplete ? (
            <p className="mt-2 text-emerald-700">Quiz and writing are complete. The next module is unlocked.</p>
          ) : (
            <p className="mt-2 text-slate-600">
              Quiz passed! Now complete the writing practice (grammar ≥ 60%) to finish this module.
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{judulKuis}</p>
            <p className={`mt-1 text-5xl font-bold ${quizPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {submitResult.skor_akhir}
            </p>
            <span
              className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                quizPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {quizPassed ? `Passed (≥ ${passThreshold}%)` : `Not passed (need ${passThreshold}%)`}
            </span>
            <p className="mt-3 text-sm text-slate-600">
              Correct Answers: <span className="font-bold">{submitResult.jawaban_benar}</span> out of{' '}
              {submitResult.total_soal} questions
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate(`/learning/${level}`)}
            >
              Back to {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>

            <Link
              to={`/learning/${level}/lesson/${lessonId}/writing`}
              className="rounded-xl border-2 border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Writing practice
            </Link>

            <button
              type="button"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-indigo-600 bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
              onClick={async () => {
                try {
                  const reviewRes = await api.get(`/quiz/review/${quizId}`)
                  if (reviewRes.data.data && reviewRes.data.data.length > 0) {
                    setSavedAnswers(reviewRes.data.data)
                    setIsFinishedMode(true)
                  }
                } catch (err) {
                  console.error('Failed to fetch the quiz review:', err)
                }
              }}
            >
              Review Your Answers
            </button>

            <button
              type="button"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                nextLessonId && moduleComplete
                  ? 'cursor-pointer bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
              onClick={() => nextLessonId && moduleComplete && navigate(`/learning/${level}/lesson/${nextLessonId}`)}
              disabled={!nextLessonId || !moduleComplete}
              title={!moduleComplete ? 'Complete writing practice first' : undefined}
            >
              Next lesson
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (!step) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center font-sans">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Oops! Content Unavailable</h2>
          <p className="mt-3 max-w-md text-slate-500 leading-relaxed">
            We apologize, but we&apos;re having trouble loading your quiz right now. Please make sure your internet
            connection is stable, and try again in a few moments.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/learning/${level}`)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            Back to Curriculum
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-slate-900">
              {judulKuis || `${level} - Lesson ${lessonId}`}
            </h1>
            <p className="text-sm text-slate-500 whitespace-nowrap">
              Step {currentIndex + 1} of {totalSteps}
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Passing score: <span className="font-semibold text-slate-700">{passThreshold}%</span> — a lower score
            won&apos;t complete this module.
          </p>
        </div>

        {step.type === 'info' ? (
          <div className="py-4 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
            <p className="text-[16px] leading-relaxed text-slate-700">{step.content}</p>
            <Link
              to={`/learning/${level}/lesson/${lessonId}/writing`}
              className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Prefer writing first? Open AI writing practice →
            </Link>
          </div>
        ) : (
          <div className="py-4">
            <p className="mb-5 text-xl font-semibold text-slate-900">{step.prompt}</p>
            <div className="space-y-3">
              {step.options.map((option) => {
                const selected = selectedOption === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_1px_rgba(99,102,241,0.22)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-3 text-slate-800">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-400 bg-white text-transparent'
                        }`}
                        aria-hidden
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                          <path d="M6.6 11.4 3.4 8.2l1.1-1.1 2.1 2.1 5-5 1.1 1.1z" />
                        </svg>
                      </span>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-7 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              onClick={handlePrev}
            >
              <span aria-hidden>‹</span>
              {isFirstStep ? 'Back' : 'Previous'}
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                canProceed
                  ? 'cursor-pointer bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
              onClick={handleNext}
              disabled={!canProceed}
            >
              {nextLabel}
              <span aria-hidden>›</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
