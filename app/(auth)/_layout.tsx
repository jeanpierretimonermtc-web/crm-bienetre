import { Stack, Redirect, usePathname } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/shared/theme/ThemeProvider'

export default function AuthLayout() {
  const { session, loading } = useAuth()
  const { colors } = useTheme()
  const pathname = usePathname()

  if (loading) return (
    <View style={[styles.loader, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )
  // Allow /onboarding even when authenticated (redirect from (app) layout)
  if (session && pathname !== '/onboarding') return <Redirect href="/(app)" />

  return <Stack screenOptions={{ headerShown: false }} />
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
