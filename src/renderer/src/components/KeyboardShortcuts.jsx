import { KEYBOARD_SHORTCUTS, shortcutKeyLabels } from '../keyboardShortcuts'

export default function KeyboardShortcuts() {
  return (
    <section className="keyboard-shortcuts" aria-labelledby="keyboard-shortcuts-heading">
      <h2 id="keyboard-shortcuts-heading" className="keyboard-shortcuts-heading">
        Keyboard shortcuts
      </h2>
      <ul className="keyboard-shortcuts-list">
        {KEYBOARD_SHORTCUTS.map(({ label, accelerator }) => (
          <li key={accelerator} className="keyboard-shortcuts-row">
            <span className="keyboard-shortcuts-label">{label}</span>
            <span className="keyboard-shortcuts-keys" aria-label={`Shortcut: ${label}`}>
              {shortcutKeyLabels(accelerator).map((key, index) => (
                <kbd key={`${accelerator}-${index}`}>{key}</kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
