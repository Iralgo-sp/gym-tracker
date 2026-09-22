import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import type { Exercise, SetEntry } from '../types'

function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

interface Props {
  mode: 'create' | 'edit'
}

export default function SessionForm({ mode }: Props) {
  const navigate = useNavigate()
  const params = useParams()
  const exerciseId = Number(params.id)

  const [exercise, setExercise] = useState<Exercise | undefined>()
  const [date, setDate] = useState(todayISO())
  const [sets, setSets] = useState<SetEntry[]>([{ reps: 0, weight: 0 }])
  const [durationMin, setDurationMin] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    db.exercises.get(exerciseId).then((ex) => setExercise(ex))
  }, [exerciseId])

  useEffect(() => {
    if (mode === 'edit' && params.sessionId) {
      db.sessions.get(Number(params.sessionId)).then((s) => {
        if (s) {
          setDate(s.date)
          if (s.sets && s.sets.length > 0) setSets(s.sets)
          if (s.durationMin !== undefined) setDurationMin(s.durationMin)
          setNotes(s.notes ?? '')
        }
        setLoaded(true)
      })
    } else {
      setLoaded(true)
    }
  }, [mode, params.sessionId])

  function updateSet(index: number, field: keyof SetEntry, value: number) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function addSet() {
    setSets((prev) => {
      const last = prev[prev.length - 1]
      return [...prev, last ? { ...last } : { reps: 0, weight: 0 }]
    })
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!exercise) return

    const payload =
      exercise.type === 'machine'
        ? {
            exerciseId,
            date,
            sets: sets.filter((s) => s.reps > 0 || s.weight > 0),
            notes: notes.trim() || undefined,
          }
        : {
            exerciseId,
            date,
            durationMin,
            notes: notes.trim() || undefined,
          }

    if (mode === 'create') {
      await db.sessions.add(payload)
    } else if (params.sessionId) {
      await db.sessions.update(Number(params.sessionId), payload)
    }
    navigate(`/exercise/${exerciseId}`, { replace: true })
  }

  async function handleDelete() {
    if (!params.sessionId) return
    if (!confirm('¿Eliminar esta sesión?')) return
    await db.sessions.delete(Number(params.sessionId))
    navigate(`/exercise/${exerciseId}`, { replace: true })
  }

  if (!exercise || !loaded) return <div className="page">Cargando…</div>

  return (
    <div className="page">
      <header className="app-header app-header--with-back">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="Volver">
          ←
        </button>
        <h1>{mode === 'create' ? 'Nueva sesión' : 'Editar sesión'}</h1>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        {exercise.type === 'machine' ? (
          <div className="set-editor">
            <span className="field-label">Series</span>
            {sets.map((set, i) => (
              <div key={i} className="set-row">
                <span className="set-row__index">{i + 1}</span>
                <label className="set-row__field">
                  <span>Reps</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(i, 'reps', Number(e.target.value))}
                  />
                </label>
                <label className="set-row__field">
                  <span>Peso (kg)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    value={set.weight || ''}
                    onChange={(e) => updateSet(i, 'weight', Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="btn-icon btn-icon--danger"
                  onClick={() => removeSet(i)}
                  disabled={sets.length === 1}
                  aria-label="Quitar serie"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addSet}>
              + Añadir serie
            </button>
          </div>
        ) : (
          <label className="field">
            <span>Duración (min)</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={durationMin || ''}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              required
            />
          </label>
        )}

        <label className="field">
          <span>Notas (opcional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        <button type="submit" className="btn-primary">
          Guardar sesión
        </button>

        {mode === 'edit' && (
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Eliminar sesión
          </button>
        )}
      </form>
    </div>
  )
}
