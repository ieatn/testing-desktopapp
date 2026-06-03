const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)

function formatKeys(accelerator) {
  const mod = IS_MAC ? '⌘' : 'Ctrl'
  const parts = accelerator.replace(/CmdOrCtrl/g, mod).split('+')
  const labels = []

  for (const part of parts) {
    switch (part) {
      case 'Shift':
        labels.push(IS_MAC ? '⇧' : 'Shift')
        break
      case 'Alt':
        labels.push(IS_MAC ? '⌥' : 'Alt')
        break
      case 'Backspace':
        labels.push(IS_MAC ? '⌫' : 'Backspace')
        break
      default:
        labels.push(part.length === 1 ? part.toUpperCase() : part)
    }
  }

  return labels
}

/** Todo-relevant shortcuts (matches File / Edit / Tasks menus + main process hooks). */
export const KEYBOARD_SHORTCUTS = [
  { label: 'New window', accelerator: 'CmdOrCtrl+T' },
  { label: 'Add sample tasks', accelerator: 'CmdOrCtrl+N' },
  { label: 'Show todos in Finder', accelerator: 'CmdOrCtrl+Shift+R' },
  { label: 'Undo', accelerator: 'CmdOrCtrl+Z' },
  { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z' },
  { label: 'Clear completed', accelerator: 'CmdOrCtrl+Shift+Backspace' }
]

export function shortcutKeyLabels(accelerator) {
  return formatKeys(accelerator)
}
