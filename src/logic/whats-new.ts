import browser from 'webextension-polyfill'

export const WHATS_NEW_ID = 'favorites'

const WHATS_NEW_KEY = 'whatsNewSeen'
const GUIDE_KEY = 'meetGuideSeen'

export async function hasUnseenWhatsNew() {
  const stored = await browser.storage.local.get(WHATS_NEW_KEY)
  return stored[WHATS_NEW_KEY] !== WHATS_NEW_ID
}

export async function refreshBadge() {
  const unseen = await hasUnseenWhatsNew()
  await browser.action.setBadgeText({ text: unseen ? 'NEW' : '' })
  if (unseen)
    await browser.action.setBadgeBackgroundColor({ color: '#1a73e8' })
}

export async function markWhatsNewSeen() {
  await browser.storage.local.set({ [WHATS_NEW_KEY]: WHATS_NEW_ID })
  await browser.action.setBadgeText({ text: '' })
}

export async function handleInstalled({ reason }: { reason: string }) {
  if (reason === 'install')
    await browser.storage.local.set({ [WHATS_NEW_KEY]: WHATS_NEW_ID })
  await refreshBadge()
}

export async function loadGuideSeen() {
  const stored = await browser.storage.local.get(GUIDE_KEY)
  return stored[GUIDE_KEY] === true
}

export async function saveGuideSeen() {
  await browser.storage.local.set({ [GUIDE_KEY]: true })
}
