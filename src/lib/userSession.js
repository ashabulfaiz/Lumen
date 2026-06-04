/** Local session keys — replace with real auth later */
const LS_USERNAME = 'lumen_username'
const LS_DISPLAY_NAME = 'lumen_display_name'
const LS_EMAIL = 'lumen_email'
export const LS_AVATAR = 'lumen_profile_avatar'

function emailLocalPart(email) {
  const at = email.trim().indexOf('@')
  return at > 0 ? email.trim().slice(0, at) : ''
}

/** Username shown in UI: email local-part (e.g. alex from alex@site.com). */
function deriveUsername(email) {
  const local = emailLocalPart(email)
  return local || 'learner'
}

export function persistLoginSession(email) {
  try {
    localStorage.setItem(LS_EMAIL, email.trim())
    localStorage.setItem(LS_USERNAME, deriveUsername(email))
  } catch {
    /* ignore */
  }
}

export function persistRegisterSession(displayName, email) {
  try {
    localStorage.setItem(LS_EMAIL, email.trim())
    localStorage.setItem(LS_USERNAME, deriveUsername(email))
    if (displayName.trim()) {
      localStorage.setItem(LS_DISPLAY_NAME, displayName.trim())
    }
  } catch {
    /* ignore */
  }
}

export function clearUserSession() {
  try {
    localStorage.removeItem(LS_USERNAME)
    localStorage.removeItem(LS_DISPLAY_NAME)
    localStorage.removeItem(LS_EMAIL)
    localStorage.removeItem(LS_AVATAR)
  } catch {
    /* ignore */
  }
}

export function readUsername() {
  try {
    return localStorage.getItem(LS_USERNAME) || ''
  } catch {
    return ''
  }
}

export function readDisplayName() {
  try {
    return localStorage.getItem(LS_DISPLAY_NAME) || ''
  } catch {
    return ''
  }
}

export function readEmail() {
  try {
    return localStorage.getItem(LS_EMAIL) || ''
  } catch {
    return ''
  }
}

/** Two-letter initials from display name or username */
export function initialsFromUser(displayName, username) {
  const d = displayName.trim()
  if (d) {
    const parts = d.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
    }
    return d.slice(0, 2).toUpperCase()
  }
  const u = username.trim()
  return u ? u.slice(0, 2).toUpperCase() : 'ME'
}
