/**
 * Ijma Wallet — Cashu Ecash Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Real Cashu ecash using @cashu/cashu-ts.
 * Chaumian blind signatures — the mint cannot link minting to spending.
 * Tokens are stored encrypted in IndexedDB.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CashuMint, CashuWallet, getEncodedToken, getDecodedToken } from '@cashu/cashu-ts'
import { secureSet, secureGet } from './security.js'

// ─── Well-known public mints for discovery ─────────────────────────────────────
export const KNOWN_MINTS = [
  {
    url: 'https://mint.minibits.cash/Bitcoin',
    name: 'Minibits',
    description: 'Public Cashu mint by Minibits wallet',
    icon: '🪙'
  },
  {
    url: 'https://legend.lnbits.com/cashu/api/v1/4gr9Xcmz3XEkUNwiBiQGoC',
    name: 'LNbits Legend',
    description: 'Public LNbits Cashu mint',
    icon: '⚡'
  }
]

// ─── Mint Management ──────────────────────────────────────────────────────────

/**
 * Connect to a Cashu mint and fetch its info/keysets.
 */
export async function connectMint(mintUrl) {
  const mint = new CashuMint(mintUrl)
  const info = await mint.getInfo()
  const keys = await mint.getKeys()
  return { mint, info, keys }
}

/**
 * Get all stored mints from secure storage.
 */
export async function getStoredMints(password) {
  return await secureGet('cashu_mints', password) || []
}

/**
 * Add a new mint to secure storage.
 */
export async function addMint(mintUrl, password) {
  const mints = await getStoredMints(password)
  if (mints.find(m => m.url === mintUrl)) {
    throw new Error('Mint already added')
  }
  const { info } = await connectMint(mintUrl)
  const newMint = {
    url: mintUrl,
    name: info?.name || mintUrl,
    description: info?.description || '',
    addedAt: Date.now()
  }
  await secureSet('cashu_mints', [...mints, newMint], password)
  return newMint
}

// ─── Token Storage ─────────────────────────────────────────────────────────────

/**
 * Get all stored Cashu proofs (tokens) for a mint.
 * Proofs are the actual ecash — protect these carefully.
 */
export async function getProofs(mintUrl, password) {
  const key = `cashu_proofs_${btoa(mintUrl)}`
  return await secureGet(key, password) || []
}

/**
 * Save proofs to secure storage.
 */
export async function saveProofs(mintUrl, proofs, password) {
  const key = `cashu_proofs_${btoa(mintUrl)}`
  await secureSet(key, proofs, password)
}

/**
 * Get total balance for a mint in sats.
 */
export async function getMintBalance(mintUrl, password) {
  const proofs = await getProofs(mintUrl, password)
  return proofs.reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Get total balance across all mints.
 */
export async function getTotalCashuBalance(password) {
  const mints = await getStoredMints(password)
  let total = 0
  for (const mint of mints) {
    total += await getMintBalance(mint.url, password)
  }
  return total
}

// ─── Mint (deposit Lightning → Cashu tokens) ─────────────────────────────────

/**
 * Request a Lightning invoice from the mint.
 * User pays this invoice to receive Cashu tokens.
 * 
 * Returns: { invoice (BOLT11), checkMinting (fn to call after payment) }
 */
export async function requestMintInvoice(mintUrl, amountSats, password) {
  const mint = new CashuMint(mintUrl)
  const wallet = new CashuWallet(mint)
  await wallet.loadMint()

  const mintQuote = await wallet.createMintQuote(amountSats)

  // Return a function the caller can poll after paying the invoice
  const checkMinting = async () => {
    try {
      const { proofs } = await wallet.mintProofs(amountSats, mintQuote.quote)
      if (proofs && proofs.length > 0) {
        // Merge with existing proofs
        const existing = await getProofs(mintUrl, password)
        await saveProofs(mintUrl, [...existing, ...proofs], password)
        return { success: true, proofs, amountSats }
      }
      return { success: false, pending: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  return {
    invoice: mintQuote.request,   // BOLT11 to pay
    quote: mintQuote.quote,
    checkMinting
  }
}

// ─── Melt (Cashu tokens → Lightning payment) ─────────────────────────────────

/**
 * Pay a Lightning invoice using Cashu tokens (melt).
 * This converts ecash back to Lightning.
 */
export async function meltTokens(mintUrl, bolt11Invoice, password) {
  const mint = new CashuMint(mintUrl)
  const wallet = new CashuWallet(mint)
  await wallet.loadMint()

  const proofs = await getProofs(mintUrl, password)
  if (!proofs.length) throw new Error('No tokens available')

  const meltQuote = await wallet.createMeltQuote(bolt11Invoice)
  const totalNeeded = meltQuote.amount + meltQuote.fee_reserve

  // Select proofs to cover the amount
  const { send: selectedProofs, keep: changeProofs } = await wallet.send(
    totalNeeded,
    proofs
  )

  const result = await wallet.meltProofs(meltQuote, selectedProofs)

  // Save remaining proofs
  const allChange = [...changeProofs]
  if (result.change) allChange.push(...result.change)
  await saveProofs(mintUrl, allChange, password)

  return {
    success: result.state === 'PAID',
    amountPaid: meltQuote.amount,
    fee: meltQuote.fee_reserve,
    preimage: result.payment_preimage
  }
}

// ─── Send tokens (Cashu → Cashu) ──────────────────────────────────────────────

/**
 * Create a sendable Cashu token (encoded string to share via NFC/DM/QR).
 * This is like digital cash — once the token is created, it's spendable by anyone.
 */
export async function createSendToken(mintUrl, amountSats, password) {
  const mint = new CashuMint(mintUrl)
  const wallet = new CashuWallet(mint)
  await wallet.loadMint()

  const proofs = await getProofs(mintUrl, password)
  if (!proofs.length) throw new Error('No tokens available')

  const { send: sendProofs, keep: keepProofs } = await wallet.send(amountSats, proofs)

  // Save the proofs we're keeping
  await saveProofs(mintUrl, keepProofs, password)

  // Encode the send proofs as a cashu token string
  const token = getEncodedToken({
    token: [{ mint: mintUrl, proofs: sendProofs }]
  })

  return token // This is the "digital cash" — share via QR, NFC, DM
}

// ─── Receive tokens ────────────────────────────────────────────────────────────

/**
 * Receive a Cashu token string and swap it for fresh proofs.
 * Swapping prevents double-spend detection by the mint.
 */
export async function receiveToken(tokenString, password) {
  const decoded = getDecodedToken(tokenString)
  const mintUrl = decoded.token[0].mint
  const incomingProofs = decoded.token[0].proofs

  const mint = new CashuMint(mintUrl)
  const wallet = new CashuWallet(mint)
  await wallet.loadMint()

  // Swap for fresh proofs (breaks link between sender and receiver)
  const { proofs: freshProofs } = await wallet.receiveTokenEntry(
    decoded.token[0]
  )

  const existing = await getProofs(mintUrl, password)
  await saveProofs(mintUrl, [...existing, ...freshProofs], password)

  const amount = freshProofs.reduce((s, p) => s + p.amount, 0)
  return { success: true, amount, mintUrl }
}

// ─── Token validation ─────────────────────────────────────────────────────────

/**
 * Check if proofs are still valid (not spent) on the mint.
 * Use sparingly — preserves privacy.
 */
export async function checkProofsSpent(mintUrl, proofs) {
  const mint = new CashuMint(mintUrl)
  const wallet = new CashuWallet(mint)
  await wallet.loadMint()
  const spentProofs = await wallet.checkProofsSpent(proofs)
  return spentProofs
}

/**
 * Parse a cashu token string to get amount and mint.
 */
export function parseToken(tokenString) {
  try {
    const decoded = getDecodedToken(tokenString)
    const mintUrl = decoded.token[0].mint
    const amount = decoded.token[0].proofs.reduce((s, p) => s + p.amount, 0)
    return { valid: true, amount, mintUrl, token: decoded }
  } catch {
    return { valid: false }
  }
}
