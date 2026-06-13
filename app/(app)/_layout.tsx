import { Tabs, Redirect, usePathname, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { colors } from '@/shared/theme/colors'

const SIDEBAR_BREAKPOINT = 768

const NAV_ITEMS = [
  { segment: '',             icon: '🏠', labelKey: 'dashboard.title'    },
  { segment: 'clients',      icon: '👥', labelKey: 'clients.title'      },
  { segment: 'appointments', icon: '📅', labelKey: 'appointments.title' },
  { segment: 'followups',    icon: '🔔', labelKey: 'followups.title'    },
]

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

function Sidebar({ pathname }: { pathname: string }) {
  const { t } = useTranslation()
  const { session } = useAuth()

  function isActive(segment: string) {
    if (segment === '') return pathname === '/'
    return pathname === '/' + segment || pathname.startsWith('/' + segment + '/')
  }

  function navigate(segment: string) {
    router.push(segment === '' ? '/' : ('/' + segment) as any)
  }

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? session?.user?.email ?? ''

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarTop}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarLogo}>🌟</Text>
          <View>
            <Text style={styles.sidebarAppName}>Lumora</Text>
          </View>
        </View>

        <View style={styles.sidebarNav}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.segment)
            return (
              <TouchableOpacity
                key={item.segment}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigate(item.segment)}
                activeOpacity={0.7}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {t(item.labelKey)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.sidebarFooter}>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => supabase.auth.signOut()}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>↩</Text>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function AppLayout() {
  const { session, loading } = useAuth()
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const pathname = usePathname()
  const isWide = width >= SIDEBAR_BREAKPOINT

  if (loading) return null
  if (!session) return <Redirect href="/(auth)/login" />

  return (
    <View style={styles.root}>
      {isWide && <Sidebar pathname={pathname} />}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: isWide
              ? { display: 'none' }
              : { borderTopColor: colors.border },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('dashboard.title'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="clients"
            options={{
              title: t('clients.title'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              title: t('appointments.title'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
            }}
          />
          <Tabs.Screen
            name="followups"
            options={{
              title: t('followups.title'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  content: { flex: 1 },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 16,
  },
  sidebarTop:    { flex: 1 },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  sidebarLogo:    { fontSize: 28 },
  sidebarAppName: { fontSize: 15, fontWeight: '700', color: colors.text },
  sidebarVersion: { fontSize: 11, color: colors.textTertiary },
  sidebarNav:     { paddingHorizontal: 8, paddingTop: 4, gap: 2 },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive:  { backgroundColor: colors.primaryLight },
  navIcon:        { fontSize: 18 },
  navLabel:       { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  navLabelActive: { color: colors.primary, fontWeight: '600' },

  // Footer
  sidebarFooter: {
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  userName:       { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  logoutIcon: { fontSize: 15, color: colors.textSecondary },
  logoutText: { fontSize: 13, color: colors.textSecondary },
})
