import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addNumberToEmoji, handleKeydown, handlePointerdown } from '../reaction'

const SHORTCUTS = { 1: '🙏', 2: '🔥', 3: '👍', 4: '❤', 5: '🦖' }

const BAR_EMOJIS = ['💖', '👍', '🎉', '👏', '😂', '😮', '😢', '🤔', '👎']

function setupMeetDom() {
  document.body.innerHTML = `
    <div role="dialog" aria-label="リアクションを送信">
      ${BAR_EMOJIS.map(emoji => `<button aria-label="${emoji}" data-emoji="${emoji}"></button>`).join('')}
      <button aria-label="その他の絵文字" aria-haspopup="menu" aria-controls="emoji-picker"></button>
    </div>
    <div id="emoji-picker" role="dialog">
      <input type="text" aria-label="検索">
      <div role="menu" class="browse">
        <button role="menuitem" data-emoji="😀"></button>
      </div>
      <div role="menu" class="results">
        <button role="menuitem" data-emoji="❤️‍🔥"></button>
        <button role="menuitem" data-emoji="🔥"></button>
        <button role="menuitem" data-emoji="🙏"></button>
        <button role="menuitem" data-emoji="❤️"></button>
      </div>
    </div>
    <input type="text" id="chat">
    <div contenteditable="true" role="combobox" id="gemini"></div>
    <aside aria-label="サイドパネル"><div id="chat-messages">hello</div><textarea id="chat-input"></textarea></aside>
    <div id="video"></div>
  `
  const opener = document.querySelector('button[aria-haspopup]')!
  opener.setAttribute('aria-expanded', 'false')
  opener.addEventListener('click', () => opener.setAttribute('aria-expanded', opener.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'))
}

function showOnly(selector: string) {
  document.querySelectorAll<HTMLElement>('#emoji-picker button[data-emoji]').forEach((button) => {
    const visible = button.matches(selector)
    button.getClientRects = () => (visible ? [{}] : []) as unknown as DOMRectList
  })
}

function barButton(emoji: string) {
  return document.querySelector<HTMLButtonElement>(`div[aria-label="リアクションを送信"] button[data-emoji="${emoji}"]`)!
}

function pickerButton() {
  return document.querySelector<HTMLButtonElement>('button[aria-haspopup]')!
}

function pickerItem(emoji: string) {
  return document.querySelector<HTMLButtonElement>(`#emoji-picker button[data-emoji="${emoji}"]`)!
}

function flush() {
  return new Promise(resolve => setTimeout(resolve, 100))
}

function clickOn(target: Element) {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
}

function press(target: Element, init: KeyboardEventInit) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
}

describe('reaction', () => {
  const listener = (event: KeyboardEvent) => handleKeydown(event, document, SHORTCUTS)

  beforeEach(() => {
    setupMeetDom()
    document.addEventListener('keydown', listener)
    document.addEventListener('pointerdown', handlePointerdown)
    clickOn(document.querySelector('#video')!)
  })

  afterEach(() => {
    document.removeEventListener('keydown', listener)
    document.removeEventListener('pointerdown', handlePointerdown)
    vi.restoreAllMocks()
  })

  describe('addNumberToEmoji', () => {
    it('バーの絵文字に1から9を振る', () => {
      addNumberToEmoji()

      BAR_EMOJIS.forEach((emoji, index) => {
        expect(barButton(emoji).querySelector('.emoji-number-label')?.textContent).toBe(`${index + 1}`)
      })
    })

    it('その他の絵文字ボタンに0を振る', () => {
      addNumberToEmoji()

      expect(pickerButton().querySelector('.emoji-number-label')?.textContent).toBe('0')
    })

    it('一覧から送ってバーに増えた絵文字には番号を振らない', () => {
      const bar = document.querySelector('div[aria-label="リアクションを送信"]')!
      bar.insertAdjacentHTML('beforeend', '<button data-emoji="🙏"></button><button data-emoji="🔥"></button>')

      addNumberToEmoji()

      const labels = Array.from(bar.querySelectorAll('.emoji-number-label')).map(label => label.textContent)
      expect(labels).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
    })

    it('Meetが英語でも日本語でもない表示のときもバーを見つけて番号を振る', () => {
      document.querySelector('div[aria-label="リアクションを送信"]')!.setAttribute('aria-label', 'Envoyer une réaction')
      addNumberToEmoji()

      expect(document.querySelectorAll('.emoji-number-label')).toHaveLength(10)
    })

    it('一覧の中の絵文字には番号を振らない', () => {
      addNumberToEmoji()

      expect(document.querySelectorAll('#emoji-picker .emoji-number-label')).toHaveLength(0)
    })
  })

  describe('handleKeydown', () => {
    it('数字キーでバーの対応する絵文字を押す', () => {
      const click = vi.spyOn(barButton('😂'), 'click')

      press(document.body, { key: '5' })

      expect(click).toHaveBeenCalledOnce()
    })

    it('0キーでその他の絵文字ボタンを押す', () => {
      const click = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '0' })

      expect(click).toHaveBeenCalledOnce()
    })

    it('修飾キー付きの0は無視する', () => {
      const click = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '0', metaKey: true })

      expect(click).not.toHaveBeenCalled()
    })

    it('入力欄で数字を打っても反応しない', () => {
      const input = document.querySelector<HTMLInputElement>('#chat')!
      input.focus()
      const pickerClick = vi.spyOn(pickerButton(), 'click')
      const barClick = vi.spyOn(barButton('💖'), 'click')

      press(input, { key: '0' })
      press(input, { key: '1' })

      expect(pickerClick).not.toHaveBeenCalled()
      expect(barClick).not.toHaveBeenCalled()
    })

    it('一覧の検索欄でEnterを押すと表示中の先頭の絵文字を送る', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      input.value = '炎'
      const click = vi.spyOn(pickerItem('❤️‍🔥'), 'click')

      press(input, { key: 'Enter' })

      expect(click).toHaveBeenCalledOnce()
    })

    it('Meetが先に先頭の絵文字へフォーカスを移しても送る', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      input.value = '炎'
      input.addEventListener('keydown', () => pickerItem('❤️‍🔥').focus())
      const click = vi.spyOn(pickerItem('❤️‍🔥'), 'click')

      press(input, { key: 'Enter' })

      expect(click).toHaveBeenCalledOnce()
    })

    it('日本語の変換確定のEnterでは送らない', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      input.value = '炎'
      const click = vi.spyOn(pickerItem('❤️‍🔥'), 'click')

      press(input, { key: 'Enter', isComposing: true })

      expect(click).not.toHaveBeenCalled()
    })

    it('検索欄が空のときのEnterでは送らない', () => {
      showOnly('.browse button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      const click = vi.spyOn(pickerItem('😀'), 'click')

      press(input, { key: 'Enter' })

      expect(click).not.toHaveBeenCalled()
    })

    it('Shift+数字で登録した絵文字を一覧から送る', async () => {
      showOnly('[data-emoji="🙏"]')
      const click = vi.spyOn(pickerItem('🙏'), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(click).toHaveBeenCalledOnce()
    })

    it('Shift+数字で送るときは検索欄に絵文字を入れて探す', async () => {
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      const searched: string[] = []
      input.addEventListener('input', () => {
        searched.push(input.value)
        showOnly(`[data-emoji="${input.value}"]`)
      })
      const click = vi.spyOn(pickerItem('🔥'), 'click')

      press(document.body, { key: '"', code: 'Digit2', shiftKey: true })
      await flush()

      expect(searched[0]).toBe('🔥')
      expect(click).toHaveBeenCalledOnce()
    })

    it('初めて開いた一覧で絵文字がまだ並んでいなくても、並ぶのを待ってから検索して送る', async () => {
      const click = vi.spyOn(pickerItem('🔥'), 'click')
      const picker = document.querySelector('#emoji-picker')!
      const items = Array.from(picker.querySelectorAll('div[role="menu"]'))
      items.forEach(item => item.remove())
      vi.spyOn(pickerButton(), 'click').mockImplementationOnce(() => {
        setTimeout(() => items.forEach(item => picker.appendChild(item)), 50)
      })
      const input = picker.querySelector<HTMLInputElement>('input')!
      input.addEventListener('input', () => {
        if (picker.querySelector('button[data-emoji]'))
          showOnly(`[data-emoji="${input.value}"]`)
      })

      press(document.body, { key: '"', code: 'Digit2', shiftKey: true })
      await flush()
      await flush()

      expect(click).toHaveBeenCalledOnce()
    })

    it('Shift+数字で一覧から送っている間だけ、一覧を見えなくする', async () => {
      showOnly('[data-emoji="🙏"]')
      let hiddenWhileSending = false
      vi.spyOn(pickerItem('🙏'), 'click').mockImplementation(() => {
        hiddenWhileSending = document.documentElement.hasAttribute('data-meet-emoji-sending')
      })

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(hiddenWhileSending).toBe(true)
      expect(document.documentElement.hasAttribute('data-meet-emoji-sending')).toBe(false)
      expect(document.querySelector('#meet-emoji-hide-picker')!.textContent).toContain('[data-meet-emoji-sending]')
      expect(document.querySelector('#meet-emoji-hide-picker')!.textContent).toContain('pointer-events: none')
    })

    it('Shift+数字で送ったあとは一覧を閉じて検索欄を空に戻す', async () => {
      showOnly('[data-emoji="🙏"]')
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(pickerClick).toHaveBeenCalledTimes(2)
      expect(document.querySelector<HTMLInputElement>('#emoji-picker input')!.value).toBe('')
    })

    it('Shift+数字で送ったあとは元のフォーカスに戻す', async () => {
      showOnly('[data-emoji="🙏"]')
      const bar = barButton('💖')
      bar.focus()
      vi.spyOn(pickerButton(), 'click').mockImplementation(() => document.querySelector<HTMLInputElement>('#emoji-picker input')!.focus())

      press(bar, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(document.activeElement).toBe(bar)
    })

    it('登録していないShift+数字では何もしない', async () => {
      const click = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '&', code: 'Digit6', shiftKey: true })
      await flush()

      expect(click).not.toHaveBeenCalled()
    })

    it('Shift+数字ではバーの絵文字は押さない', async () => {
      showOnly('[data-emoji="🙏"]')
      const click = vi.spyOn(barButton('💖'), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(click).not.toHaveBeenCalled()
    })

    it('入力欄でShift+数字を打っても送らない', async () => {
      showOnly('[data-emoji="🙏"]')
      const input = document.querySelector<HTMLInputElement>('#chat')!
      input.focus()
      const click = vi.spyOn(pickerItem('🙏'), 'click')

      press(input, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(click).not.toHaveBeenCalled()
    })

    it('文字を打てるdivで数字を打っても送らない', () => {
      const gemini = document.querySelector<HTMLElement>('#gemini')!
      gemini.focus()
      const click = vi.spyOn(barButton('👍'), 'click')

      press(gemini, { key: '2' })

      expect(click).not.toHaveBeenCalled()
    })

    it('サイドパネルをクリックしたあとは数字を打っても送らない', () => {
      clickOn(document.querySelector('#chat-messages')!)
      const click = vi.spyOn(barButton('👍'), 'click')

      press(document.body, { key: '2' })

      expect(click).not.toHaveBeenCalled()
    })

    it('サイドパネルをクリックしたあとはShift+数字でも送らない', async () => {
      showOnly('[data-emoji="🙏"]')
      clickOn(document.querySelector('#chat-messages')!)
      const click = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(click).not.toHaveBeenCalled()
    })

    it('サイドパネルの外をクリックしたら、また数字で送れる', () => {
      clickOn(document.querySelector('#chat-messages')!)
      clickOn(document.querySelector('#video')!)
      const click = vi.spyOn(barButton('👍'), 'click')

      press(document.body, { key: '2' })

      expect(click).toHaveBeenCalledOnce()
    })

    it('Shift+数字のお気に入りがバーにあれば、一覧を開かずにバーのボタンを押す', async () => {
      const barClick = vi.spyOn(barButton('👍'), 'click')
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '#', code: 'Digit3', shiftKey: true })
      await flush()

      expect(barClick).toHaveBeenCalledOnce()
      expect(pickerClick).not.toHaveBeenCalled()
    })

    it('Shift+数字のお気に入りがバーの最近の枠にあれば、そのボタンを押す', async () => {
      const bar = document.querySelector('div[aria-label="リアクションを送信"]')!
      bar.querySelector('button[aria-haspopup]')!.insertAdjacentHTML('beforebegin', '<button data-emoji="🙏"></button>')
      const recentClick = vi.spyOn(barButton('🙏'), 'click')
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(recentClick).toHaveBeenCalledOnce()
      expect(pickerClick).not.toHaveBeenCalled()
    })

    it('見えない異体字セレクタがちがっても一覧から見つけて送る', async () => {
      showOnly('[data-emoji="❤️"]')
      const click = vi.spyOn(pickerItem('❤️'), 'click')

      press(document.body, { key: '$', code: 'Digit4', shiftKey: true })
      await flush()

      expect(click).toHaveBeenCalledOnce()
    })

    it('一覧で見つからなくても、すぐに一覧を閉じて次のShift+数字を受け付ける', async () => {
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '%', code: 'Digit5', shiftKey: true })
      await new Promise(resolve => setTimeout(resolve, 1600))

      expect(pickerClick).toHaveBeenCalledTimes(2)
      expect(document.querySelector<HTMLInputElement>('#emoji-picker input')!.value).toBe('')

      showOnly('[data-emoji="🙏"]')
      const click = vi.spyOn(pickerItem('🙏'), 'click')
      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(click).toHaveBeenCalledOnce()
    })

    it('一覧の検索欄でEnterを押して送ったら、検索欄を空にして一覧を閉じる', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      input.value = '炎'
      pickerButton().setAttribute('aria-expanded', 'true')
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(input, { key: 'Enter' })

      expect(input.value).toBe('')
      expect(pickerClick).toHaveBeenCalledOnce()
    })

    it('一覧の検索欄でEnterを押したとき、一覧がもう閉じていれば、閉じるボタンを押さない', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      input.value = '炎'
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(input, { key: 'Enter' })

      expect(pickerClick).not.toHaveBeenCalled()
    })

    it('Shift+数字で送ったとき、一覧がもう閉じていれば、閉じるボタンを押さない', async () => {
      showOnly('[data-emoji="🙏"]')
      vi.spyOn(pickerItem('🙏'), 'click').mockImplementation(() => pickerButton().setAttribute('aria-expanded', 'false'))
      const pickerClick = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true })
      await flush()

      expect(pickerClick).toHaveBeenCalledOnce()
    })

    it('キーを押しっぱなしにして繰り返された数字キーでは押さない', () => {
      const click = vi.spyOn(barButton('👍'), 'click')

      press(document.body, { key: '2', repeat: true })

      expect(click).not.toHaveBeenCalled()
    })

    it('キーを押しっぱなしにして繰り返されたShift+数字では送らない', async () => {
      showOnly('[data-emoji="🙏"]')
      const click = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '!', code: 'Digit1', shiftKey: true, repeat: true })
      await flush()

      expect(click).not.toHaveBeenCalled()
    })

    it('キーを押しっぱなしにして繰り返された0では押さない', () => {
      const click = vi.spyOn(pickerButton(), 'click')

      press(document.body, { key: '0', repeat: true })

      expect(click).not.toHaveBeenCalled()
    })

    it('キーを押しっぱなしにして繰り返されたEnterでは送らない', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#emoji-picker input')!
      input.focus()
      input.value = '炎'
      const click = vi.spyOn(pickerItem('❤️‍🔥'), 'click')

      press(input, { key: 'Enter', repeat: true })

      expect(click).not.toHaveBeenCalled()
    })

    it('combobox の中のボタンにフォーカスがあるとき、数字を打っても送らない', () => {
      document.body.insertAdjacentHTML('beforeend', '<div role="combobox"><button id="inner"></button></div>')
      document.querySelector<HTMLElement>('#inner')!.focus()
      const click = vi.spyOn(barButton('👍'), 'click')

      press(document.activeElement!, { key: '2' })

      expect(click).not.toHaveBeenCalled()
    })

    it('一覧の外の入力欄でEnterを押しても送らない', () => {
      showOnly('.results button')
      const input = document.querySelector<HTMLInputElement>('#chat')!
      input.focus()
      input.value = '炎'
      const click = vi.spyOn(pickerItem('❤️‍🔥'), 'click')

      press(input, { key: 'Enter' })

      expect(click).not.toHaveBeenCalled()
    })
  })
})
