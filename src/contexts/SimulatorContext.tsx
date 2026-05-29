'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { SimulatorData, defaultSimulatorData } from '@/types/simulator'
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/localStorage'

interface SimulatorContextType {
  data: SimulatorData
  updateData: (partial: Partial<SimulatorData>) => void
  resetData: () => void
}

const SimulatorContext = createContext<SimulatorContextType | null>(null)

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SimulatorData>(defaultSimulatorData)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const stored = loadFromLocalStorage()
    if (stored) {
      setData(stored)
    }
    setInitialized(true)
  }, [])

  const updateData = useCallback((partial: Partial<SimulatorData>) => {
    setData(prev => {
      const next = { ...prev, ...partial }
      saveToLocalStorage(next)
      return next
    })
  }, [])

  const resetData = useCallback(() => {
    setData(defaultSimulatorData)
    saveToLocalStorage(defaultSimulatorData)
  }, [])

  if (!initialized) return null

  return (
    <SimulatorContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </SimulatorContext.Provider>
  )
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext)
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider')
  return ctx
}
