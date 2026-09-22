import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import PhotoPicker from '../components/PhotoPicker'
import { MACHINE_CATEGORIES, type ExerciseType } from '../types'

interface Props {
  mode: 'create' | 'edit'
}

export default function ExerciseForm({ mode }: Props) {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const [type, setType] = useState<ExerciseType>(
    (searchParams.get('type') as ExerciseType) || 'machine',
  )
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [photo, setPhoto] = useState<Blob | undefined>()
  const [loaded, setLoaded] = useState(mode === 'create')

  useEffect(() => {
    if (mode === 'edit' && params.id) {
      db.exercises.get(Number(params.id)).then((ex) => {
        if (ex) {
          setType(ex.type)
          setName(ex.name)
          setCategory(ex.category ?? '')
          setPhoto(ex.photo)
        }
        setLoaded(true)
      })
    }
  }, [mode, params.id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    if (mode === 'create') {
      const id = await db.exercises.add({
        type,
        name: name.trim(),
        category: type === 'machine' ? category.trim() || undefined : undefined,
        photo,
        createdAt: new Date().toISOString(),
      })
      navigate(`/exercise/${id}`, { replace: true })
    } else if (params.id) {
      await db.exercises.update(Number(params.id), {
        name: name.trim(),
        category: type === 'machine' ? category.trim() || undefined : undefined,
        photo,
      })
      navigate(`/exercise/${params.id}`, { replace: true })
    }
  }

  async function handleDelete() {
    if (!params.id) return
    if (!confirm('¿Eliminar esta ficha y todo su historial? Esta acción no se puede deshacer.')) {
      return
    }
    const exerciseId = Number(params.id)
    await db.transaction('rw', db.exercises, db.sessions, async () => {
      await db.sessions.where('exerciseId').equals(exerciseId).delete()
      await db.exercises.delete(exerciseId)
    })
    navigate('/', { replace: true })
  }

  if (!loaded) return <div className="page">Cargando…</div>

  return (
    <div className="page">
      <header className="app-header app-header--with-back">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="Volver">
          ←
        </button>
        <h1>
          {mode === 'create'
            ? type === 'machine'
              ? 'Nueva máquina'
              : 'Nueva actividad'
            : 'Editar ficha'}
        </h1>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <PhotoPicker value={photo} onChange={setPhoto} />

        <label className="field">
          <span>Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'machine' ? 'Ej. Press banca' : 'Ej. Spinning'}
            required
          />
        </label>

        {type === 'machine' && (
          <label className="field">
            <span>Categoría</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="machine-categories"
              placeholder="Ej. Pecho"
            />
            <datalist id="machine-categories">
              {MACHINE_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        )}

        <button type="submit" className="btn-primary">
          Guardar
        </button>

        {mode === 'edit' && (
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Eliminar {type === 'machine' ? 'máquina' : 'actividad'}
          </button>
        )}
      </form>
    </div>
  )
}
