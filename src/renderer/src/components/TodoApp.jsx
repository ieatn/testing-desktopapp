import { useEffect, useState } from 'react'

const LEGACY_STORAGE_KEY = 'todos'

export default function TodoApp() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)
  const [filePath, setFilePath] = useState('')

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
      setFilePath(await window.api.getTodosPath())
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
      <div className="todo-app">
        <p className="todo-empty">Loading…</p>
      </div>
    )
  }

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>Todos</h1>
        <p className="todo-subtitle">Saved to your Documents folder</p>
        <button type="button" className="todo-path" onClick={() => window.api.revealTodos()}>
          {filePath}
        </button>
      </header>

      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New todo"
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

          <footer className="todo-footer">
            <span>
              {remaining} {remaining === 1 ? 'item' : 'items'} left
            </span>
            {completedCount > 0 && (
              <button type="button" className="todo-clear" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </footer>
        </>
      ) : (
        <p className="todo-empty">No todos yet. Add one above.</p>
      )}
    </div>
  )
}
