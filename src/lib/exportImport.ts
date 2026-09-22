// Exporta e importa todos los datos de la app en un formato abierto y
// autodescriptivo (JSON + fotos dentro de un .zip), pensado para poder
// leerse desde cualquier otra herramienta o app en el futuro, no solo
// desde esta. El formato está documentado en el README.
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { db } from '../db'
import type { Exercise, Session } from '../types'

/** Incrementa esta versión solo si cambias la forma de los campos ya
 * existentes de manera incompatible; añadir campos nuevos opcionales no
 * requiere subir la versión. */
export const EXPORT_SCHEMA_VERSION = 1

interface ExportedPhoto {
  /** Ruta dentro del .zip, relativa a la raíz. */
  file: string
  mimeType: string
}

interface ExportedExercise {
  id: number
  type: Exercise['type']
  name: string
  category?: string
  photo?: ExportedPhoto
  createdAt: string
}

interface ExportedSession {
  id: number
  exerciseId: number
  date: string
  sets?: Session['sets']
  durationMin?: number
  notes?: string
}

export interface ExportFile {
  schemaVersion: number
  exportedAt: string
  exercises: ExportedExercise[]
  sessions: ExportedSession[]
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

export async function exportData(): Promise<Blob> {
  const [exercises, sessions] = await Promise.all([db.exercises.toArray(), db.sessions.toArray()])

  const files: Record<string, Uint8Array> = {}
  const exportedExercises: ExportedExercise[] = []

  for (const ex of exercises) {
    let photo: ExportedPhoto | undefined
    if (ex.photo && ex.id !== undefined) {
      const mimeType = ex.photo.type || 'image/jpeg'
      const fileName = `photos/${ex.id}.${extensionForMime(mimeType)}`
      files[fileName] = new Uint8Array(await ex.photo.arrayBuffer())
      photo = { file: fileName, mimeType }
    }
    exportedExercises.push({
      id: ex.id!,
      type: ex.type,
      name: ex.name,
      category: ex.category,
      photo,
      createdAt: ex.createdAt,
    })
  }

  const exportedSessions: ExportedSession[] = sessions.map((s) => ({
    id: s.id!,
    exerciseId: s.exerciseId,
    date: s.date,
    sets: s.sets,
    durationMin: s.durationMin,
    notes: s.notes,
  }))

  const data: ExportFile = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises: exportedExercises,
    sessions: exportedSessions,
  }

  files['data.json'] = strToU8(JSON.stringify(data, null, 2))

  const zipped = zipSync(files, { level: 6 })
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface ImportSummary {
  exercisesImported: number
  sessionsImported: number
}

export async function importData(
  file: File,
  { replace }: { replace: boolean },
): Promise<ImportSummary> {
  const buffer = new Uint8Array(await file.arrayBuffer())
  const entries = unzipSync(buffer)

  const dataEntry = entries['data.json']
  if (!dataEntry) {
    throw new Error('El archivo no contiene un export válido (falta data.json).')
  }

  let data: ExportFile
  try {
    data = JSON.parse(strFromU8(dataEntry)) as ExportFile
  } catch {
    throw new Error('data.json no es un JSON válido.')
  }
  if (!data.schemaVersion || !Array.isArray(data.exercises) || !Array.isArray(data.sessions)) {
    throw new Error('El archivo no tiene el formato esperado.')
  }

  await db.transaction('rw', db.exercises, db.sessions, async () => {
    if (replace) {
      await db.sessions.clear()
      await db.exercises.clear()
    }

    const idMap = new Map<number, number>()

    for (const ex of data.exercises) {
      let photoBlob: Blob | undefined
      if (ex.photo) {
        const bytes = entries[ex.photo.file]
        if (bytes) {
          photoBlob = new Blob([bytes as BlobPart], { type: ex.photo.mimeType })
        }
      }
      const newId = await db.exercises.add({
        type: ex.type,
        name: ex.name,
        category: ex.category,
        photo: photoBlob,
        createdAt: ex.createdAt ?? new Date().toISOString(),
      })
      idMap.set(ex.id, newId)
    }

    for (const s of data.sessions) {
      const newExerciseId = idMap.get(s.exerciseId)
      if (newExerciseId === undefined) continue
      await db.sessions.add({
        exerciseId: newExerciseId,
        date: s.date,
        sets: s.sets,
        durationMin: s.durationMin,
        notes: s.notes,
      })
    }
  })

  return { exercisesImported: data.exercises.length, sessionsImported: data.sessions.length }
}
