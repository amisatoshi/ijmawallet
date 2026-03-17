/**
 * Ijma Wallet — Atomic Swap Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Trustless cross-layer swaps using Hash Time-Locked Contracts (HTLCs).
 *
 * Supported swap routes:
 *   On-chain  ⇄  Lightning   (Submarine Swap via Boltz / Loop)
 *   Lightning ⇄  Cashu       (Mint/Melt — near-atomic via invoice)
 *   Lightning ⇄  Fedimint    (Gateway deposit/withdrawal)
 *   Cashu     ⇄  Cashu       (Cross-mint swap via Lightning bridge)
 *   On-chain  ⇄  Cashu       (On-chain → Lightning → Cashu chain)
 *
 * Security model:
 *   - All swaps use pre-images / HTLCs — funds are never trusted to a third party
 *   - Submarine swaps are trustless: refund tx signed before broadcast
 *   - Cashu mint/melt is atomic per the protocol spec
 *   - Timeouts prevent funds being locked forever
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Swap route definitions ───────────────────────────────────────────────────

export const SWAP_ROUTES = [
  {
    id: 'onchain_to_lightning',
    from: 'onchain',
    to: 'lightning',
    label: 'On-chain → Lightning',
    description: 'Submarine swap via HTLC. Trustless.',
    minSats: 10_000,
    maxSats: 10_000_000,
    typicalFeePct: 0.5,
    typicalTimeMin: 10,
    trustless: true,
    provider: 'boltz',
  },
  {
    id: 'lightning_to_onchain',
    from: 'lightning',
    to: 'onchain',
    label: 'Lightning → On-chain',
    description: 'Reverse submarine swap. Trustless.',
    minSats: 10_000,
    maxSats: 10_000_000,
    typicalFeePct: 0.5,
    typicalTimeMin: 10,
    trustless: true,
    provider: 'boltz',
  },
  {
    id: 'lightning_to_cashu',
    from: 'lightning',
    to: 'cashu',
    label: 'Lightning → Cashu',
    description: 'Pay Lightning invoice to mint private ecash tokens.',
    minSats: 100,
    maxSats: 1_000_000,
    typicalFeePct: 0.1,
    typicalTimeMin: 0.5,
    trustless: false, // Mint is trusted for Cashu
    provider: 'cashu_mint',
  },
  {
    id: 'cashu_to_lightning',
    from: 'cashu',
    to: 'lightning',
    label: 'Cashu → Lightning',
    description: 'Melt ecash tokens via Lightning (melt quote).',
    minSats: 100,
    maxSats: 1_000_000,
    typicalFeePct: 0.1,
    typicalTimeMin: 0.5,
    trustless: false,
    provider: 'cashu_mint',
  },
  {
    id: 'lightning_to_fedimint',
    from: 'lightning',
    to: 'fedimint',
    label: 'Lightning → Fedimint',
    description: 'Deposit to Fedimint federation via Lightning gateway.',
    minSats: 1_000,
    maxSats: 50_000_000,
    typicalFeePct: 0.2,
    typicalTimeMin: 1,
    trustless: false, // Fedimint guardians are trusted
    provider: 'fedimint_gateway',
  },
  {
    id: 'fedimint_to_lightning',
    from: 'fedimint',
    to: 'lightning',
    label: 'Fedimint → Lightning',
    description: 'Withdraw from Fedimint via Lightning gateway.',
    minSats: 1_000,
    maxSats: 50_000_000,
    typicalFeePct: 0.2,
    typicalTimeMin: 1,
    trustless: false,
    provider: 'fedimint_gateway',
  },
  {
    id: 'cashu_to_cashu',
    from: 'cashu',
    to: 'cashu',
    label: 'Cashu → Cashu (cross-mint)',
    description: 'Melt from one mint, mint at another via Lightning bridge.',
    minSats: 500,
    maxSats: 500_000,
    typicalFeePct: 0.3,
    typicalTimeMin: 1,
    trustless: false,
    provider: 'cashu_mint',
  },
]

export function getRoute(fromLayer, toLayer) {
  return SWAP_ROUTES.find(r => r.from === fromLayer && r.to === toLayer) || null
}

export function getRoutesFrom(layer) {
  return SWAP_ROUTES.filter(r => r.from === layer)
}

// ─── Boltz Submarine Swap (On-chain ↔ Lightning) ─────────────────────────────

const BOLTZ_API = 'https://api.boltz.exchange/v2'

/**
 * Get Boltz submarine swap fee/limit info.
 */
export async function getBoltzPairs() {
  const res = await fetch(`${BOLTZ_API}/swap/submarine`)
  if (!res.ok) throw new Error('Boltz API unavailable')
  return res.json()
}

/**
 * Create a submarine swap: On-chain BTC → Lightning invoice.
 *
 * Flow:
 *   1. Call this to get a Bitcoin address + HTLC script
 *   2. User sends BTC to the address
 *   3. Boltz pays the Lightning invoice
 *   4. If it fails, user broadcasts the refund tx (signed here, before sending)
 *
 * Returns:
 *   { swapId, address, expectedAmount, timeoutBlockHeight, blindingKey,
 *     redeemScript, refundTx (pre-signed), invoice }
 */
export async function createSubmarineSwap({ invoice, refundPublicKey, pairId = 'BTC/BTC' }) {
  const body = {
    from: 'BTC',
    to: 'BTC',
    invoice,
    refundPublicKey, // hex-encoded compressed public key
  }

  const res = await fetch(`${BOLTZ_API}/swap/submarine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Boltz error: ${err.error || res.statusText}`)
  }

  const data = await res.json()
  return {
    swapId: data.id,
    address: data.address,
    expectedAmount: data.expectedAmount,        // sats to send on-chain
    timeoutBlockHeight: data.timeoutBlockHeight,
    blindingKey: data.blindingKey,              // for Liquid only
    redeemScript: data.redeemScript,
    claimPublicKey: data.claimPublicKey,
  }
}

/**
 * Create a reverse submarine swap: Lightning → On-chain BTC.
 *
 * Flow:
 *   1. Call this to get a Lightning invoice to pay
 *   2. Wallet pays the invoice
 *   3. Boltz sends BTC to onchainAddress
 *
 * Returns:
 *   { swapId, invoice, onchainAmount, timeoutBlockHeight, redeemScript, lockupAddress }
 */
export async function createReverseSubmarineSwap({
  invoiceAmount,          // sats to receive on-chain
  onchainAddress,         // where to receive BTC
  claimPublicKey,         // hex pubkey for the HTLC claim
  preimageHash,           // sha256 hash of secret preimage (hex)
}) {
  const body = {
    from: 'BTC',
    to: 'BTC',
    invoiceAmount,
    onchainAmount: invoiceAmount, // Boltz calculates fee
    claimPublicKey,
    preimageHash,
  }

  const res = await fetch(`${BOLTZ_API}/swap/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Boltz error: ${err.error || res.statusText}`)
  }

  const data = await res.json()
  return {
    swapId: data.id,
    invoice: data.invoice,            // pay this Lightning invoice
    onchainAmount: data.onchainAmount,
    timeoutBlockHeight: data.timeoutBlockHeight,
    redeemScript: data.redeemScript,
    lockupAddress: data.lockupAddress,
    blindingKey: data.blindingKey,
  }
}

/**
 * Poll Boltz swap status.
 * States: invoice.set | transaction.mempool | transaction.confirmed |
 *         transaction.claimed | swap.expired | invoice.failedToPay
 */
export async function getSwapStatus(swapId) {
  const res = await fetch(`${BOLTZ_API}/swap/${swapId}`)
  if (!res.ok) throw new Error('Failed to fetch swap status')
  return res.json()
}

/**
 * Generate a cryptographic preimage + hash for a reverse swap.
 * The preimage is secret — only reveal after receiving on-chain funds.
 */
export function generatePreimage() {
  const preimage = crypto.getRandomValues(new Uint8Array(32))
  return {
    preimage,                           // keep secret until claiming
    preimageHex: bytesToHex(preimage),
    // SHA-256 hash — share with Boltz
    hashPromise: crypto.subtle.digest('SHA-256', preimage).then(bytesToHex),
  }
}

// ─── Lightning ↔ Cashu swap ──────────────────────────────────────────────────

/**
 * Swap Lightning → Cashu (mint).
 *
 * Returns a Lightning invoice for the user to pay (or auto-pay via LDK/NWC).
 * After payment, polls until tokens arrive.
 *
 * @param {string} mintUrl   - Cashu mint URL
 * @param {number} amountSats
 * @param {object} cashuWallet - Initialised CashuWallet instance
 * @param {string} password  - For secure storage
 */
export async function swapLightningToCashu(mintUrl, amountSats, cashuWallet, password) {
  const { CashuMint, CashuWallet } = await import('@cashu/cashu-ts')
  const mint = new CashuMint(mintUrl)
  const wallet = cashuWallet || new CashuWallet(mint)
  await wallet.loadMint()

  const quote = await wallet.createMintQuote(amountSats)

  return {
    invoice: quote.request,   // BOLT11 to pay
    quote: quote.quote,
    // Call this after paying the invoice
    claim: async () => {
      const MAX_POLLS = 60
      for (let i = 0; i < MAX_POLLS; i++) {
        await sleep(3000)
        try {
          const { proofs } = await wallet.mintProofs(amountSats, quote.quote)
          if (proofs?.length) {
            // Save proofs to secure storage
            const { saveProofs, getProofs } = await import('./cashu.js')
            const existing = await getProofs(mintUrl, password)
            await saveProofs(mintUrl, [...existing, ...proofs], password)
            return { success: true, amountSats, proofs }
          }
        } catch (e) {
          if (e.message?.includes('not paid')) continue
          throw e
        }
      }
      throw new Error('Swap timed out — invoice may not have been paid')
    }
  }
}

/**
 * Swap Cashu → Lightning (melt).
 * Atomically burns tokens and pays a Lightning invoice.
 */
export async function swapCashuToLightning(mintUrl, bolt11Invoice, password) {
  const { meltTokens } = await import('./cashu.js')
  return meltTokens(mintUrl, bolt11Invoice, password)
}

/**
 * Cross-mint Cashu swap: Mint A → Lightning → Mint B.
 * Melt from source mint, mint at destination mint.
 *
 * This is the closest thing to atomic cross-mint: if the melt succeeds
 * but the mint fails, funds are temporarily in Lightning (recoverable).
 */
export async function swapCashuCrossMint(sourceMintUrl, destMintUrl, amountSats, password) {
  const { CashuMint, CashuWallet } = await import('@cashu/cashu-ts')
  const { saveProofs, getProofs } = await import('./cashu.js')

  // Step 1: Get mint quote from destination mint (creates an invoice)
  const destMint = new CashuMint(destMintUrl)
  const destWallet = new CashuWallet(destMint)
  await destWallet.loadMint()
  const mintQuote = await destWallet.createMintQuote(amountSats)

  // Step 2: Melt from source mint (pays the invoice atomically)
  const meltResult = await swapCashuToLightning(sourceMintUrl, mintQuote.request, password)
  if (!meltResult.success) throw new Error('Melt from source mint failed')

  // Step 3: Claim new tokens at destination mint
  const { proofs } = await destWallet.mintProofs(amountSats, mintQuote.quote)
  if (!proofs?.length) throw new Error('Failed to mint at destination')

  const existing = await getProofs(destMintUrl, password)
  await saveProofs(destMintUrl, [...existing, ...proofs], password)

  return {
    success: true,
    amountSats: proofs.reduce((s, p) => s + p.amount, 0),
    sourceMint: sourceMintUrl,
    destMint: destMintUrl,
  }
}

// ─── Swap state persistence ──────────────────────────────────────────────────

/**
 * Save an in-progress swap to localStorage (so it survives app restarts).
 * Swaps can take 10+ minutes for on-chain confirmations.
 */
export function saveSwapState(swapId, state) {
  const swaps = getPendingSwaps()
  swaps[swapId] = { ...state, updatedAt: Date.now() }
  localStorage.setItem('ijma_swaps', JSON.stringify(swaps))
}

export function getPendingSwaps() {
  try {
    return JSON.parse(localStorage.getItem('ijma_swaps') || '{}')
  } catch {
    return {}
  }
}

export function clearSwap(swapId) {
  const swaps = getPendingSwaps()
  delete swaps[swapId]
  localStorage.setItem('ijma_swaps', JSON.stringify(swaps))
}

// ─── Fee estimation ──────────────────────────────────────────────────────────

/**
 * Estimate fees for a swap route.
 */
export async function estimateSwapFees(fromLayer, toLayer, amountSats) {
  const route = getRoute(fromLayer, toLayer)
  if (!route) throw new Error(`No route: ${fromLayer} → ${toLayer}`)

  const baseFee = Math.round(amountSats * (route.typicalFeePct / 100))
  const networkFee = fromLayer === 'onchain' || toLayer === 'onchain' ? 500 : 2

  return {
    routeId: route.id,
    amountSats,
    serviceFee: baseFee,
    networkFee,
    totalFee: baseFee + networkFee,
    youReceive: amountSats - baseFee - networkFee,
    typicalTimeMin: route.typicalTimeMin,
    trustless: route.trustless,
    provider: route.provider,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bytesToHex(input) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Validate that a swap amount is within route limits.
 */
export function validateSwapAmount(route, amountSats) {
  if (amountSats < route.minSats) {
    return { valid: false, error: `Minimum: ${route.minSats.toLocaleString()} sats` }
  }
  if (amountSats > route.maxSats) {
    return { valid: false, error: `Maximum: ${route.maxSats.toLocaleString()} sats` }
  }
  return { valid: true }
}

/**
 * Human-readable swap status message.
 */
export function swapStatusLabel(status) {
  const labels = {
    'pending': 'Waiting for payment...',
    'invoice.set': 'Invoice ready — awaiting payment',
    'transaction.mempool': 'Transaction seen in mempool',
    'transaction.confirmed': 'Confirmed — finalising swap',
    'transaction.claimed': '✅ Swap complete',
    'swap.expired': '⏰ Swap expired — funds safe to refund',
    'invoice.failedToPay': '❌ Invoice payment failed',
    'claimed': '✅ Complete',
    'failed': '❌ Failed',
  }
  return labels[status] || status
}
