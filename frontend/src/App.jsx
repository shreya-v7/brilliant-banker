import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

// SMB pages
import Login from './pages/Login'
import Marketing from './pages/Marketing'
import Scene from './pages/Scene'
import ScreenLinks from './pages/ScreenLinks'
import { login, bankerLogin } from './api'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import Forms from './pages/Forms'
import Layout from './components/Layout'
import DemoGuide from './components/DemoGuide'

// Banker pages
import BankerLayout from './components/BankerLayout'
import BankerDashboard from './pages/banker/BankerDashboard'
import BankerClients from './pages/banker/BankerClients'
import BankerCreditReview from './pages/banker/BankerCreditReview'
import BankerSMBProfile from './pages/banker/BankerSMBProfile'
import BankerProfile from './pages/banker/BankerProfile'

const SARAH_CHEN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

export default function App() {
  const [user, setUser] = useState(null)
  const [showDemo, setShowDemo] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isBankerPath = location.pathname.startsWith('/banker')
  const isBusinessPath = location.pathname.startsWith('/business')

  useEffect(() => {
    if (!showDemo) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShowDemo(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showDemo])

  const handleLogout = useCallback(() => {
    setUser(null)
    navigate('/')
  }, [navigate])

  const handleLogin = useCallback(
    (u) => {
      setUser(u)
      const path = location.pathname
      if (u.role === 'banker' && path.startsWith('/banker')) {
        navigate(path, { replace: true })
      } else if (u.role === 'smb' && path.startsWith('/business')) {
        navigate(path, { replace: true })
      } else {
        navigate(u.role === 'banker' ? '/banker' : '/business')
      }
    },
    [navigate, location.pathname],
  )

  const handleSceneLogin = useCallback(async (smbId) => {
    try {
      const userData = await login(smbId)
      setUser({ ...userData, role: 'smb' })
      navigate('/business')
    } catch {
      navigate('/')
    }
  }, [navigate])

  const handleSwitchToBanker = useCallback(async () => {
    const banker = await bankerLogin(SARAH_CHEN_ID)
    setUser({ ...banker, role: 'banker' })
    navigate('/banker')
  }, [navigate])

  // ── URL index (always reachable; shareable) ─────────────────────────────────
  if (location.pathname === '/links') {
    return <ScreenLinks />
  }

  // ── Public full-screen pages (routes) ───────────────────────────────────────
  if (!user && location.pathname === '/scene') {
    return <Scene onBack={() => navigate('/')} onLoginAsCharacter={handleSceneLogin} />
  }

  if (!user && location.pathname === '/marketing') {
    return <Marketing onBack={() => navigate('/')} />
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!user) {
    if (isBankerPath) {
      return <Login defaultMode="banker" onLogin={handleLogin} />
    }
    if (isBusinessPath) {
      return (
        <Login
          defaultMode="smb"
          onLogin={handleLogin}
          onShowScene={() => navigate('/scene')}
        />
      )
    }
    return (
      <Login
        onLogin={handleLogin}
        onShowMarketing={() => navigate('/marketing')}
        onShowScene={() => navigate('/scene')}
      />
    )
  }

  // ── Determine if we need a redirect (but don't early-return, to keep DemoGuide mounted)
  const needsRedirect =
    (user.role === 'banker' && isBusinessPath) ||
    (user.role === 'smb' && isBankerPath) ||
    (!isBankerPath && !isBusinessPath)
  const redirectTo = user.role === 'banker' ? '/banker' : '/business'

  // ── Content shell (banker or SMB) ───────────────────────────────────────────
  let content
  if (needsRedirect) {
    content = <Navigate to={redirectTo} replace />
  } else if (user.role === 'banker') {
    content = (
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
  } else {
    content = (
      <Layout user={user}>
        <Routes>
          <Route path="/business" element={<Dashboard user={user} />} />
          <Route path="/business/chat" element={<Chat user={user} />} />
          <Route path="/business/forms" element={<Forms user={user} />} />
          <Route path="/business/activity" element={<Activity user={user} />} />
          <Route path="/business/profile" element={<Profile user={user} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/business" replace />} />
        </Routes>
      </Layout>
    )
  }

  return (
    <>
      {content}

      {!showDemo && (
        <button
          onClick={() => setShowDemo(true)}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-1.5 bg-pnc-navy/90 backdrop-blur
                     text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg
                     active:opacity-80 transition-opacity border border-white/10"
        >
          <Sparkles size={13} className="text-pnc-orange" />
          Walkthrough
        </button>
      )}

      {showDemo && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center lg:justify-end pointer-events-none">
          <div className="relative pointer-events-auto w-full max-w-md lg:w-[380px] lg:mr-8 mx-4 mb-4 lg:mb-0 z-10 animate-fade-up">
            <DemoGuide
              onClose={() => setShowDemo(false)}
              onSwitchToBanker={handleSwitchToBanker}
            />
          </div>
        </div>
      )}
    </>
  )
}
