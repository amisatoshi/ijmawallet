/**
 * Ijma Wallet — Nostr Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Real Nostr key generation (NIP-06 from BIP39 seed),
 * event signing, relay connection, Zaps (NIP-57), DMs (NIP-04/17).
 * Uses nostr-tools for all cryptographic operations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  nip04,
  nip19,
  SimplePool
} from 'nostr-tools'
import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync } from '@scure/bip39'

// ─── Key Generation ────────────────────────────────────────────────────────────

/**
 * Generate a fresh Nostr keypair.
 * Returns { privkey (hex), pubkey (hex), nsec, npub }
 */
export function generateNostrKeypair() {
  const privkey = generateSecretKey()                     // Uint8Array
  const pubkey = getPublicKey(privkey)                    // hex string
  const nsec = nip19.nsecEncode(privkey)
  const npub = nip19.npubEncode(pubkey)
  return {
    privkey: bytesToHex(privkey),
    pubkey,
    nsec,
    npub
  }
}

/**
 * Derive Nostr keypair from BIP39 mnemonic (NIP-06).
 * Derivation path: m/44'/1237'/0'/0/0
 */
export function nostrKeypairFromMnemonic(mnemonic) {
  const seed = mnemonicToSeedSync(mnemonic)
  const root = HDKey.fromMasterSeed(seed)
  const child = root.derive("m/44'/1237'/0'/0/0")
  const privkeyBytes = child.privateKey
  const pubkey = getPublicKey(privkeyBytes)
  const nsec = nip19.nsecEncode(privkeyBytes)
  const npub = nip19.npubEncode(pubkey)
  return {
    privkey: bytesToHex(privkeyBytes),
    pubkey,
    nsec,
    npub
  }
}

/**
 * Import from nsec string.
 */
export function importFromNsec(nsec) {
  try {
    const { type, data } = nip19.decode(nsec)
    if (type !== 'nsec') throw new Error('Not an nsec')
    const privkey = data
    const pubkey = getPublicKey(privkey)
    return {
      privkey: bytesToHex(privkey),
      pubkey,
      nsec,
      npub: nip19.npubEncode(pubkey)
    }
  } catch (e) {
    throw new Error('Invalid nsec: ' + e.message)
  }
}

// ─── Event creation ────────────────────────────────────────────────────────────

/**
 * Create and sign a Nostr event.
 */
export function createEvent(privkeyHex, kind, content, tags = []) {
  const privkey = hexToBytes(privkeyHex)
  const event = finalizeEvent({
    kind,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content
  }, privkey)
  return event
}

/**
 * Create a kind-0 metadata event (profile).
 */
export function createProfileEvent(privkeyHex, profile) {
  return createEvent(privkeyHex, 0, JSON.stringify(profile))
}

/**
 * Create a kind-1 text note.
 */
export function createNoteEvent(privkeyHex, content, replyTo = null) {
  const tags = replyTo ? [['e', replyTo, '', 'reply']] : []
  return createEvent(privkeyHex, 1, content, tags)
}

// ─── NIP-04 Encrypted DM ──────────────────────────────────────────────────────

/**
 * Send an encrypted DM (NIP-04).
 * Note: NIP-17 (gift-wrapped) is preferred for production — see roadmap.
 */
export async function createEncryptedDM(privkeyHex, recipientPubkey, message) {
  const privkey = hexToBytes(privkeyHex)
  const encrypted = await nip04.encrypt(privkey, recipientPubkey, message)
  return createEvent(privkeyHex, 4, encrypted, [['p', recipientPubkey]])
}

/**
 * Decrypt a NIP-04 DM.
 */
export async function decryptDM(privkeyHex, senderPubkey, encryptedContent) {
  const privkey = hexToBytes(privkeyHex)
  return nip04.decrypt(privkey, senderPubkey, encryptedContent)
}

// ─── NIP-57 Zaps ──────────────────────────────────────────────────────────────

/**
 * Create a NIP-57 Zap Request event.
 * The wallet sends this to the recipient's LNURL endpoint to get an invoice.
 */
export function createZapRequest(
  privkeyHex,
  recipientPubkey,
  amountMsats,
  comment = '',
  relays = DEFAULT_RELAYS
) {
  return createEvent(
    privkeyHex,
    9734, // Zap Request
    comment,
    [
      ['p', recipientPubkey],
      ['amount', String(amountMsats)],
      ['relays', ...relays],
      ['lnurl', `lnurl-placeholder`]  // replaced by actual LNURL in production
    ]
  )
}

/**
 * Fetch a Lightning invoice for a Zap from a LNURL endpoint.
 * This calls the user's Lightning Address server.
 */
export async function fetchZapInvoice(lightningAddress, amountMsats, zapRequestEvent) {
  // Convert lightning address to LNURL callback
  const [username, domain] = lightningAddress.split('@')
  const wellKnown = `https://${domain}/.well-known/lnurlp/${username}`

  const lnurlpRes = await fetch(wellKnown)
  const lnurlpData = await lnurlpRes.json()

  if (!lnurlpData.callback) throw new Error('Invalid LNURL response')
  if (amountMsats < lnurlpData.minSendable) throw new Error(`Amount below minimum: ${lnurlpData.minSendable} msats`)
  if (amountMsats > lnurlpData.maxSendable) throw new Error(`Amount above maximum: ${lnurlpData.maxSendable} msats`)

  const callbackUrl = new URL(lnurlpData.callback)
  callbackUrl.searchParams.set('amount', amountMsats)
  if (lnurlpData.allowsNostr && zapRequestEvent) {
    callbackUrl.searchParams.set('nostr', JSON.stringify(zapRequestEvent))
  }

  const invoiceRes = await fetch(callbackUrl.toString())
  const invoiceData = await invoiceRes.json()

  if (invoiceData.status === 'ERROR') throw new Error(invoiceData.reason)
  return invoiceData.pr // BOLT11 invoice
}

// ─── Relay Management ─────────────────────────────────────────────────────────

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.mom'
]

let pool = null

export function getPool() {
  if (!pool) pool = new SimplePool()
  return pool
}

/**
 * Publish a signed event to multiple relays.
 */
export async function publishEvent(event, relays = DEFAULT_RELAYS) {
  const p = getPool()
  const results = await Promise.allSettled(
    p.publish(relays, event)
  )
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  return { succeeded, total: relays.length }
}

/**
 * Fetch a user's profile from relays.
 */
export async function fetchProfile(pubkey, relays = DEFAULT_RELAYS) {
  const p = getPool()
  const event = await p.get(relays, { kinds: [0], authors: [pubkey], limit: 1 })
  if (!event) return null
  try {
    return JSON.parse(event.content)
  } catch {
    return null
  }
}

/**
 * Subscribe to events in real time.
 * Returns an unsubscribe function.
 */
export function subscribeEvents(filters, relays = DEFAULT_RELAYS, onEvent) {
  const p = getPool()
  const sub = p.subscribeMany(relays, filters, {
    onevent: onEvent
  })
  return () => sub.close()
}

// ─── NIP-05 Verification ──────────────────────────────────────────────────────

/**
 * Verify a NIP-05 identifier (user@domain.com).
 */
export async function verifyNip05(identifier, pubkey) {
  const [name, domain] = identifier.split('@')
  try {
    const res = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)
    const data = await res.json()
    return data.names?.[name] === pubkey
  } catch {
    return false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

/**
 * Shorten a pubkey for display: npub1abc...xyz
 */
export function shortPubkey(npub) {
  if (!npub) return ''
  return npub.slice(0, 10) + '...' + npub.slice(-6)
}

/**
 * Validate a Nostr public key (hex or npub).
 */
export function isValidPubkey(str) {
  if (!str) return false
  if (str.startsWith('npub1')) {
    try { nip19.decode(str); return true } catch { return false }
  }
  return /^[0-9a-f]{64}$/.test(str)
}
