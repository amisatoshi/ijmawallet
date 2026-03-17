/**
 * Ijma Wallet — SVG Icon System
 * Flat, modern, pixel-perfect icons at 24×24 base size.
 * All icons are inline SVG — no external dependencies, no network requests,
 * works offline, scales perfectly at any density (retina, etc).
 *
 * Usage:
 *   <Icon name="send" size={24} color="#F7931A" />
 *   <Icon name="bitcoin" size={32} />
 */

const icons = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  home: (
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z M9 22V12h6v10" />
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" />
    </>
  ),
  receive: (
    <>
      <path d="M12 2v14M6 10l6 6 6-6" />
      <path d="M3 20h18" />
    </>
  ),
  swap: (
    <>
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  // ── Wallet concepts ──────────────────────────────────────────────────────────
  bitcoin: (
    <>
      <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.5 19.25m1.267-.161L10.5 14.75m1.267-.161L10.5 9.25m2.517 5.5c4.924.868 6.14-6.025 1.216-6.894m0 0L12.5 4.75m1.267.161L12.5 9.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4.75h2.25m0 14.5H9m5.25-14.5H12m0 14.5h2.25" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  lightning: (
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  ),
  ecash: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9a2.5 2.5 0 00-5 0v6a2.5 2.5 0 005 0" />
      <path d="M9 12h6" />
    </>
  ),
  savings: (
    <>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z" />
    </>
  ),
  // ── Actions ──────────────────────────────────────────────────────────────────
  scan: (
    <>
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M7 12h10" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  unlock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 019.9-1" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 10v4m0-8C8.7 6 6 8.7 6 12v4c0 .6-.4 1-1 1H4" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 2.5 1 4.8 2.5 6.5" />
      <path d="M16 12c0-2.2-1.8-4-4-4s-4 1.8-4 4v4.5" />
      <path d="M20 12c0-4.4-3.6-8-8-8" />
      <path d="M20.5 16.5c.3-1.4.5-2.9.5-4.5" />
    </>
  ),
  // ── Social / Identity ────────────────────────────────────────────────────────
  nostr: (
    <>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </>
  ),
  contact: (
    <>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  contacts: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  zap: (
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  ),
  trust: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  // ── Hardware ──────────────────────────────────────────────────────────────────
  hardware: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M6 14h8" />
    </>
  ),
  usb: (
    <>
      <path d="M12 2v8M8 6l4-4 4 4" />
      <path d="M8 10h8v6a2 2 0 01-2 2h-4a2 2 0 01-2-2v-6z" />
      <path d="M10 16v3M14 16v3" />
    </>
  ),
  // ── Status / Feedback ────────────────────────────────────────────────────────
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  alertCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  shieldCheck: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  // ── Finance ──────────────────────────────────────────────────────────────────
  wallet: (
    <>
      <path d="M21 12V7H5a2 2 0 010-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" />
      <path d="M18 12a2 2 0 000 4h4v-4z" />
    </>
  ),
  payments: (
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <path d="M1 10h22" />
    </>
  ),
  node: (
    <>
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M12 8v3m0 0l-5 5m5-5l5 5" />
    </>
  ),
  // ── Misc ──────────────────────────────────────────────────────────────────────
  chevronRight: (
    <path d="M9 18l6-6-6-6" />
  ),
  chevronDown: (
    <path d="M6 9l6 6 6-6" />
  ),
  close: (
    <path d="M18 6L6 18M6 6l12 12" />
  ),
  plus: (
    <path d="M12 5v14M5 12h14" />
  ),
  trash: (
    <>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M17 8l-5-5-5 5M12 3v12" />
    </>
  ),
  refresh: (
    <>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </>
  ),
  moon: (
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </>
  ),
  hint: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
    </>
  ),
  seedPhrase: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h10M7 12h6M7 16h8" />
    </>
  ),
  mosque: (
    <>
      <path d="M3 21h18M3 21V11l3-3 3 3V7l3-5 3 5v4l3-3 3 3v10" />
      <path d="M12 2v5" />
      <path d="M9 11h6" />
    </>
  ),
  tor: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
}

export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
  filled = false,
  style = {},
}) {
  const path = icons[name]
  if (!path) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

// ─── Branded layer icons (coloured) ──────────────────────────────────────────

export function LayerIcon({ layer, size = 20 }) {
  const map = {
    bitcoin:   { name: 'bitcoin',   color: '#F7931A' },
    onchain:   { name: 'bitcoin',   color: '#F7931A' },
    lightning: { name: 'lightning', color: '#8B4CF7' },
    payments:  { name: 'payments',  color: '#8B4CF7' },
    cashu:     { name: 'ecash',     color: '#00D98C' },
    fedimint:  { name: 'savings',   color: '#6366F1' },
    savings:   { name: 'savings',   color: '#6366F1' },
    nostr:     { name: 'nostr',     color: '#00C3FF' },
  }
  const { name, color } = map[layer] || { name: 'wallet', color: '#6B6B85' }
  return (
    <div style={{
      width: size + 8, height: size + 8,
      borderRadius: (size + 8) / 2,
      background: color + '20',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon name={name} size={size} color={color} />
    </div>
  )
}

// ─── Icon button wrapper ──────────────────────────────────────────────────────

export function IconButton({ name, size = 20, color, onClick, label, style }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none', border: 'none',
        cursor: 'pointer', padding: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, transition: 'background 0.15s',
        ...style,
      }}
    >
      <Icon name={name} size={size} color={color || 'currentColor'} />
    </button>
  )
}
