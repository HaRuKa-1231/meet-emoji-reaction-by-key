import { getReactionBar } from './reaction'
import type { MessageKey } from '~/logic/i18n'
import { t } from '~/logic/i18n'

const GUIDE_LINES: MessageKey[] = ['newRightClick', 'newFavorites', 'newHoldShift', 'newPicker']

const GUIDE_STYLE = {
  position: 'fixed',
  zIndex: '10000',
  width: '320px',
  padding: '12px 16px',
  borderRadius: '12px',
  backgroundColor: '#1a73e8',
  color: 'white',
  fontSize: '13px',
  lineHeight: '1.5',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  transform: 'translateX(-50%)',
}

const OK_BUTTON_STYLE = {
  display: 'block',
  marginLeft: 'auto',
  marginTop: '8px',
  padding: '4px 16px',
  border: 'none',
  borderRadius: '16px',
  backgroundColor: 'white',
  color: '#1a73e8',
  fontWeight: 'bold',
  cursor: 'pointer',
}

interface GuideOptions {
  onDismiss: () => void
}

export function createGuide({ onDismiss }: GuideOptions) {
  let requested = false
  let dismissed = false
  let guide: HTMLElement | null = null

  function build() {
    const element = document.createElement('div')
    element.id = 'meet-emoji-guide'
    element.setAttribute('role', 'dialog')
    element.setAttribute('aria-label', t('guideTitle'))
    Object.assign(element.style, GUIDE_STYLE)

    const title = document.createElement('div')
    title.textContent = t('guideTitle')
    Object.assign(title.style, { fontWeight: 'bold', marginBottom: '4px' })

    const list = document.createElement('ul')
    Object.assign(list.style, { margin: '0', paddingLeft: '18px' })
    list.append(...GUIDE_LINES.map((key) => {
      const item = document.createElement('li')
      item.textContent = t(key)
      return item
    }))

    const ok = document.createElement('button')
    ok.textContent = t('gotIt')
    Object.assign(ok.style, OK_BUTTON_STYLE)
    ok.addEventListener('click', () => {
      dismissed = true
      remove()
      onDismiss()
    })

    element.append(title, list, ok)
    document.body.append(element)
    return element
  }

  function remove() {
    guide?.remove()
    guide = null
  }

  function update() {
    if (!requested || dismissed)
      return
    const bar = getReactionBar()
    if (!bar) {
      remove()
      return
    }
    guide ??= build()
    const rect = bar.getBoundingClientRect()
    guide.style.left = `${rect.left + rect.width / 2}px`
    guide.style.bottom = `${window.innerHeight - rect.top + 64}px`
  }

  return {
    show() {
      requested = true
      update()
    },
    update,
    destroy: remove,
  }
}
