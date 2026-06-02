const GRAMMAR_API_BASE_URL =
  import.meta.env.VITE_GRAMMAR_API_URL?.replace(/\/$/, '') || 'http://localhost:5003'

export function getGrammarApiBaseUrl() {
  return GRAMMAR_API_BASE_URL
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail || data.message || response.statusText
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  if (data.status === 'error') {
    throw new Error(data.message || 'Grammar service error')
  }
  return data
}

export async function fetchGrammarHealth() {
  const response = await fetch(`${GRAMMAR_API_BASE_URL}/health`)
  return parseJsonResponse(response)
}

/** Lesson assist / grade (TensorFlow grammar model). */
export async function checkGrammar(sentence, mode = 'grade') {
  const response = await fetch(`${GRAMMAR_API_BASE_URL}/check-grammar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence: sentence.trim(), mode }),
  })
  return parseJsonResponse(response)
}

export function grammarServiceHint() {
  return `Start AI services: cd ai && ./start.sh (grammar: ${GRAMMAR_API_BASE_URL})`
}
