const DIMENSION_ORDER = ['grammar', 'vocabulary', 'relevance', 'coherence']

const BAR_COLORS = {
  grammar: 'bg-indigo-500',
  vocabulary: 'bg-violet-500',
  relevance: 'bg-sky-500',
  coherence: 'bg-teal-500',
}

function scoreTextClass(score) {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 70) return 'text-indigo-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export default function EssayRubricCard({ result }) {
  if (!result || result.status === 'error') {
    return (
      <p className="text-sm text-red-600">{result?.message || 'Rubric scoring unavailable.'}</p>
    )
  }

  const passed = result.passed
  const overall = result.overall_score

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-slate-50 p-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Overall score</p>
          <p className={`text-4xl font-bold ${scoreTextClass(overall)}`}>{overall}%</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {passed ? 'Passed' : `Need ${result.pass_threshold}% to pass`}
        </span>
      </div>

      <div className="space-y-4">
        {DIMENSION_ORDER.map((key) => {
          const dim = result.dimensions?.[key]
          if (!dim) return null
          const score = dim.score
          return (
            <div key={key}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  {dim.label}
                  <span className="ml-2 font-normal text-slate-500">
                    ({Math.round(dim.weight * 100)}% weight)
                  </span>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-bold ${scoreTextClass(score)}`}>{score}%</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {dim.band}
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${BAR_COLORS[key] || 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{dim.feedback}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
