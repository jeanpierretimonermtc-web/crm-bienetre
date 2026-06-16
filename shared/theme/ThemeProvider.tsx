import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightColors, darkColors, lightStatusColors, darkStatusColors, ThemeColors } from './colors'

const THEME_MODE_KEY = '@oryalis:themeMode'

type ThemeMode = 'light' | 'dark'

type ThemeCtx = {
  mode: ThemeMode
  colors: ThemeColors
  statusColors: Record<string, { bg: string; text: string }>
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeCtx>({
  mode: 'light',
  colors: lightColors,
  statusColors: lightStatusColors,
  toggleTheme: () => {},
  setMode: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY).then(val => {
      if (val === 'light' || val === 'dark') setModeState(val)
    })
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    AsyncStorage.setItem(THEME_MODE_KEY, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }, [mode, setMode])

  const value = useMemo<ThemeCtx>(() => ({
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    statusColors: mode === 'dark' ? darkStatusColors : lightStatusColors,
    toggleTheme,
    setMode,
  }), [mode, toggleTheme, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
