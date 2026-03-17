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

// ─── IslamicPattern — 8-pointed star lattice (matches onboarding imagery) ──────
// Constructed from two overlapping squares rotated 45°, with connecting lattice lines.
// Each tile is 120×120. Use on any screen for visual continuity.
export function GeomPattern({ opacity = 0.06, color }) {
  const stroke = color || '#C9A84C'
  // 8-pointed star geometry:
  // Outer square (0°):   points at N/E/S/W at radius r from centre
  // Inner square (45°):  points at NE/SE/SW/NW at same radius
  // Together they form an 8-pointed star.
  // We tile these with connecting diagonal lines to form the lattice.
  const id = `islamic-star-${stroke.replace('#','')}`
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          {/* ── Primary 8-pointed star centred at (60,60) ── */}
          {/* Outer octagon */}
          <polygon
            points="60,18 79,28 91,47 91,73 79,92 60,102 41,92 29,73 29,47 41,28"
            fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity * 10}
          />
          {/* Inner rotated square — creates the star points */}
          <polygon
            points="60,26 82,48 60,70 38,48"
            fill="none" stroke={stroke} strokeWidth="0.6" opacity={opacity * 8}
          />
          {/* Upright square */}
          <polygon
            points="60,29 83,60 60,91 37,60"
            fill="none" stroke={stroke} strokeWidth="0.6" opacity={opacity * 8}
          />
          {/* ── Star points — 8 small diamond tips ── */}
          <line x1="60" y1="18" x2="60" y2="29" stroke={stroke} strokeWidth="0.5" opacity={opacity * 7}/>
          <line x1="91" y1="47" x2="83" y2="48" stroke={stroke} strokeWidth="0.5" opacity={opacity * 7}/>
          <line x1="91" y1="73" x2="83" y2="72" stroke={stroke} strokeWidth="0.5" opacity={opacity * 7}/>
          <line x1="60" y1="102" x2="60" y2="91" stroke={stroke} strokeWidth="0.5" opacity={opacity * 7}/>
          <line x1="29" y1="73" x2="37" y2="72" stroke={stroke} strokeWidth="0.5" opacity={opacity * 7}/>
          <line x1="29" y1="47" x2="37" y2="48" stroke={stroke} strokeWidth="0.5" opacity={opacity * 7}/>
          {/* ── Corner stars at tile corners (60,0), (120,60), (60,120), (0,60) ── */}
          {/* Top centre (60,0) partial star */}
          <polygon
            points="60,-18 79,-8 91,11 91,11 79,30 60,40 41,30 29,11 29,11 41,-8"
            fill="none" stroke={stroke} strokeWidth="0.7" opacity={opacity * 8}
          />
          {/* Connecting lattice lines — diagonal grid */}
          <line x1="0"   y1="0"   x2="29"  y2="47"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="120" y1="0"   x2="91"  y2="47"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="0"   y1="120" x2="29"  y2="73"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="120" y1="120" x2="91"  y2="73"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="29"  y1="47"  x2="41"  y2="28"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="91"  y1="47"  x2="79"  y2="28"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="29"  y1="73"  x2="41"  y2="92"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
          <line x1="91"  y1="73"  x2="79"  y2="92"  stroke={stroke} strokeWidth="0.4" opacity={opacity * 5}/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
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
