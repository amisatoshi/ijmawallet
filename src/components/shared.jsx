/**
 * Ijma Wallet — Design System v2
 * Warm, editorial, photorealistic-card-first design.
 */

import { useState } from 'react'

// ─── Colour tokens ────────────────────────────────────────────────────────────

export const C = {
  btcOrange:       '#F7931A',
  lightningPurple: '#8B4CF7',
  nostrBlue:       '#0098D4',
  cashuGreen:      '#00A86B',
  fedimintIndigo:  '#4F46E5',
  ijmaTeal:        '#4BAF92',
  bg:              '#FAF8F5',
  surface:         '#FFFFFF',
  surface2:        '#F3F0EB',
  surface3:        '#EDE9E2',
  border:          '#E5E0D8',
  shadow:          'rgba(60,45,20,0.08)',
  text:            '#1A1410',
  text2:           '#4A3F35',
  muted:           '#9A8F83',
  success:         '#00A86B',
  warning:         '#E08900',
  error:           '#D93025',
  gold:            '#C9A84C',
  goldDim:         '#8A6F2E',
}

export const FONTS = {
  display: "'Fraunces', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'JetBrains Mono', monospace",
}

// ─── Image paths — drop files into public/images/ ────────────────────────────
// import.meta.env.BASE_URL resolves to '/app/' in dev and prod (matches vite.config base)
const BASE = import.meta.env.BASE_URL  // '/app/'
export const IMAGES = {
  balanceCard:  BASE + 'images/balance-card.jpg',
  paymentsCard: BASE + 'images/payments-card.jpg',
  savingsCard:  BASE + 'images/savings-card.jpg',
}

// ─── ImageCard — full-bleed photo card with text overlay ─────────────────────
export function ImageCard({ src, fallbackGradient, children, style, height = 220, glow }) {
  const [imgError, setImgError] = useState(false)
  const bg = fallbackGradient || `linear-gradient(135deg, #C9A84C 0%, #6B4E0A 100%)`
  return (
    <div style={{
      position: 'relative', borderRadius: 20, overflow: 'hidden', height,
      background: C.surface3,
      boxShadow: glow
        ? `0 8px 40px ${glow}44, 0 2px 8px rgba(0,0,0,0.12)`
        : '0 4px 24px rgba(60,45,20,0.14)',
      ...style,
    }}>
      {(!imgError && src) ? (
        <img src={src} onError={() => setImgError(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          alt="" />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: bg }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.52) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, glow, onPress }) {
  return (
    <div onClick={onPress} style={{
      background: C.surface, borderRadius: 16, padding: 16,
      position: 'relative', overflow: 'hidden',
      boxShadow: glow ? `0 0 24px ${glow}33, 0 2px 8px ${C.shadow}` : `0 1px 4px ${C.shadow}`,
      border: `1px solid ${C.border}`,
      cursor: onPress ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontFamily: FONTS.body, fontWeight: 600,
      letterSpacing: 1.5, color: C.muted, textTransform: 'uppercase',
      marginBottom: 10, marginTop: 4, ...style,
    }}>{children}</div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, color = C.btcOrange }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}33`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 10, fontFamily: FONTS.body, fontWeight: 600,
      letterSpacing: 0.8, textTransform: 'uppercase',
    }}>{label}</span>
  )
}

// ─── PrimaryBtn ───────────────────────────────────────────────────────────────
export function PrimaryBtn({ children, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%',
      background: disabled ? C.surface3 : `linear-gradient(135deg, ${C.btcOrange} 0%, #E8820A 100%)`,
      border: 'none', borderRadius: 14, padding: '15px 20px',
      color: disabled ? C.muted : '#fff', fontSize: 15,
      fontFamily: FONTS.body, fontWeight: 600, letterSpacing: 0.3,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : `0 4px 20px ${C.btcOrange}40`,
      transition: 'all 0.2s', ...style,
    }}>{children}</button>
  )
}

// ─── SecondaryBtn ─────────────────────────────────────────────────────────────
export function SecondaryBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 14, padding: '12px 18px',
      color: C.text2, fontSize: 14, fontFamily: FONTS.body,
      fontWeight: 500, cursor: 'pointer', ...style,
    }}>{children}</button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, fontFamily: FONTS.body, fontWeight: 600, letterSpacing: 1, color: C.muted, textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>}
      <input {...props} style={{
        width: '100%', background: C.surface2, border: `1.5px solid ${C.border}`,
        borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 14,
        fontFamily: FONTS.body, outline: 'none', boxSizing: 'border-box',
        ...(props.style || {}),
      }} />
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onToggle, color = C.btcOrange }) {
  return (
    <div onClick={onToggle} style={{
      width: 46, height: 26, borderRadius: 13,
      background: on ? color : C.surface3,
      border: `1.5px solid ${on ? color : C.border}`,
      position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <div style={{
        width: 19, height: 19, borderRadius: 10, background: '#fff',
        position: 'absolute', top: 2, left: on ? 23 : 3,
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

export function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
}

// ─── ScreenWrapper ────────────────────────────────────────────────────────────
export function ScreenWrapper({ children, noPad, style }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      ...(noPad ? {} : { padding: '0 16px 96px' }),
      ...style,
    }}>{children}</div>
  )
}

// ── GeomPattern — Islamic geometric tile background
// Uses public/images/pattern-tile.png (gold lines on white, seamless repeat).
// backgroundSize controls motif scale — 220px gives fine subtle texture on mobile.
export function GeomPattern({ opacity = 0.07 }) {
  const BASE = import.meta.env.BASE_URL
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${BASE}images/pattern-tile.png)`,
      backgroundRepeat: 'repeat',
      backgroundSize: '220px 220px',
      opacity,
      pointerEvents: 'none',
    }} />
  )
}

export function layerColor(layer) {
  return {
    lightning: '#8B4CF7',
    onchain:   '#F7931A',
    cashu:     '#00A86B',
    fedimint:  '#4F46E5',
    nostr:     '#0098D4',
  }[layer] || '#9A8F83'
}
