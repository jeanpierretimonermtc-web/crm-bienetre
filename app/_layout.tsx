import '@/shared/i18n'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Slot } from 'expo-router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { SplashAnimated } from '@/shared/components/ui/SplashAnimated'
import { useFonts } from 'expo-font'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'

export default function RootLayout() {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setSplashDone(true), 3000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <Slot />
          {!splashDone && <SplashAnimated onDone={() => setSplashDone(true)} />}
        </View>
      </AuthProvider>
    </ThemeProvider>
  )
}
