/** Seeded demo SMB for the Maya Patel walkthrough (matches backend/seed/seed_data.py). */
export const MAYA_SMB_ID = '11111111-1111-1111-1111-111111111111'

/** Priya Rao, second skit character (customer-discovery scene); same seed file. */
export const PRIYA_SMB_ID = '22222222-2222-2222-2222-222222222222'

/** Sarah Chen: walkthrough / skit RM only. Never use for user-testing flows (surveys). */
export const SARAH_BANKER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

/** RMs for user testing and default login (seeded; must not include walkthrough RM). */
export const USER_TESTING_RM_IDS = [
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Marcus Williams
  'cccccccc-cccc-cccc-cccc-cccccccccccc', // Jordan Patel
  'dddddddd-dddd-dddd-dddd-dddddddddddd', // Elena Vasquez
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // James Okonkwo
]

/** SMB profiles that use the product walkthrough only (no user-testing survey). */
export function isWalkthroughSmb(smbId) {
  return smbId === MAYA_SMB_ID || smbId === PRIYA_SMB_ID
}

/** RM profile that uses the walkthrough handoff only (no user-testing survey). */
export function isWalkthroughBanker(bankerId) {
  return bankerId === SARAH_BANKER_ID
}

/** Whether this logged-in profile should see user testing (Feedback tab, survey, floater). */
export function profileAllowsUserTesting(user) {
  if (!user) return false
  if (user.role === 'smb') return !isWalkthroughSmb(user.smb_id)
  if (user.role === 'banker') return !isWalkthroughBanker(user.banker_id)
  return false
}
