import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { markLessonCompleted, syncLearningProgressFromDB } from '../data/learningData.js'
import api from '../lib/axiosInstance'
import { Trophy, ArrowRight, RotateCcw, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react'

export default function LessonPage() {
  const navigate = useNavigate()
  const { level, lessonId } = useParams()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [isFinished, setIsFinished] = useState(false)

  const [aiFeedbacks, setAiFeedbacks] = useState({})
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  
  const [quizData, setQuizData] = useState([])
  const [quizId, setQuizId] = useState(null)
  const [judulKuis, setJudulKuis] = useState('') 
  const [loading, setLoading] = useState(true)
  const [submitResult, setSubmitResult] = useState(null)
  const [savedAnswers, setSavedAnswers] = useState(null)
  const [isFinishedMode, setIsFinishedMode] = useState(false)
  const [essayCompleted, setEssayCompleted] = useState(false)
  // Ordered lesson IDs for this level, fetched from DB (used for next-lesson nav).
  const [levelLessonIds, setLevelLessonIds] = useState([])

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true)
      try {
        const formattedLevel = level.charAt(0).toUpperCase() + level.slice(1);
        const response = await api.post('/quiz/generate', {
          level_name: formattedLevel,
          lesson_id: parseInt(lessonId)
        });

        const data = response.data.data;
        setQuizId(data.quiz_id);
        setQuizData(data.soal);
        setJudulKuis(data.judul_kuis);

        try {
          const reviewRes = await api.get(`/quiz/review/${data.quiz_id}`);
          if (reviewRes.data.data && reviewRes.data.data.length > 0) {
            setSavedAnswers(reviewRes.data.data);
            setIsFinishedMode(true);
          }
        } catch (err) {
          console.error("Failed to load the quiz review:", err);
        }

        try {
          const statusRes = await api.get(`/progress/module-status/${level}`);
          const allStatuses = statusRes.data?.data || [];
          // Store ordered lesson IDs from DB for correct next-lesson navigation.
          setLevelLessonIds(allStatuses.map(row => parseInt(row.lesson_id)));
          const modStatus = allStatuses.find(row => parseInt(row.lesson_id) === parseInt(lessonId));
          if (modStatus) {
            setEssayCompleted(Boolean(modStatus.essay_completed));
          }
        } catch (err) {
          console.error("Failed to load module status:", err);
        }

      } catch (error) {
        console.error("Failed to fetch the quiz:", error)
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
  }, [level, lessonId])

  const steps = useMemo(() => {
    if (quizData.length === 0) return []

    const dynamicSteps = quizData.map((q) => ({
      id: q.question_id,
      type: q.pilihan && q.pilihan.length > 0 ? 'question' : 'essay',
      prompt: q.pertanyaan,
      options: q.pilihan,
    }))

    return [
      {
        id: 'intro',
        type: 'info',
        title: judulKuis || `${level.charAt(0).toUpperCase() + level.slice(1)} — Lesson ${lessonId}`,
        content: "Welcome to the final quiz for this unit! This quiz is designed to test your understanding of the concepts you’ve learned. Each question will provide new insights, so be sure to read carefully and answer to the best of your ability. Don’t worry about the results—what matters most is the process of learning and understanding the material. Good luck!",
      },
      ...dynamicSteps
    ]
  }, [quizData, level, lessonId, judulKuis])

  const step = steps[currentIndex]
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0
  const selectedOption = step ? selectedOptions[step.id] : null

  const isFirstStep = currentIndex === 0
  const nextLessonId = useMemo(() => {
    const current = Number(lessonId)
    if (!Number.isFinite(current) || levelLessonIds.length === 0) return null
    const idx = levelLessonIds.indexOf(current)
    if (idx < 0 || idx === levelLessonIds.length - 1) return null
    return levelLessonIds[idx + 1]
  }, [lessonId, levelLessonIds])

  const isLastStep = currentIndex === totalSteps - 1
  const nextLabel = isLastStep ? 'Submit & Finish' : 'Next'

  const canProceed = useMemo(() => {
    if (!step) return false;
    if (step.type === 'info') return true;
    if (step.type === 'essay') {
      return selectedOption && selectedOption.trim().length > 0;
    }
    
    return selectedOption != null;
  }, [step, selectedOption])

  const handleSelect = (option) => {
    if (step.type !== 'question' && step.type !== 'essay') return
    
    setSelectedOptions((prev) => ({ ...prev, [step.id]: option }))
  }

  const handleCheckGrammar = async () => {
    if (!selectedOption || selectedOption.trim() === '') return;

    setIsCheckingGrammar(true);
    try {
      const response = await api.post('/grammar/check', {
        text: selectedOption
      });

      setAiFeedbacks((prev) => ({
        ...prev,
        [step.id]: response.data.data
      }));
      
    } catch (error) {
      console.error("Failed to check grammar with AI:", error);
      alert("Failed to connect to AI. Please try again.");
    } finally {
      setIsCheckingGrammar(false);
    }
  };

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
        if (res.data.data.passed) {
          markLessonCompleted(level, lessonId);
          await syncLearningProgressFromDB();
        }
      } catch (error) {
        console.error("Failed to submit to database:", error);
        alert("Failed to submit answers. Please try again.");
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
      <div className="mx-auto max-w-3xl px-4 py-20 font-sans">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-indigo-50 bg-gradient-to-b from-white to-indigo-50/50 p-12 text-center shadow-sm">
          
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60 duration-1000"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          <h2 className="text-[22px] font-bold tracking-tight text-slate-900">
            Preparing your lesson...
          </h2>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-slate-500">
            We are crafting the best learning materials for you. Hang tight, this will only take a moment!
          </p>

        </div>
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
          {savedAnswers.map((answer, i) => {
            // Use savedAnswers as the source of truth. Look up quizData only for
            // pilihan (options) — quizData may have a different shuffle on revisit,
            // so we never rely on it for correctness, only for display options.
            const quizEntry = quizData.find(q => q.question_id === answer.question_id);
            const userAns = answer.jawaban_teks;
            const isCorrect = !!answer.is_correct;
            const correctAnswer = answer.jawaban_benar;
            const pertanyaan = answer.pertanyaan;
            const pilihan = quizEntry?.pilihan ?? null;

            return (
              <div key={answer.question_id} className={`rounded-2xl border-2 bg-white p-5 sm:p-6 ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
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

                <p className="mb-5 text-[15px] text-slate-700">{pertanyaan}</p>

                {pilihan ? (
                  <div className="space-y-3">
                    {pilihan.map((opt) => {
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
                ) : (
                  // Fallback when pilihan isn't available (question not in current shuffle)
                  <div className="space-y-2">
                    <div className={`flex min-h-[52px] items-center justify-between gap-4 rounded-xl border-2 px-4 py-3 ${isCorrect ? 'border-emerald-500 bg-white' : 'border-red-500 bg-white'}`}>
                      <span className="text-[15px] text-slate-900">{userAns}</span>
                      <span className={`text-[13px] font-medium ${isCorrect ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {isCorrect ? 'Your answer ✓' : 'Your answer'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex min-h-[52px] items-center justify-between gap-4 rounded-xl border-2 border-emerald-500 bg-white px-4 py-3">
                        <span className="text-[15px] font-medium text-emerald-800">{correctAnswer}</span>
                        <div className="shrink-0 text-emerald-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
    const isSuccess = submitResult.passed;
    
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 font-sans">
        <section className={`relative overflow-hidden rounded-[2rem] border ${isSuccess ? 'border-emerald-100 bg-white' : 'border-red-100 bg-white'} p-8 shadow-xl shadow-slate-200/50 md:p-12`}>
          
          {/* Background decorative elements */}
          <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.08] blur-3xl ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <div className={`absolute -left-20 -bottom-20 h-64 w-64 rounded-full opacity-[0.08] blur-3xl ${isSuccess ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {isSuccess ? (
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-[12px] ring-emerald-50/50">
                <Trophy className="h-14 w-14" />
              </div>
            ) : (
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-red-50 text-red-500 ring-[12px] ring-red-50/50">
                <XCircle className="h-14 w-14" />
              </div>
            )}
            
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[40px]">
              {isSuccess ? 'Lesson Completed!' : 'Keep Trying!'}
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-slate-500">
              {isSuccess 
                ? 'Outstanding work! You have successfully mastered this lesson and are ready to move on to the next challenge.' 
                : `You scored below the passing threshold of ${submitResult.pass_threshold}%. Don't worry, you can review your answers and try again.`}
            </p>

            <div className={`mt-10 w-full max-w-md rounded-3xl ${isSuccess ? 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/30' : 'bg-gradient-to-br from-red-50/80 to-red-100/30'} p-8 shadow-inner border ${isSuccess ? 'border-emerald-100/50' : 'border-red-100/50'}`}>
              <p className={`text-sm font-bold uppercase tracking-widest ${isSuccess ? 'text-emerald-600/80' : 'text-red-600/80'}`}>
                {judulKuis}
              </p>
              
              <div className="my-5 flex items-baseline justify-center gap-1">
                <span className={`text-[80px] leading-none font-black ${isSuccess ? 'text-emerald-500' : 'text-red-500'} tracking-tighter`}>
                  {Math.round(submitResult.final_score)}
                </span>
                <span className={`text-3xl font-bold ${isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>%</span>
              </div>
              
              <div className={`mx-auto mt-2 inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-[15px] font-semibold ${isSuccess ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-red-700 shadow-sm'}`}>
                <CheckCircle2 className={`h-4.5 w-4.5 ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`} />
                <span>Correct: <span className="font-bold">{submitResult.correct_answers}</span> out of {submitResult.total_questions}</span>
              </div>
            </div>

            <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-[16px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 sm:w-auto shadow-sm"
                onClick={() => navigate(`/learning/${level}`)}
              >
                <ChevronLeft className="h-5 w-5" />
                Back to {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>

              <button
                type="button"
                className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-6 py-4 text-[16px] font-bold transition-all sm:w-auto shadow-sm ${
                  isSuccess 
                    ? 'border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200' 
                    : 'border-red-100 bg-red-50/50 text-red-700 hover:bg-red-100 hover:border-red-200'
                }`}
                onClick={async () => {
                  try {
                    const reviewRes = await api.get(`/quiz/review/${quizId}`);
                    if (reviewRes.data.data && reviewRes.data.data.length > 0) {
                      setSavedAnswers(reviewRes.data.data);
                      setIsFinishedMode(true);
                    }
                  } catch (err) {
                    console.error("Failed to fetch the quiz review:", err);
                  }
                }}
              >
                <RotateCcw className="h-5 w-5" />
                Review Answers
              </button>

              <button
                type="button"
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-[16px] font-bold text-white transition-all sm:w-auto shadow-xl ${
                  isSuccess
                    ? (!essayCompleted || nextLessonId 
                        ? 'cursor-pointer bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5' 
                        : 'cursor-not-allowed bg-slate-300 opacity-80 shadow-none')
                    : 'cursor-pointer bg-red-600 shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5'
                }`}
                onClick={() => {
                  if (isSuccess) {
                    if (!essayCompleted) {
                      navigate(`/learning/${level}/lesson/${lessonId}/writing`);
                    } else if (nextLessonId) {
                      navigate(`/learning/${level}/lesson/${nextLessonId}`);
                    }
                  } else {
                    // Call handleRetake equivalent since it might not be in scope or we can just reset states
                    setIsFinishedMode(false);
                    setIsFinished(false);
                    setSavedAnswers(null);
                    setCurrentIndex(0);
                    setSelectedOptions({});
                    setSubmitResult(null);
                  }
                }}
                disabled={isSuccess && essayCompleted && !nextLessonId}
              >
                {isSuccess ? (!essayCompleted ? 'Next: Writing' : 'Next Lesson') : 'Retake Quiz'}
                {isSuccess ? <ArrowRight className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
              </button>
            </div>
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
        ) : step.type === 'essay' ? (
          <div className="py-4">
            <p className="mb-5 text-xl font-semibold text-slate-900">{step.prompt}</p>
            
            <textarea
              className="w-full min-h-[160px] rounded-xl border border-slate-300 bg-white p-4 text-[15px] text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Type your English answer here..."
              value={selectedOptions[step.id] || ''}
              onChange={(e) => handleSelect(e.target.value)}
              disabled={isCheckingGrammar}
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCheckGrammar}
                disabled={isCheckingGrammar || !selectedOptions[step.id]}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingGrammar ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AI Checking...
                  </>
                ) : (
                  '✨ Check Grammar'
                )}
              </button>
            </div>

            {aiFeedbacks[step.id] && (
              <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-indigo-900">
                  <span className="text-indigo-600">🤖 AI Feedback</span>
                </h4>
                
                <div className="mb-4 rounded-xl bg-white p-4 shadow-sm border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Corrected Sentence</p>
                  <p className="text-[15px] font-medium text-emerald-700">
                    {aiFeedbacks[step.id].corrected_text}
                  </p>
                </div>

                {aiFeedbacks[step.id].error_details && aiFeedbacks[step.id].error_details.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Errors Detected</p>
                    {aiFeedbacks[step.id].error_details.map((err, idx) => (
                      <div key={idx} className="rounded-xl border border-red-100 bg-white p-4 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-red-400"></div>
                        <p className="text-[14px] text-slate-700 mb-2">
                          <span className="font-semibold text-red-600">Issue:</span> {err.message}
                        </p>
                        {err.replacements && err.replacements.length > 0 && (
                          <p className="text-[14px] text-slate-700">
                            <span className="font-semibold text-emerald-600">Suggestion:</span> Change to <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">{err.replacements.join(', ')}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Great job! No grammar issues found in your sentence.
                    </p>
                  </div>
                )}
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