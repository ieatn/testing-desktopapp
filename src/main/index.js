import { app, shell, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const TODOS_FILENAME = 'todos.json'

function getTodosPath() {
  return join(app.getPath('documents'), TODOS_FILENAME)
}

function windowBackground(isDark) {
  return isDark ? '#1c1c1e' : '#f5f5f7'
}

function createWindow() {
  const isDark = nativeTheme.shouldUseDarkColors

  const mainWindow = new BrowserWindow({
    width: 520,
    height: 640,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('todos:load', async () => {
    try {
      const data = await readFile(getTodosPath(), 'utf-8')
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
  })

  ipcMain.handle('todos:save', async (_, todos) => {
    await writeFile(getTodosPath(), JSON.stringify(todos, null, 2), 'utf-8')
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

  ipcMain.handle('theme:window-bg', (event, isDark) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.setBackgroundColor(windowBackground(isDark))
  })

  function broadcastTheme() {
    const isDark = nativeTheme.shouldUseDarkColors
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setBackgroundColor(windowBackground(isDark))
      window.webContents.send('theme:updated', isDark)
    })
  }

  nativeTheme.on('updated', broadcastTheme)

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
