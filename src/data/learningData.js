export const LEARNING_PROGRESS_KEY = 'lumen_learning_progress'
export const LEARNING_PROGRESS_EVENT = 'lumen-learning-progress-changed'

export const levelTracks = [
  {
    num: 1,
    title: 'Beginner',
    summary: 'Foundation — core grammar, everyday vocabulary, and simple communication.',
  },
  {
    num: 2,
    title: 'Intermediate',
    summary: 'Intermediate — reading short texts, listening tasks, and clearer speaking goals.',
  },
  {
    num: 3,
    title: 'Advanced',
    summary: 'Upper intermediate — longer passages, nuanced grammar, and discussion skills.',
  },
]

export const unitsByLevel = {
  1: [
    {
      title: 'Core grammar',
      subtitle: 'Present simple & continuous, word order, and common questions',
      duration: '25 min',
      tag: 'Foundation',
    },
    {
      title: 'Everyday vocabulary',
      subtitle: 'Daily routines, work, travel, and useful phrases',
      duration: '20 min',
      tag: 'Foundation',
    },
  ],
  2: [
    {
      title: 'Reading short texts',
      subtitle: 'Skimming, key details, and building reading speed in English',
      duration: '18 min',
      tag: 'Intermediate',
    },
    {
      title: 'Listening for gist',
      subtitle: 'Conversations and announcements with comprehension tasks',
      duration: '22 min',
      tag: 'Intermediate',
    },
  ],
  3: [
    {
      title: 'Opinion essays & linking',
      subtitle: 'Structure arguments, connectors, and tone in written English',
      duration: '28 min',
      tag: 'Advanced',
    },
    {
      title: 'Real-world dialogues',
      subtitle: 'Fast speech, fillers, and implied meaning in longer exchanges',
      duration: '24 min',
      tag: 'Advanced',
    },
  ],
}

export const learningLevels = {
  beginner: {
    title: 'Beginner',
    description: 'Master the essentials and build your foundation',
    lessons: [
      { id: 1, title: 'Alphabet & Pronunciation', description: 'Learn the English alphabet and basic sounds', duration: '15 min', status: 'completed' },
      { id: 2, title: 'Common Greetings', description: 'Master essential greetings and introductions', duration: '12 min', status: 'completed' },
      { id: 3, title: 'Numbers 1-100', description: 'Count and use numbers in everyday situations', duration: '18 min', status: 'available' },
      { id: 4, title: 'Basic Verbs', description: 'Learn the most common English verbs', duration: '20 min', status: 'available' },
      { id: 5, title: 'Colors & Objects', description: 'Describe things around you with colors', duration: '15 min', status: 'locked' },
      { id: 6, title: 'Family Members', description: 'Talk about your family in English', duration: '16 min', status: 'locked' },
    ],
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Master the essentials and build your foundation',
    lessons: [
      { id: 1, title: 'Present Tense Conjugation', description: 'Master regular verb conjugations', duration: '25 min', status: 'available' },
      { id: 2, title: 'Irregular Verbs', description: 'Learn common irregular verb patterns', duration: '30 min', status: 'available' },
      { id: 3, title: 'Past Tense (Preterite)', description: 'Talk about completed past actions', duration: '28 min', status: 'locked' },
      { id: 4, title: 'Direct & Indirect Objects', description: 'Use pronouns effectively', duration: '22 min', status: 'locked' },
      { id: 5, title: 'Making Comparisons', description: 'Compare things using more, menos, tan', duration: '20 min', status: 'locked' },
      { id: 6, title: 'Future Tense', description: 'Express plans and predictions', duration: '24 min', status: 'locked' },
    ],
  },
  advanced: {
    title: 'Advanced',
    description: 'Sharpen fluency with complex grammar and discussion skills',
    lessons: [
      { id: 1, title: 'Complex sentences', description: 'Use relative clauses and connectors naturally', duration: '26 min', status: 'available' },
      { id: 2, title: 'Nuanced tenses', description: 'Perfect tenses and time expressions in context', duration: '32 min', status: 'locked' },
      { id: 3, title: 'Discussion skills', description: 'Agree, disagree, and clarify with confidence', duration: '24 min', status: 'locked' },
    ],
  },
}

export const levelSlugByNumber = {
  1: 'beginner',
  2: 'intermediate',
  3: 'advanced',
}

export const levelNumberBySlug = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
}

export function getLevelPath(level) {
  const slug = typeof level === 'number' ? levelSlugByNumber[level] : String(level || '').toLowerCase()
  return slug ? `/learning/${slug}` : '/learning/levels'
}

export function loadLearningProgress() {
  if (typeof window === 'undefined') {
    return { chosenLevel: null, highestUnlocked: 1 }
  }

  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY)
    if (!raw) return { chosenLevel: null, highestUnlocked: 1 }

    const data = JSON.parse(raw)
    const chosenLevel = typeof data?.chosenLevel === 'number' ? data.chosenLevel : null
    const highestUnlocked = typeof data?.highestUnlocked === 'number' ? data.highestUnlocked : 1

    return {
      chosenLevel: chosenLevel != null && chosenLevel >= 1 && chosenLevel <= 3 ? chosenLevel : null,
      highestUnlocked: highestUnlocked >= 1 && highestUnlocked <= 3 ? highestUnlocked : 1,
    }
  } catch {
    return { chosenLevel: null, highestUnlocked: 1 }
  }
}

export function saveLearningProgress(chosenLevel, highestUnlocked) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify({ chosenLevel, highestUnlocked }))
    window.dispatchEvent(new CustomEvent(LEARNING_PROGRESS_EVENT))
  } catch {
    /* ignore */
  }
}

export function clearLearningProgress() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(LEARNING_PROGRESS_KEY)
    window.dispatchEvent(new CustomEvent(LEARNING_PROGRESS_EVENT))
  } catch {
    /* ignore */
  }
}

