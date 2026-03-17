/**
 * Ijma Wallet — Network Providers Registry
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised registry of all configurable external services:
 *   - Block explorers (Mempool.space, Blockstream, Bitaps, self-hosted)
 *   - BTC price feeds (CoinGecko, Kraken, Binance, Bisq, self-hosted)
 *   - Fiat exchange rates (ECB, Frankfurter, Open Exchange Rates)
 *   - Electrum servers (public + self-hosted)
 *   - Bitcoin full nodes (Bitcoin Core RPC, Electrum)
 *   - Lightning nodes (LND REST, CLN REST, Eclair, Breez SDK)
 *
 * Privacy tiers:
 *   HIGH    — self-hosted or Tor-accessible, no third-party data sharing
 *   MEDIUM  — reputable operator, open source software
 *   LOW     — centralised, may log IP addresses or query patterns
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Block Explorers ──────────────────────────────────────────────────────────

export const BLOCK_EXPLORERS = [
  {
    id: 'mempool_space',
    name: 'Mempool.space',
    url: 'https://mempool.space',
    api: 'https://mempool.space/api',
    tor: 'http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2roid.onion/api',
    description: 'Open source. Self-hostable. Best fee estimates.',
    openSource: true,
    selfHostable: true,
    privacy: 'MEDIUM',
    features: ['fees', 'transactions', 'blocks', 'address', 'utxo', 'lightning'],
    docsUrl: 'https://github.com/mempool/mempool',
    recommended: true,
  },
  {
    id: 'blockstream',
    name: 'Blockstream Explorer',
    url: 'https://blockstream.info',
    api: 'https://blockstream.info/api',
    tor: 'http://explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion/api',
    description: 'Maintained by Blockstream. Esplora backend.',
    openSource: true,
    selfHostable: true,
    privacy: 'MEDIUM',
    features: ['fees', 'transactions', 'blocks', 'address', 'utxo'],
    docsUrl: 'https://github.com/Blockstream/esplora',
    recommended: false,
  },
  {
    id: 'blockstream_testnet',
    name: 'Blockstream (Testnet)',
    url: 'https://blockstream.info/testnet',
    api: 'https://blockstream.info/testnet/api',
    tor: null,
    description: 'Testnet block explorer by Blockstream.',
    openSource: true,
    selfHostable: false,
    privacy: 'MEDIUM',
    features: ['fees', 'transactions', 'blocks', 'address'],
    docsUrl: 'https://github.com/Blockstream/esplora',
    networkType: 'testnet',
    recommended: false,
  },
  {
    id: 'bitaps',
    name: 'Bitaps',
    url: 'https://bitaps.com',
    api: 'https://api.bitaps.com/btc/v1/blockchain',
    tor: null,
    description: 'Independent explorer. Good UTXO support.',
    openSource: false,
    selfHostable: false,
    privacy: 'LOW',
    features: ['transactions', 'blocks', 'address'],
    docsUrl: 'https://bitaps.com/api',
    recommended: false,
  },
  {
    id: 'self_hosted',
    name: 'Self-Hosted Explorer',
    url: null,  // user-provided
    api: null,  // user-provided
    tor: null,
    description: 'Your own Mempool.space or Esplora instance.',
    openSource: true,
    selfHostable: true,
    privacy: 'HIGH',
    features: ['fees', 'transactions', 'blocks', 'address', 'utxo'],
    docsUrl: 'https://github.com/mempool/mempool#docker',
    recommended: false,
    requiresCustomUrl: true,
  },
]

// ─── BTC Price Feeds ──────────────────────────────────────────────────────────

export const PRICE_FEEDS = [
  {
    id: 'coingecko',
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies={currency}',
    description: 'Aggregate price from 800+ exchanges. Free tier, rate limited.',
    requiresApiKey: false,
    privacy: 'LOW',          // centralised, logs IPs
    updateInterval: 60,      // seconds
    currencies: ['gbp', 'usd', 'eur', 'aud', 'cad', 'chf', 'jpy', 'ngn', 'idr', 'myr', 'bdt', 'pkr'],
    responseParser: (data, currency) => data?.bitcoin?.[currency],
    recommended: true,
  },
  {
    id: 'kraken',
    name: 'Kraken',
    url: 'https://api.kraken.com/0/public/Ticker?pair=XBT{CURRENCY}',
    description: 'Direct exchange price. No API key needed. Reliable.',
    requiresApiKey: false,
    privacy: 'MEDIUM',
    updateInterval: 30,
    currencies: ['gbp', 'usd', 'eur', 'aud', 'cad', 'chf', 'jpy'],
    responseParser: (data, currency) => {
      const pair = `XXBTZ${currency.toUpperCase()}`
      return parseFloat(data?.result?.[pair]?.c?.[0])
    },
    recommended: false,
  },
  {
    id: 'bisq',
    name: 'Bisq (P2P Market)',
    url: 'https://bisq.markets/api/ticker?market=btc_{currency}',
    description: 'Decentralised P2P exchange price. No central server.',
    requiresApiKey: false,
    privacy: 'HIGH',
    updateInterval: 300,     // 5 minutes — less frequent, P2P market
    currencies: ['gbp', 'usd', 'eur'],
    responseParser: (data, currency) => parseFloat(data?.last),
    recommended: false,
  },
  {
    id: 'self_hosted_price',
    name: 'Self-Hosted Price Feed',
    url: null,               // user-provided
    description: 'Your own BTCPay Server or price oracle.',
    requiresApiKey: false,
    privacy: 'HIGH',
    updateInterval: 60,
    currencies: ['any'],
    responseParser: null,    // user configures response path
    recommended: false,
    requiresCustomUrl: true,
  },
  {
    id: 'none',
    name: 'No Price Feed',
    url: null,
    description: 'Display sats only. No fiat conversion. Maximum privacy.',
    requiresApiKey: false,
    privacy: 'HIGH',
    updateInterval: null,
    currencies: [],
    responseParser: null,
    recommended: false,
  },
]

// ─── Fiat Exchange Rate Providers ─────────────────────────────────────────────

export const FIAT_RATE_PROVIDERS = [
  {
    id: 'ecb',
    name: 'European Central Bank',
    url: 'https://data-api.ecb.europa.eu/service/data/EXR/D.{currency}.EUR.SP00.A?lastNObservations=1&format=jsondata',
    description: 'Official ECB rates. Free, no API key, high reliability.',
    requiresApiKey: false,
    privacy: 'MEDIUM',
    updateInterval: 86400,   // daily — ECB updates once per day
    baseCurrency: 'EUR',
    recommended: true,
  },
  {
    id: 'frankfurter',
    name: 'Frankfurter',
    url: 'https://api.frankfurter.app/latest?from=GBP&to={currency}',
    description: 'Open source. Powered by ECB data. Self-hostable.',
    requiresApiKey: false,
    privacy: 'MEDIUM',
    updateInterval: 86400,
    baseCurrency: 'GBP',
    docsUrl: 'https://github.com/hakanensari/frankfurter',
    recommended: false,
  },
  {
    id: 'open_exchange',
    name: 'Open Exchange Rates',
    url: 'https://openexchangerates.org/api/latest.json?app_id={apiKey}&base=USD',
    description: 'Broad currency coverage. Free tier: 1000 req/month.',
    requiresApiKey: true,
    privacy: 'LOW',
    updateInterval: 3600,
    recommended: false,
  },
]

// ─── Electrum / Bitcoin Backends ──────────────────────────────────────────────

export const ELECTRUM_SERVERS = [
  {
    id: 'mempool_electrum',
    name: 'Mempool.space Electrum',
    host: 'electrum.blockstream.info',
    port: 50002,
    protocol: 'ssl',
    tor: 'explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion',
    description: 'Public Electrum maintained by Blockstream.',
    privacy: 'LOW',          // third party sees your addresses
    recommended: true,
    default: true,
  },
  {
    id: 'blockstream_electrum',
    name: 'Blockstream Electrum',
    host: 'electrum.blockstream.info',
    port: 50002,
    protocol: 'ssl',
    tor: 'explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion',
    description: 'Maintained by Blockstream. Reliable, widely used.',
    privacy: 'LOW',
    recommended: false,
  },
  {
    id: 'self_hosted_electrum',
    name: 'Self-Hosted (Electrs / Fulcrum)',
    host: null,              // user-provided
    port: null,
    protocol: 'ssl',
    tor: null,
    description: 'Your own Electrs or Fulcrum server. Maximum privacy.',
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    docsUrl: 'https://github.com/romanz/electrs',
  },
]

// ─── Bitcoin Full Nodes ───────────────────────────────────────────────────────

export const BITCOIN_NODES = [
  {
    id: 'public_fallback',
    name: 'Public Fallback (Electrum)',
    type: 'electrum',
    description: 'Use the selected Electrum server above. No node needed.',
    privacy: 'LOW',
    recommended: true,
    default: true,
    requiresCustomUrl: false,
  },
  {
    id: 'bitcoin_core_rpc',
    name: 'Bitcoin Core (RPC)',
    type: 'bitcoin_core',
    description: 'Connect to your own Bitcoin Core node via JSON-RPC.',
    defaultPort: 8332,
    testnetPort: 18332,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['rpcUrl', 'rpcUser', 'rpcPassword'],
    docsUrl: 'https://bitcoin.org/en/full-node',
  },
  {
    id: 'electrs',
    name: 'Electrs (Self-Hosted)',
    type: 'electrum',
    description: 'Lightweight Electrum server for Bitcoin Core.',
    defaultPort: 50001,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['host', 'port'],
    docsUrl: 'https://github.com/romanz/electrs',
  },
  {
    id: 'fulcrum',
    name: 'Fulcrum (Self-Hosted)',
    type: 'electrum',
    description: 'High-performance Electrum server. Faster than Electrs.',
    defaultPort: 50001,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['host', 'port'],
    docsUrl: 'https://github.com/cculianu/Fulcrum',
  },
  {
    id: 'btcpay',
    name: 'BTCPay Server',
    type: 'btcpay',
    description: 'Self-hosted BTCPay. Includes full node + Lightning.',
    defaultPort: 443,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['url', 'apiKey'],
    docsUrl: 'https://btcpayserver.org',
  },
  {
    id: 'umbrel',
    name: 'Umbrel',
    type: 'electrum',
    description: 'Home Bitcoin node via Umbrel OS. Electrs built in.',
    defaultPort: 50001,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['host', 'port'],
    docsUrl: 'https://umbrel.com',
  },
  {
    id: 'start9',
    name: 'Start9 (StartOS)',
    type: 'electrum',
    description: 'Sovereign computing via Start9. Bitcoin + Lightning included.',
    defaultPort: 50001,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['host', 'port'],
    docsUrl: 'https://start9.com',
  },
  {
    id: 'raspiblitz',
    name: 'RaspiBlitz',
    type: 'electrum',
    description: 'DIY Bitcoin + Lightning node on Raspberry Pi.',
    defaultPort: 50002,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['host', 'port'],
    docsUrl: 'https://github.com/raspiblitz/raspiblitz',
  },
  {
    id: 'mynodebtc',
    name: 'myNode',
    type: 'electrum',
    description: 'Pre-configured Bitcoin + Lightning node appliance.',
    defaultPort: 50002,
    privacy: 'HIGH',
    recommended: false,
    requiresCustomUrl: true,
    fields: ['host', 'port'],
    docsUrl: 'https://mynodebtc.com',
  },
]

// ─── Lightning Node Backends ──────────────────────────────────────────────────

export const LIGHTNING_NODES = [
  {
    id: 'none',
    name: 'No Lightning Node',
    type: 'none',
    description: 'Lightning features disabled. On-chain and Cashu only.',
    privacy: 'HIGH',
    recommended: false,
    default: false,
  },
  {
    id: 'nwc',
    name: 'Nostr Wallet Connect (NWC)',
    type: 'nwc',
    description: 'Connect any NWC-compatible wallet: Alby, Mutiny, Coinos, etc.',
    privacy: 'MEDIUM',
    recommended: true,
    default: true,
    fields: ['connectionString'],
    placeholder: 'nostr+walletconnect://pubkey?relay=wss://...&secret=...',
    docsUrl: 'https://nwc.dev',
  },
  {
    id: 'lnd_rest',
    name: 'LND (REST API)',
    type: 'lnd',
    description: 'Your own LND node via REST. Umbrel, RaspiBlitz, Start9.',
    privacy: 'HIGH',
    recommended: false,
    fields: ['restUrl', 'macaroon'],
    placeholder: { restUrl: 'https://your-node:8080', macaroon: 'hex macaroon' },
    docsUrl: 'https://docs.lightning.engineering/lightning-network-tools/lnd/rest-interface',
  },
  {
    id: 'cln_rest',
    name: 'Core Lightning (REST)',
    type: 'cln',
    description: 'Your own CLN node via CLNRest plugin.',
    privacy: 'HIGH',
    recommended: false,
    fields: ['restUrl', 'macaroon'],
    placeholder: { restUrl: 'https://your-node:3010', macaroon: 'hex rune' },
    docsUrl: 'https://docs.corelightning.org/docs/rest',
  },
  {
    id: 'lnbits',
    name: 'LNbits',
    type: 'lnbits',
    description: 'LNbits wallet. Self-hosted or use a public instance.',
    privacy: 'MEDIUM',
    recommended: false,
    fields: ['url', 'apiKey'],
    placeholder: { url: 'https://legend.lnbits.com', apiKey: 'your admin key' },
    docsUrl: 'https://lnbits.com',
  },
  {
    id: 'breez_sdk',
    name: 'Breez SDK (Embedded)',
    type: 'breez',
    description: 'Non-custodial embedded Lightning. Coming in v0.3.0.',
    privacy: 'HIGH',
    recommended: false,
    comingSoon: true,
    docsUrl: 'https://sdk-doc.breez.technology',
  },
  {
    id: 'lnpay',
    name: 'LNPay (Custodial)',
    type: 'custodial',
    description: 'Hosted Lightning. Easy setup. Not self-custodial.',
    privacy: 'LOW',
    recommended: false,
    custodial: true,
    fields: ['apiKey'],
    docsUrl: 'https://lnpay.co',
  },
]

// ─── Default config ───────────────────────────────────────────────────────────

export const DEFAULT_NODE_CONFIG = {
  // Block explorer
  explorer: 'mempool_space',
  explorerCustomUrl: '',
  explorerCustomApiUrl: '',

  // Price feed
  priceFeed: 'coingecko',
  priceFeedCustomUrl: '',
  priceFeedApiKey: '',
  displayCurrency: 'gbp',

  // Fiat rates
  fiatProvider: 'ecb',
  fiatApiKey: '',

  // Bitcoin backend
  bitcoinBackend: 'public_fallback',
  electrumHost: '',
  electrumPort: '',
  electrumProtocol: 'ssl',
  rpcUrl: '',
  rpcUser: '',
  rpcPassword: '',
  btcpayUrl: '',
  btcpayApiKey: '',

  // Lightning
  lightningBackend: 'nwc',
  nwcConnectionString: '',
  lndRestUrl: '',
  lndMacaroon: '',
  clnRestUrl: '',
  clnRune: '',
  lnbitsUrl: '',
  lnbitsApiKey: '',

  // Privacy
  useTor: false,
  torProxyUrl: 'socks5://127.0.0.1:9050',
}

// ─── Config persistence ───────────────────────────────────────────────────────

const CONFIG_KEY = 'ijma_node_config'

export function loadNodeConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (!stored) return { ...DEFAULT_NODE_CONFIG }
    return { ...DEFAULT_NODE_CONFIG, ...JSON.parse(stored) }
  } catch {
    return { ...DEFAULT_NODE_CONFIG }
  }
}

export function saveNodeConfig(config) {
  // Never save sensitive credentials in plain localStorage in production.
  // In Phase 2, these should be encrypted with the vault password.
  // For now, credentials are session-only; only non-sensitive prefs persist.
  const safe = { ...config }
  // Strip credentials before persisting
  delete safe.rpcPassword
  delete safe.lndMacaroon
  delete safe.clnRune
  delete safe.lnbitsApiKey
  delete safe.priceFeedApiKey
  delete safe.btcpayApiKey
  delete safe.fiatApiKey
  delete safe.nwcConnectionString  // NWC string contains a secret

  localStorage.setItem(CONFIG_KEY, JSON.stringify(safe))
  return safe
}

// ─── Live connectivity test ───────────────────────────────────────────────────

/**
 * Test if a block explorer API is reachable and returns valid data.
 * Returns { ok, latencyMs, error }
 */
export async function testExplorer(config) {
  const explorer = BLOCK_EXPLORERS.find(e => e.id === config.explorer)
  const apiBase = config.explorer === 'self_hosted'
    ? config.explorerCustomApiUrl
    : explorer?.api

  if (!apiBase) return { ok: false, error: 'No API URL configured' }

  const start = Date.now()
  try {
    const res = await fetch(`${apiBase}/blocks/tip/height`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blockHeight = await res.text()
    const height = parseInt(blockHeight)
    if (isNaN(height) || height < 800000) throw new Error('Unexpected response')
    return { ok: true, latencyMs: Date.now() - start, blockHeight: height }
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message }
  }
}

/**
 * Test if a price feed is reachable.
 * Returns { ok, price, latencyMs, error }
 */
export async function testPriceFeed(config) {
  if (config.priceFeed === 'none') return { ok: true, price: null, note: 'Disabled' }

  const feed = PRICE_FEEDS.find(f => f.id === config.priceFeed)
  const currency = config.displayCurrency || 'gbp'

  const url = config.priceFeed === 'self_hosted_price'
    ? config.priceFeedCustomUrl
    : feed?.url?.replace('{currency}', currency).replace('{CURRENCY}', currency.toUpperCase())

  if (!url) return { ok: false, error: 'No URL configured' }

  const start = Date.now()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const price = feed?.responseParser?.(data, currency)
    if (!price || isNaN(price)) throw new Error('Could not parse price from response')
    return { ok: true, latencyMs: Date.now() - start, price }
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message }
  }
}

/**
 * Test a Lightning NWC connection string.
 */
export function validateNwcString(str) {
  if (!str) return { valid: false, error: 'Empty connection string' }
  if (!str.startsWith('nostr+walletconnect://')) {
    return { valid: false, error: 'Must start with nostr+walletconnect://' }
  }
  try {
    const url = new URL(str.replace('nostr+walletconnect://', 'https://'))
    const relay = url.searchParams.get('relay')
    const secret = url.searchParams.get('secret')
    if (!relay) return { valid: false, error: 'Missing relay parameter' }
    if (!secret) return { valid: false, error: 'Missing secret parameter' }
    return { valid: true, pubkey: url.hostname, relay, hasSecret: true }
  } catch {
    return { valid: false, error: 'Malformed connection string' }
  }
}

// ─── API adapter — uses current config to build fetch URLs ───────────────────

/**
 * Fetch current block height using the configured explorer.
 */
export async function fetchBlockHeight(config) {
  const explorer = config.explorer === 'self_hosted'
    ? { api: config.explorerCustomApiUrl }
    : BLOCK_EXPLORERS.find(e => e.id === config.explorer)
  const res = await fetch(`${explorer.api}/blocks/tip/height`)
  return parseInt(await res.text())
}

/**
 * Fetch address balance using the configured explorer.
 */
export async function fetchAddressInfo(address, config) {
  const explorer = config.explorer === 'self_hosted'
    ? { api: config.explorerCustomApiUrl }
    : BLOCK_EXPLORERS.find(e => e.id === config.explorer)
  const res = await fetch(`${explorer.api}/address/${address}`)
  if (!res.ok) throw new Error(`Explorer returned ${res.status}`)
  return res.json()
}

/**
 * Fetch fee rates using the configured explorer.
 */
export async function fetchFeeRatesFromConfig(config) {
  const explorer = config.explorer === 'self_hosted'
    ? { api: config.explorerCustomApiUrl }
    : BLOCK_EXPLORERS.find(e => e.id === config.explorer)
  const res = await fetch(`${explorer.api}/v1/fees/recommended`)
  if (!res.ok) throw new Error(`Explorer returned ${res.status}`)
  return res.json()
}

/**
 * Fetch BTC price in the user's chosen display currency.
 *
 * Strategy (tried in order until one succeeds):
 *
 *   1. Direct pair from the configured feed (e.g. CoinGecko BTC/NGN).
 *      CoinGecko supports all 17 currencies directly on its free tier.
 *
 *   2. Fiat bridge via USD — if the feed doesn't support the target
 *      currency directly (e.g. Kraken only covers ~7 currencies):
 *        BTC/USD from configured feed × USD/{target} from ECB/Frankfurter
 *      This is accurate to within the daily ECB rate update and introduces
 *      no additional privacy exposure beyond what is already accepted.
 *
 *   3. If both fail, return null (UI displays sats only).
 *
 * Returns a number (price per BTC in the display currency) or null.
 */
export async function fetchPriceFromConfig(config) {
  if (config.priceFeed === 'none') return null

  const currency = (config.displayCurrency || 'gbp').toLowerCase()
  const feed = PRICE_FEEDS.find(f => f.id === config.priceFeed)
  if (!feed) return null

  // ── Strategy 1: Direct pair ──────────────────────────────────────────────
  const feedSupportsCurrency = feed.currencies?.includes(currency) ||
    feed.currencies?.includes('any')

  if (feedSupportsCurrency || config.priceFeed === 'self_hosted_price') {
    const url = config.priceFeed === 'self_hosted_price'
      ? config.priceFeedCustomUrl
      : feed.url
          ?.replace('{currency}', currency)
          ?.replace('{CURRENCY}', currency.toUpperCase())
          ?.replace('{apiKey}', config.priceFeedApiKey || '')

    if (url) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (res.ok) {
          const data = await res.json()
          const price = feed.responseParser?.(data, currency)
          if (price && !isNaN(price) && price > 0) return price
        }
      } catch { /* fall through to Strategy 2 */ }
    }
  }

  // ── Strategy 2: BTC/USD × USD/{currency} fiat bridge ────────────────────
  // Only attempt if currency is not USD (would be circular)
  if (currency !== 'usd') {
    try {
      // Step A: Get BTC/USD from the configured feed (most feeds support USD)
      const usdFeedSupportsCurrency = feed.currencies?.includes('usd') ||
        feed.currencies?.includes('any')

      let btcUsd = null
      if (usdFeedSupportsCurrency) {
        const usdUrl = feed.url
          ?.replace('{currency}', 'usd')
          ?.replace('{CURRENCY}', 'USD')
          ?.replace('{apiKey}', config.priceFeedApiKey || '')
        if (usdUrl) {
          const res = await fetch(usdUrl, { signal: AbortSignal.timeout(6000) })
          if (res.ok) {
            const data = await res.json()
            btcUsd = feed.responseParser?.(data, 'usd')
          }
        }
      }

      // Step B: Fallback to CoinGecko for BTC/USD if primary feed failed
      if (!btcUsd || isNaN(btcUsd)) {
        const cgUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        const res = await fetch(cgUrl, { signal: AbortSignal.timeout(6000) })
        if (res.ok) {
          const data = await res.json()
          btcUsd = data?.bitcoin?.usd
        }
      }

      if (!btcUsd || isNaN(btcUsd)) return null

      // Step C: Get USD/{currency} fiat rate from Frankfurter (ECB data, free)
      // Frankfurter supports: AED, AUD, BDT (via USD base), CAD, CHF, IDR,
      // JPY, KES, MYR, NGN, PKR, SAR, TRY, ZAR and all major currencies.
      // For currencies not in Frankfurter, we try Open Exchange Rates free tier.
      const fxUrl = `https://api.frankfurter.app/latest?from=USD&to=${currency.toUpperCase()}`
      const fxRes = await fetch(fxUrl, { signal: AbortSignal.timeout(6000) })
      if (fxRes.ok) {
        const fxData = await fxRes.json()
        const rate = fxData?.rates?.[currency.toUpperCase()]
        if (rate && !isNaN(rate) && rate > 0) {
          return Math.round(btcUsd * rate)
        }
      }

      // Step D: Frankfurter doesn't cover some regional currencies (BDT, PKR, NGN etc.)
      // Fall back to Open Exchange Rates free tier (no API key, USD base, cached hourly)
      const oxrUrl = `https://open.er-api.com/v6/latest/USD`
      const oxrRes = await fetch(oxrUrl, { signal: AbortSignal.timeout(6000) })
      if (oxrRes.ok) {
        const oxrData = await oxrRes.json()
        const rate = oxrData?.rates?.[currency.toUpperCase()]
        if (rate && !isNaN(rate) && rate > 0) {
          return Math.round(btcUsd * rate)
        }
      }
    } catch { /* fall through */ }
  }

  // ── Strategy 3: Give up, return null ────────────────────────────────────
  // UI will display sats only — this is always the safe fallback
  return null
}

/**
 * Get the currency symbol for the current display currency.
 * Used throughout the UI to format amounts.
 */
export function getCurrencySymbol(currencyCode) {
  const cur = FIAT_CURRENCIES.find(c => c.code === (currencyCode || 'gbp').toLowerCase())
  return cur?.symbol || currencyCode?.toUpperCase() || '£'
}

/**
 * Format a sats amount as fiat using the current BTC price.
 * Returns a formatted string like "£42.10" or "₦ 68,420" or null if no price.
 *
 * @param {number} sats        - amount in satoshis
 * @param {number|null} price  - BTC price in display currency (from fetchPriceFromConfig)
 * @param {string} currency    - display currency code
 * @param {boolean} showSats   - also show the sats amount in brackets
 */
export function formatFiat(sats, price, currency = 'gbp', showSats = false) {
  if (!price || isNaN(price)) return null
  const fiatAmount = (sats / 1e8) * price
  const symbol = getCurrencySymbol(currency)

  // Format based on magnitude — small amounts need more decimal places
  let formatted
  if (fiatAmount >= 1000)      formatted = symbol + Math.round(fiatAmount).toLocaleString()
  else if (fiatAmount >= 1)    formatted = symbol + fiatAmount.toFixed(2)
  else if (fiatAmount >= 0.01) formatted = symbol + fiatAmount.toFixed(4)
  else                         formatted = symbol + fiatAmount.toFixed(6)

  if (showSats) return `${formatted} (${sats.toLocaleString()} sats)`
  return formatted
}

/**
 * Build a transaction URL for the configured block explorer.
 */
export function buildTxUrl(txid, config) {
  const explorer = config.explorer === 'self_hosted'
    ? { url: config.explorerCustomUrl }
    : BLOCK_EXPLORERS.find(e => e.id === config.explorer)
  return `${explorer?.url}/tx/${txid}`
}

/**
 * Build an address URL for the configured block explorer.
 */
export function buildAddressUrl(address, config) {
  const explorer = config.explorer === 'self_hosted'
    ? { url: config.explorerCustomUrl }
    : BLOCK_EXPLORERS.find(e => e.id === config.explorer)
  return `${explorer?.url}/address/${address}`
}

// ─── Fiat currencies list ─────────────────────────────────────────────────────

export const FIAT_CURRENCIES = [
  { code: 'gbp', symbol: '£', name: 'British Pound',     flag: '🇬🇧' },
  { code: 'usd', symbol: '$', name: 'US Dollar',         flag: '🇺🇸' },
  { code: 'eur', symbol: '€', name: 'Euro',              flag: '🇪🇺' },
  { code: 'aud', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'cad', symbol: 'C$', name: 'Canadian Dollar',  flag: '🇨🇦' },
  { code: 'chf', symbol: 'Fr', name: 'Swiss Franc',      flag: '🇨🇭' },
  { code: 'jpy', symbol: '¥',  name: 'Japanese Yen',     flag: '🇯🇵' },
  { code: 'try', symbol: '₺',  name: 'Turkish Lira',     flag: '🇹🇷' },
  { code: 'ngn', symbol: '₦',  name: 'Nigerian Naira',   flag: '🇳🇬' },
  { code: 'idr', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'myr', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'bdt', symbol: '৳',  name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'pkr', symbol: '₨',  name: 'Pakistani Rupee',  flag: '🇵🇰' },
  { code: 'sar', symbol: '﷼',  name: 'Saudi Riyal',      flag: '🇸🇦' },
  { code: 'aed', symbol: 'د.إ', name: 'UAE Dirham',      flag: '🇦🇪' },
  { code: 'zar', symbol: 'R',  name: 'South African Rand', flag: '🇿🇦' },
  { code: 'kes', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
]
