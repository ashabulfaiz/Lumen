import { useEffect, useState } from 'react'
import { readDisplayName, readEmail, readUsername } from './userSession.js'

function snapshotUser() {
  const name = readDisplayName()
  const email = readEmail()
  const username = readUsername()
  return {
    name: (name || username || 'Guest').trim(),
    email: (email || (username ? `${username}@lumen.app` : '')).trim(),
  }
}

export function useUser() {
  const [user, setUser] = useState(() => snapshotUser())
  const [loading, setLoading] = useState(() => !(user?.name || user?.email))

  useEffect(() => {
    const next = snapshotUser()
    setUser(next)
    setLoading(!(next?.name || next?.email))
  }, [])

  return { user, loading }
}

