import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'

const RESET_REDIRECT = 'https://crm-bienetre.vercel.app/reset-password'

type Mode = 'login' | 'forgot'

export default function LoginScreen() {
  const { t } = useTranslation()

  const [mode, setMode] = useState<Mode>('login')

  // Login state
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Forgot-password state
  const [resetEmail,   setResetEmail]   = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent,    setResetSent]    = useState(false)
  const [resetError,   setResetError]   = useState<string | null>(null)

  async function handleLogin() {
    setErrorMsg(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error')
      setErrorMsg(msg)
      console.error('[login]', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!resetEmail.trim()) {
      setResetError(t('auth.error_email_required'))
      return
    }
    setResetError(null)
    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: RESET_REDIRECT,
      })
      if (error) throw error
      setResetSent(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error')
      setResetError(msg)
      console.error('[resetPassword]', e)
    } finally {
      setResetLoading(false)
    }
  }

  function goToForgot() {
    setResetEmail(email) // pre-fill if already typed
    setResetSent(false)
    setResetError(null)
    setMode('forgot')
  }

  function goToLogin() {
    setMode('login')
    setErrorMsg(null)
  }

  // ── Forgot-password view ───────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity onPress={goToLogin} style={styles.backRow}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>{t('auth.back_to_login')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth.forgot_password')}</Text>

        {resetSent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>{t('auth.reset_email_sent_title')}</Text>
            <Text style={styles.successBody}>
              {t('auth.reset_email_sent_body', { email: resetEmail })}
            </Text>
            <TouchableOpacity style={styles.button} onPress={goToLogin}>
              <Text style={styles.buttonText}>{t('auth.back_to_login')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.forgotHint}>{t('auth.forgot_password_hint')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            {resetError ? <Text style={styles.error}>{resetError}</Text> : null}
            <TouchableOpacity
              style={[styles.button, resetLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              <Text style={styles.buttonText}>
                {resetLoading ? t('common.loading') : t('auth.send_reset_link')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    )
  }

  // ── Login view ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{t('auth.login')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <TouchableOpacity onPress={goToForgot} style={styles.forgotLink}>
        <Text style={styles.forgotLinkText}>{t('auth.forgot_password')}</Text>
      </TouchableOpacity>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? t('common.loading') : t('auth.login')}
        </Text>
      </TouchableOpacity>
      <Link href="/(auth)/register" style={styles.link}>
        <Text style={styles.linkText}>{t('auth.register')}</Text>
      </Link>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#334f2b',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#334f2b',
    fontSize: 14,
    textAlign: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotLinkText: {
    color: '#4a6741',
    fontSize: 13,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 18,
    color: '#4a6741',
  },
  backText: {
    fontSize: 14,
    color: '#4a6741',
  },
  forgotHint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  successBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
})
