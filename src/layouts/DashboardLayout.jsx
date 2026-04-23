import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { IconFlame, IconNav, IconChevronDown } from '../components/Icons.jsx'
import {
  LS_AVATAR,
  clearUserSession,
  initialsFromUser,
  readDisplayName,
  readUsername,
} from '../lib/userSession.js'

const sidebarLinks = [
  { to: '/dashboard', id: 'dashboard', label: 'Dashboard' },
  { to: '/learning', id: 'learning', label: 'Learning' },
  { to: '/progress', id: 'progress', label: 'Progress' },
  { to: '/help', id: 'help', label: 'Help' },
  { to: '/certification', id: 'certification', label: 'Certification' },
]

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const username = readUsername() || 'guest'
  const displayName = readDisplayName()
  const initials = initialsFromUser(displayName, username)
  const [avatar, setAvatar] = useState(() => {
    try {
      return localStorage.getItem(LS_AVATAR) || ''
    } catch {
      return ''
    }
  })
  const ref = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readAsDataUrl(file)
      setAvatar(dataUrl)
      localStorage.setItem(LS_AVATAR, dataUrl)
      setOpen(false)
    } catch {
      /* ignore */
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function logout() {
    setOpen(false)
    clearUserSession()
    setAvatar('')
    navigate('/', { replace: true })
  }

  const handle = `@${username}`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex max-w-[min(20rem,92vw)] items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-extrabold text-blue-600"
          aria-hidden
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-bold text-slate-900">{handle}</span>
          {displayName ? <span className="truncate text-[11px] font-medium text-slate-500">{displayName}</span> : null}
        </span>
        <IconChevronDown className={`h-[18px] w-[18px] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[260px] max-w-[min(20rem,92vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl md:left-full md:right-auto md:bottom-0 md:ml-2 md:mt-0"
          role="menu"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-3.5 py-3.5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-extrabold text-blue-600"
              aria-hidden
            >
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-slate-900">{handle}</span>
              {displayName ? <span className="block truncate text-xs text-slate-500">{displayName}</span> : null}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2">
            <button
              type="button"
              className="rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
              role="menuitem"
              onClick={() => inputRef.current?.click()}
            >
              Change photo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPickFile}
              aria-label="Upload profile photo"
            />
            <button
              type="button"
              className="rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-red-700 hover:bg-red-50"
              role="menuitem"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <div className="grid min-h-svh grid-cols-1 bg-slate-50 font-sans text-[15px] leading-relaxed text-slate-700 md:grid-cols-[240px_1fr]">
      <aside className="relative z-20 flex flex-col gap-9 border-b border-slate-200 bg-white px-5 py-7 md:border-b-0 md:border-r">
        <NavLink to="/dashboard" className="inline-flex items-center gap-2.5 self-start text-inherit no-underline">
          <span className="flex h-7 w-7 text-blue-600" aria-hidden>
            <IconFlame />
          </span>
          <span className="text-lg font-bold tracking-wide text-slate-900">LUMEN</span>
        </NavLink>
        <nav aria-label="App navigation">
          <ul className="flex list-none flex-col gap-1 p-0 md:flex-col">
            {sidebarLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium no-underline transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <IconNav name={item.id} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4">
          <ProfileMenu />
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col">
        <main className="min-w-0 overflow-x-auto px-6 py-8 md:px-9 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
