import { addNumberToEmoji, handleKeydown, handlePointerdown, sendFavorite } from './reaction'
import { createFavoritesRow } from './favorites-row'
import { createRegisterMenu } from './register-menu'
import { showToast } from './toast'
import { createGuide } from './guide'
import { DEFAULT_SHORTCUTS, assignFavorite, loadPinned, loadShortcuts, savePinned, saveShortcuts, watchShortcuts } from '~/logic/shortcuts'
import { loadGuideSeen, saveGuideSeen } from '~/logic/whats-new'

(() => {
  let shortcuts = DEFAULT_SHORTCUTS

  const favoritesRow = createFavoritesRow({
    getShortcuts: () => shortcuts,
    onSend: emoji => sendFavorite(emoji),
    onPinChange: pinned => savePinned(pinned),
  })

  const registerMenu = createRegisterMenu({
    getShortcuts: () => shortcuts,
    onAssign: (key, emoji) => {
      const previous = shortcuts
      shortcuts = assignFavorite(previous, key, emoji)
      favoritesRow.update()
      saveShortcuts(shortcuts)
      showToast(`⇧${key}: ${previous[key] || '—'} → ${emoji}`, () => {
        shortcuts = previous
        favoritesRow.update()
        saveShortcuts(previous)
      })
    },
  })

  loadShortcuts().then((loaded) => {
    shortcuts = loaded
    favoritesRow.update()
  })
  watchShortcuts((changed) => {
    shortcuts = changed
    favoritesRow.update()
  })
  loadPinned().then(pinned => favoritesRow.setPinned(pinned))

  const guide = createGuide({ onDismiss: () => saveGuideSeen() })
  loadGuideSeen().then((seen) => {
    if (!seen)
      guide.show()
  })

  // 監視の対象となるノードを選択
  const targetNode = document.body

  // 監視のオプション
  const config = {
    childList: true,
    subtree: true,
  }

  const update = (observer: MutationObserver) => {
    observer.disconnect() // 監視を一時停止
    addNumberToEmoji()
    favoritesRow.update()
    guide.update()
    observer.observe(targetNode, config) // 監視を再開
  }

  // コールバック関数
  const callback: MutationCallback = function (mutationsList, observer) {
    if (mutationsList.some(mutation => mutation.type === 'childList'))
      update(observer)
  }

  // MutationObserverをインスタンス化
  const observer = new MutationObserver(callback)

  // 監視を開始
  update(observer)

  document.addEventListener('pointerdown', handlePointerdown, true)
  document.addEventListener('keydown', event => handleKeydown(event, document, shortcuts))
  document.addEventListener('keydown', favoritesRow.handleKeydown)
  document.addEventListener('keyup', favoritesRow.handleKeyup)
  document.addEventListener('contextmenu', registerMenu.handleContextmenu)
  window.addEventListener('resize', () => {
    favoritesRow.update()
    guide.update()
  })
})()
