import { Link } from 'react-router-dom'
import { IconFlame } from '../components/Icons.jsx'

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50 font-sans text-slate-700">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
        <div className="inline-flex items-center gap-2.5 text-inherit cursor-default select-none">
          <span className="flex h-7 w-7 text-blue-600" aria-hidden>
            <IconFlame />
          </span>
          <span className="text-lg font-bold tracking-wide text-slate-900">LUMEN</span>
        </div>
        <nav className="flex items-center gap-2.5" aria-label="Account">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 no-underline hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-blue-700"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 pb-16">
        <section>
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-blue-600">English learning platform</p>
          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Learn English with a clear path and measurable progress.
          </h1>
          <p className="mb-8 max-w-[52ch] text-[17px] leading-relaxed text-slate-600">
            Create an account, follow structured units in English only, and track your growth on the dashboard — from
            introduction and placement to certification.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-blue-600 px-6 py-3 text-[15px] font-semibold text-white no-underline hover:bg-blue-700"
            >
              Start learning
            </Link>
            <Link
              to="/login"
              className="rounded-xl border-2 border-blue-200 bg-white px-6 py-3 text-[15px] font-semibold text-blue-600 no-underline hover:bg-blue-50"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">
            Key features
          </h2>
          <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-3">
            <li className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2.5 text-base font-semibold text-slate-900">Structured learning</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-600">
                Introduction, optional placement, and level-based modules — every step is about English skills, not other
                languages.
              </p>
            </li>
            <li className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2.5 text-base font-semibold text-slate-900">Progress & dashboard</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-600">
                Streaks, skill breakdowns, and lesson picks help you stay consistent.
              </p>
            </li>
            <li className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2.5 text-base font-semibold text-slate-900">Help & certification</h3>
              <p className="m-0 text-sm leading-relaxed text-slate-600">
                Get support when you need it and work toward a certificate when you are ready.
              </p>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-[13px] text-slate-400">
        <span>© {new Date().getFullYear()} LUMEN Capstone</span>
      </footer>
    </div>
  )
}
