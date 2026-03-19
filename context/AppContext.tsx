import React, { createContext, useContext, ReactNode } from 'react'
import { AppConfig } from '@/types'

interface AppContextValue {
  config: AppConfig
}

const defaultConfig: AppConfig = {
  dateRangeStart: new Date().toISOString().split('T')[0],
  dateRangeEnd: (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })(),
  columnWidthPx: 48,
  visibleColumnsBuffer: 2,
  bookingHeaderBackground: "#e8f4fc"
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const value: AppContextValue = {
    config: defaultConfig,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
