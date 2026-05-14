import api from '../lib/axiosInstance';
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
    return { chosenLevel: null, highestUnlocked: 1, placementCompleted: false, completedLessons: [] }
  }

  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY)
    if (!raw) return { chosenLevel: null, highestUnlocked: 1, placementCompleted: false, completedLessons: [] }

    const data = JSON.parse(raw)
    const chosenLevel = typeof data?.chosenLevel === 'number' ? data.chosenLevel : null
    const highestUnlocked = typeof data?.highestUnlocked === 'number' ? data.highestUnlocked : 1
    const placementCompleted = !!data?.placementCompleted
    const completedLessons = Array.isArray(data?.completedLessons) ? data.completedLessons : []

    return {
      chosenLevel: placementCompleted && chosenLevel != null && chosenLevel >= 1 && chosenLevel <= 3 ? chosenLevel : null,
      highestUnlocked: highestUnlocked >= 1 && highestUnlocked <= 3 ? highestUnlocked : 1,
      placementCompleted,
      completedLessons,
    }
  } catch {
    return { chosenLevel: null, highestUnlocked: 1, placementCompleted: false, completedLessons: [] }
  }
}

export function saveLearningProgress(chosenLevel, highestUnlocked, placementCompleted = false, completedLessons) {
  if (typeof window === 'undefined') return

  if (!completedLessons) {
    const existing = loadLearningProgress()
    completedLessons = existing.completedLessons || []
  }

  try {
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify({ chosenLevel, highestUnlocked, placementCompleted, completedLessons }))
    window.dispatchEvent(new CustomEvent(LEARNING_PROGRESS_EVENT))
  } catch {
    /* ignore */
  }
}

export function markLessonCompleted(levelSlug, lessonId) {
  const progress = loadLearningProgress()
  const lessonKey = `${levelSlug}-${lessonId}`
  if (!progress.completedLessons.includes(lessonKey)) {
    progress.completedLessons.push(lessonKey)
    saveLearningProgress(progress.chosenLevel, progress.highestUnlocked, progress.placementCompleted, progress.completedLessons)
  }
}

export function clearLearningProgress() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(LEARNING_PROGRESS_KEY)
    localStorage.removeItem('lumen_placement_result')
    window.dispatchEvent(new CustomEvent(LEARNING_PROGRESS_EVENT))
  } catch {
    /* ignore */
  }
}

export function getLessonsWithStatus(slug, progress) {
  const level = learningLevels[slug]
  if (!level) return []
  
  if (!progress) {
    progress = loadLearningProgress()
  }

  return level.lessons.map((lesson, index) => {
    const lessonKey = `${slug}-${lesson.id}`
    const isCompleted = progress.completedLessons.includes(lessonKey)
    let computedStatus = 'locked'
    
    if (isCompleted) {
      computedStatus = 'completed'
    } else {
      if (index === 0) {
        computedStatus = 'available'
      } else {
        const prevLessonKey = `${slug}-${level.lessons[index - 1].id}`
        if (progress.completedLessons.includes(prevLessonKey)) {
          computedStatus = 'available'
        }
      }
    }

    return { ...lesson, status: computedStatus }
  })
}

export async function syncLearningProgressFromDB() {
  if (typeof window === 'undefined') return;

  try {
    const token = localStorage.getItem('lumen_token');
    if (!token) return;

    const response = await api.get('/progress/my-progress');
    const dbData = response.data.data;

    const levelMap = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    const dbHighestUnlocked = levelMap[dbData.current_level] || 1;
    const isPlacementCompleted = Boolean(dbData.is_onboarding_complete);

    const localProgress = loadLearningProgress();

    saveLearningProgress(
      localProgress.chosenLevel || dbHighestUnlocked,
      dbHighestUnlocked, 
      isPlacementCompleted,
      localProgress.completedLessons
    );

    console.log("✅ Progress successfully synced from Database!");
  } catch (error) {
    console.error("❌ Failed to sync data from DB:", error);
  }
}

