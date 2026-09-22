import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import ExerciseThumb from '../components/ExerciseThumb'
import SessionEntry from '../components/SessionEntry'

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

            <SessionEntry exercise={exercise} session={s} />
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
