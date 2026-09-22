import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db'

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const monthStart = toDateKey(cursor.year, cursor.month, 1)
  const monthEnd = toDateKey(cursor.year, cursor.month, daysInMonth)

  const sessions = useLiveQuery(
    () => db.sessions.where('date').between(monthStart, monthEnd, true, true).toArray(),
    [monthStart, monthEnd],
  )
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])

  const exerciseTypeById = useMemo(() => {
    const map = new Map<number, 'machine' | 'activity'>()
    exercises?.forEach((ex) => {
      if (ex.id !== undefined) map.set(ex.id, ex.type)
    })
    return map
  }, [exercises])

  const dayFlags = useMemo(() => {
    const map = new Map<string, { machine: boolean; activity: boolean }>()
    sessions?.forEach((s) => {
      const type = exerciseTypeById.get(s.exerciseId)
      if (!type) return
      const flags = map.get(s.date) ?? { machine: false, activity: false }
      if (type === 'machine') flags.machine = true
      else flags.activity = true
      map.set(s.date, flags)
    })
    return map
  }, [sessions, exerciseTypeById])

  // Semana empezando en lunes: 0 = lunes ... 6 = domingo
  const firstWeekday = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = capitalize(
    new Date(cursor.year, cursor.month, 1).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    }),
  )

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === cursor.year && today.getMonth() === cursor.month

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function goToday() {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
  }

  return (
    <div className="page">
      <header className="app-header app-header--with-back">
        <button className="btn-back" onClick={() => navigate('/')} aria-label="Volver">
          ←
        </button>
        <h1>Calendario</h1>
      </header>

      <div className="calendar-nav">
        <button className="btn-icon" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
          ‹
        </button>
        <button className="calendar-month-label" onClick={goToday}>
          {monthLabel}
        </button>
        <button className="btn-icon" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-dot legend-dot--machine" /> Máquinas
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot--activity" /> Actividades
        </span>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="calendar-weekday">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="calendar-cell calendar-cell--empty" />
          }
          const dateKey = toDateKey(cursor.year, cursor.month, day)
          const flags = dayFlags.get(dateKey)
          const isToday = isCurrentMonth && day === today.getDate()
          return (
            <Link
              key={i}
              to={`/calendar/${dateKey}`}
              className={`calendar-cell${isToday ? ' calendar-cell--today' : ''}`}
            >
              <span className="calendar-cell__day">{day}</span>
              <span className="calendar-cell__marks">
                {flags?.machine && <span className="calendar-mark calendar-mark--machine" />}
                {flags?.activity && <span className="calendar-mark calendar-mark--activity" />}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
