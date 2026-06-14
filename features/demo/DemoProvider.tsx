import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { loadDemoData, deleteDemoData, getDemoClientsCount } from './demoService'

type DemoCtx = {
  demoCount: number
  demoLoading: boolean
  demoFailed: boolean
  demoVersion: number
  checkDemo: () => Promise<void>
  handleLoadDemo: () => Promise<void>
  handleDeleteDemo: () => Promise<void>
}

const DemoContext = createContext<DemoCtx>({
  demoCount: 0,
  demoLoading: false,
  demoFailed: false,
  demoVersion: 0,
  checkDemo: async () => {},
  handleLoadDemo: async () => {},
  handleDeleteDemo: async () => {},
})

export function DemoProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [demoCount, setDemoCount]   = useState(0)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoFailed, setDemoFailed]   = useState(false)
  const [demoVersion, setDemoVersion] = useState(0)
  const inFlight = useRef(false)

  const checkDemo = useCallback(async () => {
    if (!session) return
    try {
      setDemoCount(await getDemoClientsCount(session.user.id))
    } catch {}
  }, [session])

  const handleLoadDemo = useCallback(async () => {
    if (!session || inFlight.current) return
    inFlight.current = true
    setDemoLoading(true)
    setDemoFailed(false)
    try {
      await loadDemoData(session.user.id)
      const count = await getDemoClientsCount(session.user.id)
      setDemoCount(count)
      setDemoVersion(v => v + 1)
    } catch (e) {
      console.error('[loadDemo]', e)
      setDemoFailed(true)
    } finally {
      setDemoLoading(false)
      inFlight.current = false
    }
  }, [session])

  const handleDeleteDemo = useCallback(async () => {
    if (!session || inFlight.current) return
    inFlight.current = true
    setDemoLoading(true)
    setDemoFailed(false)
    try {
      await deleteDemoData(session.user.id)
      setDemoCount(0)
      setDemoVersion(v => v + 1)
    } catch (e) {
      console.error('[deleteDemo]', e)
      setDemoFailed(true)
    } finally {
      setDemoLoading(false)
      inFlight.current = false
    }
  }, [session])

  return (
    <DemoContext.Provider value={{ demoCount, demoLoading, demoFailed, demoVersion, checkDemo, handleLoadDemo, handleDeleteDemo }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoState() {
  return useContext(DemoContext)
}
