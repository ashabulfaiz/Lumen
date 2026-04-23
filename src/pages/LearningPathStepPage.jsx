import { Link, useLocation } from 'react-router-dom'

const stepContentByPath = {
  '/learning/introduction': {
    title: 'Introduction',
    description:
      'Welcome to LUMEN learning flow. This short onboarding explains how units work, where to monitor your progress, and how to stay consistent each day.',
    points: [
      'Follow unit order from the level you unlock.',
      'Check dashboard metrics to monitor your improvement.',
      'Use help resources whenever a topic feels difficult.',
    ],
    nextPath: '/learning/placement',
    nextLabel: 'Next: Placement Test',
  },
  '/learning/placement': {
    title: 'Placement Test',
    description:
      'Take a quick placement to estimate your starting level. If you skip it, you can still choose the level manually on the learning page.',
    points: [
      'Assessment is short and practical.',
      'Result gives a recommended starting level.',
      'You can adjust your level choice anytime later.',
    ],
    prevPath: '/learning/introduction',
    prevLabel: 'Previous: Introduction',
    nextPath: '/learning/levels',
    nextLabel: 'Next: Choose Your Level',
  },
  '/learning/levels': {
    title: 'Choose Your Level',
    description:
      'Pick the level that matches your current English ability. Higher levels stay locked until you complete your current top level.',
    points: [
      'Level 1: Foundation',
      'Level 2: Intermediate',
      'Level 3: Advanced',
    ],
    prevPath: '/learning/placement',
    prevLabel: 'Previous: Placement Test',
    nextPath: '/learning/practice',
    nextLabel: 'Next: Quizzes & Practice',
  },
  '/learning/practice': {
    title: 'Quizzes & Practice',
    description:
      'Strengthen your learning with short quizzes and review exercises after each unit. Practice helps retention and fluency over time.',
    points: [
      'Unit quizzes check understanding.',
      'Mixed review builds long-term memory.',
      'Daily short practice is more effective than cramming.',
    ],
    prevPath: '/learning/levels',
    prevLabel: 'Previous: Choose Your Level',
  },
}

export default function LearningPathStepPage() {
  const { pathname } = useLocation()
  const content = stepContentByPath[pathname] ?? stepContentByPath['/learning/introduction']

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 font-sans">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Learning path</p>
      <h1 className="mb-3 text-[26px] font-bold tracking-tight text-slate-900">{content.title}</h1>
      <p className="mb-6 text-[15px] leading-relaxed text-slate-600">{content.description}</p>

      <ul className="mb-7 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        {content.points.map((point) => (
          <li key={point}>- {point}</li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/learning"
          className="inline-flex rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
        >
          Back to learning page
        </Link>
        {content.prevPath && (
          <Link
            to={content.prevPath}
            className="inline-flex rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
          >
            {content.prevLabel || 'Previous'}
          </Link>
        )}
        {content.nextPath && (
          <Link
            to={content.nextPath}
            className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-700"
          >
            {content.nextLabel || 'Next'}
          </Link>
        )}
      </div>
    </div>
  )
}
