/**
 * Ijma Wallet — Bitcoin Key Derivation
 * ─────────────────────────────────────────────────────────────────────────────
 * BIP39 mnemonic generation, BIP84 (Native SegWit) and BIP86 (Taproot)
 * address derivation, balance fetching from Mempool.space.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { HDKey } from '@scure/bip32'

// ─── Mnemonic ─────────────────────────────────────────────────────────────────

/**
 * Generate a fresh BIP39 mnemonic (24 words = 256-bit entropy).
 */
export function generateMnemonicPhrase(strength = 256) {
  return generateMnemonic(wordlist, strength)
}

/**
 * Validate a BIP39 mnemonic.
 */
export function validateMnemonicPhrase(mnemonic) {
  return validateMnemonic(mnemonic.trim().toLowerCase(), wordlist)
}

/**
 * Derive a root HDKey from mnemonic + optional passphrase.
 */
export function mnemonicToRoot(mnemonic, passphrase = '') {
  const seed = mnemonicToSeedSync(mnemonic.trim().toLowerCase(), passphrase)
  return HDKey.fromMasterSeed(seed)
}

// ─── Address Derivation ───────────────────────────────────────────────────────

const NETWORKS = {
  mainnet: {
    bech32: 'bc',
    bip84Path: "m/84'/0'/0'",
    bip86Path: "m/86'/0'/0'"
  },
  testnet: {
    bech32: 'tb',
    bip84Path: "m/84'/1'/0'",
    bip86Path: "m/86'/1'/0'"
  }
}

/**
 * Derive a Native SegWit (P2WPKH / BIP84) receiving address.
 * index: 0, 1, 2... for gap limit management
 */
export function deriveSegwitAddress(root, index = 0, network = 'mainnet') {
  const path = `${NETWORKS[network].bip84Path}/0/${index}`
  const child = root.derive(path)
  const pubkey = child.publicKey
  return {
    address: pubkeyToP2WPKH(pubkey, NETWORKS[network].bech32),
    path,
    pubkey: bytesToHex(pubkey),
    index
  }
}

/**
 * Derive a Taproot (P2TR / BIP86) receiving address.
 */
export function deriveTaprootAddress(root, index = 0, network = 'mainnet') {
  const path = `${NETWORKS[network].bip86Path}/0/${index}`
  const child = root.derive(path)
  const pubkey = child.publicKey
  return {
    address: pubkeyToP2TR(pubkey, NETWORKS[network].bech32),
    path,
    pubkey: bytesToHex(pubkey),
    index
  }
}

/**
 * Get the first N receiving addresses (for display).
 */
export function deriveAddresses(root, count = 5, type = 'segwit', network = 'mainnet') {
  return Array.from({ length: count }, (_, i) =>
    type === 'taproot'
      ? deriveTaprootAddress(root, i, network)
      : deriveSegwitAddress(root, i, network)
  )
}

// ─── Bech32 encoding (simplified — use bitcoinjs-lib in production) ────────────

function pubkeyToP2WPKH(pubkey, hrp) {
  // In production, use bitcoinjs-lib for proper bech32 encoding
  // This is a display placeholder for the demo
  const hash = Array.from(pubkey).reduce((acc, b, i) => acc + (b * (i + 1)), 0)
  return `${hrp}1q${Math.abs(hash).toString(16).padStart(38, '0').slice(0, 38)}`
}

function pubkeyToP2TR(pubkey, hrp) {
  const hash = Array.from(pubkey).reduce((acc, b, i) => acc + (b * (i + 2)), 0)
  return `${hrp}1p${Math.abs(hash).toString(16).padStart(57, '0').slice(0, 57)}`
}

// ─── Mempool.space API ────────────────────────────────────────────────────────

const MEMPOOL_API = 'https://mempool.space/api'
const MEMPOOL_TESTNET = 'https://mempool.space/testnet/api'

/**
 * Fetch address balance from Mempool.space.
 * Returns { funded_txo_sum, spent_txo_sum, confirmed_balance, unconfirmed_balance }
 */
export async function fetchAddressBalance(address, network = 'mainnet') {
  const base = network === 'mainnet' ? MEMPOOL_API : MEMPOOL_TESTNET
  const res = await fetch(`${base}/address/${address}`)
  if (!res.ok) throw new Error('Failed to fetch address')
  const data = await res.json()
  return {
    confirmed: data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
    unconfirmed: data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum,
    txCount: data.chain_stats.tx_count + data.mempool_stats.tx_count
  }
}

/**
 * Fetch transactions for an address.
 */
export async function fetchAddressTxs(address, network = 'mainnet') {
  const base = network === 'mainnet' ? MEMPOOL_API : MEMPOOL_TESTNET
  const res = await fetch(`${base}/address/${address}/txs`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

/**
 * Fetch current fee rates from Mempool.space.
 */
export async function fetchFeeRates() {
  const res = await fetch(`${MEMPOOL_API}/v1/fees/recommended`)
  if (!res.ok) throw new Error('Failed to fetch fees')
  return res.json()
  // Returns: { fastestFee, halfHourFee, hourFee, economyFee, minimumFee }
}

/**
 * Fetch BTC price in GBP from CoinGecko.
 */
export async function fetchBtcPrice(currency = 'gbp') {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}`
    )
    const data = await res.json()
    return data.bitcoin[currency]
  } catch {
    return null
  }
}

// ─── Wallet Scanning ──────────────────────────────────────────────────────────

/**
 * Scan wallet to find all addresses with transactions (gap limit: 20).
 * Returns total confirmed balance and all used addresses.
 */
export async function scanWallet(root, type = 'segwit', network = 'mainnet', gapLimit = 20) {
  const usedAddresses = []
  let totalBalance = 0
  let gap = 0
  let index = 0

  while (gap < gapLimit) {
    const addr = type === 'taproot'
      ? deriveTaprootAddress(root, index, network)
      : deriveSegwitAddress(root, index, network)

    try {
      const balance = await fetchAddressBalance(addr.address, network)
      if (balance.txCount > 0) {
        usedAddresses.push({ ...addr, ...balance })
        totalBalance += balance.confirmed + balance.unconfirmed
        gap = 0
      } else {
        gap++
      }
    } catch {
      gap++
    }
    index++
  }

  return { addresses: usedAddresses, totalBalance, nextIndex: index - gapLimit }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Format sats for display.
 */
export function formatSats(sats, showUnit = true) {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M${showUnit ? ' sats' : ''}`
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(0)}k${showUnit ? ' sats' : ''}`
  return `${sats}${showUnit ? ' sats' : ''}`
}

/**
 * Convert sats to BTC string.
 */
export function satsToBtc(sats) {
  return (sats / 1e8).toFixed(8)
}

/**
 * Convert BTC to sats.
 */
export function btcToSats(btc) {
  return Math.round(btc * 1e8)
}
