export function isValidEmail(value) {
  const s = String(value || '').trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export function sanitizeEmailInput(raw) {
  return String(raw || '').replace(/[^a-zA-Z0-9@._+-]/g, '')
}

export const INVALID_EMAIL_MESSAGE =
  'Please enter a valid email address.'

const PASSWORD_MIN_LENGTH = 6

export function isPasswordLongEnough(password) {
  return String(password || '').length >= PASSWORD_MIN_LENGTH
}

export const PASSWORD_TOO_SHORT_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
