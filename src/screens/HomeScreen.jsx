/**
 * Ijma Wallet — Home Screen v2
 * Warm editorial design. Personalised greeting. Photorealistic image cards.
 */
import { useState } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import { useNodeConfig } from '../context/NodeConfigContext.jsx'
import { FIAT_CURRENCIES } from '../lib/providers.js'
import { C, FONTS, IMAGES, Card, ImageCard, SectionLabel, ScreenWrapper, Badge, layerColor } from '../components/shared.jsx'
import { Icon } from '../components/icons.jsx'

const DEMO_CONTACTS = [
  { id: 1, name: 'Femi Okafor',   initials: 'FO', color: '#F7931A' },
  { id: 2, name: 'Layla Hassan',  initials: 'LH', color: '#8B4CF7' },
  { id: 3, name: 'Adam Yusuf',    initials: 'AY', color: '#00A86B' },
  { id: 4, name: 'Maryam Diallo', initials: 'MD', color: '#0098D4' },
]

const DEMO_ACTIVITY = [
  { id: 1, type: 'received', bucket: 'payments', amount: 21000,  label: 'From Layla Hassan',  time: 'Just now',  layer: 'lightning' },
  { id: 2, type: 'sent',     bucket: 'savings',  amount: 50000,  label: 'Moved to savings',   time: '1h ago',    layer: 'onchain'   },
  { id: 3, type: 'received', bucket: 'payments', amount: 5000,   label: 'Gift from Adam',      time: '3h ago',    layer: 'cashu'     },
]

// Arabic greeting based on time of day
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeScreen({ onNavigate }) {
  const { meta, balances, btcPrice, powerMode, togglePowerMode } = useWallet()
  const { config } = useNodeConfig()
  const [hidden, setHidden] = useState(false)
  const nav = onNavigate || (() => {})

  // Currency display helpers — reads from Advanced Settings
  const currencyCode = (config.displayCurrency || 'gbp').toLowerCase()
  const currencyInfo = FIAT_CURRENCIES.find(c => c.code === currencyCode)
  const currencySymbol = currencyInfo?.symbol || '£'
  const currencyLocale = currencyCode === 'usd' ? 'en-US'
    : currencyCode === 'eur' ? 'de-DE'
    : currencyCode === 'jpy' ? 'ja-JP'
    : 'en-GB'

  const displayName = meta?.username && meta.username !== 'ijma_user'
    ? meta.username.charAt(0).toUpperCase() + meta.username.slice(1)
    : null

  const totalSats    = Object.values(balances).reduce((s, v) => s + (v || 0), 0)
  const paymentsSats = (balances.lightning || 0) + (balances.cashu || 0)
  const savingsSats  = (balances.onchain  || 0) + (balances.fedimint || 0)

  // When user has selected 'sats' as display, skip fiat conversion entirely
  const toFiat = sats => {
    if (currencyCode === 'sats' || !btcPrice) return null
    return (sats / 1e8 * btcPrice).toLocaleString(currencyLocale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: 2,
    })
  }

  const fmtSats = n => n.toLocaleString() + ' sats'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONTS.body }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          {/* Arabic greeting */}
          <div style={{
            fontFamily: FONTS.display,
            fontSize: 13,
            fontStyle: 'italic',
            color: C.muted,
            marginBottom: 2,
          }}>
            {displayName ? `السلام عليكم،` : 'السلام عليكم'}
          </div>
          {/* Personalised English greeting */}
          <div style={{
            fontFamily: FONTS.display,
            fontSize: displayName ? 24 : 20,
            fontWeight: 600,
            color: C.text,
            lineHeight: 1.1,
          }}>
            {displayName
              ? `Assalaamu alaikum, ${displayName}`
              : getGreeting()
            }
            <span style={{ marginLeft: 6 }}>🌙</span>
          </div>
        </div>

        {/* Avatar + Pro toggle */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={togglePowerMode} style={{
            background: powerMode ? C.lightningPurple + '15' : C.surface,
            border: `1.5px solid ${powerMode ? C.lightningPurple + '44' : C.border}`,
            borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
            color: powerMode ? C.lightningPurple : C.muted,
            fontSize: 11, fontFamily: FONTS.body, fontWeight: 600,
          }}>
            {powerMode ? 'Pro' : 'Simple'}
          </button>
          <div style={{
            width: 40, height: 40, borderRadius: 20, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.btcOrange}, ${C.lightningPurple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#fff',
            boxShadow: `0 2px 12px ${C.btcOrange}40`,
          }}>
            {(displayName || 'I')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Main balance card (full-bleed photo) ────────────────────────────── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <ImageCard
          src={IMAGES.balanceCard}
          fallbackGradient="linear-gradient(160deg, #2C1810 0%, #6B3A1A 50%, #C9A84C 100%)"
          height={220}
          glow={C.btcOrange}
        >
          <div style={{ padding: '20px 22px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontFamily: FONTS.body, fontWeight: 600, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                Total Balance
              </div>
              <button onClick={() => setHidden(h => !h)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20,
                padding: '4px 10px', cursor: 'pointer', backdropFilter: 'blur(8px)',
              }}>
                <Icon name={hidden ? 'eye' : 'eyeOff'} size={14} color="rgba(255,255,255,0.8)" />
              </button>
            </div>

            {/* Balance */}
            <div>
              <div style={{
                fontFamily: FONTS.display,
                fontSize: hidden ? 32 : (toFiat(totalSats) ? 38 : 28),
                fontWeight: 300,
                color: '#fff',
                letterSpacing: -1,
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {hidden
                  ? '••••••'
                  : toFiat(totalSats) || fmtSats(totalSats)
                }
              </div>
              {toFiat(totalSats) && !hidden && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: FONTS.mono }}>
                  {fmtSats(totalSats)}
                </div>
              )}
            </div>
          </div>
        </ImageCard>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Send',    icon: 'send',    color: C.btcOrange,       tab: 'send'     },
            { label: 'Receive', icon: 'receive', color: C.cashuGreen,      tab: 'receive'  },
            { label: 'Swap',    icon: 'swap',    color: C.lightningPurple, tab: 'swap'     },
            { label: 'Identity',icon: 'contact', color: C.nostrBlue,       tab: 'identity' },
          ].map(a => (
            <button key={a.label} onClick={() => nav(a.tab)} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '14px 0', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              boxShadow: `0 1px 4px ${C.shadow}`,
              transition: 'box-shadow 0.2s',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 19,
                background: a.color + '14',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={a.icon} size={17} color={a.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: FONTS.body }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Payments & Savings cards ─────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Payments */}
          <ImageCard
            src={IMAGES.paymentsCard}
            fallbackGradient="linear-gradient(160deg, #2A1060 0%, #8B4CF7 100%)"
            height={160}
            style={{ borderRadius: 16 }}
          >
            <div style={{ padding: '14px 14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="payments" size={13} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontFamily: FONTS.body }}>Payments</span>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
                  {hidden ? '•••' : toFiat(paymentsSats) || fmtSats(paymentsSats)}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontFamily: FONTS.mono }}>
                  Lightning · Cashu
                </div>
              </div>
            </div>
          </ImageCard>

          {/* Savings */}
          <ImageCard
            src={IMAGES.savingsCard}
            fallbackGradient="linear-gradient(160deg, #1A0A00 0%, #F7931A 100%)"
            height={160}
            style={{ borderRadius: 16 }}
          >
            <div style={{ padding: '14px 14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="savings" size={13} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontFamily: FONTS.body }}>Savings</span>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
                  {hidden ? '•••' : toFiat(savingsSats) || fmtSats(savingsSats)}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontFamily: FONTS.mono }}>
                  Bitcoin · Vault
                </div>
              </div>
            </div>
          </ImageCard>

        </div>
      </div>

      {/* ── Contacts ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: FONTS.display, color: C.text }}>Contacts</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.btcOrange, fontWeight: 600, fontFamily: FONTS.body }}>See all</button>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {DEMO_CONTACTS.map(c => (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 26,
                background: c.color + '20',
                border: `2px solid ${c.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: c.color,
                fontFamily: FONTS.body,
              }}>{c.initials}</div>
              <span style={{ fontSize: 10, color: C.muted, maxWidth: 52, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONTS.body }}>
                {c.name.split(' ')[0]}
              </span>
            </div>
          ))}
          {/* Add */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 26,
              background: C.surface2, border: `2px dashed ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" size={18} color={C.muted} />
            </div>
            <span style={{ fontSize: 10, color: C.muted, fontFamily: FONTS.body }}>Add</span>
          </div>
        </div>
      </div>

      {/* ── Activity ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: FONTS.display, color: C.text }}>Activity</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.btcOrange, fontWeight: 600, fontFamily: FONTS.body }}>All</button>
        </div>
        <Card style={{ padding: '4px 0' }}>
          {DEMO_ACTIVITY.map((tx, i) => {
            const isR = tx.type === 'received'
            const fiat = toFiat(tx.amount)
            const lc = layerColor(tx.layer)
            return (
              <div key={tx.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                    background: (isR ? C.cashuGreen : C.error) + '12',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={isR ? 'receive' : 'send'} size={17} color={isR ? C.cashuGreen : C.error} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONTS.body }}>{tx.label}</div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: lc, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: FONTS.body }}>{tx.bucket === 'payments' ? 'Payments' : 'Savings'} · {tx.time}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isR ? C.cashuGreen : C.error, fontFamily: FONTS.body }}>
                      {hidden ? '•••' : fiat ? `${isR ? '+' : '−'}${fiat}` : `${isR ? '+' : '−'}${tx.amount.toLocaleString()}`}
                    </div>
                    {fiat && !hidden && (
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: FONTS.mono }}>{tx.amount.toLocaleString()} sats</div>
                    )}
                  </div>
                </div>
                {i < DEMO_ACTIVITY.length - 1 && (
                  <div style={{ height: 1, background: C.border, marginLeft: 68 }} />
                )}
              </div>
            )
          })}
        </Card>
      </div>

    </div>
  )
}
