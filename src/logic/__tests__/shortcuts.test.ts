import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import { DEFAULT_SHORTCUTS, assignFavorite, isSameEmoji, loadPinned, loadShortcuts, moveFavorite, savePinned, saveShortcuts, toEmoji, watchShortcuts } from '../shortcuts'

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      sync: { get: vi.fn(), set: vi.fn() },
      local: { get: vi.fn(), set: vi.fn() },
      onChanged: { addListener: vi.fn() },
    },
  },
}))

describe('shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadShortcuts', () => {
    it('何も保存されていなければ初期値を返す', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({})

      expect(await loadShortcuts()).toEqual(DEFAULT_SHORTCUTS)
    })

    it('保存された値で初期値を上書きする', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({ shortcuts: { 1: '🍣', 2: '' } })

      const shortcuts = await loadShortcuts()

      expect(shortcuts[1]).toBe('🍣')
      expect(shortcuts[2]).toBe('')
      expect(shortcuts[3]).toBe(DEFAULT_SHORTCUTS[3])
    })
  })

  it('saveShortcutsはsyncストレージに保存する', async () => {
    await saveShortcuts({ 1: '🍣' })

    expect(browser.storage.sync.set).toHaveBeenCalledWith({ shortcuts: { 1: '🍣' } })
  })

  it('watchShortcutsは保存された値が変わったら初期値と合わせて通知する', () => {
    const callback = vi.fn()
    watchShortcuts(callback)
    const listener = vi.mocked(browser.storage.onChanged.addListener).mock.calls[0][0]

    listener({ shortcuts: { newValue: { 1: '🍣' }, oldValue: {} } }, 'sync')

    expect(callback).toHaveBeenCalledWith({ ...DEFAULT_SHORTCUTS, 1: '🍣' })
  })

  it('watchShortcutsは関係ない変更では通知しない', () => {
    const callback = vi.fn()
    watchShortcuts(callback)
    const listener = vi.mocked(browser.storage.onChanged.addListener).mock.calls[0][0]

    listener({ other: { newValue: 1 } }, 'sync')

    expect(callback).not.toHaveBeenCalled()
  })

  describe('toEmoji', () => {
    it('先頭の絵文字1つだけを取り出す', () => {
      expect(toEmoji(' 🍣🔥')).toBe('🍣')
    })

    it('複数の文字でできた絵文字を壊さない', () => {
      expect(toEmoji('❤️‍🔥')).toBe('❤️‍🔥')
      expect(toEmoji('🇯🇵')).toBe('🇯🇵')
    })

    it('空なら空文字を返す', () => {
      expect(toEmoji('  ')).toBe('')
    })
  })

  it('初期値はよく使いそうな順に並んでいる', () => {
    expect(Object.values(DEFAULT_SHORTCUTS)).toEqual(['🙏', '👀', '🔥', '🙇', '💯', '🙌', '✅', '🤝', '🚀'])
  })

  describe('isSameEmoji', () => {
    it('見えない異体字セレクタの有無を区別しない', () => {
      expect(isSameEmoji('❤️', '❤')).toBe(true)
    })

    it('違う絵文字は区別する', () => {
      expect(isSameEmoji('🙇', '🙇‍♂️')).toBe(false)
    })
  })

  describe('assignFavorite', () => {
    it('指定した番号に絵文字を入れる', () => {
      expect(assignFavorite({ 1: '🙏', 2: '👀' }, 2, '🦊')).toEqual({ 1: '🙏', 2: '🦊' })
    })

    it('別の番号に同じ絵文字があれば入れ替える', () => {
      expect(assignFavorite({ 1: '🙏', 2: '👀', 3: '🔥' }, 1, '🔥')).toEqual({ 1: '🔥', 2: '👀', 3: '🙏' })
    })

    it('元の値を書き換えない', () => {
      const shortcuts = { 1: '🙏' }
      assignFavorite(shortcuts, 1, '🦊')
      expect(shortcuts).toEqual({ 1: '🙏' })
    })
  })

  describe('moveFavorite', () => {
    it('となりの番号と入れ替える', () => {
      expect(moveFavorite({ 1: '🙏', 2: '👀', 3: '🔥' }, 2, -1)).toEqual({ 1: '👀', 2: '🙏', 3: '🔥' })
      expect(moveFavorite({ 1: '🙏', 2: '👀', 3: '🔥' }, 2, 1)).toEqual({ 1: '🙏', 2: '🔥', 3: '👀' })
    })

    it('1より前や9より後ろには動かさない', () => {
      const shortcuts = { ...DEFAULT_SHORTCUTS }
      expect(moveFavorite(shortcuts, 1, -1)).toEqual(shortcuts)
      expect(moveFavorite(shortcuts, 9, 1)).toEqual(shortcuts)
    })
  })

  describe('pinned', () => {
    it('保存されていなければ固定表示しない', async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({})

      expect(await loadPinned()).toBe(false)
    })

    it('固定表示の状態をこの端末に保存する', async () => {
      await savePinned(true)

      expect(browser.storage.local.set).toHaveBeenCalledWith({ favoritesPinned: true })
    })
  })
})
