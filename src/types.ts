export type ExerciseType = 'machine' | 'activity'

export interface Exercise {
  id?: number
  type: ExerciseType
  name: string
  /** Solo aplica a máquinas (grupo muscular, zona, etc.) */
  category?: string
  photo?: Blob
  createdAt: string
}

export interface SetEntry {
  reps: number
  weight: number
}

export interface Session {
  id?: number
  exerciseId: number
  /** Fecha en formato YYYY-MM-DD */
  date: string
  /** Series x repeticiones x peso — solo para máquinas */
  sets?: SetEntry[]
  /** Duración en minutos — solo para actividades */
  durationMin?: number
  notes?: string
}

export const MACHINE_CATEGORIES = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core / Abdomen',
  'Glúteos',
  'Cardio',
  'Otro',
] as const
