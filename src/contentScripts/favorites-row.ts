import { getEmojiButtons, getReactionBar, isKeyboardBusy } from './reaction'
import type { Shortcuts } from '~/logic/favorites'
import { SHORTCUT_KEYS } from '~/logic/favorites'
import { t } from '~/logic/i18n'

const SHOW_DELAY = 150
const HIDE_DELAY = 1500
const ALIGNED_ROW_PADDING = 8

interface FavoritesRowOptions {
  getShortcuts: () => Shortcuts
  onSend: (emoji: string) => void
  onPinChange: (pinned: boolean) => void
}

const ROW_STYLE = {
  position: 'fixed',
  zIndex: '9999',
  display: 'none',
  gap: '2px',
  padding: '4px 8px',
  borderRadius: '24px',
  backgroundColor: 'rgba(32, 33, 36, 0.95)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  transform: 'translateX(-50%)',
}

const FAVORITE_BUTTON_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '36px',
  padding: '2px 4px',
  border: 'none',
  borderRadius: '12px',
  background: 'transparent',
  color: 'white',
  cursor: 'pointer',
}

const TOGGLE_STYLE = {
  position: 'fixed',
  zIndex: '9999',
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '50%',
  fontSize: '14px',
  cursor: 'pointer',
}

export function createFavoritesRow({ getShortcuts, onSend, onPinChange }: FavoritesRowOptions) {
  const row = document.createElement('div')
  row.id = 'meet-emoji-favorites'
  row.setAttribute('role', 'toolbar')
  row.setAttribute('aria-label', t('favoritesRowLabel'))
  row.hidden = true
  Object.assign(row.style, ROW_STYLE)

  const toggle = document.createElement('button')
  toggle.id = 'meet-emoji-favorites-toggle'
  toggle.textContent = '⇧'
  toggle.title = t('favoritesToggleTitle')
  toggle.setAttribute('aria-label', t('favoritesToggleLabel'))
  toggle.hidden = true
  Object.assign(toggle.style, TOGGLE_STYLE)

  document.body.append(row, toggle)

  let pinned = false
  let shownByShift = false
  let hovered = false
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let hideTimer: ReturnType<typeof setTimeout> | undefined
  let renderedShortcuts = ''

  function render() {
    const shortcuts = getShortcuts()
    const serialized = JSON.stringify(shortcuts)
    if (serialized === renderedShortcuts)
      return
    renderedShortcuts = serialized
    row.replaceChildren(...SHORTCUT_KEYS.map((key) => {
      const emoji = shortcuts[key]
      const button = document.createElement('button')
      Object.assign(button.style, FAVORITE_BUTTON_STYLE)
      const label = document.createElement('span')
      label.textContent = `⇧${key}`
      Object.assign(label.style, { fontSize: '10px', color: '#bdc1c6' })
      const icon = document.createElement('span')
      icon.textContent = emoji || '—'
      Object.assign(icon.style, { fontSize: '20px', lineHeight: '24px' })
      button.append(label, icon)
      if (emoji) {
        button.setAttribute('aria-label', t('sendFavorite', emoji, `${key}`))
        button.addEventListener('click', () => onSend(emoji))
      }
      else {
        button.disabled = true
        button.setAttribute('aria-label', t('emptyFavorite', `${key}`))
        button.style.cursor = 'default'
        button.style.opacity = '0.5'
      }
      return button
    }))
  }

  function alignToBar(targets: DOMRect[]) {
    const left = targets[0].left - ALIGNED_ROW_PADDING
    const last = targets[targets.length - 1]
    Object.assign(row.style, { left: `${left}px`, width: `${last.left + last.width + ALIGNED_ROW_PADDING - left}px`, height: '44px', padding: '4px 0', transform: 'none' })
    Array.from(row.children as HTMLCollectionOf<HTMLElement>).forEach((button, index) => {
      Object.assign(button.style, { position: 'absolute', top: '4px', left: `${targets[index].left - left}px`, width: `${targets[index].width}px`, minWidth: '0', padding: '2px 0' })
    })
  }

  function centerOnBar(rect: DOMRect) {
    Object.assign(row.style, { left: `${rect.left + rect.width / 2}px`, width: '', height: '', padding: ROW_STYLE.padding, transform: ROW_STYLE.transform })
    Array.from(row.children as HTMLCollectionOf<HTMLElement>).forEach((button) => {
      Object.assign(button.style, { position: '', top: '', left: '', width: '', minWidth: FAVORITE_BUTTON_STYLE.minWidth, padding: FAVORITE_BUTTON_STYLE.padding })
    })
  }

  function position(bar: Element) {
    const rect = bar.getBoundingClientRect()
    const targets = getEmojiButtons().slice(0, SHORTCUT_KEYS.length).map(button => button.getBoundingClientRect())
    if (targets.length === SHORTCUT_KEYS.length)
      alignToBar(targets)
    else
      centerOnBar(rect)
    row.style.bottom = `${window.innerHeight - rect.top + 8}px`
    toggle.style.left = `${rect.left - 36}px`
    toggle.style.top = `${rect.top + (rect.height - 28) / 2}px`
  }

  function refresh() {
    const bar = getReactionBar()
    toggle.hidden = !bar
    row.hidden = !bar || !(pinned || shownByShift)
    row.style.display = row.hidden ? 'none' : 'flex'
    toggle.setAttribute('aria-pressed', `${pinned}`)
    Object.assign(toggle.style, pinned
      ? { backgroundColor: '#8ab4f8', color: '#202124' }
      : { backgroundColor: 'rgba(60, 64, 67, 0.95)', color: 'white' })
    if (bar)
      position(bar)
  }

  function clearTimers() {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    showTimer = undefined
  }

  function hideNow() {
    clearTimers()
    shownByShift = false
    refresh()
  }

  function scheduleHide() {
    clearTimeout(hideTimer)
    if (!shownByShift || hovered)
      return
    hideTimer = setTimeout(hideNow, HIDE_DELAY)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      if (event.repeat || showTimer || isKeyboardBusy())
        return
      clearTimeout(hideTimer)
      showTimer = setTimeout(() => {
        showTimer = undefined
        shownByShift = true
        refresh()
      }, SHOW_DELAY)
      return
    }
    if (event.key === 'Tab')
      hideNow()
  }

  function handleKeyup(event: KeyboardEvent) {
    if (event.key !== 'Shift')
      return
    clearTimeout(showTimer)
    showTimer = undefined
    scheduleHide()
  }

  row.addEventListener('mouseenter', () => {
    hovered = true
    clearTimeout(hideTimer)
  })
  row.addEventListener('mouseleave', () => {
    hovered = false
    scheduleHide()
  })
  toggle.addEventListener('click', () => {
    pinned = !pinned
    onPinChange(pinned)
    refresh()
  })
  window.addEventListener('blur', hideNow)

  render()

  return {
    handleKeydown,
    handleKeyup,
    update() {
      render()
      refresh()
    },
    setPinned(value: boolean) {
      pinned = value
      refresh()
    },
    destroy() {
      clearTimers()
      window.removeEventListener('blur', hideNow)
      row.remove()
      toggle.remove()
    },
  }
}
