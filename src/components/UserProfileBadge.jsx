import { useEffect, useRef, useState } from 'react'
import { Camera, ChevronUp, LogOut, User as UserIcon } from 'lucide-react'
import { LS_AVATAR, clearUserSession } from '../lib/userSession.js'
import { useUser } from '../lib/useUser.js'

export default function UserProfileBadge({ onLogout }) {
  const { user, loading } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const [avatar, setAvatar] = useState(() => {
    try {
      return localStorage.getItem(LS_AVATAR) || ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    function onDocMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsMenuOpen(false)
    }
    function onDocKeyDown(e) {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [])

  async function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readAsDataUrl(file)
      setAvatar(dataUrl)
      localStorage.setItem(LS_AVATAR, dataUrl)
    } catch {
      /* ignore */
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function logout() {
    setIsMenuOpen(false)
    clearUserSession()
    setAvatar('')
    onLogout?.()
  }

  return (
    <div className="relative" ref={ref}>
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[15px] font-semibold text-red-500 transition hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      )}

      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-left transition hover:bg-slate-50"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        onClick={() => setIsMenuOpen((v) => !v)}
      >
        <span className="relative shrink-0" aria-hidden>
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-white shadow-sm">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
          </span>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
            aria-label="Change profile photo"
            role="button"
            tabIndex={0}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              inputRef.current?.click()
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              e.stopPropagation()
              inputRef.current?.click()
            }}
          >
            <Camera className="h-3 w-3" />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          {loading ? (
            <span className="block h-4 w-36 animate-pulse rounded bg-slate-200" aria-hidden />
          ) : (
            <span className="block truncate text-[15px] font-bold text-slate-900">{user?.name || '—'}</span>
          )}
          {loading ? (
            <span className="mt-2 block h-3 w-44 animate-pulse rounded bg-slate-200" aria-hidden />
          ) : (
            <span className="block truncate text-[13px] font-medium text-slate-500">{user?.email || '—'}</span>
          )}
        </span>

        <ChevronUp
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPickFile}
        aria-label="Upload profile photo"
      />
    </div>
  )
}

