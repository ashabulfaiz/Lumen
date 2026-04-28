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
      'Take a quick placement to estimate your starting level. If you skip it, you can still choose the level manually on the next step.',
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
  const [{ chosenLevel, highestUnlocked }, setProgress] = useState(initialProgressState)

  useEffect(() => {
    if (!isLevelChooserPage || chosenLevel == null) return
    saveLearningProgress(chosenLevel, highestUnlocked)
  }, [chosenLevel, highestUnlocked, isLevelChooserPage])

  const pickLevel = (n) => {
    if (n > highestUnlocked) return
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
    setProgress({ chosenLevel: null, highestUnlocked: 1 })
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
    <div className={`mx-auto px-4 py-8 font-sans ${isLevelChooserPage ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Learning path</p>
      <h1 className="mb-3 text-[26px] font-bold tracking-tight text-slate-900">{content.title}</h1>
      <p className="mb-6 text-[15px] leading-relaxed text-slate-600">{content.description}</p>

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
              const selected = chosenLevel === level.num
              const isLocked = level.num > highestUnlocked
              return (
                <button
                  key={level.num}
                  type="button"
                  className={`rounded-2xl border px-5 py-4 text-left transition ${
                    isLocked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70'
                      : ''
                  } ${
                    selected
                      ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
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
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                onClick={completeCurrentTop}
              >
                Mark {levelName(topActiveLevel)} complete
              </button>
            </div>
          )}

          <button
            type="button"
            className="mt-5 text-sm text-slate-400 underline-offset-2 hover:text-slate-600"
            onClick={resetProgress}
          >
            Reset level choice &amp; progress
          </button>
        </section>
      ) : (
        <ul className="mb-7 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {content.points.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/learning"
          className="inline-flex rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
        >
          Back to learning page
        </Link>
        {content.prevPath && (
          <Link
            to={content.prevPath}
            className="inline-flex rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
          >
            {content.prevLabel || 'Previous'}
          </Link>
        )}
        {content.nextPath && (
          <Link
            to={content.nextPath}
            className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-700"
          >
            {content.nextLabel || 'Next'}
          </Link>
        )}
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
  }
}
