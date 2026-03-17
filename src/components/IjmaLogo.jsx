/**
 * Ijma Wallet — Logo Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Inline SVG logo — no network request, works offline, scales perfectly.
 *
 * Usage:
 *   <IjmaLogo size={48} />
 *   <IjmaLogo size={24} variant="mono" color="#4BAF92" />
 *   <IjmaLogo size={200} rounded />
 *   <IjmaWordmark size={40} />
 *
 * Variants:
 *   full  — Full-colour teal circle with white elements (default)
 *   mono  — Paths only, inherits `color` prop (for dark/light/custom bg)
 *   flat  — Full mark on transparent background (no circle)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Shared path data ─────────────────────────────────────────────────────────
// All paths in 500×500 coordinate space

const BOLT = (
  <polygon points="290,28 198,218 240,218 202,472 298,282 256,282" />
)

function BTCSymbol({ bg = '#4BAF92' }) {
  return (
    <>
      <rect x="116" y="72" width="20" height="208" rx="5" />
      <rect x="98" y="64" width="58" height="18" rx="7" />
      <rect x="98" y="254" width="58" height="18" rx="7" />
      <path d="M126 82L194 82C228 82 248 98 248 124C248 150 228 164 194 164L126 164Z" />
      <path d="M144 100L190 100C210 100 224 110 224 124C224 138 210 146 190 146L144 146Z" fill={bg} />
      <path d="M126 164L200 164C238 164 260 182 260 210C260 238 238 256 200 256L126 256Z" />
      <path d="M144 182L196 182C218 182 234 194 234 210C234 226 218 236 196 236L144 236Z" fill={bg} />
      <rect x="54" y="146" width="76" height="18" rx="7" />
      <rect x="54" y="202" width="76" height="18" rx="7" />
    </>
  )
}

function OstrichPaths({ bg = '#4BAF92' }) {
  return (
    <>
      {/* Body */}
      <ellipse cx="366" cy="298" rx="76" ry="58" transform="rotate(-18,366,298)" />
      {/* Neck */}
      <path d="M322 250C312 218 318 172 332 144C346 116 370 106 392 114C414 122 418 146 404 166C390 186 370 190 360 210C350 230 346 244 340 252Z" />
      {/* Head */}
      <ellipse cx="396" cy="116" rx="24" ry="20" transform="rotate(-8,396,116)" />
      {/* Beak */}
      <path d="M413 110L444 117L413 126Z" />
      {/* Eye */}
      <circle cx="404" cy="112" r="6" fill={bg} />
      {/* Tail plumes */}
      <path d="M426 264C448 240 472 228 476 204C484 216 474 248 452 266Z" />
      <path d="M436 272C462 254 484 246 490 224C496 238 484 268 458 280Z" />
      <path d="M442 282C466 270 488 266 494 248C498 262 486 284 460 292Z" />
      {/* Front leg */}
      <path d="M334 344C326 368 312 394 300 422L320 428C332 402 346 374 354 350Z" />
      <path d="M300 422C294 440 290 454 288 468L308 470C310 456 314 442 320 428Z" />
      <path d="M280 466L310 470L326 476L322 484L304 480L278 474Z" />
      <path d="M270 462L286 466L282 480L266 476Z" />
      {/* Rear leg */}
      <path d="M384 352C392 372 404 394 414 416L432 408C422 386 410 364 402 344Z" />
      <path d="M414 416C420 434 424 450 426 464L444 462C442 446 438 430 432 408Z" />
      <path d="M422 462L446 460L462 466L458 476L440 472L420 474Z" />
      <path d="M460 464L476 460L480 472L464 476Z" />
    </>
  )
}

// ─── Main logo component ──────────────────────────────────────────────────────

export function IjmaLogo({
  size = 40,
  variant = 'full',   // 'full' | 'mono' | 'flat'
  color = 'white',    // used in mono/flat variants
  bg,                 // override circle/cutout fill (default: teal for full, transparent for others)
  rounded = false,    // add border-radius for app icon style
  style = {},
}) {
  const TEAL = '#4BAF92'
  const bgColor = bg || TEAL
  const borderRadius = rounded ? Math.round(size * 0.2) : undefined

  if (variant === 'full') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size} height={size}
        viewBox="0 0 500 500"
        style={{ display: 'block', flexShrink: 0, borderRadius, ...style }}
        role="img"
        aria-label="Ijma Wallet"
      >
        <title>Ijma Wallet</title>
        <circle cx="250" cy="250" r="250" fill={bgColor} />
        <g fill="white">
          {BOLT}
          <BTCSymbol bg={bgColor} />
          <OstrichPaths bg={bgColor} />
        </g>
      </svg>
    )
  }

  if (variant === 'mono') {
    // Mark on transparent background — use `color` for all paths
    // bgColor used for internal cutouts (eye, ₿ inner)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size} height={size}
        viewBox="0 0 500 500"
        style={{ display: 'block', flexShrink: 0, ...style }}
        role="img"
        aria-label="Ijma Wallet"
      >
        <title>Ijma Wallet</title>
        <g fill={color}>
          {BOLT}
          <BTCSymbol bg={bg || 'transparent'} />
          <OstrichPaths bg={bg || 'transparent'} />
        </g>
      </svg>
    )
  }

  if (variant === 'flat') {
    // Circle background in custom color, white mark
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size} height={size}
        viewBox="0 0 500 500"
        style={{ display: 'block', flexShrink: 0, borderRadius, ...style }}
        role="img"
        aria-label="Ijma Wallet"
      >
        <title>Ijma Wallet</title>
        <circle cx="250" cy="250" r="250" fill={color} />
        <g fill="white">
          {BOLT}
          <BTCSymbol bg={color} />
          <OstrichPaths bg={color} />
        </g>
      </svg>
    )
  }

  return null
}

// ─── Wordmark — logo + text lockup ───────────────────────────────────────────

export function IjmaWordmark({
  size = 40,           // logo size (text scales proportionally)
  orientation = 'horizontal',  // 'horizontal' | 'stacked'
  logoVariant = 'full',
  textColor = '#F0F0F8',
  accentColor = '#4BAF92',
  style = {},
}) {
  const fontSize = Math.round(size * 0.48)
  const subSize = Math.round(size * 0.26)
  const gap = Math.round(size * 0.35)

  if (orientation === 'horizontal') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap,
        textDecoration: 'none', ...style,
      }}>
        <IjmaLogo size={size} variant={logoVariant} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{
            fontSize, fontWeight: 900,
            letterSpacing: Math.round(size * 0.06),
            color: textColor,
            fontFamily: "'Cinzel', 'SF Pro Display', -apple-system, serif",
          }}>
            IJMA
          </div>
          <div style={{
            fontSize: subSize,
            color: accentColor,
            letterSpacing: Math.round(size * 0.03),
            marginTop: 1,
            fontFamily: "'Cinzel', 'SF Pro Display', -apple-system, serif",
          }}>
            إجماع · WALLET
          </div>
        </div>
      </div>
    )
  }

  // Stacked
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: Math.round(size * 0.3), ...style,
    }}>
      <IjmaLogo size={size} variant={logoVariant} />
      <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
        <div style={{
          fontSize: Math.round(size * 0.55), fontWeight: 900,
          letterSpacing: Math.round(size * 0.08),
          color: textColor,
          fontFamily: "'Cinzel', 'SF Pro Display', -apple-system, serif",
        }}>
          IJMA
        </div>
        <div style={{
          fontSize: Math.round(size * 0.28),
          color: accentColor,
          letterSpacing: Math.round(size * 0.04),
          marginTop: 4,
          fontFamily: "'Cinzel', 'SF Pro Display', -apple-system, serif",
        }}>
          إجماع · WALLET
        </div>
      </div>
    </div>
  )
}

// ─── Favicon — smallest usable mark ──────────────────────────────────────────

export function IjmaFavicon({ size = 32 }) {
  // At tiny sizes, simplified to bolt + circle only for clarity
  if (size <= 24) {
    return (
      <svg width={size} height={size} viewBox="0 0 500 500">
        <circle cx="250" cy="250" r="250" fill="#4BAF92" />
        <polygon points="290,28 198,218 240,218 202,472 298,282 256,282" fill="white" />
      </svg>
    )
  }
  return <IjmaLogo size={size} variant="full" />
}

// ─── App splash / loading screen mark ────────────────────────────────────────

export function IjmaSplash({ size = 120 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <IjmaLogo size={size} variant="full" rounded style={{
        boxShadow: `0 0 60px #4BAF9244`,
      }} />
      <div style={{
        fontSize: 13, letterSpacing: 3, color: '#4BAF92',
        fontFamily: "'Cinzel', serif",
      }}>
        إجماع
      </div>
    </div>
  )
}
