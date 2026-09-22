import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import SessionEntry from '../components/SessionEntry'
import type { Exercise, Session } from '../types'

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function DayDetail() {
  const { date } = useParams()
  const navigate = useNavigate()

  const sessions = useLiveQuery(() => {
    if (!date) return Promise.resolve<Session[]>([])
    return db.sessions.where('date').equals(date).toArray()
  }, [date])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])

  const exerciseById = useMemo(() => {
    const map = new Map<number, Exercise>()
    exercises?.forEach((ex) => {
      if (ex.id !== undefined) map.set(ex.id, ex)
    })
    return map
  }, [exercises])

  const items = useMemo(() => {
    const result: { session: Session; exercise: Exercise }[] = []
    for (const session of sessions ?? []) {
      const exercise = exerciseById.get(session.exerciseId)
      if (exercise) result.push({ session, exercise })
    }
    result.sort((a, b) => a.exercise.name.localeCompare(b.exercise.name))
    return result
  }, [sessions, exerciseById])

  if (!date) return null

  return (
    <div className="page">
      <header className="app-header app-header--with-back">
        <button className="btn-back" onClick={() => navigate('/calendar')} aria-label="Volver">
          ←
        </button>
        <h1>{formatDate(date)}</h1>
      </header>

      {sessions && items.length === 0 && <p className="empty-state">Sin actividad este día.</p>}

      <ul className="session-list">
        {items.map(({ session, exercise }) => (
          <li key={session.id} className="session-item">
            <div className="session-item__header">
              <Link to={`/exercise/${exercise.id}`} className="day-item__exercise">
                <span
                  className={`legend-dot ${
                    exercise.type === 'machine' ? 'legend-dot--machine' : 'legend-dot--activity'
                  }`}
                />
                <strong>{exercise.name}</strong>
                {exercise.category && <span className="card__category"> · {exercise.category}</span>}
              </Link>
              <Link to={`/exercise/${exercise.id}/session/${session.id}/edit`} className="btn-link">
                Editar
              </Link>
            </div>

            <SessionEntry exercise={exercise} session={session} />
          </li>
        ))}
      </ul>
    </div>
  )
}
