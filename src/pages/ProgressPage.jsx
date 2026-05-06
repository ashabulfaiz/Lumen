import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { levelTracks, getLessonsWithStatus, loadLearningProgress, LEARNING_PROGRESS_EVENT } from '../data/learningData.js'
import { IconCheckCircle, IconClock, IconLock, IconChevronDown } from '../components/Icons.jsx'


function percentFromStatus(status) {
  if (status === 'completed') return 100
  return 0
}

const barTone = {
  done: 'bg-green-600',
  doing: 'bg-blue-500',
  todo: 'bg-slate-300',
}

const pillTone = {
  done: 'border-green-200 bg-green-50 text-green-700',
  doing: 'border-blue-200 bg-blue-50 text-blue-700',
  todo: 'border-slate-200 bg-slate-50 text-slate-600',
}

export default function ProgressPage() {
  const navigate = useNavigate()
  const [expandedLevels, setExpandedLevels] = useState({})
  const [progress, setProgress] = useState(loadLearningProgress())

  useEffect(() => {
    const handleProgress = () => setProgress(loadLearningProgress())
    window.addEventListener(LEARNING_PROGRESS_EVENT, handleProgress)
    return () => window.removeEventListener(LEARNING_PROGRESS_EVENT, handleProgress)
  }, [])

  const toggleLevel = (trackNum) => {
    setExpandedLevels(prev => ({
      ...prev,
      [trackNum]: !prev[trackNum]
    }))
  }

  const INITIAL_VISIBLE_LESSONS = 3

  return (
    <div className="mx-auto max-w-[980px] font-sans">
      <header className="mb-6 px-1">
        <div>
          <h1 className="mb-1.5 text-2xl font-bold text-slate-900">Course Progress</h1>
          <p className="m-0 text-[15px] text-slate-600">Your learning progress throughout the program.</p>
        </div>
      </header>

      <div className="flex flex-col gap-5" aria-label="Course progress by level">
        {levelTracks.map((track) => {
          const slug = track.title.toLowerCase()
          const isLevelLocked = track.num > (progress?.highestUnlocked ?? 1)
          const baseLessons = getLessonsWithStatus(slug, progress)
          if (!baseLessons.length) return null
          const lessons = isLevelLocked ? baseLessons.map((l) => ({ ...l, status: 'locked' })) : baseLessons
          const isExpanded = expandedLevels[track.num]
          const visibleLessons = isExpanded ? lessons : lessons.slice(0, INITIAL_VISIBLE_LESSONS)
          const hasMore = lessons.length > INITIAL_VISIBLE_LESSONS

          return (
            <section
              key={track.num}
              className={`overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm ${
                isLevelLocked ? 'opacity-70' : ''
              }`}
            >
              <div className="border-b border-slate-100 p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="mb-1.5 text-[22px] font-bold text-slate-900">{track.title}</h2>
                  {isLevelLocked && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-500">
                      Locked
                    </span>
                  )}
                </div>
                <p className="m-0 text-[15px] text-slate-500">{track.summary}</p>
                {isLevelLocked && (
                  <p className="mt-2 text-[13px] font-medium text-slate-500">
                    Complete your current level to unlock this track.
                  </p>
                )}
              </div>

              <div
                className="flex flex-col"
                aria-label={`${track.title} progress list`}
              >
                {visibleLessons.map((lesson) => {
                  const percent = percentFromStatus(lesson.status)
                  const isLocked = lesson.status === 'locked'
                  const isCompleted = lesson.status === 'completed'
                  const statusInfo =
                    isCompleted
                      ? { label: 'Completed', variant: 'done', icon: IconCheckCircle }
                      : lesson.status === 'available'
                        ? { label: 'In progress', variant: 'doing', icon: IconClock }
                        : { label: 'Locked', variant: 'todo', icon: IconLock }

                  const StatusIcon = statusInfo.icon

                  return (
                    <article
                      key={`${track.title}-${lesson.id}`}
                      className="border-b border-slate-100 p-6 md:px-8 md:py-6 last:border-b-0"
                    >
                      <button
                        type="button"
                        disabled={isLocked}
                        aria-disabled={isLocked}
                        onClick={() => {
                          if (isLocked) return
                          const levelSlug = track.title.toLowerCase()
                          navigate(`/learning/${levelSlug}/lesson/${lesson.id}`)
                        }}
                        className={[
                          'w-full rounded-2xl text-left outline-none transition',
                          'cursor-pointer',
                          'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                          'disabled:cursor-not-allowed disabled:opacity-70',
                          isCompleted ? 'hover:bg-green-50/60' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-[16px] font-bold text-slate-900">{lesson.title}</h3>
                            <p className="mb-0 text-[14px] text-slate-500">{lesson.description}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-4" aria-label={`${percent}%`}>
                            <span className="min-w-[42px] text-right text-[14px] font-semibold text-slate-800">{percent}%</span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium ${pillTone[statusInfo.variant]}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
                          <div
                            className={`h-full rounded-full transition-[width] ${barTone[statusInfo.variant]}`}
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          />
                        </div>
                      </button>
                    </article>
                  )
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center border-t border-slate-100 p-5">
                  <button
                    type="button"
                    aria-expanded={!!isExpanded}
                    onClick={() => {
                      if (isLevelLocked) return
                      toggleLevel(track.num)
                    }}
                    disabled={isLevelLocked}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-colors ${
                      isLevelLocked
                        ? 'cursor-not-allowed bg-slate-50 text-slate-400'
                        : `cursor-pointer ${isExpanded
                            ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`
                    }`}
                  >
                    {isExpanded ? 'Show less' : 'Show all courses'}
                    <IconChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
