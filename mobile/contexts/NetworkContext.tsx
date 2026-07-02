import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { syncData } from '@/services/sync/syncService'

export interface SyncStatus {
  isSyncing: boolean
  lastSyncAt: Date | null
  syncError: string | null
}

interface NetworkContextType {
  isOnline: boolean
  syncStatus: SyncStatus
  syncNow: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextType | null>(null)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false, lastSyncAt: null, syncError: null,
  })

  const handleReconnect = useCallback(() => {
    setSyncStatus(s => ({ ...s, isSyncing: true, syncError: null }))
    syncData()
      .then(() => setSyncStatus({ isSyncing: false, lastSyncAt: new Date(), syncError: null }))
      .catch((e) => setSyncStatus(s => ({
        ...s, isSyncing: false,
        syncError: e instanceof Error ? e.message : 'Sync failed',
      })))
  }, [])

  const { isOnline } = useNetworkStatus(handleReconnect)

  const syncNow = useCallback(async () => {
    if (!isOnline) return
    setSyncStatus(s => ({ ...s, isSyncing: true, syncError: null }))
    try {
      await syncData()
      setSyncStatus({ isSyncing: false, lastSyncAt: new Date(), syncError: null })
    } catch (e) {
      setSyncStatus(s => ({
        ...s, isSyncing: false,
        syncError: e instanceof Error ? e.message : 'Sync failed',
      }))
    }
  }, [isOnline])

  const value = useMemo<NetworkContextType>(() => ({
    isOnline, syncStatus, syncNow,
  }), [isOnline, syncStatus, syncNow])

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork(): NetworkContextType {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
