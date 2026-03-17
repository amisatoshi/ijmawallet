# Contributing to Ijma Wallet

*بسم الله — In the name of Allah*

Thank you for considering a contribution to Ijma Wallet. This project exists
to give people a sovereign, private, and Shariah-compliant Bitcoin wallet.
Every contribution — code, documentation, translation, testing, or feedback —
moves that mission forward.

---

## Table of contents

1. [Before you start](#1-before-you-start)
2. [Development setup](#2-development-setup)
3. [How to contribute](#3-how-to-contribute)
4. [Code standards](#4-code-standards)
5. [Security rules](#5-security-rules-non-negotiable)
6. [Pull request process](#6-pull-request-process)
7. [Commit message format](#7-commit-message-format)
8. [Testing](#8-testing)
9. [Areas where help is needed](#9-areas-where-help-is-needed)

---

## 1. Before you start

- Read [SECURITY.md](SECURITY.md) — especially the threat model
- Check [open issues](https://github.com/amisatoshi/ijmawallet/issues) before
  starting new work — someone may already be on it
- For significant changes, **open an issue first** and discuss the approach
  before writing code
- By contributing you agree that your contributions are licensed under MIT

---

## 2. Development setup

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/amisatoshi/ijmawallet.git
cd ijmawallet

# Install dependencies
npm install

# Create your feature branch
git checkout -b feature/your-feature-name

# Start dev server
npm run dev
# → http://localhost:5173/app/
```

**Requirements:** Node.js 20+ · npm 10+

For WebAuthn testing (biometrics), HTTPS is required locally:

```bash
# Install mkcert
brew install mkcert   # macOS
mkcert -install
mkcert localhost

# Add to vite.config.js temporarily:
# server: { https: { key: './localhost-key.pem', cert: './localhost.pem' } }
```

---

## 3. How to contribute

### Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).

Include:
- Browser and version (Chrome 121 on Android 14, etc.)
- Steps to reproduce
- What you expected vs what happened
- Console errors if any (F12 → Console)
- Whether it involves real funds (if so, report privately — see SECURITY.md)

### Suggesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).

Features that align with the project values are most likely to be accepted:
- Increases user sovereignty or privacy
- Reduces trust requirements
- Improves Shariah compliance
- Improves accessibility or usability for normies
- Strengthens security

Features that will not be accepted:
- Any form of custodial functionality
- Analytics, telemetry, or user tracking
- Advertising or affiliate integrations
- Speculative financial products (staking, yield, derivatives)
- KYC/AML data collection

### Writing code

See sections 4–8 below.

### Improving documentation

Documentation PRs are very welcome — fix typos, clarify explanations,
add missing steps. No issue required for documentation fixes.

### Translations

The UI contains some Arabic text (Islamic phrases) and English. We welcome:
- Arabic translations of interface text
- Urdu, Malay, Turkish translations (large Muslim developer communities)
- Any language where Bitcoin sovereignty matters

Open an issue to discuss before starting a full translation.

---

## 4. Code standards

### Language and framework
- React 18 functional components with hooks only — no class components
- JavaScript (`.js` / `.jsx`) — TypeScript migration is on the roadmap
- No CSS frameworks — inline styles using the design token system in `shared.jsx`

### Style

```jsx
// ✅ Good — functional, hooks, named export, descriptive
export function SendScreen() {
  const { session, balances } = useWallet()
  const [amount, setAmount] = useState('')
  // ...
}

// ❌ Avoid — class components
class SendScreen extends React.Component { ... }

// ✅ Good — descriptive variable names
const amountInSats = parseInt(amount || '0')

// ❌ Avoid — cryptic names
const a = parseInt(x || '0')
```

### File organisation
- One primary component per file
- Library functions in `src/lib/` — pure functions, no React imports
- React components in `src/components/` (shared) or `src/screens/` (full screens)
- Global state only in `src/context/WalletContext.jsx`

### Comments
- Comment the *why*, not the *what*
- Security-critical sections must have comments explaining the threat model
- Arabic transliterations welcome in comments for Islamic concepts

---

## 5. Security rules (non-negotiable)

These rules exist to protect users' funds. Any PR that violates them will be
closed without merge.

```
🚫 NEVER log, print, or expose private keys or seed phrases
🚫 NEVER store secrets in localStorage, sessionStorage, or cookies
🚫 NEVER add analytics, tracking pixels, or telemetry
🚫 NEVER use eval(), new Function(), or innerHTML with user data
🚫 NEVER add a new npm dependency without documenting it in LIBRARIES.md
🚫 NEVER use HTTP (non-TLS) endpoints for any external call
🚫 NEVER trust data from Nostr relays without cryptographic verification
🚫 NEVER assume Cashu proofs are valid without checking against the mint
```

```
✅ ALWAYS use Web Crypto API for cryptographic operations
✅ ALWAYS sanitise and validate user inputs before processing
✅ ALWAYS clear sensitive values from memory after use
✅ ALWAYS use npm ci (not npm install) in automated environments
✅ ALWAYS run npm audit before submitting a PR
✅ ALWAYS test hardware wallet flows with real devices where possible
```

---

## 6. Pull request process

### Before opening a PR

```bash
# Ensure the build passes
npm run build

# Run the linter
npm run lint

# Run security audit — fix any high/critical issues
npm audit

# Run tests
npm run test
```

### PR checklist

When you open a PR, the template will ask you to confirm:

- [ ] Build passes (`npm run build`)
- [ ] `npm audit` shows no high or critical vulnerabilities
- [ ] No private keys, seeds, or sensitive data in any file
- [ ] No new external dependencies without LIBRARIES.md entry
- [ ] Tested on Chrome (desktop) and at least one mobile browser
- [ ] Security-sensitive changes noted and explained

### Review process

- All PRs require at least **one approval** from a maintainer
- PRs touching `src/lib/security.js`, `src/lib/bitcoin.js`, or
  `src/context/WalletContext.jsx` require **two approvals**
- CI must pass (build + lint + audit)
- Maintainer may request changes — please respond within 14 days

### Branch naming

```
feature/add-qr-scanner
fix/cashu-proof-validation
docs/update-deployment-guide
security/upgrade-nostr-tools
chore/update-dependencies
```

---

## 7. Commit message format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Longer explanation if needed (wrap at 72 chars).
Explain WHY, not just what.

Closes #123
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `security` | Security improvement |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behaviour change |
| `test` | Adding or fixing tests |
| `chore` | Dependency updates, build changes |
| `perf` | Performance improvement |

**Examples:**

```
feat(cashu): add cross-mint swap via Lightning bridge

Implements swapCashuCrossMint() which melts from source mint,
bridges via Lightning invoice, and mints fresh proofs at dest.

Closes #42

---

security(vault): increase PBKDF2 iterations to 600k

Previous value of 310k was below OWASP 2023 recommendation.
600k iterations (SHA-256) is current best practice.
No breaking change — existing vaults re-encrypt on next unlock.

---

fix(hardware): handle WebUSB NotFoundError gracefully

Chrome throws NotFoundError when user dismisses the device
picker. Previously this crashed the connection flow.
```

---

## 8. Testing

### Running tests

```bash
npm run test           # Run all tests
npm run test -- --watch   # Watch mode
```

### What to test

Every function in `src/lib/` should have unit tests. Priority order:

1. `security.js` — encrypt/decrypt round trips, PIN hashing, salt generation
2. `bitcoin.js` — address derivation against BIP84 test vectors
3. `nostr.js` — keypair generation, event signing, NIP-19 encoding
4. `cashu.js` — token parsing, proof validation
5. `swaps.js` — fee estimation, route validation, amount bounds

### Test file location

```
src/lib/security.js   →   src/lib/__tests__/security.test.js
src/lib/bitcoin.js    →   src/lib/__tests__/bitcoin.test.js
```

### Example test

```js
// src/lib/__tests__/bitcoin.test.js
import { describe, it, expect } from 'vitest'
import { generateMnemonicPhrase, validateMnemonicPhrase } from '../bitcoin.js'

describe('BIP39 mnemonic', () => {
  it('generates a valid 24-word mnemonic', () => {
    const mnemonic = generateMnemonicPhrase(256)
    const words = mnemonic.split(' ')
    expect(words).toHaveLength(24)
    expect(validateMnemonicPhrase(mnemonic)).toBe(true)
  })

  it('rejects an invalid mnemonic', () => {
    expect(validateMnemonicPhrase('abandon abandon abandon')).toBe(false)
  })
})
```

---

## 9. Areas where help is needed

These are the highest-priority contributions right now:

**🔴 High priority**
- Unit tests for `src/lib/security.js` — encrypt/decrypt, PIN hashing
- Unit tests for `src/lib/bitcoin.js` — address derivation test vectors
- Real Breez SDK Lightning integration (v0.3.0)
- QR code scanner for receive and hardware wallet flows

**🟡 Medium priority**
- Arabic UI localisation
- Urdu translation
- Fedimint WASM client integration
- BC-UR animated QR encoding for air-gap hardware signing
- Zakat nisab threshold calculator

**🟢 Good first issues**
- Replace `YOUR_USERNAME` references throughout the codebase with `amisatoshi`
- Add `qrcode.react` for proper QR display on the Receive screen
- Improve the loading state animations
- Add a "copy address" toast notification
- Fix any open issues labelled `good first issue`

---

## Questions?

Open a [discussion](https://github.com/amisatoshi/ijmawallet/discussions) or
tag `@amisatoshi` in an issue.

جزاك الله خيراً — May Allah reward you with good.
