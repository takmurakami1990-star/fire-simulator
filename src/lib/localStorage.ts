import { SimulatorData } from '@/types/simulator'

const STORAGE_KEY = 'fire-simulator-data'
const EXPIRY_DAYS = 30

interface StoredData {
  data: SimulatorData
  lastAccess: number
}

export function saveToLocalStorage(data: SimulatorData): void {
  if (typeof window === 'undefined') return
  const stored: StoredData = { data, lastAccess: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export function loadFromLocalStorage(): SimulatorData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const stored: StoredData = JSON.parse(raw)
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000

    if (Date.now() - stored.lastAccess > expiryMs) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    // アクセスのたびに lastAccess を更新（30日延長）
    const updated: StoredData = { data: stored.data, lastAccess: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return stored.data
  } catch {
    return null
  }
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
