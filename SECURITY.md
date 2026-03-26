# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | ✅ Active |
| 0.2.x   | ⚠️ Critical fixes only |
| 0.1.x   | ❌ Not supported |
| < 0.1.0 | ❌ Not supported |

---

## ⚠️ Important disclaimer

Ijma Wallet v0.3.0 is a **demo release**. It has not undergone a professional
third-party security audit. Do not store amounts you cannot afford to lose
until v1.0.0, which will include a published Cure53 or equivalent audit.

---

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Security vulnerabilities must be reported privately to give us time to fix
them before they can be exploited.

### How to report

**Email:** ijma@blockchainology.co.uk

**Subject line:** `[SECURITY] Ijma Wallet — <brief description>`

**PGP encryption (preferred for sensitive reports):**
Encrypt your report using the maintainer's public key published at:
`https://www.blockchainology.co.uk/pgp.asc`

### What to include

Please provide as much of the following as you can:

- Description of the vulnerability
- Which component is affected (`src/lib/security.js`, etc.)
- Steps to reproduce
- Proof of concept (code, screenshots, or video)
- Potential impact — what can an attacker do?
- Your suggested fix, if you have one
- Whether you want public credit in the advisory

### What happens next

| Timeline | Action |
|----------|--------|
| 48 hours | Acknowledgement of your report |
| 7 days | Initial assessment and severity rating |
| 30 days | Fix developed and tested |
| 45 days | Patched release published |
| 90 days | Public disclosure (coordinated with you) |

If a critical vulnerability puts user funds at risk, we will publish an
emergency advisory and patch within 7 days.

---

## Bug bounty

There is no formal paid bug bounty programme at this stage. We will credit all
responsible disclosures in the public advisory and in the release notes, with
your consent. A formal bounty programme is planned for v1.0.0.

---

## Threat model

Understanding what Ijma is and is not designed to protect against.

### In scope — threats Ijma is designed to resist

**Compromised web server**
The app is a static PWA. No secrets are stored server-side. A compromised
host can serve a modified `index.html`, but the service worker caches the
app shell after first load, making this attack window narrow. Subresource
Integrity (SRI) hashes are used where possible.

**Database breach**
All sensitive data in IndexedDB is encrypted with AES-256-GCM before
storage. A raw database dump reveals only ciphertext.

**XSS (Cross-Site Scripting)**
Content Security Policy headers block inline scripts and restrict `connect-src`
to a whitelist. No `eval()` is used anywhere in the codebase.

**Weak PIN**
PINs are hashed with SHA-256 + a 32-byte random salt before storage. The
vault uses PBKDF2 with 600,000 iterations, making brute-force attacks
expensive. A 6-digit PIN provides 10^6 combinations; combined with PBKDF2
this requires substantial compute to attack.

**Session sniffing**
Keys are held in JavaScript memory only during an active session and cleared
on lock. They are never written to localStorage, sessionStorage, cookies, or
any logging system.

**Relay-level Nostr manipulation**
Nostr events are cryptographically signed by the user's private key. A
malicious relay can censor or drop events but cannot forge them.

### Out of scope — threats Ijma cannot protect against

**Compromised device**
If an attacker has physical access to your unlocked device, or has installed
malware with root/administrator privileges, no software wallet can protect
you. Use a hardware wallet for significant amounts.

**Malicious browser extension**
A browser extension with permission to access all pages can read JavaScript
memory and intercept keypresses. Use a dedicated browser profile for Ijma
with no extensions installed, or use the hardware wallet flow for large
transactions.

**Supply chain attack on npm dependencies**
We publish a full dependency manifest in `LIBRARIES.md` and run automated
`npm audit` and OSV Scanner checks in CI. However, a sufficiently sophisticated
attack against a widely-used npm package could compromise the build. Monitor
our [releases](https://github.com/amisatoshi/ijmawallet/releases) for integrity
hashes of production builds.

**Social engineering / phishing**
Ijma will never ask for your seed phrase via email, Discord, Telegram, or
any external website. The only legitimate interface is `ijmawallet.com/app/`.
Verify the URL and the HTTPS certificate before entering any credentials.

**Cashu mint insolvency or theft**
Cashu tokens are IOUs from the mint operator. If a mint disappears, tokens
held there are lost. Ijma displays trust scores and warns users to use only
mints they trust. Use Cashu only for small daily spending amounts.

**Fedimint guardian collusion**
Fedimint requires a threshold of guardians to collude to steal funds. Ijma
surfaces guardian information and web-of-trust scores to help users choose
trustworthy federations.

### Security tiering for transactions

Ijma enforces different authentication requirements based on transaction value:

| Amount (GBP equiv.) | Required authentication |
|--------------------|------------------------|
| < £100 | Biometric only |
| £100 – £1,000 | Biometric + PIN |
| £1,000 – £10,000 | Biometric + MFA |
| > £10,000 | Hardware wallet required |

These thresholds are user-configurable.

---

## Secure development practices

- All cryptographic operations use the Web Crypto API, not JavaScript libraries
- Seed phrases are generated using `crypto.getRandomValues()` (OS CSPRNG)
- No `eval()`, `new Function()`, or dynamic code execution anywhere
- Content Security Policy blocks all inline scripts and untrusted sources
- `npm audit` runs on every CI build; high/critical vulnerabilities block merge
- Dependencies are pinned in `package-lock.json`; `npm ci` is used in CI
- Source maps are disabled in production builds
- GitHub branch protection requires passing CI before merge to `main`

---

## Known limitations (not vulnerabilities)

These are architectural trade-offs that users should be aware of:

1. **IndexedDB vs Secure Enclave** — Seed phrases are protected by AES-256-GCM
   but not stored in the device's hardware Secure Enclave (which requires a
   native app). This is the primary reason hardware wallets are recommended for
   significant amounts.

2. **WebAuthn as second factor** — Biometric authentication touches the Secure
   Enclave but does not store the seed phrase inside it. Biometrics verify
   identity; the vault decryption key is still the PIN-derived AES key.

3. **No background Lightning** — As a PWA, Ijma cannot run a Lightning node
   in the background on iOS when the browser is closed. This is an iOS
   restriction, not a security issue. Resolved in the native app roadmap.

4. **Cashu proofs are bearer instruments** — Like physical cash, anyone who
   possesses the proof can spend it. Back up your Cashu proofs regularly.

---

*Security is a journey, not a destination. We are committed to continuous
improvement and transparent disclosure.*

Maintainer: [@amisatoshi](https://github.com/amisatoshi)  
Security contact: ijma@blockchainology.co.uk
