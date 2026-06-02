import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../hooks/useTheme'

const LEGACY_STORAGE_KEY = 'todos'

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TodoApp() {
  const { preference, setTheme } = useTheme()
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function load() {
      let loaded = await window.api.loadTodos()

      if (loaded.length === 0) {
        try {
          const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
          if (raw) {
            loaded = JSON.parse(raw)
            localStorage.removeItem(LEGACY_STORAGE_KEY)
          }
        } catch {
          loaded = []
        }
      }

      setTodos(loaded)
      setReady(true)
    }

    load()
  }, [])

  useEffect(() => {
    if (!ready) return
    window.api.saveTodos(todos)
  }, [todos, ready])

  function addTodo(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: trimmed, done: false }])
    setText('')
  }

  function toggleTodo(id) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function removeTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.done))
  }

  const remaining = todos.filter((t) => !t.done).length
  const completedCount = todos.length - remaining

  if (!ready) {
    return (
      <div className="app-frame">
        <div className="titlebar-drag" aria-hidden="true" />
        <div className="app-shell">
          <p className="app-loading">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-frame">
      <div className="titlebar-drag" aria-hidden="true" />
      <div className="app-shell">
      <header className="app-toolbar">
        <div className="app-title-block">
          <h1>Todos</h1>
          <p>
            {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining
          </p>
        </div>
        <ThemeToggle preference={preference} onChange={setTheme} />
      </header>

      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
          autoFocus
        />
        <button type="submit">Add</button>
      </form>

      {todos.length > 0 ? (
        <>
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className={todo.done ? 'done' : ''}>
                <label className="todo-check">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label={`Mark "${todo.text}" as ${todo.done ? 'incomplete' : 'complete'}`}
                  />
                  <span className="checkmark">
                    <CheckIcon />
                  </span>
                  <span className="todo-text">{todo.text}</span>
                </label>
                <button
                  type="button"
                  className="todo-delete"
                  onClick={() => removeTodo(todo.id)}
                  aria-label={`Delete "${todo.text}"`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <footer className="app-footer">
            <span>Saved to Documents</span>
            <div className="footer-actions">
              {completedCount > 0 && (
                <button type="button" className="text-button" onClick={clearCompleted}>
                  Clear completed
                </button>
              )}
              <button type="button" className="text-button" onClick={() => window.api.revealTodos()}>
                Show in Finder
              </button>
            </div>
          </footer>
        </>
      ) : (
        <p className="todo-empty-panel">No tasks yet. Add one above.</p>
      )}
      </div>
    </div>
  )
}
