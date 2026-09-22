import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import ExerciseThumb from '../components/ExerciseThumb'

export default function ExerciseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const exerciseId = Number(id)

  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId])
  const sessions = useLiveQuery(
    () => db.sessions.where('exerciseId').equals(exerciseId).reverse().sortBy('date'),
    [exerciseId],
  )

  async function handleDeleteSession(sessionId?: number) {
    if (!sessionId) return
    if (!confirm('¿Eliminar esta sesión?')) return
    await db.sessions.delete(sessionId)
  }

  if (exercise === undefined) return <div className="page">Cargando…</div>
  if (exercise === null) return <div className="page">No encontrado.</div>

  return (
    <div className="page">
      <header className="app-header app-header--with-back">
        <button className="btn-back" onClick={() => navigate('/')} aria-label="Volver">
          ←
        </button>
        <h1>{exercise.name}</h1>
        <Link to={`/exercise/${exercise.id}/edit`} className="btn-icon" aria-label="Editar">
          ✎
        </Link>
      </header>

      <div className="detail-photo">
        <ExerciseThumb photo={exercise.photo} icon={exercise.type === 'machine' ? '🏋️' : '🏃'} />
      </div>

      {exercise.category && <p className="detail-category">{exercise.category}</p>}

      <Link to={`/exercise/${exercise.id}/session/new`} className="btn-primary btn-block">
        + Añadir sesión
      </Link>

      <h2 className="section-title">Historial</h2>

      {sessions && sessions.length === 0 && <p className="empty-state">Sin sesiones todavía.</p>}

      <ul className="session-list">
        {sessions?.map((s) => (
          <li key={s.id} className="session-item">
            <div className="session-item__header">
              <strong>{formatDate(s.date)}</strong>
              <div className="session-item__actions">
                <Link to={`/exercise/${exercise.id}/session/${s.id}/edit`} className="btn-link">
                  Editar
                </Link>
                <button
                  type="button"
                  className="btn-link btn-link--danger"
                  onClick={() => handleDeleteSession(s.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>

            {exercise.type === 'machine' && s.sets && s.sets.length > 0 && (
              <ul className="set-list">
                {s.sets.map((set, i) => (
                  <li key={i}>
                    Serie {i + 1}: {set.reps} reps × {set.weight} kg
                  </li>
                ))}
                <li className="set-list__total">
                  Volumen total: {s.sets.reduce((sum, set) => sum + set.reps * set.weight, 0)} kg
                </li>
              </ul>
            )}

            {exercise.type === 'activity' && s.durationMin !== undefined && (
              <p className="session-item__duration">{s.durationMin} min</p>
            )}

            {s.notes && <p className="session-item__notes">{s.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
