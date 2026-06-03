import { useCallback, useRef, useState } from 'react'

function cloneTodos(todos) {
  return todos.map((todo) => ({ ...todo }))
}

function todosEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useTodoUndo() {
  const [todos, setTodos] = useState([])
  const pastRef = useRef([])
  const futureRef = useRef([])

  const setTodosWithHistory = useCallback((updater) => {
    setTodos((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (todosEqual(prev, next)) return prev
      pastRef.current.push(cloneTodos(prev))
      if (pastRef.current.length > 100) pastRef.current.shift()
      futureRef.current = []
      return next
    })
  }, [])

  const replaceTodos = useCallback((next) => {
    pastRef.current = []
    futureRef.current = []
    setTodos(next)
  }, [])

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return false
    setTodos((prev) => {
      futureRef.current.push(cloneTodos(prev))
      return pastRef.current.pop()
    })
    return true
  }, [])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return false
    setTodos((prev) => {
      pastRef.current.push(cloneTodos(prev))
      return futureRef.current.pop()
    })
    return true
  }, [])

  return { todos, setTodosWithHistory, replaceTodos, undo, redo }
}
