import { t } from '~/logic/i18n'

const TOAST_DURATION = 5000

const TOAST_STYLE = {
  position: 'fixed',
  left: '50%',
  top: '24px',
  transform: 'translateX(-50%)',
  zIndex: '10000',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 16px',
  borderRadius: '8px',
  backgroundColor: '#202124',
  color: 'white',
  fontSize: '14px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
}

let hideTimer: ReturnType<typeof setTimeout> | undefined

function hideToast() {
  clearTimeout(hideTimer)
  document.querySelector('#meet-emoji-toast')?.remove()
}

export function showToast(message: string, onUndo?: () => void) {
  hideToast()

  const toast = document.createElement('div')
  toast.id = 'meet-emoji-toast'
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  Object.assign(toast.style, TOAST_STYLE)

  const text = document.createElement('span')
  text.textContent = message
  toast.append(text)

  if (onUndo) {
    const undo = document.createElement('button')
    undo.textContent = t('undo')
    Object.assign(undo.style, { border: 'none', background: 'transparent', color: '#8ab4f8', fontWeight: 'bold', cursor: 'pointer' })
    undo.addEventListener('click', () => {
      onUndo()
      hideToast()
    })
    toast.append(undo)
  }

  document.body.append(toast)
  hideTimer = setTimeout(hideToast, TOAST_DURATION)
}
