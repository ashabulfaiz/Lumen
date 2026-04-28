import { levelTracks, learningLevels } from '../data/learningData.js'

function percentFromStatus(status) {
  if (status === 'completed') return 100
  if (status === 'available') return 40
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
  return (
    <div className="mx-auto max-w-[980px] font-sans">
      <header className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <h1 className="mb-1.5 text-xl font-extrabold text-slate-900">Course Progress</h1>
          <p className="m-0 text-[13px] text-slate-600">Your learning progress throughout the program.</p>
        </div>
      </header>

      <div className="flex flex-col gap-5" aria-label="Course progress by level">
        {levelTracks.map((track) => {
          const slug = track.title.toLowerCase()
          const level = learningLevels[slug]
          if (!level) return null

          const lessons = level.lessons ?? []
          return (
            <section key={track.num}>
              <div className="mb-2.5 px-0.5">
                <h2 className="mb-1 text-[15px] font-extrabold text-slate-900">{level.title}</h2>
                <p className="m-0 text-[13px] leading-snug text-slate-600">{level.description}</p>
              </div>

              <div
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                aria-label={`${level.title} progress list`}
              >
                {lessons.map((lesson) => {
                  const percent = percentFromStatus(lesson.status)
                  const status =
                    lesson.status === 'completed'
                      ? { label: 'Completed', variant: 'done' }
                      : lesson.status === 'available'
                        ? { label: 'In progress', variant: 'doing' }
                        : { label: 'Locked', variant: 'todo' }
                  return (
                    <article key={`${level.title}-${lesson.id}`} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 text-sm font-semibold text-slate-900">{lesson.title}</h3>
                          <p className="-mt-0.5 mb-0 max-w-[70ch] text-[13px] leading-relaxed text-slate-600">
                            {lesson.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3" aria-label={`${percent}%`}>
                          <span className="min-w-[42px] text-right text-xs font-bold text-slate-800">{percent}%</span>
                          <span
                            className={`rounded-[10px] border px-3 py-1.5 text-[11px] font-bold ${pillTone[status.variant]}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="presentation">
                        <div
                          className={`h-full rounded-full transition-[width] ${barTone[status.variant]}`}
                          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
