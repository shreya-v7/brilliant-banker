import { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// SMB pages
import Login from './pages/Login'
import Marketing from './pages/Marketing'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import Layout from './components/Layout'

// Banker pages
import BankerLayout from './components/BankerLayout'
import BankerDashboard from './pages/banker/BankerDashboard'
import BankerClients from './pages/banker/BankerClients'
import BankerCreditReview from './pages/banker/BankerCreditReview'
import BankerSMBProfile from './pages/banker/BankerSMBProfile'
import BankerProfile from './pages/banker/BankerProfile'

export default function App() {
  const [user, setUser] = useState(null)
  const [showMarketing, setShowMarketing] = useState(false)

  const handleLogout = useCallback(() => {
    setUser(null)
  }, [])

  if (showMarketing) {
    return <Marketing onBack={() => setShowMarketing(false)} />
  }

  if (!user) {
    return <Login onLogin={setUser} onShowMarketing={() => setShowMarketing(true)} />
  }

  // ── Banker shell ────────────────────────────────────────────────────────────
  if (user.role === 'banker') {
    return (
      <BankerLayout user={user}>
        <Routes>
          <Route path="/banker" element={<BankerDashboard user={user} />} />
          <Route path="/banker/clients" element={<BankerClients user={user} />} />
          <Route path="/banker/clients/:id" element={<BankerSMBProfile user={user} />} />
          <Route path="/banker/credit" element={<BankerCreditReview user={user} />} />
          <Route path="/banker/profile" element={<BankerProfile user={user} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/banker" replace />} />
        </Routes>
      </BankerLayout>
    )
  }

  // ── SMB owner shell ─────────────────────────────────────────────────────────
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
