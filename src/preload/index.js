import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  loadTodos: () => ipcRenderer.invoke('todos:load'),
  saveTodos: (todos) => ipcRenderer.invoke('todos:save', todos),
  getTodosPath: () => ipcRenderer.invoke('todos:path'),
  revealTodos: () => ipcRenderer.invoke('todos:reveal'),
  getSystemDark: () => ipcRenderer.invoke('theme:system-dark'),
  setWindowBackground: (isDark) => ipcRenderer.invoke('theme:window-bg', isDark),
  onSystemThemeChange: (callback) => {
    const handler = (_, isDark) => callback(isDark)
    ipcRenderer.on('theme:updated', handler)
    return () => ipcRenderer.removeListener('theme:updated', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
