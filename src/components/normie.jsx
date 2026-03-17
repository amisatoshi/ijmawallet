/**
 * Ijma Wallet — Normie UX Components
 *
 * ScratchReveal     — scratch to reveal seed phrase words
 * HintBubble        — contextual help tooltip for new users
 * QrScanner         — camera-based QR code scanner
 * BalanceSummary    — Payments vs Savings split (normie framing)
 * HideBalance       — animated balance hide/reveal with eye icon
 * WalletBackup      — export encrypted backup / delete wallet
 * ContactCard       — "Contact" framing instead of "Address"
 * OnboardHint       — first-run hints system
 * SuccessAnimation  — celebration on completed action
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { C, Card, PrimaryBtn } from './shared.jsx'
import { Icon } from './icons.jsx'

// ─── 1. Scratch Card Seed Reveal ──────────────────────────────────────────────

/**
 * A canvas-based scratch-to-reveal component.
 * The seed word is hidden under a gold scratch layer.
 * User must actively scratch it — prevents accidental screen captures showing the seed.
 *
 * Usage:
 *   <ScratchReveal word="abandon" index={1} />
 */
export function ScratchReveal({ word, index, onRevealed }) {
  const canvasRef = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const [scratching, setScratching] = useState(false)
  const [scratchPct, setScratchPct] = useState(0)
  const lastPos = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    // Gold scratch layer
    const gradient = ctx.createLinearGradient(0, 0, W, H)
    gradient.addColorStop(0, '#C9A84C')
    gradient.addColorStop(0.5, '#E8CC7A')
    gradient.addColorStop(1, '#C9A84C')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, W, H)

    // Hint text on scratch layer
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.font = '500 11px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('scratch to reveal', W / 2, H / 2)
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function scratch(e) {
    if (!scratching) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
    }
    ctx.lineTo(pos.x, pos.y)
    ctx.lineWidth = 32
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPos.current = pos

    // Calculate how much has been scratched
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++
    }
    const pct = Math.round((transparent / (pixels.length / 4)) * 100)
    setScratchPct(pct)

    if (pct > 55 && !revealed) {
      setRevealed(true)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      onRevealed?.()
    }
  }

  return (
    <div style={{
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
      background: C.surface2,
      border: `1px solid ${revealed ? C.cashuGreen + '66' : C.border}`,
      transition: 'border-color 0.3s',
    }}>
      {/* Word underneath — always rendered */}
      <div style={{
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        minHeight: 44,
      }}>
        <span style={{
          fontSize: 9, color: C.muted, fontFamily: 'monospace',
          width: 18, textAlign: 'right', flexShrink: 0,
        }}>{index}</span>
        <span style={{
          fontSize: 15, fontWeight: 700, color: C.text,
          fontFamily: 'monospace', letterSpacing: 0.5,
        }}>{word}</span>
        {revealed && (
          <Icon name="checkCircle" size={14} color={C.cashuGreen}
            style={{ marginLeft: 'auto' }} />
        )}
      </div>

      {/* Scratch layer canvas — sits on top */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          width={200}
          height={44}
          onMouseDown={e => { setScratching(true); lastPos.current = getPos(e) }}
          onMouseMove={scratch}
          onMouseUp={() => { setScratching(false); lastPos.current = null }}
          onMouseLeave={() => { setScratching(false); lastPos.current = null }}
          onTouchStart={e => { setScratching(true); lastPos.current = getPos(e) }}
          onTouchMove={scratch}
          onTouchEnd={() => { setScratching(false); lastPos.current = null }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            cursor: 'crosshair', touchAction: 'none',
            borderRadius: 10,
          }}
        />
      )}
    </div>
  )
}

/**
 * Full scratch card grid for all 24 words.
 */
export function SeedScratchGrid({ words, onAllRevealed }) {
  const [revealedCount, setRevealedCount] = useState(0)
  const total = words.length

  function handleRevealed() {
    const next = revealedCount + 1
    setRevealedCount(next)
    if (next >= total) onAllRevealed?.()
  }

  return (
    <div>
      <div style={{
        marginBottom: 14, padding: '10px 12px',
        background: C.btcOrange + '11',
        border: `1px solid ${C.btcOrange}33`,
        borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <Icon name="alertCircle" size={16} color={C.btcOrange} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: C.btcOrange, lineHeight: 1.5 }}>
          <strong>Scratch each word to reveal it.</strong> Write them down in order — these 24 words are the only way to recover your wallet. Never share them with anyone.
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: C.muted }}>Revealed</span>
        <span style={{ fontSize: 11, color: C.cashuGreen, fontWeight: 700 }}>
          {revealedCount} / {total}
        </span>
      </div>
      <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 14 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${C.btcOrange}, ${C.cashuGreen})`,
          width: `${(revealedCount / total) * 100}%`,
          transition: 'width 0.4s',
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {words.map((word, i) => (
          <ScratchReveal
            key={i}
            word={word}
            index={i + 1}
            onRevealed={handleRevealed}
          />
        ))}
      </div>
    </div>
  )
}

// ─── 2. Hint Bubble ───────────────────────────────────────────────────────────

/**
 * A friendly contextual hint that appears for new users.
 * Dismissed with an X and remembered in localStorage.
 *
 * Usage:
 *   <HintBubble id="first_send" title="Sending is easy" body="Tap a contact or paste any Bitcoin address." />
 */
export function HintBubble({ id, title, body, icon = 'hint', color = C.nostrBlue }) {
  const storageKey = `ijma_hint_${id}`
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem(storageKey)
  })

  function dismiss() {
    setVisible(false)
    localStorage.setItem(storageKey, '1')
  }

  if (!visible) return null

  return (
    <div style={{
      marginBottom: 12, padding: '12px 14px',
      background: color + '0E',
      border: `1px solid ${color}33`,
      borderRadius: 12,
      display: 'flex', gap: 10, alignItems: 'flex-start',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14, flexShrink: 0,
        background: color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={15} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{body}</div>
      </div>
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.muted, padding: 2, flexShrink: 0,
      }}>
        <Icon name="close" size={14} color={C.muted} />
      </button>
    </div>
  )
}

/**
 * First-run hint system. Shows a sequence of hints on the home screen
 * until the user dismisses all of them.
 */
export const FIRST_RUN_HINTS = [
  {
    id: 'welcome',
    title: 'Welcome to Ijma',
    body: 'Your money, your rules. No bank, no middleman. Your secret phrase is stored safely on this device only.',
    icon: 'mosque',
    color: C.btcOrange,
  },
  {
    id: 'payments_savings',
    title: 'Payments & Savings',
    body: 'Your money is split: Payments is for everyday spending (instant, private), Savings is for keeping larger amounts safe.',
    icon: 'wallet',
    color: C.lightningPurple,
  },
  {
    id: 'contacts',
    title: 'Send to Contacts',
    body: 'Tap Send and choose a Contact — just like sending a message. You can also scan a QR code.',
    icon: 'contacts',
    color: C.cashuGreen,
  },
  {
    id: 'hide_balance',
    title: 'Private by default',
    body: 'Tap the eye icon on your balance to hide it in public. Your balance is never shared with any server.',
    icon: 'eyeOff',
    color: C.nostrBlue,
  },
]

// ─── 3. QR Code Scanner (camera) ─────────────────────────────────────────────

/**
 * Camera-based QR code scanner using the browser's BarcodeDetector API
 * (Chrome, Edge, Android WebView — widely supported).
 * Falls back gracefully on unsupported browsers.
 *
 * Usage:
 *   <QrScanner onScan={(result) => console.log(result)} onClose={() => setOpen(false)} />
 */
export function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    startCamera()
    return stopCamera
  }, [])

  async function startCamera() {
    try {
      // Check BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setError('QR scanning requires Chrome or a recent Android browser. Please paste the address manually instead.')
        return
      }

      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        scanFrame()
      }
    } catch (e) {
      setError(e.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings, then try again.'
        : `Camera error: ${e.message}`)
    }
  }

  function stopCamera() {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function scanFrame() {
    if (!videoRef.current || !detectorRef.current) return
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current)
      if (barcodes.length > 0) {
        const result = barcodes[0].rawValue
        stopCamera()
        onScan(result)
        return
      }
    } catch {}
    animRef.current = requestAnimationFrame(scanFrame)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '20px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Scan QR Code</div>
        <button onClick={() => { stopCamera(); onClose() }} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 20, width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon name="close" size={18} color="#fff" />
        </button>
      </div>

      {error ? (
        <div style={{ padding: 24, maxWidth: 320, textAlign: 'center' }}>
          <Icon name="alertCircle" size={40} color={C.warning}
            style={{ margin: '0 auto 16px' }} />
          <div style={{ color: '#fff', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{error}</div>
          <button onClick={() => { stopCamera(); onClose() }} style={{
            background: C.btcOrange, border: 'none', borderRadius: 12,
            padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>Close</button>
        </div>
      ) : (
        <>
          {/* Viewfinder */}
          <div style={{ position: 'relative', width: 280, height: 280 }}>
            <video
              ref={videoRef}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', borderRadius: 16,
              }}
              playsInline muted autoPlay
            />
            {/* Corner guides */}
            {[
              { top: 0, left: 0, borderTop: '3px solid', borderLeft: '3px solid' },
              { top: 0, right: 0, borderTop: '3px solid', borderRight: '3px solid' },
              { bottom: 0, left: 0, borderBottom: '3px solid', borderLeft: '3px solid' },
              { bottom: 0, right: 0, borderBottom: '3px solid', borderRight: '3px solid' },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', width: 28, height: 28,
                borderColor: C.btcOrange, borderRadius: 2, ...s,
              }} />
            ))}
            {/* Scanning line animation */}
            {scanning && (
              <div style={{
                position: 'absolute', left: 8, right: 8, height: 2,
                background: `linear-gradient(90deg, transparent, ${C.btcOrange}, transparent)`,
                animation: 'scanLine 2s linear infinite',
              }} />
            )}
          </div>

          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 20, textAlign: 'center' }}>
            Point at a Bitcoin address,<br />Lightning invoice, or Nostr QR
          </div>
        </>
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 8px; }
          100% { top: 264px; }
        }
      `}</style>
    </div>
  )
}

// ─── 4. Balance Summary — Payments vs Savings ─────────────────────────────────

/**
 * Normie-friendly balance display.
 * Replaces "L1/L2/L3 · Cashu · Fedimint" with:
 *   Payments  = Lightning + Cashu (everyday spending)
 *   Savings   = On-chain + Fedimint (store of value)
 *
 * Power users can still see the underlying layer breakdown.
 */
export function BalanceSummary({ balances, btcPrice, hidden, powerMode }) {
  const paymentsSats = (balances.lightning || 0) + (balances.cashu || 0)
  const savingsSats  = (balances.onchain || 0)  + (balances.fedimint || 0)
  const totalSats    = paymentsSats + savingsSats

  const toFiat = sats => btcPrice
    ? '£' + (sats / 1e8 * btcPrice).toFixed(2)
    : null

  const BUCKETS = [
    {
      id: 'payments',
      label: 'Payments',
      sublabel: 'Instant spending',
      sats: paymentsSats,
      color: C.lightningPurple,
      iconName: 'payments',
      layers: [
        { name: 'Lightning', sats: balances.lightning || 0, color: C.lightningPurple },
        { name: 'Cashu Cash', sats: balances.cashu || 0, color: C.cashuGreen },
      ],
    },
    {
      id: 'savings',
      label: 'Savings',
      sublabel: 'Long-term storage',
      sats: savingsSats,
      color: C.btcOrange,
      iconName: 'savings',
      layers: [
        { name: 'Bitcoin', sats: balances.onchain || 0, color: C.btcOrange },
        { name: 'Community Vault', sats: balances.fedimint || 0, color: C.fedimintIndigo },
      ],
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {BUCKETS.map(bucket => {
        const fiat = toFiat(bucket.sats)
        return (
          <div key={bucket.id} style={{
            background: C.surface,
            border: `1px solid ${bucket.color}33`,
            borderRadius: 14, padding: 14,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Subtle colour wash */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at top right, ${bucket.color}0A, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon name={bucket.iconName} size={15} color={bucket.color} />
                <div style={{ fontSize: 11, fontWeight: 700, color: bucket.color }}>
                  {bucket.label}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 1 }}>
                {hidden ? '•••' : fiat || `${(bucket.sats / 1000).toFixed(1)}k`}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>
                {hidden ? '•••' : `${bucket.sats.toLocaleString()} sats`}
              </div>

              {/* Layer breakdown — always visible for clarity */}
              {bucket.layers.map(layer => (
                <div key={layer.name} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginTop: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: 3,
                      background: layer.color,
                    }} />
                    <span style={{ fontSize: 9, color: C.muted }}>{layer.name}</span>
                  </div>
                  <span style={{
                    fontSize: 9, color: C.muted,
                    fontFamily: 'monospace',
                  }}>
                    {hidden ? '•••' : layer.sats.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── 5. Animated balance hide/reveal ─────────────────────────────────────────

export function HideBalanceButton({ hidden, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={hidden ? 'Show balance' : 'Hide balance'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 6, borderRadius: 8,
        color: C.muted,
        transition: 'color 0.2s, transform 0.2s',
      }}
    >
      <Icon name={hidden ? 'eye' : 'eyeOff'} size={18} color={C.muted} />
    </button>
  )
}

// ─── 6. Contact Card (not "Address") ─────────────────────────────────────────

export function ContactCard({ contact, onZap, onSend, selected, onSelect }) {
  const initials = contact.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={() => onSelect?.(contact)}
      style={{
        width: '100%', textAlign: 'left',
        background: selected ? C.btcOrange + '11' : C.surface,
        border: `1px solid ${selected ? C.btcOrange : C.border}`,
        borderRadius: 12, padding: '12px 14px',
        cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: 21, flexShrink: 0,
        background: `linear-gradient(135deg, ${C.btcOrange}CC, ${C.lightningPurple}CC)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800, color: '#fff',
      }}>
        {contact.avatar || initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
          {contact.name}
        </div>
        <div style={{
          fontSize: 11, color: C.muted,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {contact.lightningAddress || contact.npub?.slice(0, 16) + '...'}
        </div>
        {contact.trust && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <Icon name="shieldCheck" size={10} color={C.cashuGreen} />
            <span style={{ fontSize: 9, color: C.cashuGreen }}>
              Trusted contact · {contact.trust}%
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
        {onZap && (
          <button onClick={() => onZap(contact)} style={{
            background: C.lightningPurple + '22',
            border: `1px solid ${C.lightningPurple}44`,
            borderRadius: 8, padding: '5px 8px',
            cursor: 'pointer',
          }}>
            <Icon name="zap" size={14} color={C.lightningPurple} />
          </button>
        )}
        {onSend && (
          <button onClick={() => onSend(contact)} style={{
            background: C.btcOrange + '22',
            border: `1px solid ${C.btcOrange}44`,
            borderRadius: 8, padding: '5px 8px',
            cursor: 'pointer',
          }}>
            <Icon name="send" size={14} color={C.btcOrange} />
          </button>
        )}
      </div>
    </button>
  )
}

// ─── 7. Wallet Backup & Delete ────────────────────────────────────────────────

/**
 * Encrypted wallet backup export + permanent delete.
 * Backup is the encrypted IndexedDB vault serialised to JSON.
 * User can save to Files app, Google Drive, iCloud, etc.
 */
export function WalletBackupPanel({ onDelete }) {
  const [step, setStep] = useState('idle')  // idle | confirm_delete | deleted
  const [deleteInput, setDeleteInput] = useState('')
  const [backupDone, setBackupDone] = useState(false)

  async function handleExport() {
    try {
      // Gather encrypted data from IndexedDB
      const db = await openDB()
      const vault = await getAllVaultData(db)
      const meta = localStorage.getItem('ijma_meta') || '{}'
      const pinSalt = localStorage.getItem('ijma_pin_salt') || ''
      const pinHash = localStorage.getItem('ijma_pin_hash') || ''

      const backup = {
        version: '0.2.0',
        exportedAt: new Date().toISOString(),
        // NOTE: vault data is already AES-256-GCM encrypted.
        // This file is safe to store — it cannot be decrypted without the PIN.
        vault,
        meta: JSON.parse(meta),
        pinSalt,
        pinHash,
        note: 'This file is encrypted. You need your PIN to restore from it.',
      }

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ijma-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setBackupDone(true)
    } catch (e) {
      alert('Export failed: ' + e.message)
    }
  }

  // Helpers for IndexedDB access
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('ijma-secure', 1)
      req.onsuccess = e => resolve(e.target.result)
      req.onerror = () => reject(req.error)
    })
  }

  function getAllVaultData(db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('vault', 'readonly')
      const store = tx.objectStore('vault')
      const result = {}
      const cursorReq = store.openCursor()
      cursorReq.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) {
          result[cursor.key] = cursor.value
          cursor.continue()
        } else {
          resolve(result)
        }
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })
  }

  if (step === 'deleted') return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <Icon name="checkCircle" size={40} color={C.cashuGreen}
        style={{ margin: '0 auto 12px' }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
        Wallet deleted
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
        All local data has been removed from this device.
      </div>
    </div>
  )

  return (
    <div>
      {/* Export */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.cashuGreen + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="download" size={18} color={C.cashuGreen} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>
              Back up encrypted wallet
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>
              Saves an encrypted file you can store in Google Drive, iCloud, or on your computer. You'll need your PIN to restore it. Without your PIN, this file is unreadable.
            </div>
            <button onClick={handleExport} style={{
              background: backupDone ? C.cashuGreen + '22' : C.cashuGreen,
              border: 'none', borderRadius: 10, padding: '10px 16px',
              color: backupDone ? C.cashuGreen : '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name={backupDone ? 'checkCircle' : 'download'}
                size={15} color={backupDone ? C.cashuGreen : '#fff'} />
              {backupDone ? 'Backup saved!' : 'Save backup file'}
            </button>
          </div>
        </div>
      </Card>

      {/* Delete */}
      <Card style={{ border: `1px solid ${C.error}33` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.error + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="trash" size={18} color={C.error} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>
              Delete wallet from this device
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>
              Removes all wallet data permanently. Your bitcoin is not deleted — it's on the blockchain. You can always restore using your 24 words.
            </div>

            {step === 'idle' && (
              <button onClick={() => setStep('confirm_delete')} style={{
                background: 'none',
                border: `1px solid ${C.error}55`,
                borderRadius: 10, padding: '10px 16px',
                color: C.error, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                Delete from this device
              </button>
            )}

            {step === 'confirm_delete' && (
              <>
                <div style={{ fontSize: 12, color: C.warning, marginBottom: 10, fontWeight: 600 }}>
                  ⚠️ Make sure you have your 24 words saved before continuing.
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                  Type <strong style={{ color: C.text }}>DELETE</strong> to confirm
                </div>
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  style={{
                    width: '100%', background: C.surface2,
                    border: `1px solid ${deleteInput === 'DELETE' ? C.error : C.border}`,
                    borderRadius: 10, padding: '10px 12px',
                    color: C.text, fontSize: 13, outline: 'none',
                    boxSizing: 'border-box', marginBottom: 10,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={deleteInput !== 'DELETE'}
                    onClick={() => {
                      onDelete?.()
                      setStep('deleted')
                    }}
                    style={{
                      flex: 1, background: deleteInput === 'DELETE' ? C.error : C.surface2,
                      border: 'none', borderRadius: 10, padding: 10,
                      color: deleteInput === 'DELETE' ? '#fff' : C.muted,
                      fontSize: 13, fontWeight: 700,
                      cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed',
                    }}>
                    Delete permanently
                  </button>
                  <button onClick={() => { setStep('idle'); setDeleteInput('') }} style={{
                    background: C.surface2, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 10,
                    color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── 8. Success animation ─────────────────────────────────────────────────────

export function SuccessScreen({ amount, unit = 'sats', label, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', gap: 16, textAlign: 'center',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Animated check */}
      <div style={{
        width: 80, height: 80, borderRadius: 40,
        background: `linear-gradient(135deg, ${C.cashuGreen}33, ${C.cashuGreen}11)`,
        border: `2px solid ${C.cashuGreen}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        <Icon name="checkCircle" size={40} color={C.cashuGreen} />
      </div>

      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>Done!</div>
        {label && <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{label}</div>}
      </div>

      {amount !== undefined && (
        <div style={{
          fontSize: 32, fontWeight: 800, color: C.cashuGreen,
          fontFamily: 'monospace',
        }}>
          {amount.toLocaleString()} {unit}
        </div>
      )}

      <div style={{ fontSize: 18, marginTop: 8 }}>بارك الله فيك 🌙</div>

      <button onClick={onDone} style={{
        marginTop: 16, background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '12px 32px',
        color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>Back to Home</button>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── 9. Step indicator (for multi-step flows) ─────────────────────────────────

export function StepIndicator({ current, total, labels }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < current ? C.btcOrange : C.border,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {labels && (
        <div style={{ fontSize: 11, color: C.muted }}>
          Step {current} of {total}
          {labels[current - 1] && (
            <span style={{ color: C.text, marginLeft: 6 }}>· {labels[current - 1]}</span>
          )}
        </div>
      )}
    </div>
  )
}
