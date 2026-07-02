import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface PreferencesContextType {
  language: string
  theme: 'light' | 'dark' | 'system'
  setLanguage: (lang: string) => Promise<void>
  setTheme: (t: 'light' | 'dark' | 'system') => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | null>(null)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState('en')
  const [theme, setThemeState] = useState<'light'|'dark'|'system'>('system')

  useEffect(() => {
    (async () => {
      try {
        const [lang, th] = await Promise.all([
          AsyncStorage.getItem('language'),
          AsyncStorage.getItem('theme'),
        ])
        if (lang) setLangState(lang)
        if (th) setThemeState(th as 'light'|'dark'|'system')
      } catch { /* use defaults */ }
    })()
  }, [])

  const setLanguage = useCallback(async (lang: string) => {
    setLangState(lang); await AsyncStorage.setItem('language', lang)
  }, [])

  const setTheme = useCallback(async (t: 'light'|'dark'|'system') => {
    setThemeState(t); await AsyncStorage.setItem('theme', t)
  }, [])

  const value = useMemo<PreferencesContextType>(() => ({
    language, theme, setLanguage, setTheme,
  }), [language, theme, setLanguage, setTheme])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextType {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
