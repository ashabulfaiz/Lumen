import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconSparkle, IconClock, IconChevronRight } from '../components/Icons.jsx'
import { LEARNING_PROGRESS_KEY, levelTracks, unitsByLevel } from '../data/learningData.js'

const pathSteps = [
  {
    id: 'intro',
    title: 'Introduction',
    description:
      'Short onboarding that explains how the course works, how to track progress, and how to get help when you are stuck.',
    cta: 'Start here',
  },
  {
    id: 'placement',
    title: 'Placement test',
    description:
      'A quick skills check so we can suggest a starting level. You can skip it and pick a level below that matches your ability.',
    cta: 'Take placement',
  },
  {
    id: 'level-flow',
    title: 'Choose your level',
    description:
      'Select Level 1, 2, or 3 based on your skills. You can study every level up to the one you choose; the next level stays locked until you complete your current top level.',
    cta: 'See levels',
  },
  {
    id: 'quiz',
    title: 'Quizzes & practice',
    description:
      'Short checks after each unit plus mixed review sets to reinforce what you have learned.',
    cta: 'View practice',
  },
]

function loadProgress() {
  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (
      typeof data?.chosenLevel === 'number' &&
      data.chosenLevel >= 1 &&
      data.chosenLevel <= 3 &&
      typeof data?.highestUnlocked === 'number' &&
      data.highestUnlocked >= 1 &&
      data.highestUnlocked <= 3
    ) {
      return { chosenLevel: data.chosenLevel, highestUnlocked: data.highestUnlocked }
    }
  } catch {
    /* ignore */
  }
  return null
}

function saveProgress(chosenLevel, highestUnlocked) {
  try {
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify({ chosenLevel, highestUnlocked }))
  } catch {
    /* ignore */
  }
}

function initialProgressState() {
  const saved = loadProgress()
  return {
    chosenLevel: saved?.chosenLevel ?? null,
    highestUnlocked: saved?.highestUnlocked ?? 1,
  }
}

const pillClass = {
  Foundation: 'bg-emerald-100 text-emerald-800',
  Intermediate: 'bg-amber-100 text-amber-800',
  Advanced: 'bg-violet-100 text-violet-800',
}

export default function LearningPage() {
  const [{ chosenLevel, highestUnlocked }, setProgress] = useState(initialProgressState)

  const jumpTo = useCallback((id) => {
    if (!id) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    if (chosenLevel == null) return
    saveProgress(chosenLevel, highestUnlocked)
  }, [chosenLevel, highestUnlocked])

  const pickLevel = useCallback((n) => {
    setProgress({ chosenLevel: n, highestUnlocked: n })
  }, [])

  const completeCurrentTop = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      highestUnlocked: Math.min(3, prev.highestUnlocked + 1),
    }))
  }, [])

  const resetProgress = useCallback(() => {
    localStorage.removeItem(LEARNING_PROGRESS_KEY)
    setProgress({ chosenLevel: null, highestUnlocked: 1 })
  }, [])

  const canOpenLevel = (levelNum) => levelNum <= highestUnlocked
  const topActiveLevel = highestUnlocked
  const showCompleteButton = chosenLevel != null && topActiveLevel < 3

  return (
    <div className="mx-auto max-w-[880px] pb-12 pt-2 font-sans">
      <header className="mb-9">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">General English</p>
        <h1 className="mb-3 text-[clamp(1.5rem,3vw,1.875rem)] font-bold tracking-tight text-slate-900">
          Your learning path
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-slate-600">
          LUMEN is built for English only: every unit, quiz, and recommendation focuses on real-world English skills — not
          other languages.
        </p>
      </header>

      <section className="mb-10" aria-labelledby="path-heading">
        <h2 id="path-heading" className="mb-4 text-lg font-bold text-slate-900">
          How the course flows
        </h2>
        <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
          {pathSteps.map((step, index) => (
            <li
              key={step.id}
              id={step.id}
              className="flex scroll-mt-6 gap-4 rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-4 shadow-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-sm font-bold text-blue-600"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1.5 text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mb-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                <button
                  type="button"
                  className="mt-0.5 inline-flex items-center justify-center rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 active:translate-y-px"
                  onClick={() => jumpTo(step.id === 'level-flow' ? 'levels' : step.id)}
                >
                  {step.cta}
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="mb-10 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
        id="levels"
        aria-labelledby="level-pick-heading"
      >
        <h2 id="level-pick-heading" className="mb-4 text-lg font-bold text-slate-900">
          Choose your level
        </h2>
        <p className="mb-4 max-w-[68ch] text-sm leading-relaxed text-slate-600">
          Pick the tier that matches your ability. You can open all units from Level 1 up to the level you select. The next
          level stays <strong className="font-semibold text-slate-700">locked</strong> until you finish everything at your
          current top level (demo: use &quot;Mark level complete&quot;).
        </p>

        <div className="mb-4 grid gap-3 sm:grid-cols-3" role="group" aria-label="Select starting level">
          {levelTracks.map((L) => {
            const selected = chosenLevel === L.num
            return (
              <button
                key={L.num}
                type="button"
                className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left font-sans transition ${
                  selected
                    ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_1px_rgba(37,99,235,0.2)]'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white'
                }`}
                onClick={() => pickLevel(L.num)}
                aria-pressed={selected}
              >
                <span className="text-base font-bold text-slate-900">{L.title}</span>
                <span className="text-[13px] leading-snug text-slate-600">{L.summary}</span>
              </button>
            )
          })}
        </div>

        {chosenLevel != null && (
          <p className="mb-4 rounded-[10px] border border-slate-200 bg-slate-100 px-3.5 py-3 text-sm text-slate-800">
            Unlocked: Level 1–{highestUnlocked}.{' '}
            {highestUnlocked < 3 ? (
              <>
                Level {highestUnlocked + 1} is locked until you complete Level {highestUnlocked}.
              </>
            ) : (
              <>All levels are open.</>
            )}
          </p>
        )}

        {chosenLevel != null && showCompleteButton && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="m-0 min-w-[200px] flex-1 text-sm text-slate-600">
              Finished all units at <strong className="text-slate-800">Level {topActiveLevel}</strong>? Unlock the next tier.
            </p>
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={completeCurrentTop}
            >
              Mark level {topActiveLevel} complete
            </button>
          </div>
        )}

        <p className="m-0 mt-2">
          <button type="button" className="text-[13px] text-slate-400 underline-offset-2 hover:text-slate-600" onClick={resetProgress}>
            Reset level choice &amp; progress
          </button>
        </p>
      </section>

      <section className="mb-10" aria-labelledby="units-heading">
        <div className="mb-2 flex items-center gap-2.5">
          <IconSparkle className="h-5 w-5 shrink-0 text-blue-600" />
          <h2 id="units-heading" className="text-lg font-bold text-slate-900">
            Units by level
          </h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-600">
          {chosenLevel == null
            ? 'Select a level above to see which units you can open.'
            : 'Locked levels are blurred until you complete your current top level.'}
        </p>

        <div className="flex flex-col gap-7">
          {levelTracks.map((track) => {
            const open = chosenLevel != null && canOpenLevel(track.num)
            const units = unitsByLevel[track.num]
            const locked = chosenLevel != null && !open
            const needsPick = chosenLevel == null

            return (
              <button
                key={track.num}
                id={`level-${track.num}`}
                type="button"
                className={`block w-full scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left font-sans shadow-sm transition hover:border-blue-200 hover:shadow-md active:translate-y-px ${
                  !open ? 'relative cursor-not-allowed opacity-[0.55]' : ''
                }`}
                onClick={() => {
                  if (needsPick || locked) {
                    jumpTo('levels')
                    return
                  }
                  jumpTo(`level-${track.num}`)
                }}
                aria-label={
                  needsPick
                    ? `${track.title}. Pick a level to unlock units.`
                    : locked
                      ? `${track.title}. Locked. Go to choose your level.`
                      : `${track.title}. Open.`
                }
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 text-[17px] font-bold text-slate-900">{track.title}</h3>
                  {!open && chosenLevel != null && (
                    <span
                      className="rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700"
                      title="Complete your current top level to unlock"
                    >
                      Locked
                    </span>
                  )}
                  {chosenLevel == null && (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Pick a level
                    </span>
                  )}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">{track.summary}</p>

                <ul className="m-0 mt-1 grid list-none gap-4 p-0 sm:grid-cols-2">
                  {units.map((unit) => (
                    <li key={unit.title}>
                      <article
                        className={`flex h-full flex-col rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm ${!open ? 'grayscale-[0.2]' : ''}`}
                      >
                        <h4 className="mb-2 text-[15px] font-semibold text-slate-900">{unit.title}</h4>
                        <p className="mb-3.5 flex-1 text-[13px] leading-relaxed text-slate-600">{unit.subtitle}</p>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${pillClass[unit.tag] || 'bg-slate-100 text-slate-700'}`}
                          >
                            {unit.tag}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600">
                            <IconClock className="h-4 w-4" />
                            {unit.duration}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400">
                            {open ? 'Start lesson (coming soon)' : 'Unlock by progressing'}
                          </span>
                          <IconChevronRight className="h-[18px] w-[18px] shrink-0 text-slate-300" />
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </section>

      <p className="mt-8">
        <Link
          to="/dashboard"
          className="inline-flex rounded-xl border-2 border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}
