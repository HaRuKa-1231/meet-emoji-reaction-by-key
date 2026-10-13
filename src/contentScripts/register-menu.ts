import type { Shortcuts } from '~/logic/favorites'
import { SHORTCUT_KEYS } from '~/logic/favorites'
import { t } from '~/logic/i18n'

const MENU_GAP = 8

interface RegisterMenuOptions {
  getShortcuts: () => Shortcuts
  onAssign: (key: number, emoji: string) => void
}

const MENU_STYLE = {
  position: 'fixed',
  zIndex: '10000',
  minWidth: '180px',
  padding: '8px',
  borderRadius: '8px',
  backgroundColor: '#202124',
  color: 'white',
  fontSize: '13px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.5)',
}

const SLOT_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '4px',
  border: 'none',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'white',
  cursor: 'pointer',
}

export function createRegisterMenu({ getShortcuts, onAssign }: RegisterMenuOptions) {
  let menu: HTMLElement | null = null

  function close() {
    menu?.remove()
    menu = null
    document.removeEventListener('pointerdown', handleOutsidePointerdown, true)
  }

  function handleOutsidePointerdown(event: Event) {
    if (menu && event.target instanceof Node && !menu.contains(event.target))
      close()
  }

  function assign(key: number, emoji: string) {
    close()
    onAssign(key, emoji)
  }

  function placeAwayFrom(anchor: Element | null, x: number, y: number, width: number, height: number) {
    const rect = anchor?.getBoundingClientRect()
    if (!rect)
      return { left: x, top: y - height }
    if (rect.top - height - MENU_GAP >= MENU_GAP)
      return { left: x, top: rect.top - height - MENU_GAP }
    const leftSide = rect.left - width - MENU_GAP
    return { left: leftSide >= MENU_GAP ? leftSide : rect.right + MENU_GAP, top: y - height / 2 }
  }

  function open(emoji: string, x: number, y: number, anchor: Element | null) {
    close()
    const shortcuts = getShortcuts()

    menu = document.createElement('div')
    menu.id = 'meet-emoji-register-menu'
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-label', t('registerMenuLabel', emoji))
    Object.assign(menu.style, MENU_STYLE)

    const title = document.createElement('div')
    title.textContent = t('registerMenuTitle', emoji)
    Object.assign(title.style, { marginBottom: '6px', color: '#bdc1c6' })

    const grid = document.createElement('div')
    Object.assign(grid.style, { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' })
    grid.append(...SHORTCUT_KEYS.map((key) => {
      const slot = document.createElement('button')
      slot.dataset.favoriteKey = `${key}`
      slot.setAttribute('role', 'menuitem')
      slot.setAttribute('aria-label', t('registerSlotLabel', `${key}`, shortcuts[key] || t('empty'), emoji))
      Object.assign(slot.style, SLOT_STYLE)
      const label = document.createElement('span')
      label.textContent = `⇧${key}`
      Object.assign(label.style, { fontSize: '10px', color: '#bdc1c6' })
      const current = document.createElement('span')
      current.textContent = shortcuts[key] || '—'
      Object.assign(current.style, { fontSize: '18px' })
      slot.append(label, current)
      slot.addEventListener('click', () => assign(key, emoji))
      return slot
    }))

    menu.append(title, grid)
    menu.addEventListener('keydown', (event) => {
      event.stopPropagation()
      if (event.key === 'Escape')
        close()
      else if (event.key >= '1' && event.key <= '9')
        assign(Number(event.key), emoji)
    })

    document.body.append(menu)
    const width = menu.offsetWidth || 200
    const height = menu.offsetHeight || 160
    const { left, top } = placeAwayFrom(anchor, x, y, width, height)
    menu.style.left = `${Math.max(MENU_GAP, Math.min(left, window.innerWidth - width - MENU_GAP))}px`
    menu.style.top = `${Math.max(MENU_GAP, Math.min(top, window.innerHeight - height - MENU_GAP))}px`
    menu.querySelector<HTMLButtonElement>('button')?.focus()
    document.addEventListener('pointerdown', handleOutsidePointerdown, true)
  }

  function handleContextmenu(event: MouseEvent) {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-emoji]:is(button, [role="menuitem"])') : null
    const emoji = target?.dataset.emoji
    if (!emoji)
      return
    event.preventDefault()
    open(emoji, event.clientX, event.clientY, target!.closest('[role="dialog"]'))
  }

  return { handleContextmenu, close }
}
