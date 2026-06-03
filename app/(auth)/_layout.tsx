import { Stack, Redirect } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'

export default function AuthLayout() {
  const { session, loading } = useAuth()

  if (loading) return null
  if (session) return <Redirect href="/(app)/" />

  return <Stack screenOptions={{ headerShown: false }} />
}
