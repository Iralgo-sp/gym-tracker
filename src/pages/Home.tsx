import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import ExerciseThumb from '../components/ExerciseThumb'
import type { ExerciseType } from '../types'

export default function Home() {
  const [tab, setTab] = useState<ExerciseType>('machine')

  const exercises = useLiveQuery(
    () => db.exercises.where('type').equals(tab).sortBy('name'),
    [tab],
  )

  return (
    <div className="page">
      <header className="app-header">
        <h1>Control Gimnasio</h1>
      </header>

      <div className="tabs">
        <button
          className={tab === 'machine' ? 'tab tab--active' : 'tab'}
          onClick={() => setTab('machine')}
        >
          Máquinas
        </button>
        <button
          className={tab === 'activity' ? 'tab tab--active' : 'tab'}
          onClick={() => setTab('activity')}
        >
          Actividades
        </button>
      </div>

      {exercises && exercises.length === 0 && (
        <p className="empty-state">
          {tab === 'machine'
            ? 'Todavía no has añadido ninguna máquina.'
            : 'Todavía no has añadido ninguna actividad.'}
        </p>
      )}

      <div className="card-grid">
        {exercises?.map((ex) => (
          <Link key={ex.id} to={`/exercise/${ex.id}`} className="card">
            <ExerciseThumb photo={ex.photo} icon={tab === 'machine' ? '🏋️' : '🏃'} />
            <div className="card__body">
              <strong>{ex.name}</strong>
              {ex.category && <span className="card__category">{ex.category}</span>}
            </div>
          </Link>
        ))}
      </div>

      <Link to={`/exercise/new?type=${tab}`} className="fab" aria-label="Añadir">
        +
      </Link>
    </div>
  )
}
