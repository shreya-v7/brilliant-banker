/** Seeded demo SMB for the Maya Patel walkthrough (matches backend/seed/seed_data.py). */
export const MAYA_SMB_ID = '11111111-1111-1111-1111-111111111111'

/** Priya Rao, second skit character (customer-discovery scene); same seed file. */
export const PRIYA_SMB_ID = '22222222-2222-2222-2222-222222222222'

/** Sarah Chen: walkthrough / skit RM only. */
export const SARAH_BANKER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

/** SMB profiles that use the product walkthrough only. */
export function isWalkthroughSmb(smbId) {
  return smbId === MAYA_SMB_ID || smbId === PRIYA_SMB_ID
}

/** RM profile that uses the walkthrough handoff only. */
export function isWalkthroughBanker(bankerId) {
  return bankerId === SARAH_BANKER_ID
}
