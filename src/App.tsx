import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ExerciseDetail from './pages/ExerciseDetail'
import ExerciseForm from './pages/ExerciseForm'
import SessionForm from './pages/SessionForm'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/exercise/new" element={<ExerciseForm mode="create" />} />
      <Route path="/exercise/:id" element={<ExerciseDetail />} />
      <Route path="/exercise/:id/edit" element={<ExerciseForm mode="edit" />} />
      <Route path="/exercise/:id/session/new" element={<SessionForm mode="create" />} />
      <Route path="/exercise/:id/session/:sessionId/edit" element={<SessionForm mode="edit" />} />
    </Routes>
  )
}
