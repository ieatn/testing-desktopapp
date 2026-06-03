import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { platform } from 'os'

const APP_NAME = 'todoapp'

if (platform() !== 'darwin') {
  process.exit(0)
}

const plistPath = join(
  process.cwd(),
  'node_modules/electron/dist/Electron.app/Contents/Info.plist'
)

if (!existsSync(plistPath)) {
  console.warn('[set-electron-app-name] Electron Info.plist not found, skipping.')
  process.exit(0)
}

let plist = readFileSync(plistPath, 'utf8')

if (plist.includes(`<string>${APP_NAME}</string>`) && !plist.includes('<string>Electron</string>')) {
  process.exit(0)
}

plist = plist.replace(
  /(<key>CFBundleDisplayName<\/key>\s*<string>)([^<]*)(<\/string>)/,
  `$1${APP_NAME}$3`
)
plist = plist.replace(
  /(<key>CFBundleName<\/key>\s*<string>)([^<]*)(<\/string>)/,
  `$1${APP_NAME}$3`
)

writeFileSync(plistPath, plist)
console.log(`[set-electron-app-name] macOS menu bar name set to "${APP_NAME}" for dev.`)
