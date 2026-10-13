import fs from 'fs-extra'
import { getManifest } from '../src/manifest'
import { messages } from '../src/logic/i18n'
import { log, r } from './utils'

export async function writeManifest() {
  await fs.writeJSON(r('extension/manifest.json'), await getManifest(), { spaces: 2 })
  log('PRE', 'write manifest.json')
}

export async function writeLocales() {
  for (const [language, entries] of Object.entries(messages)) {
    const json = Object.fromEntries(Object.entries(entries).map(([key, message]) => [key, { message }]))
    await fs.outputJSON(r(`extension/_locales/${language}/messages.json`), json, { spaces: 2 })
  }
  log('PRE', 'write _locales')
}

writeManifest()
writeLocales()
