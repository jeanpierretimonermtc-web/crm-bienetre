import { useEffect, useRef } from 'react'
import { Animated, Image, Platform, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/shared/theme/ThemeProvider'
import { useMemo } from 'react'
import type { ThemeColors } from '@/shared/theme/colors'

const nativeDriver = Platform.OS !== 'web'

export default function SplashScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const opacity = useRef(new Animated.Value(0)).current
  const scale   = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    Animated.sequence([
      // 0 → 400ms : fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: nativeDriver,
      }),
      // 400 → 1200ms : scale 0.95 → 1.00
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: nativeDriver,
      }),
    ]).start()

    // Navigation automatique après 1.8s
    const timer = setTimeout(() => {
      router.replace('/(auth)/login')
    }, 1800)

    return () => clearTimeout(timer)
  }, [opacity, scale])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: Platform.OS === 'web' ? 72 : 80,
      height: Platform.OS === 'web' ? 72 : 80,
    },
  })
}
