const en = {
  extDescription: 'Send Google Meet reactions with number keys. Shift + 1-9 sends your favorite emoji.',
  favoritesRowLabel: 'Favorite reactions',
  favoritesToggleTitle: 'Show favorite reactions (Shift + 1-9)',
  favoritesToggleLabel: 'Always show favorite reactions',
  sendFavorite: 'Send $1 (Shift + $2)',
  emptyFavorite: 'Shift + $1 is empty',
  registerMenuLabel: 'Add $1 to favorites',
  registerMenuTitle: 'Add $1 to Shift +',
  registerSlotLabel: 'Shift + $1: set to $3 (now $2)',
  empty: 'empty',
  undo: 'Undo',
  helpBar: 'reactions on the Meet bar',
  helpPicker: 'open the emoji picker, search, then Enter to send',
  helpFavorites: 'your favorites below',
  favorites: 'Favorites',
  favoritesHint: 'Right-click any emoji in Meet to add it here, or paste one. Hold Shift in Meet to see this list.',
  emojiFor: 'Emoji for Shift + $1',
  moveUp: 'Move Shift + $1 up',
  moveDown: 'Move Shift + $1 down',
  clear: 'Clear Shift + $1',
  undoLastChange: 'Undo last change',
  resetToDefaults: 'Reset to defaults',
  confirmReset: 'Click again to reset',
  whatsNewTitle: 'What\'s new',
  guideTitle: 'Send any emoji with a key',
  newFavorites: 'Shift + 1-9: send a favorite emoji',
  newHoldShift: 'Hold Shift: show favorites above the bar',
  newRightClick: 'Right-click an emoji: add it to favorites',
  newPicker: '0: open the emoji picker (search, then Enter to send)',
  gotIt: 'Got it',
}

export type MessageKey = keyof typeof en

const ja: Record<MessageKey, string> = {
  extDescription: 'Google Meetのリアクションを数字キーで送れます。Shift + 1〜9 でお気に入りの絵文字を送れます。',
  favoritesRowLabel: 'お気に入りのリアクション',
  favoritesToggleTitle: 'お気に入りのリアクションを出す（Shift + 1〜9）',
  favoritesToggleLabel: 'お気に入りのリアクションを出したままにする',
  sendFavorite: '$1 を送る（Shift + $2）',
  emptyFavorite: 'Shift + $1 は空です',
  registerMenuLabel: '$1 をお気に入りに登録',
  registerMenuTitle: '$1 を登録する番号',
  registerSlotLabel: 'Shift + $1：$2 を $3 にする',
  empty: '空',
  undo: '元に戻す',
  helpBar: 'Meetのバーのリアクション',
  helpPicker: '絵文字の一覧を開く。検索して Enter で送る',
  helpFavorites: '下のお気に入り',
  favorites: 'お気に入り',
  favoritesHint: 'Meetで絵文字を右クリックすると、ここに登録できます。絵文字を貼り付けてもOK。MeetでShiftを押している間、この一覧が出ます。',
  emojiFor: 'Shift + $1 の絵文字',
  moveUp: 'Shift + $1 を上へ',
  moveDown: 'Shift + $1 を下へ',
  clear: 'Shift + $1 を消す',
  undoLastChange: '直前の変更を元に戻す',
  resetToDefaults: '最初の状態に戻す',
  confirmReset: 'もう一度押すと戻します',
  whatsNewTitle: '新しくなったこと',
  guideTitle: '好きな絵文字をキーで送れるようになりました',
  newFavorites: 'Shift + 1〜9：お気に入りの絵文字を送る',
  newHoldShift: 'Shift を押し続ける：お気に入りがバーの上に出る',
  newRightClick: '絵文字を右クリック：お気に入りに登録する',
  newPicker: '0：絵文字の一覧を開く（検索して Enter で送る）',
  gotIt: 'OK',
}

export const messages = { en, ja }

type Language = keyof typeof messages

function currentLanguage(): Language {
  const language = navigator.language.split('-')[0]
  return language in messages ? language as Language : 'en'
}

export function t(key: MessageKey, ...substitutions: string[]) {
  return messages[currentLanguage()][key].replace(/\$(\d)/g, (match, index) => substitutions[Number(index) - 1] ?? match)
}
