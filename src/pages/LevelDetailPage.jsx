import { useEffect, useState, useMemo } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { IconLock, IconClock, IconCheckCircle, IconArrowRight, IconCollection } from '../components/Icons.jsx'
import api from '../lib/axiosInstance'

const LEVEL_THEMES = {
  beginner: {
    title: 'Beginner',
    description: 'Master the essentials and build your foundation',
    levelId: 1,
    shellBorder: 'border-emerald-200',
    shellBg: 'bg-[#f4fbf4]',
    badgeBg: 'bg-[#10b981]',
    badgeText: 'text-white',
    statText: 'text-emerald-800',
    progressBg: 'bg-[#10b981]',
    cardHover: 'hover:border-emerald-300',
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Expand your vocabulary and master complex structures',
    levelId: 2,
    shellBorder: 'border-blue-200',
    shellBg: 'bg-[#f4f8fb]',
    badgeBg: 'bg-[#3b82f6]',
    badgeText: 'text-white',
    statText: 'text-blue-800',
    progressBg: 'bg-[#3b82f6]',
    cardHover: 'hover:border-blue-300',
  },
  advanced: {
    title: 'Advanced',
    description: 'Achieve fluency and understand subtle nuances',
    levelId: 3,
    shellBorder: 'border-purple-200',
    shellBg: 'bg-[#fbf4fb]',
    badgeBg: 'bg-[#a855f7]',
    badgeText: 'text-white',
    statText: 'text-purple-800',
    progressBg: 'bg-[#a855f7]',
    cardHover: 'hover:border-purple-300',
  },
}

export default function LevelDetailPage() {
  const { pathname } = useLocation()
  const slug = pathname.split('/').pop()
  
  const themeConfig = LEVEL_THEMES[slug]

  const [courses, setCourses] = useState([])
  const [moduleStatusMap, setModuleStatusMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!themeConfig) return
      setLoading(true)
      setLoadError(null)
      try {
        const courseResponse = await api.get(`/learning/courses/${slug}`)
        const fetchedCourses = courseResponse.data.data || []

        const coursesWithLessons = await Promise.all(
          fetchedCourses.map(async (course) => {
            const lessonResponse = await api.get(`/learning/lessons/${course.id}`)
            return { ...course, lessons: lessonResponse.data.data || [] }
          }),
        )
        setCourses(coursesWithLessons)

        const statusResponse = await api.get(`/progress/module-status/${slug}`)
        const map = {}
        for (const row of statusResponse.data.data || []) {
          map[row.lesson_id] = row
        }
        setModuleStatusMap(map)
      } catch (error) {
        console.error('Failed to load data from the database:', error)
        setLoadError(error.response?.data?.message || 'Failed to load curriculum.')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, themeConfig])

  const allLessonsFlat = useMemo(() => courses.flatMap((c) => c.lessons), [courses])

  const getLessonStatus = (lessonId) => {
    const mod = moduleStatusMap[lessonId] || {
      quiz_completed: false,
      essay_completed: false,
      module_completed: false,
    }
    const currentIndex = allLessonsFlat.findIndex((l) => l.id === lessonId)

    let isAvailable = false
    if (currentIndex === 0) {
      isAvailable = true
    } else if (mod.module_completed) {
      isAvailable = true
    } else {
      const previousLesson = allLessonsFlat[currentIndex - 1]
      const prevMod = previousLesson ? moduleStatusMap[previousLesson.id] : null
      if (prevMod?.module_completed) {
        isAvailable = true
      }
    }

    return {
      quizCompleted: mod.quiz_completed,
      essayCompleted: mod.essay_completed,
      isCompleted: mod.module_completed,
      isAvailable,
      isLocked: !isAvailable,
    }
  }

  const isCourseUnlocked = (courseIndex) => {
    if (courseIndex === 0) return true
    const previousCourse = courses[courseIndex - 1]
    if (!previousCourse?.lessons?.length) return true
    return previousCourse.lessons.every((lesson) => {
      const mod = moduleStatusMap[lesson.id]
      return mod?.module_completed
    })
  }

  if (!themeConfig) return <Navigate to="/learning" replace />

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 font-sans">
        <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[2rem] border-2 border-slate-100 bg-white p-12 text-center shadow-sm">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60 duration-1000"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-inner border border-indigo-100">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          </div>
          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Preparing curriculum...</h2>
          <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-slate-500">
            Loading your modules and tracking your current completion status.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 font-sans space-y-8">
      {/* HEADER LEVEL */}
      <header className={`rounded-3xl border-2 ${themeConfig.shellBorder} ${themeConfig.shellBg} p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="space-y-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${themeConfig.badgeBg} ${themeConfig.badgeText}`}>
            {themeConfig.title} Level
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            {themeConfig.title} Curriculum
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-xl">
            {themeConfig.description}
          </p>
          <p className="text-xs text-slate-500 max-w-xl">
            Complete <strong>Quiz</strong> and <strong>Writing</strong> (grammar ≥ 60%) in each module to unlock the next module.
          </p>
        </div>
      </header>

      {/* CONTAINER KURSUS YANG SUDAH DIPISAH */}
      <div className="space-y-8">
        
        {courses.map((course, courseIndex) => {
          const courseLocked = !isCourseUnlocked(courseIndex)
          return (
          <section 
            key={course.id} 
            className={`rounded-3xl border-2 ${themeConfig.shellBorder} bg-white p-6 md:p-8 shadow-sm space-y-8 ${courseLocked ? 'opacity-60' : ''}`}
          >
            
            {/* Header Course / Topik */}
            <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
              <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200 ${themeConfig.statText}`}>
                <IconCollection className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{course.judul_course}</h2>
                {courseLocked && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                    <IconLock className="h-3 w-3" /> Complete the previous course
                  </span>
                )}
                <p className="text-sm text-slate-600 mt-1 max-w-2xl">{course.deskripsi}</p>
              </div>
            </div>

            {/* Grid Kartu Modul */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.lessons && course.lessons.map((lesson, index) => {
                const status = getLessonStatus(lesson.id);
                const stepNum = index + 1;
                const locked = status.isLocked || courseLocked;

                return (
                  <div 
                    key={lesson.id} 
                    className={`relative flex flex-col justify-between rounded-2xl border-2 p-6 transition-all duration-300 ${
                      status.isCompleted ? 'bg-emerald-50/30 border-emerald-100' :
                      !locked ? `bg-white border-slate-200 hover:-translate-y-1 hover:shadow-lg ${themeConfig.cardHover}` : 
                      'bg-slate-50 border-slate-100 opacity-70 grayscale-[20%]'
                    }`}
                  >
                    
                    {/* Bagian Atas Kartu (Header & Konten) */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                           status.isCompleted ? 'text-emerald-600' : 
                           status.isAvailable ? themeConfig.statText : 
                           'text-slate-400'
                        }`}>
                          Modul {stepNum}
                        </span>
                        
                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          {status.isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                              <IconCheckCircle className="h-3 w-3" /> COMPLETED
                            </span>
                          )}
                          {status.isLocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                              <IconLock className="h-3 w-3" /> LOCKED
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                        {lesson.judul_lesson}
                      </h3>

                      {!locked && !status.isCompleted && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.quizCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            Quiz {status.quizCompleted ? '✓' : 'pending'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.essayCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            Writing {status.essayCompleted ? '✓' : 'pending'}
                          </span>
                        </div>
                      )}
                      
                      {/* Konten dengan line-clamp agar tinggi card konsisten */}
                      <div 
                        className="text-sm leading-relaxed text-slate-600 line-clamp-3 mb-6"
                        dangerouslySetInnerHTML={{ __html: lesson.konten_teks }}
                      />
                    </div>

                    {/* Bagian Bawah Kartu (Waktu & Tombol Aksi) */}
                    <div className="mt-auto pt-5 border-t border-slate-100/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <IconClock className="h-4 w-4" />
                        15 minutes
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {!locked && !status.isCompleted && (
                          <>
                            <Link
                              to={`/learning/${slug}/lesson/${lesson.id}/writing`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300"
                            >
                              Writing
                            </Link>
                            <Link
                              to={`/learning/${slug}/lesson/${lesson.id}`}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${themeConfig.badgeBg} ${themeConfig.badgeText} shadow-sm hover:opacity-90`}
                            >
                              Quiz
                              <IconArrowRight className="h-3 w-3" />
                            </Link>
                          </>
                        )}

                        {!locked && status.isCompleted && (
                          <>
                            <Link
                              to={`/learning/${slug}/lesson/${lesson.id}/writing`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                            >
                              Writing
                            </Link>
                            <Link
                              to={`/learning/${slug}/lesson/${lesson.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Review quiz <IconArrowRight className="h-3 w-3" />
                            </Link>
                          </>
                        )}

                        {locked && (
                          <span className="text-xs font-medium text-slate-400 text-right max-w-[200px]">
                            {courseLocked
                              ? 'Complete all modules in the previous course'
                              : 'Complete the previous module’s quiz & writing'}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          </section>
        )})}

        {courses.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white px-6">
            <p className="text-sm font-medium text-slate-700">
              {loadError || 'No curriculum has been added for this level yet.'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Restart the backend server to load curriculum automatically.</p>
          </div>
        )}

      </div>
    </div>
  )
}