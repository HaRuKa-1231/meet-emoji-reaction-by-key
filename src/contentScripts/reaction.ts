import type { Shortcuts } from '~/logic/favorites'
import { isSameEmoji } from '~/logic/favorites'

export function getReactionBar(root: ParentNode = document) {
  return root.querySelector('button[data-emoji]:not([role="menuitem"])')?.closest('[role="dialog"]') ?? null
}

export function getEmojiButtons(root: ParentNode = document) {
  return Array.from(getReactionBar(root)?.querySelectorAll<HTMLButtonElement>('button[data-emoji]') ?? [])
}

function getPickerButton(root: ParentNode) {
  return getReactionBar(root)?.querySelector<HTMLButtonElement>('button[aria-haspopup]') ?? null
}

function getPicker(root: ParentNode) {
  const pickerId = getPickerButton(root)?.getAttribute('aria-controls')
  return pickerId ? document.getElementById(pickerId) : null
}

function isVisible(element: Element) {
  return element.getClientRects().length > 0
}

function waitFor<T>(find: () => T | null | undefined, timeout = 1500) {
  return new Promise<T | null>((resolve) => {
    const startedAt = Date.now()
    const check = () => {
      const found = find()
      if (found)
        return resolve(found)
      if (Date.now() - startedAt > timeout)
        return resolve(null)
      setTimeout(check, 20)
    }
    check()
  })
}

function setSearchText(input: HTMLInputElement, text: string) {
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const SENDING_ATTRIBUTE = 'data-meet-emoji-sending'

function hidePickerWhileSending() {
  if (!document.getElementById('meet-emoji-hide-picker')) {
    const style = document.createElement('style')
    style.id = 'meet-emoji-hide-picker'
    style.textContent = `html[${SENDING_ATTRIBUTE}] [role="dialog"]:has(input, [role="menuitem"][data-emoji]) { opacity: 0 !important; pointer-events: none !important; }`
    document.head.append(style)
  }
  document.documentElement.setAttribute(SENDING_ATTRIBUTE, '')
}

let isSendingFromPicker = false

async function sendEmojiFromPicker(emoji: string, root: ParentNode) {
  const pickerButton = getPickerButton(root)
  if (!pickerButton || isSendingFromPicker)
    return

  isSendingFromPicker = true
  hidePickerWhileSending()
  const previousFocus = document.activeElement
  let input: HTMLInputElement | null = null
  try {
    if (pickerButton.getAttribute('aria-expanded') !== 'true')
      pickerButton.click()

    input = await waitFor(() => {
      const picker = getPicker(root)
      return picker?.querySelector('button[data-emoji]') ? picker.querySelector('input') : null
    })
    if (input) {
      setSearchText(input, emoji)
      const emojiButton = await waitFor(() => Array.from(getPicker(root)?.querySelectorAll<HTMLButtonElement>('button[data-emoji]') ?? [])
        .find(button => isSameEmoji(button.dataset.emoji, emoji) && isVisible(button)))
      emojiButton?.click()
    }
  }
  finally {
    if (input)
      setSearchText(input, '')
    if (pickerButton.getAttribute('aria-expanded') === 'true')
      pickerButton.click()
    if (previousFocus instanceof HTMLElement)
      previousFocus.focus()
    await waitFor(() => {
      const picker = getPicker(root)
      return !picker || !isVisible(picker)
    }, 300)
    document.documentElement.removeAttribute(SENDING_ATTRIBUTE)
    isSendingFromPicker = false
  }
}

export function sendFavorite(emoji: string, root: ParentNode = document) {
  const barButton = getEmojiButtons(root).find(button => isSameEmoji(button.dataset.emoji, emoji))
  if (barButton)
    barButton.click()
  else
    sendEmojiFromPicker(emoji, root)
}

function sendFirstSearchResult(event: KeyboardEvent, root: ParentNode) {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.value)
    return

  const picker = getPicker(root)
  if (!picker?.contains(input))
    return

  const firstResult = Array.from(picker.querySelectorAll<HTMLButtonElement>('button[data-emoji]'))
    .find(isVisible)
  if (!firstResult)
    return

  firstResult.click()
  setSearchText(input, '')
  const pickerButton = getPickerButton(root)
  if (pickerButton?.getAttribute('aria-expanded') === 'true')
    pickerButton.click()
}

let isPointerInSidePanel = false

export function handlePointerdown(event: Event) {
  isPointerInSidePanel = event.target instanceof Element && !!event.target.closest('aside')
}

export function isTypingTarget(element: Element | null) {
  if (!(element instanceof HTMLElement))
    return false
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
    return true
  if (element.closest('[contenteditable]:not([contenteditable="false"])'))
    return true
  return !!element.closest('[role="textbox"], [role="combobox"], [role="searchbox"]')
}

export function isKeyboardBusy() {
  return isPointerInSidePanel || isTypingTarget(document.activeElement)
}

export function addNumberToEmoji(root: ParentNode = document) {
  const labeledButtons: [HTMLButtonElement, string][] = getEmojiButtons(root).slice(0, 9).map((button, index) => [button, `${index + 1}`])
  const pickerButton = getPickerButton(root)
  if (pickerButton)
    labeledButtons.push([pickerButton, '0'])

  labeledButtons.forEach(([button, label]) => {
    const existingNumber = button.querySelector('.emoji-number-label')
    if (existingNumber)
      existingNumber.remove()

    const numberElement = document.createElement('span')
    numberElement.textContent = label
    numberElement.classList.add('emoji-number-label')

    const buttonSize = button.getBoundingClientRect()
    const numberSize = buttonSize.width / 3

    const COMMON_STYLE = {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: `${numberSize}px`,
      height: `${numberSize}px`,
      backgroundColor: 'white',
      color: 'black',
      borderRadius: '50%',
      textAlign: 'center',
      lineHeight: `${numberSize}px`,
      fontSize: `${numberSize * 0.6}px`,
    }

    Object.assign(numberElement.style, COMMON_STYLE)

    button.style.position = 'relative'
    button.appendChild(numberElement)
  })
}

export function handleKeydown(event: KeyboardEvent, root: ParentNode = document, shortcuts: Shortcuts = {}) {
  if (event.repeat || event.metaKey || event.altKey || event.ctrlKey)
    return

  if (event.key === 'Enter' && !event.shiftKey) {
    if (!event.isComposing)
      sendFirstSearchResult(event, root)
    return
  }

  if (isKeyboardBusy())
    return

  if (event.shiftKey) {
    const digit = event.code.match(/^Digit([1-9])$/)?.[1]
    const emoji = digit && shortcuts[Number(digit)]
    if (emoji)
      sendFavorite(emoji, root)
    return
  }

  if (event.key === '0')
    getPickerButton(root)?.click()

  if (event.key >= '1' && event.key <= '9')
    getEmojiButtons(root)[parseInt(event.key) - 1]?.click()
}
