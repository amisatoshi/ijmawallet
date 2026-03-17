// ─────────────────────────────────────────────────────────────────────────────
// SendScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import { C, Card, PrimaryBtn, Input, ScreenWrapper, SectionLabel, Badge, layerColor } from '../components/shared.jsx'
import { Icon } from '../components/icons.jsx'
import { getSecurityTier, secureGet } from '../lib/security.js'
import { QrScanner } from '../components/normie.jsx'
import { fetchZapInvoice, createZapRequest } from '../lib/nostr.js'
import { useNodeConfig } from '../context/NodeConfigContext.jsx'
import { FIAT_CURRENCIES } from '../lib/providers.js'
import AdvancedSettingsScreen from '../screens/AdvancedSettingsScreen.jsx'

export function SendScreen() {
  const { session, balances, btcPrice, meta, shariahMode, powerMode } = useWallet()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('sats')
  const [layer, setLayer] = useState('auto')
  const [step, setStep] = useState(1)
  const [sent, setSent] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amtSats = unit === 'sats' ? parseInt(amount || 0)
    : unit === 'btc' ? Math.round(parseFloat(amount || 0) * 1e8)
    : btcPrice ? Math.round((parseFloat(amount || 0) / btcPrice) * 1e8) : 0

  const tier = getSecurityTier(amtSats, btcPrice || 80000)

  const CONTACTS = [
    { name: 'Satoshi', npub: 'npub1sat...', trust: 95 },
    { name: 'Femi', npub: 'npub1fem...', trust: 88 },
    { name: 'Layla', npub: 'npub1lay...', trust: 82 },
  ]

  async function handleSend() {
    if (step === 1) { if (recipient) setStep(2); return }
    if (step === 2) { if (amtSats > 0) setStep(3); return }
    if (step === 3) {
      setLoading(true)
      setError('')
      try {
        // Demo send — in production wire to LDK/Cashu/on-chain
        await new Promise(r => setTimeout(r, 1500))
        setSent(true)
        setTimeout(() => { setSent(false); setStep(1); setRecipient(''); setAmount('') }, 3000)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
  }

  if (sent) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Sent!</div>
      <div style={{ fontSize: 13, color: C.muted }}>بارك الله فيك</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.cashuGreen, fontFamily: 'monospace' }}>
        {amtSats.toLocaleString()} sats
      </div>
    </div>
  )

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Send Bitcoin</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Any address, invoice, LNURL, or Nostr</div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[1,2,3].map(n => (
          <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= step ? C.btcOrange : C.border, transition: 'background 0.3s' }} />
        ))}
      </div>

      {step === 1 && <>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input value={recipient} onChange={e => setRecipient(e.target.value)}
            placeholder="Bitcoin address, Lightning invoice, @user, npub..."
            style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 48px 14px 14px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => setScanning(true)} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: C.nostrBlue + '18', border: `1px solid ${C.nostrBlue}44`,
            borderRadius: 8, padding: '4px 7px', cursor: 'pointer', lineHeight: 1,
          }}>
            <Icon name="scan" size={16} color={C.nostrBlue} />
          </button>
        </div>
        <SectionLabel>CONTACTS</SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CONTACTS.map(c => (
            <button key={c.name} onClick={() => setRecipient(c.npub)} style={{
              background: recipient === c.npub ? C.btcOrange + '22' : C.surface,
              border: `1px solid ${recipient === c.npub ? C.btcOrange : C.border}`,
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${C.btcOrange}, ${C.lightningPurple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
                {c.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 9, color: C.cashuGreen }}>Trust {c.trust}%</div>
              </div>
            </button>
          ))}
        </div>
        {scanning && (
          <QrScanner
            onScan={result => { setRecipient(result); setScanning(false) }}
            onClose={() => setScanning(false)}
          />
        )}
      </>}

      {step === 2 && <>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['sats', 'btc', 'gbp'].map(u => (
            <button key={u} onClick={() => setUnit(u)} style={{
              flex: 1, padding: 8, borderRadius: 8,
              background: unit === u ? C.btcOrange + '22' : C.surface,
              border: `1px solid ${unit === u ? C.btcOrange : C.border}`,
              color: unit === u ? C.btcOrange : C.muted, cursor: 'pointer',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            }}>{u}</button>
          ))}
        </div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0"
          style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 14px', color: C.btcOrange, fontSize: 32, fontFamily: 'monospace', fontWeight: 800, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: C.muted }}>
          {amtSats > 0 && `≈ £${(amtSats / 1e8 * (btcPrice || 80000)).toFixed(2)}`}
        </div>

        {/* Security tier */}
        {amtSats > 0 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: C.surface, borderRadius: 10 }}>
            <span style={{ fontSize: 16 }}>{tier.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Security: {tier.label}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Tier {tier.tier} of 4</div>
            </div>
          </div>
        )}

        <SectionLabel style={{ marginTop: 16 }}>ROUTE VIA</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { id: 'auto', label: '🤖 Auto-route', desc: 'Smart selection', color: C.cashuGreen },
            { id: 'lightning', label: '⚡ Lightning', desc: 'Instant · Low fee', color: C.lightningPurple },
            { id: 'onchain', label: '₿ On-chain', desc: 'Secure · Slow', color: C.btcOrange },
            { id: 'cashu', label: '🪙 Cashu', desc: 'Private · Offline', color: C.cashuGreen },
          ].map(l => (
            <button key={l.id} onClick={() => setLayer(l.id)} style={{
              background: layer === l.id ? l.color + '22' : C.surface,
              border: `1px solid ${layer === l.id ? l.color : C.border}`,
              borderRadius: 10, padding: 10, cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: layer === l.id ? l.color : C.text }}>{l.label}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </>}

      {step === 3 && (
        <Card glow={C.btcOrange}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>CONFIRM PAYMENT</div>
          {powerMode && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: C.lightningPurple + '0D', border: `1px solid ${C.lightningPurple}22`, borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted }}>
                fee: ~{feeRate?.fastestFee ?? '?'} sat/vB · ~{amountSats > 0 ? Math.ceil(amountSats * 0.001) : '?'} sats
              </span>
            </div>
          )}
          {shariahMode && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: C.cashuGreen + '0D', border: `1px solid ${C.cashuGreen}22`, borderRadius: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>☪️</span>
              <span style={{ fontSize: 11, color: C.cashuGreen, fontWeight: 600 }}>Shariah compliant · No riba · Peer-to-peer transfer</span>
            </div>
          )}
          {[
            { label: 'To', val: null, addr: recipient },
            { label: 'Amount', val: `${amtSats.toLocaleString()} sats` },
            { label: 'GBP equiv.', val: `≈ £${(amtSats / 1e8 * (btcPrice || 80000)).toFixed(2)}` },
            { label: 'Via', val: layer },
            { label: 'Fee', val: layer === 'onchain' ? '~2 sat/vB' : '~1 sat' },
            { label: 'Auth', val: tier.label },
          ].map(item => (
            <div key={item.label} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: item.addr ? 4 : 0 }}>{item.label}</span>
              {item.addr
                ? <AddressDisplay address={item.addr} style={{ fontSize: 11 }} />
                : <span style={{ fontSize: 12, color: C.text, fontWeight: 600, float: 'right', marginTop: -18 }}>{item.val}</span>
              }
            </div>
          ))}
          <div style={{ marginTop: 12, padding: 10, background: C.cashuGreen + '11', borderRadius: 10, border: `1px solid ${C.cashuGreen}33` }}>
            <div style={{ fontSize: 11, color: C.cashuGreen }}>🕌 Shariah status: Halal — No riba, no gharar</div>
          </div>
        </Card>
      )}

      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 8 }}>{error}</div>}

      <PrimaryBtn onClick={handleSend} style={{ marginTop: 20 }} disabled={loading}>
        {loading ? '⏳ Processing...' : step === 1 ? 'Continue →' : step === 2 ? 'Review →' : `${tier.icon} Confirm & Send`}
      </PrimaryBtn>

      {step > 1 && (
        <button onClick={() => setStep(s => s - 1)} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          ← Back
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </ScreenWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ReceiveScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// AddressDisplay — colour-coded address rendering for security verification
//
// Colour scheme:
//   Boilerplate prefix (bc1q / lnbc / npub1)  → muted grey
//   Key checksum sections (first/last chars)   → orange accent
//   Bulk body                                  → normal text
//   Lightning address user@domain              → user in orange
//   Amount embedded in BOLT11 prefix           → purple accent
// ─────────────────────────────────────────────────────────────────────────────
function AddressDisplay({ address, style }) {
  if (!address) return null

  const segments = parseAddressSegments(address)

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, lineHeight: 1.7,
      wordBreak: 'break-all', letterSpacing: 0.2,
      ...style,
    }}>
      {segments.map((seg, i) => (
        <span key={i} style={{ color: seg.color, fontWeight: seg.bold ? 700 : 400 }}>
          {seg.text}
        </span>
      ))}
    </div>
  )
}

function parseAddressSegments(addr) {
  const C_MUTED   = '#9A8F83'   // grey — boilerplate prefix
  const C_KEY     = '#F7931A'   // orange — key chars to verify
  const C_BODY    = '#1A1410'   // dark — bulk body
  const C_AMOUNT  = '#8B4CF7'   // purple — embedded amounts
  const C_DOMAIN  = '#4A3F35'   // warm dark — domain part

  // ── Lightning address: user@domain ──────────────────────────────────────────
  if (addr.includes('@') && !addr.startsWith('lnbc') && !addr.startsWith('ln')) {
    const atIdx = addr.indexOf('@')
    const user   = addr.slice(0, atIdx)
    const domain = addr.slice(atIdx + 1)
    return [
      { text: user,    color: C_KEY,    bold: true  },
      { text: '@',     color: C_MUTED,  bold: false },
      { text: domain,  color: C_DOMAIN, bold: false },
    ]
  }

  // ── Nostr npub / nsec ────────────────────────────────────────────────────────
  if (addr.startsWith('npub1') || addr.startsWith('nsec1') || addr.startsWith('nprofile1')) {
    const prefix = addr.match(/^(npub1|nsec1|nprofile1)/)?.[0] || ''
    const body   = addr.slice(prefix.length)
    const HL     = 6
    if (body.length <= HL * 2) {
      return [
        { text: prefix, color: C_MUTED, bold: false },
        { text: body,   color: C_KEY,   bold: true  },
      ]
    }
    return [
      { text: prefix,              color: C_MUTED, bold: false },
      { text: body.slice(0, HL),   color: C_KEY,   bold: true  },
      { text: body.slice(HL, -HL), color: C_BODY,  bold: false },
      { text: body.slice(-HL),     color: C_KEY,   bold: true  },
    ]
  }

  // ── Bitcoin on-chain: bc1q / bc1p (bech32/bech32m) ──────────────────────────
  if (addr.startsWith('bc1') || addr.startsWith('tb1') || addr.startsWith('bcrt1')) {
    // prefix is everything up to and including the separator char
    // bc1q → 4 chars, bc1p → 4 chars, tb1q → 4 chars
    const prefixLen = addr.startsWith('bcrt1') ? 5 : 4
    const prefix = addr.slice(0, prefixLen)
    const body   = addr.slice(prefixLen)
    const HL     = 5
    if (body.length <= HL * 2) {
      return [
        { text: prefix, color: C_MUTED, bold: false },
        { text: body,   color: C_KEY,   bold: true  },
      ]
    }
    return [
      { text: prefix,              color: C_MUTED, bold: false },
      { text: body.slice(0, HL),   color: C_KEY,   bold: true  },
      { text: body.slice(HL, -HL), color: C_BODY,  bold: false },
      { text: body.slice(-HL),     color: C_KEY,   bold: true  },
    ]
  }

  // ── Legacy Bitcoin: 1... / 3... ─────────────────────────────────────────────
  if (addr.match(/^[13][A-Za-z0-9]+$/)) {
    const HL = 4
    if (addr.length <= HL * 2) return [{ text: addr, color: C_KEY, bold: true }]
    return [
      { text: addr.slice(0, HL),    color: C_KEY,  bold: true  },
      { text: addr.slice(HL, -HL),  color: C_BODY, bold: false },
      { text: addr.slice(-HL),      color: C_KEY,  bold: true  },
    ]
  }

  // ── BOLT11 Lightning invoice: lnbc / lntb / lnbcrt ──────────────────────────
  if (addr.startsWith('lnbc') || addr.startsWith('lntb') || addr.startsWith('lnbcrt')) {
    // Extract network prefix (lnbc / lntb) + amount (digits + multiplier letter)
    const prefixMatch = addr.match(/^(ln(?:bc|tb|bcrt))([0-9]+[munp]?)?/)
    const netPrefix   = prefixMatch?.[1] || 'lnbc'
    const amountStr   = prefixMatch?.[2] || ''
    const rest        = addr.slice(netPrefix.length + amountStr.length)
    const HL          = 8
    const segments = [
      { text: netPrefix,  color: C_MUTED,  bold: false },
    ]
    if (amountStr) {
      segments.push({ text: amountStr, color: C_AMOUNT, bold: true })
    }
    if (rest.length <= HL * 2) {
      segments.push({ text: rest, color: C_KEY, bold: false })
    } else {
      segments.push({ text: rest.slice(0, HL),        color: C_KEY,  bold: true  })
      segments.push({ text: rest.slice(HL, -HL),      color: C_BODY, bold: false })
      segments.push({ text: rest.slice(-HL),          color: C_KEY,  bold: true  })
    }
    return segments
  }

  // ── Cashu token: cashu:... ──────────────────────────────────────────────────
  if (addr.startsWith('cashu')) {
    return [
      { text: 'cashu:', color: C_MUTED, bold: false },
      { text: addr.slice(6, 14), color: C_KEY, bold: true },
      { text: addr.slice(14, -8) || '', color: C_BODY, bold: false },
      { text: addr.slice(-8) || '', color: C_KEY, bold: true },
    ]
  }

  // ── Fallback: highlight first and last 6 chars ───────────────────────────────
  const HL = 6
  if (addr.length <= HL * 2) return [{ text: addr, color: C_KEY, bold: false }]
  return [
    { text: addr.slice(0, HL),    color: C_KEY,  bold: true  },
    { text: addr.slice(HL, -HL),  color: C_BODY, bold: false },
    { text: addr.slice(-HL),      color: C_KEY,  bold: true  },
  ]
}

// ── QR code helper (no npm install — loads qrcodejs from CDN once) ────────────
async function ensureQRLib() {
  if (window._qrLibLoaded) return true
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    s.onload  = () => { window._qrLibLoaded = true; resolve(true) }
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
}

async function drawQR(canvas, text) {
  if (!canvas || !text) return false
  const ok = await ensureQRLib()
  if (!ok || !window.QRCode) return false
  try {
    const tmp = document.createElement('div')
    tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:200px;height:200px'
    document.body.appendChild(tmp)
    new window.QRCode(tmp, {
      text,
      width: 200,
      height: 200,
      colorDark: '#1A1410',
      colorLight: '#FAF8F5',
      correctLevel: window.QRCode.CorrectLevel.M,
    })
    await new Promise(r => setTimeout(r, 80))
    const src = tmp.querySelector('canvas')
    if (src) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
      document.body.removeChild(tmp)
      return true
    }
    document.body.removeChild(tmp)
    return false
  } catch { return false }
}

export function ReceiveScreen() {
  const { session, meta, addresses } = useWallet()
  const [type, setType] = useState('lightning')
  const [amountReq, setAmountReq] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrReady, setQrReady] = useState(false)
  const qrRef = useRef(null)

  const addr = {
    lightning: meta?.lightningAddress || 'user@ijma.app',
    onchain: addresses[0]?.address || 'bc1q...loading',
    cashu: 'cashu:token:pending',
    nostr: session?.nostr?.npub || 'npub1...',
  }[type]

  // Regenerate QR whenever the address changes
  useEffect(() => {
    setQrReady(false)
    if (!qrRef.current || !addr || addr.includes('...loading')) return
    drawQR(qrRef.current, addr).then(ok => setQrReady(ok))
  }, [addr])

  const copy = () => {
    navigator.clipboard?.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Receive Bitcoin</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Share your address or invoice</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'lightning', label: '⚡ Lightning', color: C.lightningPurple },
          { id: 'onchain', label: '₿ On-chain', color: C.btcOrange },
          { id: 'cashu', label: '🪙 Cashu Token', color: C.cashuGreen },
          { id: 'nostr', label: 'Nostr Zap', color: C.nostrBlue },
        ].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{
            padding: 10, borderRadius: 10,
            background: type === t.id ? t.color + '22' : C.surface,
            border: `1px solid ${type === t.id ? t.color : C.border}`,
            color: type === t.id ? t.color : C.muted, cursor: 'pointer', fontSize: 12, fontWeight: 700,
          }}>{t.label}</button>
        ))}
      </div>

      <Card style={{ textAlign: 'center', marginBottom: 12 }}>
        {/* Live QR code */}
        <div style={{
          width: 200, height: 200, margin: '0 auto 16px',
          background: '#FAF8F5', borderRadius: 14,
          border: `3px solid ${qrReady ? C.btcOrange : C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: qrReady ? `0 4px 24px ${C.btcOrange}22` : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}>
          <canvas
            ref={qrRef}
            width={200}
            height={200}
            style={{ display: 'block', opacity: qrReady ? 1 : 0, transition: 'opacity 0.3s' }}
          />
          {!qrReady && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                border: `2px solid ${C.border}`, borderTopColor: C.btcOrange,
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: 11, color: C.muted }}>Generating QR…</div>
            </div>
          )}
        </div>

        <div style={{
          background: C.surface2, borderRadius: 10, padding: '10px 12px',
          wordBreak: 'break-all', textAlign: 'left', marginBottom: 12,
        }}>
          <AddressDisplay address={addr} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copy} style={{
            flex: 1, background: copied ? C.cashuGreen + '22' : C.btcOrange + '22',
            border: `1px solid ${copied ? C.cashuGreen : C.btcOrange}44`, borderRadius: 10,
            padding: 10, color: copied ? C.cashuGreen : C.btcOrange, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{copied ? '✓ Copied!' : '📋 Copy'}</button>
          <button onClick={() => navigator.share?.({ text: addr, title: 'Ijma Wallet — Receive' })} style={{
            flex: 1, background: C.lightningPurple + '22',
            border: `1px solid ${C.lightningPurple}44`, borderRadius: 10,
            padding: 10, color: C.lightningPurple, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>↑ Share</button>
        </div>
      </Card>

      <Card>
        <SectionLabel>REQUEST SPECIFIC AMOUNT</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={amountReq} onChange={e => setAmountReq(e.target.value)} placeholder="Amount in sats..." type="number"
            style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none' }} />
          <button style={{ background: C.btcOrange, border: 'none', borderRadius: 10, padding: '10px 16px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Generate
          </button>
        </div>
      </Card>
    </ScreenWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EcashScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function EcashScreen() {
  const { session } = useWallet()
  const [tab, setTab] = useState('cashu')
  const [mintInput, setMintInput] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleReceiveToken() {
    if (!tokenInput) return
    setLoading(true)
    setMsg('')
    try {
      // In production: call receiveToken() from cashu.js
      await new Promise(r => setTimeout(r, 1000))
      setMsg('✓ Token received! Balance updated.')
      setTokenInput('')
    } catch (e) {
      setMsg('✗ ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Ecash Vaults</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Private digital cash · Cashu & Fedimint</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'cashu', label: '🪙 Cashu', color: C.cashuGreen },
          { id: 'fedimint', label: '🏛️ Fedimint', color: C.fedimintIndigo },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: 12, borderRadius: 12,
            background: tab === t.id ? t.color + '22' : C.surface,
            border: `1px solid ${tab === t.id ? t.color : C.border}`,
            color: tab === t.id ? t.color : C.muted, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'cashu' && <>
        <Card glow={C.cashuGreen} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.cashuGreen, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>CASHU BALANCE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: 'monospace', marginBottom: 4 }}>
            12,500 <span style={{ fontSize: 13, color: C.muted }}>sats</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Maximum privacy · Chaumian blind signatures · Offline capable</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, background: C.cashuGreen + '22', border: `1px solid ${C.cashuGreen}44`, borderRadius: 10, padding: 10, color: C.cashuGreen, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ⚡ Mint Tokens
            </button>
            <button style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ↗ Send/Melt
            </button>
          </div>
        </Card>

        {/* Receive token */}
        <Card style={{ marginBottom: 12 }}>
          <SectionLabel>RECEIVE CASHU TOKEN</SectionLabel>
          <textarea value={tokenInput} onChange={e => setTokenInput(e.target.value)}
            placeholder="Paste cashuA... token here"
            rows={3} style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.text, fontSize: 11, fontFamily: 'monospace', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          {msg && <div style={{ fontSize: 11, color: msg.startsWith('✓') ? C.cashuGreen : C.error, marginBottom: 8 }}>{msg}</div>}
          <button onClick={handleReceiveToken} disabled={loading || !tokenInput} style={{
            width: '100%', background: tokenInput ? C.cashuGreen : C.surface2,
            border: `1px solid ${tokenInput ? C.cashuGreen : C.border}`, borderRadius: 10,
            padding: 10, color: tokenInput ? '#fff' : C.muted, fontSize: 12, fontWeight: 700, cursor: tokenInput ? 'pointer' : 'default',
          }}>{loading ? '⏳ Claiming...' : 'Claim Token'}</button>
        </Card>

        <SectionLabel>ACTIVE MINTS</SectionLabel>
        {[
          { name: 'Minibits', url: 'mint.minibits.cash', balance: 8500, trust: 94, color: C.cashuGreen },
          { name: 'LNbits Legend', url: 'legend.lnbits.com', balance: 4000, trust: 79, color: C.warning },
        ].map(mint => (
          <Card key={mint.name} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: mint.color + '22', border: `1px solid ${mint.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🪙</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{mint.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{mint.url}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: C.text, fontWeight: 700 }}>{mint.balance.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: mint.trust > 90 ? C.cashuGreen : C.warning }}>Trust {mint.trust}%</div>
              </div>
            </div>
          </Card>
        ))}

        <button style={{ width: '100%', marginTop: 4, background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: 12, color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          + Add Mint
        </button>
      </>}

      {tab === 'fedimint' && <>
        <Card glow={C.fedimintIndigo} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.fedimintIndigo, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>FEDIMINT BALANCE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: 'monospace', marginBottom: 4 }}>
            200,000 <span style={{ fontSize: 13, color: C.muted }}>sats</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Distributed custody · 3-of-5 threshold guardians · High privacy</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, background: C.fedimintIndigo + '22', border: `1px solid ${C.fedimintIndigo}44`, borderRadius: 10, padding: 10, color: C.fedimintIndigo, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ⚡ Deposit
            </button>
            <button style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ↗ Withdraw
            </button>
          </div>
        </Card>

        <SectionLabel>FEDERATIONS</SectionLabel>
        <Card style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.fedimintIndigo + '22', border: `1px solid ${C.fedimintIndigo}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏛️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Community Federation</div>
              <div style={{ fontSize: 10, color: C.muted }}>3-of-5 guardians · Active · LN gateway ready</div>
            </div>
            <Badge label="Active" color={C.cashuGreen} />
          </div>
          <div style={{ marginTop: 10, background: C.fedimintIndigo + '11', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: C.fedimintIndigo }}>⚡ Lightning deposits & withdrawals via gateway</div>
          </div>
        </Card>

        <button style={{ width: '100%', background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: 12, color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          + Join a Federation
        </button>
      </>}
    </ScreenWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NostrScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function NostrScreen() {
  const { session, meta } = useWallet()
  const [zapAmount, setZapAmount] = useState(21)
  const [zapTarget, setZapTarget] = useState('')
  const [zapMsg, setZapMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const nostr = session?.nostr

  const contacts = [
    { name: 'Satoshi', npub: 'npub1sat...', trust: 95 },
    { name: 'Femi', npub: 'npub1fem...', trust: 88 },
    { name: 'Layla', npub: 'npub1lay...', trust: 82 },
    { name: 'Adam', npub: 'npub1adm...', trust: 76 },
  ]

  async function handleZap() {
    if (!zapTarget) return
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1200))
      setZapMsg({ ok: true, text: `⚡ Zapped ${zapAmount} sats! بارك الله فيك` })
      setTimeout(() => setZapMsg(null), 3000)
    } catch (e) {
      setZapMsg({ ok: false, text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Nostr Identity</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Social · Payments · Web of Trust</div>

      {/* Profile */}
      <Card glow={C.nostrBlue} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.btcOrange}, ${C.lightningPurple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
          }}>{(meta?.username || 'U')[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>@{meta?.username || 'user'}</div>
            {nostr && <div style={{ fontSize: 11, color: C.nostrBlue, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nostr.npub.slice(0, 16)}...{nostr.npub.slice(-8)}
            </div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <Badge label="NIP-06 ✓" color={C.cashuGreen} />
              {meta?.lightningAddress && <Badge label="⚡ Lightning" color={C.lightningPurple} />}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {['Edit Profile', 'Share npub', 'NWC'].map(label => (
            <button key={label} style={{
              flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 8, color: C.muted, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </Card>

      {/* Show nsec warning if power mode */}
      {nostr && (
        <div style={{ marginBottom: 12, padding: 10, background: C.warning + '11', border: `1px solid ${C.warning}33`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: C.warning }}>🔐 Your nsec (private key) is encrypted in the vault. Never export it unless backing up.</div>
        </div>
      )}

      {/* Zap */}
      <SectionLabel>SEND ZAP ⚡</SectionLabel>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
          {[21, 100, 210, 1000, 2100, 10000].map(n => (
            <button key={n} onClick={() => setZapAmount(n)} style={{
              padding: 8, borderRadius: 8,
              background: zapAmount === n ? C.btcOrange + '22' : C.surface2,
              border: `1px solid ${zapAmount === n ? C.btcOrange : C.border}`,
              color: zapAmount === n ? C.btcOrange : C.muted,
              cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            }}>⚡ {n.toLocaleString()}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={zapTarget} onChange={e => setZapTarget(e.target.value)}
            placeholder="@username, npub, or LN address..."
            style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 12, outline: 'none' }} />
          <button onClick={handleZap} disabled={loading || !zapTarget} style={{
            background: zapTarget ? `linear-gradient(90deg, ${C.btcOrange}, ${C.lightningPurple})` : C.surface2,
            border: 'none', borderRadius: 10, padding: '10px 16px',
            color: zapTarget ? '#fff' : C.muted, fontSize: 12, fontWeight: 800, cursor: zapTarget ? 'pointer' : 'default',
          }}>{loading ? '⏳' : '⚡ Zap'}</button>
        </div>
        {zapMsg && (
          <div style={{ marginTop: 8, padding: 8, background: (zapMsg.ok ? C.cashuGreen : C.error) + '22', borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: zapMsg.ok ? C.cashuGreen : C.error }}>{zapMsg.text}</span>
          </div>
        )}
      </Card>

      {/* Web of Trust */}
      <SectionLabel>WEB OF TRUST</SectionLabel>
      <Card style={{ marginBottom: 12 }}>
        {contacts.map((c, i) => (
          <div key={c.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: `linear-gradient(135deg, ${C.btcOrange}88, ${C.lightningPurple}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{c.npub}</div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.trust > 90 ? C.cashuGreen : c.trust > 80 ? C.warning : C.error }}>
                  {c.trust}%
                </div>
                <div style={{ fontSize: 9, color: C.muted }}>trust</div>
              </div>
              <button onClick={() => setZapTarget(c.npub)} style={{
                background: C.lightningPurple + '22', border: `1px solid ${C.lightningPurple}44`,
                borderRadius: 8, padding: '6px 10px', color: C.lightningPurple, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>⚡</button>
            </div>
            {i < contacts.length - 1 && <div style={{ height: 1, background: C.border }} />}
          </div>
        ))}
      </Card>

      <Card style={{ background: C.lightningPurple + '0A' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.lightningPurple, marginBottom: 6 }}>🔐 Trust Algorithm (NIP-based)</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', lineHeight: 2 }}>
          Score = (Direct × 0.5)<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (Network × 0.3)<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (Activity × 0.2)
        </div>
      </Card>
    </ScreenWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { meta, session, powerMode, togglePowerMode, shariahMode, toggleShariahMode, lock, wipeWallet } = useWallet()
  const [showWipe, setShowWipe] = useState(false)
  const [wipePin, setWipePin] = useState('')
  const [wipeErr, setWipeErr] = useState('')
  const [tor, setTor] = useState(false)
  const [payjoin, setPayjoin] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSeedBackup, setShowSeedBackup] = useState(false)
  const [showZakat, setShowZakat] = useState(false)
  const [showSadaqah, setShowSadaqah] = useState(false)
  const { config: nodeConfig, setConfig: setNodeConfig } = useNodeConfig()
  const selectedCurrency = nodeConfig.displayCurrency || 'gbp'

  // Show Zakat calculator
  if (showZakat) {
    return <ZakatCalculatorScreen onClose={() => setShowZakat(false)} />
  }

  // Show Sadaqah module
  if (showSadaqah) {
    return <SadaqahScreen onClose={() => setShowSadaqah(false)} />
  }

  // Show seed backup flow
  if (showSeedBackup) {
    return <SeedBackupScreen onClose={() => setShowSeedBackup(false)} />
  }

  // Show advanced settings screen
  if (showAdvanced) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 4px' }}>
          <button onClick={() => setShowAdvanced(false)} style={{
            background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            color: C.muted, fontSize: 12, fontWeight: 700,
          }}>← Back</button>
        </div>
        <AdvancedSettingsScreen />
      </div>
    )
  }

  const Toggle = ({ on, onToggle, color = C.btcOrange }) => (
    <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: on ? color : C.surface2, border: `1px solid ${on ? color : C.border}`, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
    </div>
  )

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Settings</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Sovereign · Private · Halal</div>

      {/* ── Display Currency ── */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>DISPLAY CURRENCY</SectionLabel>
        <Card>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            All balances, amounts and fees will be shown in your chosen currency.
            Bitcoin price is fetched in real time — or choose Sats Only for maximum privacy.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {FIAT_CURRENCIES.map(cur => {
              const isSelected = selectedCurrency === cur.code
              return (
                <button
                  key={cur.code}
                  onClick={() => setNodeConfig({ displayCurrency: cur.code })}
                  style={{
                    background: isSelected ? C.btcOrange + '18' : C.surface2,
                    border: `1px solid ${isSelected ? C.btcOrange : C.border}`,
                    borderRadius: 10, padding: '9px 6px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{cur.flag}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isSelected ? C.btcOrange : C.text,
                  }}>{cur.code.toUpperCase()}</span>
                  <span style={{ fontSize: 9, color: C.muted }}>{cur.symbol}</span>
                </button>
              )
            })}
            {/* Sats Only option */}
            <button
              onClick={() => setNodeConfig({ displayCurrency: 'sats', priceFeed: 'none' })}
              style={{
                background: selectedCurrency === 'sats' ? C.lightningPurple + '18' : C.surface2,
                border: `1px solid ${selectedCurrency === 'sats' ? C.lightningPurple : C.border}`,
                borderRadius: 10, padding: '9px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>⚡</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: selectedCurrency === 'sats' ? C.lightningPurple : C.text,
              }}>SATS</span>
              <span style={{ fontSize: 9, color: C.muted }}>No price</span>
            </button>
          </div>
          {selectedCurrency && selectedCurrency !== 'sats' && (
            <div style={{
              marginTop: 10, padding: '8px 10px',
              background: C.cashuGreen + '0D',
              border: `1px solid ${C.cashuGreen}22`,
              borderRadius: 8, fontSize: 11, color: C.muted,
            }}>
              ✓ Displaying in {FIAT_CURRENCIES.find(c => c.code === selectedCurrency)?.name || selectedCurrency.toUpperCase()}.
              Change price source in <span
                onClick={() => setShowAdvanced(true)}
                style={{ color: C.btcOrange, cursor: 'pointer', textDecoration: 'underline' }}
              >Advanced Settings</span>.
            </div>
          )}
        </Card>
      </div>

      {[
        {
          title: 'SECURITY',
          items: [
            { icon: '🔑', label: 'Seed Phrase Backup', sub: 'BIP39 · 24 words encrypted', right: '›', color: C.warning, onPress: () => setShowSeedBackup(true) },
            { icon: '🛡️', label: 'Multi-Sig Setup', sub: '2-of-3 hardware wallet', right: '›', color: C.btcOrange },
            { icon: '👥', label: 'Social Recovery', sub: 'Nostr guardians · Shamir SSS', right: '›', color: C.lightningPurple },
            { icon: '⏰', label: 'Spending Limits', sub: 'Auto-lock after 5 min', right: '›', color: C.cashuGreen },
          ]
        },
        {
          title: 'PRIVACY',
          items: [
            { icon: '🧅', label: 'Tor Routing', sub: 'Route all traffic via Tor', toggle: true, on: tor, onToggle: () => setTor(!tor), color: C.nostrBlue },
            { icon: '🔏', label: 'Coin Control', sub: 'UTXO labeling & selection', right: '›', color: C.btcOrange },
            { icon: '🔄', label: 'Payjoin (BIP78)', sub: 'Collaborative transactions', toggle: true, on: payjoin, onToggle: () => setPayjoin(!payjoin), color: C.cashuGreen },
          ]
        },
        {
          title: 'SHARIAH',
          items: [
            { icon: '☪️', label: 'Shariah Mode', sub: shariahMode ? 'Active · No riba · No gharar · Halal' : 'Tap to enable halal features', toggle: true, on: shariahMode, onToggle: toggleShariahMode, color: C.cashuGreen },
            { icon: '🕌', label: 'Zakat Calculator', sub: shariahMode ? '2.5% · Live nisab threshold' : 'Enable Shariah Mode first', right: '›', color: shariahMode ? C.cashuGreen : C.muted, onPress: shariahMode ? () => setShowZakat(true) : null },
            { icon: '💚', label: 'Sadaqah', sub: shariahMode ? 'Bitcoin-accepting Islamic charities' : 'Enable Shariah Mode first', right: '›', color: shariahMode ? C.ijmaTeal : C.muted, onPress: shariahMode ? () => setShowSadaqah(true) : null },
          ]
        },
        {
          title: 'NODE',
          items: [
            { icon: '⚙️', label: 'Connect Bitcoin Node', sub: 'RPC · Electrum · Tor', right: '›', color: C.muted },
            { icon: '🌐', label: 'Electrum Server', sub: 'Using public fallback', right: '›', color: C.cashuGreen },
          ]
        },
        {
          title: 'ADVANCED',
          items: [
            { icon: '🔧', label: 'Advanced Settings', sub: 'Block explorers · Price feeds · Nodes', right: '›', color: C.btcOrange, onPress: () => setShowAdvanced(true) },
          ]
        },
        {
          title: 'INTERFACE',
          items: [
            { icon: '⚡', label: 'Advanced View', sub: powerMode ? 'Showing technical details' : 'Showing simplified view', toggle: true, on: powerMode, onToggle: togglePowerMode, color: C.lightningPurple },
          ]
        },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: 16 }}>
          <SectionLabel>{section.title}</SectionLabel>
          <Card>
            {section.items.map((item, i) => (
              <div key={item.label}>
                <div
                  onClick={item.onPress}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', cursor: item.onPress ? 'pointer' : 'default' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{item.sub}</div>
                  </div>
                  {item.toggle
                    ? <Toggle on={item.on} onToggle={item.onToggle} color={item.color} />
                    : <span style={{ color: C.muted, fontSize: 16 }}>{item.right}</span>
                  }
                </div>
                {i < section.items.length - 1 && <div style={{ height: 1, background: C.border, marginLeft: 42 }} />}
              </div>
            ))}
          </Card>
        </div>
      ))}

      {/* Actions */}
      <SectionLabel>WALLET ACTIONS</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={lock} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          🔒 Lock Wallet
        </button>
        <button onClick={() => setShowWipe(!showWipe)} style={{ flex: 1, background: C.error + '11', border: `1px solid ${C.error}44`, borderRadius: 12, padding: 12, color: C.error, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          🗑️ Wipe Wallet
        </button>
      </div>

      {showWipe && (
        <Card style={{ border: `1px solid ${C.error}55`, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.error, fontWeight: 700, marginBottom: 8 }}>⚠️ This permanently deletes all wallet data. Back up your seed first!</div>
          <input value={wipePin} onChange={e => setWipePin(e.target.value)} placeholder="Enter PIN to confirm" type="password"
            style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          {wipeErr && <div style={{ fontSize: 11, color: C.error, marginBottom: 8 }}>{wipeErr}</div>}
          <button onClick={async () => {
            try { await wipeWallet(wipePin) }
            catch (e) { setWipeErr(e.message) }
          }} style={{ width: '100%', background: C.error, border: 'none', borderRadius: 10, padding: 10, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            Wipe Everything
          </button>
        </Card>
      )}

      <div style={{ textAlign: 'center', padding: '8px 0 16px', fontSize: 10, color: C.muted, lineHeight: 1.8 }}>
        إجماع · Ijma Wallet v0.1.0<br />
        MIT License · Open Source<br />
        Built by Blockchainology<br />
        <span style={{ color: C.cashuGreen }}>Sovereign · Private · Halal</span>
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SeedBackupScreen — reveal and verify the 24-word seed phrase
// ─────────────────────────────────────────────────────────────────────────────
function SeedBackupScreen({ onClose }) {
  const { session } = useWallet()
  const [phase, setPhase] = useState('warning')   // warning | loading | reveal | done
  const [words, setWords] = useState([])
  const [revealed, setRevealed] = useState(new Set())
  const [error, setError] = useState('')

  const allRevealed = words.length > 0 && revealed.size === words.length

  async function loadSeed() {
    setPhase('loading')
    setError('')
    try {
      const mnemonic = await secureGet('mnemonic', session?.password)
      if (!mnemonic) throw new Error('Could not decrypt seed phrase. Try locking and unlocking first.')
      setWords(mnemonic.split(' '))
      setPhase('reveal')
    } catch (e) {
      setError(e.message)
      setPhase('warning')
    }
  }

  function toggleWord(i) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function revealAll() {
    setRevealed(new Set(Array.from({ length: words.length }, (_, i) => i)))
  }

  // ── Warning screen ──────────────────────────────────────────────────────────
  if (phase === 'warning') return (
    <ScreenWrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={onClose} style={{
          background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          color: C.muted, fontSize: 13, fontWeight: 600,
        }}>← Back</button>
      </div>

      {/* Red warning card */}
      <div style={{
        background: C.error + '0C', border: `1.5px solid ${C.error}33`,
        borderRadius: 16, padding: '28px 22px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.error, marginBottom: 10, textAlign: 'center' }}>
          Before you continue
        </div>
        {[
          'Your seed phrase is the only way to recover your wallet.',
          'Anyone who sees these 24 words can steal all your funds.',
          'Never enter them into any website, app, or message.',
          'Write them down on paper — never save as a screenshot or photo.',
          'Check no one can see your screen right now.',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{ color: C.error, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
            <span style={{ fontSize: 14, color: C.text2, lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: C.error + '12', border: `1px solid ${C.error}33`, borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: C.error }}>
          {error}
        </div>
      )}

      <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
        Your wallet is already unlocked — no PIN needed. The seed will be<br />
        decrypted from the secure vault on this device only.
      </div>

      <PrimaryBtn onClick={loadSeed}>
        I understand — show my seed phrase
      </PrimaryBtn>
    </ScreenWrapper>
  )

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <ScreenWrapper>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          border: `3px solid ${C.border}`, borderTopColor: C.btcOrange,
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 14, color: C.muted }}>Decrypting seed phrase…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </ScreenWrapper>
  )

  // ── Reveal grid ─────────────────────────────────────────────────────────────
  if (phase === 'reveal') return (
    <ScreenWrapper>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <button onClick={onClose} style={{
          background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          color: C.muted, fontSize: 13, fontWeight: 600,
        }}>← Back</button>
        <button onClick={revealAll} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.btcOrange, fontSize: 13, fontWeight: 600,
        }}>Reveal all</button>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 2 }}>Recovery Phrase</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
        Tap each word to reveal it. Write them down in order — keep it safe and private.
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${C.btcOrange}, ${C.lightningPurple})`,
          width: `${(revealed.size / words.length) * 100}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Word grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {words.map((word, i) => {
          const isRevealed = revealed.has(i)
          return (
            <button key={i} onClick={() => toggleWord(i)} style={{
              background: isRevealed ? C.surface : C.surface2,
              border: `1.5px solid ${isRevealed ? C.btcOrange + '66' : C.border}`,
              borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
              boxShadow: isRevealed ? `0 2px 8px ${C.btcOrange}18` : 'none',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: C.muted,
                letterSpacing: 0.5,
              }}>#{i + 1}</span>
              {isRevealed ? (
                <span style={{
                  fontSize: 14, fontWeight: 700, color: C.text,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: -0.3,
                }}>{word}</span>
              ) : (
                <span style={{
                  fontSize: 20, letterSpacing: 2, color: C.border, userSelect: 'none',
                }}>••••</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Status / CTA */}
      {!allRevealed ? (
        <div style={{
          textAlign: 'center', fontSize: 13, color: C.muted,
          padding: '14px', background: C.surface2, borderRadius: 12,
        }}>
          {revealed.size} of {words.length} words revealed
        </div>
      ) : (
        <div>
          <div style={{
            background: C.cashuGreen + '0F', border: `1px solid ${C.cashuGreen}33`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 16,
            fontSize: 13, color: C.cashuGreen, textAlign: 'center', lineHeight: 1.5,
          }}>
            ✓ All 24 words revealed. Have you written them all down?
          </div>
          <PrimaryBtn onClick={() => { setPhase('done'); setRevealed(new Set()) }}>
            Yes, I have written them down
          </PrimaryBtn>
        </div>
      )}

      {/* Security reminder */}
      <div style={{
        marginTop: 16, padding: '12px 14px',
        background: C.warning + '0A', border: `1px solid ${C.warning}22`,
        borderRadius: 10, fontSize: 12, color: C.muted, lineHeight: 1.6,
      }}>
        🔒 This screen will clear automatically when you leave.
        Never share these words with anyone — not even Blockchainology.
      </div>
    </ScreenWrapper>
  )

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <ScreenWrapper>
      <div style={{ textAlign: 'center', padding: '60px 0 40px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          Backup Complete
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>بارك الله فيك</div>
        <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 32px' }}>
          Your seed phrase is safely backed up. Keep it somewhere only you can access — ideally engraved on metal or stored in a secure location offline.
        </div>
        <PrimaryBtn onClick={onClose} style={{ maxWidth: 280, margin: '0 auto' }}>
          Done
        </PrimaryBtn>
      </div>
    </ScreenWrapper>
  )

  return null
}



// ─────────────────────────────────────────────────────────────────────────────
// ZakatCalculatorScreen
// Real nisab calculation using live BTC price.
// Nisab = value of 85g of gold or 595g of silver (we use gold standard).
// Zakat = 2.5% of zakatable wealth held for one lunar year (hawl).
// ─────────────────────────────────────────────────────────────────────────────
function ZakatCalculatorScreen({ onClose }) {
  const { balances, btcPrice } = useWallet()

  // Nisab thresholds (approximate — user should verify with their scholar)
  // Gold nisab: 85g × ~£62/g = ~£5,270 (fluctuates — we show the calc)
  const GOLD_PRICE_PER_GRAM_GBP = 62   // approximate — update periodically
  const NISAB_GOLD_GRAMS = 85
  const nisabGBP = GOLD_PRICE_PER_GRAM_GBP * NISAB_GOLD_GRAMS

  const totalSats = Object.values(balances).reduce((s, v) => s + (v || 0), 0)
  const totalGBP = btcPrice ? (totalSats / 1e8) * btcPrice : null

  const aboveNisab = totalGBP !== null && totalGBP >= nisabGBP
  const zakatDueGBP = aboveNisab && totalGBP ? totalGBP * 0.025 : 0
  const zakatDueSats = btcPrice && zakatDueGBP ? Math.round((zakatDueGBP / btcPrice) * 1e8) : 0

  return (
    <ScreenWrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onClose} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 600 }}>← Back</button>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 2 }}>Zakat Calculator</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>2.5% on wealth held above nisab for one lunar year (hawl)</div>

      {/* Nisab threshold card */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Nisab Threshold (Gold Standard)</div>
        {[
          { label: 'Gold weight', val: `${NISAB_GOLD_GRAMS}g` },
          { label: 'Gold price (approx)', val: `£${GOLD_PRICE_PER_GRAM_GBP}/g` },
          { label: 'Nisab threshold', val: `£${nisabGBP.toLocaleString()}` },
          { label: 'Your total wealth', val: totalGBP !== null ? `£${totalGBP.toFixed(2)}` : 'No price feed' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.text2 }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{r.val}</span>
          </div>
        ))}
      </Card>

      {/* Status */}
      {totalGBP !== null ? (
        <div style={{
          padding: '16px', borderRadius: 14, marginBottom: 16, textAlign: 'center',
          background: aboveNisab ? C.cashuGreen + '10' : C.surface2,
          border: `1.5px solid ${aboveNisab ? C.cashuGreen + '44' : C.border}`,
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{aboveNisab ? '☪️' : '✓'}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: aboveNisab ? C.cashuGreen : C.text2, marginBottom: 4 }}>
            {aboveNisab ? 'Zakat is due' : 'Below nisab threshold'}
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
            {aboveNisab
              ? `Your wealth of £${totalGBP.toFixed(2)} exceeds the nisab of £${nisabGBP.toLocaleString()}.`
              : `Your wealth of £${totalGBP.toFixed(2)} is below the nisab threshold.`
            }
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px', borderRadius: 14, marginBottom: 16, background: C.surface2, textAlign: 'center', fontSize: 13, color: C.muted }}>
          Enable a price feed in Settings to calculate zakat
        </div>
      )}

      {/* Zakat due */}
      {aboveNisab && (
        <Card glow={C.cashuGreen} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Zakat Due (2.5%)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.text2 }}>In GBP</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.cashuGreen }}>£{zakatDueGBP.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: C.text2 }}>In sats</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.cashuGreen, fontFamily: "'JetBrains Mono', monospace" }}>{zakatDueSats.toLocaleString()} sats</span>
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div style={{ padding: '12px 14px', background: C.warning + '0A', border: `1px solid ${C.warning}22`, borderRadius: 10, fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
        ⚠️ This calculator is a guide only. Nisab values fluctuate daily. Zakat applies only to wealth held for a full lunar year (hawl). Please consult a qualified Islamic scholar or Zakat organisation for your specific circumstances.
      </div>

      {aboveNisab && (
        <PrimaryBtn onClick={onClose} style={{ background: `linear-gradient(135deg, ${C.cashuGreen}, #008055)` }}>
          Pay Zakat via Sadaqah →
        </PrimaryBtn>
      )}
    </ScreenWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SadaqahScreen — Bitcoin-accepting Islamic charities
// ─────────────────────────────────────────────────────────────────────────────
const SADAQAH_ORGS = [
  {
    name: 'Islamic Relief',
    desc: 'Global humanitarian aid. Emergency relief, education, livelihoods.',
    url: 'https://islamic-relief.org',
    bitcoin: true,
    lightning: false,
    category: 'Humanitarian',
    color: '#00A86B',
  },
  {
    name: 'Muslim Aid',
    desc: 'UK-based. Poverty alleviation, healthcare, water projects globally.',
    url: 'https://muslimaid.org',
    bitcoin: true,
    lightning: false,
    category: 'Humanitarian',
    color: '#0098D4',
  },
  {
    name: 'Zakat Foundation',
    desc: 'Dedicated Zakat collection and distribution. Shariah-supervised.',
    url: 'https://zakat.org',
    bitcoin: true,
    lightning: false,
    category: 'Zakat',
    color: C.gold,
  },
  {
    name: 'Human Appeal',
    desc: 'Emergency response, orphan sponsorship, sustainable development.',
    url: 'https://humanappeal.org.uk',
    bitcoin: true,
    lightning: false,
    category: 'Humanitarian',
    color: '#8B4CF7',
  },
  {
    name: 'Helping Hands',
    desc: 'UK-based. Masjid, school, and community infrastructure projects.',
    url: 'https://helpinghandsglobal.org',
    bitcoin: false,
    lightning: false,
    category: 'Community',
    color: '#F7931A',
  },
]

function SadaqahScreen({ onClose }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', ...new Set(SADAQAH_ORGS.map(o => o.category))]
  const filtered = filter === 'All' ? SADAQAH_ORGS : SADAQAH_ORGS.filter(o => o.category === filter)

  return (
    <ScreenWrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onClose} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 600 }}>← Back</button>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 2 }}>Sadaqah</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Bitcoin-accepting Islamic charities · Verified organisations</div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            background: filter === cat ? C.cashuGreen + '18' : C.surface2,
            border: `1px solid ${filter === cat ? C.cashuGreen + '44' : C.border}`,
            borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            color: filter === cat ? C.cashuGreen : C.muted,
          }}>{cat}</button>
        ))}
      </div>

      {/* Org cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(org => (
          <Card key={org.name} style={{ borderLeft: `3px solid ${org.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>{org.name}</div>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: org.color, background: org.color + '14', padding: '2px 8px', borderRadius: 10 }}>{org.category}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {org.bitcoin && <span style={{ fontSize: 10, fontWeight: 700, color: C.btcOrange, background: C.btcOrange + '14', padding: '3px 8px', borderRadius: 10 }}>₿</span>}
                {org.lightning && <span style={{ fontSize: 10, fontWeight: 700, color: C.lightningPurple, background: C.lightningPurple + '14', padding: '3px 8px', borderRadius: 10 }}>⚡</span>}
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, marginBottom: 12 }}>{org.desc}</div>
            <button
              onClick={() => window.open(org.url, '_blank')}
              style={{
                width: '100%', background: org.color + '10', border: `1px solid ${org.color}33`,
                borderRadius: 10, padding: '10px', cursor: 'pointer',
                color: org.color, fontSize: 13, fontWeight: 600,
              }}
            >
              Visit {org.name} →
            </button>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '12px 14px', background: C.surface2, borderRadius: 10, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        ℹ️ Always verify a charity's Bitcoin address directly on their official website before donating. Ijma does not receive any commission or affiliation fee from these organisations.
      </div>
    </ScreenWrapper>
  )
}
