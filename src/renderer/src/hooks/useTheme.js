import { useEffect, useState } from 'react'

const THEME_KEY = 'theme-preference'

function readPreference() {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function resolveTheme(preference, systemDark) {
  if (preference === 'system') return systemDark ? 'dark' : 'light'
  return preference
}

export function useTheme() {
  const [preference, setPreference] = useState(readPreference)
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    window.api.getSystemDark().then(setSystemDark)
    return window.api.onSystemThemeChange(setSystemDark)
  }, [])

  const resolved = resolveTheme(preference, systemDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
    window.api.setWindowBackground(resolved === 'dark')
  }, [resolved])

  function setTheme(next) {
    localStorage.setItem(THEME_KEY, next)
    setPreference(next)
  }

  return { preference, setTheme, resolved }
}
