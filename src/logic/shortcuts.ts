import browser from 'webextension-polyfill'
import type { Shortcuts } from './favorites'
import { DEFAULT_SHORTCUTS } from './favorites'

export * from './favorites'

const STORAGE_KEY = 'shortcuts'
const PINNED_KEY = 'favoritesPinned'

function withDefaults(stored: unknown): Shortcuts {
  return { ...DEFAULT_SHORTCUTS, ...(stored as Shortcuts | undefined) }
}

export async function loadShortcuts() {
  const stored = await browser.storage.sync.get(STORAGE_KEY)
  return withDefaults(stored[STORAGE_KEY])
}

export async function saveShortcuts(shortcuts: Shortcuts) {
  await browser.storage.sync.set({ [STORAGE_KEY]: shortcuts })
}

export function watchShortcuts(callback: (shortcuts: Shortcuts) => void) {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[STORAGE_KEY])
      callback(withDefaults(changes[STORAGE_KEY].newValue))
  })
}

export async function loadPinned() {
  const stored = await browser.storage.local.get(PINNED_KEY)
  return stored[PINNED_KEY] === true
}

export async function savePinned(pinned: boolean) {
  await browser.storage.local.set({ [PINNED_KEY]: pinned })
}
