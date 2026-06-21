import { useEffect, useRef } from 'react'
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'

const nativeDriver = Platform.OS !== 'web'

interface Props {
  onDone?: () => void
}

export function SplashAnimated({ onDone }: Props) {
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(0)).current
  const scale   = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    Animated.sequence([
      // 0 → 400ms : fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: nativeDriver,
      }),
      // 400 → 1200ms : léger zoom
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativeDriver,
      }),
      // 1200 → 1600ms : stabilisation
      Animated.delay(400),
      // 1600 → 1900ms : fade out vers l'app
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: nativeDriver,
      }),
    ]).start(() => onDone?.())
  }, [])

  return (
    <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('@/assets/logo-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 96,
    height: 96,
  },
})
