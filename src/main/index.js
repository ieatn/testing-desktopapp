import { app, shell, BrowserWindow, ipcMain, nativeTheme, screen } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { APP_NAME, createMenuHandlers, setApplicationMenu } from './menu.js'

if (process.platform === 'darwin') {
  app.setName(APP_NAME)
  app.on('will-finish-launching', () => {
    app.setName(APP_NAME)
  })
  app.setAboutPanelOptions({
    applicationName: APP_NAME,
    applicationVersion: app.getVersion()
  })
}

const TODOS_FILENAME = 'todos.json'
const SETTINGS_FILENAME = 'settings.json'

const DEFAULT_WINDOW = {
  width: 520,
  height: 640,
  isMaximized: false
}

const DEFAULT_SETTINGS = {
  theme: 'system',
  window: DEFAULT_WINDOW
}

function getTodosPath() {
  return join(app.getPath('documents'), TODOS_FILENAME)
}

function getSettingsPath() {
  return join(app.getPath('userData'), SETTINGS_FILENAME)
}

async function loadSettings() {
  try {
    return parseSettings(await readFile(getSettingsPath(), 'utf-8'))
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Failed to load settings:', error)
    return structuredClone(DEFAULT_SETTINGS)
  }
}

function loadSettingsSync() {
  try {
    return parseSettings(readFileSync(getSettingsPath(), 'utf-8'))
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Failed to load settings:', error)
    return structuredClone(DEFAULT_SETTINGS)
  }
}

function parseSettings(raw) {
  try {
    const parsed = JSON.parse(raw)
    return {
      theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
      window: { ...DEFAULT_WINDOW, ...parsed.window }
    }
  } catch (error) {
    console.error('Failed to parse settings:', error)
    return structuredClone(DEFAULT_SETTINGS)
  }
}

async function saveSettings(settings) {
  await writeFile(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

function saveSettingsSync(settings) {
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

function resolveThemeDark(preference) {
  if (preference === 'light') return false
  if (preference === 'dark') return true
  return nativeTheme.shouldUseDarkColors
}

function windowBackground(isDark) {
  return isDark ? '#1c1c1e' : '#f5f5f7'
}

const WINDOW_GAP = 16

function fitsInWorkArea(bounds, area) {
  return (
    bounds.x >= area.x &&
    bounds.y >= area.y &&
    bounds.x + bounds.width <= area.x + area.width &&
    bounds.y + bounds.height <= area.y + area.height
  )
}

function placeNewWindowBeside(sourceBounds) {
  const width = Math.max(400, sourceBounds.width ?? DEFAULT_WINDOW.width)
  const height = Math.max(480, sourceBounds.height ?? DEFAULT_WINDOW.height)
  const display = screen.getDisplayMatchingRect(sourceBounds)
  const area = display.workArea

  const candidates = [
    { x: sourceBounds.x + sourceBounds.width + WINDOW_GAP, y: sourceBounds.y },
    { x: sourceBounds.x - width - WINDOW_GAP, y: sourceBounds.y },
    { x: sourceBounds.x, y: sourceBounds.y + sourceBounds.height + WINDOW_GAP },
    { x: sourceBounds.x, y: sourceBounds.y - height - WINDOW_GAP }
  ]

  for (const position of candidates) {
    const candidate = { width, height, x: position.x, y: position.y }
    if (fitsInWorkArea(candidate, area)) return candidate
  }

  return ensureOnScreen({
    width,
    height,
    x: Math.min(
      sourceBounds.x + sourceBounds.width + WINDOW_GAP,
      area.x + area.width - width
    ),
    y: Math.max(area.y, Math.min(sourceBounds.y, area.y + area.height - height))
  })
}

function ensureOnScreen(bounds) {
  const width = Math.max(400, bounds.width ?? DEFAULT_WINDOW.width)
  const height = Math.max(480, bounds.height ?? DEFAULT_WINDOW.height)
  const { x, y } = bounds

  if (typeof x !== 'number' || typeof y !== 'number') {
    return { width, height }
  }

  const visible = screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return (
      x < area.x + area.width &&
      x + width > area.x &&
      y < area.y + area.height &&
      y + height > area.y
    )
  })

  return visible ? { width, height, x, y } : { width, height }
}

function captureWindowState(window) {
  const isMaximized = window.isMaximized()
  const bounds = isMaximized ? window.getNormalBounds() : window.getBounds()
  return ensureOnScreen({ ...bounds, isMaximized })
}

function persistWindowState(window) {
  if (!window || window.isDestroyed()) return

  try {
    const settings = loadSettingsSync()
    settings.window = captureWindowState(window)
    saveSettingsSync(settings)
  } catch (error) {
    console.error('Failed to save window state:', error)
  }
}

function countRemainingTodos(todos) {
  if (!Array.isArray(todos)) return 0
  return todos.filter((todo) => !todo.done).length
}

function registerTodoKeyboardShortcuts(window) {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return

    const mod = input.meta || input.control
    if (!mod) return

    const key = input.key.toLowerCase()

    if (key === 't') {
      event.preventDefault()
      createWindow({ restoreState: false })
      return
    }

    if (key === 'n') {
      event.preventDefault()
      window.webContents.send('menu:command', 'add-command-n-tasks')
      return
    }

    if (key === 'z' && input.shift) {
      event.preventDefault()
      window.webContents.send('menu:command', 'redo')
      return
    }

    if (key === 'z') {
      event.preventDefault()
      window.webContents.send('menu:command', 'undo')
    }
  })
}

function updateDockBadge(remainingCount) {
  if (process.platform === 'darwin') {
    if (!app.dock) return
    app.dock.setBadge(remainingCount > 0 ? String(remainingCount) : '')
    return
  }

  if (process.platform === 'win32' || process.platform === 'linux') {
    app.setBadgeCount(remainingCount > 0 ? remainingCount : 0)
  }
}

async function createWindow({ restoreState = true } = {}) {
  const settings = await loadSettings()
  const isDark = resolveThemeDark(settings.theme)
  const { isMaximized, ...savedBounds } = settings.window

  const openBeside = !restoreState
  let bounds = savedBounds
  if (openBeside) {
    const source = BrowserWindow.getFocusedWindow()
    if (source && !source.isDestroyed()) {
      bounds = placeNewWindowBeside(source.getBounds())
    } else {
      bounds = ensureOnScreen(savedBounds)
    }
  }

  const window = new BrowserWindow({
    ...bounds,
    minWidth: 400,
    minHeight: 480,
    show: false,
    autoHideMenuBar: process.platform !== 'darwin',
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 16, y: 18 } }
      : {}),
    ...(process.platform === 'linux' ? { icon } : {}),
    backgroundColor: windowBackground(isDark),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (restoreState && isMaximized) {
    window.maximize()
  }

  window.on('close', () => {
    persistWindowState(window)
  })

  window.on('ready-to-show', () => {
    if (openBeside) {
      window.showInactive()
    } else {
      window.show()
    }
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    registerTodoKeyboardShortcuts(window)
  })

  ipcMain.handle('todos:load', async () => {
    try {
      const data = await readFile(getTodosPath(), 'utf-8')
      const parsed = JSON.parse(data)
      const todos = Array.isArray(parsed) ? parsed : []
      updateDockBadge(countRemainingTodos(todos))
      return todos
    } catch (error) {
      if (error.code === 'ENOENT') {
        updateDockBadge(0)
        return []
      }
      throw error
    }
  })

  ipcMain.handle('todos:save', async (_, todos) => {
    await writeFile(getTodosPath(), JSON.stringify(todos, null, 2), 'utf-8')
    updateDockBadge(countRemainingTodos(todos))
  })

  ipcMain.handle('todos:path', () => getTodosPath())

  ipcMain.handle('todos:reveal', async () => {
    const todosPath = getTodosPath()
    try {
      await readFile(todosPath)
      shell.showItemInFolder(todosPath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        await shell.openPath(app.getPath('documents'))
      } else {
        throw error
      }
    }
  })

  ipcMain.handle('theme:system-dark', () => nativeTheme.shouldUseDarkColors)

  ipcMain.handle('settings:get-theme', async () => {
    const settings = await loadSettings()
    return settings.theme
  })

  async function applyThemePreference(theme) {
    if (theme !== 'light' && theme !== 'dark' && theme !== 'system') return

    const settings = await loadSettings()
    settings.theme = theme
    await saveSettings(settings)
    await broadcastTheme()
    refreshApplicationMenu()
  }

  ipcMain.handle('settings:set-theme', async (_, theme) => {
    await applyThemePreference(theme)
  })

  function refreshApplicationMenu() {
    const settings = loadSettingsSync()
    setApplicationMenu({
      theme: settings.theme,
      ...createMenuHandlers({
        revealTodos: async () => {
          const todosPath = getTodosPath()
          try {
            await readFile(todosPath)
            shell.showItemInFolder(todosPath)
          } catch (error) {
            if (error.code === 'ENOENT') {
              await shell.openPath(app.getPath('documents'))
            } else {
              throw error
            }
          }
        },
        setTheme: applyThemePreference,
        createNewWindow: () => createWindow({ restoreState: false })
      })
    })
  }

  ipcMain.handle('theme:window-bg', (event, isDark) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.setBackgroundColor(windowBackground(isDark))
  })

  async function broadcastTheme() {
    const settings = await loadSettings()
    const isDark = resolveThemeDark(settings.theme)

    BrowserWindow.getAllWindows().forEach((window) => {
      window.setBackgroundColor(windowBackground(isDark))
      window.webContents.send('theme:updated', nativeTheme.shouldUseDarkColors)
      window.webContents.send('theme:preference-updated', settings.theme)
    })
  }

  nativeTheme.on('updated', broadcastTheme)

  refreshApplicationMenu()

  app.on('before-quit', () => {
    const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    persistWindowState(window)
  })

  await createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
