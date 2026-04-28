import { Link } from 'react-router-dom'

const pathSteps = [
  {
    id: 'intro',
    title: 'Introduction',
    description:
      'Short onboarding that explains how the course works, how to track progress, and how to get help when you are stuck.',
    cta: 'Start here',
    to: '/learning/introduction',
  },
  {
    id: 'placement',
    title: 'Placement test',
    description:
      'A quick skills check so we can suggest a starting level. You can skip it and pick a level below that matches your ability.',
    cta: 'Take placement',
    to: '/learning/placement',
  },
  {
    id: 'level-flow',
    title: 'Choose your level',
    description:
      'Select Beginner, Intermediate, or Advanced based on your skills. You can study every level up to the one you choose; the next level stays locked until you complete your current top level.',
    cta: 'Open level chooser',
    to: '/learning/levels',
  },
]

export default function LearningPage() {
  return (
    <div className="mx-auto max-w-[880px] pb-12 pt-2 font-sans">
      <header className="mb-9">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">General English</p>
        <h1 className="mb-3 text-[clamp(1.5rem,3vw,1.875rem)] font-bold tracking-tight text-slate-900">
          Your learning path
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-slate-600">
          LUMEN is built for English only: every unit and recommendation focuses on real-world English skills — not other
          languages.
        </p>
      </header>

      <section className="mb-10" aria-labelledby="path-heading">
        <h2 id="path-heading" className="mb-4 text-lg font-bold text-slate-900">
          How the course flows
        </h2>
        <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
          {pathSteps.map((step, index) => (
            <li
              key={step.id}
              id={step.id}
              className="scroll-mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex gap-4 py-4 pl-4 pr-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-sm font-bold text-blue-600"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1.5 text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mb-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                  <Link
                    to={step.to}
                    className="mt-0.5 inline-flex items-center justify-center rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-bold text-blue-600 no-underline transition hover:border-blue-300 hover:bg-blue-100 active:translate-y-px"
                  >
                    {step.cta}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-8">
        <Link
          to="/dashboard"
          className="inline-flex rounded-xl border-2 border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}
