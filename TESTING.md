# Ijma Wallet — Tester's Guide

**Version:** v0.3.0  
**Live app:** https://www.ijmawallet.com/app/  
**Repo:** https://github.com/amisatoshi/ijmawallet

> ⚠️ **v0.3.0 is pre-audit. Do not store significant funds.**

---

## Contents

1. [Getting Started](#1-getting-started)
2. [On-Chain Bitcoin](#2-on-chain-bitcoin)
3. [Lightning Network](#3-lightning-network)
4. [Atomic Swaps](#4-atomic-swaps)
5. [Cashu Ecash](#5-cashu-ecash)
6. [Fedimint](#6-fedimint)
7. [Nostr Identity](#7-nostr-identity)
8. [Shariah Mode](#8-shariah-mode)
9. [Seed Phrase Backup](#9-seed-phrase-backup)
10. [Hardware Wallets](#10-hardware-wallets)
11. [Advanced View](#11-advanced-view)
12. [Feature Status Summary](#12-feature-status-summary)

---

## 1. Getting Started

### 1.1 Installing the PWA

Ijma is a Progressive Web App — no app store required.

- **iOS (Safari):** Tap the Share button → Add to Home Screen → Add
- **Android (Chrome):** Tap the three-dot menu → Add to Home screen → Install

Once installed, open from your home screen. The app runs in standalone mode with no browser chrome.

### 1.2 Creating a new wallet

1. Tap **Create New Wallet** on the welcome screen.
2. Your 24-word BIP39 recovery phrase is shown. Write every word down in order on paper — never in a notes app or screenshot.
3. Tap each word tile to reveal it. Once all 24 are revealed the Continue button appears.
4. You are asked to verify 3 random words. Type them in — autocomplete suggestions appear after 2 letters.
5. Create a 6-digit PIN. This encrypts your vault using AES-256-GCM with PBKDF2 at 600,000 iterations.
6. Optionally add a username (used for your Lightning address format).
7. The wallet is ready — you land on the Home screen.

### 1.3 Restoring an existing wallet

1. Tap **Restore Existing Wallet**.
2. Choose **12** or **24 words** using the toggle at the top.
3. Type each word into the numbered grid. Suggestions appear after 2 letters — tap a suggestion to fill the word. You can also paste your full phrase into the first field and it distributes automatically across all cells.
4. Once all words are filled and validated, continue to set your PIN.

---

## 2. On-Chain Bitcoin

### What works in v0.3.0

| Feature | Status |
|---|---|
| BIP39/84/86 key derivation | ✅ Real cryptography from your seed |
| Address generation (bc1q SegWit, bc1p Taproot) | ✅ Working |
| Address display with colour-coded checksum | ✅ Working |
| QR code on Receive screen | ✅ Working |
| Copy and Share address | ✅ Working |
| **Send broadcast** | ⚠️ UI complete — stub only, no sats move |
| Balance fetch | ⚠️ Needs Electrum server configured |
| Transaction history | ❌ Not yet fetched |

### 2.1 Receiving on-chain Bitcoin

1. Tap the **Receive** tab.
2. Select **On-chain** from the type tabs.
3. Your `bc1q` address is shown with a live QR code. The first and last 5 characters are highlighted in orange — these are the checksum characters to verify when sharing an address.
4. Tap **Copy** or **Share**.
5. Send a small amount from any external Bitcoin wallet.

> **Note:** The in-app balance will not update until an Electrum server is configured in Settings → Advanced Settings → Block Explorers.

### 2.2 Sending on-chain Bitcoin

> **Current status:** The Send flow is UI-complete but the broadcast step uses a simulated delay. No transaction is submitted to the network.

1. Tap the **Send** tab.
2. Select **On-chain** as the layer.
3. Enter a valid `bc1q` or `bc1p` destination address.
4. Enter an amount in sats.
5. Tap **Continue → Review**. The confirm screen shows the address with colour-highlighted checksum characters, fee estimate, and a Shariah compliance badge if Shariah Mode is on.
6. Tap **Confirm & Send**. Success state appears after 1.5 seconds (simulated).

---

## 3. Lightning Network

### What works in v0.3.0

| Feature | Status |
|---|---|
| NWC connection string validation | ✅ Real |
| Lightning address display with colour coding | ✅ Working |
| Zap (NIP-57) request construction | ✅ Real signing |
| **Actual payment execution** | ⚠️ Stub — no sats move yet |
| Invoice generation (BOLT11) | ⚠️ Not yet wired to backend |
| Balance fetch from node | ⚠️ Not yet wired |

### 3.1 Connecting a Lightning backend

Lightning requires an external node connection. The easiest path for testing is **NWC (Nostr Wallet Connect)**.

#### Option A — NWC via Alby *(recommended)*

1. Create a free account at [getalby.com](https://getalby.com)
2. Go to Settings → Wallet → Nostr Wallet Connect
3. Click **Create Connection** and copy the `nostr+walletconnect://` string
4. In Ijma: Settings → Advanced Settings → Lightning Node → select **Nostr Wallet Connect (NWC)**
5. Paste your connection string. The app validates it and shows the relay URL.

#### Option B — NWC via Mutiny Wallet

1. Download [Mutiny Wallet](https://mutinywallet.com) (browser or mobile)
2. Go to Settings → Connections → Add Connection
3. Copy the `nostr+walletconnect://` string and paste into Ijma as above

#### Option C — Your own LND or CLN node

In Advanced Settings select **LND (REST API)** or **Core Lightning (REST)**. Enter your node URL and macaroon/rune. Suitable for Umbrel, RaspiBlitz, or Start9 operators.

#### Option D — LNbits

Use [legend.lnbits.com](https://legend.lnbits.com) (public) or self-hosted. In Advanced Settings select **LNbits** and enter the URL and your Admin API key.

### 3.2 Receiving a Lightning payment

1. Tap **Receive** → select the **Lightning** tab.
2. Your Lightning address (`username@ijma.app` format) is shown with QR.

> **Note:** BOLT11 invoice generation requires a connected backend and is not yet wired in v0.3.0. Use your Lightning address for receives.

### 3.3 Sending a Lightning payment

1. Tap **Send** → select **Lightning**.
2. Enter a Lightning address (`user@domain`), BOLT11 invoice, or Nostr npub.
3. BOLT11 invoices are colour-coded: network prefix in grey, embedded amount in purple, key verification sections in orange.
4. Enter amount, review, tap **Confirm & Send**.

> **Current behaviour:** The app simulates success after 1.5 seconds. Actual execution active in v0.4.0.

---

## 4. Atomic Swaps

The **Swap** tab (⇄) allows cross-layer exchanges. Seven routes are available.

| Route | Provider | Status |
|---|---|---|
| On-chain → Lightning | Boltz HTLC | ⚠️ UI complete, stub |
| Lightning → On-chain | Boltz reverse submarine | ⚠️ UI complete, stub |
| Lightning → Cashu | Cashu mint | ⚠️ UI complete, stub |
| Cashu → Lightning | Cashu melt | ⚠️ UI complete, stub |
| Lightning → Fedimint | Fedimint gateway | ⚠️ UI complete, stub |
| Fedimint → Lightning | Fedimint gateway | ⚠️ UI complete, stub |
| Cashu → Cashu (cross-mint) | Lightning bridge | ⚠️ UI complete, stub |

When **Shariah Mode** is on, each route shows a compliance note: trustless HTLC routes are flagged as minimal gharar; trusted routes (Cashu mint, Fedimint) show a warning to verify the operator before proceeding.

---

## 5. Cashu Ecash

### What is Cashu?

Cashu is a Chaumian ecash protocol built on Bitcoin. Tokens are bearer instruments — offline capable, untraceable by the mint, and transfer instantly with no fees. The mint cannot link payments to individual users.

### External services needed

You need a Cashu mint. The following are pre-configured in the app:

| Mint | URL |
|---|---|
| Minibits | `mint.minibits.cash/Bitcoin` |
| LNbits Legend | `legend.lnbits.com/cashu/api/v1/...` |

You can add any public mint from [bitcoinmints.com](https://bitcoinmints.com) by pasting the URL into the Ecash screen.

### Status in v0.3.0

The `@cashu/cashu-ts` library is fully integrated in `src/lib/cashu.js` with real functions for `connectMint()`, `requestMint()`, `sendCashu()`, `receiveCashu()`, and encrypted proof storage in IndexedDB. However, the Ecash screen UI is not yet wired to call these functions:

| | Status |
|---|---|
| Cashu library (`@cashu/cashu-ts`) | ✅ Integrated and functional |
| Encrypted proof storage (IndexedDB) | ✅ Wired |
| Ecash screen balances | ⚠️ Hardcoded demo values |
| Mint Tokens / Send / Melt buttons | ⚠️ 1-second setTimeout stub |
| Receive Token form | ⚠️ Accepts input, does not call library |

Full UI wiring planned for **v0.4.0**.

### Testing Cashu independently

To verify the underlying library works before the UI is fully wired:

1. Download [Minibits wallet](https://www.minibits.cash) (Android/iOS) or use [cashu.me](https://cashu.me) in a browser
2. Mint some sats into a Cashu token
3. Copy the `cashuA...` token string
4. In Ijma → Ecash screen, paste the token into the **Receive Token** field and tap Receive. A success message appears (currently simulated).

---

## 6. Fedimint

### What is Fedimint?

Fedimint is a federated custody protocol. A group of trusted guardians collectively hold Bitcoin, issuing eCash tokens to federation members. Unlike Cashu (single mint), Fedimint distributes trust across multiple guardians using threshold signatures.

### External services needed

| Service | Notes |
|---|---|
| [Fedi app](https://www.fedi.xyz) | Download from fedi.xyz — includes access to public federations |
| [Mutiny Wallet](https://mutinywallet.com) | Built-in Fedimint federation support |
| Self-hosted | Use [fedimint.org](https://fedimint.org) Docker setup — requires 4 guardian nodes |

### Status in v0.3.0

- Fedimint tab exists on the Ecash screen with UI layout
- No real federation connection — all interactions are demo stubs
- Swap routes (Lightning ↔ Fedimint) are UI-complete but stubbed
- Fedimint WASM client integration planned for **v0.4.0**

---

## 7. Nostr Identity

### 7.1 How your Nostr identity is generated

Ijma derives your Nostr keypair from your Bitcoin seed using **NIP-06**:

- **Derivation path:** `m/44'/1237'/0'/0/0`
- The keypair is deterministic — restoring the same seed always produces the same npub
- Your `npub` (public key) and `nsec` (private key) are shown in **Identity → Passport**
- The `nsec` is stored encrypted in the vault alongside your seed phrase

### 7.2 Using an existing Nostr identity

There is no separate nsec import screen in v0.3.0. Two paths:

**Path A — Your existing Nostr keys came from a NIP-06 wallet**

If your Nostr client uses NIP-06 derivation from a BIP39 seed (Damus on iOS does this, as does Primal in some configurations), your Ijma npub will match automatically. Simply restore the same Bitcoin seed phrase.

**Path B — Your existing Nostr keys were randomly generated**

Most Nostr clients (Primal, Snort, Iris) generate a random nsec that is not derived from a Bitcoin seed. In this case:

- Your Ijma npub will be a different identity from your existing one
- You can use your Ijma npub as a new Nostr identity and build a follow graph from it
- Or continue using your existing client for social Nostr while using Ijma for Bitcoin/Lightning

> **nsec import is planned for v0.4.0.** This will allow you to paste an existing nsec directly.

### 7.3 Will other Nostr users be able to follow you?

Yes — with one caveat. Your npub is a real secp256k1 public key and is valid on the Nostr network. For other users to find and follow you:

1. A **kind:0 profile/metadata event** must be published to the relay network. This is partially wired in v0.3.0 but is not triggered automatically on wallet creation. The Identity → Passport screen lets you view your profile data.
2. Once a profile event is published, anyone can find you by npub on Primal, Damus, Snort, or any Nostr client.
3. Until published, you exist as a valid keypair but not as a discoverable identity.

### 7.4 Default relays

Ijma connects to these five relays by default (hardcoded in `src/lib/nostr.js`):

| Relay | Notes |
|---|---|
| `wss://relay.damus.io` | Popular, high coverage |
| `wss://relay.nostr.band` | Good search indexing |
| `wss://nos.lol` | Community relay |
| `wss://relay.primal.net` | Fast, well-maintained |
| `wss://nostr.mom` | Community relay |

### 7.5 Adding custom relays

**Not available in v0.3.0.** Relays are hardcoded in the `DEFAULT_RELAYS` constant in `src/lib/nostr.js`. A relay configuration screen is planned for **v0.4.0**, where you will be able to add, remove, and reorder relays, and import your relay list from NIP-65 events.

### 7.6 Searching for Nostr users

The **Identity → Web of Trust** tab has a search field. It filters your locally cached contact list by display name or npub. It does not perform a live network query.

To find a specific user:
- Search on [primal.net](https://primal.net) or [nostr.band](https://nostr.band) and copy their npub
- Paste it into the Send screen or Zap field in Ijma

### 7.7 Zaps (NIP-57)

The Zap interface is in the Nostr screen. Enter any npub and a Zap amount.

| Step | Status |
|---|---|
| NIP-57 Zap request construction | ✅ Real — signs correctly |
| LNURL fetch for target invoice | ✅ Wired |
| Final Lightning payment of invoice | ⚠️ 1.2-second stub in v0.3.0 |

Full Zap completion requires a connected Lightning backend (see [Section 3.1](#31-connecting-a-lightning-backend)).

---

## 8. Shariah Mode

Enabled by default. Toggle in **Settings → Shariah**.

| Feature | Effect when ON |
|---|---|
| Send confirm screen | Shows "Shariah compliant · No riba · Peer-to-peer transfer" badge |
| Swap screen | Trustless routes flagged as minimal gharar; trusted routes get a warning |
| Zakat Calculator | Unlocked and functional |
| Sadaqah module | Unlocked — shows 5 verified Bitcoin-accepting Islamic charities |

### Zakat Calculator

Settings → Shariah → Zakat Calculator shows:

- Nisab threshold (85g gold × approximate gold price per gram in GBP)
- Your total wallet wealth in GBP based on live BTC price
- Whether you are above or below nisab
- Zakat due in GBP and sats (2.5% of total if above nisab)

> **Disclaimer shown in-app:** This is a guide only. Nisab fluctuates daily. Consult a qualified Islamic scholar for your specific circumstances.

---

## 9. Seed Phrase Backup

1. Settings → Security → **Seed Phrase Backup**
2. A warning screen appears — read it
3. The 24-word grid loads with all words hidden (••••)
4. Tap each word tile to reveal it, or tap **Reveal all**. The orange progress bar fills as words are revealed.
5. **"Yes, I have written them down"** only appears after all 24 words have been revealed
6. Words are decrypted from the vault using your active session — no PIN re-entry required
7. Words are held in React state only and cleared when you leave the screen

---

## 10. Hardware Wallets

The Hardware tab is UI-complete. All flows require a physical device.

| Device | Connection | Status |
|---|---|---|
| Jade (Blockstream) | WebUSB / WebSerial | ✅ PSBT signing wired |
| Coldcard Mk4 / Q | SD card PSBT (air-gap) | ✅ Wired |
| Passport (Foundation) | QR air-gap / USB | ✅ Wired |
| SeedSigner | QR air-gap | ✅ Wired |
| Krux | QR air-gap | ✅ Wired |
| Ledger (Nano S+ / X / Stax) | WebHID | ✅ Wired — requires browser support |
| Trezor (One / T / Safe 3) | WebUSB | ✅ Wired |

Without a physical device, the connection screen shows the device browser UI but cannot proceed to signing.

---

## 11. Advanced View

Toggle in **Settings → Interface → Advanced View**.

- **Simple (off):** Standard UI — clean and uncluttered
- **Advanced (on):** Adds a fee estimate row on the Send confirm screen (`~N sat/vB · ~N sats`). Home screen badge shows "Pro" in purple.

Both modes show all tabs and features in v0.3.0. Full feature differentiation between modes is planned for a future version.

---

## 12. Feature Status Summary

| Feature | Status |
|---|---|
| Wallet create / restore | ✅ Fully working |
| PIN + AES-256-GCM vault | ✅ Fully working |
| BIP39 autocomplete (restore & verify) | ✅ Fully working |
| Seed phrase backup | ✅ Fully working |
| On-chain address generation | ✅ Fully working |
| Receive QR code | ✅ Fully working |
| Address colour-coded checksum | ✅ Fully working |
| Zakat calculator (live BTC price) | ✅ Fully working |
| Sadaqah module | ✅ Fully working |
| Shariah mode | ✅ Fully working |
| Nostr keypair derivation (NIP-06) | ✅ Real cryptography |
| Nostr relay queries (profile, WoT) | ✅ Real network calls |
| NIP-57 Zap request construction | ✅ Real signing |
| On-chain send broadcast | ⚠️ UI complete — stub only |
| Lightning payments | ⚠️ UI complete — stub only |
| Zap final Lightning payment | ⚠️ UI complete — stub only |
| Cashu library functions | ⚠️ Library real — UI not yet wired |
| Cashu balance display | ⚠️ Demo values only |
| Fedimint | ⚠️ UI demo — no real connection |
| On-chain balance fetch | ⚠️ Needs Electrum server config |
| Custom relay management | ❌ Planned v0.4.0 |
| nsec import | ❌ Planned v0.4.0 |
| Nostr profile auto-publish | ❌ Partially wired, not triggered |
| Breez SDK embedded Lightning | ❌ Planned v0.4.0 |

---

## Feedback & Issues

For questions, feedback, or to report issues:

- **GitHub:** https://github.com/amisatoshi/ijmawallet/issues
- **Web:** https://www.blockchainology.co.uk
- **Nostr:** Search for `amisatoshi` on primal.net (npub18z533j9gxhnlkqukp75wnd5mjv5njqkaj07atslnrk2dp9rxsp0q6650l4)

*Ijma Wallet is MIT licensed. Non-custodial. Open source. Halal.*
