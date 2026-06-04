import { checkGrammar, getGrammarApiBaseUrl, grammarServiceHint } from './grammarApi.js'
import { fetchLocalEssayQuestion } from './essayQuestionPicker.js'

export { getGrammarApiBaseUrl, grammarServiceHint }

/**
 * Fetch randomized essay prompt(s) for a course.
 * Uses bundled question bank; falls back to grammar API if local resolution fails.
 * Pass `seed` (e.g. `${userId}:${courseId}`) so the same session gets a stable question.
 */
export async function fetchEssayQuestion({
  level,
  courseKey,
  courseOrder,
  courseTitle,
  lessonTitle,
  count = 1,
  seed,
}) {
  try {
    return fetchLocalEssayQuestion({
      level,
      courseKey,
      courseOrder,
      courseTitle,
      lessonTitle,
      count,
      seed,
    })
  } catch {
    // fall through to API
  }

  const params = new URLSearchParams({ level, count: String(count) })
  if (courseKey) params.set('course_key', courseKey)
  if (courseOrder != null) params.set('course_order', String(courseOrder))
  if (courseTitle) params.set('course_title', courseTitle)
  if (lessonTitle) params.set('lesson_title', lessonTitle)
  if (seed) params.set('seed', seed)

  const base = getGrammarApiBaseUrl()
  const response = await fetch(`${base}/essay/question?${params}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const detail = err.detail || err.message || 'Failed to load essay question'
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return response.json()
}

export async function fetchEssayRubric() {
  const base = getGrammarApiBaseUrl()
  const response = await fetch(`${base}/essay/rubric`)
  if (!response.ok) throw new Error('Failed to load essay rubric')
  return response.json()
}

/**
 * Rubric only (grammar dimension uses provided score).
 */
export async function gradeEssay({ question, answer, level = 'beginner', grammarScorePercent }) {
  const body = { question, answer, level }
  if (grammarScorePercent != null) body.grammar_score_percent = Math.round(grammarScorePercent)

  const base = getGrammarApiBaseUrl()
  const response = await fetch(`${base}/essay/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const detail = err.detail || err.message || 'Failed to grade essay'
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return response.json()
}

/**
 * Full AI grading: TensorFlow grammar model + rubric (vocabulary, relevance, coherence).
 */
export async function gradeEssayWithGrammar({ question, answer, level = 'beginner' }) {
  const grammar = await checkGrammar(answer, 'grade')
  const rubric = await gradeEssay({
    question,
    answer,
    level,
    grammarScorePercent: grammar.score_percent,
  })
  return { grammar, rubric }
}
