import { afterEach, describe, expect, it, vi } from 'vitest'
import { messages, t } from '../i18n'

function useLanguage(language: string) {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
}

describe('i18n', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('英語と日本語で同じ文言がそろっている', () => {
    expect(Object.keys(messages.ja).sort()).toEqual(Object.keys(messages.en).sort())
  })

  it('ブラウザが英語なら英語で出す', () => {
    useLanguage('en-US')

    expect(t('undo')).toBe('Undo')
  })

  it('ブラウザが日本語なら日本語で出す', () => {
    useLanguage('ja')

    expect(t('undo')).toBe('元に戻す')
  })

  it('用意していない言語なら英語で出す', () => {
    useLanguage('fr-FR')

    expect(t('undo')).toBe('Undo')
  })

  it('$1や$2を渡した値に置き換える', () => {
    useLanguage('en-US')

    expect(t('sendFavorite', '🔥', '3')).toBe('Send 🔥 (Shift + 3)')
  })
})
