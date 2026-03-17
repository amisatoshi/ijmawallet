import { useState } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import { C, GeomPattern } from './shared.jsx'
import { authenticateBiometric, biometricAvailable } from '../lib/security.js'
import { useEffect } from 'react'

export default function LockScreen() {
  const { unlockWithPin, meta } = useWallet()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)

  useEffect(() => {
    biometricAvailable().then(setHasBiometric)
    // Auto-attempt biometric on mount
    if (localStorage.getItem('ijma_cred_id')) {
      handleBiometric()
    }
  }, [])

  async function handleBiometric() {
    try {
      const ok = await authenticateBiometric()
      if (ok) {
        // Biometric verified — still need PIN to decrypt vault
        // In production: store PIN encrypted with biometric key
        // For demo: just show PIN pad with a hint
        setError('Biometric ✓ — Enter PIN to decrypt')
      }
    } catch { /* not available or cancelled */ }
  }

  async function handlePin(digit) {
    if (digit === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 6) {
      setLoading(true)
      setError('')
      try {
        await unlockWithPin(newPin)
      } catch (e) {
        setError('Incorrect PIN')
        setPin('')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      <GeomPattern opacity={0.07} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 320 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 110, height: 110, margin: '0 auto 12px' }}>
            <img
              src={import.meta.env.BASE_URL + 'images/ijma-logo.png'}
              alt="Ijma Wallet"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 55 }}
              onError={e => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            {/* Fallback if logo missing */}
            <div style={{
              display: 'none', width: 110, height: 110, borderRadius: 55,
              border: `2px solid ${C.gold}`, background: `radial-gradient(ellipse, ${C.gold}18 0%, transparent 70%)`,
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontSize: 44, color: C.gold,
            }}>◈</div>
          </div>
          {meta?.username && (
            <div style={{ fontSize: 12, color: C.muted }}>@{meta.username}</div>
          )}
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: 7,
              background: i < pin.length ? C.btcOrange : 'transparent',
              border: `2px solid ${i < pin.length ? C.btcOrange : C.border}`,
              transition: 'all 0.15s',
            }} />
          ))}
        </div>

        {error && (
          <div style={{ textAlign: 'center', fontSize: 11, color: error.includes('✓') ? C.cashuGreen : C.error, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[1,2,3,4,5,6,7,8,9,'bio','0','⌫'].map((k, i) => (
            <button key={i}
              disabled={loading}
              onClick={() => {
                if (k === 'bio') { handleBiometric(); return }
                handlePin(String(k))
              }}
              style={{
                height: 64, borderRadius: 14,
                background: k === 'bio' ? (hasBiometric ? C.nostrBlue + '22' : 'transparent') : C.surface2,
                border: `1px solid ${k === 'bio' ? (hasBiometric ? C.nostrBlue + '55' : 'transparent') : C.border}`,
                color: k === 'bio' ? C.nostrBlue : C.text,
                fontSize: k === 'bio' ? 22 : k === '⌫' ? 20 : 24,
                fontWeight: 700, cursor: (k === 'bio' && !hasBiometric) || loading ? 'default' : 'pointer',
                opacity: (k === 'bio' && !hasBiometric) ? 0 : loading ? 0.5 : 1,
                transition: 'all 0.15s',
              }}>
              {k === 'bio' ? '👆' : k}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: C.muted }}>
          🔐 Wallet encrypted with AES-256-GCM
        </div>
      </div>
    </div>
  )
}
