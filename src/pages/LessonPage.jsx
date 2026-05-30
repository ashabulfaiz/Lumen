import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { learningLevels, markLessonCompleted } from '../data/learningData.js'
import api from '../lib/axiosInstance'

export default function LessonPage() {
  const navigate = useNavigate()
  const { level, lessonId } = useParams()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  
  // State untuk menampung data dari Backend
  const [quizData, setQuizData] = useState([])
  const [quizId, setQuizId] = useState(null)
  const [judulKuis, setJudulKuis] = useState('') // ✨ State baru untuk Judul Materi Dinamis
  const [loading, setLoading] = useState(true)
  const [submitResult, setSubmitResult] = useState(null)
  const [savedAnswers, setSavedAnswers] = useState(null)
  const [isFinishedMode, setIsFinishedMode] = useState(false)

  // 1. FETCH DATA KUIS DARI BACKEND
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true)
      try {
        let topik = "Article Or No Article"; 
        if (level === "beginner") {
          if (lessonId === "1") topik = "Article Or No Article";
          if (lessonId === "2") topik = "Pronoun Case";
          if (lessonId === "3") topik = "To Be Or To Have";
          if (lessonId === "4") topik = "To Be Present Negative Sentences";
        } else if (level === "intermediate") {
          if (lessonId === "5") topik = "Mixed Verb Tenses";
          if (lessonId === "6") topik = "Mixed Modals Should, Can, Must";
        } else if (level === "advanced") {
          if (lessonId === "7") topik = "Conjunctive Adverbs";
          if (lessonId === "8") topik = "The Second Conditional";
        }

        const formattedLevel = level.charAt(0).toUpperCase() + level.slice(1);

        const response = await api.post('/quiz/generate', {
          level_name: formattedLevel,
          lesson_id: parseInt(lessonId),
          kategori_topik: topik
        });

        const data = response.data.data;
        setQuizId(data.quiz_id);
        setQuizData(data.soal);
        setJudulKuis(data.judul_kuis);

        // Ambil review jawaban jika kuis pernah dikerjakan sebelumnya
        try {
          const reviewRes = await api.get(`/quiz/review/${data.quiz_id}`);
          if (reviewRes.data.data && reviewRes.data.data.length > 0) {
            setSavedAnswers(reviewRes.data.data);
            setIsFinishedMode(true);
          }
        } catch (err) {
          console.error("Gagal mengambil review kuis:", err);
        }

      } catch (error) {
        console.error("Gagal mengambil kuis:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
    setCurrentIndex(0)
    setSelectedOptions({})
    setIsFinished(false)
    setSubmitResult(null)
    setJudulKuis('') // Reset judul saat berpindah materi
    setSavedAnswers(null)
    setIsFinishedMode(false)
  }, [level, lessonId])

  // 2. UBAH FORMAT DATA API AGAR COCOK DENGAN UI
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
        title: judulKuis || `${level.charAt(0).toUpperCase() + level.slice(1)} — Lesson ${lessonId}`, // ✨ Gunakan judul dinamis
        content: "Jawablah pertanyaan berikut dengan teliti. Nilai akan dihitung langsung oleh sistem AI kami.",
      },
      ...dynamicSteps
    ]
  }, [quizData, level, lessonId, judulKuis])

  const step = steps[currentIndex]
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0
  const selectedOption = step ? selectedOptions[step.id] : null

  // Navigasi Antar Lesson
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
  const nextLabel = isLastStep ? 'Submit & Finish' : 'Next'

  const canProceed = useMemo(() => {
    if (!step) return false;
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
        question_id: parseInt(qId),
        jawaban: ans
      }));

      try {
        const res = await api.post('/quiz/submit', {
          quiz_id: quizId,
          user_answers: user_answers
        });
        
        setSubmitResult(res.data.data);
        setIsFinished(true);
        markLessonCompleted(level, lessonId);
      } catch (error) {
        console.error("Gagal submit ke database:", error);
        alert("Gagal mengirim jawaban. Coba lagi.");
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
    if (!savedAnswers || savedAnswers.length === 0) return null;
    const correctCount = savedAnswers.filter(a => a.is_correct).length;
    const total = savedAnswers.length;
    const score = Math.round((correctCount / total) * 100);
    return { correctCount, total, score };
  }, [savedAnswers]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-lg font-medium text-slate-500">Memuat Kuis dari Server AI...</p>
      </div>
    )
  }

  if (isFinishedMode && savedAnswers) {
    const info = reviewScoreInfo || { correctCount: 0, total: 0, score: 0 };
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6 font-sans">
        <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center md:p-8">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Review Your Answers</h1>
            <p className="mt-2 text-[16px] text-slate-600">
              You got <span className="font-bold text-slate-900">{info.correctCount}</span> out of <span className="font-bold text-slate-900">{info.total}</span> questions correct (Score: <span className="font-bold text-indigo-600">{info.score}</span>)
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
            const answerDetail = savedAnswers.find(a => a.question_id === q.question_id);
            const userAns = answerDetail ? answerDetail.jawaban_teks : null;
            const isCorrect = answerDetail ? !!answerDetail.is_correct : false;
            const correctAnswer = answerDetail ? answerDetail.jawaban_benar : null;

            return (
              <div key={q.question_id} className={`rounded-2xl border-2 bg-white p-5 sm:p-6 ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
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

                <p className="mb-5 text-[15px] text-slate-700">{q.pertanyaan}</p>

                <div className="space-y-3">
                  {q.pilihan.map((opt) => {
                    const isSelected = userAns === opt;
                    const isRightAnswer = correctAnswer === opt;

                    let borderClass = "border border-slate-200";
                    let textClass = "text-slate-700";
                    let rightIcon = null;

                    if (isRightAnswer) {
                      borderClass = "border-2 border-emerald-500 bg-white";
                      textClass = "text-emerald-800 font-medium";
                      rightIcon = (
                        <div className="shrink-0 text-emerald-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                        </div>
                      );
                    } else if (isSelected && !isRightAnswer) {
                      borderClass = "border-2 border-red-500 bg-white";
                      textClass = "text-slate-900";
                      rightIcon = (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[13px] font-medium text-slate-500">Your answer</span>
                          <div className="text-red-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={opt} className={`flex min-h-[52px] items-center justify-between gap-4 rounded-xl px-4 py-3 ${borderClass}`}>
                        <span className={`text-[15px] ${textClass}`}>{opt}</span>
                        {rightIcon}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
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
    );
  }

  if (isFinished && submitResult) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-[30px] font-bold tracking-tight text-slate-900">Lesson Completed!</h1>
          <p className="mt-2 text-slate-600">Kerja bagus telah menyelesaikan materi ini.</p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{judulKuis}</p>
            <p className="mt-1 text-5xl font-bold text-indigo-600">{submitResult.skor_akhir}</p>
            <p className="mt-3 text-sm text-slate-600">
              Jawaban Benar: <span className="font-bold">{submitResult.jawaban_benar}</span> dari {submitResult.total_soal} soal
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

            <button
              type="button"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-indigo-600 bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
              onClick={async () => {
                try {
                  const reviewRes = await api.get(`/quiz/review/${quizId}`);
                  if (reviewRes.data.data && reviewRes.data.data.length > 0) {
                    setSavedAnswers(reviewRes.data.data);
                    setIsFinishedMode(true);
                  }
                } catch (err) {
                  console.error("Gagal mengambil review kuis:", err);
                }
              }}
            >
              Review Your Answers
            </button>

            <button
              type="button"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                nextLessonId
                  ? 'cursor-pointer bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
              onClick={() => nextLessonId && navigate(`/learning/${level}/lesson/${nextLessonId}`)}
              disabled={!nextLessonId}
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
            We apologize, but we're having trouble loading your quiz right now. Please make sure your internet connection is stable, and try again in a few moments.
          </p>
          
          <button
            onClick={() => navigate(`/learning/${level}`)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Curriculum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-4">
            {/* ✨ Judul Atas Sekarang Berubah Otomatis Mengikuti Materi */}
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
        </div>

        {step.type === 'info' ? (
          <div className="py-4 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
            <p className="text-[16px] leading-relaxed text-slate-700">{step.content}</p>
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
              className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={handlePrev}
            >
              <span aria-hidden>‹</span>
              {isFirstStep ? `Back` : 'Previous'}
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
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