import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  authenticateLocally, getAuthStatus, getStoredDID, getStoredUser,
  logout as holderLogout, registerLocally, requestOTP as holderRequestOTP,
  resetAllData, setupLocalAuthentication,
  type HolderUser,
} from '@/services/auth/holderAuth'
import { nidApi } from '@/services/nid/nidApi'
import * as LocalAuth from '@/services/auth/localAuth'
import { startTokenManager, stopTokenManager } from '@/services/auth/tokenManager'
import { type MockCitizen, MOCK_CITIZENS } from '@/services/mockData'
import { credentialApi } from '@/services/credentials/credentialApi'

export interface PendingCitizen {
  nationalId: string; fullName: string; phone: string; maskedPhone: string;
  gender: string; dob: string; region: string; city: string;
  nationality: string; did: string; photo?: string;
}

interface AuthContextType {
  isLoading: boolean; isOnboarded: boolean; isAuthenticated: boolean;
  biometricEnabled: boolean; biometricAvailable: boolean;
  user: HolderUser | null; citizen: MockCitizen | null; did: string | null;
  pendingNationalId: string; pendingCitizen: PendingCitizen | null;
  pendingAccountExists: boolean; pendingPhone: string; pendingOtpForTesting?: string;
  setPendingPhone: (phone: string) => void;
  verifyNationalId: (id: string) => Promise<{ success: boolean; expiresIn: number; maskedPhone: string }>;
  verifyOtp: (otp: string, phone?: string) => Promise<void>;
  setPendingPin: (pin: string) => void;
  confirmPinAndSetup: (confirmPin: string) => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  logout: () => Promise<void>;
  deleteWallet: () => Promise<void>;
  setupBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<HolderUser | null>(null)
  const [did, setDid] = useState<string | null>(null)
  const [biometricEnabled, setBioEnabled] = useState(false)
  const [biometricAvailable, setBioAvail] = useState(false)
  const [pendingNationalId, setPendingNid] = useState('')
  const [pendingCitizen, setPendingCitizen] = useState<PendingCitizen | null>(null)
  const [pendingAccountExists, setPendingAccountExists] = useState(false)
  const [pendingPhone, setPendingPhone] = useState('')
  const [pendingPin, setPendingPinState] = useState('')
  const [pendingOtpForTesting, setPendingOtpForTesting] = useState<string | undefined>(undefined)

  const citizen = useMemo<MockCitizen | null>(() => {
    if (!user) return null
    const parts = (user.full_name ?? user.name ?? '').split(' ')
    const u = user as unknown as Record<string, string | undefined>
    return {
      nationalId: u.national_id ?? '', did: did ?? '',
      fullName: u.full_name ?? u.name ?? '',
      firstName: parts[0] ?? '', lastName: parts.slice(1).join(' '),
      gender: u.gender ?? '', dob: u.date_of_birth ?? '',
      phone: u.phone ?? '', email: '',
      region: String(u.region ?? ''),
      city: String(u.city ?? ''),
      photo: u.photo ?? '',
      walletAddress: `debo:${u.national_id ?? ''}:wallet`,
      createdAt: new Date().toISOString(),
    }
  }, [user, did])

  useEffect(() => {
    (async () => {
      try {
        const [status, bio] = await Promise.all([
          getAuthStatus(),
          AsyncStorage.getItem('biometricEnabled'),
        ])
        if (status.user) setUser(status.user as HolderUser)
        if (status.did) setDid(status.did)
        setIsOnboarded(status.isRegistered)
        setBioEnabled(bio === 'true')
        setBioAvail(await LocalAuth.isBiometricAvailable())
        if (status.isReady) {
          const ls = await LocalAuth.getLocalAuthStatus()
          if (ls.hasBiometric && ls.biometricAvailable) {
            const ok = await LocalAuth.authenticateWithBiometric()
            if (ok) setIsAuthenticated(true)
          }
        }
      } catch (e) { console.warn('[AuthContext] bootstrap:', e) }
      finally { setIsLoading(false) }
    })()
  }, [])

  useEffect(() => {
    if (isAuthenticated) startTokenManager().catch(() => {})
    else stopTokenManager()
  }, [isAuthenticated])

  const verifyNationalId = useCallback(async (id: string) => {
    const nid = id.trim().toUpperCase()
    try {
      const res = await holderRequestOTP(nid)
      setPendingNid(nid)
      setPendingAccountExists(res.account_exists ?? false)
      setPendingCitizen({
        nationalId: nid, fullName: '', phone: res.masked_phone,
        maskedPhone: res.masked_phone, gender: '', dob: '', region: '', city: '',
        nationality: 'Ethiopian', did: `did:et:citizen:${nid}`,
      })
      if (res.otp_for_testing) setPendingOtpForTesting(res.otp_for_testing)
      return { success: true, expiresIn: 300, maskedPhone: res.masked_phone }
    } catch (error) {
      const isOffline = error instanceof Error && (
        error.message.includes('Connection failed') ||
        error.message.includes('Network request failed') ||
        error.name === 'ConnectionError'
      )
      if (isOffline) {
        const mockCitizen = MOCK_CITIZENS[nid]
        const masked = mockCitizen
          ? mockCitizen.phone.slice(0, 3) + '****' + mockCitizen.phone.slice(-2)
          : '+251******78'
        const phone = mockCitizen ? mockCitizen.phone : '+251912345678'
        setPendingNid(nid)
        setPendingAccountExists(false)
        setPendingCitizen({
          nationalId: nid,
          fullName: mockCitizen?.fullName ?? 'Offline Citizen',
          phone, maskedPhone: masked,
          gender: mockCitizen?.gender ?? 'Male',
          dob: mockCitizen?.dob ?? '1995-01-01',
          region: mockCitizen?.region ?? 'Addis Ababa',
          city: mockCitizen?.city ?? 'Addis Ababa',
          nationality: 'Ethiopian',
          did: `did:et:citizen:${nid}`,
          photo: mockCitizen?.photo,
        })
        return { success: true, expiresIn: 300, maskedPhone: masked }
      }
      throw error
    }
  }, [])

  const verifyOtp = useCallback(async (otp: string, phone?: string) => {
    if (phone) setPendingPhone(phone)
    try {
      const profileRes = await nidApi.getProfile()
      const rawObj = (profileRes && typeof profileRes === 'object' && profileRes !== null && 'data' in profileRes) ? (profileRes as any).data : profileRes
      const p = rawObj || {}
      const identityObj = p.identity || {}
      const pName = p.full_name ?? p.fullName ?? identityObj.full_name ?? identityObj.fullName ?? ''
      const pPhone = p.phone ?? p.phone_number ?? phone ?? ''
      const pGender = p.gender ?? identityObj.gender ?? ''
      const pDob = p.dob ?? identityObj.dob ?? ''
      const pAddress = p.address ?? identityObj.address ?? ''
      const pPhoto = p.photo ?? identityObj.photo
      const pFin = p.fin ?? p.national_id ?? pendingNationalId
      const pNationality = p.nationality ?? 'Ethiopian'
      const masked = pPhone ? (pPhone.slice(0, 3) + '****' + pPhone.slice(-2)) : '****'
      setPendingCitizen({
        nationalId: pFin, fullName: pName, phone: pPhone, maskedPhone: masked,
        gender: pGender, dob: pDob,
        region: pAddress ? pAddress.split(',')[0]?.trim() : 'Addis Ababa',
        city: pAddress ? (pAddress.split(',')[1] ?? pAddress).trim() : 'Addis Ababa',
        nationality: pNationality, did: `did:et:citizen:${pFin}`, photo: pPhoto,
      })
    } catch { /* Profile fetch failed — minimal info */ }
  }, [pendingNationalId])

  const confirmPinAndSetup = useCallback(async (confirmPin: string): Promise<boolean> => {
    if (confirmPin !== pendingPin) throw new Error('PIN confirmation does not match')
    const fullName = pendingCitizen?.fullName ?? pendingNationalId
    const phone = pendingCitizen?.phone ?? pendingPhone
    const photo = pendingCitizen?.photo
    const data = await registerLocally(pendingNationalId, fullName, phone, photo)
    setUser(data.user as HolderUser)
    setDid(data.did)
    await setupLocalAuthentication(confirmPin)
    setIsOnboarded(true)
    setIsAuthenticated(true)
    return true
  }, [pendingPin, pendingNationalId, pendingPhone, pendingCitizen])

  const unlockWithPin = useCallback(async (pin: string) => {
    const ok = await authenticateLocally(pin, false)
    if (ok) {
      setIsAuthenticated(true)
      const [u, d] = await Promise.all([getStoredUser(), getStoredDID()])
      if (u) setUser(u as HolderUser)
      if (d) setDid(d)
    }
    return ok
  }, [])

  const unlockWithBiometric = useCallback(async () => {
    const ok = await authenticateLocally(undefined, true)
    if (ok) {
      setIsAuthenticated(true)
      const [u, d] = await Promise.all([getStoredUser(), getStoredDID()])
      if (u) setUser(u as HolderUser)
      if (d) setDid(d)
    }
    return ok
  }, [])

  const logout = useCallback(async () => {
    await holderLogout()
    setIsAuthenticated(false)
  }, [])

  const deleteWallet = useCallback(async () => {
    await resetAllData()
    setIsAuthenticated(false); setIsOnboarded(false)
    setUser(null); setDid(null)
  }, [])

  const setupBiometric = useCallback(async () => {
    await AsyncStorage.setItem('biometricEnabled', 'true')
    setBioEnabled(true); return true
  }, [])

  const disableBiometric = useCallback(async () => {
    await LocalAuth.disableBiometric()
    await AsyncStorage.setItem('biometricEnabled', 'false')
    setBioEnabled(false)
  }, [])

  const changePin = useCallback(async (oldPin: string, newPin: string) => {
    await LocalAuth.changePIN(oldPin, newPin)
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    isLoading, isOnboarded, isAuthenticated,
    biometricEnabled, biometricAvailable,
    user, citizen, did,
    pendingNationalId, pendingCitizen, pendingAccountExists, pendingPhone, pendingOtpForTesting,
    setPendingPhone,
    verifyNationalId, verifyOtp,
    setPendingPin: setPendingPinState,
    confirmPinAndSetup, unlockWithPin, unlockWithBiometric,
    logout, deleteWallet, setupBiometric, disableBiometric, changePin,
  }), [
    isLoading, isOnboarded, isAuthenticated, biometricEnabled, biometricAvailable,
    user, citizen, did,
    pendingNationalId, pendingCitizen, pendingAccountExists, pendingPhone, pendingOtpForTesting,
    verifyNationalId, verifyOtp, confirmPinAndSetup,
    unlockWithPin, unlockWithBiometric, logout, deleteWallet,
    setupBiometric, disableBiometric, changePin,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
