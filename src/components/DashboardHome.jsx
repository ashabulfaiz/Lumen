import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconTrendUp,
  IconSparkle,
  IconClock,
  IconChevronRight,
  IconCalendar,
  IconStar,
  IconFlame,
} from './Icons.jsx'
import { useUser } from '../lib/useUser.jsx'
import api from '../lib/axiosInstance'

const cardShell = 'rounded-[2rem] border border-slate-200 bg-white shadow-sm'
const sectionMuted = 'rounded-[2rem] border border-indigo-100/60 bg-gradient-to-br from-indigo-50/40 to-white p-6 shadow-sm transition-all hover:shadow-md'

const LEVEL_TRACKS = [
  { id: 1, slug: 'beginner', label: 'Beginner', color: '#6366f1', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { id: 2, slug: 'intermediate', label: 'Intermediate', color: '#7c3aed', badgeBg: 'bg-purple-50 text-purple-700 border-purple-100' },
  { id: 3, slug: 'advanced', label: 'Advanced', color: '#06b6d4', badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-100' }
]

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

function DonutChart({ percent, strokeColor, label, customText }) {
  const size = 112
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (percent / 100) * c
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative flex flex-col items-center group">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label={`${label}: ${percent}%`}
      >
        <circle cx={cx} cy={cy} r={r} stroke="#f1f5f9" strokeWidth={stroke} fill="none" />
        <circle
          cx={cx} cy={cy} r={r} stroke={strokeColor} strokeWidth={stroke}
          fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slate-800">{customText || `${percent}%`}</span>
        <span className="max-w-[5.5rem] text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const { user } = useUser();
  const firstName = user?.name?.split(/\s+/)[0] || 'Student';

  const [placementData, setPlacementData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressStats, setProgressStats] = useState({ 1: 0, 2: 0, 3: 0 })
  const [totalLessonsCompleted, setTotalLessonsCompleted] = useState(0)
  const [recommendedLessons, setRecommendedLessons] = useState([])
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)

  useEffect(() => {
    let hasPlacement = false
    try {
      const savedData = localStorage.getItem('lumen_placement_result')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        if (parsed.result) {
          setPlacementData(parsed.result)
          hasPlacement = true
          setIsOnboardingComplete(true)
        }
      }
    } catch { /* ignore */ }

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        let tempTotalCompleted = 0
        let tempProgressStats = { 1: 0, 2: 0, 3: 0 }
        let availableLessonsPool = []
        let fallbackLessonsPool = []

        await Promise.all(LEVEL_TRACKS.map(async (track) => {
          const coursesRes = await api.get(`/learning/courses/${track.slug}`)
          const courses = coursesRes.data.data || []

          let trackLessons = []
          for (const course of courses) {
            const lessonsRes = await api.get(`/learning/lessons/${course.id}`)
            const lessons = lessonsRes.data.data || []
            trackLessons.push(...lessons.map(l => ({ 
              ...l, levelSlug: track.slug, levelLabel: track.label, badgeBg: track.badgeBg 
            })))
          }

          if (track.id === 1) fallbackLessonsPool = [...trackLessons]

          let completedIds = []
          try {
            const progRes = await api.get(`/progress/completed/${track.slug}`)
            completedIds = progRes.data.data || []
          } catch (e) {
            console.error(`Failed to load level progress ${track.id}`, e)
          }

          tempTotalCompleted += completedIds.length
          tempProgressStats[track.id] = trackLessons.length > 0 
            ? Math.round((completedIds.length / trackLessons.length) * 100) 
            : 0

          trackLessons.forEach((lesson, index) => {
            const isCompleted = completedIds.includes(lesson.id)
            let isAvailable = index === 0 || completedIds.includes(trackLessons[index - 1].id)
            if (isAvailable && !isCompleted) availableLessonsPool.push(lesson)
          })
        }))

        setProgressStats(tempProgressStats)
        setTotalLessonsCompleted(tempTotalCompleted)
        setRecommendedLessons(hasPlacement ? availableLessonsPool.slice(0, 3) : fallbackLessonsPool.slice(0, 3))

      } catch (error) {
        console.error("Failed to synchronize dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className={`${cardShell} flex min-h-[500px] flex-col items-center justify-center p-8 text-center font-sans`}>
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60 duration-1000"></div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
            <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        </div>
        <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Waking up dashboard...</h2>
        <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-slate-500">
          Compiling your daily streaks, AI recommendations, and latest analytics.
        </p>
      </div>
    )
  }

  return (
    <div className={`${cardShell} p-6 md:p-8 font-sans`}>
      <header className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 shadow-sm">
          <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">Overview Panel</span>
        </div>
        <h1 className="mb-2 text-[28px] font-black tracking-tight text-slate-900 md:text-[34px]">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{firstName}</span>!
        </h1>
        <p className="text-[16px] leading-relaxed text-slate-600 max-w-2xl">
          {!isOnboardingComplete 
            ? 'Let\'s get started with your learning journey by completing the onboarding steps and taking the initial assessment.'
            : 'Keep improving your English skills. Every small session brings you closer to fluency.'
          }
        </p>
      </header>

      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className={sectionMuted} aria-labelledby="progress-heading">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <IconTrendUp className="h-6 w-6 shrink-0" />
            </span>
            <h2 id="progress-heading" className="text-xl font-extrabold text-slate-900 tracking-tight">Progress Summary</h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 py-4 md:justify-around rounded-2xl bg-white/50 p-4 border border-white/60">
            <DonutChart 
              percent={placementData ? placementData.score : 0} strokeColor="#ea580c" label="Placement" 
              customText={placementData ? `${Math.round(placementData.score / 10)}/10` : '0/10'}
            />
            {LEVEL_TRACKS.map(track => (
              <DonutChart key={track.id} percent={progressStats[track.id] || 0} strokeColor={track.color} label={track.label} />
            ))}
          </div>

          <div className="my-6 h-px bg-slate-200" role="presentation" />
          
          <ul className="grid grid-cols-2 gap-4 m-0 p-0 text-sm font-medium text-slate-700">
            <li className="flex flex-col p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
              <span className="text-2xl font-black text-indigo-600 mb-1">{totalLessonsCompleted}</span>
              <span className="text-slate-500 text-xs uppercase tracking-wide">Lessons Completed</span>
            </li>
            <li className="flex flex-col p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
              <span className="text-2xl font-black text-emerald-600 mb-1">{totalLessonsCompleted * 15} <span className="text-sm">mins</span></span>
              <span className="text-slate-500 text-xs uppercase tracking-wide">Study Time</span>
            </li>
          </ul>
        </section>

        {/* DAILY STREAK */}
        <section className="rounded-[2rem] border border-orange-200/80 bg-gradient-to-br from-orange-50 to-white p-6 shadow-md flex flex-col justify-between" aria-labelledby="streak-heading">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
                <IconFlame className="h-6 w-6" />
              </span>
              <h2 id="streak-heading" className="text-xl font-extrabold text-slate-900 tracking-tight">Daily Streak</h2>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl border border-orange-100/50 shadow-sm text-center">
                <span className="block text-4xl font-black tracking-tight text-orange-600 mb-1">{isOnboardingComplete ? '1' : '0'}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-orange-100/50 shadow-sm text-center opacity-80">
                <span className="block text-4xl font-black tracking-tight text-slate-400 mb-1">{isOnboardingComplete ? '1' : '0'}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Highest</span>
              </div>
            </div>
          </div>
          <p className="m-0 flex items-center gap-2 text-sm font-medium text-orange-800 bg-orange-100/50 p-3 rounded-xl">
            <IconCalendar className="h-5 w-5 shrink-0 text-orange-600" />
            {!isOnboardingComplete ? 'Take the test to start your first streak!' : 'Study today to maintain your streak!'}
          </p>
        </section>
      </div>

      {/* RECOMMENDED LESSONS */}
      <section className={sectionMuted} aria-labelledby="lessons-heading">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <IconSparkle className="h-6 w-6 shrink-0" />
            </span>
            <h2 id="lessons-heading" className="text-xl font-extrabold text-slate-900 tracking-tight">
              {!isOnboardingComplete ? 'Recommended Content for You' : 'Recommended Lessons'}
            </h2>
          </div>
        </div>
        
        {!isOnboardingComplete && (
          <div className="mb-5 p-4 rounded-2xl border border-amber-200 bg-amber-50/60 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 font-medium">🔒 You are in review mode. Please complete the <strong>Placement Test</strong> before starting.</p>
            <Link to="/learning" className="inline-flex items-center gap-1 bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-amber-700 transition">
              Start Onboarding
            </Link>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recommendedLessons.length > 0 ? (
            recommendedLessons.map((lesson) => {
              const targetUrl = isOnboardingComplete ? `/learning/${lesson.levelSlug}/lesson/${lesson.id}` : `/learning`;

              return (
                <Link
                  key={lesson.id} to={targetUrl}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                      {lesson.judul_lesson}
                    </h3>
                    <p className="mb-5 text-[13px] leading-relaxed text-slate-600 line-clamp-2">
                      {stripHtml(lesson.konten_teks) || 'Materi pembelajaran modul ini siap untuk dipelajari.'}
                    </p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        <IconStar className="h-3 w-3" /> {!isOnboardingComplete ? 'Trending' : 'AI Pick'}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${lesson.badgeBg}`}>
                        {lesson.levelLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <IconClock className="h-4 w-4" /> 15 minutes
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                        {!isOnboardingComplete ? 'Start' : 'Begin'}{' '}
                        <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
              <p className="text-sm font-medium text-slate-500">No learning materials available.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}