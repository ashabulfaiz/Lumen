function GrammarErrorList({ errors }) {
  if (!Array.isArray(errors) || errors.length === 0) return null
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5">
      {errors.map((err, idx) => (
        <li key={`${err.type}-${err.grammar_category}-${idx}`} className="text-slate-800">
          {err.message}
          {err.original_span ? (
            <span className="mt-1 block text-xs text-slate-500">
              &quot;{err.original_span}&quot;
              {err.corrected_span ? ` → "${err.corrected_span}"` : ''}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function WritingTipsList({ tips }) {
  if (!Array.isArray(tips) || tips.length === 0) return null
  return (
    <ul className="mt-2 space-y-2">
      {tips.map((tip, idx) => (
        <li key={idx} className="flex gap-2 text-slate-800">
          <span className="mt-0.5 text-indigo-500" aria-hidden>
            •
          </span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  )
}

function levelBadgeClass(level) {
  const key = String(level || '').toLowerCase()
  if (key === 'advanced') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  if (key === 'intermediate') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

export default function GrammarReviewCard({ result, showScore = false }) {
  if (!result || result.status === 'error') {
    return (
      <p className="text-sm text-red-600">
        {result?.message || 'Grammar review unavailable.'}
      </p>
    )
  }

  const scorePercent =
    result.score_percent != null
      ? result.score_percent
      : result.grammar_score != null
        ? Math.round(Number(result.grammar_score) * 100)
        : null

  const tips = result.writing_tips

  return (
    <>
      {showScore && scorePercent != null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-medium text-slate-800">Score</p>
            <p className="text-2xl font-bold text-indigo-600">{scorePercent}%</p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Writing level</p>
            {result.writing_level ? (
              <span
                className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-sm font-semibold ${levelBadgeClass(result.writing_level)}`}
              >
                {result.writing_level}
              </span>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
      ) : null}

      {(tips?.length > 0 || result.feedback) && (
        <div className={showScore ? 'mt-4' : ''}>
          <p className="font-medium text-slate-800">Writing tips</p>
          {tips?.length > 0 ? (
            <WritingTipsList tips={tips} />
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-slate-900">{result.feedback}</p>
          )}
        </div>
      )}

      {result.corrected_sentence ? (
        <div className="mt-4">
          <p className="font-medium text-slate-800">Suggested wording</p>
          <p className="whitespace-pre-wrap text-slate-900">{result.corrected_sentence}</p>
        </div>
      ) : null}

      {result.errors?.length > 0 ? (
        <div className="mt-3">
          <p className="font-medium text-slate-800">Details</p>
          <GrammarErrorList errors={result.errors} />
        </div>
      ) : null}
    </>
  )
}
