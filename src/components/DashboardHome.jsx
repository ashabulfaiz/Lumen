import {
  IconTrendUp,
  IconSparkle,
  IconClock,
  IconChevronRight,
  IconCalendar,
  IconStar,
  IconFlame,
} from './Icons.jsx'
import { readDisplayName, readUsername } from '../lib/userSession.js'

function greetingName() {
  const full = readDisplayName()
  if (full) return full.split(/\s+/)[0]
  const u = readUsername()
  return u || 'there'
}

const lessons = [
  {
    title: 'Present tense in context',
    subtitle: 'Practice forms and time expressions in short dialogues',
    duration: '15 min',
    badges: [
      { text: 'AI pick', variant: 'ai' },
      { text: 'Intermediate', variant: 'intermediate' },
    ],
  },
  {
    title: 'Word building & collocations',
    subtitle: 'Prefixes, suffixes, and natural word pairs for fluent speech',
    duration: '20 min',
    badges: [
      { text: 'AI pick', variant: 'ai' },
      { text: 'Beginner', variant: 'beginner' },
    ],
  },
  {
    title: 'Intonation & sentence stress',
    subtitle: 'Sound more natural with rhythm and emphasis patterns',
    duration: '12 min',
    badges: [{ text: 'Beginner', variant: 'beginner' }],
  },
]

function DonutChart({ percent, strokeColor, label }) {
  const size = 112
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (percent / 100) * c
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        role="img"
        aria-label={`${label}: ${percent}%`}
      >
        <circle cx={cx} cy={cy} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{percent}%</span>
        <span className="max-w-[5.5rem] text-center text-xs font-semibold text-slate-600">{label}</span>
      </div>
    </div>
  )
}

const badgeClass = {
  ai: 'inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600',
  beginner:
    'inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700',
  intermediate:
    'inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700',
}

export default function DashboardHome() {
  return (
    <>
      <header className="mb-7">
        <h1 className="mb-1.5 text-[28px] font-bold tracking-tight text-slate-900">
          Welcome back, {greetingName()}!
        </h1>
        <p className="text-slate-600">Keep building your English — one focused session at a time.</p>
      </header>

      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          aria-labelledby="progress-heading"
        >
          <div className="mb-5 flex items-center gap-3">
            <IconTrendUp className="h-6 w-6 shrink-0 text-blue-600" />
            <h2 id="progress-heading" className="text-lg font-semibold text-slate-900">
              Progress overview
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8 py-2 md:justify-between">
            <DonutChart percent={72} strokeColor="#2563eb" label="Grammar" />
            <DonutChart percent={58} strokeColor="#7c3aed" label="Vocabulary" />
            <DonutChart percent={64} strokeColor="#0d9488" label="Listening" />
          </div>
          <div className="my-6 h-px bg-slate-100" role="presentation" />
          <ul className="m-0 space-y-2 p-0 text-sm font-medium text-slate-700">
            <li>127 words in your active sets</li>
            <li>45 lessons completed</li>
            <li>8.5 hours of study time</li>
          </ul>
        </section>

        <section
          className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm"
          aria-labelledby="streak-heading"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600" aria-hidden>
              <IconFlame />
            </span>
            <h2 id="streak-heading" className="text-lg font-semibold text-slate-900">
              Daily streak
            </h2>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-4xl font-bold tracking-tight text-orange-600">12</span>
              <span className="text-xs font-medium text-slate-600">Current streak</span>
            </div>
            <div>
              <span className="block text-4xl font-bold tracking-tight text-orange-600">28</span>
              <span className="text-xs font-medium text-slate-600">Best streak</span>
            </div>
          </div>
          <p className="m-0 flex items-center gap-2 text-sm font-medium text-slate-700">
            <IconCalendar className="h-5 w-5 shrink-0 text-orange-500" />
            Study today to keep your streak alive.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="lessons-heading">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconSparkle className="h-5 w-5 shrink-0 text-blue-600" />
            <h2 id="lessons-heading" className="text-lg font-semibold text-slate-900">
              Recommended lessons
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">Powered by your study patterns</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <article
              key={lesson.title}
              className="flex flex-col rounded-xl border border-slate-200 bg-[#fafbfc] p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <h3 className="mb-2 text-[15px] font-semibold text-slate-900">{lesson.title}</h3>
              <p className="mb-4 flex-1 text-[13px] leading-snug text-slate-600">{lesson.subtitle}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {lesson.badges.map((b) => (
                  <span key={b.text} className={badgeClass[b.variant]}>
                    {b.variant === 'ai' && <IconStar className="h-2.5 w-2.5" />}
                    {b.text}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600">
                  <IconClock className="h-4 w-4" />
                  {lesson.duration}
                </span>
                <IconChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
