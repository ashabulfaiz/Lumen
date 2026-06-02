import { essayCourseMapping } from '../data/essayCourseMapping.js'
import { essayQuestions } from '../data/essayQuestions.js'

const LEVEL_SLUGS = new Set(['beginner', 'intermediate', 'advanced'])

function normalizeLevel(level) {
  const key = String(level || '').trim().toLowerCase()
  const aliases = {
    bgn: 'beginner',
    int: 'intermediate',
    adv: 'advanced',
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
  }
  if (aliases[key]) return aliases[key]
  if (LEVEL_SLUGS.has(key)) return key
  throw new Error(`Unknown level: ${level}. Use beginner, intermediate, or advanced.`)
}

function normalizeTitle(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function resolveCourseKey(level, { courseKey, courseOrder, courseTitle, lessonTitle } = {}) {
  if (courseKey) {
    const slug = normalizeLevel(level)
    const pools = essayQuestions[slug] || {}
    if (pools[courseKey]) return courseKey
    throw new Error(`Unknown course_key "${courseKey}" for level ${level}`)
  }

  const mapping = essayCourseMapping

  if (lessonTitle) {
    const hit = mapping.by_lesson_title[normalizeTitle(lessonTitle)]
    if (hit) return hit
  }

  if (courseTitle) {
    const hit = mapping.by_course_title[normalizeTitle(courseTitle)]
    if (hit) return hit
  }

  if (courseOrder != null) {
    const slug = normalizeLevel(level)
    const hit = mapping.by_level_order[slug]?.[String(Number(courseOrder))]
    if (hit) return hit
  }

  throw new Error(
    'Could not resolve course. Pass course_key, course_order, course_title, or lesson_title.',
  )
}

function seedInt(seed) {
  if (seed == null) return null
  if (typeof seed === 'number') return seed
  const text = String(seed).trim()
  if (!text) return null
  if (/^\d+$/.test(text)) return Number.parseInt(text, 10)
  return [...text].reduce((acc, ch) => (acc + ch.charCodeAt(0)) % 2 ** 32, 0)
}

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function pickEssayQuestions(level, courseKey, { count = 1, seed } = {}) {
  const levelSlug = normalizeLevel(level)
  const pool = [...(essayQuestions[levelSlug]?.[courseKey] || [])]
  if (pool.length === 0) {
    throw new Error(`No questions for level=${levelSlug}, course_key=${courseKey}`)
  }

  const rng = mulberry32(seedInt(seed) ?? Date.now())
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const n = Math.max(1, Math.min(Number(count) || 1, shuffled.length))
  return shuffled.slice(0, n).map((item) => ({
    id: item.id,
    question: item.question,
    level: levelSlug,
    course_key: courseKey,
  }))
}

export function fetchLocalEssayQuestion({
  level,
  courseKey,
  courseOrder,
  courseTitle,
  lessonTitle,
  count = 1,
  seed,
}) {
  const levelSlug = normalizeLevel(level)
  const key = resolveCourseKey(levelSlug, {
    courseKey,
    courseOrder,
    courseTitle,
    lessonTitle,
  })
  const questions = pickEssayQuestions(levelSlug, key, { count, seed })
  return {
    level: levelSlug,
    course_key: key,
    count: questions.length,
    questions,
  }
}
