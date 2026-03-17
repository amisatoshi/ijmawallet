/**
 * Ijma Wallet — Security Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * All cryptography runs client-side. No keys ever leave the device.
 * Uses Web Crypto API (AES-256-GCM) for storage encryption.
 * BIP39/BIP32 for Bitcoin key derivation.
 * NIP-06 for Nostr key derivation from same seed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── AES-256-GCM Encryption ───────────────────────────────────────────────────

/**
 * Derive an AES-256-GCM key from a user password + salt using PBKDF2.
 * 600,000 iterations (OWASP 2023 recommendation).
 */
export async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: typeof salt === 'string' ? enc.encode(salt) : salt,
      iterations: 600_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a string with AES-256-GCM.
 * Returns a base64-encoded payload containing salt + iv + ciphertext.
 */
export async function encryptData(plaintext, password) {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )

  // Pack: [salt(32)] + [iv(12)] + [ciphertext]
  const packed = new Uint8Array(32 + 12 + ciphertext.byteLength)
  packed.set(salt, 0)
  packed.set(iv, 32)
  packed.set(new Uint8Array(ciphertext), 44)

  return btoa(String.fromCharCode(...packed))
}

/**
 * Decrypt a base64-encoded AES-256-GCM payload.
 */
export async function decryptData(b64payload, password) {
  const packed = Uint8Array.from(atob(b64payload), c => c.charCodeAt(0))
  const salt = packed.slice(0, 32)
  const iv = packed.slice(32, 44)
  const ciphertext = packed.slice(44)
  const key = await deriveKey(password, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(plaintext)
}

// ─── Secure Storage (IndexedDB wrapper) ──────────────────────────────────────

const DB_NAME = 'ijma-secure'
const DB_VERSION = 1
const STORE = 'vault'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE)
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Store encrypted data in IndexedDB.
 * Data is encrypted with password before storage.
 */
export async function secureSet(key, value, password) {
  const encrypted = await encryptData(JSON.stringify(value), password)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(encrypted, key)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Retrieve and decrypt data from IndexedDB.
 * Returns null if key not found or decryption fails.
 */
export async function secureGet(key, password) {
  const db = await openDB()
  const encrypted = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  if (!encrypted) return null
  try {
    const decrypted = await decryptData(encrypted, password)
    return JSON.parse(decrypted)
  } catch {
    // Wrong password or corrupted data
    return null
  }
}

/**
 * Delete a key from secure storage.
 */
export async function secureDelete(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Check if any wallet data exists (without decrypting).
 */
export async function walletExists() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get('wallet_meta')
    req.onsuccess = () => resolve(!!req.result)
    req.onerror = () => reject(req.error)
  })
}

// ─── Biometric / WebAuthn helpers ─────────────────────────────────────────────

/**
 * Check if biometrics (WebAuthn) is available on this device.
 */
export async function biometricAvailable() {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/**
 * Register a biometric credential (first-time setup).
 * The credential is used as a second factor — it does NOT store the seed.
 */
export async function registerBiometric(userId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Ijma Wallet', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userId,
        displayName: 'Ijma Wallet User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }  // RS256
      ],
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000
    }
  })
  // Store credential ID (not the key itself)
  localStorage.setItem('ijma_cred_id', btoa(
    String.fromCharCode(...new Uint8Array(credential.rawId))
  ))
  return credential
}

/**
 * Authenticate with biometrics.
 * Returns true if successful.
 */
export async function authenticateBiometric() {
  const credIdB64 = localStorage.getItem('ijma_cred_id')
  if (!credIdB64) return false

  const credId = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0))
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  try {
    await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: credId, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000
      }
    })
    return true
  } catch {
    return false
  }
}

// ─── PIN hashing ──────────────────────────────────────────────────────────────

/**
 * Hash a PIN with SHA-256 + salt for comparison.
 * Never store the PIN itself.
 */
export async function hashPin(pin, salt) {
  const enc = new TextEncoder()
  const data = enc.encode(pin + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

// ─── Random salt generation ────────────────────────────────────────────────────

export function generateSalt() {
  return btoa(String.fromCharCode(
    ...crypto.getRandomValues(new Uint8Array(32))
  ))
}

// ─── Security tier for transaction amounts ─────────────────────────────────────

export function getSecurityTier(amountSats, btcPriceGbp = 80000) {
  const gbp = (amountSats / 1e8) * btcPriceGbp
  if (gbp < 100) return { tier: 1, label: 'Biometric only', icon: '👆' }
  if (gbp < 1000) return { tier: 2, label: 'Biometric + PIN', icon: '🔐' }
  if (gbp < 10000) return { tier: 3, label: 'Biometric + MFA', icon: '🛡️' }
  return { tier: 4, label: 'Hardware wallet required', icon: '🔑' }
}
