import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import { WHATS_NEW_ID, handleInstalled, hasUnseenWhatsNew, loadGuideSeen, markWhatsNewSeen, refreshBadge, saveGuideSeen } from '../whats-new'

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: { get: vi.fn(), set: vi.fn() },
    },
    action: { setBadgeText: vi.fn(), setBadgeBackgroundColor: vi.fn() },
  },
}))

function stored(values: Record<string, unknown>) {
  vi.mocked(browser.storage.local.get).mockResolvedValue(values)
}

describe('whats new', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('まだ見ていなければ新しくなったことがある', async () => {
    stored({})

    expect(await hasUnseenWhatsNew()).toBe(true)
  })

  it('今回の内容を見ていれば新しくなったことはない', async () => {
    stored({ whatsNewSeen: WHATS_NEW_ID })

    expect(await hasUnseenWhatsNew()).toBe(false)
  })

  it('前の内容しか見ていなければ新しくなったことがある', async () => {
    stored({ whatsNewSeen: 'old' })

    expect(await hasUnseenWhatsNew()).toBe(true)
  })

  it('見ていなければアイコンにNEWを付ける', async () => {
    stored({})
    await refreshBadge()

    expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: 'NEW' })
  })

  it('見ていればアイコンの印を消す', async () => {
    stored({ whatsNewSeen: WHATS_NEW_ID })
    await refreshBadge()

    expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: '' })
  })

  it('見たら覚えて、アイコンの印を消す', async () => {
    await markWhatsNewSeen()

    expect(browser.storage.local.set).toHaveBeenCalledWith({ whatsNewSeen: WHATS_NEW_ID })
    expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: '' })
  })

  it('初めて入れたときは、新しくなったことを見たことにする', async () => {
    stored({ whatsNewSeen: WHATS_NEW_ID })
    await handleInstalled({ reason: 'install' })

    expect(browser.storage.local.set).toHaveBeenCalledWith({ whatsNewSeen: WHATS_NEW_ID })
    expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: '' })
  })

  it('アップデートしたときは、アイコンにNEWを付ける', async () => {
    stored({})
    await handleInstalled({ reason: 'update' })

    expect(browser.storage.local.set).not.toHaveBeenCalled()
    expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({ text: 'NEW' })
  })

  it('Meetの吹き出しを見たかどうかを覚える', async () => {
    stored({})
    expect(await loadGuideSeen()).toBe(false)

    await saveGuideSeen()
    expect(browser.storage.local.set).toHaveBeenCalledWith({ meetGuideSeen: true })

    stored({ meetGuideSeen: true })
    expect(await loadGuideSeen()).toBe(true)
  })
})
