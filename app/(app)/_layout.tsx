import { useEffect } from 'react'
import { Tabs, Redirect, usePathname, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { DemoProvider, useDemoState } from '@/features/demo/DemoProvider'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

const SIDEBAR_BREAKPOINT = 768

const NAV_ITEMS = [
  { segment: '',             icon: '🏠', labelKey: 'dashboard.title'    },
  { segment: 'clients',      icon: '👥', labelKey: 'clients.title'      },
  { segment: 'appointments', icon: '📅', labelKey: 'appointments.title' },
  { segment: 'followups',    icon: '🔔', labelKey: 'followups.title'    },
  { segment: 'catalog',      icon: '📦', labelKey: 'catalog.title'      },
  { segment: 'settings',     icon: '👤', labelKey: 'settings.title'     },
]

const TAB_ROUTES: { name: string; icon: string; path: string }[] = [
  { name: 'index',        icon: '🏠', path: '/'             },
  { name: 'clients',      icon: '👥', path: '/clients'      },
  { name: 'appointments', icon: '📅', path: '/appointments' },
  { name: 'followups',    icon: '🔔', path: '/followups'    },
  { name: 'catalog',      icon: '📦', path: '/catalog'      },
]

// ── Custom floating tab bar ─────────────────────────────────────────────────

function CustomTabBar({ insets }: any) {
  const { width } = useWindowDimensions()
  const pathname  = usePathname()
  if (width >= SIDEBAR_BREAKPOINT) return null

  function isTabActive(tab: typeof TAB_ROUTES[0]) {
    if (tab.name === 'index') return pathname === '/'
    return pathname === tab.path || pathname.startsWith(tab.path + '/')
  }

  return (
    <View style={[tabStyles.wrapper, { paddingBottom: Math.max(insets?.bottom ?? 0, 12) }]}>
      <View style={tabStyles.bar}>
        {TAB_ROUTES.map(tab => {
          const isFocused = isTabActive(tab)
          return (
            <TouchableOpacity
              key={tab.name}
              style={tabStyles.tab}
              onPress={() => { if (!isFocused) router.push(tab.path as any) }}
              activeOpacity={0.75}
            >
              <View style={[tabStyles.iconWrap, isFocused && tabStyles.iconWrapActive]}>
                <Text style={[tabStyles.icon, isFocused && tabStyles.iconActive]}>{tab.icon}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 52,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  icon: {
    fontSize: 22,
    opacity: 0.38,
  },
  iconActive: {
    opacity: 1,
  },
})

// ── Sidebar (web ≥768px) ────────────────────────────────────────────────────

function Sidebar({ pathname }: { pathname: string }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { demoCount, demoLoading, demoFailed, checkDemo, handleLoadDemo, handleDeleteDemo } = useDemoState()

  useEffect(() => { checkDemo() }, [checkDemo, pathname])

  async function toggleDemo() {
    if (demoCount > 0) {
      await handleDeleteDemo()
    } else {
      await handleLoadDemo()
    }
    router.replace('/')
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
          <Text style={styles.sidebarAppName}>Caelys</Text>
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
            <Text style={styles.userAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>
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
        {demoFailed ? <Text style={styles.demoErrText}>{t('common.error')}</Text> : null}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()} activeOpacity={0.7}>
          <Text style={styles.logoutIcon}>↩</Text>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Root layout ─────────────────────────────────────────────────────────────

export default function AppLayout() {
  const { session, loading } = useAuth()
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const pathname = usePathname()
  const isWide = width >= SIDEBAR_BREAKPOINT
  const isRootRoute = pathname === '/' || pathname === '/clients' || pathname === '/appointments' || pathname === '/followups' || pathname === '/catalog'

  if (loading) return null
  if (!session) return <Redirect href="/(auth)/login" />

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? session?.user?.email ?? ''
  const initials = firstName.slice(0, 2).toUpperCase()

  return (
    <DemoProvider>
      <View style={[styles.root, isWide && styles.rootWide]}>
        {isWide
          ? <Sidebar pathname={pathname} />
          : isRootRoute && (
            <View style={styles.mobileHeader}>
              <View style={styles.mobileHeaderLeft}>
                <Text style={styles.mobileHeaderLeaf}>🌿</Text>
                <Text style={styles.mobileHeaderName}>Caelys</Text>
              </View>
              <View style={styles.mobileHeaderRight}>
                <TouchableOpacity onPress={() => router.push('/(app)/clients')} style={styles.mobileHeaderBtn}>
                  <Text style={styles.mobileHeaderBtnIcon}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mobileHeaderAvatar} onPress={() => router.push('/(app)/settings')}>
                  <Text style={styles.mobileHeaderAvatarText}>{initials}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
        <View style={styles.content}>
          <Tabs
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Tabs.Screen name="index"        options={{ title: t('dashboard.title')    }} />
            <Tabs.Screen name="clients"      options={{ title: t('clients.title')      }} />
            <Tabs.Screen name="appointments" options={{ title: t('appointments.title') }} />
            <Tabs.Screen name="followups"    options={{ title: t('followups.title')    }} />
            <Tabs.Screen name="catalog"      options={{ title: t('catalog.title')      }} />
            <Tabs.Screen name="settings"     options={{ title: t('settings.title')     }} />
          </Tabs>
        </View>
      </View>
    </DemoProvider>
  )
}

const styles = StyleSheet.create({
  root:     { flex: 1, flexDirection: 'column', backgroundColor: colors.bg },
  rootWide: { flexDirection: 'row' },
  content:  { flex: 1 },

  // ── Mobile header ────────────────────────────────────────────────────────────
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

  // ── Sidebar ──────────────────────────────────────────────────────────────────
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
  sidebarNav:     { paddingHorizontal: 8, paddingTop: 4, gap: 2 },

  navItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10 },
  navItemActive: { backgroundColor: colors.primaryLight },
  navIcon:       { fontSize: 18 },
  navLabel:      { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  navLabelActive:{ color: colors.primary, fontFamily: fonts.semibold },

  sidebarFooter: { paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 4 },
  userRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, backgroundColor: colors.bg },
  userAvatar:    { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  userAvatarText:{ color: colors.textInverse, fontSize: 13, fontFamily: fonts.bold },
  userName:      { fontSize: 13, fontFamily: fonts.medium, color: colors.text, flex: 1 },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8 },
  logoutIcon: { fontSize: 15, color: colors.textSecondary },
  logoutText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },

  demoBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8 },
  demoIcon:       { fontSize: 14 },
  demoText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  demoTextActive: { color: colors.danger },
  demoErrText:    { fontSize: 12, fontFamily: fonts.medium, color: colors.danger, paddingHorizontal: 8 },
})
