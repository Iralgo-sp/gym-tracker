import type { Exercise, Session } from '../types'

interface Props {
  exercise: Exercise
  session: Session
}

/** Series/duración/notas de una sesión, compartido entre la ficha del
 * ejercicio y el detalle de un día del calendario. */
export default function SessionEntry({ exercise, session }: Props) {
  return (
    <>
      {exercise.type === 'machine' && session.sets && session.sets.length > 0 && (
        <ul className="set-list">
          {session.sets.map((set, i) => (
            <li key={i}>
              Serie {i + 1}: {set.reps} reps × {set.weight} kg
            </li>
          ))}
          <li className="set-list__total">
            Volumen total: {session.sets.reduce((sum, set) => sum + set.reps * set.weight, 0)} kg
          </li>
        </ul>
      )}

      {exercise.type === 'activity' && session.durationMin !== undefined && (
        <p className="session-item__duration">{session.durationMin} min</p>
      )}

      {session.notes && <p className="session-item__notes">{session.notes}</p>}
    </>
  )
}
