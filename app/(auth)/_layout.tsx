import { Stack, Redirect, usePathname } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'

export default function AuthLayout() {
  const { session, loading } = useAuth()
  const pathname = usePathname()

  if (loading) return null
  // Allow /onboarding even when authenticated (redirect from (app) layout)
  if (session && pathname !== '/onboarding') return <Redirect href="/(app)" />

  return <Stack screenOptions={{ headerShown: false }} />
}
