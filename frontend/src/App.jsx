import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

// SMB pages
import Login from './pages/Login'
import Marketing from './pages/Marketing'
import Scene from './pages/Scene'
import ScreenLinks from './pages/ScreenLinks'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import Forms from './pages/Forms'
import Layout from './components/Layout'
import DemoGuide from './components/DemoGuide'
import FeedbackPanel from './components/FeedbackPanel'

// Banker pages
import BankerLayout from './components/BankerLayout'
import BankerDashboard from './pages/banker/BankerDashboard'
import BankerClients from './pages/banker/BankerClients'
import BankerCreditReview from './pages/banker/BankerCreditReview'
import BankerSMBProfile from './pages/banker/BankerSMBProfile'
import BankerProfile from './pages/banker/BankerProfile'
import { login, bankerLogin } from './api'
import { MAYA_SMB_ID, PRIYA_SMB_ID, SARAH_BANKER_ID } from './constants/demo'

function signinRedirect(user, role, fallback) {
  if (user?.role === role) return fallback
  if (user?.role === 'smb') return '/business'
  if (user?.role === 'banker') return '/banker'
  return null
}

function SmbGate({ user, children }) {
  const location = useLocation()
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/signin/smb?next=${next}`} replace />
  }
  if (user.role !== 'smb') return <Navigate to="/banker" replace />
  return children
}

function BankerGate({ user, children }) {
  const location = useLocation()
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/signin/banker?next=${next}`} replace />
  }
  if (user.role !== 'banker') return <Navigate to="/business" replace />
  return children
}

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

  useEffect(() => {
    if (
      user?.role === 'smb' &&
      user.smb_id &&
      user.smb_id !== MAYA_SMB_ID &&
      user.smb_id !== PRIYA_SMB_ID
    ) {
      setShowDemo(false)
    }
  }, [user])

  const handleLogout = useCallback(() => {
    setUser(null)
    navigate('/', { replace: true })
  }, [navigate])

  const handleLogin = useCallback(
    (u) => {
      setUser(u)
      const sp = new URLSearchParams(location.search)
      const next = sp.get('next')
      if (next && ((u.role === 'smb' && next.startsWith('/business')) || (u.role === 'banker' && next.startsWith('/banker')))) {
        navigate(next, { replace: true })
        return
      }
      navigate(u.role === 'banker' ? '/banker' : '/business', { replace: true })
    },
    [navigate, location.search],
  )

  const handleSceneLogin = useCallback(async (smbId) => {
    try {
      const userData = await login(smbId)
      setUser({ ...userData, role: 'smb' })
      navigate('/business', { replace: true })
    } catch {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSwitchToBanker = useCallback(async () => {
    const banker = await bankerLogin(SARAH_BANKER_ID)
    setUser({ ...banker, role: 'banker' })
    navigate('/banker', { replace: true })
  }, [navigate])

  const inAppShell =
    user &&
    ((user.role === 'smb' && isBusinessPath) ||
      (user.role === 'banker' && (isBankerPath || isBusinessPath)))

  const walkthroughEligible =
    user &&
    ((user.role === 'smb' &&
      (user.smb_id === MAYA_SMB_ID || user.smb_id === PRIYA_SMB_ID) &&
      isBusinessPath) ||
      (user.role === 'banker' &&
        user.banker_id === SARAH_BANKER_ID &&
        (showDemo || isBankerPath || isBusinessPath)))

  const loginProps = {
    onLogin: handleLogin,
    onShowMarketing: () => navigate('/marketing'),
    onShowScene: () => navigate('/scene'),
    signedInUser: user,
  }

  return (
    <>
      <Routes>
        <Route path="/links" element={<ScreenLinks />} />

        <Route
          path="/"
          element={<Login view="home" {...loginProps} />}
        />
        <Route
          path="/signin/smb"
          element={
            signinRedirect(user, 'smb', '/business') ? (
              <Navigate to={signinRedirect(user, 'smb', '/business')} replace />
            ) : (
              <Login view="smb" {...loginProps} />
            )
          }
        />
        <Route
          path="/signin/banker"
          element={
            signinRedirect(user, 'banker', '/banker') ? (
              <Navigate to={signinRedirect(user, 'banker', '/banker')} replace />
            ) : (
              <Login view="banker" {...loginProps} />
            )
          }
        />

        <Route
          path="/scene"
          element={
            user ? (
              <Navigate to="/business" replace />
            ) : (
              <Scene onBack={() => navigate('/')} onLoginAsCharacter={handleSceneLogin} />
            )
          }
        />
        <Route
          path="/marketing"
          element={user ? <Navigate to="/business" replace /> : <Marketing onBack={() => navigate('/')} />}
        />

        <Route
          path="/banker"
          element={
            <BankerGate user={user}>
              <BankerLayout user={user} onLogout={handleLogout}>
                <BankerDashboard user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/clients"
          element={
            <BankerGate user={user}>
              <BankerLayout user={user} onLogout={handleLogout}>
                <BankerClients user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/clients/:id"
          element={
            <BankerGate user={user}>
              <BankerLayout user={user} onLogout={handleLogout}>
                <BankerSMBProfile user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/credit"
          element={
            <BankerGate user={user}>
              <BankerLayout user={user} onLogout={handleLogout}>
                <BankerCreditReview user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/profile"
          element={
            <BankerGate user={user}>
              <BankerLayout user={user} onLogout={handleLogout}>
                <BankerProfile user={user} onLogout={handleLogout} />
              </BankerLayout>
            </BankerGate>
          }
        />

        <Route
          path="/business"
          element={
            <SmbGate user={user}>
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/chat"
          element={
            <SmbGate user={user}>
              <Layout user={user} onLogout={handleLogout}>
                <Chat user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/forms"
          element={
            <SmbGate user={user}>
              <Layout user={user} onLogout={handleLogout}>
                <Forms user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/activity"
          element={
            <SmbGate user={user}>
              <Layout user={user} onLogout={handleLogout}>
                <Activity user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/profile"
          element={
            <SmbGate user={user}>
              <Layout user={user} onLogout={handleLogout}>
                <Profile user={user} onLogout={handleLogout} />
              </Layout>
            </SmbGate>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={user ? (user.role === 'banker' ? '/banker' : '/business') : '/'}
              replace
            />
          }
        />
      </Routes>

      {inAppShell && user && (
        <FeedbackPanel user={user} role={user.role} />
      )}

      {inAppShell && walkthroughEligible && !showDemo && (
        <div className="fixed bottom-[5.75rem] right-6 z-[55] flex flex-col gap-2 items-end pointer-events-none">
          <button
            type="button"
            onClick={() => setShowDemo(true)}
            className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur border border-pnc-gray-200
                       text-pnc-navy text-xs font-semibold px-4 py-2.5 rounded-full shadow-md
                       active:opacity-80 transition-opacity"
          >
            <Sparkles size={13} className="text-pnc-orange" />
            Walkthrough
          </button>
        </div>
      )}

      {showDemo && walkthroughEligible && (
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
