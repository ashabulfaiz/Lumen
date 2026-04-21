import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center font-sans">
      <h1 className="mb-3 text-[22px] font-bold text-slate-900">{title}</h1>
      <p className="mb-6 text-[15px] leading-relaxed text-slate-600">{description}</p>
      <Link
        to="/dashboard"
        className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
