import { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import Layout from './components/Layout'

export default function App() {
  const [user, setUser] = useState(null)

  const handleLogout = useCallback(() => {
    setUser(null)
  }, [])

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/chat" element={<Chat user={user} />} />
        <Route path="/activity" element={<Activity user={user} />} />
        <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
