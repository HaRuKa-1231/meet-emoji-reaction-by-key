import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Popup from '../Popup.vue'
import { DEFAULT_SHORTCUTS, saveShortcuts } from '~/logic/shortcuts'
import { hasUnseenWhatsNew, markWhatsNewSeen } from '~/logic/whats-new'

vi.mock('webextension-polyfill', () => ({ default: {} }))

vi.mock('~/logic/shortcuts', async () => {
  const actual = await vi.importActual<typeof import('~/logic/shortcuts')>('~/logic/shortcuts')
  return {
    ...actual,
    loadShortcuts: vi.fn().mockResolvedValue({ ...actual.DEFAULT_SHORTCUTS, 1: '🍣' }),
    saveShortcuts: vi.fn(),
  }
})

vi.mock('~/logic/whats-new', () => ({
  hasUnseenWhatsNew: vi.fn(),
  markWhatsNewSeen: vi.fn(),
}))

describe('Popup', () => {
  beforeEach(() => {
    vi.mocked(saveShortcuts).mockClear()
    vi.mocked(markWhatsNewSeen).mockClear()
    vi.mocked(hasUnseenWhatsNew).mockResolvedValue(false)
  })

  it('新しくなったことを見ていなければ上に出して、見たことにする', async () => {
    vi.mocked(hasUnseenWhatsNew).mockResolvedValue(true)
    const wrapper = mount(Popup)
    await flushPromises()

    expect(wrapper.find('[data-test="whats-new"]').text()).toContain('Shift + 1-9')
    expect(wrapper.find('[data-test="whats-new"] li').text()).toBe('Right-click an emoji: add it to favorites')
    expect(markWhatsNewSeen).toHaveBeenCalledOnce()
  })

  it('新しくなったことを見ていれば出さない', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    expect(wrapper.find('[data-test="whats-new"]').exists()).toBe(false)
    expect(markWhatsNewSeen).not.toHaveBeenCalled()
  })

  it('ブラウザが日本語なら日本語で出す', async () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja')
    const wrapper = mount(Popup)
    await flushPromises()

    expect(wrapper.find('h2').text()).toBe('お気に入り')
    expect(wrapper.find('[data-test="reset"]').text()).toBe('最初の状態に戻す')
    language.mockRestore()
  })

  it('Shift+1から9の登録内容を表示する', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(9)
    expect((inputs[0].element as HTMLInputElement).value).toBe('🍣')
    expect((inputs[1].element as HTMLInputElement).value).toBe(DEFAULT_SHORTCUTS[2])
  })

  it('入力した絵文字を1つだけにして保存する', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    const input = wrapper.findAll('input')[2]
    await input.setValue('🚀🔥')
    await input.trigger('change')

    expect((input.element as HTMLInputElement).value).toBe('🚀')
    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: '🍣', 3: '🚀' }))
  })

  it('空にすると登録を外して保存する', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    const input = wrapper.findAll('input')[0]
    await input.setValue('')
    await input.trigger('change')

    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: '' }))
  })

  it('同じ絵文字をほかの番号に入れたら入れ替える', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    const input = wrapper.findAll('input')[1]
    await input.setValue('🍣')
    await input.trigger('change')

    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: DEFAULT_SHORTCUTS[2], 2: '🍣' }))
  })

  it('上へボタンでひとつ前の番号と入れ替える', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    await wrapper.find('[data-test="move-up-2"]').trigger('click')

    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: DEFAULT_SHORTCUTS[2], 2: '🍣' }))
  })

  it('下へボタンでひとつ後ろの番号と入れ替える', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    await wrapper.find('[data-test="move-down-1"]').trigger('click')

    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: DEFAULT_SHORTCUTS[2], 2: '🍣' }))
  })

  it('消すボタンで登録を外す', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    await wrapper.find('[data-test="clear-1"]').trigger('click')

    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: '' }))
  })

  it('元に戻すで直前の状態を保存し直す', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    await wrapper.find('[data-test="clear-1"]').trigger('click')
    await wrapper.find('[data-test="undo"]').trigger('click')

    expect(saveShortcuts).toHaveBeenLastCalledWith(expect.objectContaining({ 1: '🍣' }))
    expect((wrapper.findAll('input')[0].element as HTMLInputElement).value).toBe('🍣')
  })

  it('何も変えていなければ元に戻すは押せない', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    expect(wrapper.find('[data-test="undo"]').attributes('disabled')).toBeDefined()
  })

  it('最初の状態に戻すは2回押したときだけ実行する', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    await wrapper.find('[data-test="reset"]').trigger('click')
    expect(saveShortcuts).not.toHaveBeenCalled()

    await wrapper.find('[data-test="reset"]').trigger('click')
    expect(saveShortcuts).toHaveBeenLastCalledWith(DEFAULT_SHORTCUTS)
  })

  it('Meetで右クリックして登録できることを案内する', async () => {
    const wrapper = mount(Popup)
    await flushPromises()

    expect(wrapper.text()).toContain('Right-click')
  })
})
