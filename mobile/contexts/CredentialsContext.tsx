import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { credentialApi } from '@/services/credentials/credentialApi'
import type { MockCredential } from '@/services/mockData'

const CRED_COLORS: Record<string, string> = {
  EDUCATION: '#1B6B3A', AcademicDegree: '#1B6B3A', GOVERNMENT: '#C8991A',
  NationalId: '#C8991A', HEALTH: '#C0392B', PROFESSIONAL: '#7B3FA0', EMPLOYMENT: '#B45309',
}
const CRED_ICONS: Record<string, string> = {
  EDUCATION: 'school', AcademicDegree: 'school', GOVERNMENT: 'card',
  NationalId: 'card', HEALTH: 'medkit', PROFESSIONAL: 'ribbon', EMPLOYMENT: 'briefcase',
}
const SECTORS = ['EDUCATION','GOVERNMENT','HEALTH','PROFESSIONAL','EMPLOYMENT','FINANCE'] as const
type Sector = typeof SECTORS[number]
const toSector = (s: string): Sector =>
  (SECTORS.includes(s as Sector) ? s : 'EDUCATION') as Sector

function toCredential(c: Record<string, unknown>): MockCredential {
  const rawType = String(c.credential_type_name ?? c.type ?? '')
  const typeKey = rawType.replace(/Credential$/, '')
  const claims = (c.claims ?? c.credentialSubject ?? {}) as Record<string, string>
  const statusRaw = String(c.status ?? 'active').toUpperCase()
  const issuerObj = (c.issuer && typeof c.issuer === 'object') ? (c.issuer as Record<string, unknown>) : null
  return {
    id: String(c.credential_uuid ?? c.id ?? ''),
    type: rawType,
    title: String(claims.title ?? claims.degreeType ?? claims.certificationName ?? typeKey),
    subtitle: String(claims.subtitle ?? claims.degreeField ?? claims.jobTitle ?? c.organization_name ?? ''),
    issuer: {
      did: String(c.issuer_did ?? issuerObj?.did ?? ''),
      name: String(c.organization_name ?? c.issuer_name ?? issuerObj?.name ?? ''),
      sector: toSector(String(issuerObj?.sector ?? typeKey)),
    },
    issuanceDate: String(c.issued_at ?? c.issuance_date ?? ''),
    expiryDate: c.expires_at ? String(c.expires_at) : null,
    status: (['ACTIVE','REVOKED','EXPIRED','SUSPENDED'].includes(statusRaw) ? statusRaw : 'ACTIVE') as MockCredential['status'],
    holderDid: String(c.holder_did ?? ''),
    credentialSubject: claims,
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: String(c.verification_url ?? ''),
    ebcsAnchored: Boolean(c.ebcs_anchored ?? false),
    ebcsTxId: String(c.ebcs_tx_id ?? ''),
    color: CRED_COLORS[rawType] ?? CRED_COLORS[typeKey] ?? '#1B6B3A',
    icon: CRED_ICONS[rawType] ?? CRED_ICONS[typeKey] ?? 'document-text',
  }
}

interface CredentialsContextType {
  credentials: MockCredential[]
  isLoadingCredentials: boolean
  refreshCredentials: () => Promise<void>
}

const CredentialsContext = createContext<CredentialsContextType | null>(null)

export function CredentialsProvider({ children }: { children: React.ReactNode }) {
  const [rawCredentials, setRawCredentials] = useState<Record<string, unknown>[]>([])
  const [isLoadingCreds, setIsLoadingCreds] = useState(false)

  const loadCredentials = useCallback(async () => {
    setIsLoadingCreds(true)
    try {
      const { credentials: list } = await credentialApi.listCredentials()
      setRawCredentials(list as Record<string, unknown>[])
    } catch { /* offline — keep current state */ }
    finally { setIsLoadingCreds(false) }
  }, [])

  useEffect(() => { loadCredentials() }, [loadCredentials])

  const credentials = useMemo(() => rawCredentials.map(toCredential), [rawCredentials])

  const value = useMemo<CredentialsContextType>(() => ({
    credentials,
    isLoadingCredentials: isLoadingCreds,
    refreshCredentials: loadCredentials,
  }), [credentials, isLoadingCreds, loadCredentials])

  return <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>
}

export function useCredentials(): CredentialsContextType {
  const ctx = useContext(CredentialsContext)
  if (!ctx) throw new Error('useCredentials must be used within CredentialsProvider')
  return ctx
}
