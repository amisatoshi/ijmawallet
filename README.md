# إجماع — Ijma Wallet

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-F7931A.svg)](LICENSE)
[![Bitcoin](https://img.shields.io/badge/Bitcoin-Non--Custodial-F7931A?logo=bitcoin)](https://ijmawallet.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-8B4CF7)](https://ijmawallet.com/app/)
[![Nostr](https://img.shields.io/badge/Nostr-NIP--06-00C3FF)](https://nostr.com)
[![Cashu](https://img.shields.io/badge/Ecash-Cashu%20%2B%20Fedimint-00D98C)](https://cashu.space)
[![Shariah](https://img.shields.io/badge/Finance-Halal-00D98C)](https://www.ijmawallet.com)
[![CI](https://github.com/amisatoshi/ijmawallet/actions/workflows/ci.yml/badge.svg)](https://github.com/amisatoshi/ijmawallet/actions)
[![Version](https://img.shields.io/badge/version-0.2.0-orange)](https://github.com/amisatoshi/ijmawallet/releases)

**Sovereign · Private · Halal**

*Bitcoin · Lightning · Nostr · Cashu · Fedimint — one non-custodial PWA*

[**Live App →**](https://www.ijmawallet.com/app/) &nbsp;·&nbsp; [**Website →**](https://www.ijmawallet.com) &nbsp;·&nbsp; [**Design Doc →**](https://www.ijmawallet.com/assets/documents/design-doc.pdf)

</div>

---

> ⚠️ **v0.2.0 — Demo release.** The cryptographic foundations are sound but the
> application has not undergone a professional security audit. Do not store
> significant funds until v1.0.0. See [SECURITY.md](SECURITY.md).

---

## What is Ijma?

**Ijma** (Arabic: إجماع — *consensus*) is an open-source, self-custody Bitcoin
wallet built as a Progressive Web App. It unifies the full Bitcoin protocol
stack — on-chain, Lightning, Cashu ecash, Fedimint, and Nostr identity — into
a single interface designed for both first-time users and power users.

The name reflects the wallet's core design principle: achieving consensus
between competing priorities — security and usability, sovereignty and
convenience, simplicity and power.

### Core properties

- **Non-custodial** — your seed phrase never leaves your device
- **Open source** — MIT licence, every line is auditable
- **No trackers** — zero analytics, telemetry, or ads
- **Shariah-compliant** — no riba, no gharar, no maysir
- **Installable PWA** — iOS, Android, and desktop without an app store

---

## Protocol stack

```
L4  Application       Ijma Wallet PWA
L3  Identity/Privacy  Cashu · Fedimint · Nostr
L2  Lightning Network Scaling, routing, atomic swaps  ← bridge
L1  Bitcoin           Base layer settlement
```

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| BIP39 wallet creation (24 words) | ✅ v0.1.0 | Real entropy via Web Crypto API |
| BIP84 SegWit + BIP86 Taproot | ✅ v0.1.0 | Native address derivation |
| NIP-06 Nostr key derivation | ✅ v0.1.0 | One seed → Bitcoin + Nostr identity |
| AES-256-GCM vault encryption | ✅ v0.1.0 | PBKDF2 · 600,000 iterations |
| PIN + WebAuthn biometric auth | ✅ v0.1.0 | FIDO2 · device secure enclave |
| Cashu ecash (mint/melt/send/receive) | ✅ v0.1.0 | Multi-mint · Chaumian blind sigs |
| Nostr Zaps (NIP-57) | ✅ v0.1.0 | Lightning tips on social web |
| Atomic cross-layer swaps | ✅ v0.2.0 | Submarine swaps via Boltz HTLCs |
| Hardware wallet support | ✅ v0.2.0 | Jade · Coldcard · Ledger · Trezor · Passport · SeedSigner |
| PWA — offline, installable | ✅ v0.1.0 | Workbox service worker |
| Mempool.space fee integration | ✅ v0.1.0 | Live fee rates |
| Beginner / Power user modes | ✅ v0.1.0 | Progressive disclosure |
| Breez SDK Lightning node | 🔜 v0.3.0 | Embedded non-custodial LN |
| Fedimint WASM client | 🔜 v0.3.0 | Federation join and management |
| Social recovery (Shamir + Nostr) | 🔜 v0.3.0 | Threshold secret sharing |
| Zakat calculator | 🔜 v0.3.0 | Nisab threshold · 2.5% |
| Multi-sig 2-of-3 | 🔜 v1.0.0 | Hardware wallet coordination |
| Web of Trust scoring | 🔜 v1.0.0 | NIP-based reputation |
| Professional security audit | 🔜 v1.0.0 | Third-party · public report |

---

## Security model

| Layer | Implementation |
|-------|---------------|
| Seed phrase at rest | AES-256-GCM · PBKDF2 (600,000 iterations) · 32-byte random salt per op |
| Keys in memory | Session only — cleared on lock — never serialised to disk |
| Authentication | 6-digit PIN (SHA-256 + salt) + WebAuthn biometrics (FIDO2) |
| Storage backend | IndexedDB — encrypted before write, decrypted after read |
| Auto-lock | 5 minutes of inactivity |
| Cryptographic primitives | Web Crypto API (OS-level, hardware-accelerated) |
| Network | All calls to open public APIs only — no proprietary backends |
| Custody | 100% non-custodial — no server ever receives or sees a key |

Read [SECURITY.md](SECURITY.md) for the full threat model and vulnerability
disclosure policy.

---

## Quick start

**Requirements:** Node.js 20+ · npm 10+

```bash
# Clone
git clone https://github.com/amisatoshi/ijmawallet.git
cd ijmawallet

# Install
npm install

# Development server (hot reload)
npm run dev
# → http://localhost:5173/app/

# Production build
npm run build

# Preview production build locally
npm run preview

# Run security audit
npm audit
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions covering Hostinger,
Vercel, and self-hosted VPS deployment.

---

## Project structure

```
ijmawallet/
├── src/
│   ├── lib/
│   │   ├── security.js      # AES-256-GCM vault · WebAuthn · PBKDF2
│   │   ├── bitcoin.js       # BIP39/32/84/86 · Mempool.space API
│   │   ├── nostr.js         # Keypair · events · Zaps · relays · NIPs
│   │   ├── cashu.js         # Cashu ecash mint/melt/send/receive
│   │   ├── swaps.js         # Atomic swaps · Boltz · cross-mint
│   │   └── hardware.js      # PSBT signing · WebUSB/HID · QR air-gap
│   ├── context/
│   │   └── WalletContext.jsx   # Global state · session management
│   ├── components/
│   │   ├── Onboarding.jsx   # Wallet creation and restore flow
│   │   ├── LockScreen.jsx   # PIN + biometric unlock
│   │   ├── MainWallet.jsx   # Tab shell + navigation
│   │   └── shared.jsx       # Design system · tokens · components
│   └── screens/
│       ├── HomeScreen.jsx   # Portfolio · balances · protocol stack
│       ├── SwapScreen.jsx   # Atomic cross-layer swaps
│       ├── HardwareScreen.jsx  # Hardware wallet browser + signing
│       └── AllScreens.jsx   # Send · Receive · Ecash · Nostr · Settings
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # Build · lint · audit · deploy
│   │   └── codeql.yml       # Automated security scanning
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── security_report.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── SECURITY.md              # Vulnerability disclosure · threat model
├── CONTRIBUTING.md          # Contribution guide
├── CODE_OF_CONDUCT.md       # Community standards
├── LIBRARIES.md             # All dependencies · repos · audit status
└── DEPLOYMENT.md            # Deployment guide · server config
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md)
before opening a pull request.

**Core rules:**
- Open an issue before starting significant changes
- No plaintext keys or seed phrases — ever, anywhere in code
- No external telemetry, analytics, or user tracking of any kind
- Test on iOS Safari 16+ and Android Chrome 110+
- Security-sensitive changes require two reviewer approvals

---

## Dependencies

All runtime dependencies, their repositories, maintainers, licences, and
formal audit status are documented in [LIBRARIES.md](LIBRARIES.md).

**Formally audited (Cure53, January 2022):**

| Library | Auditor | Report |
|---------|---------|--------|
| `@noble/hashes` | Cure53 | [PDF](https://cure53.de/pentest-report_noble-lib.pdf) |
| `noble-secp256k1` | Cure53 | [PDF](https://cure53.de/pentest-report_noble-lib.pdf) |
| `@scure/bip32` | Cure53 | [PDF](https://cure53.de/pentest-report_scure-btc-signer.pdf) |
| `@scure/bip39` | Cure53 | [PDF](https://cure53.de/pentest-report_scure-btc-signer.pdf) |

---

## Roadmap

| Phase | Target | Focus |
|-------|--------|-------|
| ✅ v0.1.0 | Mar 2026 | Key generation · Cashu · Nostr · PWA · AES vault |
| ✅ v0.2.0 | Mar 2026 | Atomic swaps · Hardware wallets · Landing page |
| 🔜 v0.3.0 | Q3 2026 | Breez Lightning · Fedimint · Social recovery · Zakat |
| 🔜 v1.0.0 | 2027 | Multi-sig · Taproot · Web of Trust · Security audit |

---

## Licence

MIT — see [LICENSE](LICENSE).

---

## Built by

[Blockchainology](https://www.blockchainology.co.uk) — Bitcoin-only consultancy.  
*Digital Hijrah: helping individuals and organisations transition to digital sovereignty.*

Maintainer: [@amisatoshi](https://github.com/amisatoshi)

---

*بسم الله الرحمن الرحيم*  
*In the name of Allah, the Most Gracious, the Most Merciful.*
