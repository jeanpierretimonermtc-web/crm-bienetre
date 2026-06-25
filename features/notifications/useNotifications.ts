import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { scheduleDailyReminder, setBadgeCount } from './notificationService'

// ── Setup au lancement (une seule fois) ──────────────────────────────────────

export function useNotificationSetup() {
  useEffect(() => {
    if (Platform.OS === 'web') return

    // Planifie le rappel quotidien à 9h
    scheduleDailyReminder(9, 0).catch(console.error)

    // Ouvre la bonne page quand l'utilisateur tape sur une notif
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const dest = response.notification.request.content.data?.navigateTo as string | undefined
      if (dest) router.push(dest as any)
    })

    return () => sub.remove()
  }, [])
}

// ── Badge iOS : met à jour le chiffre sur l'icône de l'app ──────────────────

export function useFollowupBadge(count: number) {
  useEffect(() => {
    setBadgeCount(count).catch(console.error)
  }, [count])
}
