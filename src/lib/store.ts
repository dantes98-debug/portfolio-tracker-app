export interface Position {
  id: string
  ticker: string
  name: string
  shares: number
  entryPrice: number
  currentPrice: number
  currency: string
  date: string
}

export interface ClosedTrade {
  id: string
  ticker: string
  name: string
  shares: number
  entryPrice: number
  exitPrice: number
  pnl: number
  pnlPct: number
  currency: string
  openDate: string
  closeDate: string
  note: string
}

export interface MonthlySnapshot {
  id: string
  month: string
  totalUSD: number
  capitalInvested: number
  note: string
}

const USERS_KEY = 'pt_users'
const PREFIX = (user: string) => `pt_${user}_`

export function getUsers(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    // Seed default user
    const defaults = { dante: 'drop2024' }
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults))
    return defaults
  }
  return JSON.parse(raw)
}

export function validateUser(username: string, password: string): boolean {
  const users = getUsers()
  return users[username.toLowerCase()] === password
}

export function registerUser(username: string, password: string): boolean {
  const users = getUsers()
  if (users[username.toLowerCase()]) return false
  users[username.toLowerCase()] = password
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return true
}

function getKey(user: string, key: string) {
  return PREFIX(user) + key
}

export function getPositions(user: string): Position[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(getKey(user, 'positions'))
  return raw ? JSON.parse(raw) : []
}

export function savePositions(user: string, positions: Position[]) {
  localStorage.setItem(getKey(user, 'positions'), JSON.stringify(positions))
}

export function getClosedTrades(user: string): ClosedTrade[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(getKey(user, 'closed'))
  return raw ? JSON.parse(raw) : []
}

export function saveClosedTrades(user: string, trades: ClosedTrade[]) {
  localStorage.setItem(getKey(user, 'closed'), JSON.stringify(trades))
}

export function getSnapshots(user: string): MonthlySnapshot[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(getKey(user, 'snapshots'))
  return raw ? JSON.parse(raw) : []
}

export function saveSnapshots(user: string, snapshots: MonthlySnapshot[]) {
  localStorage.setItem(getKey(user, 'snapshots'), JSON.stringify(snapshots))
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}
