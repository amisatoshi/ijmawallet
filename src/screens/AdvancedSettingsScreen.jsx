/**
 * Ijma Wallet — Advanced Settings Screen
 * Block explorers · Price feeds · Fiat currency · Bitcoin node · Lightning node
 */
import { useState } from 'react'
import { useNodeConfig } from '../context/NodeConfigContext.jsx'
import {
  BLOCK_EXPLORERS, PRICE_FEEDS, FIAT_CURRENCIES,
  BITCOIN_NODES, LIGHTNING_NODES, FIAT_RATE_PROVIDERS,
  validateNwcString,
} from '../lib/providers.js'
import { C, Card, SectionLabel, ScreenWrapper, Badge, Toggle } from '../components/shared.jsx'

// ─── Privacy badge ────────────────────────────────────────────────────────────
function PrivacyBadge({ level }) {
  const map = {
    HIGH:   { color: C.cashuGreen,       label: 'High Privacy' },
    MEDIUM: { color: C.warning,          label: 'Medium Privacy' },
    LOW:    { color: C.muted,            label: 'Low Privacy' },
  }
  const { color, label } = map[level] || map.LOW
  return <Badge label={label} color={color} />
}

// ─── Status indicator ─────────────────────────────────────────────────────────
function StatusDot({ result, testing }) {
  if (testing) return <span style={{ fontSize: 11, color: C.muted }}>testing...</span>
  if (!result) return null
  return (
    <span style={{
      fontSize: 11,
      color: result.ok ? C.cashuGreen : C.error,
      fontFamily: 'monospace',
    }}>
      {result.ok
        ? `✓ ${result.latencyMs}ms${result.blockHeight ? ` · block ${result.blockHeight.toLocaleString()}` : ''}${result.price ? ` · £${result.price.toLocaleString()}` : ''}`
        : `✗ ${result.error}`}
    </span>
  )
}

// ─── Text input row ───────────────────────────────────────────────────────────
function ConfigInput({ label, value, onChange, placeholder, type = 'text', mono = true }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          width: '100%', background: C.surface2,
          border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '10px 12px',
          color: C.text, fontSize: mono ? 11 : 13,
          fontFamily: mono ? 'monospace' : 'inherit',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Section accordion ────────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: C.surface, border: `1px solid ${open ? C.btcOrange + '55' : C.border}`,
          borderRadius: open ? '12px 12px 0 0' : 12,
          padding: '12px 14px', cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.text, textAlign: 'left' }}>
          {title}
        </span>
        <span style={{ color: C.muted, fontSize: 14, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
      </button>
      {open && (
        <div style={{
          background: C.surface2,
          border: `1px solid ${C.btcOrange + '55'}`,
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: 14,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Provider option card ─────────────────────────────────────────────────────
function ProviderOption({ item, selected, onSelect, showPrivacy = true }) {
  const isSelected = selected === item.id
  return (
    <button
      onClick={() => !item.comingSoon && onSelect(item.id)}
      disabled={!!item.comingSoon}
      style={{
        width: '100%', textAlign: 'left',
        background: isSelected ? C.btcOrange + '11' : C.surface,
        border: `1px solid ${isSelected ? C.btcOrange : C.border}`,
        borderRadius: 10, padding: '10px 12px',
        cursor: item.comingSoon ? 'default' : 'pointer',
        opacity: item.comingSoon ? 0.5 : 1,
        marginBottom: 6,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 9, flexShrink: 0, marginTop: 1,
          border: `2px solid ${isSelected ? C.btcOrange : C.muted}`,
          background: isSelected ? C.btcOrange : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isSelected && <div style={{ width: 7, height: 7, borderRadius: 4, background: '#fff' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.btcOrange : C.text }}>
              {item.name}
            </span>
            {item.recommended && <Badge label="Recommended" color={C.cashuGreen} />}
            {item.openSource && <Badge label="Open Source" color={C.nostrBlue} />}
            {item.custodial && <Badge label="Custodial" color={C.error} />}
            {item.comingSoon && <Badge label="Coming Soon" color={C.muted} />}
          </div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{item.description}</div>
          {showPrivacy && (
            <div style={{ marginTop: 4 }}>
              <PrivacyBadge level={item.privacy} />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdvancedSettingsScreen() {
  const { config, setConfig, resetConfig, testResults, testing, runTest } = useNodeConfig()
  const [showReset, setShowReset] = useState(false)
  const [nwcValidation, setNwcValidation] = useState(null)

  function handleNwcChange(val) {
    setConfig({ nwcConnectionString: val })
    if (val.length > 30) {
      setNwcValidation(validateNwcString(val))
    } else {
      setNwcValidation(null)
    }
  }

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>
        Advanced Settings
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
        Configure block explorers, price feeds, and node connections.
Display currency is in Settings.
      </div>

      {/* Sovereignty notice */}
      <div style={{
        marginBottom: 16, padding: 12,
        background: C.cashuGreen + '0D',
        border: `1px solid ${C.cashuGreen}33`,
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, color: C.cashuGreen, lineHeight: 1.6 }}>
          🔐 <strong>Sovereignty tip:</strong> Using your own Bitcoin node, explorer, and price feed means no third party sees your addresses, balances, or queries. Start with public defaults and migrate to self-hosted as you grow.
        </div>
      </div>

      {/* ── 1. Block Explorer ─────────────────────────────────────────────── */}
      <Section title="Block Explorer" icon="🔍" defaultOpen={true}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          Used to look up transactions, addresses, UTXOs, and fee rates.
        </div>

        {BLOCK_EXPLORERS.filter(e => !e.networkType).map(explorer => (
          <ProviderOption
            key={explorer.id}
            item={explorer}
            selected={config.explorer}
            onSelect={id => setConfig({ explorer: id })}
          />
        ))}

        {/* Custom URL fields for self-hosted */}
        {config.explorer === 'self_hosted' && (
          <div style={{ marginTop: 8, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput
              label="EXPLORER BASE URL"
              value={config.explorerCustomUrl}
              onChange={v => setConfig({ explorerCustomUrl: v })}
              placeholder="https://mempool.yourdomain.com"
            />
            <ConfigInput
              label="EXPLORER API URL"
              value={config.explorerCustomApiUrl}
              onChange={v => setConfig({ explorerCustomApiUrl: v })}
              placeholder="https://mempool.yourdomain.com/api"
            />
          </div>
        )}

        {/* Test button */}
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => runTest('explorer')}
            disabled={testing.explorer}
            style={{
              background: C.btcOrange + '22', border: `1px solid ${C.btcOrange}44`,
              borderRadius: 8, padding: '7px 14px', color: C.btcOrange,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {testing.explorer ? '⏳ Testing...' : '⚡ Test Connection'}
          </button>
          <StatusDot result={testResults.explorer} testing={testing.explorer} />
        </div>
      </Section>

      {/* ── 2. BTC Price Feed ─────────────────────────────────────────────── */}
      <Section title="BTC Price Feed" icon="₿">
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          Where Ijma fetches the current BTC price for fiat conversion.
          Choose "No Price Feed" to display sats only — maximum privacy.
        </div>

        {PRICE_FEEDS.map(feed => (
          <ProviderOption
            key={feed.id}
            item={feed}
            selected={config.priceFeed}
            onSelect={id => setConfig({ priceFeed: id })}
          />
        ))}

        {config.priceFeed === 'self_hosted_price' && (
          <ConfigInput
            label="PRICE API URL (return JSON with numeric price)"
            value={config.priceFeedCustomUrl}
            onChange={v => setConfig({ priceFeedCustomUrl: v })}
            placeholder="https://your-btcpay.com/api/rates?currencyPair=BTC_GBP"
          />
        )}

        {PRICE_FEEDS.find(f => f.id === config.priceFeed)?.requiresApiKey && (
          <ConfigInput
            label="API KEY"
            value={config.priceFeedApiKey}
            onChange={v => setConfig({ priceFeedApiKey: v })}
            placeholder="Your API key"
            type="password"
          />
        )}

        {/* Update interval display */}
        {config.priceFeed !== 'none' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>REFRESH INTERVAL</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[30, 60, 300, 600].map(secs => (
                <button key={secs}
                  onClick={() => setConfig({ priceRefreshInterval: secs })}
                  style={{
                    background: (config.priceRefreshInterval || 60) === secs ? C.btcOrange + '22' : C.surface,
                    border: `1px solid ${(config.priceRefreshInterval || 60) === secs ? C.btcOrange : C.border}`,
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                    color: (config.priceRefreshInterval || 60) === secs ? C.btcOrange : C.muted,
                    fontSize: 11, fontWeight: 700,
                  }}
                >
                  {secs < 60 ? `${secs}s` : `${secs / 60}m`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => runTest('price')}
            disabled={testing.price || config.priceFeed === 'none'}
            style={{
              background: C.btcOrange + '22', border: `1px solid ${C.btcOrange}44`,
              borderRadius: 8, padding: '7px 14px', color: C.btcOrange,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: config.priceFeed === 'none' ? 0.4 : 1,
            }}
          >
            {testing.price ? '⏳ Testing...' : '⚡ Test Feed'}
          </button>
          <StatusDot result={testResults.price} testing={testing.price} />
        </div>
      </Section>

      {/* ── 4. Bitcoin Node ───────────────────────────────────────────────── */}
      <Section title="Bitcoin Node" icon="₿">
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          Connects Ijma to the Bitcoin network. Using your own node means no
          third party sees your address queries or transaction broadcasts.
        </div>

        {BITCOIN_NODES.map(node => (
          <ProviderOption
            key={node.id}
            item={node}
            selected={config.bitcoinBackend}
            onSelect={id => setConfig({ bitcoinBackend: id })}
          />
        ))}

        {/* Dynamic fields based on selected backend */}
        {config.bitcoinBackend === 'bitcoin_core_rpc' && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput label="RPC URL" value={config.rpcUrl} onChange={v => setConfig({ rpcUrl: v })} placeholder="http://127.0.0.1:8332" />
            <ConfigInput label="RPC USERNAME" value={config.rpcUser} onChange={v => setConfig({ rpcUser: v })} placeholder="bitcoinrpc" mono={false} />
            <ConfigInput label="RPC PASSWORD" value={config.rpcPassword} onChange={v => setConfig({ rpcPassword: v })} placeholder="your rpc password" type="password" mono={false} />
            <div style={{ marginTop: 8, padding: 8, background: C.warning + '11', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: C.warning }}>
                ⚠️ RPC credentials are session-only and not persisted to storage.
              </div>
            </div>
          </div>
        )}

        {['electrs', 'fulcrum', 'self_hosted_electrum', 'umbrel', 'start9', 'raspiblitz', 'mynodebtc'].includes(config.bitcoinBackend) && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput
              label="ELECTRUM HOST"
              value={config.electrumHost}
              onChange={v => setConfig({ electrumHost: v })}
              placeholder="umbrel.local or 192.168.1.x"
            />
            <ConfigInput
              label="PORT"
              value={config.electrumPort}
              onChange={v => setConfig({ electrumPort: v })}
              placeholder={BITCOIN_NODES.find(n => n.id === config.bitcoinBackend)?.defaultPort?.toString() || '50001'}
            />
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>PROTOCOL</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ssl', 'tcp'].map(proto => (
                  <button key={proto} onClick={() => setConfig({ electrumProtocol: proto })} style={{
                    background: config.electrumProtocol === proto ? C.cashuGreen + '22' : C.surface2,
                    border: `1px solid ${config.electrumProtocol === proto ? C.cashuGreen : C.border}`,
                    borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                    color: config.electrumProtocol === proto ? C.cashuGreen : C.muted,
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  }}>{proto}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {config.bitcoinBackend === 'btcpay' && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput label="BTCPAY SERVER URL" value={config.btcpayUrl} onChange={v => setConfig({ btcpayUrl: v })} placeholder="https://btcpay.yourdomain.com" />
            <ConfigInput label="API KEY" value={config.btcpayApiKey} onChange={v => setConfig({ btcpayApiKey: v })} placeholder="your BTCPay API key" type="password" mono={false} />
          </div>
        )}
      </Section>

      {/* ── 5. Lightning Node ─────────────────────────────────────────────── */}
      <Section title="Lightning Node" icon="⚡">
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          How Ijma connects to the Lightning Network for instant payments.
          NWC is easiest. Your own LND or CLN node is most sovereign.
        </div>

        {LIGHTNING_NODES.map(node => (
          <ProviderOption
            key={node.id}
            item={node}
            selected={config.lightningBackend}
            onSelect={id => setConfig({ lightningBackend: id })}
          />
        ))}

        {/* NWC connection string */}
        {config.lightningBackend === 'nwc' && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>
              NWC CONNECTION STRING
            </div>
            <textarea
              value={config.nwcConnectionString}
              onChange={e => handleNwcChange(e.target.value)}
              placeholder="nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=..."
              rows={3}
              style={{
                width: '100%', background: C.surface2,
                border: `1px solid ${nwcValidation ? (nwcValidation.valid ? C.cashuGreen : C.error) : C.border}`,
                borderRadius: 10, padding: 10, color: C.text, fontSize: 10,
                fontFamily: 'monospace', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
            {nwcValidation && (
              <div style={{ fontSize: 10, marginTop: 4, color: nwcValidation.valid ? C.cashuGreen : C.error }}>
                {nwcValidation.valid
                  ? `✓ Valid · Relay: ${nwcValidation.relay}`
                  : `✗ ${nwcValidation.error}`}
              </div>
            )}
            <div style={{ marginTop: 8, padding: 8, background: C.lightningPurple + '11', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: C.lightningPurple, lineHeight: 1.6 }}>
                💡 Get NWC string from: <strong>Alby</strong> (getalby.com) → Settings → Wallet → Nostr Wallet Connect, or <strong>Mutiny Wallet</strong>, or your own <strong>LNbits</strong> instance.
              </div>
            </div>
          </div>
        )}

        {/* LND REST */}
        {config.lightningBackend === 'lnd_rest' && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput label="LND REST URL" value={config.lndRestUrl} onChange={v => setConfig({ lndRestUrl: v })} placeholder="https://umbrel.local:8080" />
            <ConfigInput label="MACAROON (HEX)" value={config.lndMacaroon} onChange={v => setConfig({ lndMacaroon: v })} placeholder="0201036c6e6402..." type="password" />
            <div style={{ marginTop: 8, padding: 8, background: C.warning + '11', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: C.warning }}>
                ⚠️ Use a read-only or invoice-only macaroon for better security. Never use admin.macaroon unless necessary.
              </div>
            </div>
          </div>
        )}

        {/* CLN REST */}
        {config.lightningBackend === 'cln_rest' && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput label="CLN REST URL" value={config.clnRestUrl} onChange={v => setConfig({ clnRestUrl: v })} placeholder="https://your-node:3010" />
            <ConfigInput label="RUNE (HEX)" value={config.clnRune} onChange={v => setConfig({ clnRune: v })} placeholder="your CLN rune" type="password" />
          </div>
        )}

        {/* LNbits */}
        {config.lightningBackend === 'lnbits' && (
          <div style={{ marginTop: 10, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <ConfigInput label="LNBITS URL" value={config.lnbitsUrl} onChange={v => setConfig({ lnbitsUrl: v })} placeholder="https://legend.lnbits.com" />
            <ConfigInput label="API KEY" value={config.lnbitsApiKey} onChange={v => setConfig({ lnbitsApiKey: v })} placeholder="your wallet API key" type="password" mono={false} />
          </div>
        )}
      </Section>

      {/* ── 6. Privacy & Tor ──────────────────────────────────────────────── */}
      <Section title="Privacy & Tor" icon="🧅">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Route via Tor</div>
            <div style={{ fontSize: 10, color: C.muted }}>All network requests through Tor onion routing</div>
          </div>
          <Toggle on={config.useTor} onToggle={() => setConfig({ useTor: !config.useTor })} color={C.nostrBlue} />
        </div>

        {config.useTor && (
          <>
            <ConfigInput
              label="TOR SOCKS5 PROXY"
              value={config.torProxyUrl}
              onChange={v => setConfig({ torProxyUrl: v })}
              placeholder="socks5://127.0.0.1:9050"
            />
            <div style={{ marginTop: 8, padding: 8, background: C.nostrBlue + '11', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: C.nostrBlue, lineHeight: 1.6 }}>
                ℹ️ Requires Tor Browser or Orbot running on your device. Onion addresses for supported services will be used automatically.
              </div>
            </div>
          </>
        )}

        {/* Privacy summary */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>CURRENT PRIVACY PROFILE</div>
          {[
            {
              label: 'Block Explorer',
              value: BLOCK_EXPLORERS.find(e => e.id === config.explorer)?.name,
              level: BLOCK_EXPLORERS.find(e => e.id === config.explorer)?.privacy,
            },
            {
              label: 'Price Feed',
              value: PRICE_FEEDS.find(f => f.id === config.priceFeed)?.name,
              level: PRICE_FEEDS.find(f => f.id === config.priceFeed)?.privacy,
            },
            {
              label: 'Bitcoin Node',
              value: BITCOIN_NODES.find(n => n.id === config.bitcoinBackend)?.name,
              level: BITCOIN_NODES.find(n => n.id === config.bitcoinBackend)?.privacy,
            },
            {
              label: 'Lightning',
              value: LIGHTNING_NODES.find(n => n.id === config.lightningBackend)?.name,
              level: LIGHTNING_NODES.find(n => n.id === config.lightningBackend)?.privacy,
            },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 11, color: C.muted }}>{item.label}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: C.text }}>{item.value}</span>
                <PrivacyBadge level={item.level || 'LOW'} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Reset ─────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 8, marginBottom: 24 }}>
        {!showReset ? (
          <button onClick={() => setShowReset(true)} style={{
            width: '100%', background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 10,
            color: C.muted, fontSize: 11, cursor: 'pointer',
          }}>
            Reset to defaults
          </button>
        ) : (
          <Card style={{ border: `1px solid ${C.error}55` }}>
            <div style={{ fontSize: 12, color: C.error, marginBottom: 10 }}>
              ⚠️ Reset all provider settings to defaults? This will not affect your wallet or keys.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { resetConfig(); setShowReset(false) }} style={{
                flex: 1, background: C.error + '22', border: `1px solid ${C.error}44`,
                borderRadius: 8, padding: 10, color: C.error, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Reset</button>
              <button onClick={() => setShowReset(false)} style={{
                flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: 10, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </Card>
        )}
      </div>
    </ScreenWrapper>
  )
}
