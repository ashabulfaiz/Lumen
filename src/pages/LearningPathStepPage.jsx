import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  clearLearningProgress,
  getLevelPath,
  levelTracks,
  loadLearningProgress,
  saveLearningProgress,
} from '../data/learningData.js'

const stepContentByPath = {
  '/learning/introduction': {
    title: 'Introduction',
    description:
      'Welcome to LUMEN learning flow. This short onboarding explains how units work, where to monitor your progress, and how to stay consistent each day.',
    points: [
      'Follow unit order from the level you unlock.',
      'Check dashboard metrics to monitor your improvement.',
      'Use help resources whenever a topic feels difficult.',
    ],
    nextPath: '/learning/placement',
    nextLabel: 'Next: Placement Test',
  },
  '/learning/placement': {
    title: 'Placement Test',
    description:
      'Kerjakan 10 soal untuk mengukur kemampuan awal kamu. Hasilnya akan menampilkan score dan rekomendasi level belajar.',
    points: [
      'Assessment is short and practical.',
      'Result gives a recommended starting level.',
      'You can adjust your level choice anytime later.',
    ],
    prevPath: '/learning/introduction',
    prevLabel: 'Previous: Introduction',
    nextPath: '/learning/levels',
    nextLabel: 'Next: Choose Your Level',
  },
  '/learning/levels': {
    title: 'Choose Your Level',
    description:
      'Pick the level that matches your current English ability. Higher levels stay locked until you complete your current top level.',
    prevPath: '/learning/placement',
    prevLabel: 'Previous: Placement Test',
  },
}

export default function LearningPathStepPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const content = stepContentByPath[pathname] ?? stepContentByPath['/learning/introduction']
  const isLevelChooserPage = pathname === '/learning/levels'
  const isPlacementPage = pathname === '/learning/placement'
  const [{ chosenLevel, highestUnlocked, placementCompleted }, setProgress] = useState(initialProgressState)

  useEffect(() => {
    if (!isLevelChooserPage || chosenLevel == null) return
    saveLearningProgress(chosenLevel, highestUnlocked, placementCompleted)
  }, [chosenLevel, highestUnlocked, placementCompleted, isLevelChooserPage])

  const pickLevel = (n) => {
    if (!placementCompleted || n > highestUnlocked) return
    setProgress((prev) => ({ ...prev, chosenLevel: n }))
    navigate(getLevelPath(n))
  }
  const completeCurrentTop = () =>
    setProgress((prev) => ({
      ...prev,
      highestUnlocked: Math.min(3, prev.highestUnlocked + 1),
    }))
  const resetProgress = () => {
    clearLearningProgress()
    setProgress({ chosenLevel: null, highestUnlocked: 1, placementCompleted: false })
  }

  const topActiveLevel = highestUnlocked
  const showCompleteButton = chosenLevel != null && topActiveLevel < 3

  const levelName = useMemo(() => {
    const map = new Map(levelTracks.map((track) => [track.num, track.title]))
    return (n) => map.get(n) || `Level ${n}`
  }, [])

  const unlockedLabel = useMemo(() => {
    if (chosenLevel == null) return 'Choose a level to unlock your study path.'
    if (highestUnlocked <= 1) {
      return `Unlocked: ${levelName(1)}. ${levelName(2)} is locked until you complete ${levelName(1)}.`
    }
    if (highestUnlocked === 2) {
      return `Unlocked: ${levelName(1)}, ${levelName(2)}. ${levelName(3)} is locked until you complete ${levelName(2)}.`
    }
    return `Unlocked: ${levelName(1)}, ${levelName(2)}, ${levelName(3)}. All levels are open.`
  }, [chosenLevel, highestUnlocked, levelName])

  return (
    <div className={`mx-auto px-4 py-8 font-sans ${isLevelChooserPage || isPlacementPage ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        
        <header className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">Learning path</p>
          <h1 className="mb-3 text-[26px] font-bold tracking-tight text-slate-900">{content.title}</h1>
          <p className="max-w-prose text-[15px] leading-relaxed text-slate-600">{content.description}</p>
        </header>

        {isLevelChooserPage ? (
          <section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7"
            aria-labelledby="level-pick-heading"
          >
            <h2 id="level-pick-heading" className="mb-3 text-[28px] font-bold tracking-tight text-slate-900">
              Choose your level
            </h2>
            <p className="mb-6 max-w-[62ch] text-[15px] leading-relaxed text-slate-600">
              Pick the tier that matches your ability. You can open all units from {levelName(1)} up to the level you
              select. The next level stays locked until you complete everything at your current top level.
            </p>

            <div className="grid gap-4 lg:grid-cols-3" role="group" aria-label="Select starting level">
              {levelTracks.map((level) => {
                const isLocked = !placementCompleted || level.num > highestUnlocked
                const selected = !isLocked && chosenLevel === level.num
                return (
                  <button
                    key={level.num}
                    type="button"
                    className={`rounded-2xl border px-5 py-4 text-left transition ${isLocked
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70'
                        : 'cursor-pointer'
                      } ${selected
                        ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_1px_rgba(99,102,241,0.22)]'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      }`}
                    onClick={() => pickLevel(level.num)}
                    aria-pressed={selected}
                    disabled={isLocked}
                  >
                    <div className="mb-2 text-[26px] font-bold text-slate-900">{level.title}</div>
                    <p className="text-sm leading-relaxed text-slate-600">{level.summary}</p>
                    {isLocked && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Locked</p>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {unlockedLabel}
            </div>

            {chosenLevel != null && showCompleteButton && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Finished all units at <strong className="text-slate-800">{levelName(topActiveLevel)}</strong>? Unlock
                  the next tier.
                </p>
                <button
                  type="button"
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                  onClick={completeCurrentTop}
                >
                  Mark {levelName(topActiveLevel)} complete
                </button>
              </div>
            )}

            <button
              type="button"
              className="mt-5 cursor-pointer text-sm text-slate-400 underline-offset-2 hover:text-slate-600"
              onClick={resetProgress}
            >
              Reset level choice &amp; progress
            </button>
          </section>
        ) : isPlacementPage ? (
          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl p-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">◷</span>
                <div>
                  <p className="text-[15px] font-medium text-slate-800">Duration</p>
                  <p className="text-xs text-slate-500">~10-15 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">⎔</span>
                <div>
                  <p className="text-[15px] font-medium text-slate-800">Questions</p>
                  <p className="text-xs text-slate-500">10 questions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">◎</span>
                <div>
                  <p className="text-[15px] font-medium text-slate-800">Level Assessment</p>
                  <p className="text-xs text-slate-500">Beginner to Advanced</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-5">
              <h2 className="mb-4 text-[28px] font-bold tracking-tight text-slate-900">What You&apos;ll Get</h2>
              <ul className="m-0 list-none space-y-3 p-0 text-[15px] text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-slate-400">›</span>
                  <span>
                    Questions covering vocabulary, grammar, and reading comprehension to measure your language skills
                    comprehensively
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-slate-400">›</span>
                  <span>
                    Automatic learning level recommendations based on your score to start learning from the right point
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-slate-400">›</span>
                  <span>
                    Complete this assessment to unlock your personalized learning path and access all course materials
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {placementCompleted ? (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-base font-semibold text-slate-400 cursor-not-allowed"
                    disabled
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Completed
                  </button>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-indigo-600 bg-white px-6 py-[10px] text-base font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                    onClick={() => navigate('/learning/placement/test')}
                  >
                    Review Result
                    <span aria-hidden>›</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                  onClick={() => navigate('/learning/placement/test')}
                >
                  Start Placement Test
                  <span aria-hidden>›</span>
                </button>
              )}
            </div>
          </section>
        ) : (
          <ul className="mb-7 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            {content.points.map((point) => (
              <li key={point}>- {point}</li>
            ))}
          </ul>
        )}

        <div className={`flex items-center justify-between gap-4 ${isPlacementPage ? 'flex-wrap pt-1' : 'flex-wrap'}`}>
          <Link
            to={isPlacementPage ? '/learning/introduction' : '/learning'}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl ${isPlacementPage
                ? 'rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50'
                : 'border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50'
              }`}
          >
            {isPlacementPage ? (
              content.prevLabel || 'Previous'
            ) : (
              'Back to learning page'
            )}
          </Link>
          {content.prevPath && !isPlacementPage && (
            <Link
              to={content.prevPath}
              className="inline-flex cursor-pointer rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
            >
              {content.prevLabel || 'Previous'}
            </Link>
          )}
          {isPlacementPage ? (
            <Link
              to="/learning/levels"
              className="inline-flex cursor-pointer items-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white no-underline shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
            >
              {content.nextLabel || 'Next'}
            </Link>
          ) : content.nextPath ? (
            <Link
              to={content.nextPath}
              className="inline-flex cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
            >
              {content.nextLabel || 'Next'}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function initialProgressState() {
  const saved = loadLearningProgress()
  const safeHighestUnlocked = saved?.highestUnlocked ?? 1
  const safeChosenLevel =
    saved?.chosenLevel != null && saved.chosenLevel <= safeHighestUnlocked ? saved.chosenLevel : null

  return {
    chosenLevel: safeChosenLevel,
    highestUnlocked: safeHighestUnlocked,
    placementCompleted: !!saved?.placementCompleted,
  }
}
