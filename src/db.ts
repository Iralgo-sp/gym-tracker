import Dexie, { type Table } from 'dexie'
import type { Exercise, Session } from './types'

export class GymDatabase extends Dexie {
  exercises!: Table<Exercise, number>
  sessions!: Table<Session, number>

  constructor() {
    super('gym-tracker-db')
    this.version(1).stores({
      exercises: '++id, type, name',
      sessions: '++id, exerciseId, date',
    })
  }
}

export const db = new GymDatabase()
