import browser from 'webextension-polyfill'
import { handleInstalled, refreshBadge } from '~/logic/whats-new'

browser.runtime.onInstalled.addListener(handleInstalled)
browser.runtime.onStartup.addListener(refreshBadge)
