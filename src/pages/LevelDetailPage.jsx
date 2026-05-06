import { Link, Navigate, useLocation } from 'react-router-dom'
import { IconBook, IconStar, IconPlay, IconLock, IconClock } from '../components/Icons.jsx'
import { getLevelPath, levelNumberBySlug, loadLearningProgress, getLessonsWithStatus } from '../data/learningData.js'

const LEVELS = {
  beginner: {
    title: 'Beginner',
    description: 'Master the essentials and build your foundation',
    theme: {
      shellBorder: 'border-emerald-200',
      shellBg: 'bg-[#f4fbf4]',
      badgeBg: 'bg-[#10b981]',
      badgeText: 'text-white',
      statText: 'text-emerald-800',
      statTextMuted: 'text-emerald-700',
      progressBg: 'bg-[#10b981]',
    },
    lessons: [
      {
        id: 1,
        title: 'Alphabet & Pronunciation',
        description: 'Learn the English alphabet and basic sounds',
        duration: '15 min',
        status: 'completed',
      },
      {
        id: 2,
        title: 'Common Greetings',
        description: 'Master essential greetings and introductions',
        duration: '12 min',
        status: 'completed',
      },
      {
        id: 3,
        title: 'Numbers 1-100',
        description: 'Count and use numbers in everyday situations',
        duration: '18 min',
        status: 'available',
      },
      {
        id: 4,
        title: 'Basic Verbs',
        description: 'Learn the most common English verbs',
        duration: '20 min',
        status: 'available',
      },
      {
        id: 5,
        title: 'Colors & Objects',
        description: 'Describe things around you with colors',
        duration: '15 min',
        status: 'locked',
      },
      {
        id: 6,
        title: 'Family Members',
        description: 'Talk about your family in English',
        duration: '16 min',
        status: 'locked',
      },
    ],
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Master the essentials and build your foundation',
    theme: {
      shellBorder: 'border-blue-200',
      shellBg: 'bg-blue-50/60',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      statText: 'text-blue-800',
      statTextMuted: 'text-blue-700',
      progressBg: 'bg-blue-600',
    },
    lessons: [
      {
        id: 1,
        title: 'Present Tense Conjugation',
        description: 'Master regular verb conjugations',
        duration: '25 min',
        status: 'available',
      },
      {
        id: 2,
        title: 'Irregular Verbs',
        description: 'Learn common irregular verb patterns',
        duration: '30 min',
        status: 'available',
      },
      {
        id: 3,
        title: 'Past Tense (Preterite)',
        description: 'Talk about completed past actions',
        duration: '28 min',
        status: 'locked',
      },
      {
        id: 4,
        title: 'Direct & Indirect Objects',
        description: 'Use pronouns effectively',
        duration: '22 min',
        status: 'locked',
      },
      {
        id: 5,
        title: 'Making Comparisons',
        description: 'Compare things using more, menos, tan',
        duration: '20 min',
        status: 'locked',
      },
      {
        id: 6,
        title: 'Future Tense',
        description: 'Express plans and predictions',
        duration: '24 min',
        status: 'locked',
      },
    ],
  },
  advanced: {
    title: 'Advanced',
    description: 'Sharpen fluency with complex grammar and discussion skills',
    theme: {
      shellBorder: 'border-violet-200',
      shellBg: 'bg-violet-50/60',
      badgeBg: 'bg-violet-600',
      badgeText: 'text-white',
      statText: 'text-violet-800',
      statTextMuted: 'text-violet-700',
      progressBg: 'bg-violet-600',
    },
    lessons: [
      {
        id: 1,
        title: 'Complex sentences',
        description: 'Use relative clauses and connectors naturally',
        duration: '26 min',
        status: 'available',
      },
      {
        id: 2,
        title: 'Nuanced tenses',
        description: 'Perfect tenses and time expressions in context',
        duration: '32 min',
        status: 'locked',
      },
      {
        id: 3,
        title: 'Discussion skills',
        description: 'Agree, disagree, and clarify with confidence',
        duration: '24 min',
        status: 'locked',
      },
    ],
  },
}

export default function LevelDetailPage() {
  const location = useLocation()
  const slug = String(location.pathname.split('/').filter(Boolean).slice(-1)[0] || 'beginner')
  const progress = loadLearningProgress()
  const levelNumber = levelNumberBySlug[slug] ?? 1

  if (levelNumber > progress.highestUnlocked) {
    return <Navigate to={getLevelPath(progress.highestUnlocked)} replace />
  }

  const level = LEVELS[slug] || LEVELS.beginner
  const theme = level.theme

  const lessons = getLessonsWithStatus(slug, progress)

  const totalLessons = lessons.length
  const completedCount = lessons.filter((l) => l.status === 'completed').length
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0
  const totalMinutes = lessons.reduce((acc, l) => acc + (Number.parseInt(l.duration, 10) || 0), 0)

  return (
    <div className="mx-auto max-w-[1000px] pb-12 pt-2 font-sans">
      <div className={`mb-8 overflow-hidden rounded-2xl border p-6 shadow-sm ${theme.shellBorder} ${theme.shellBg}`}>
        <div className="flex items-start gap-5">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-sm ${theme.badgeBg} ${theme.badgeText}`}>
            <IconBook className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{level.title}</h1>
            <p className="mt-1 text-[15px] text-slate-600">{level.description}</p>
            
            <div className={`mt-5 flex flex-wrap items-center gap-6 text-sm font-medium ${theme.statText}`}>
              <div className="flex items-center gap-2">
                <IconBook className="h-[18px] w-[18px]" />
                {completedCount} / {totalLessons} Lessons
              </div>
              <div className={`flex items-center gap-2 ${theme.statTextMuted}`}>
                <IconClock className="h-[18px] w-[18px]" />
                ~{totalMinutes} minutes total
              </div>
            </div>

            <div className="mt-4">
              <div className="relative h-[8px] w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${theme.progressBg}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2.5 text-[11px] font-medium text-slate-500">{progressPercent}% Complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => {
          const isCompleted = lesson.status === 'completed'
          const isLocked = lesson.status === 'locked'
          const isAvailable = lesson.status === 'available'

          return (
            <div
              key={lesson.id}
              className={`group relative flex flex-col rounded-2xl border bg-white p-5 transition-shadow ${
                isCompleted ? 'border-green-200 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.15)]' :
                isLocked ? 'border-slate-100 opacity-80' :
                'border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div
                  className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full ${
                    isCompleted ? 'bg-[#10b981] text-white' :
                    isLocked ? 'bg-slate-100 text-[#f59e0b]' :
                    'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}
                >
                  {isCompleted && <IconStar className="h-5 w-5" />}
                  {isAvailable && <IconPlay className="h-5 w-5 translate-x-[1px]" />}
                  {isLocked && <IconLock className="h-4 w-4 text-orange-300" />}
                </div>
                <span className="text-[11px] font-bold text-slate-400">Lesson {lesson.id}</span>
              </div>

              <h3 className="mb-1.5 text-[15px] font-bold text-slate-900">{lesson.title}</h3>
              <p className="mb-5 flex-1 text-[13px] leading-relaxed text-slate-500">{lesson.description}</p>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[13px] font-medium">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <IconClock className="h-4 w-4" />
                  {lesson.duration}
                </div>
                {isCompleted && <span className="font-bold text-[#10b981]">Completed</span>}
                {isLocked && <span className="font-bold text-slate-400">Locked</span>}
              </div>
              
              {(isAvailable || isCompleted) && (
                <Link to={`/learning/${slug}/lesson/${lesson.id}`} className="absolute inset-0 rounded-2xl ring-blue-500 focus-visible:outline-none focus-visible:ring-2">
                  <span className="sr-only">{isCompleted ? 'Review' : 'Start'} {lesson.title}</span>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
