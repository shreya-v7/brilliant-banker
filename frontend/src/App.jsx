import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

// SMB pages
import Login from './pages/Login'
import Marketing from './pages/Marketing'
import Scene from './pages/Scene'
import ScreenLinks from './pages/ScreenLinks'
import TestGuide from './pages/TestGuide'
import AdminResults from './pages/AdminResults'
import SmbFeedback from './pages/SmbFeedback'
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
import BankerFeedback from './pages/BankerFeedback'
import { login, bankerLogin } from './api'
import {
  MAYA_SMB_ID,
  PRIYA_SMB_ID,
  SARAH_BANKER_ID,
  profileAllowsUserTesting,
} from './constants/demo'
import { useEffectiveUserTestingMode } from './hooks/useUserTestingMode'

function BankerGate({ user, onLogin, children }) {
  if (!user) return <Login defaultMode="banker" onLogin={onLogin} />
  if (user.role !== 'banker') return <Navigate to="/business" replace />
  return children
}

function SmbGate({ user, onLogin, onShowScene, children }) {
  if (!user) return <Login defaultMode="smb" onLogin={onLogin} onShowScene={onShowScene} />
  if (user.role !== 'smb') return <Navigate to="/banker" replace />
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
      const testing = sp.get('testing')
      if (
        next &&
        testing &&
        u.role === 'smb' &&
        next.startsWith('/business')
      ) {
        if (u.smb_id === MAYA_SMB_ID || u.smb_id === PRIYA_SMB_ID) {
          navigate('/business', { replace: true })
          return
        }
        navigate(`${next}?testing=true`, { replace: true })
        return
      }
      if (
        next &&
        testing &&
        u.role === 'banker' &&
        next.startsWith('/banker')
      ) {
        if (u.banker_id === SARAH_BANKER_ID) {
          navigate('/banker', { replace: true })
          return
        }
        navigate(`${next}?testing=true`, { replace: true })
        return
      }
      if (next && ((u.role === 'smb' && next.startsWith('/business')) || (u.role === 'banker' && next.startsWith('/banker')))) {
        navigate(next, { replace: true })
        return
      }
      const path = location.pathname
      if (u.role === 'banker' && path.startsWith('/banker')) {
        navigate(path, { replace: true })
      } else if (u.role === 'smb' && path.startsWith('/business')) {
        navigate(path, { replace: true })
      } else {
        navigate(u.role === 'banker' ? '/banker' : '/business', { replace: true })
      }
    },
    [navigate, location.pathname, location.search],
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

  // Include bankers still on /business/* (demo handoff before navigate settles) so DemoGuide does not unmount and reset.
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

  const effectiveUserTesting = useEffectiveUserTestingMode(user)

  return (
    <>
      <Routes>
        <Route path="/links" element={<ScreenLinks />} />
        <Route path="/admin/results" element={<AdminResults />} />
        <Route path="/test/guide" element={<TestGuide />} />
        <Route path="/test/smb" element={<Navigate to="/business?next=/business/feedback&testing=1" replace />} />
        <Route path="/test/banker" element={<Navigate to="/banker?next=/banker/feedback&testing=1" replace />} />

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
            <BankerGate user={user} onLogin={handleLogin}>
              <BankerLayout user={user}>
                <BankerDashboard user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/clients"
          element={
            <BankerGate user={user} onLogin={handleLogin}>
              <BankerLayout user={user}>
                <BankerClients user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/clients/:id"
          element={
            <BankerGate user={user} onLogin={handleLogin}>
              <BankerLayout user={user}>
                <BankerSMBProfile user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/credit"
          element={
            <BankerGate user={user} onLogin={handleLogin}>
              <BankerLayout user={user}>
                <BankerCreditReview user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/feedback"
          element={
            <BankerGate user={user} onLogin={handleLogin}>
              <BankerLayout user={user}>
                <BankerFeedback user={user} />
              </BankerLayout>
            </BankerGate>
          }
        />
        <Route
          path="/banker/profile"
          element={
            <BankerGate user={user} onLogin={handleLogin}>
              <BankerLayout user={user}>
                <BankerProfile user={user} onLogout={handleLogout} />
              </BankerLayout>
            </BankerGate>
          }
        />

        <Route
          path="/business"
          element={
            <SmbGate user={user} onLogin={handleLogin} onShowScene={() => navigate('/scene')}>
              <Layout user={user}>
                <Dashboard user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/chat"
          element={
            <SmbGate user={user} onLogin={handleLogin} onShowScene={() => navigate('/scene')}>
              <Layout user={user}>
                <Chat user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/forms"
          element={
            <SmbGate user={user} onLogin={handleLogin} onShowScene={() => navigate('/scene')}>
              <Layout user={user}>
                <Forms user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/activity"
          element={
            <SmbGate user={user} onLogin={handleLogin} onShowScene={() => navigate('/scene')}>
              <Layout user={user}>
                <Activity user={user} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/profile"
          element={
            <SmbGate user={user} onLogin={handleLogin} onShowScene={() => navigate('/scene')}>
              <Layout user={user}>
                <Profile user={user} onLogout={handleLogout} />
              </Layout>
            </SmbGate>
          }
        />
        <Route
          path="/business/feedback"
          element={
            <SmbGate user={user} onLogin={handleLogin} onShowScene={() => navigate('/scene')}>
              <Layout user={user}>
                <SmbFeedback user={user} />
              </Layout>
            </SmbGate>
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'banker' ? '/banker' : '/business'} replace />
            ) : (
              <Login
                onLogin={handleLogin}
                onShowMarketing={() => navigate('/marketing')}
                onShowScene={() => navigate('/scene')}
              />
            )
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

      {inAppShell && (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 items-end pointer-events-none">
          {profileAllowsUserTesting(user) && (
            <button
              type="button"
              onClick={() => navigate('/test/guide')}
              className="pointer-events-auto min-h-[48px] px-5 py-3 rounded-full text-white text-sm font-bold
                         shadow-xl border-[3px] border-white ring-2 ring-[#E35205]/90 ring-offset-2 ring-offset-white/20"
              style={{ backgroundColor: '#002D5F' }}
            >
              User Testing
            </button>
          )}
          {walkthroughEligible && !showDemo && !effectiveUserTesting && (
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
          )}
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
