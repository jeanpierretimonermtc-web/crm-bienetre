import { useState, useEffect, useCallback } from 'react'
import { Tabs, Redirect, usePathname, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { loadDemoData, deleteDemoData, getDemoClientsCount } from '@/features/demo/demoService'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

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
  const [demoCount, setDemoCount]     = useState(0)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError]     = useState('')

  const checkDemo = useCallback(async () => {
    if (!session) return
    try {
      setDemoCount(await getDemoClientsCount(session.user.id))
    } catch {
      // keep existing count — DB error shouldn't crash the sidebar
    }
  }, [session])

  useEffect(() => { checkDemo() }, [checkDemo, pathname])

  async function toggleDemo() {
    if (!session) return
    setDemoLoading(true)
    setDemoError('')
    try {
      if (demoCount > 0) {
        await deleteDemoData(session.user.id)
        setDemoCount(0)
      } else {
        await loadDemoData(session.user.id)
        await checkDemo()
      }
      router.replace('/')
    } catch (e) {
      console.error('[toggleDemo]', e)
      setDemoError('Erreur')
    } finally {
      setDemoLoading(false)
    }
  }

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
        <TouchableOpacity style={styles.demoBtn} onPress={toggleDemo} disabled={demoLoading} activeOpacity={0.7}>
          {demoLoading
            ? <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginLeft: 4 }} />
            : <>
                <Text style={styles.demoIcon}>🧪</Text>
                <Text style={[styles.demoText, demoCount > 0 && styles.demoTextActive]}>
                  {demoCount > 0 ? t('dashboard.demo_delete') : t('dashboard.demo_load')}
                </Text>
              </>
          }
        </TouchableOpacity>
        {demoError ? <Text style={styles.demoErrText}>{demoError}</Text> : null}
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
  const isRootRoute = pathname === '/' || pathname === '/clients' || pathname === '/appointments' || pathname === '/followups'

  if (loading) return null
  if (!session) return <Redirect href="/(auth)/login" />

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? session?.user?.email ?? ''
  const initials = firstName.slice(0, 2).toUpperCase()

  return (
    <View style={[styles.root, isWide && styles.rootWide]}>
      {isWide
        ? <Sidebar pathname={pathname} />
        : isRootRoute && (
          <View style={styles.mobileHeader}>
            <View style={styles.mobileHeaderLeft}>
              <Text style={styles.mobileHeaderLeaf}>🌿</Text>
              <Text style={styles.mobileHeaderName}>Lumora</Text>
            </View>
            <View style={styles.mobileHeaderRight}>
              <TouchableOpacity onPress={() => router.push('/(app)/clients')} style={styles.mobileHeaderBtn}>
                <Text style={styles.mobileHeaderBtnIcon}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mobileHeaderAvatar} onPress={() => supabase.auth.signOut()}>
                <Text style={styles.mobileHeaderAvatarText}>{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      }
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: isWide
              ? { display: 'none' }
              : { borderTopColor: colors.border, backgroundColor: colors.card },
            tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.medium },
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
  root:     { flex: 1, flexDirection: 'column', backgroundColor: colors.bg },
  rootWide: { flexDirection: 'row' },
  content:  { flex: 1 },

  // ── Mobile header ──────────────────────────────────────────────────────────
  mobileHeader: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
  },
  mobileHeaderLeft:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mobileHeaderLeaf:       { fontSize: 20 },
  mobileHeaderName:       { fontSize: 17, fontFamily: fonts.bold, color: colors.textInverse },
  mobileHeaderRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mobileHeaderBtn:        { padding: 4 },
  mobileHeaderBtnIcon:    { fontSize: 18 },
  mobileHeaderAvatar:     { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  mobileHeaderAvatarText: { fontSize: 12, fontFamily: fonts.bold, color: colors.primary },

  // ── Sidebar (desktop ≥768px) ───────────────────────────────────────────────
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
  sidebarLogo:    { fontSize: 22 },
  sidebarAppName: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  sidebarVersion: { fontSize: 11, color: colors.textTertiary },
  sidebarNav:     { paddingHorizontal: 8, paddingTop: 4, gap: 2 },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navItemActive:  { backgroundColor: colors.primaryLight },
  navIcon:        { fontSize: 18 },
  navLabel:       { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  navLabelActive: { color: colors.primary, fontFamily: fonts.semibold },

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
  userAvatarText: { color: colors.textInverse, fontSize: 13, fontFamily: fonts.bold },
  userName:       { fontSize: 13, fontFamily: fonts.medium, color: colors.text, flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  logoutIcon: { fontSize: 15, color: colors.textSecondary },
  logoutText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },

  demoBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8 },
  demoIcon:       { fontSize: 14 },
  demoText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  demoTextActive: { color: colors.danger },
  demoErrText:    { fontSize: 12, fontFamily: fonts.medium, color: colors.danger, paddingHorizontal: 8 },
})
