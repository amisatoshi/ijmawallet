/**
 * Ijma Wallet — Onboarding Flow
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-step: Welcome → Mnemonic display → Verify quiz → PIN → Identity → Done
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { generateMnemonicPhrase, validateMnemonicPhrase } from '../lib/bitcoin.js'
import { wordlist as BIP39_WORDLIST } from '@scure/bip39/wordlists/english'
import { useWallet } from '../context/WalletContext.jsx'
import { C, Card, GeomPattern, Badge } from './shared.jsx'

const STEPS = ['welcome', 'choice', 'mnemonic', 'verify', 'pin', 'identity', 'done']

export default function Onboarding() {
  const { createWallet, restoreWallet } = useWallet()
  const [step, setStep] = useState('welcome')
  const [mode, setMode] = useState(null)  // 'create' | 'restore'

  const [mnemonic, setMnemonic] = useState('')
  const [restoreMnemonic, setRestoreMnemonic] = useState('')
  const [restoreWords, setRestoreWords] = useState(Array(24).fill(''))
  const [wordCount, setWordCount] = useState(24)
  const [verifyIndices, setVerifyIndices] = useState([])
  const [verifyAnswers, setVerifyAnswers] = useState({})
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const words = mnemonic ? mnemonic.split(' ') : []

  // ── Step: Welcome ────────────────────────────────────────────────────────
  if (step === 'welcome') return (
    <WelcomeScreen onStart={() => setStep('choice')} />
  )

  // ── Step: Choice ─────────────────────────────────────────────────────────
  if (step === 'choice') return (
    <Screen title="Set Up Wallet">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <OptionCard
          icon="✨"
          title="Create New Wallet"
          desc="Generate a fresh Bitcoin + Nostr identity"
          color={C.btcOrange}
          onClick={() => {
            setMode('create')
            const m = generateMnemonicPhrase(256)
            setMnemonic(m)
            // Pick 3 random indices to verify
            const idxs = []
            while (idxs.length < 3) {
              const r = Math.floor(Math.random() * 24)
              if (!idxs.includes(r)) idxs.push(r)
            }
            setVerifyIndices(idxs.sort((a, b) => a - b))
            setStep('mnemonic')
          }}
        />
        <OptionCard
          icon="🔄"
          title="Restore Existing"
          desc="Restore from your 12 or 24-word seed phrase"
          color={C.lightningPurple}
          onClick={() => { setMode('restore'); setStep('mnemonic') }}
        />
      </div>
      <div style={{ marginTop: 24, padding: 12, background: C.warning + '11', borderRadius: 10, border: `1px solid ${C.warning}33` }}>
        <div style={{ fontSize: 11, color: C.warning }}>⚠️ This is a demo. Do NOT store real funds until a full security audit is complete.</div>
      </div>
    </Screen>
  )

  // ── Step: Mnemonic ────────────────────────────────────────────────────────
  if (step === 'mnemonic' && mode === 'create') return (
    <Screen title="Your Recovery Phrase" subtitle="Write these 24 words in order. Store them offline. Never share them.">
      <div style={{ background: C.warning + '11', border: `1px solid ${C.warning}33`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.warning }}>🛡️ Anyone with these words controls your bitcoin. Never screenshot. Never type online.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {words.map((word, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: C.surface2, borderRadius: 8, padding: '8px 10px',
          }}>
            <span style={{ fontSize: 9, color: C.muted, width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: C.text, fontFamily: 'monospace', fontWeight: 600 }}>{word}</span>
          </div>
        ))}
      </div>
      <Btn onClick={() => setStep('verify')} style={{ marginTop: 16 }}>
        I've written it down →
      </Btn>
    </Screen>
  )

  if (step === 'mnemonic' && mode === 'restore') {
    const filledCount = restoreWords.filter(w => w.length > 0).length
    const allFilled = filledCount >= wordCount

    const handleWordChange = (i, val) => {
      const next = [...restoreWords]
      // Handle paste of full phrase into word 1
      if (i === 0 && val.trim().split(/\s+/).length > 3) {
        const pasted = val.trim().toLowerCase().split(/\s+/)
        const wc = pasted.length === 12 ? 12 : 24
        setWordCount(wc)
        const filled = Array(24).fill('')
        pasted.slice(0, wc).forEach((w, idx) => { filled[idx] = w })
        setRestoreWords(filled)
        setError('')
        return
      }
      next[i] = val.toLowerCase().replace(/[^a-z]/g, '')
      setRestoreWords(next)
      setError('')
    }

    return (
      <Screen title="Enter Seed Phrase" subtitle="Type each word — suggestions appear after 3 letters.">
        {/* Word count toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[12, 24].map(n => (
            <button key={n} onClick={() => { setWordCount(n); setRestoreWords(Array(24).fill('')); setError('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                background: wordCount === n ? C.btcOrange + '18' : C.surface2,
                border: `1px solid ${wordCount === n ? C.btcOrange : C.border}`,
                color: wordCount === n ? C.btcOrange : C.muted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>{n} words</button>
          ))}
        </div>

        {/* Word grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {Array.from({ length: wordCount }, (_, i) => (
            <BIP39Input
              key={i}
              index={i}
              value={restoreWords[i]}
              onChange={v => handleWordChange(i, v)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: `linear-gradient(90deg, ${C.btcOrange}, ${C.lightningPurple})`,
            width: `${(filledCount / wordCount) * 100}%`,
            transition: 'width 0.25s',
          }} />
        </div>
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 12 }}>
          {filledCount} / {wordCount} words entered
        </div>

        {error && <div style={{ fontSize: 11, color: C.error, marginBottom: 10 }}>{error}</div>}
        <Btn
          onClick={() => {
            const phrase = restoreWords.slice(0, wordCount).join(' ').trim()
            if (!validateMnemonicPhrase(phrase)) {
              setError('Invalid seed phrase — check your words and try again'); return
            }
            setMnemonic(phrase)
            setStep('pin')
          }}
          style={{ opacity: allFilled ? 1 : 0.5 }}
        >Continue →</Btn>
      </Screen>
    )
  }

  // ── Step: Verify ─────────────────────────────────────────────────────────
  if (step === 'verify') return (
    <Screen title="Verify Backup" subtitle="Enter the words at these positions to confirm you wrote them down.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
        {verifyIndices.map(idx => (
          <div key={idx}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Word #{idx + 1}</div>
            <BIP39Input
              index={idx}
              value={verifyAnswers[idx] || ''}
              onChange={v => setVerifyAnswers(p => ({ ...p, [idx]: v }))}
              correct={verifyAnswers[idx] === words[idx]}
              wrong={verifyAnswers[idx] !== undefined && verifyAnswers[idx] !== '' && verifyAnswers[idx] !== words[idx]}
            />
          </div>
        ))}
      </div>
      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 8 }}>{error}</div>}
      <Btn onClick={() => {
        const allCorrect = verifyIndices.every(idx => verifyAnswers[idx] === words[idx])
        if (!allCorrect) { setError('One or more words are incorrect. Check again.'); return }
        setStep('pin')
      }} style={{ marginTop: 16 }}>Verified →</Btn>
    </Screen>
  )

  // ── Step: PIN ─────────────────────────────────────────────────────────────
  // pinPhase: 'enter' → user types first PIN
  //           'confirm' → user types PIN again to confirm
  const pinPhase = pin.length < 6 ? 'enter' : 'confirm'

  if (step === 'pin') return (
    <Screen title="Create PIN" subtitle="A 6-digit PIN encrypts your wallet. Use biometrics for daily access.">
      {pinPhase === 'enter' && (
        <PinPad
          label="Enter 6-digit PIN"
          value={pin}
          onChange={v => { setPin(v); setError('') }}
          maxLength={6}
        />
      )}
      {pinPhase === 'confirm' && (
        <PinPad
          label="Confirm PIN"
          value={pinConfirm}
          onChange={v => {
            setPinConfirm(v)
            setError('')
            // Auto-advance when 6 digits entered
            if (v.length === 6) {
              if (v !== pin) {
                setError('PINs do not match. Try again.')
                setPin('')
                setPinConfirm('')
              } else {
                setStep('identity')
              }
            }
          }}
          maxLength={6}
        />
      )}
      {pinPhase === 'confirm' && pinConfirm.length === 0 && (
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8 }}>
          Re-enter your PIN to confirm
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 8, textAlign: 'center' }}>{error}</div>}
    </Screen>
  )

  // ── Step: Identity ────────────────────────────────────────────────────────
  if (step === 'identity') return (
    <Screen title="Nostr Identity" subtitle="Your Lightning Address and Nostr username. You can change this later.">
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>USERNAME</div>
        <div style={{ display: 'flex', alignItems: 'center', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <input
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="yourname"
            style={{
              flex: 1, background: 'none', border: 'none',
              padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none',
            }}
          />
          <span style={{ paddingRight: 14, fontSize: 12, color: C.muted }}>@ijma.app</span>
        </div>
        {username && (
          <div style={{ marginTop: 8, fontSize: 11, color: C.cashuGreen }}>
            ⚡ Lightning Address: {username}@ijma.app
          </div>
        )}
      </div>
      <Btn
        loading={loading}
        onClick={async () => {
          setLoading(true)
          setError('')
          try {
            await createWallet({ mnemonic, pin, username })
            setStep('done')
          } catch (e) {
            setError(e.message)
          } finally {
            setLoading(false)
          }
        }}
        style={{ marginTop: 24 }}
      >
        {loading ? 'Creating wallet...' : 'Create Wallet 🕌'}
      </Btn>
      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 8 }}>{error}</div>}
    </Screen>
  )

  // ── Step: Done ────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <Screen>
      <div style={{ textAlign: 'center', padding: '60px 0 40px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>Wallet Created!</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>بارك الله فيك</div>
        <div style={{ marginTop: 20, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
          Your Bitcoin, Lightning, and Nostr<br />
          identity are ready. Your keys never<br />
          leave this device.
        </div>
      </div>
    </Screen>
  )

  return null
}

// ─── Welcome Screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  const BASE = import.meta.env.BASE_URL
  const [logoErr, setLogoErr] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Islamic star pattern background */}
      <GeomPattern opacity={0.07} />

      {/* Centre — logo */}
      <div style={{ flex: 1 }} />
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%',
      }}>
        {/* Medallion outer glow ring */}
        <div style={{
          width: 260, height: 260,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${C.gold}18 0%, ${C.gold}06 50%, transparent 75%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 60px ${C.gold}22, 0 0 120px ${C.gold}10`,
          marginBottom: 28,
        }}>
          {/* Logo image */}
          {!logoErr ? (
            <img
              src={BASE + 'images/ijma-logo.png'}
              onError={() => setLogoErr(true)}
              alt="Ijma Wallet"
              style={{
                width: 240, height: 240,
                objectFit: 'contain',
                borderRadius: '50%',
                boxShadow: `0 4px 32px ${C.gold}44`,
              }}
            />
          ) : (
            /* Fallback medallion */
            <div style={{
              width: 220, height: 220, borderRadius: '50%',
              border: `2px solid ${C.gold}`,
              background: `#1A1410`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 32px ${C.gold}44`,
              gap: 4,
            }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 72, color: C.gold, lineHeight: 1 }}>إجماع</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.gold, letterSpacing: 3 }}>IJMA WALLET</div>
            </div>
          )}
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 15, fontStyle: 'italic',
          color: C.muted, textAlign: 'center', letterSpacing: 0.3,
        }}>
          Sovereign · Private · Halal
        </div>
      </div>
      <div style={{ flex: 1 }} />

      {/* CTA button pinned to bottom */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400,
        padding: '0 24px 52px',
      }}>
        <button onClick={onStart} style={{
          width: '100%',
          background: `linear-gradient(135deg, ${C.btcOrange} 0%, ${C.lightningPurple} 100%)`,
          border: 'none', borderRadius: 16, padding: '18px 20px',
          color: '#fff',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 17, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.3,
          boxShadow: `0 6px 28px ${C.btcOrange}44`,
        }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = ''}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={e => e.currentTarget.style.transform = ''}
        >
          Get Started →
        </button>
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 11, color: C.muted,
          textAlign: 'center', marginTop: 10,
        }}>
          MIT licensed · Open source · Non-custodial
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Screen({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, padding: '20px 20px 40px',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: 20 }}>
          {title && <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function OptionCard({ icon, title, desc, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: C.surface, border: `1px solid ${color}44`,
      borderRadius: 16, padding: '18px 16px', cursor: 'pointer',
      display: 'flex', gap: 14, alignItems: 'center', textAlign: 'left',
      transition: 'border-color 0.2s',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '22', border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  )
}

function PinPad({ label, value, onChange, maxLength = 6 }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {Array.from({ length: maxLength }, (_, i) => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: 20,
            border: `2px solid ${i < value.length ? C.btcOrange : C.border}`,
            background: i < value.length ? C.btcOrange + '22' : C.surface2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>{i < value.length ? '●' : ''}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[1,2,3,4,5,6,7,8,9,null,'0','⌫'].map((k, i) => (
          <button key={i} onClick={() => {
            if (k === null) return
            if (k === '⌫') { onChange(value.slice(0, -1)); return }
            if (value.length < maxLength) onChange(value + k)
          }} style={{
            height: 52, borderRadius: 12,
            background: k === null ? 'transparent' : C.surface2,
            border: `1px solid ${k === null ? 'transparent' : C.border}`,
            color: C.text, fontSize: k === '⌫' ? 18 : 22,
            fontWeight: 700, cursor: k === null ? 'default' : 'pointer',
          }}>{k}</button>
        ))}
      </div>
    </div>
  )
}

// ── BIP39 autocomplete word input ─────────────────────────────────────────────
function BIP39Input({ index, value, onChange, autoFocus, correct, wrong }) {
  const [suggestions, setSuggestions] = useState([])
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  function handleChange(e) {
    const v = e.target.value.toLowerCase().replace(/[^a-z]/g, '')
    onChange(v)
    if (v.length >= 2) {
      const matches = BIP39_WORDLIST.filter(w => w.startsWith(v)).slice(0, 6)
      setSuggestions(matches)
    } else {
      setSuggestions([])
    }
  }

  function pickWord(word) {
    onChange(word)
    setSuggestions([])
    setFocused(false)
    inputRef.current?.blur()
  }

  const borderColor = correct ? C.cashuGreen
    : wrong ? C.error
    : focused ? C.btcOrange
    : C.border

  return (
    <div style={{ position: 'relative' }}>
      {/* Word number label */}
      <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 3, paddingLeft: 2 }}>
        #{index + 1}
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]) }, 160)}
        placeholder="word..."
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        style={{
          width: '100%', background: correct ? C.cashuGreen + '0D' : C.surface2,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 10, padding: '10px 10px',
          color: correct ? C.cashuGreen : wrong ? C.error : C.text,
          fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      />

      {/* Suggestion dropdown */}
      {focused && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: C.surface,
          border: `1.5px solid ${C.btcOrange}66`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
          boxShadow: `0 8px 24px rgba(0,0,0,0.12)`,
        }}>
          {suggestions.map(word => (
            <button
              key={word}
              onMouseDown={e => { e.preventDefault(); pickWord(word) }}
              onTouchStart={e => { e.preventDefault(); pickWord(word) }}
              style={{
                width: '100%', padding: '9px 10px',
                background: 'none', border: 'none',
                borderBottom: `1px solid ${C.border}`,
                color: C.text, fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.btcOrange + '10'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ color: C.btcOrange, fontWeight: 800 }}>{value}</span>
              <span style={{ color: C.text }}>{word.slice(value.length)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function Btn({ children, onClick, style, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: '100%', marginTop: 8,
      background: `linear-gradient(90deg, ${C.btcOrange}, ${C.lightningPurple})`,
      border: 'none', borderRadius: 14, padding: 16,
      color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
      opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
      boxShadow: `0 4px 20px ${C.btcOrange}44`,
      ...style,
    }}>{children}</button>
  )
}
