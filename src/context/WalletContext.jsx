/**
 * Ijma Wallet — Global Wallet Context
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages wallet state, session, and provides all wallet operations
 * to child components. Seed phrase NEVER held in plain text after setup.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { generateMnemonicPhrase, validateMnemonicPhrase, mnemonicToRoot, deriveAddresses, fetchBtcPrice, fetchFeeRates } from '../lib/bitcoin.js'
import { nostrKeypairFromMnemonic } from '../lib/nostr.js'
import { secureSet, secureGet, walletExists, encryptData, generateSalt, hashPin } from '../lib/security.js'

// ─── Initial State ─────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  // App state
  status: 'loading',           // 'loading' | 'no_wallet' | 'locked' | 'unlocked'
  error: null,

  // Session (cleared on lock)
  session: null,
  /*  session = {
        password: string          (PIN/passphrase used for this session)
        btcRoot: HDKey             (derived from seed, in memory only)
        nostr: { pubkey, privkey, npub, nsec }
        unlockedAt: timestamp
      }
  */

  // Wallet metadata (not sensitive — stored unencrypted)
  meta: null,
  /*  meta = {
        createdAt: timestamp
        network: 'mainnet' | 'testnet'
        hasPassphrase: boolean
        hasBiometric: boolean
        addressType: 'segwit' | 'taproot'
        username: string
        npub: string             (public — safe to store plain)
        lightningAddress: string
      }
  */

  // Live data
  btcPrice: null,
  feeRates: null,
  balances: {
    onchain: 0,
    lightning: 0,      // placeholder — needs LDK/Breez SDK
    cashu: 0,
    fedimint: 0
  },
  addresses: [],
  transactions: [],
  powerMode: false,
  shariahMode: true,   // on by default — wallet is halal-first
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS': return { ...state, status: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload }
    case 'SET_SESSION': return { ...state, session: action.payload, status: action.payload ? 'unlocked' : 'locked' }
    case 'SET_META': return { ...state, meta: action.payload }
    case 'SET_PRICE': return { ...state, btcPrice: action.payload }
    case 'SET_FEES': return { ...state, feeRates: action.payload }
    case 'SET_BALANCES': return { ...state, balances: { ...state.balances, ...action.payload } }
    case 'SET_ADDRESSES': return { ...state, addresses: action.payload }
    case 'SET_TRANSACTIONS': return { ...state, transactions: action.payload }
    case 'TOGGLE_POWER': return { ...state, powerMode: !state.powerMode }
    case 'TOGGLE_SHARIAH': return { ...state, shariahMode: !state.shariahMode }
    case 'LOCK':
      return {
        ...state,
        session: null,
        status: 'locked',
        // Clear sensitive data from memory
        addresses: [],
        transactions: []
      }
    case 'RESET': return { ...INITIAL_STATE, status: 'no_wallet' }
    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  // ── Initialise on mount ────────────────────────────────────────────────────
  useEffect(() => {
    init()
  }, [])

  // ── Auto-lock after 5 minutes of no activity ──────────────────────────────
  useEffect(() => {
    if (state.status !== 'unlocked') return
    const id = setTimeout(() => {
      dispatch({ type: 'LOCK' })
    }, 5 * 60 * 1000)
    return () => clearTimeout(id)
  }, [state.status, state.session?.unlockedAt])

  // ── Fetch price every 60 seconds ──────────────────────────────────────────
  useEffect(() => {
    if (state.status !== 'unlocked') return
    const load = async () => {
      try {
        const price = await fetchBtcPrice('gbp')
        if (price) dispatch({ type: 'SET_PRICE', payload: price })
        const fees = await fetchFeeRates()
        if (fees) dispatch({ type: 'SET_FEES', payload: fees })
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [state.status])

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function init() {
    dispatch({ type: 'SET_STATUS', payload: 'loading' })
    try {
      const exists = await walletExists()
      const meta = JSON.parse(localStorage.getItem('ijma_meta') || 'null')
      if (exists && meta) {
        dispatch({ type: 'SET_META', payload: meta })
        dispatch({ type: 'SET_STATUS', payload: 'locked' })
      } else {
        dispatch({ type: 'SET_STATUS', payload: 'no_wallet' })
      }
    } catch (e) {
      dispatch({ type: 'SET_STATUS', payload: 'no_wallet' })
    }
  }

  /**
   * Create a brand new wallet from a generated mnemonic.
   */
  async function createWallet({ mnemonic, pin, passphrase = '', username = '', network = 'mainnet' }) {
    if (!validateMnemonicPhrase(mnemonic)) throw new Error('Invalid mnemonic')
    if (!pin || pin.length < 6) throw new Error('PIN must be at least 6 digits')

    const salt = generateSalt()
    const pinHash = await hashPin(pin, salt)
    // Use PIN + salt as encryption password for the vault
    const vaultPassword = pin + salt

    // Derive keys
    const root = mnemonicToRoot(mnemonic, passphrase)
    const nostrKeys = nostrKeypairFromMnemonic(mnemonic)

    // Encrypt and store the seed phrase
    await secureSet('mnemonic', mnemonic, vaultPassword)
    await secureSet('wallet_meta', { createdAt: Date.now() }, vaultPassword)

    // Store PIN hash + salt (not sensitive)
    localStorage.setItem('ijma_pin_salt', salt)
    localStorage.setItem('ijma_pin_hash', pinHash)

    // Store wallet metadata (public info only)
    const meta = {
      createdAt: Date.now(),
      network,
      hasPassphrase: !!passphrase,
      hasBiometric: false,
      addressType: 'segwit',
      username: username || 'ijma_user',
      npub: nostrKeys.npub,
      lightningAddress: username ? `${username}@ijma.app` : null
    }
    localStorage.setItem('ijma_meta', JSON.stringify(meta))
    dispatch({ type: 'SET_META', payload: meta })

    // Derive first addresses
    const addresses = deriveAddresses(root, 5, 'segwit', network)
    dispatch({ type: 'SET_ADDRESSES', payload: addresses })

    // Start session
    dispatch({
      type: 'SET_SESSION',
      payload: { password: vaultPassword, btcRoot: root, nostr: nostrKeys, unlockedAt: Date.now() }
    })

    return { mnemonic, nostrKeys, addresses }
  }

  /**
   * Restore a wallet from existing mnemonic.
   */
  async function restoreWallet({ mnemonic, pin, passphrase = '', network = 'mainnet' }) {
    if (!validateMnemonicPhrase(mnemonic)) throw new Error('Invalid mnemonic phrase')
    // Reuse createWallet flow
    return createWallet({ mnemonic, pin, passphrase, network })
  }

  /**
   * Unlock an existing wallet with PIN.
   */
  async function unlockWithPin(pin) {
    const salt = localStorage.getItem('ijma_pin_salt')
    const storedHash = localStorage.getItem('ijma_pin_hash')
    if (!salt || !storedHash) throw new Error('No PIN registered')

    const hash = await hashPin(pin, salt)
    if (hash !== storedHash) throw new Error('Incorrect PIN')

    const vaultPassword = pin + salt
    const mnemonic = await secureGet('mnemonic', vaultPassword)
    if (!mnemonic) throw new Error('Failed to decrypt wallet — wrong PIN')

    const meta = JSON.parse(localStorage.getItem('ijma_meta') || '{}')
    const root = mnemonicToRoot(mnemonic, '') // passphrase not stored — user must enter separately
    const nostrKeys = nostrKeypairFromMnemonic(mnemonic)
    const addresses = deriveAddresses(root, 5, 'segwit', meta.network || 'mainnet')

    dispatch({ type: 'SET_ADDRESSES', payload: addresses })
    dispatch({
      type: 'SET_SESSION',
      payload: { password: vaultPassword, btcRoot: root, nostr: nostrKeys, unlockedAt: Date.now() }
    })

    return true
  }

  function lock() {
    dispatch({ type: 'LOCK' })
  }

  function togglePowerMode() {
    dispatch({ type: 'TOGGLE_POWER' })
  }

  function toggleShariahMode() {
    dispatch({ type: 'TOGGLE_SHARIAH' })
  }

  /**
   * Wipe all wallet data (nuclear option).
   * User must confirm with PIN first.
   */
  async function wipeWallet(pin) {
    const salt = localStorage.getItem('ijma_pin_salt')
    const storedHash = localStorage.getItem('ijma_pin_hash')
    const hash = await hashPin(pin, salt)
    if (hash !== storedHash) throw new Error('Incorrect PIN')

    localStorage.clear()
    indexedDB.deleteDatabase('ijma-secure')
    dispatch({ type: 'RESET' })
  }

  return (
    <WalletContext.Provider value={{
      ...state,
      createWallet,
      restoreWallet,
      unlockWithPin,
      lock,
      togglePowerMode,
      toggleShariahMode,
      wipeWallet,
      dispatch
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
