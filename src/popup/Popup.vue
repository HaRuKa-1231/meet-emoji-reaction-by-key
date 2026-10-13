<script setup lang="ts">
import type { Shortcuts } from '~/logic/shortcuts'
import { DEFAULT_SHORTCUTS, SHORTCUT_KEYS, assignFavorite, loadShortcuts, moveFavorite, saveShortcuts, toEmoji } from '~/logic/shortcuts'
import type { MessageKey } from '~/logic/i18n'
import { t } from '~/logic/i18n'
import { hasUnseenWhatsNew, markWhatsNewSeen } from '~/logic/whats-new'

const shortcuts = ref<Shortcuts>({ ...DEFAULT_SHORTCUTS })
const previous = ref<Shortcuts | null>(null)
const confirmingReset = ref(false)
const showWhatsNew = ref(false)
const WHATS_NEW_LINES: MessageKey[] = ['newFavorites', 'newHoldShift', 'newRightClick', 'newPicker']

onMounted(async () => {
  shortcuts.value = await loadShortcuts()
  if (await hasUnseenWhatsNew()) {
    showWhatsNew.value = true
    markWhatsNewSeen()
  }
})

function commit(next: Shortcuts) {
  previous.value = shortcuts.value
  shortcuts.value = next
  confirmingReset.value = false
  saveShortcuts(next)
}

function updateShortcut(key: number, event: Event) {
  const input = event.target as HTMLInputElement
  const emoji = toEmoji(input.value)
  input.value = emoji
  commit(emoji ? assignFavorite(shortcuts.value, key, emoji) : { ...shortcuts.value, [key]: '' })
}

function move(key: number, direction: -1 | 1) {
  commit(moveFavorite(shortcuts.value, key, direction))
}

function clear(key: number) {
  commit({ ...shortcuts.value, [key]: '' })
}

function undo() {
  if (!previous.value)
    return
  const restored = previous.value
  previous.value = null
  shortcuts.value = restored
  saveShortcuts(restored)
}

function reset() {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    return
  }
  commit({ ...DEFAULT_SHORTCUTS })
}
</script>

<template>
  <main class="w-[360px] px-4 py-4 text-gray-700 space-y-4">
    <section v-if="showWhatsNew" data-test="whats-new" class="rounded-lg bg-blue-50 px-3 py-2 text-xs">
      <h2 class="font-bold text-blue-700 mb-1">
        {{ t('whatsNewTitle') }}
      </h2>
      <ul class="list-disc pl-4 space-y-1">
        <li v-for="line in WHATS_NEW_LINES" :key="line">
          {{ t(line) }}
        </li>
      </ul>
    </section>
    <div class="flex items-center space-x-3">
      <Logo class="w-[40px] h-[40px] shrink-0" />
      <ul class="text-xs space-y-1">
        <li><b>1-9</b>: {{ t('helpBar') }}</li>
        <li><b>0</b>: {{ t('helpPicker') }}</li>
        <li><b>Shift + 1-9</b>: {{ t('helpFavorites') }}</li>
      </ul>
    </div>
    <section>
      <h2 class="font-bold mb-1">
        {{ t('favorites') }}
      </h2>
      <p class="text-xs text-gray-500 mb-2">
        {{ t('favoritesHint') }}
      </p>
      <ol class="space-y-1">
        <li v-for="key in SHORTCUT_KEYS" :key="key" class="flex items-center space-x-2">
          <span class="text-xs text-gray-500 w-14">Shift + {{ key }}</span>
          <input
            :value="shortcuts[key]"
            :aria-label="t('emojiFor', `${key}`)"
            class="w-12 border rounded text-center text-xl"
            @change="updateShortcut(key, $event)"
          >
          <button :data-test="`move-up-${key}`" :disabled="key === 1" class="px-1 disabled:opacity-30" :aria-label="t('moveUp', `${key}`)" @click="move(key, -1)">
            ↑
          </button>
          <button :data-test="`move-down-${key}`" :disabled="key === 9" class="px-1 disabled:opacity-30" :aria-label="t('moveDown', `${key}`)" @click="move(key, 1)">
            ↓
          </button>
          <button :data-test="`clear-${key}`" class="px-1 text-gray-400" :aria-label="t('clear', `${key}`)" @click="clear(key)">
            ×
          </button>
        </li>
      </ol>
      <div class="flex justify-between mt-3 text-xs">
        <button data-test="undo" :disabled="!previous" class="underline disabled:opacity-30" @click="undo">
          {{ t('undoLastChange') }}
        </button>
        <button data-test="reset" class="underline" :class="{ 'text-red-600': confirmingReset }" @click="reset">
          {{ confirmingReset ? t('confirmReset') : t('resetToDefaults') }}
        </button>
      </div>
    </section>
  </main>
</template>
