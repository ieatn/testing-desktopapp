import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  loadTodos: () => ipcRenderer.invoke('todos:load'),
  saveTodos: (todos) => ipcRenderer.invoke('todos:save', todos),
  getTodosPath: () => ipcRenderer.invoke('todos:path'),
  revealTodos: () => ipcRenderer.invoke('todos:reveal'),
  getSystemDark: () => ipcRenderer.invoke('theme:system-dark'),
  getThemePreference: () => ipcRenderer.invoke('settings:get-theme'),
  setThemePreference: (theme) => ipcRenderer.invoke('settings:set-theme', theme),
  setWindowBackground: (isDark) => ipcRenderer.invoke('theme:window-bg', isDark),
  onSystemThemeChange: (callback) => {
    const handler = (_, isDark) => callback(isDark)
    ipcRenderer.on('theme:updated', handler)
    return () => ipcRenderer.removeListener('theme:updated', handler)
  },
  onThemePreferenceChange: (callback) => {
    const handler = (_, theme) => callback(theme)
    ipcRenderer.on('theme:preference-updated', handler)
    return () => ipcRenderer.removeListener('theme:preference-updated', handler)
  },
  onMenuCommand: (callback) => {
    const handler = (_, command) => callback(command)
    ipcRenderer.on('menu:command', handler)
    return () => ipcRenderer.removeListener('menu:command', handler)
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
