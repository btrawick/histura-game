export type Category = 'family' | 'school' | 'memories' | 'traditions'

export const DEFAULT_CATEGORIES: Category[] = ['family', 'school', 'memories', 'traditions']

const QUESTIONS: Record<Category, { id: string; text: string }[]> = {
  family: [
    { id: 'fam-1', text: 'What is your earliest family memory?' },
    { id: 'fam-2', text: 'Describe a family tradition you love.' },
  ],
  school: [
    { id: 'sch-1', text: 'What was your favorite subject and why?' },
    { id: 'sch-2', text: 'Tell me about a teacher who inspired you.' },
  ],
  memories: [
    { id: 'mem-1', text: 'A moment you’ll never forget?' },
    { id: 'mem-2', text: 'A time you felt very proud.' },
  ],
  traditions: [
    { id: 'trd-1', text: 'A holiday tradition you enjoy.' },
    { id: 'trd-2', text: 'A meal or recipe that brings back memories.' },
  ],
}

export function randomQuestion(selected: Category[]): { id: string; text: string; category: Category } {
  const pool = selected.flatMap((c) => QUESTIONS[c].map((q) => ({ ...q, category: c })))
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}
