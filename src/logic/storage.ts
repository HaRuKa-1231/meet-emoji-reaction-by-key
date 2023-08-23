import { useStorageLocal } from '~/composables/useStorageLocal'

export const isExtensionOn = useStorageLocal('isExtensionOn', true)
