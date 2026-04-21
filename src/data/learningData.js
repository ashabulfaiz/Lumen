export const LEARNING_PROGRESS_KEY = 'lumen_learning_progress'

export const levelTracks = [
  {
    num: 1,
    title: 'Level 1',
    summary: 'Foundation — core grammar, everyday vocabulary, and simple communication.',
  },
  {
    num: 2,
    title: 'Level 2',
    summary: 'Intermediate — reading short texts, listening tasks, and clearer speaking goals.',
  },
  {
    num: 3,
    title: 'Level 3',
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

