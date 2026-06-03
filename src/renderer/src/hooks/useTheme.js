import { useEffect, useState } from 'react'

const LEGACY_THEME_KEY = 'theme-preference'

function isThemePreference(value) {
  return value === 'light' || value === 'dark' || value === 'system'
}

function resolveTheme(preference, systemDark) {
  if (preference === 'system') return systemDark ? 'dark' : 'light'
  return preference
}

export function useTheme() {
  const [preference, setPreference] = useState('system')
  const [ready, setReady] = useState(false)
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    async function loadPreference() {
      let stored = await window.api.getThemePreference()

      const legacy = localStorage.getItem(LEGACY_THEME_KEY)
      if (isThemePreference(legacy) && stored === 'system' && legacy !== 'system') {
        stored = legacy
        await window.api.setThemePreference(legacy)
      }

      if (isThemePreference(stored)) {
        setPreference(stored)
      }

      setReady(true)
    }

    loadPreference()
    window.api.getSystemDark().then(setSystemDark)
    const removeSystemListener = window.api.onSystemThemeChange(setSystemDark)
    const removePreferenceListener = window.api.onThemePreferenceChange((theme) => {
      if (isThemePreference(theme)) {
        setPreference(theme)
        localStorage.setItem(LEGACY_THEME_KEY, theme)
      }
    })

    return () => {
      removeSystemListener()
      removePreferenceListener()
    }
  }, [])

  const resolved = resolveTheme(preference, systemDark)

  useEffect(() => {
    if (!ready) return

    document.documentElement.setAttribute('data-theme', resolved)
    window.api.setWindowBackground(resolved === 'dark')
  }, [resolved, ready])

  async function setTheme(next) {
    if (!isThemePreference(next)) return

    localStorage.setItem(LEGACY_THEME_KEY, next)
    await window.api.setThemePreference(next)
    setPreference(next)
  }

  return { preference, setTheme }
}
