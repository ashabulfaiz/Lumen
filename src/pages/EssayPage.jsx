import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { levelNumberBySlug, loadLearningProgress } from '../data/learningData.js'
import EssayRubricCard from '../components/EssayRubricCard.jsx'
import GrammarReviewCard from '../components/GrammarReviewCard.jsx'
import api from '../lib/axiosInstance'
import {
  fetchEssayQuestion,
  gradeEssayWithGrammar,
  grammarServiceHint,
} from '../lib/essayApi.js'
import { GRAMMAR_PASS_PERCENT, grammarScorePassed } from '../lib/essayProgress.js'
import { readEmail, readUsername } from '../lib/userSession.js'

async function loadLessonContext(levelSlug, lessonId) {
  if (!levelSlug) return null

  const courseRes = await api.get(`/learning/courses/${levelSlug}`)
  const courses = courseRes.data.data || []

  for (const course of courses) {
    const lessonRes = await api.get(`/learning/lessons/${course.id}`)
    const lessons = lessonRes.data.data || []
    const lesson = lessons.find((l) => String(l.id) === String(lessonId))
    if (lesson) {
      return {
        course,
        lesson,
        courseOrder: course.urutan ?? course.order ?? null,
      }
    }
  }
  return null
}

function grammarPercent(result) {
  if (!result) return null
  if (result.score_percent != null) return Math.round(Number(result.score_percent))
  if (result.grammar_score != null) {
    return Math.round(Number(result.grammar_score) * 100)
  }
  return null
}

export default function EssayPage() {
  const { level, lessonId } = useParams()
  const navigate = useNavigate()

  const [context, setContext] = useState(null)
  const [prompt, setPrompt] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [grammarResult, setGrammarResult] = useState(null)
  const [rubricResult, setRubricResult] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [writingPassed, setWritingPassed] = useState(false)

  const userSeedBase = useMemo(() => {
    const id = readEmail() || readUsername() || 'guest'
    return `${id}:${lessonId}`
  }, [lessonId])

  const fetchPrompt = useCallback(
    async (questionSeed, ctx) => {
      const data = await fetchEssayQuestion({
        level,
        courseOrder: ctx.course.urutan,
        courseTitle: ctx.course.judul_course,
        lessonTitle: ctx.lesson.judul_lesson,
        count: 1,
        seed: questionSeed,
      })
      setPrompt(data.questions[0])
    },
    [level],
  )

  const restoreSavedSubmission = useCallback(async () => {
    try {
      const res = await api.get(`/progress/essay/${lessonId}`)
      const saved = res.data?.data
      if (!saved?.answer_text) return

      setAnswer(saved.answer_text)
      if (saved.question_text) {
        setPrompt((prev) => ({
          ...(prev || {}),
          question: saved.question_text,
        }))
      }
      if (saved.grammar_feedback) {
        setGrammarResult(saved.grammar_feedback)
        setRubricResult(saved.rubric_feedback || null)
        setSubmitted(true)
        setWritingPassed(Boolean(saved.writing_passed))
      }
    } catch {
      /* no saved draft */
    }
  }, [lessonId])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setLoadError(null)
      setSubmitted(false)
      setGrammarResult(null)
      setRubricResult(null)
      setSubmitError(null)
      setWritingPassed(false)
      setAnswer('')

      try {
        const ctx = await loadLessonContext(level, lessonId)
        if (cancelled) return
        if (!ctx) {
          setLoadError('Lesson not found for this level.')
          setContext(null)
          return
        }
        setContext(ctx)
        await fetchPrompt(userSeedBase, ctx)
        if (!cancelled) await restoreSavedSubmission()
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load writing practice.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [level, lessonId, userSeedBase, fetchPrompt, restoreSavedSubmission])

  const loadQuestion = useCallback(
    async (questionSeed) => {
      if (!context) return
      await fetchPrompt(questionSeed, context)
    },
    [context, fetchPrompt],
  )

  const handleShuffleQuestion = async () => {
    setLoadError(null)
    setSubmitError(null)
    setSubmitted(false)
    setGrammarResult(null)
    setRubricResult(null)
    setWritingPassed(false)
    setAnswer('')
    try {
      await loadQuestion(`${userSeedBase}:${Date.now()}`)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  const handleSubmit = async () => {
    if (!prompt || !answer.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { grammar, rubric } = await gradeEssayWithGrammar({
        question: prompt.question,
        answer: answer.trim(),
        level,
      })
      const score = grammarPercent(grammar)
      const passed = grammarScorePassed(score)

      setGrammarResult(grammar)
      setRubricResult(rubric)
      setSubmitted(true)
      setWritingPassed(passed)

      await api.post('/progress/essay', {
        lesson_id: parseInt(lessonId, 10),
        question: prompt.question,
        answer: answer.trim(),
        grammar_score_percent: score,
        grammar_feedback: grammar,
        rubric_feedback: rubric,
      })
    } catch (err) {
      setSubmitError(
        `${err.message || 'Grading failed.'} ${grammarServiceHint()}`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const currentGrammarScore = grammarPercent(grammarResult)

  // Block writing practice in levels the learner hasn't unlocked via placement.
  const access = loadLearningProgress()
  const levelNum = levelNumberBySlug[level]
  if (!access.placementCompleted) return <Navigate to="/learning/placement" replace />
  if (levelNum && levelNum > access.highestUnlocked) return <Navigate to="/learning/levels" replace />

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans">
        <p className="text-lg font-medium text-slate-500">Loading writing practice…</p>
      </div>
    )
  }

  if (loadError && !prompt) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 font-sans text-center">
        <p className="text-red-600">{loadError}</p>
        <p className="mt-2 text-sm text-slate-500">{grammarServiceHint()}</p>
        <button
          type="button"
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
          onClick={() => navigate(`/learning/${level}`)}
        >
          Back to curriculum
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Writing practice</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {context?.lesson?.judul_lesson || 'Essay'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {context?.course?.judul_course} · {level.charAt(0).toUpperCase() + level.slice(1)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Grammar score must be at least {GRAMMAR_PASS_PERCENT}% on one submission to complete writing for this module.
              You can open the quiz anytime.
            </p>
          </div>
          <Link
            to={`/learning/${level}`}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to curriculum
          </Link>
        </div>

        {prompt ? (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="text-sm font-semibold text-indigo-800">Your prompt</p>
            <p className="mt-2 text-[16px] leading-relaxed text-slate-800">{prompt.question}</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              onClick={handleShuffleQuestion}
              disabled={submitting}
            >
              Get a different question
            </button>
          </div>
        ) : null}

        {!submitted ? (
          <>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Your answer</span>
              <p className="mt-1 text-xs text-slate-500">
                Write in one continuous paragraph — text wraps automatically. You do not need a new line for each sentence.
              </p>
              <textarea
                rows={10}
                wrap="soft"
                className="mt-2 min-h-[240px] w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed text-slate-900 whitespace-normal break-words outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Write your response in English as one continuous paragraph…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
              />
            </label>

            {submitError ? (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition ${
                  answer.trim() && !submitting
                    ? 'cursor-pointer bg-indigo-600 hover:bg-indigo-700'
                    : 'cursor-not-allowed bg-slate-300'
                }`}
                disabled={!answer.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'AI is grading…' : 'Submit for AI review'}
              </button>
              <Link
                to={`/learning/${level}/lesson/${lessonId}`}
                className="inline-flex items-center rounded-xl border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go to quiz
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Graded by the LUMEN grammar AI (TensorFlow) plus rubric for vocabulary, relevance, and coherence.
            </p>
          </>
        ) : (
          <div className="space-y-8">
            {writingPassed ? (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                role="status"
              >
                Writing complete — grammar score {currentGrammarScore}% (minimum {GRAMMAR_PASS_PERCENT}%).
                This module&apos;s writing requirement is satisfied.
              </div>
            ) : (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="alert"
              >
                Grammar score is {currentGrammarScore ?? '—'}%. You need at least {GRAMMAR_PASS_PERCENT}% to
                complete writing for this module. Your last answer is saved — edit & resubmit or try another
                question. You can still go to the quiz.
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-900">Rubric scores</h2>
              <p className="mt-1 text-sm text-slate-600">
                Grammar uses the same AI model as the grammar checker; other dimensions use the essay rubric.
              </p>
              <div className="mt-4">
                <EssayRubricCard result={rubricResult} />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-bold text-slate-900">Your submission</h2>
              <p className="mt-2 whitespace-normal break-words rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-800">
                {answer.trim()}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-bold text-slate-900">Grammar AI feedback</h2>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <GrammarReviewCard result={grammarResult} showScore />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                onClick={() => {
                  setSubmitted(false)
                  setGrammarResult(null)
                  setRubricResult(null)
                  setSubmitError(null)
                }}
              >
                Edit & resubmit
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={handleShuffleQuestion}
              >
                Try another question
              </button>
              <Link
                to={`/learning/${level}/lesson/${lessonId}`}
                className="inline-flex items-center rounded-xl border-2 border-indigo-200 px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Go to quiz
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
