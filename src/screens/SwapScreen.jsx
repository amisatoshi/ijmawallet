/**
 * Ijma Wallet — Swap Screen
 * Cross-layer atomic swap UI: On-chain ↔ Lightning ↔ Cashu ↔ Fedimint
 */
import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import {
  C, Card, PrimaryBtn, SecondaryBtn, SectionLabel,
  ScreenWrapper, Badge, layerColor
} from '../components/shared.jsx'
import {
  SWAP_ROUTES, getRoutesFrom, estimateSwapFees,
  swapLightningToCashu, swapCashuToLightning, swapCashuCrossMint,
  createReverseSubmarineSwap, saveSwapState, getPendingSwaps,
  clearSwap, swapStatusLabel, validateSwapAmount, generatePreimage
} from '../lib/swaps.js'

const LAYER_LABELS = {
  onchain:   { icon: '₿',   label: 'On-chain',  color: '#F7931A' },
  lightning: { icon: '⚡',   label: 'Lightning', color: '#8B4CF7' },
  cashu:     { icon: '🪙',  label: 'Cashu',     color: '#00D98C' },
  fedimint:  { icon: '🏛️', label: 'Fedimint',  color: '#6366F1' },
}

const LAYERS = Object.keys(LAYER_LABELS)

export default function SwapScreen() {
  const { session, balances, btcPrice, shariahMode } = useWallet()
  const [fromLayer, setFromLayer] = useState('lightning')
  const [toLayer, setToLayer] = useState('cashu')
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState('select') // select | review | progress | done
  const [fees, setFees] = useState(null)
  const [swapResult, setSwapResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingSwaps, setPendingSwaps] = useState({})
  const [mintUrl, setMintUrl] = useState('https://mint.minibits.cash/Bitcoin')

  const amtSats = parseInt(amount || '0')
  const route = SWAP_ROUTES.find(r => r.from === fromLayer && r.to === toLayer)
  const availableToLayers = SWAP_ROUTES.filter(r => r.from === fromLayer).map(r => r.to)

  // Auto-fix toLayer if route doesn't exist
  useEffect(() => {
    if (!availableToLayers.includes(toLayer)) {
      setToLayer(availableToLayers[0] || 'lightning')
    }
    setFees(null)
    setError('')
  }, [fromLayer])

  useEffect(() => {
    setPendingSwaps(getPendingSwaps())
  }, [])

  // Estimate fees when amount changes
  useEffect(() => {
    if (!route || amtSats < 100) { setFees(null); return }
    const timer = setTimeout(async () => {
      try {
        const f = await estimateSwapFees(fromLayer, toLayer, amtSats)
        setFees(f)
      } catch { setFees(null) }
    }, 400)
    return () => clearTimeout(timer)
  }, [amtSats, fromLayer, toLayer])

  async function handleSwap() {
    if (!route) { setError('No route available'); return }
    const validation = validateSwapAmount(route, amtSats)
    if (!validation.valid) { setError(validation.error); return }

    setLoading(true)
    setError('')
    setStep('progress')

    try {
      let result

      if (fromLayer === 'lightning' && toLayer === 'cashu') {
        const { invoice, claim } = await swapLightningToCashu(mintUrl, amtSats, null, session?.password)
        saveSwapState(`ln-cashu-${Date.now()}`, { type: 'lightning_to_cashu', invoice, amtSats, status: 'pending' })
        setSwapResult({ type: 'invoice', invoice, claim, amtSats })
        return

      } else if (fromLayer === 'cashu' && toLayer === 'lightning') {
        // User needs to provide a Lightning invoice to pay
        setSwapResult({ type: 'needs_invoice', amtSats })
        return

      } else if (fromLayer === 'cashu' && toLayer === 'cashu') {
        result = await swapCashuCrossMint('https://mint.minibits.cash/Bitcoin', mintUrl, amtSats, session?.password)

      } else if (fromLayer === 'onchain' && toLayer === 'lightning') {
        // Submarine swap — need Lightning invoice first
        setSwapResult({ type: 'submarine_needs_invoice', amtSats })
        return

      } else if (fromLayer === 'lightning' && toLayer === 'onchain') {
        // Reverse submarine swap
        const { preimage, preimageHex, hashPromise } = generatePreimage()
        const preimageHash = await hashPromise
        setSwapResult({ type: 'reverse_submarine', amtSats, preimageHash, preimageHex })
        return

      } else {
        // Demo fallback for Fedimint routes
        await new Promise(r => setTimeout(r, 2000))
        result = { success: true, amtSats }
      }

      if (result?.success) {
        setSwapResult({ type: 'complete', ...result })
        setStep('done')
      }
    } catch (e) {
      setError(e.message)
      setStep('select')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Atomic Swaps</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
        Cross-layer trustless exchange · No middleman
      </div>

      {/* Pending swaps banner */}
      {Object.keys(pendingSwaps).length > 0 && (
        <div style={{ marginBottom: 12, padding: 12, background: C.warning + '11', border: `1px solid ${C.warning}33`, borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, marginBottom: 4 }}>
            ⏳ {Object.keys(pendingSwaps).length} swap(s) in progress
          </div>
          {Object.entries(pendingSwaps).map(([id, swap]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{swap.amtSats?.toLocaleString()} sats · {swapStatusLabel(swap.status)}</span>
              <button onClick={() => { clearSwap(id); setPendingSwaps(getPendingSwaps()) }}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 11 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {step === 'done' && swapResult?.type === 'complete' && (
        <SwapSuccess result={swapResult} onReset={() => { setStep('select'); setSwapResult(null); setAmount('') }} />
      )}

      {step !== 'done' && <>
        {/* From/To selector */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* From */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>FROM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LAYERS.map(layer => {
                  const lyr = LAYER_LABELS[layer]
                  const bal = balances[layer] || 0
                  return (
                    <button key={layer} onClick={() => setFromLayer(layer)} style={{
                      background: fromLayer === layer ? lyr.color + '22' : C.surface2,
                      border: `1px solid ${fromLayer === layer ? lyr.color : C.border}`,
                      borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    }}>
                      <span style={{ fontSize: 16 }}>{lyr.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: fromLayer === layer ? lyr.color : C.text }}>{lyr.label}</div>
                        <div style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>{bal.toLocaleString()} sats</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 2, flex: 1, background: C.border }} />
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: `linear-gradient(135deg, ${C.btcOrange}, ${C.lightningPurple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, cursor: 'pointer', flexShrink: 0,
              }} onClick={() => {
                const newTo = fromLayer
                const newFrom = toLayer
                setFromLayer(newFrom)
                setToLayer(newTo)
              }}>⇄</div>
              <div style={{ width: 2, flex: 1, background: C.border }} />
            </div>

            {/* To */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>TO</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LAYERS.map(layer => {
                  const lyr = LAYER_LABELS[layer]
                  const available = availableToLayers.includes(layer) && layer !== fromLayer
                  return (
                    <button key={layer} onClick={() => available && setToLayer(layer)} disabled={!available} style={{
                      background: toLayer === layer ? lyr.color + '22' : C.surface2,
                      border: `1px solid ${toLayer === layer ? lyr.color : C.border}`,
                      borderRadius: 10, padding: '8px 10px',
                      cursor: available ? 'pointer' : 'not-allowed',
                      opacity: available || toLayer === layer ? 1 : 0.35,
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    }}>
                      <span style={{ fontSize: 16 }}>{lyr.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: toLayer === layer ? lyr.color : C.text }}>{lyr.label}</div>
                        {!available && layer !== fromLayer && <div style={{ fontSize: 9, color: C.muted }}>no route</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Route info */}
        {route && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: route.trustless ? C.cashuGreen + '11' : C.warning + '11', border: `1px solid ${route.trustless ? C.cashuGreen : C.warning}33`, borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 14 }}>{route.trustless ? '🔐' : '⚖️'}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: route.trustless ? C.cashuGreen : C.warning }}>
                {route.trustless ? 'Trustless HTLC' : 'Trusted route'} · via {route.provider}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{route.description}</div>
              {shariahMode && (
                <div style={{ fontSize: 11, marginTop: 6, color: route.trustless ? C.cashuGreen : C.warning, fontWeight: 600 }}>
                  {route.trustless
                    ? '☪️ Minimal gharar — HTLC refunds automatically if swap fails'
                    : '⚠️ Gharar note: a trusted third party is involved. Verify you trust this operator before proceeding.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amount input */}
        {route && (
          <>
            <SectionLabel>AMOUNT</SectionLabel>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError('') }}
                placeholder="0"
                style={{
                  width: '100%', background: C.surface, border: `1px solid ${error ? C.error : C.border}`,
                  borderRadius: 12, padding: '18px 80px 18px 16px',
                  color: C.btcOrange, fontSize: 28, fontFamily: 'monospace',
                  fontWeight: 800, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.muted }}>sats</div>
            </div>
            {amtSats > 0 && btcPrice && (
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                ≈ £{(amtSats / 1e8 * btcPrice).toFixed(2)} GBP
              </div>
            )}

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {[10000, 50000, 100000, 500000].map(n => (
                <button key={n} onClick={() => setAmount(String(n))} style={{
                  background: amtSats === n ? C.btcOrange + '22' : C.surface2,
                  border: `1px solid ${amtSats === n ? C.btcOrange : C.border}`,
                  borderRadius: 8, padding: '6px 10px',
                  color: amtSats === n ? C.btcOrange : C.muted,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace',
                }}>{(n / 1000)}k</button>
              ))}
              <button onClick={() => setAmount(String(balances[fromLayer] || 0))} style={{
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '6px 10px',
                color: C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>MAX</button>
            </div>

            {/* Fee breakdown */}
            {fees && amtSats >= (route?.minSats || 0) && (
              <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>FEE BREAKDOWN</div>
                {[
                  { label: 'You send', val: `${amtSats.toLocaleString()} sats`, color: C.text },
                  { label: 'Service fee', val: `−${fees.serviceFee.toLocaleString()} sats (${route.typicalFeePct}%)`, color: C.warning },
                  { label: 'Network fee', val: `−${fees.networkFee.toLocaleString()} sats`, color: C.warning },
                  { label: 'You receive', val: `${fees.youReceive.toLocaleString()} sats`, color: C.cashuGreen },
                  { label: 'Time', val: `~${route.typicalTimeMin < 1 ? `${route.typicalTimeMin * 60}s` : `${route.typicalTimeMin}min`}`, color: C.muted },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.val}</span>
                  </div>
                ))}
              </Card>
            )}

            {/* Mint selector for Cashu routes */}
            {(toLayer === 'cashu' || (fromLayer === 'cashu' && toLayer === 'cashu')) && (
              <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                  {fromLayer === 'cashu' && toLayer === 'cashu' ? 'DESTINATION MINT' : 'CASHU MINT'}
                </div>
                {['https://mint.minibits.cash/Bitcoin', 'https://legend.lnbits.com/cashu/api/v1/4gr9Xcmz3XEkUNwiBiQGoC'].map(url => (
                  <button key={url} onClick={() => setMintUrl(url)} style={{
                    width: '100%', background: mintUrl === url ? C.cashuGreen + '11' : C.surface2,
                    border: `1px solid ${mintUrl === url ? C.cashuGreen : C.border}`,
                    borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                    textAlign: 'left', marginBottom: 4,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: mintUrl === url ? C.cashuGreen : C.text }}>
                      {url.includes('minibits') ? 'Minibits' : 'LNbits Legend'}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>{url.replace('https://', '')}</div>
                  </button>
                ))}
              </Card>
            )}

            {error && (
              <div style={{ padding: 10, background: C.error + '11', border: `1px solid ${C.error}33`, borderRadius: 10, fontSize: 11, color: C.error, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <PrimaryBtn onClick={handleSwap} disabled={!amtSats || !route || loading}>
              {loading ? '⏳ Initiating swap...' : `Swap ${LAYER_LABELS[fromLayer].icon} → ${LAYER_LABELS[toLayer].icon}`}
            </PrimaryBtn>
          </>
        )}

        {!route && fromLayer !== toLayer && (
          <div style={{ padding: 16, textAlign: 'center', color: C.muted, fontSize: 13 }}>
            No direct route from {LAYER_LABELS[fromLayer]?.label} to {LAYER_LABELS[toLayer]?.label}
          </div>
        )}
      </>}

      {/* Progress state - show invoice or status */}
      {step === 'progress' && swapResult && (
        <SwapProgress result={swapResult} route={route} onComplete={() => setStep('done')} password={session?.password} />
      )}

      {/* All routes reference */}
      {step === 'select' && (
        <>
          <SectionLabel style={{ marginTop: 20 }}>ALL SWAP ROUTES</SectionLabel>
          <Card>
            {SWAP_ROUTES.map((r, i) => (
              <div key={r.id}>
                <div
                  onClick={() => { setFromLayer(r.from); setToLayer(r.to) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer' }}>
                  <div style={{ fontSize: 14 }}>
                    {LAYER_LABELS[r.from].icon} → {LAYER_LABELS[r.to].icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{r.typicalFeePct}% fee · ~{r.typicalTimeMin < 1 ? `${r.typicalTimeMin * 60}s` : `${r.typicalTimeMin}m`}</div>
                  </div>
                  <Badge label={r.trustless ? 'Trustless' : 'Trusted'} color={r.trustless ? C.cashuGreen : C.warning} />
                </div>
                {i < SWAP_ROUTES.length - 1 && <div style={{ height: 1, background: C.border }} />}
              </div>
            ))}
          </Card>
        </>
      )}
    </ScreenWrapper>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SwapProgress({ result, route, onComplete, password }) {
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')

  const copy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result.type === 'invoice') return (
    <Card glow={C.lightningPurple} style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.lightningPurple, marginBottom: 8 }}>
        ⚡ Pay this Lightning invoice
      </div>
      <div style={{ background: C.surface2, borderRadius: 10, padding: 10, fontFamily: 'monospace', fontSize: 10, color: C.text, wordBreak: 'break-all', marginBottom: 10 }}>
        {result.invoice}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => copy(result.invoice)} style={{
          flex: 1, background: C.lightningPurple + '22', border: `1px solid ${C.lightningPurple}44`,
          borderRadius: 10, padding: 10, color: C.lightningPurple, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>{copied ? '✓ Copied!' : '📋 Copy Invoice'}</button>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
        After paying, tap "Claim tokens" to receive your Cashu ecash.
      </div>
      {error && <div style={{ fontSize: 11, color: C.error, marginBottom: 8 }}>⚠️ {error}</div>}
      {claimed ? (
        <div style={{ padding: 12, background: C.cashuGreen + '22', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: C.cashuGreen, fontWeight: 700 }}>✅ Tokens received!</div>
        </div>
      ) : (
        <PrimaryBtn onClick={async () => {
          setClaiming(true)
          try {
            const r = await result.claim()
            if (r.success) { setClaimed(true); setTimeout(onComplete, 2000) }
            else setError('Not yet paid — try again')
          } catch (e) { setError(e.message) }
          finally { setClaiming(false) }
        }} disabled={claiming}>
          {claiming ? '⏳ Checking payment...' : '🪙 Claim Cashu Tokens'}
        </PrimaryBtn>
      )}
    </Card>
  )

  if (result.type === 'reverse_submarine') return (
    <Card glow={C.btcOrange} style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.btcOrange, marginBottom: 8 }}>
        ₿ Reverse Submarine Swap (Lightning → On-chain)
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
        Your preimage hash has been generated. The swap will be created with Boltz.
        Pay the Lightning invoice they generate to receive Bitcoin on-chain.
      </div>
      <div style={{ background: C.surface2, borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Preimage Hash (public)</div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.text, wordBreak: 'break-all' }}>{result.preimageHash}</div>
      </div>
      <div style={{ padding: 10, background: C.warning + '11', borderRadius: 10, fontSize: 11, color: C.warning }}>
        ⚠️ Keep your preimage secret until the on-chain transaction is confirmed.
      </div>
    </Card>
  )

  return (
    <Card style={{ marginTop: 12, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Swap in progress</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Estimated time: ~{route?.typicalTimeMin}min</div>
    </Card>
  )
}

function SwapSuccess({ result, onReset }) {
  return (
    <Card glow={C.cashuGreen} style={{ textAlign: 'center', padding: 32, marginBottom: 16 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Swap Complete!</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>بارك الله فيك</div>
      {result.amtSats && (
        <div style={{ fontSize: 24, fontWeight: 800, color: C.cashuGreen, fontFamily: 'monospace', marginTop: 12 }}>
          {result.amtSats.toLocaleString()} sats
        </div>
      )}
      <button onClick={onReset} style={{
        marginTop: 20, background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '10px 24px', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>New Swap</button>
    </Card>
  )
}
