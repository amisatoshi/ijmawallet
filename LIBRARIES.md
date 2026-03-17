# Ijma Wallet — Open Source Library Audit
# Complete dependency registry, repositories, and security verification

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 1 — RUNTIME DEPENDENCIES (shipped to users)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[react]
version       = ^18.3.1
purpose       = UI framework — component tree, state, rendering
repo          = https://github.com/facebook/react
npm           = https://www.npmjs.com/package/react
maintainer    = Meta Open Source
licence       = MIT
used_for      = All UI components, hooks, context API
critical      = YES — entire UI depends on this
security_notes = Extremely well-audited. Meta security team + global community.
                 No cryptographic operations. Low attack surface for a wallet.

[react-dom]
version       = ^18.3.1
purpose       = React renderer for the browser DOM
repo          = https://github.com/facebook/react
npm           = https://www.npmjs.com/package/react-dom
maintainer    = Meta Open Source
licence       = MIT
used_for      = ReactDOM.createRoot() in main.jsx
critical      = YES
security_notes = Same codebase and team as react. See above.

[nostr-tools]
version       = ^2.7.2
purpose       = Nostr protocol — keypair generation, event signing, relay pool,
                NIP-04 encrypted DMs, NIP-19 encoding (npub/nsec), NIP-57 zaps
repo          = https://github.com/nbd-wtf/nostr-tools
npm           = https://www.npmjs.com/package/nostr-tools
maintainer    = fiatjaf (core Nostr protocol developer)
licence       = MIT (public domain)
used_for      = src/lib/nostr.js — all Nostr operations
critical      = YES — handles Nostr private keys
security_notes = Internally uses @noble/curves and @noble/hashes (audited).
                 fiatjaf is a core Nostr protocol author — high trust.
                 Active security disclosures handled via GitHub.

[@nostr-dev-kit/ndk]
version       = ^2.11.0
purpose       = Higher-level Nostr Dev Kit — relay management, event caching,
                subscription lifecycle
repo          = https://github.com/nostr-dev-kit/ndk
npm           = https://www.npmjs.com/package/@nostr-dev-kit/ndk
maintainer    = pablof7z (Nostr ecosystem developer)
licence       = MIT
used_for      = Relay pool management, event subscriptions
critical      = MEDIUM — no key operations, only relay comms
security_notes = Newer library, less audited than nostr-tools.
                 Treat relay responses as untrusted input always.
                 Does not touch private keys.

[@cashu/cashu-ts]
version       = ^2.2.0
purpose       = Cashu ecash protocol — mint/melt/send/receive,
                Chaumian blind signatures, proof management, BOLT11 invoices
repo          = https://github.com/cashubtc/cashu-ts
npm           = https://www.npmjs.com/package/@cashu/cashu-ts
maintainer    = cashubtc organisation (Calle, thesimplekid, others)
licence       = MIT
used_for      = src/lib/cashu.js — all ecash operations
critical      = YES — handles ecash proofs (= money)
security_notes = Implements Cashu protocol spec (github.com/cashubtc/nuts).
                 Calle (lead dev) is a well-known Lightning/ecash developer.
                 Library audited informally by community; formal audit pending.
                 IMPORTANT: Proofs are bearer instruments — loss = loss of funds.
                 Watch: https://github.com/cashubtc/cashu-ts/security/advisories

[bip39]
version       = ^3.1.0
purpose       = BIP39 mnemonic generation and validation (legacy package)
repo          = https://github.com/bitcoinjs/BIP39
npm           = https://www.npmjs.com/package/bip39
maintainer    = bitcoinjs organisation
licence       = ISC
used_for      = Listed in package.json; primary mnemonic operations
                delegated to @scure/bip39 in lib/bitcoin.js
critical      = YES — seed phrase derivation
security_notes = Mature library, part of bitcoinjs-lib ecosystem.
                 Uses crypto.getRandomValues() for entropy.
                 RECOMMENDATION: Prefer @scure/bip39 (audited by Trail of Bits).

[bitcoinjs-lib]
version       = ^6.1.7
purpose       = Bitcoin transaction construction, PSBT building,
                address encoding, script operations
repo          = https://github.com/bitcoinjs/bitcoinjs-lib
npm           = https://www.npmjs.com/package/bitcoinjs-lib
maintainer    = bitcoinjs organisation (junderw, bitcoinjs team)
licence       = MIT
used_for      = PSBT construction in hardware.js (Phase 2)
critical      = YES — transaction construction
security_notes = The most widely used JS Bitcoin library. Extensive test suite.
                 Used in production by BlueWallet, Electrum web, many others.
                 Regular security reviews. GitHub security advisories monitored.

[ecpair]
version       = ^2.1.0
purpose       = Bitcoin key pair utilities (companion to bitcoinjs-lib)
repo          = https://github.com/bitcoinjs/ecpair
npm           = https://www.npmjs.com/package/ecpair
maintainer    = bitcoinjs organisation
licence       = MIT
used_for      = Key pair operations for PSBT signing
critical      = YES — handles private keys
security_notes = Slim wrapper around tiny-secp256k1. See below.

[tiny-secp256k1]
version       = ^2.2.3
purpose       = secp256k1 elliptic curve operations (WASM-accelerated)
repo          = https://github.com/bitcoinjs/tiny-secp256k1
npm           = https://www.npmjs.com/package/tiny-secp256k1
maintainer    = bitcoinjs organisation (junderw)
licence       = MIT
used_for      = Bitcoin signature generation and verification
critical      = CRITICAL — core cryptographic primitive
security_notes = Rust implementation compiled to WASM.
                 Verified against Bitcoin's test vectors.
                 WASM binary can be independently built from source.
                 Audit: compare WASM binary hash to CI-built artifacts.

[noble-secp256k1]
version       = ^1.2.14
purpose       = Pure-JS secp256k1 (fallback / alternative)
repo          = https://github.com/paulmillr/noble-secp256k1
npm           = https://www.npmjs.com/package/noble-secp256k1
maintainer    = Paul Miller (paulmillr)
licence       = MIT
used_for      = Cryptographic operations in nostr.js
critical      = CRITICAL — cryptographic primitive
security_notes = AUDITED by Cure53 (2022).
                 Audit report: https://cure53.de/pentest-report_noble-lib.pdf
                 Pure JS — no WASM, no native bindings, easily auditable.
                 Paul Miller is a respected cryptography library author.

[@noble/hashes]
version       = ^1.6.1
purpose       = Hash functions: SHA-256, SHA-512, RIPEMD-160, HMAC, PBKDF2, HKDF
repo          = https://github.com/paulmillr/noble-hashes
npm           = https://www.npmjs.com/package/@noble/hashes
maintainer    = Paul Miller (paulmillr)
licence       = MIT
used_for      = PBKDF2 key derivation, SHA-256 hashing throughout
critical      = CRITICAL — used in key derivation
security_notes = AUDITED by Cure53 (2022) — same audit as noble-secp256k1.
                 Audit report: https://cure53.de/pentest-report_noble-lib.pdf
                 Zero dependencies. Pure JS. Constant-time operations.

[@scure/bip32]
version       = ^1.6.2
purpose       = BIP32 HD wallet key derivation
repo          = https://github.com/paulmillr/scure-bip32
npm           = https://www.npmjs.com/package/@scure/bip32
maintainer    = Paul Miller (paulmillr)
licence       = MIT
used_for      = HD key derivation in bitcoin.js and nostr.js
critical      = YES — derives all child keys from master seed
security_notes = AUDITED by Cure53. Uses @noble/hashes internally.
                 Audit report: https://cure53.de/pentest-report_scure-btc-signer.pdf
                 Minimal codebase (~400 lines). Easy to read and verify.

[@scure/bip39]
version       = ^1.5.4
purpose       = BIP39 mnemonic generation and seed derivation
repo          = https://github.com/paulmillr/scure-bip39
npm           = https://www.npmjs.com/package/@scure/bip39
maintainer    = Paul Miller (paulmillr)
licence       = MIT
used_for      = Mnemonic generation and validation in bitcoin.js
critical      = CRITICAL — generates the master secret
security_notes = AUDITED by Cure53. Includes full BIP39 wordlist.
                 Uses crypto.getRandomValues() for entropy (OS-level CSPRNG).
                 Audit: https://cure53.de/pentest-report_scure-btc-signer.pdf
                 STRONGLY PREFERRED over legacy bip39 package.

[idb]
version       = ^8.0.1
purpose       = IndexedDB wrapper — used for encrypted vault storage
repo          = https://github.com/jakearchibald/idb
npm           = https://www.npmjs.com/package/idb
maintainer    = Jake Archibald (Google Chrome team)
licence       = ISC
used_for      = Async IndexedDB operations in security.js
critical      = MEDIUM — wraps storage, not crypto
security_notes = Thin wrapper, no cryptography. The security comes from AES-256-GCM
                 applied before data touches the database.
                 Jake Archibald is a well-known web standards contributor.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 2 — DEVELOPMENT DEPENDENCIES (not shipped to users)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[@vitejs/plugin-react]
version       = ^4.3.4
purpose       = Vite plugin — JSX transform, React Fast Refresh
repo          = https://github.com/vitejs/vite-plugin-react
npm           = https://www.npmjs.com/package/@vitejs/plugin-react
maintainer    = Vite team (Evan You + community)
licence       = MIT
used_for      = Build-time JSX compilation only
critical      = NO — dev/build tool only

[vite]
version       = ^6.2.0
purpose       = Build tool and dev server
repo          = https://github.com/vitejs/vite
npm           = https://www.npmjs.com/package/vite
maintainer    = Evan You + Vite team
licence       = MIT
used_for      = npm run dev, npm run build
critical      = NO — not in production bundle
security_notes = Supply chain risk: if vite is compromised, build output could be
                 tampered. Pin exact version in package-lock.json.
                 Run: npm ci (uses lockfile) not npm install.

[vite-plugin-pwa]
version       = ^0.21.1
purpose       = Generates service worker and PWA manifest
repo          = https://github.com/vite-pwa/vite-plugin-pwa
npm           = https://www.npmjs.com/package/vite-plugin-pwa
maintainer    = antfu + vite-pwa organisation
licence       = MIT
used_for      = Service worker generation, offline support, install prompt
critical      = LOW — affects caching behaviour

[workbox-window]
version       = ^7.3.0
purpose       = Service worker registration and lifecycle management
repo          = https://github.com/GoogleChrome/workbox
npm           = https://www.npmjs.com/package/workbox-window
maintainer    = Google Chrome team
licence       = MIT
used_for      = PWA service worker
critical      = LOW

[eslint]
version       = ^9.19.0
purpose       = Static code analysis
repo          = https://github.com/eslint/eslint
npm           = https://www.npmjs.com/package/eslint
maintainer    = ESLint team (OpenJS Foundation)
licence       = MIT
used_for      = npm run lint
critical      = NO — dev tool

[vitest]
version       = ^3.0.9
purpose       = Unit testing framework
repo          = https://github.com/vitest-dev/vitest
npm           = https://www.npmjs.com/package/vitest
maintainer    = antfu + vitest team
licence       = MIT
used_for      = npm run test
critical      = NO — dev tool

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 3 — PHASE 2 LIBRARIES (planned, not yet installed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[@breeztech/breez-sdk-liquid]
purpose       = Embedded non-custodial Lightning node (Liquid variant)
repo          = https://github.com/breez/breez-sdk-go (Go) /
                https://github.com/breez/breez-sdk (Rust core)
npm           = https://www.npmjs.com/package/@breeztech/breez-sdk-liquid
maintainer    = Breez Technology
licence       = MIT
install       = npm install @breeztech/breez-sdk-liquid
security_notes = Rust core compiled to WASM. Open source. Used in production
                 by Breez wallet and other apps.

[qrcode.react]
purpose       = QR code generation for receive addresses
repo          = https://github.com/zpao/qrcode.react
npm           = https://www.npmjs.com/package/qrcode.react
maintainer    = zpao
licence       = ISC
install       = npm install qrcode.react
security_notes = No cryptography. Renders QR SVG/canvas. Low risk.

[@ledgerhq/hw-transport-webhid]
purpose       = Ledger hardware wallet WebHID transport
repo          = https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs
npm           = https://www.npmjs.com/package/@ledgerhq/hw-transport-webhid
maintainer    = Ledger (closed-source device firmware, open-source JS libs)
licence       = Apache-2.0
install       = npm install @ledgerhq/hw-transport-webhid @ledgerhq/hw-app-btc
security_notes = Browser-side only. Private keys stay on device.
                 Large dependency tree — audit transitive deps.

[@trezor/connect-web]
purpose       = Trezor hardware wallet signing
repo          = https://github.com/trezor/trezor-suite
npm           = https://www.npmjs.com/package/@trezor/connect-web
maintainer    = SatoshiLabs (Trezor)
licence       = Apache-2.0
install       = npm install @trezor/connect-web
security_notes = Loads iframe from connect.trezor.io by default.
                 IMPORTANT: For maximum security, self-host the Trezor Connect
                 bridge. See: https://github.com/trezor/connect

[bc-ur]
purpose       = BC-UR encoding for animated QR PSBT signing
                (SeedSigner, Krux, Passport, Coldcard)
repo          = https://github.com/BlockchainCommons/bc-ur
npm           = https://www.npmjs.com/package/bc-ur
maintainer    = Blockchain Commons
licence       = BSD-2-Clause
install       = npm install bc-ur
security_notes = Encoding only — no private key operations. Low risk.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 4 — SECURITY VERIFICATION PROCEDURES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[step_1_audit_npm_for_known_vulns]
command       = npm audit
explanation   = Checks every installed package against the npm advisory database.
                Returns CVE IDs, severity (low/moderate/high/critical), and fix commands.

command_fix   = npm audit fix
explanation   = Auto-fixes vulnerabilities where a non-breaking upgrade exists.

command_force = npm audit fix --force
warning       = May introduce breaking changes. Review diff carefully.

command_json  = npm audit --json > audit-report.json
explanation   = Machine-readable output for CI pipelines.

[step_2_check_package_integrity]
explanation   = npm uses SHA-512 checksums in package-lock.json.
                Every installed package is verified against its published hash.

verify_lock   = cat package-lock.json | grep -A2 '"resolved"'
explanation   = Shows the exact tarball URL and integrity hash for every dep.

verify_specific = node -e "
  const lock = require('./package-lock.json');
  const pkg = lock.packages['node_modules/@noble/hashes'];
  console.log('version:', pkg.version);
  console.log('integrity:', pkg.integrity);
  console.log('resolved:', pkg.resolved);
"

check_hash    = npm pack @noble/hashes@1.6.1 --dry-run
explanation   = Downloads the package and shows the computed hash without installing.

[step_3_verify_signatures_on_npm]
explanation   = npm supports provenance attestations (since 2023).
                Packages published with provenance link to the exact git commit
                and CI run that produced them.

command       = npm view @noble/hashes dist-tags
command       = npm view @noble/hashes@1.6.1 dist.integrity
command       = npm view @noble/hashes@1.6.1 dist.attestations

provenance_check = npx sigstore verify-npm @noble/hashes@1.6.1
explanation   = Verifies the Sigstore/SLSA provenance attestation if present.

packages_with_provenance:
  - @noble/hashes      (Paul Miller publishes with provenance)
  - @noble/secp256k1   (Paul Miller publishes with provenance)
  - @scure/bip32       (Paul Miller publishes with provenance)
  - @scure/bip39       (Paul Miller publishes with provenance)

[step_4_cross_check_git_tags]
explanation   = Compare the published npm version to the git tag on GitHub.
                A mismatch indicates a potentially tampered package.

example_noble_hashes:
  1. npm view @noble/hashes@1.6.1 gitHead
     # Returns the git commit hash that was published

  2. Visit: https://github.com/paulmillr/noble-hashes/releases/tag/1.6.1
     # Verify the commit hash matches

  3. git clone https://github.com/paulmillr/noble-hashes.git
     git checkout 1.6.1
     npm install && npm run build
     # Build the package yourself and compare output

[step_5_subresource_integrity_for_cdn_deps]
explanation   = If any library is loaded from a CDN (we avoid this in Ijma —
                everything is bundled), use SRI hashes in the HTML.

example       = <script src="https://cdn.example.com/lib.js"
                  integrity="sha384-XXXX"
                  crossorigin="anonymous"></script>

generate_sri  = openssl dgst -sha384 -binary lib.js | openssl base64 -A

[step_6_audit_transitive_dependencies]
explanation   = Your deps have deps. The full tree is what ships.

list_all      = npm list --all
list_prod     = npm list --omit=dev
count_pkgs    = npm list --all 2>/dev/null | wc -l

deep_audit    = npx better-npm-audit audit
explanation   = More detailed than npm audit — shows full dep paths.

snyk_scan     = npx snyk test
explanation   = Snyk has a larger vulnerability database than npm audit.
                Free tier available. Sign up at snyk.io.

[step_7_check_for_typosquatting]
explanation   = Attackers publish packages with names 1 character off from popular ones.
                Always copy package names directly from official documentation.

known_fakes_to_avoid:
  FAKE: nostr-tool        (missing 's')
  REAL: nostr-tools

  FAKE: cashu             (no organisation scope)
  REAL: @cashu/cashu-ts

  FAKE: noble-hash        (missing 's')
  REAL: @noble/hashes

  FAKE: scure-bip39       (missing '@' scope)
  REAL: @scure/bip39

verify_maintainer = npm view nostr-tools maintainers
                    npm view @noble/hashes maintainers
explanation   = Check the maintainer email/username matches the known author.

[step_8_check_for_malicious_install_scripts]
explanation   = Some malicious packages run code during npm install via
                preinstall/postinstall scripts.

check_scripts = npm view PACKAGE_NAME scripts
example       = npm view @cashu/cashu-ts scripts
               # Legitimate packages rarely need postinstall scripts
               # Exception: WASM compilation (tiny-secp256k1)

list_packages_with_scripts:
  = node -e "
    const lock = require('./package-lock.json');
    Object.entries(lock.packages).forEach(([name, pkg]) => {
      if (pkg.scripts) console.log(name, Object.keys(pkg.scripts));
    });
  "

flag_suspicious = Any postinstall script that:
  - Makes network requests (wget, curl, fetch)
  - Accesses environment variables (process.env)
  - Reads files outside node_modules
  - Uses eval() or Function()

[step_9_runtime_csp_headers]
explanation   = Content Security Policy prevents injected scripts from running,
                even if a supply chain attack succeeds in modifying HTML.

recommended_csp:
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval';
    connect-src 'self'
      https://mempool.space
      https://api.coingecko.com
      https://api.boltz.exchange
      wss://relay.damus.io
      wss://relay.nostr.band
      wss://nos.lol
      wss://relay.primal.net
      https://mint.minibits.cash
      https://legend.lnbits.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' https://fonts.gstatic.com;
    manifest-src 'self';
    worker-src 'self';
    frame-src 'none';
    object-src 'none';
    base-uri 'self';

wasm_note     = 'wasm-unsafe-eval' is required for tiny-secp256k1 (WASM).
                This is unavoidable for Bitcoin secp256k1 performance.

[step_10_lockfile_integrity]
explanation   = Commit package-lock.json to git. Never use --no-package-lock.
                Use 'npm ci' in CI/CD — it ONLY installs what's in the lockfile.

command_ci    = npm ci
vs_install    = npm install  ← DO NOT use in CI — ignores lockfile

check_lockfile_tampering:
  git diff package-lock.json
  # Any unexpected changes to integrity hashes = security incident

[step_11_sbom_generation]
explanation   = Software Bill of Materials — a machine-readable inventory of
                every component in your build.

generate_sbom = npx @cyclonedx/cyclonedx-npm --output-file sbom.json
               # CycloneDX format — accepted by most security scanners

generate_spdx = npx spdx-sbom-generator
               # SPDX format — ISO/IEC 5962 standard

publish_sbom  = Include sbom.json in GitHub releases.
               Allows users to independently audit your dependencies.

[step_12_monitor_ongoing_advisories]
explanation   = New vulnerabilities are discovered continuously.
                Set up automated monitoring.

github_dependabot:
  # Add to .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: npm
      directory: /
      schedule:
        interval: weekly
      open-pull-requests-limit: 10
      reviewers:
        - YOUR_USERNAME

github_advisory_watch:
  - https://github.com/advisories?query=ecosystem%3Anpm+nostr-tools
  - https://github.com/advisories?query=ecosystem%3Anpm+cashu
  - https://github.com/advisories?query=ecosystem%3Anpm+bitcoinjs-lib

osv_scanner   = npx @google/osv-scanner scan --lockfile package-lock.json
explanation   = Google's Open Source Vulnerability scanner.
               Free. Checks against OSV database (larger than npm advisory DB).

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 5 — FORMAL SECURITY AUDITS BY THIRD PARTIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[audited_libraries]

@noble/hashes + @noble/secp256k1 + @scure/bip32 + @scure/bip39:
  auditor   = Cure53 (Berlin, Germany)
  date      = January 2022
  scope     = noble-secp256k1, noble-ed25519, scure-bip32, scure-bip39
  result    = No critical findings. Minor informational notes only.
  report    = https://cure53.de/pentest-report_noble-lib.pdf
  paid_by   = Paul Miller (out of pocket)

nostr-tools:
  auditor   = Informal community review; no formal third-party audit yet
  status    = Audit recommended before v1.0 production use

@cashu/cashu-ts:
  auditor   = Informal community review; no formal audit yet
  status    = Cashu protocol spec (NUTs) reviewed by community
  note      = Treat Cashu tokens as cash — loss = permanent

bitcoinjs-lib:
  auditor   = Multiple informal reviews; no single formal audit
  status    = Extremely widely deployed (millions of users). Any
              vulnerability would have been exploited by now.
  cves      = Search: https://www.cvedetails.com/vendor/bitcoinjs

tiny-secp256k1 (WASM):
  auditor   = Bitcoin cryptography review by bitcoinjs community
  wasm_verify = Build from source:
                git clone https://github.com/bitcoinjs/tiny-secp256k1
                npm install && npm run build
                sha256sum lib/secp256k1.wasm
                # Compare to published package hash

[unaudited_critical_libraries]
warning   = The following handle money or keys but lack formal audits.
            Use with caution for significant amounts.

  - nostr-tools        → Nostr private keys
  - @cashu/cashu-ts    → Ecash proofs (= money)
  - @nostr-dev-kit/ndk → Relay communication

recommendation = Do not store more than you can afford to lose until
                 these libraries have undergone formal professional audits.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 6 — INTERNAL CODE (no external library)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[web_crypto_api]
name          = Web Crypto API
type          = Browser built-in — NOT a library
spec          = https://www.w3.org/TR/WebCryptoAPI/
implementation = Chromium: BoringSSL (Google fork of OpenSSL)
                Firefox: NSS (Network Security Services)
                Safari: Apple's CoreCrypto
used_for      = AES-256-GCM encryption/decryption in security.js
                PBKDF2 key derivation (600k iterations)
                SHA-256 hashing
                crypto.getRandomValues() for secure randomness
security_notes = Hardware-accelerated on all modern devices.
                 Implemented in C/C++ at the OS level — not JavaScript.
                 The most trusted cryptographic implementation available
                 in the browser. Zero external dependencies.
                 This is why Ijma uses Web Crypto for all sensitive operations
                 rather than JavaScript crypto libraries.

[indexeddb]
name          = IndexedDB
type          = Browser built-in storage API
spec          = https://www.w3.org/TR/IndexedDB/
used_for      = Encrypted vault storage (via idb wrapper)
security_notes = Data stored here is NOT encrypted by default.
                 Ijma applies AES-256-GCM (via Web Crypto API) before
                 any data touches IndexedDB.

[webauthn_fido2]
name          = WebAuthn / FIDO2
type          = Browser built-in authentication API
spec          = https://www.w3.org/TR/webauthn-2/
used_for      = Biometric authentication in security.js
security_notes = Private keys are generated inside the secure enclave/TPM.
                 They never leave hardware. Phishing-resistant by design.
                 Implemented in the OS, not JavaScript.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 7 — QUICK REFERENCE COMMANDS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Run all security checks in one pass:
daily_check = |
  npm audit                                              # Known CVEs
  npx better-npm-audit audit                             # Enhanced audit
  npx @google/osv-scanner scan --lockfile package-lock.json  # OSV database
  npx snyk test                                          # Snyk database
  npx @cyclonedx/cyclonedx-npm --output-file sbom.json  # Generate SBOM
  echo "--- Done ---"

# Verify a specific package maintainer:
verify_maintainer = |
  npm view @noble/hashes maintainers
  npm view @scure/bip39 maintainers
  npm view nostr-tools maintainers
  npm view @cashu/cashu-ts maintainers

# Check exact versions installed (what actually shipped):
exact_versions = |
  npm list --depth=0
  cat package-lock.json | python3 -m json.tool | grep '"version"' | sort | uniq

# Diff your lockfile against a known-good state:
lockfile_diff = |
  git stash
  npm ci
  git diff package-lock.json
