import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGuide } from '../guide'

function setupMeetDom() {
  document.body.innerHTML = `
    <div role="dialog" aria-label="リアクションを送信">
      <button data-emoji="💖"></button>
    </div>
  `
}

describe('guide', () => {
  const onDismiss = vi.fn()
  let guide: ReturnType<typeof createGuide>

  beforeEach(() => {
    setupMeetDom()
    guide = createGuide({ onDismiss })
  })

  afterEach(() => {
    guide.destroy()
    vi.clearAllMocks()
  })

  function guideElement() {
    return document.querySelector<HTMLElement>('#meet-emoji-guide')
  }

  it('リアクションバーがあれば使い方を出す', () => {
    guide.show()

    expect(guideElement()!.textContent).toContain('Shift + 1-9')
    expect(guideElement()!.textContent).toContain('Right-click')
  })

  it('リアクションバーがなければバーが出るまで待つ', () => {
    document.body.innerHTML = ''
    guide.show()

    expect(guideElement()).toBeNull()

    setupMeetDom()
    guide.update()

    expect(guideElement()).not.toBeNull()
  })

  it('OKを押すと消して、見たことを伝える', () => {
    guide.show()
    guideElement()!.querySelector('button')!.click()

    expect(guideElement()).toBeNull()
    expect(onDismiss).toHaveBeenCalledOnce()

    guide.update()
    expect(guideElement()).toBeNull()
  })

  it('show()を呼ぶまでは出さない', () => {
    guide.update()

    expect(guideElement()).toBeNull()
  })

  it('ブラウザが日本語なら日本語で出す', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja')
    guide.show()

    expect(guideElement()!.textContent).toContain('右クリック')
    language.mockRestore()
  })
})
