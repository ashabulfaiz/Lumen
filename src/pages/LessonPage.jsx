import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { learningLevels, markLessonCompleted } from '../data/learningData.js'

function GrammarErrorList({ errors }) {
  if (!Array.isArray(errors) || errors.length === 0) return null
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5">
      {errors.map((err, idx) => (
        <li key={`${err.type}-${idx}`} className="text-slate-800">
          {err.message}
          {err.original_span ? (
            <span className="mt-1 block text-xs text-slate-500">
              &quot;{err.original_span}&quot;
              {err.corrected_span ? ` → "${err.corrected_span}"` : ''}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function GrammarReviewCard({ result, showScore = false }) {
  if (!result || result.status === 'error') {
    return (
      <p className="text-sm text-red-600">
        {result?.message || 'Grammar review unavailable.'}
      </p>
    )
  }

  const score = result.acceptability_score ?? result.grammar_score
  const acceptableLabel =
    result.is_acceptable === true
      ? 'Acceptable'
      : result.is_acceptable === false
        ? 'Needs work'
        : null

  return (
    <>
      {showScore && score != null ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-medium text-slate-800">Acceptability score</p>
            <p>{score}</p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Verdict</p>
            <p>{acceptableLabel ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Writing level</p>
            <p>{result.writing_level ?? '—'}</p>
          </div>
        </div>
      ) : null}
      {result.corrected_sentence ? (
        <div className={showScore ? 'mt-3' : ''}>
          <p className="font-medium text-slate-800">Corrected sentence</p>
          <p className="whitespace-pre-wrap text-slate-900">{result.corrected_sentence}</p>
        </div>
      ) : null}
      {result.errors?.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium text-slate-800">What to fix</p>
          <GrammarErrorList errors={result.errors} />
        </div>
      ) : null}
      {result.feedback ? (
        <div className="mt-3">
          <p className="font-medium text-slate-800">Feedback</p>
          <p className="whitespace-pre-wrap text-slate-900">{result.feedback}</p>
        </div>
      ) : null}
    </>
  )
}

const lessonPacks = {
  beginner: {
    title: 'Core basics',
    intro:
      "Answer 5 questions. Some are multiple-choice, and some are short essays. Don't worry about perfection — focus on clarity.",
    steps: [
      {
        id: 'b-q1',
        type: 'question',
        prompt: 'Choose the correct sentence.',
        options: ['He go to school.', 'He goes to school.', 'He going to school.', 'He went to school every day.'],
        answer: 'He goes to school.',
        explanation: 'For he/she/it in simple present, use verb + s/es: “goes”.',
      },
      {
        id: 'b-q2',
        type: 'question',
        prompt: 'Which sentence is a polite greeting?',
        options: ['Give me that.', 'Good morning!', "Where you go?", "I no understand."],
        answer: 'Good morning!',
        explanation: '“Good morning!” is a polite and common greeting.',
      },
      {
        id: 'b-e1',
        type: 'essay',
        prompt: 'Write 2–3 sentences to introduce yourself in English (name + where you are from + one hobby).',
        sampleAnswer: "Hi, my name is Rina. I'm from Indonesia. I like reading and listening to music.",
        tips: 'Keep it simple: short sentences, basic vocabulary.',
      },
      {
        id: 'b-q3',
        type: 'question',
        prompt: 'Pick the correct article: “___ apple a day keeps the doctor away.”',
        options: ['A', 'An', 'The', 'No article'],
        answer: 'An',
        explanation: 'Use “an” before vowel sounds, like “apple”.',
      },
      {
        id: 'b-e2',
        type: 'essay',
        prompt: 'Write a short message (2–4 sentences) to ask a friend to study English together this week.',
        sampleAnswer: "Hi! Do you want to study English together this week? We can practice for 30 minutes after school. Let me know what day works for you.",
        tips: 'Include a suggestion + time + a question.',
      },
    ],
  },
  intermediate: {
    title: 'Everyday communication',
    intro:
      'Answer 5 questions. Pay attention to tense, connectors, and more natural phrasing. Essays can be short but clear.',
    steps: [
      {
        id: 'i-q1',
        type: 'question',
        prompt: 'Choose the best option: “I ___ English every day.”',
        options: ['study', 'studies', 'studying', 'studied'],
        answer: 'study',
        explanation: 'With “I”, use the base form in simple present: “study”.',
      },
      {
        id: 'i-q2',
        type: 'question',
        prompt: 'Which sentence is correct?',
        options: ['She don’t like coffee.', 'She doesn’t likes coffee.', 'She doesn’t like coffee.', 'She not like coffee.'],
        answer: 'She doesn’t like coffee.',
        explanation: 'Negative simple present: “doesn’t + base verb”.',
      },
      {
        id: 'i-e1',
        type: 'essay',
        prompt: 'Write a short paragraph (3–5 sentences) about your daily routine using time words (e.g., usually, then, after that).',
        sampleAnswer:
          'I usually wake up at 6 a.m. Then I take a shower and have breakfast. After that, I go to school and study until the afternoon. In the evening, I review my notes and relax.',
        tips: 'Use sequencing words: usually, then, after that, finally.',
      },
      {
        id: 'i-q3',
        type: 'question',
        prompt: 'Choose the correct connector: “I was tired, ___ I finished my homework.”',
        options: ['because', 'but', 'so', 'although'],
        answer: 'but',
        explanation: '“but” shows contrast: tired vs still finished.',
      },
      {
        id: 'i-e2',
        type: 'essay',
        prompt: 'Reply to this message in English (2–4 sentences): “Can you join our meeting at 3 PM tomorrow?”',
        sampleAnswer:
          'Thanks for the invitation. Yes, I can join the meeting at 3 PM tomorrow. Please share the link and the agenda.',
        tips: 'Answer yes/no clearly, then add one helpful follow-up question.',
      },
    ],
  },
  advanced: {
    title: 'Nuance & discussion',
    intro:
      'Answer 5 questions. Focus on meaning, nuance, and clarity. Essays should be structured (opinion + reasons).',
    steps: [
      {
        id: 'a-q1',
        type: 'question',
        prompt: 'Choose the best rewrite: “Despite the rain, we continued the trip.”',
        options: [
          'Because it rained, we continued the trip.',
          'Although it rained, we continued the trip.',
          'We continued the trip, so it rained.',
          'We continued the trip, but it was sunny.',
        ],
        answer: 'Although it rained, we continued the trip.',
        explanation: '“Despite” ≈ “although” (contrast).',
      },
      {
        id: 'a-e1',
        type: 'essay',
        prompt: 'Give your opinion (4–6 sentences): Is studying with AI tools helpful? Explain with 2 reasons and 1 example.',
        sampleAnswer:
          'I think studying with AI tools is helpful because it gives fast feedback and offers personalized practice. For example, I can ask for grammar corrections and alternative sentences. However, I still need to verify information and practice with real conversations.',
        tips: 'Structure: opinion → reason 1 → reason 2 → example → (optional) balance/limit.',
      },
      {
        id: 'a-q2',
        type: 'question',
        prompt: 'Choose the sentence with correct punctuation.',
        options: [
          'In my opinion studying regularly is important.',
          'In my opinion, studying regularly is important.',
          'In my opinion studying, regularly is important.',
          'In my opinion studying regularly, is important.',
        ],
        answer: 'In my opinion, studying regularly is important.',
        explanation: 'Use a comma after an introductory phrase like “In my opinion,”.',
      },
      {
        id: 'a-q3',
        type: 'question',
        prompt: 'Pick the best option: “If I ___ more time, I would travel more.”',
        options: ['have', 'had', 'will have', 'am having'],
        answer: 'had',
        explanation: 'Second conditional: If + past simple, would + base verb.',
      },
      {
        id: 'a-e2',
        type: 'essay',
        prompt: 'Write a short conclusion (2–4 sentences) to end an email politely after discussing a project update.',
        sampleAnswer:
          'Please let me know if you have any questions or need more details. I’m happy to clarify anything. Thank you for your time, and I look forward to your feedback.',
        tips: 'Include: offer help + thanks + next step.',
      },
    ],
  },
}

const getLessonContent = (level, lessonId) => {
  const pack = lessonPacks[level]
  if (pack) {
    return [
      {
        id: `${level}-${lessonId}-intro`,
        type: 'info',
        title: `${pack.title} — Lesson ${lessonId}`,
        content: pack.intro,
      },
      ...pack.steps,
    ]
  }
  return [
    { id: 1, type: 'info', title: `Welcome to Lesson ${lessonId}`, content: `This is the content for ${level} lesson ${lessonId}.` },
    { id: 2, type: 'question', prompt: 'Did you understand the lesson?', options: ['Yes', 'No'], answer: 'Yes', explanation: 'Great job!' }
  ]
}

export default function LessonPage() {
  const navigate = useNavigate()
  const { level, lessonId } = useParams()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [grammarResults, setGrammarResults] = useState({})
  const [grammarReviewResults, setGrammarReviewResults] = useState({})
  const [grammarReviewLoading, setGrammarReviewLoading] = useState(false)
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [grammarError, setGrammarError] = useState(null)
  const assistTimeout = useRef(null)
  const GRAMMAR_API_BASE_URL = import.meta.env.VITE_GRAMMAR_API_URL?.replace(/\/$/, '') || 'http://localhost:5002'
  const GRAMMAR_API_URL = `${GRAMMAR_API_BASE_URL}/check-grammar`

  const steps = useMemo(() => getLessonContent(level, lessonId), [level, lessonId])
  const step = steps[currentIndex]
  const totalSteps = steps.length
  const progressPercentage = ((currentIndex + 1) / totalSteps) * 100
  const selectedOption = selectedOptions[step.id]
  const grammarResult = grammarResults[step.id] || null

  const questions = useMemo(() => steps.filter((s) => s.type === 'question'), [steps])
  const essays = useMemo(() => steps.filter((s) => s.type === 'essay'), [steps])
  const correctAnswers = useMemo(
    () =>
      questions.reduce((total, q) => (selectedOptions[q.id] === q.answer ? total + 1 : total), 0),
    [questions, selectedOptions],
  )

  useEffect(() => {
    setCurrentIndex(0)
    setSelectedOptions({})
    setIsFinished(false)
    setShowReview(false)
    setGrammarResults({})
    setGrammarReviewResults({})
    setGrammarReviewLoading(false)
    setGrammarError(null)
    setGrammarLoading(false)
  }, [level, lessonId])

  const isFirstStep = currentIndex === 0
  const nextLessonId = useMemo(() => {
    const current = Number(lessonId)
    if (!Number.isFinite(current)) return null

    const lessons = learningLevels?.[level]?.lessons
    if (!Array.isArray(lessons) || lessons.length === 0) return null

    const idx = lessons.findIndex((l) => Number(l?.id) === current)
    if (idx < 0) return null

    const next = lessons[idx + 1]
    const nextId = Number(next?.id)
    return Number.isFinite(nextId) ? nextId : null
  }, [level, lessonId])

  const isLastStep = currentIndex === totalSteps - 1
  const nextLabel = isLastStep ? 'Finish' : 'Next'

  const canProceed = useMemo(() => {
    if (step.type === 'info') return true
    if (step.type === 'essay') return String(selectedOption || '').trim().length > 0
    return selectedOption != null
  }, [step, selectedOption])

  const handleSelect = (option) => {
    if (step.type !== 'question') return
    setSelectedOptions((prev) => ({ ...prev, [step.id]: option }))
  }

  const handleEssayChange = (text) => {
    if (step.type !== 'essay') return
    setSelectedOptions((prev) => ({ ...prev, [step.id]: text }))
    setGrammarResults((prev) => {
      const next = { ...prev }
      delete next[step.id]
      return next
    })
    setGrammarError(null)
  }

  const runGrammarAssist = async (stepId, sentence, mode = 'assist') => {
    setGrammarLoading(true)
    setGrammarError(null)

    try {
      const response = await fetch(GRAMMAR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, mode }),
      })

      const data = await response.json()
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Grammar service error')
      }

      setGrammarResults((prev) => ({ ...prev, [stepId]: data }))
    } catch (error) {
      setGrammarError(`Unable to load grammar assist. Make sure the grammar service is running at ${GRAMMAR_API_URL}. If you use the ai-sentence API, run: python ai-sentence/app.py`)
    } finally {
      setGrammarLoading(false)
    }
  }

  useEffect(() => {
    if (step.type !== 'essay') return
    const sentence = String(selectedOptions[step.id] || '').trim()
    if (!sentence) {
      return
    }

    if (assistTimeout.current) {
      clearTimeout(assistTimeout.current)
    }

    assistTimeout.current = window.setTimeout(() => {
      runGrammarAssist(step.id, sentence, 'assist')
    }, 650)

    return () => {
      if (assistTimeout.current) {
        clearTimeout(assistTimeout.current)
      }
    }
  }, [selectedOption, step.id, step.type])

  const handleCheckGrammar = async () => {
    if (step.type !== 'essay') return

    const sentence = String(selectedOptions[step.id] || '').trim()
    if (!sentence) {
      setGrammarError('Please write your answer first before refreshing tips.')
      return
    }

    runGrammarAssist(step.id, sentence, 'assist')
  }

  useEffect(() => {
    if (!showReview || !isFinished || essays.length === 0) return

    let cancelled = false

    const loadReviewGrammar = async () => {
      setGrammarReviewLoading(true)
      const updates = {}

      for (const e of essays) {
        const text = String(selectedOptions[e.id] || '').trim()
        if (!text) {
          updates[e.id] = null
          continue
        }
        try {
          const response = await fetch(GRAMMAR_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence: text, mode: 'grade' }),
          })
          const data = await response.json()
          if (cancelled) return
          if (!response.ok || data.status === 'error') {
            updates[e.id] = {
              status: 'error',
              message: data.message || 'Grammar service error',
            }
          } else {
            updates[e.id] = data
          }
        } catch {
          if (cancelled) return
          updates[e.id] = {
            status: 'error',
            message: `Unable to load grammar review. Make sure the grammar service is running at ${GRAMMAR_API_URL}.`,
          }
        }
      }

      if (!cancelled) {
        setGrammarReviewResults(updates)
        setGrammarReviewLoading(false)
      }
    }

    loadReviewGrammar()
    return () => {
      cancelled = true
      setGrammarReviewLoading(false)
    }
  }, [showReview, isFinished, essays, selectedOptions, GRAMMAR_API_URL])

  const handleNext = () => {
    if (!canProceed) return
    if (isLastStep) {
      setIsFinished(true)
      markLessonCompleted(level, lessonId)
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

  if (isFinished) {
    if (showReview) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-8 font-sans space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Review Your Answers</h1>
              <p className="mt-2 text-[16px] text-slate-600">
                You got <span className="font-bold text-slate-900">{correctAnswers}</span> out of <span className="font-bold text-slate-900">{questions.length}</span> questions correct
              </p>
              {essays.length > 0 && (
                <p className="mt-1 text-[13px] font-medium text-slate-500">
                  Essays completed: {essays.filter((e) => (selectedOptions[e.id] || '').trim().length > 0).length} / {essays.length}
                </p>
              )}
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shrink-0"
              onClick={() => setShowReview(false)}
            >
              Back to Summary
            </button>
          </section>

          <div className="space-y-6">
            {steps
              .filter((s) => s.type === 'question' || s.type === 'essay')
              .map((s, i) => {
                if (s.type === 'essay') {
                  const userText = String(selectedOptions[s.id] || '').trim()
                  return (
                    <div key={s.id} className="rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <h3 className="text-[17px] font-bold text-slate-900">Essay {i + 1}</h3>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            userText ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {userText ? 'Completed' : 'Not answered'}
                        </span>
                      </div>

                      <p className="mb-4 text-[15px] text-slate-700">{s.prompt}</p>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="m-0 text-[12px] font-bold uppercase tracking-wide text-slate-500">Your answer</p>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
                          {userText || '—'}
                        </p>
                      </div>

                      {!userText ? null : grammarReviewLoading ? (
                        <p className="mt-4 text-sm text-slate-500">Loading grammar score…</p>
                      ) : grammarReviewResults[s.id] ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          <p className="mb-3 font-semibold text-slate-900">Grammar review (score)</p>
                          <GrammarReviewCard result={grammarReviewResults[s.id]} showScore />
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">No grammar review available for this answer.</p>
                      )}

                      {(s.sampleAnswer || s.tips) && (
                        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-[15px] leading-relaxed text-slate-700">
                          {s.tips ? (
                            <p className="m-0">
                              <span className="font-bold text-slate-900">Tip:</span> {s.tips}
                            </p>
                          ) : null}
                          {s.sampleAnswer ? (
                            <p className={`m-0 ${s.tips ? 'mt-3' : ''}`}>
                              <span className="font-bold text-slate-900">Sample answer:</span>{' '}
                              <span className="whitespace-pre-wrap">{s.sampleAnswer}</span>
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                }

                const userAns = selectedOptions[s.id]
                const isCorrect = userAns === s.answer

                return (
                  <div key={s.id} className={`rounded-2xl border-2 bg-white p-5 sm:p-6 ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <div className="text-emerald-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9 12l2 2 4-4" />
                            </svg>
                          </div>
                        ) : (
                          <div className="text-red-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          </div>
                        )}
                        <h3 className="text-[17px] font-bold text-slate-900">Question {i + 1}</h3>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <p className="mb-5 text-[15px] text-slate-700">{s.prompt}</p>

                    <div className="space-y-3">
                      {s.options.map((opt) => {
                        const isSelected = userAns === opt
                        const isRightAnswer = s.answer === opt

                        let borderClass = "border border-slate-200"
                        let textClass = "text-slate-700"
                        let rightIcon = null

                        if (isRightAnswer) {
                          borderClass = "border-2 border-emerald-500 bg-white"
                          textClass = "text-emerald-800 font-medium"
                          rightIcon = (
                            <div className="text-emerald-500 shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            </div>
                          )
                        } else if (isSelected && !isRightAnswer) {
                          borderClass = "border-2 border-red-500 bg-white"
                          textClass = "text-slate-900"
                          rightIcon = (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[13px] font-medium text-slate-500">Your answer</span>
                              <div className="text-red-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div key={opt} className={`flex min-h-[52px] items-center justify-between gap-4 rounded-xl px-4 py-3 ${borderClass}`}>
                            <span className={`text-[15px] ${textClass}`}>{opt}</span>
                            {rightIcon}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-[15px] leading-relaxed text-slate-700">
                      <span className="font-bold text-slate-900">Explanation:</span> {s.explanation}
                    </div>
                  </div>
                )
              })}
          </div>

          <div className="text-center pt-4">
            <button
              type="button"
              className="rounded-xl border-2 border-slate-200 bg-white px-8 py-3 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => setShowReview(false)}
            >
              Done Reviewing
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-[30px] font-bold tracking-tight text-slate-900">Lesson Completed!</h1>
          <p className="mt-2 text-slate-600">Great job finishing this lesson.</p>

          {questions.length > 0 && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Quiz Score</p>
              <p className="mt-1 text-4xl font-bold text-indigo-600">{Math.round((correctAnswers / questions.length) * 100)}%</p>
              <p className="mt-2 text-sm text-slate-600">
                Correct answers: {correctAnswers} of {questions.length}
              </p>
              
              <div className="mt-5 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 border-indigo-600 bg-white px-4 py-3 text-[15px] font-bold text-indigo-600 transition hover:bg-indigo-50"
                  onClick={() => setShowReview(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Review Your Answers
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate(`/learning/${level}`)}
            >
              Back to {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>

            <button
              type="button"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                nextLessonId
                  ? 'cursor-pointer bg-indigo-600 text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
              onClick={() => {
                if (!nextLessonId) return
                navigate(`/learning/${level}/lesson/${nextLessonId}`)
              }}
              disabled={!nextLessonId}
            >
              Next lesson
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-slate-900 capitalize">
              {level} - Lesson {lessonId}
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
        </div>

        {step.type === 'info' ? (
          <div className="py-4 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
            <p className="text-[16px] leading-relaxed text-slate-700">{step.content}</p>
          </div>
        ) : step.type === 'essay' ? (
          <div className="py-4 space-y-4">
            <p className="text-[16px] leading-relaxed text-slate-800 font-semibold">{step.prompt}</p>
            <textarea
              className="min-h-[140px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              value={typeof selectedOption === 'string' ? selectedOption : ''}
              onChange={(e) => handleEssayChange(e.target.value)}
              placeholder="Type your answer here..."
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">How grammar assist works</p>
              <p className="mt-2 text-slate-600">
                While you type, you only get writing tips (corrected example, what to fix, feedback) — no score. After you finish the lesson, open <span className="font-medium text-slate-800">Review Your Answers</span> to see acceptability score and full grammar review for each essay.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleCheckGrammar}
                disabled={grammarLoading || String(selectedOption || '').trim().length === 0}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${grammarLoading || String(selectedOption || '').trim().length === 0 ? 'cursor-not-allowed bg-slate-300 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {grammarLoading ? 'Refreshing tips...' : 'Refresh writing tips'}
              </button>
            </div>
            {grammarError && <p className="text-sm text-red-600">{grammarError}</p>}
            {grammarLoading && <p className="mt-3 text-sm text-slate-500">Checking your sentence for tips…</p>}
            {grammarResult ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="mb-2 font-semibold text-slate-900">Realtime writing tip</p>
                <GrammarReviewCard result={grammarResult} />
              </div>
            ) : null}
            {(step.tips || step.sampleAnswer) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                {step.tips ? (
                  <p className="m-0">
                    <span className="font-semibold text-slate-700">Tip:</span> {step.tips}
                  </p>
                ) : null}
                {step.sampleAnswer ? (
                  <p className={`m-0 ${step.tips ? 'mt-2' : ''}`}>
                    <span className="font-semibold text-slate-700">Example:</span>{' '}
                    <span className="whitespace-pre-wrap">{step.sampleAnswer}</span>
                  </p>
                ) : null}
              </div>
            )}
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
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${selected
                      ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_1px_rgba(99,102,241,0.22)]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <span className="inline-flex items-center gap-3 text-slate-800">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-400 bg-white text-transparent'
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
              className={[
                'inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium transition',
                'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                'cursor-pointer',
                isFirstStep ? 'text-slate-600 hover:text-slate-900' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
              onClick={handlePrev}
            >
              <span aria-hidden>‹</span>
              {isFirstStep ? `Back to ${level.charAt(0).toUpperCase() + level.slice(1)}` : 'Previous'}
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              {steps.map((item, idx) => {
                const answered = item.type === 'info' ? currentIndex > idx : selectedOptions[item.id] != null
                const active = idx === currentIndex
                return (
                  <span
                    key={item.id}
                    className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-indigo-600' : answered ? 'bg-indigo-300' : 'bg-slate-300'
                      }`}
                    aria-hidden
                  />
                )
              })}
            </div>

            <button
              type="button"
              className={[
                'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition',
                'outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                canProceed
                  ? 'cursor-pointer bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400',
              ].join(' ')}
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
