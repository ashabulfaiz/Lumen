import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { IconFlame, IconNav, IconChevronDown } from '../components/Icons.jsx'
import UserProfileBadge from '../components/UserProfileBadge.jsx'
import {
  LEARNING_PROGRESS_EVENT,
  levelTracks,
  loadLearningProgress,
} from '../data/learningData.js'

const sidebarLinks = [
  { to: '/dashboard', id: 'dashboard', label: 'Dashboard' },
  {
    to: '/learning',
    id: 'learning',
    label: 'Learning',
    children: levelTracks.map((level) => ({
      num: level.num,
      to: `/learning/${level.title.toLowerCase()}`,
      label: level.title,
    })),
  },
  { to: '/progress', id: 'progress', label: 'Progress' },
  { to: '/help', id: 'help', label: 'Help' },
  { to: '/certification', id: 'certification', label: 'Certification' },
]

function SidebarItem({ item, highestUnlocked, placementCompleted }) {
  const hasChildren = !!item.children
  const location = useLocation()
  const [open, setOpen] = useState(() => location.pathname.startsWith(item.to))

  useEffect(() => {
    if (location.pathname.startsWith(item.to)) {
      setOpen(true)
    }
  }, [item.to, location.pathname])

  return (
    <li>
      <div className="relative flex items-center">
        <NavLink
          to={item.to}
          end={item.to === '/dashboard' || hasChildren}
          className={({ isActive }) =>
            `flex flex-1 items-center gap-4 rounded-2xl px-5 py-4 text-[16px] font-semibold no-underline transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <IconNav name={item.id} className="h-6 w-6 shrink-0" />
          {item.label}
        </NavLink>
        {hasChildren && (
          <button
            type="button"
            className="absolute right-2 rounded-xl p-2.5 text-slate-400 transition-colors hover:text-slate-600"
            onClick={(e) => {
              e.preventDefault()
              setOpen(!open)
            }}
            aria-label="Toggle dropdown"
          >
            <IconChevronDown className={`h-6 w-6 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="mt-1.5 flex list-none flex-col gap-2 pl-9 pr-2 pb-1">
          {item.children.map((child) => {
            const isLocked = !placementCompleted || child.num > highestUnlocked;
            return (
            <li key={child.to}>
              {!isLocked ? (
                <NavLink
                  to={child.to}
                  className={({ isActive }) =>
                    `block w-full rounded-2xl px-5 py-3.5 text-[16px] font-semibold no-underline transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              ) : (
                <span
                  className="block w-full cursor-not-allowed rounded-2xl px-5 py-3.5 text-[16px] font-semibold text-slate-300"
                  aria-disabled="true"
                >
                  {child.label}
                </span>
              )}
            </li>
          )})}
        </ul>
      )}
    </li>
  )
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(loadLearningProgress)

  useEffect(() => {
    const syncProgress = () => setProgress(loadLearningProgress())
    window.addEventListener('storage', syncProgress)
    window.addEventListener(LEARNING_PROGRESS_EVENT, syncProgress)

    return () => {
      window.removeEventListener('storage', syncProgress)
      window.removeEventListener(LEARNING_PROGRESS_EVENT, syncProgress)
    }
  }, [])

  return (
    <div className="grid min-h-svh grid-cols-1 bg-slate-50 font-sans text-[17px] leading-relaxed text-slate-700 md:h-svh md:grid-cols-[260px_1fr] md:overflow-hidden">
      <aside className="relative z-20 flex flex-col gap-11 border-b border-slate-200 bg-white px-7 py-9 md:border-b-0 md:border-r md:overflow-y-auto">
        <NavLink to="/dashboard" className="inline-flex items-center gap-2.5 self-start text-inherit no-underline">
          <span className="flex h-9 w-9 text-blue-600" aria-hidden>
            <IconFlame className="h-9 w-9" />
          </span>
          <span className="text-2xl font-bold tracking-wide text-slate-900">LUMEN</span>
        </NavLink>
        <nav aria-label="App navigation">
          <ul className="flex list-none flex-col gap-1 p-0 md:flex-col">
            {sidebarLinks.map((item) => (
              <SidebarItem key={item.to} item={item} highestUnlocked={progress.highestUnlocked} placementCompleted={progress.placementCompleted} />
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-5">
          <UserProfileBadge onLogout={() => navigate('/', { replace: true })} />
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col md:h-svh md:overflow-y-auto">
        <main className="min-w-0 overflow-x-auto px-6 py-8 md:px-9 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
