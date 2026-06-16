import { Stack } from 'expo-router'
import { useTheme } from '@/shared/theme/ThemeProvider'

export default function FollowupsLayout() {
  const { colors } = useTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  )
}
