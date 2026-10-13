import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFavoritesRow } from '../favorites-row'
import { handlePointerdown } from '../reaction'
import { DEFAULT_SHORTCUTS } from '~/logic/favorites'

function setupMeetDom() {
  document.body.innerHTML = `
    <div role="dialog" aria-label="リアクションを送信">
      <button data-emoji="💖"></button>
      <button aria-haspopup="menu" aria-controls="emoji-picker"></button>
    </div>
    <input type="text" id="chat">
    <div id="video"></div>
  `
}

function keydown(init: KeyboardEventInit) {
  document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
}

function keyup(init: KeyboardEventInit) {
  document.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, ...init }))
}

describe('favorites row', () => {
  let row: ReturnType<typeof createFavoritesRow>
  const onSend = vi.fn()
  const onPinChange = vi.fn()
  let shortcuts = { ...DEFAULT_SHORTCUTS }

  beforeEach(() => {
    vi.useFakeTimers()
    setupMeetDom()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    shortcuts = { ...DEFAULT_SHORTCUTS, 9: '' }
    row = createFavoritesRow({ getShortcuts: () => shortcuts, onSend, onPinChange })
    document.addEventListener('keydown', row.handleKeydown)
    document.addEventListener('keyup', row.handleKeyup)
    row.update()
  })

  afterEach(() => {
    document.removeEventListener('keydown', row.handleKeydown)
    document.removeEventListener('keyup', row.handleKeyup)
    row.destroy()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  function rowElement() {
    return document.querySelector<HTMLElement>('#meet-emoji-favorites')!
  }

  function favoriteButtons() {
    return Array.from(rowElement().querySelectorAll<HTMLButtonElement>('button'))
  }

  function toggleButton() {
    return document.querySelector<HTMLButtonElement>('#meet-emoji-favorites-toggle')!
  }

  it('最初は表示しない', () => {
    expect(rowElement().hidden).toBe(true)
    expect(rowElement().style.display).toBe('none')
  })

  it('表示するときは横並びにする', () => {
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)

    expect(rowElement().style.display).toBe('flex')
  })

  it('Shiftを少し押し続けると表示する', () => {
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)

    expect(rowElement().hidden).toBe(false)
  })

  it('お気に入りを番号つきで並べる', () => {
    expect(favoriteButtons().map(button => button.textContent)).toEqual([
      '⇧1🙏', '⇧2👀', '⇧3🔥', '⇧4🙇', '⇧5💯', '⇧6🙌', '⇧7✅', '⇧8🤝', '⇧9—',
    ])
  })

  it('⇧1〜⇧9をバーの1〜9番のボタンの真上にそろえる', () => {
    const bar = document.querySelector('div[aria-label="リアクションを送信"]')!
    const pickerOpener = bar.querySelector('button[aria-haspopup]')!
    pickerOpener.insertAdjacentHTML('beforebegin', ['👍', '🎉', '👏', '😂', '😮', '😢', '🤔', '👎', '🚀'].map(emoji => `<button data-emoji="${emoji}"></button>`).join(''))
    Array.from(bar.querySelectorAll<HTMLElement>('button[data-emoji]')).forEach((button, index) => {
      button.getBoundingClientRect = () => ({ left: 100 + index * 40, width: 32, top: 700, height: 40 }) as DOMRect
    })
    row.update()

    expect(rowElement().style.left).toBe('92px')
    expect(rowElement().style.width).toBe('368px')
    expect(favoriteButtons().map(button => button.style.left)).toEqual(['8px', '48px', '88px', '128px', '168px', '208px', '248px', '288px', '328px'])
    expect(favoriteButtons().map(button => button.style.width)).toEqual(Array(9).fill('32px'))
  })

  it('空の枠は押せない', () => {
    expect(favoriteButtons()[8].disabled).toBe(true)
  })

  it('Shiftを離しても少しのあいだは表示したまま', () => {
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)
    keyup({ key: 'Shift' })
    vi.advanceTimersByTime(1000)

    expect(rowElement().hidden).toBe(false)

    vi.advanceTimersByTime(600)

    expect(rowElement().hidden).toBe(true)
  })

  it('マウスが乗っている間は消さない', () => {
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)
    rowElement().dispatchEvent(new Event('mouseenter'))
    keyup({ key: 'Shift' })
    vi.advanceTimersByTime(3000)

    expect(rowElement().hidden).toBe(false)

    rowElement().dispatchEvent(new Event('mouseleave'))
    vi.advanceTimersByTime(1600)

    expect(rowElement().hidden).toBe(true)
  })

  it('Shift+Tabのときは表示しない', () => {
    keydown({ key: 'Shift', shiftKey: true })
    keydown({ key: 'Tab', shiftKey: true })
    vi.advanceTimersByTime(200)

    expect(rowElement().hidden).toBe(true)
  })

  it('文字を打っているときは表示しない', () => {
    document.querySelector<HTMLInputElement>('#chat')!.focus()
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)

    expect(rowElement().hidden).toBe(true)
  })

  it('サイドパネルをクリックしたあとは表示しない', () => {
    document.body.insertAdjacentHTML('beforeend', '<aside><div id="chat-messages"></div></aside>')
    handlePointerdown({ target: document.querySelector('#chat-messages') } as unknown as Event)
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)
    handlePointerdown({ target: document.body } as unknown as Event)

    expect(rowElement().hidden).toBe(true)
  })

  it('ウィンドウを離れたら消す', () => {
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)
    window.dispatchEvent(new Event('blur'))

    expect(rowElement().hidden).toBe(true)
  })

  it('リアクションバーがないときは表示しない', () => {
    document.querySelector('div[aria-label="リアクションを送信"]')!.remove()
    row.update()
    keydown({ key: 'Shift', shiftKey: true })
    vi.advanceTimersByTime(200)

    expect(rowElement().hidden).toBe(true)
    expect(toggleButton().hidden).toBe(true)
  })

  it('クリックでお気に入りを送る', () => {
    favoriteButtons()[2].click()

    expect(onSend).toHaveBeenCalledWith('🔥')
  })

  it('⇧ボタンで出しっぱなしにでき、もう一度押すと戻る', () => {
    toggleButton().click()

    expect(rowElement().hidden).toBe(false)
    expect(toggleButton().getAttribute('aria-pressed')).toBe('true')
    expect(onPinChange).toHaveBeenLastCalledWith(true)

    window.dispatchEvent(new Event('blur'))
    expect(rowElement().hidden).toBe(false)

    toggleButton().click()

    expect(rowElement().hidden).toBe(true)
    expect(onPinChange).toHaveBeenLastCalledWith(false)
  })

  it('保存された固定表示の状態を反映する', () => {
    row.setPinned(true)

    expect(rowElement().hidden).toBe(false)
    expect(onPinChange).not.toHaveBeenCalled()
  })

  it('お気に入りが変わらなければボタンを作り直さない', () => {
    const before = favoriteButtons()[0]
    row.update()

    expect(favoriteButtons()[0]).toBe(before)
  })

  it('お気に入りが変わったら表示を更新する', () => {
    shortcuts = { ...shortcuts, 1: '🦊' }
    row.update()

    expect(favoriteButtons()[0].textContent).toBe('⇧1🦊')
  })
})
