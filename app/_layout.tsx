import '@/shared/i18n'
import { useState } from 'react'
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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })
  const [splashDone, setSplashDone] = useState(false)

  return (
    <ThemeProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          {fontsLoaded && <Slot />}
          {!splashDone && <SplashAnimated onDone={() => setSplashDone(true)} />}
        </View>
      </AuthProvider>
    </ThemeProvider>
  )
}
