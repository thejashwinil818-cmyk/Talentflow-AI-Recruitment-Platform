const ACCOUNTS_KEY = 'talentflow-demo-accounts-v1'
const SESSION_KEY = 'talentflow-demo-session-v1'
const HASH_ITERATIONS = 210_000

function readAccounts() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeAccounts(accounts) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function publicAccount(account) {
  return { fullName: account.fullName, email: account.email, role: account.role, profile: account.profile || {} }
}

function makeSalt() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function derivePassword(password, salt) {
  if (!window.crypto?.subtle) throw new Error('Secure browser crypto is unavailable. Open this demo on localhost or HTTPS.')
  const encoder = new TextEncoder()
  const key = await window.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: HASH_ITERATIONS, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}

export function restoreSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || window.sessionStorage.getItem(SESSION_KEY) || 'null')
    const account = readAccounts().find((item) => item.email === session?.email && item.role === session?.role)
    if (account) return publicAccount(account)
  } catch { /* Invalid or unavailable demo storage starts signed out. */ }
  try { window.localStorage.removeItem(SESSION_KEY) } catch { /* Storage may be unavailable. */ }
  return null
}

export async function registerAccount({ fullName, email, password, role }) {
  const normalizedEmail = normalizeEmail(email)
  const accounts = readAccounts()
  if (accounts.some((account) => account.email === normalizedEmail)) {
    const existing = accounts.find((account) => account.email === normalizedEmail)
    throw new Error(existing.role === role ? 'An account with this email already exists. Sign in instead.' : `This email is already registered for the ${existing.role} portal. Use that portal to sign in.`)
  }
  const salt = makeSalt()
  const passwordHash = await derivePassword(password, salt)
  const account = { fullName: fullName.trim(), email: normalizedEmail, role, salt, passwordHash, profile: role === 'candidate' ? { headline: 'Product designer', focus: 'Product design, Figma, Systems' } : {} }
  writeAccounts([...accounts, account])
  return publicAccount(account)
}

export async function signIn({ email, password, role, remember = true }) {
  const normalizedEmail = normalizeEmail(email)
  const accounts = readAccounts()
  const account = accounts.find((item) => item.email === normalizedEmail)
  if (!account) throw new Error('No account exists for this email. Create an account for this portal first.')
  if (account.role !== role) throw new Error(`This account belongs to the ${account.role} portal. Select that portal to sign in.`)
  const candidateHash = await derivePassword(password, account.salt)
  if (candidateHash !== account.passwordHash) throw new Error('The password is incorrect. Check it and try again.')
  const session = JSON.stringify({ email: account.email, role: account.role })
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
  ;(remember ? window.localStorage : window.sessionStorage).setItem(SESSION_KEY, session)
  return publicAccount(account)
}

export function signOut() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch { /* Sign out still clears in-memory state. */ }
}

export function saveAccountProfile({ email, role, updates }) {
  const accounts = readAccounts()
  const index = accounts.findIndex((account) => account.email === email && account.role === role)
  if (index < 0) throw new Error('The demo account could not be found. Please sign in again.')
  const current = accounts[index]
  const next = { ...current, ...('fullName' in updates ? { fullName: updates.fullName.trim() } : {}), profile: { ...(current.profile || {}), ...(updates.profile || {}) } }
  accounts[index] = next
  writeAccounts(accounts)
  return publicAccount(next)
}
