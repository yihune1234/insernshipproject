import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { verificationApi } from '@/services/verification/verificationApi'
import type { MockActivity } from '@/services/mockData'

export interface Activity {
  id: string; action: string; actionType: string; credentialId?: string;
  credentialType?: string; issuerName?: string; timestamp: string; details?: string;
}

const ACT_MAP: Record<string, MockActivity['type']> = {
  CREDENTIAL_ISSUED: 'ISSUED', CREDENTIAL_SHARED: 'SHARED',
  CREDENTIAL_VERIFIED: 'VERIFIED', AUTH_LOGIN: 'LOGIN',
  CREDENTIAL_RECEIVED: 'RECEIVED', CREDENTIAL_REVOKED: 'REVOKED',
}
function toActivity(a: Activity): MockActivity {
  return {
    id: a.id,
    type: ACT_MAP[a.actionType] ?? 'ISSUED',
    title: a.details ?? a.action,
    description: a.issuerName ?? a.credentialType ?? '',
    timestamp: a.timestamp,
    credentialId: a.credentialId,
  }
}

interface ActivitiesContextType {
  activities: MockActivity[]
  isLoadingActivities: boolean
  refreshActivities: () => Promise<void>
  addActivity: (a: Omit<Activity, 'id'>) => void
}

const ActivitiesContext = createContext<ActivitiesContextType | null>(null)

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [rawActivities, setRawActivities] = useState<Activity[]>([])
  const [isLoadingActs] = useState(false)
  const localActivitiesRef = useRef<Activity[]>([])

  const loadActivities = useCallback(async () => {
    try {
      const history = await verificationApi.getVerificationHistory().catch(() => [])
      if (!history || history.length === 0) return
      const backendActivities: Activity[] = (history as Array<Record<string, unknown>>).map(item => ({
        id: String(item.presentation_id ?? `vhist-${item.verified_at}`),
        action: 'Credential Verified',
        actionType: 'CREDENTIAL_VERIFIED',
        timestamp: String(item.verified_at ?? new Date().toISOString()),
        details: item.verifier_org ? `Verified by ${item.verifier_org}` : 'Credential presented',
      }))
      setRawActivities(prev => {
        const backendIds = new Set(backendActivities.map(a => a.id))
        const localOnly = prev.filter(a => !backendIds.has(a.id))
        return [...localOnly, ...backendActivities].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
      })
    } catch { /* offline — keep existing activities */ }
  }, [])

  useEffect(() => { loadActivities() }, [loadActivities])

  const addActivity = useCallback((a: Omit<Activity, 'id'>) => {
    const activity = { ...a, id: `act-${Date.now()}` } as Activity
    localActivitiesRef.current = [activity, ...localActivitiesRef.current]
    setRawActivities(prev => [activity, ...prev])
  }, [])

  const activities = useMemo(() => rawActivities.map(toActivity), [rawActivities])

  const value = useMemo<ActivitiesContextType>(() => ({
    activities,
    isLoadingActivities: isLoadingActs,
    refreshActivities: loadActivities,
    addActivity,
  }), [activities, isLoadingActs, loadActivities, addActivity])

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities(): ActivitiesContextType {
  const ctx = useContext(ActivitiesContext)
  if (!ctx) throw new Error('useActivities must be used within ActivitiesProvider')
  return ctx
}
