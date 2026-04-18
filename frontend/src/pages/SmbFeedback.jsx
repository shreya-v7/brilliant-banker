import { Navigate, useSearchParams } from 'react-router-dom'
import UserTestWizard from '../components/survey/UserTestWizard'
import { SMB_SURVEY_STEPS, SMB_TASK_COUNT } from '../surveyQuestions'
import { isWalkthroughSmb, profileAllowsUserTesting } from '../constants/demo'

export default function SmbFeedback({ user }) {
  const [searchParams] = useSearchParams()
  const fromUrl =
    searchParams.get('testing') === 'true' || searchParams.get('testing') === '1'
  let sessionRole = null
  try {
    sessionRole = sessionStorage.getItem('bb-survey-active')
  } catch {
    /* ignore */
  }

  if (user && isWalkthroughSmb(user.smb_id)) {
    return <Navigate to="/business" replace />
  }

  const allowed =
    profileAllowsUserTesting(user) && (fromUrl || sessionRole === 'smb')

  if (!allowed) {
    return <Navigate to="/business" replace />
  }

  return (
    <div className="min-h-full bg-pnc-gray-50">
      <div className="bg-pnc-navy px-4 py-3 border-b border-white/10">
        <h1 className="text-white font-bold text-lg">User testing</h1>
        <p className="text-white/60 text-xs mt-0.5">SMB feedback</p>
      </div>
      <UserTestWizard
        role="smb"
        steps={SMB_SURVEY_STEPS}
        storageKey="bb-survey-v1-smb"
        totalTaskCount={SMB_TASK_COUNT}
      />
    </div>
  )
}
