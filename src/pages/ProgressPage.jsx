import { LEARNING_PROGRESS_KEY, levelTracks, unitsByLevel } from '../data/learningData.js'

function loadLearningUnlock() {
  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY)
    if (!raw) return { chosenLevel: null, highestUnlocked: 1 }
    const data = JSON.parse(raw)
    const chosenLevel = typeof data?.chosenLevel === 'number' ? data.chosenLevel : null
    const highestUnlocked = typeof data?.highestUnlocked === 'number' ? data.highestUnlocked : 1
    return {
      chosenLevel: chosenLevel != null && chosenLevel >= 1 && chosenLevel <= 3 ? chosenLevel : null,
      highestUnlocked: highestUnlocked >= 1 && highestUnlocked <= 3 ? highestUnlocked : 1,
    }
  } catch {
    return { chosenLevel: null, highestUnlocked: 1 }
  }
}

function unitPercent({ levelNum, unitIndex, unlocked }) {
  if (!unlocked.chosenLevel) return 0
  if (levelNum < unlocked.highestUnlocked) return 100
  if (levelNum > unlocked.highestUnlocked) return 0

  const pattern = [60, 20, 0, 0]
  return pattern[unitIndex] ?? 0
}

function statusFor(percent) {
  if (percent >= 100) return { label: 'Completed', variant: 'done' }
  if (percent <= 0) return { label: 'Not started', variant: 'todo' }
  return { label: 'In progress', variant: 'doing' }
}

function formatUpdated(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
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
  const lastUpdated = formatUpdated(new Date())
  const unlocked = loadLearningUnlock()

  return (
    <div className="mx-auto max-w-[980px] font-sans">
      <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-1.5 text-xl font-extrabold text-slate-900">Course Progress</h1>
          <p className="m-0 text-[13px] text-slate-600">Your learning progress throughout the program.</p>
        </div>
        <div className="text-[12px] text-slate-400 md:pt-1.5">Last updated: {lastUpdated}</div>
      </header>

      <div className="flex flex-col gap-5" aria-label="Course progress by level">
        {levelTracks.map((level) => {
          const units = unitsByLevel[level.num] ?? []
          return (
            <section key={level.num}>
              <div className="mb-2.5 px-0.5">
                <h2 className="mb-1 text-[15px] font-extrabold text-slate-900">{level.title}</h2>
                <p className="m-0 text-[13px] leading-snug text-slate-600">{level.summary}</p>
              </div>

              <div
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                aria-label={`${level.title} progress list`}
              >
                {units.map((u, idx) => {
                  const percent = unitPercent({ levelNum: level.num, unitIndex: idx, unlocked })
                  const status = statusFor(percent)
                  return (
                    <article key={`${level.title}-${u.title}`} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 text-sm font-semibold text-slate-900">{u.title}</h3>
                          <p className="-mt-0.5 mb-0 max-w-[70ch] text-[13px] leading-relaxed text-slate-600">{u.subtitle}</p>
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
