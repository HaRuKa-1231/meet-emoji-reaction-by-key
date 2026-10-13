import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRegisterMenu } from '../register-menu'
import { showToast } from '../toast'
import { DEFAULT_SHORTCUTS } from '~/logic/favorites'

function setupMeetDom() {
  document.body.innerHTML = `
    <div role="dialog" aria-label="リアクションを送信">
      <button data-emoji="💖"></button>
      <button data-emoji="🦊" id="recent"></button>
    </div>
    <div id="emoji-picker" role="dialog">
      <button role="menuitem" data-emoji="🐱" id="picker-item"><img alt="🐱"></button>
    </div>
    <div id="video"></div>
  `
}

function rightClick(target: Element) {
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 100, clientY: 200 })
  target.dispatchEvent(event)
  return event
}

describe('register menu', () => {
  const onAssign = vi.fn()
  const documentKeydown = vi.fn()
  let menu: ReturnType<typeof createRegisterMenu>

  beforeEach(() => {
    setupMeetDom()
    menu = createRegisterMenu({ getShortcuts: () => ({ ...DEFAULT_SHORTCUTS, 9: '' }), onAssign })
    document.addEventListener('contextmenu', menu.handleContextmenu)
    document.addEventListener('keydown', documentKeydown)
  })

  afterEach(() => {
    document.removeEventListener('contextmenu', menu.handleContextmenu)
    document.removeEventListener('keydown', documentKeydown)
    menu.close()
    vi.clearAllMocks()
  })

  function menuElement() {
    return document.querySelector<HTMLElement>('#meet-emoji-register-menu')
  }

  function slotButtons() {
    return Array.from(menuElement()!.querySelectorAll<HTMLButtonElement>('button[data-favorite-key]'))
  }

  it('バーの絵文字を右クリックすると9枠のメニューを出す', () => {
    const event = rightClick(document.querySelector('#recent')!)

    expect(event.defaultPrevented).toBe(true)
    expect(menuElement()!.textContent).toContain('🦊')
    expect(slotButtons().map(button => button.textContent)).toEqual([
      '⇧1🙏', '⇧2👀', '⇧3🔥', '⇧4🙇', '⇧5💯', '⇧6🙌', '⇧7✅', '⇧8🤝', '⇧9—',
    ])
  })

  it('ブラウザが日本語ならメニューを日本語で出す', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja')
    rightClick(document.querySelector('#recent')!)

    expect(menuElement()!.textContent).toContain('🦊 を登録する番号')
    language.mockRestore()
  })

  it('一覧の中の絵文字を右クリックしても出す', () => {
    rightClick(document.querySelector('#picker-item img')!)

    expect(menuElement()!.textContent).toContain('🐱')
  })

  it('バーの絵文字のときは、バーにかぶらないようにバーの上に出す', () => {
    document.querySelector<HTMLElement>('div[aria-label="リアクションを送信"]')!.getBoundingClientRect = () => ({ top: 700, bottom: 760, left: 50, right: 500 }) as DOMRect
    rightClick(document.querySelector('#recent')!)

    expect(menuElement()!.style.top).toBe('532px')
    expect(menuElement()!.style.left).toBe('100px')
  })

  it('一覧の絵文字で上に出す場所がないときは、一覧にかぶらないように一覧の左に出す', () => {
    document.querySelector<HTMLElement>('#emoji-picker')!.getBoundingClientRect = () => ({ top: 100, bottom: 500, left: 500, right: 800 }) as DOMRect
    rightClick(document.querySelector('#picker-item')!)

    expect(menuElement()!.style.left).toBe('292px')
    expect(menuElement()!.style.top).toBe('120px')
  })

  it('一覧の左にも場所がないときは、一覧の右に出す', () => {
    document.querySelector<HTMLElement>('#emoji-picker')!.getBoundingClientRect = () => ({ top: 100, bottom: 500, left: 100, right: 400 }) as DOMRect
    rightClick(document.querySelector('#picker-item')!)

    expect(menuElement()!.style.left).toBe('408px')
  })

  it('絵文字以外を右クリックしたときは何もしない', () => {
    const event = rightClick(document.querySelector('#video')!)

    expect(event.defaultPrevented).toBe(false)
    expect(menuElement()).toBeNull()
  })

  it('枠を選ぶとその番号に登録してメニューを閉じる', () => {
    rightClick(document.querySelector('#recent')!)
    slotButtons()[2].click()

    expect(onAssign).toHaveBeenCalledWith(3, '🦊')
    expect(menuElement()).toBeNull()
  })

  it('メニューを開いている間は数字キーで枠を選べて、リアクションは送らない', () => {
    rightClick(document.querySelector('#recent')!)
    menuElement()!.dispatchEvent(new KeyboardEvent('keydown', { key: '4', bubbles: true }))

    expect(onAssign).toHaveBeenCalledWith(4, '🦊')
    expect(documentKeydown).not.toHaveBeenCalled()
  })

  it('開くと最初の枠にフォーカスを移す', () => {
    rightClick(document.querySelector('#recent')!)

    expect(document.activeElement).toBe(slotButtons()[0])
  })

  it('Escで閉じる', () => {
    rightClick(document.querySelector('#recent')!)
    menuElement()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(menuElement()).toBeNull()
    expect(onAssign).not.toHaveBeenCalled()
  })

  it('メニューの外をクリックすると閉じる', () => {
    rightClick(document.querySelector('#recent')!)
    document.querySelector('#video')!.dispatchEvent(new Event('pointerdown', { bubbles: true }))

    expect(menuElement()).toBeNull()
  })

  it('もう一度右クリックするとメニューを作り直す', () => {
    rightClick(document.querySelector('#recent')!)
    rightClick(document.querySelector('#picker-item')!)

    expect(document.querySelectorAll('#meet-emoji-register-menu')).toHaveLength(1)
    expect(menuElement()!.textContent).toContain('🐱')
  })
})

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function toastElement() {
    return document.querySelector<HTMLElement>('#meet-emoji-toast')
  }

  it('メッセージを出して5秒で消す', () => {
    showToast('⇧3: 🔥 → 🦊')

    expect(toastElement()!.textContent).toContain('⇧3: 🔥 → 🦊')

    vi.advanceTimersByTime(5100)

    expect(toastElement()).toBeNull()
  })

  it('元に戻すを押すと処理を呼んで消す', () => {
    const onUndo = vi.fn()
    showToast('⇧3: 🔥 → 🦊', onUndo)
    toastElement()!.querySelector('button')!.click()

    expect(onUndo).toHaveBeenCalledOnce()
    expect(toastElement()).toBeNull()
  })

  it('ブラウザが日本語なら元に戻すボタンを日本語で出す', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja')
    showToast('⇧3: 🔥 → 🦊', vi.fn())

    expect(toastElement()!.querySelector('button')!.textContent).toBe('元に戻す')
    language.mockRestore()
  })

  it('新しい通知が来たら前のものと入れ替える', () => {
    showToast('first')
    showToast('second')

    expect(document.querySelectorAll('#meet-emoji-toast')).toHaveLength(1)
    expect(toastElement()!.textContent).toContain('second')
  })
})
