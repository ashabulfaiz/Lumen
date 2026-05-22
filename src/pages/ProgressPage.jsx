import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCheckCircle, IconClock, IconLock, IconChevronDown } from '../components/Icons.jsx'
import api from '../lib/axiosInstance'

const LEVEL_TRACKS = [
  { num: 1, slug: 'beginner', title: 'Beginner', summary: 'Master the essentials and build your foundation' },
  { num: 2, slug: 'intermediate', title: 'Intermediate', summary: 'Expand your vocabulary and master complex structures' },
  { num: 3, slug: 'advanced', title: 'Advanced', summary: 'Achieve fluency and understand subtle nuances' }
]

function percentFromStatus(status) {
  if (status === 'completed') return 100
  return 0
}

const barTone = {
  done: 'bg-green-600',
  doing: 'bg-indigo-500',
  todo: 'bg-slate-300',
}

const pillTone = {
  done: 'border-green-200 bg-green-50 text-green-700',
  doing: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  todo: 'border-slate-200 bg-slate-50 text-slate-600',
}

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}

export default function ProgressPage() {
  const navigate = useNavigate()
  const [expandedLevels, setExpandedLevels] = useState({})
  
  const [tracks, setTracks] = useState([])
  const [completedLessonIds, setCompletedLessonIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        const fetchedTracks = []
        let fetchedCompletedIds = []

        await Promise.all(LEVEL_TRACKS.map(async (track) => {
            const coursesRes = await api.get(`/learning/courses/${track.num}`)
            const courses = coursesRes.data.data || []
            let trackLessons = []
            for (const course of courses) {
                const lessonsRes = await api.get(`/learning/lessons/${course.id}`)
                trackLessons.push(...(lessonsRes.data.data || []))
            }
            
            fetchedTracks.push({ ...track, lessons: trackLessons })

            try {
                const progRes = await api.get(`/progress/completed/${track.num}`)
                if (progRes.data.data) {
                    fetchedCompletedIds.push(...progRes.data.data)
                }
            } catch (e) {
                console.error(`Gagal memuat progres level ${track.num}`, e)
            }
        }))

        fetchedTracks.sort((a, b) => a.num - b.num)

        setTracks(fetchedTracks)
        setCompletedLessonIds(fetchedCompletedIds)
      } catch (error) {
        console.error("Gagal memuat data dari database:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const processedData = useMemo(() => {
    if (tracks.length === 0) return { highestUnlockedLevel: 1, processedTracks: [] }

    const allLessonsFlat = tracks.flatMap(t => t.lessons)
    let highestUnlockedLevel = 1

    const processedTracks = tracks.map((track) => {
        const lessonsWithStatus = track.lessons.map((lesson) => {
            const globalIndex = allLessonsFlat.findIndex(l => l.id === lesson.id)
            const isCompleted = completedLessonIds.includes(lesson.id)
            
            let isAvailable = false
            if (globalIndex === 0) {
                isAvailable = true 
            } else if (isCompleted) {
                isAvailable = true 
            } else {
                const prevLesson = allLessonsFlat[globalIndex - 1]
                if (prevLesson && completedLessonIds.includes(prevLesson.id)) {
                    isAvailable = true
                }
            }

            if (isAvailable || isCompleted) {
                highestUnlockedLevel = Math.max(highestUnlockedLevel, track.num)
            }

            return {
                ...lesson,
                status: isCompleted ? 'completed' : (isAvailable ? 'available' : 'locked')
            }
        })

        return { ...track, lessons: lessonsWithStatus }
    })

    return { highestUnlockedLevel, processedTracks }
  }, [tracks, completedLessonIds])


  const toggleLevel = (trackNum) => {
    setExpandedLevels(prev => ({
      ...prev,
      [trackNum]: !prev[trackNum]
    }))
  }

  const INITIAL_VISIBLE_LESSONS = 3
  const { highestUnlockedLevel, processedTracks } = processedData

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-lg font-medium text-slate-500">Memuat progres belajar Anda...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[980px] font-sans">
      <header className="mb-6 px-1">
        <div>
          <h1 className="mb-1.5 text-2xl font-bold text-slate-900">Course Progress</h1>
          <p className="m-0 text-[15px] text-slate-600">Your learning progress throughout the program.</p>
        </div>
      </header>

      <div className="flex flex-col gap-5" aria-label="Course progress by level">
        {processedTracks.map((track) => {
          const isLevelLocked = track.num > highestUnlockedLevel
          const baseLessons = track.lessons

          if (!baseLessons.length) return null
          const lessons = isLevelLocked 
              ? baseLessons.map((l) => ({ ...l, status: 'locked' })) 
              : baseLessons

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

              <div className="flex flex-col" aria-label={`${track.title} progress list`}>
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
                      key={`${track.slug}-${lesson.id}`}
                      className="border-b border-slate-100 p-6 md:px-8 md:py-6 last:border-b-0"
                    >
                      <button
                        type="button"
                        disabled={isLocked}
                        aria-disabled={isLocked}
                        onClick={() => {
                          if (isLocked) return
                          navigate(`/learning/${track.slug}/lesson/${lesson.id}`)
                        }}
                        className={[
                          'w-full rounded-2xl text-left outline-none transition',
                          'cursor-pointer',
                          'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                          'disabled:cursor-not-allowed disabled:opacity-70',
                          isCompleted ? 'hover:bg-green-50/60' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-[16px] font-bold text-slate-900">{lesson.judul_lesson}</h3>
                            <p className="mb-0 text-[14px] text-slate-500 line-clamp-1">
                                {stripHtml(lesson.konten_teks) || 'Materi pembelajaran modul ini.'}
                            </p>
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
                            ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'
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