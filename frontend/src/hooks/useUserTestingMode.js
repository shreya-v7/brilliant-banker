import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { profileAllowsUserTesting } from '../constants/demo'

/**
 * True during scheduled user testing: URL ?testing= / ?testing=1, or an in-progress survey session.
 */
export function useUserTestingMode() {
  const { search } = useLocation()
  return useMemo(() => {
    const sp = new URLSearchParams(search)
    if (sp.get('testing') === 'true' || sp.get('testing') === '1') return true
    try {
      return !!sessionStorage.getItem('bb-survey-active')
    } catch {
      return false
    }
  }, [search])
}

/**
 * User-testing session is active AND the current profile is allowed to use surveys
 * (not Maya/Priya SMB, not Sarah RM).
 */
export function useEffectiveUserTestingMode(user) {
  const base = useUserTestingMode()
  return base && profileAllowsUserTesting(user)
}
