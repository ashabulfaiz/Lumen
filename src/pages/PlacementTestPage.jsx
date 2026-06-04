import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axiosInstance'

// const placementQuestions = [
//   { id: 1, prompt: 'What is the past tense of "go"?', options: ['goed', 'went', 'gone', 'going'], answer: 'went', explanation: '"Went" is the irregular past tense form of the verb "go".' },
//   { id: 2, prompt: 'Choose the correct sentence.', options: ['She do her homework.', 'She does her homework.', 'She doing her homework.', 'She done her homework.'], answer: 'She does her homework.', explanation: 'For third-person singular subjects (he/she/it) in the present simple tense, we use "does".' },
//   { id: 3, prompt: 'Which word is a synonym of "rapid"?', options: ['Slow', 'Fast', 'Late', 'Heavy'], answer: 'Fast', explanation: '"Rapid" means happening in a short time or at a great rate, which is synonymous with "fast".' },
//   { id: 4, prompt: 'Fill in the blank: They ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'go', explanation: 'With the pronoun "they", the base form of the verb "go" is used in the present simple tense.' },
//   { id: 5, prompt: 'Which one is a noun?', options: ['Beautiful', 'Run', 'Happiness', 'Quickly'], answer: 'Happiness', explanation: '"Happiness" is a state of being, making it a noun. The others are an adjective, verb, and adverb.' },
//   { id: 6, prompt: 'Choose the best response: "How are you?"', options: ['I am fine, thank you.', 'I am in the class.', 'I was yesterday.', 'I have a book.'], answer: 'I am fine, thank you.', explanation: 'This is the standard polite response to an inquiry about one\'s well-being.' },
//   { id: 7, prompt: 'Pick the correct preposition: "She is interested ___ music."', options: ['at', 'in', 'on', 'to'], answer: 'in', explanation: 'The adjective "interested" is always followed by the preposition "in".' },
//   { id: 8, prompt: 'What is the opposite of "difficult"?', options: ['Hard', 'Simple', 'Complex', 'Strong'], answer: 'Simple', explanation: '"Simple" means easily understood or done, which is the direct opposite of "difficult".' },
//   { id: 9, prompt: 'Which sentence uses the future tense?', options: ['I eat breakfast.', 'I ate breakfast.', 'I am eating breakfast.', 'I will eat breakfast.'], answer: 'I will eat breakfast.', explanation: 'The auxiliary verb "will" indicates an action that will happen in the future.' },
//   { id: 10, prompt: 'Choose the correct article: "___ apple a day keeps the doctor away."', options: ['A', 'An', 'The', 'No article'], answer: 'An', explanation: 'We use "an" before singular countable nouns that begin with a vowel sound.' },
// ]

export default function PlacementTestPage() {
  const navigate = useNavigate()
  
  const [placementQuestions, setPlacementQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)

  const [savedData] = useState(() => {
    try {
      const data = localStorage.getItem('lumen_placement_result')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  })

  const [selectedOptions, setSelectedOptions] = useState(savedData?.selectedOptions || {})
  const [result, setResult] = useState(savedData?.result || null)
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get('/placement/questions');
        setPlacementQuestions(response.data.data);
      } catch (error) {
        console.error("Failed to fetch placement questions from the database:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const question = placementQuestions[currentIndex];
  const selectedOption = question ? selectedOptions[question.id] : null;
  const canProceed = useMemo(() => selectedOption != null, [selectedOption]);
  
  const totalQuestions = placementQuestions.length;
  const progressPercentage = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const nextLabel = isLastQuestion ? 'Finish' : 'Next';

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60 duration-1000"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          </div>
          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Setting up assessment...</h2>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-slate-500">
            Curating questions to find your perfect starting level.
          </p>
        </div>
      </div>
    )
  }

  if (!placementQuestions || placementQuestions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center font-sans text-center">
        <p className="mb-4 text-lg font-bold text-slate-800">Exam questions not available in the database.</p>
        <button onClick={() => navigate('/learning/introduction')} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700">
          Back
        </button>
      </div>
    )
  }

  const handleSelect = (option) => {
    setSelectedOptions((prev) => ({ ...prev, [question.id]: option }))
  }

  const handleNext = async () => {
    if (!canProceed) return
    
    if (isLastQuestion) {
      // Score per difficulty band (1=beginner, 2=intermediate, 3=advanced) so the
      // recommendation reflects competence at a level, not just a raw total.
      const band = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } }
      placementQuestions.forEach((item) => {
        const d = band[item.difficulty] ? item.difficulty : 1
        band[d].total += 1
        if (selectedOptions[item.id] === item.answer) band[d].correct += 1
      })

      const correctAnswers = band[1].correct + band[2].correct + band[3].correct
      const score = Math.round((correctAnswers / totalQuestions) * 100)
      const overall = correctAnswers / totalQuestions
      const bandRatio = (d) => (band[d].total ? band[d].correct / band[d].total : 0)

      // Advanced needs solid advanced-band performance AND a strong overall score;
      // Intermediate needs decent intermediate-band performance AND a fair overall;
      // otherwise the learner starts at Beginner.
      let recommendedLevel = 1
      if (bandRatio(3) >= 0.6 && overall >= 0.7) {
        recommendedLevel = 3
      } else if (bandRatio(2) >= 0.6 && overall >= 0.5) {
        recommendedLevel = 2
      }

      const testResult = { correctAnswers, score, recommendedLevel }
      setResult(testResult)

      try {
        localStorage.setItem('lumen_placement_result', JSON.stringify({
          result: testResult,
          selectedOptions
        }))
      } catch (e) {
        console.error('Failed to save placement result locally:', e)
      }

      try {
        await api.post('/placement/save-result', {
            score: score,
            recommendedLevel: recommendedLevel,
            answers: selectedOptions
        });
        console.log("Placement results successfully sent to the database!");
      } catch (error) {
        console.error("Failed to send placement results to the database:", error);
      }

      import('../data/learningData.js').then(({ loadLearningProgress, saveLearningProgress }) => {
        const progress = loadLearningProgress()
        // Placement is authoritative: it sets the ceiling of unlocked levels.
        // A previously chosen level above the new ceiling is cleared.
        const chosen =
          progress.chosenLevel && progress.chosenLevel <= recommendedLevel ? progress.chosenLevel : null
        saveLearningProgress(chosen, recommendedLevel, true)
      }).catch(console.error)

      return
    }
    setCurrentIndex((prev) => prev + 1)
  }

  const handlePrev = () => {
    if (currentIndex === 0) {
      navigate('/learning/placement')
      return
    }
    setCurrentIndex((prev) => prev - 1)
  }

  if (result) {
    if (showReview) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 font-sans">
          <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center md:p-8">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Review Your Answers</h1>
              <p className="mt-2 text-[16px] text-slate-600">
                You got <span className="font-bold text-slate-900">{result.correctAnswers}</span> out of <span className="font-bold text-slate-900">{totalQuestions}</span> questions correct
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => setShowReview(false)}
            >
              Back to Placement Test
            </button>
          </section>

          <div className="space-y-6">
            {placementQuestions.map((q, i) => {
              const userAns = selectedOptions[q.id]
              const isCorrect = userAns === q.answer

              return (
                <div key={q.id} className={`rounded-2xl border-2 bg-white p-5 sm:p-6 ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
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

                  <p className="mb-5 text-[15px] text-slate-700">{q.prompt}</p>

                  <div className="space-y-3">
                    {q.options.map((opt) => {
                      const isSelected = userAns === opt
                      const isRightAnswer = q.answer === opt

                      let borderClass = "border border-slate-200"
                      let textClass = "text-slate-700"
                      let rightIcon = null

                      if (isRightAnswer) {
                        borderClass = "border-2 border-emerald-500 bg-white"
                        textClass = "text-emerald-800 font-medium"
                        rightIcon = (
                          <div className="shrink-0 text-emerald-500">
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
                    <span className="font-bold text-slate-900">Explanation:</span> {q.explanation}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-4 text-center">
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

    const levelName = result.recommendedLevel === 3 ? 'Advanced' : result.recommendedLevel === 2 ? 'Intermediate' : 'Beginner'

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-[30px] font-bold tracking-tight text-slate-900">Placement Test Result</h1>
          <p className="mt-2 text-slate-600">Here is the score from the answers you submitted.</p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Final Score</p>
            <p className="mt-1 text-4xl font-bold text-indigo-600">{result.score}</p>
            <p className="mt-2 text-sm text-slate-600">
              Correct answers: {result.correctAnswers} of {totalQuestions}
            </p>
            <p className="mt-4 text-[15px] font-medium text-slate-700">
              Recommended Level: <span className="font-bold text-indigo-600">{levelName}</span>
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate('/learning/placement')}
            >
              Back to Placement Test
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
            <h1 className="text-[30px] font-bold tracking-tight text-slate-900">English Placement Test</h1>
            <p className="text-sm text-slate-500">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <p className="mb-5 text-xl font-semibold text-slate-900">{question.prompt}</p>
        <div className="space-y-3">
          {question.options.map((option) => {
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

        <div className="mt-7 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2 py-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
              onClick={handlePrev}
            >
              <span aria-hidden>‹</span>
              Previous
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              {placementQuestions.map((item, idx) => {
                const answered = selectedOptions[item.id] != null
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
              className={`inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium transition ${canProceed ? 'text-indigo-600 hover:text-indigo-700' : 'cursor-not-allowed text-slate-300'
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