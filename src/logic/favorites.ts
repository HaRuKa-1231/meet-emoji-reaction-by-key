export type Shortcuts = Record<number, string>

export const SHORTCUT_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const DEFAULT_SHORTCUTS: Shortcuts = {
  1: '🙏',
  2: '👀',
  3: '🔥',
  4: '🙇',
  5: '💯',
  6: '🙌',
  7: '✅',
  8: '🤝',
  9: '🚀',
}

export function toEmoji(value: string) {
  const [first] = new Intl.Segmenter().segment(value.trim())
  return first?.segment ?? ''
}

export function isSameEmoji(a: string | undefined, b: string | undefined) {
  const strip = (emoji = '') => emoji.replace(/\uFE0F/g, '')
  return !!a && !!b && strip(a) === strip(b)
}

export function assignFavorite(shortcuts: Shortcuts, key: number, emoji: string): Shortcuts {
  const next = { ...shortcuts }
  const duplicateKey = SHORTCUT_KEYS.find(other => other !== key && isSameEmoji(next[other], emoji))
  if (duplicateKey)
    next[duplicateKey] = next[key] ?? ''
  next[key] = emoji
  return next
}

export function moveFavorite(shortcuts: Shortcuts, key: number, direction: -1 | 1): Shortcuts {
  const target = key + direction
  if (!SHORTCUT_KEYS.includes(target))
    return shortcuts
  return { ...shortcuts, [key]: shortcuts[target] ?? '', [target]: shortcuts[key] ?? '' }
}
