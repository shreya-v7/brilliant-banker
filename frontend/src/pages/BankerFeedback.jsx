import { Navigate, useSearchParams } from 'react-router-dom'
import UserTestWizard from '../components/survey/UserTestWizard'
import { BANKER_SURVEY_STEPS, BANKER_TASK_COUNT } from '../surveyQuestions'
import { isWalkthroughBanker, profileAllowsUserTesting } from '../constants/demo'

export default function BankerFeedback({ user }) {
  const [searchParams] = useSearchParams()
  const fromUrl =
    searchParams.get('testing') === 'true' || searchParams.get('testing') === '1'
  let sessionRole = null
  try {
    sessionRole = sessionStorage.getItem('bb-survey-active')
  } catch {
    /* ignore */
  }

  if (user && isWalkthroughBanker(user.banker_id)) {
    return <Navigate to="/banker" replace />
  }

  const allowed =
    profileAllowsUserTesting(user) && (fromUrl || sessionRole === 'banker')

  if (!allowed) {
    return <Navigate to="/banker" replace />
  }

  return (
    <div className="min-h-full">
      <div className="bg-pnc-navy px-4 py-3 rounded-xl mb-4">
        <h1 className="text-white font-bold text-lg">User testing</h1>
        <p className="text-white/60 text-xs mt-0.5">RM feedback</p>
      </div>
      <UserTestWizard
        role="banker"
        steps={BANKER_SURVEY_STEPS}
        storageKey="bb-survey-v1-banker"
        totalTaskCount={BANKER_TASK_COUNT}
      />
    </div>
  )
}
