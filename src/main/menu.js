import { Menu, shell, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

export const APP_NAME = 'todoapp'

function themeMenuItems(currentTheme, onSetTheme) {
  return ['light', 'dark', 'system'].map((theme) => ({
    label: theme.charAt(0).toUpperCase() + theme.slice(1),
    type: 'radio',
    checked: currentTheme === theme,
    click: () => onSetTheme(theme)
  }))
}

function sendToFocusedWindow(channel, payload) {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  window?.webContents.send(channel, payload)
}

export function buildApplicationMenu(handlers) {
  const {
    theme,
    revealTodos,
    setTheme,
    clearCompleted,
    addCommandNTasks,
    createNewWindow,
    undo,
    redo
  } = handlers
  const isMac = process.platform === 'darwin'

  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: 'about', label: `About ${APP_NAME}` },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: `Hide ${APP_NAME}` },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit', label: `Quit ${APP_NAME}`, accelerator: 'CmdOrCtrl+Q' }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+T',
          click: createNewWindow
        },
        {
          label: 'Add 3 “command n” Tasks',
          accelerator: 'CmdOrCtrl+N',
          click: addCommandNTasks
        },
        { type: 'separator' },
        {
          label: isMac ? 'Show Todos in Finder' : 'Show Todos in File Manager',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: revealTodos
        },
        { type: 'separator' },
        isMac
          ? { role: 'close', accelerator: 'CmdOrCtrl+W' }
          : { role: 'quit', accelerator: 'CmdOrCtrl+Q' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: undo
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: redo
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Tasks',
      submenu: [
        {
          label: 'Clear Completed',
          accelerator: 'CmdOrCtrl+Shift+Backspace',
          click: clearCompleted
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Appearance',
          submenu: themeMenuItems(theme, setTheme)
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(is.dev
          ? [
              { type: 'separator' },
              { role: 'reload' },
              { role: 'forceReload' },
              { role: 'toggleDevTools' }
            ]
          : [])
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [{ role: 'zoom' }, { type: 'separator' }, { role: 'front' }] : [{ role: 'close' }])
      ]
    },
    {
      label: 'New Tab',
      submenu: [
        {
          label: 'Focus New Task',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: addCommandNTasks
        },
        {
          label: 'Clear Completed',
          click: clearCompleted
        }
      ]
    },
    {
      label: 'Pokemon',
      submenu: [
        {
          label: 'Gotta catch em all',
          click: () => shell.openExternal('https://www.pokemon.com/us/')
        }
      ]
    },
    {
      label: 'Arcade',
      submenu: [
        {
          label: 'Play Snake',
          click: () => shell.openExternal('https://snake.googlemaps.com/')
        },
        {
          label: '2048',
          click: () => shell.openExternal('https://play2048.co/')
        }
      ]
    },
    {
      label: 'Snacks',
      submenu: [
        { label: 'Pretzel', enabled: false },
        { label: 'Popcorn', enabled: false },
        { label: 'Nachos', enabled: false }
      ]
    },
    {
      label: 'Music',
      submenu: [
        {
          label: 'Open Spotify',
          click: () => shell.openExternal('https://open.spotify.com/')
        },
        {
          label: 'Open Apple Music',
          click: () => shell.openExternal('https://music.apple.com/')
        }
      ]
    },
    {
      label: 'Stats',
      submenu: [
        {
          label: 'New Task',
          accelerator: 'CmdOrCtrl+Alt+N',
          click: addCommandNTasks
        },
        {
          label: 'Show Todos in Finder',
          click: revealTodos
        },
        { type: 'separator' },
        {
          label: 'Clear Completed',
          click: clearCompleted
        }
      ]
    },
    {
      label: 'Space',
      submenu: [
        {
          label: 'NASA Picture of the Day',
          click: () => shell.openExternal('https://apod.nasa.gov/apod/astropix.html')
        },
        {
          label: 'Mars weather',
          click: () => shell.openExternal('https://mars.nasa.gov/')
        }
      ]
    },
    {
      label: 'Coffee',
      submenu: [
        { label: 'Espresso', enabled: false },
        { label: 'Latte', enabled: false },
        { label: 'Cold brew', enabled: false }
      ]
    },
    {
      label: 'Pets',
      submenu: [
        {
          label: 'Dogs subreddit',
          click: () => shell.openExternal('https://www.reddit.com/r/dogs/')
        },
        {
          label: 'Cats subreddit',
          click: () => shell.openExternal('https://www.reddit.com/r/cats/')
        }
      ]
    },
    {
      label: 'Weather',
      submenu: [
        {
          label: 'Weather.com',
          click: () => shell.openExternal('https://weather.com/')
        }
      ]
    },
    {
      label: 'Maps',
      submenu: [
        {
          label: 'Open Google Maps',
          click: () => shell.openExternal('https://www.google.com/maps')
        }
      ]
    },
    {
      label: 'Books',
      submenu: [
        {
          label: 'Project Gutenberg',
          click: () => shell.openExternal('https://www.gutenberg.org/')
        },
        {
          label: 'Open Library',
          click: () => shell.openExternal('https://openlibrary.org/')
        }
      ]
    },
    {
      label: 'Fitness',
      submenu: [
        { label: 'Stretch break', enabled: false },
        { label: 'Walk 5 min', enabled: false },
        { label: 'Hydrate', enabled: false }
      ]
    },
    {
      label: 'Shop',
      submenu: [
        {
          label: 'Amazon',
          click: () => shell.openExternal('https://www.amazon.com/')
        },
        {
          label: 'eBay',
          click: () => shell.openExternal('https://www.ebay.com/')
        }
      ]
    },
    {
      label: 'Dev',
      submenu: [
        {
          label: 'GitHub',
          click: () => shell.openExternal('https://github.com/')
        },
        {
          label: 'Stack Overflow',
          click: () => shell.openExternal('https://stackoverflow.com/')
        },
        ...(is.dev
          ? [
              { type: 'separator' },
              { role: 'toggleDevTools' },
              { role: 'reload' }
            ]
          : [])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://electron-vite.org')
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

export function setApplicationMenu(handlers) {
  Menu.setApplicationMenu(buildApplicationMenu(handlers))
}

export function createMenuHandlers({ revealTodos, setTheme, createNewWindow }) {
  return {
    revealTodos,
    setTheme,
    createNewWindow,
    clearCompleted: () => sendToFocusedWindow('menu:command', 'clear-completed'),
    addCommandNTasks: () => sendToFocusedWindow('menu:command', 'add-command-n-tasks'),
    undo: () => sendToFocusedWindow('menu:command', 'undo'),
    redo: () => sendToFocusedWindow('menu:command', 'redo')
  }
}
