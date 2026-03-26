# Ijma Wallet — Complete Deployment & Developer Guide

**Version:** 0.1.0 | **License:** MIT | **Built by:** Blockchainology

> Sovereign · Private · Halal — Bitcoin · Lightning · Nostr · Ecash

---

*بسم الله الرحمن الرحيم*

*In the name of Allah, the Most Gracious, the Most Merciful.*

*May this project be a sadaqah jariyah — a continuing charity.*

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Prerequisites](#2-prerequisites)
3. [Local Development](#3-local-development)
4. [Security Architecture](#4-security-architecture)
5. [Environment Configuration](#5-environment-configuration)
6. [Build for Production](#6-build-for-production)
7. [Deployment — Hostinger](#7-deployment--hostinger)
8. [Deployment — GitHub Pages](#8-deployment--github-pages)
9. [Deployment — Vercel](#9-deployment--vercel)
10. [Deployment — Self-Hosted VPS](#10-deployment--self-hosted-vps)
11. [GitHub Repository Setup](#11-github-repository-setup)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Connecting Real Lightning](#13-connecting-real-lightning)
14. [Connecting Real Cashu](#14-connecting-real-cashu)
15. [Nostr Integration](#15-nostr-integration)
16. [PWA — Install on Device](#16-pwa--install-on-device)
17. [Security Hardening Checklist](#17-security-hardening-checklist)
18. [Roadmap to Full Production](#18-roadmap-to-full-production)

---

## 1. Project Structure

```
ijmawallet/
├── index.html                    # PWA entry point
├── vite.config.js                # Build + PWA config
├── package.json                  # Dependencies
├── .gitignore
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png           # PWA icons 
│   ├── pwa-512x512.png
│   └── apple-touch-icon.png
└── src/
    ├── main.jsx                  # React root
    ├── App.jsx                   # Router (Loading/Onboarding/Locked/Wallet)
    ├── context/
    │   └── WalletContext.jsx     # Global state + wallet operations
    ├── lib/
    │   ├── security.js           # AES-256-GCM, WebAuthn, IndexedDB vault
    │   ├── nostr.js              # Real Nostr keys, events, zaps, relays
    │   ├── bitcoin.js            # BIP39/32/84/86 derivation, Mempool API
    │   └── cashu.js              # Real Cashu mint/melt/send/receive
    ├── components/
    │   ├── shared.jsx            # Design tokens, Card, Badge, etc.
    │   ├── Onboarding.jsx        # Wallet creation/restore flow
    │   ├── LockScreen.jsx        # PIN + biometric unlock
    │   └── MainWallet.jsx        # Tab shell
    └── screens/
        ├── HomeScreen.jsx        # Portfolio + balances
        ├── AllScreens.jsx        # Send, Receive, Ecash, Nostr, Settings
        ├── SendScreen.jsx        # Re-export
        ├── ReceiveScreen.jsx     # Re-export
        ├── EcashScreen.jsx       # Re-export
        ├── NostrScreen.jsx       # Re-export
        └── SettingsScreen.jsx    # Re-export
```

---

## 2. Prerequisites

Install these on your development machine:

```bash
# Node.js 20+ (LTS)
# macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Windows: download from https://nodejs.org

# Verify
node --version    # should be v20.x.x
npm --version     # should be 10.x.x

# Git
git --version

# Optional: pnpm (faster than npm)
npm install -g pnpm
```

---

## 3. Local Development

### 3.1 Clone and Install

```bash
# Clone your repo (after pushing — see Section 11)
git clone https://github.com/amisatoshi/ijmawallet.git
cd ijmawallet

# Install dependencies
npm install
# or: pnpm install

# This installs:
# - nostr-tools        (Nostr protocol)
# - @cashu/cashu-ts    (Cashu ecash)
# - @scure/bip39       (mnemonic generation)
# - @scure/bip32       (HD key derivation)
# - bitcoinjs-lib      (Bitcoin primitives)
# - vite               (build tool)
# - vite-plugin-pwa    (PWA/service worker)
```

### 3.2 Start Dev Server

```bash
npm run dev
# Opens at http://localhost:5173
```

The app will hot-reload on file changes. Open in Chrome/Safari for best PWA support.

### 3.3 Test on Mobile (same network)

```bash
# Find your local IP
ipconfig getifaddr en0   # macOS
ip addr show             # Linux

# Then open on phone:
# http://192.168.1.x:5173
# (Vite exposes on network by default)
```

### 3.4 HTTPS for local WebAuthn testing

WebAuthn (biometrics) requires HTTPS. Use mkcert:

```bash
# Install mkcert
brew install mkcert           # macOS
# or: https://github.com/FiloSottile/mkcert

mkcert -install
mkcert localhost

# Then in vite.config.js add:
# server: {
#   https: {
#     key: './localhost-key.pem',
#     cert: './localhost.pem',
#   }
# }

npm run dev
# Opens at https://localhost:5173
```

---

## 4. Security Architecture

This is a **non-custodial** wallet. Understanding the security model is critical.

### 4.1 What lives where

| Data | Storage | Encrypted? |
|------|---------|-----------|
| Seed phrase (mnemonic) | IndexedDB | ✅ AES-256-GCM |
| HD root key (in-session) | JavaScript memory | N/A — gone on lock |
| Nostr private key | IndexedDB | ✅ AES-256-GCM |
| Cashu proofs (ecash) | IndexedDB | ✅ AES-256-GCM |
| Wallet metadata (npub, username) | localStorage | ❌ Public info only |
| PIN hash | localStorage | ✅ SHA-256 + salt |
| Biometric credential ID | localStorage | ❌ Not sensitive |

### 4.2 Encryption

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key derivation:** PBKDF2-SHA256, **600,000 iterations** (OWASP 2023)
- **Salt:** 32 random bytes per encryption operation
- **IV:** 12 random bytes per encryption operation
- **Implementation:** Web Crypto API (hardware-accelerated, no JS crypto libs)

### 4.3 Key hierarchy (from single seed)

```
BIP39 Mnemonic (24 words)
│
├─ m/84'/0'/0'     → Bitcoin Native SegWit (P2WPKH)
├─ m/86'/0'/0'     → Bitcoin Taproot (P2TR)
├─ m/44'/1237'/0'  → Nostr identity (NIP-06)
└─ [Lightning]     → LDK derivation (Phase 2)
```

### 4.4 What the server NEVER sees

- Your seed phrase
- Your private keys
- Your transaction history (when using Tor)
- Your balance
- Your Nostr identity (unless you publish)

### 4.5 Session security

- Auto-lock after **5 minutes** of inactivity
- Locking clears all keys from JavaScript memory
- PIN required to decrypt vault on every unlock
- Biometric is a second factor — it does NOT store keys

---

## 5. Environment Configuration

Create a `.env` file in the project root (never commit this):

```bash
# .env — copy this, fill in your values
# NEVER commit .env to git

# Nostr relays (comma-separated)
VITE_NOSTR_RELAYS=wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net

# Mempool.space instance (use your own for max privacy)
VITE_MEMPOOL_API=https://mempool.space/api

# Optional: your own Electrum server
VITE_ELECTRUM_SERVER=

# Network: mainnet or testnet
VITE_NETWORK=mainnet

# Demo mode (shows mock balances, no real txs)
VITE_DEMO_MODE=false

# Analytics: NEVER use Google Analytics. Optional: self-hosted Plausible
VITE_PLAUSIBLE_DOMAIN=
```

Access in code:
```javascript
const network = import.meta.env.VITE_NETWORK
```

---

## 6. Build for Production

```bash
# Build
npm run build
# Output: ./dist/

# Preview the built app locally
npm run preview
# Opens at http://localhost:4173

# Check bundle size
npx vite-bundle-visualizer
```

### 6.1 Expected build output

```
dist/
├── index.html
├── manifest.webmanifest
├── sw.js                          # Service worker (offline support)
├── assets/
│   ├── index-[hash].js            # Main bundle ~300KB
│   ├── nostr-[hash].js            # Nostr chunk ~150KB
│   ├── bitcoin-[hash].js          # Bitcoin chunk ~200KB
│   ├── cashu-[hash].js            # Cashu chunk ~80KB
│   └── index-[hash].css
```

### 6.2 Performance targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse PWA score | > 90 |
| Bundle (gzipped) | < 400KB |

---

## 7. Deployment — Hostinger

Your current host. Best for simplicity.

### 7.1 Manual upload (quick start)

```bash
# 1. Build
npm run build

# 2. The dist/ folder contains everything to upload

# 3. Log into Hostinger hPanel
# 4. Go to: Files → File Manager
# 5. Navigate to: public_html/ (or your domain folder)
# 6. Delete existing files (keep .htaccess if present)
# 7. Upload ALL contents of dist/ (not the folder itself)
# 8. Clear Hostinger CDN cache:
#    Performance → CDN → Purge Cache
```

### 7.2 .htaccess (CRITICAL — add this)

Create `public_html/.htaccess`:

```apache
# Ijma Wallet PWA — /app/ subfolder

# ─── SPA routing (all paths → app's index.html) ───────────
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /app/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /app/index.html [L]
</IfModule>

# ─── Security Headers ──────────────────────────────────────
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

  # CSP for the wallet app — tighter than the landing page
  Header always set Content-Security-Policy "default-src 'self'; \
    script-src 'self' 'wasm-unsafe-eval'; \
    style-src 'self' 'unsafe-inline'; \
    connect-src 'self' https://mempool.space https://api.coingecko.com wss://relay.damus.io wss://relay.nostr.band wss://nos.lol wss://relay.primal.net https://mint.minibits.cash https://legend.lnbits.com; \
    img-src 'self' data: https:; \
    font-src 'self'; \
    manifest-src 'self'; \
    worker-src 'self'"

  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()"
</IfModule>

# ─── Caching ────────────────────────────────────────────────
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html                "access plus 0 seconds"
  ExpiresByType application/javascript   "access plus 1 year"
  ExpiresByType text/css                 "access plus 1 year"
  ExpiresByType image/png                "access plus 1 month"
  ExpiresByType image/svg+xml            "access plus 1 month"
  ExpiresByType application/manifest+json "access plus 1 day"
</IfModule>

# ─── Compression ────────────────────────────────────────────
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/manifest+json
</IfModule>
```

### 7.3 Automated deploy with GitHub Actions → Hostinger FTP

Add this secret in GitHub → Settings → Secrets:
- `HOSTINGER_FTP_HOST` = your FTP host
- `HOSTINGER_FTP_USER` = your FTP username
- `HOSTINGER_FTP_PASS` = your FTP password

Then create `.github/workflows/deploy-hostinger.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_NETWORK: mainnet
          VITE_DEMO_MODE: false

      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASS }}
          local-dir: ./dist/
          server-dir: /public_html/
          exclude: |
            **/.git*
            **/node_modules/**
```

Now every `git push` to `main` auto-deploys. 🚀

---

## 8. Deployment — GitHub Pages

Free hosting, good for demos.

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

npm run deploy
```

Add to `vite.config.js` if hosting at a subpath:
```javascript
export default defineConfig({
  base: '/ijmawallet/',   // your repo name
  // ...
})
```

**Limitation:** No custom `.htaccess` → use a `404.html` redirect trick for SPA routing.

---

## 9. Deployment — Vercel

Excellent for zero-config deploys with HTTPS and edge CDN.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to GitHub repo
# - Framework: Vite
# - Build: npm run build
# - Output: dist

# Production deploy
vercel --prod
```

Add `vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 10. Deployment — Self-Hosted VPS

For maximum sovereignty. Use a VPS (Hetzner, Contabo, DigitalOcean).

### 10.1 Server setup (Ubuntu 24.04)

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Install git
apt install -y git

# Create app user (don't run as root)
adduser ijma --disabled-password
usermod -aG sudo ijma
su - ijma
```

### 10.2 Clone and build

```bash
git clone https://github.com/amisatoshi/ijmawallet.git
cd ijmawallet
npm ci
npm run build
```

### 10.3 Nginx configuration

```nginx
# /etc/nginx/sites-available/yourdomain.com

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL — managed by Certbot
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    root /home/ijma/ijmawallet/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed assets forever
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://mempool.space https://api.coingecko.com wss://relay.damus.io wss://nos.lol wss://relay.primal.net https://mint.minibits.cash; img-src 'self' data: https:; manifest-src 'self'; worker-src 'self'" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;

    # Gzip
    gzip on;
    gzip_types text/html application/javascript text/css application/json application/manifest+json;
    gzip_min_length 1000;
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL certificate (free via Let's Encrypt)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew SSL
systemctl enable certbot.timer
```

---

## 11. GitHub Repository Setup

### 11.1 Create repository

```bash
# On GitHub: create new repo "ijmawallet" (public, MIT license)

# In your project folder:
cd ijmawallet
git init
git add .
git commit -m "feat: Ijma Wallet v0.1.0 — Bitcoin/Lightning/Nostr/Ecash PWA"
git branch -M main
git remote add origin https://github.com/amisatoshi/ijmawallet.git
git push -u origin main
```

### 11.2 Recommended branch strategy

```
main         → production (protected, requires PR)
develop      → integration branch
feature/*    → new features
fix/*        → bug fixes
```

```bash
# Protect main branch on GitHub:
# Settings → Branches → Add rule → main
# ✅ Require pull request reviews
# ✅ Require status checks (CI must pass)
# ✅ Restrict pushes
```

### 11.3 Good README badges

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-blue)](https://yourdomain.com)
[![Bitcoin](https://img.shields.io/badge/Bitcoin-mainnet-orange)](https://yourdomain.com)
[![Nostr](https://img.shields.io/badge/Nostr-integrated-purple)](https://yourdomain.com)
```

---

## 12. CI/CD Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint || true  # non-blocking for now

      - name: Build
        run: npm run build
        env:
          VITE_NETWORK: mainnet
          VITE_DEMO_MODE: true

      - name: Check bundle size
        run: |
          TOTAL=$(du -sh dist/ | cut -f1)
          echo "Bundle size: $TOTAL"

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit
        run: npm audit --audit-level=high
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
```

---

## 13. Connecting Real Lightning

The app currently simulates Lightning balances. To connect real Lightning:

### Option A — Breez SDK (Planned for Phase 2)

Breez SDK provides an embedded Lightning node — no server required.

```bash
npm install @breeztech/breez-sdk-liquid
```

```javascript
// src/lib/lightning.js
import { connect, defaultConfig, EnvironmentType } from '@breeztech/breez-sdk-liquid'

export async function initLightning(mnemonic) {
  const config = defaultConfig(EnvironmentType.Production)
  const sdk = await connect({ config, mnemonic })
  return sdk
}

export async function getLightningBalance(sdk) {
  const info = await sdk.getInfo()
  return info.balanceSat
}

export async function sendLightning(sdk, bolt11) {
  return sdk.sendPayment({ bolt11 })
}

export async function receiveLightning(sdk, amountSats) {
  const { invoice } = await sdk.receivePayment({
    payerAmountSat: amountSats,
    description: 'Ijma Wallet'
  })
  return invoice.bolt11
}
```

### Option B — Nostr Wallet Connect (NWC)

Connect to an existing Lightning wallet (Alby, Mutiny, etc.) via NWC.

```javascript
// User provides their NWC connection string
// Format: nostr+walletconnect://pubkey?relay=wss://...&secret=...

export async function connectNWC(connectionString) {
  // Parse and store connection string
  // Use NWC to send/receive
}
```

### Option C — LNbits (custodial demo)

For demo purposes only — NOT for production funds:

```bash
VITE_LNBITS_URL=https://legend.lnbits.com
VITE_LNBITS_API_KEY=your_api_key_here
```

---

## 14. Connecting Real Cashu

The Cashu library (`@cashu/cashu-ts`) is already integrated in `src/lib/cashu.js`. Wire it up:

```javascript
// In EcashScreen — replace demo with real calls:
import { requestMintInvoice, receiveToken, createSendToken } from '../lib/cashu.js'

// Mint tokens (deposit Lightning → Cashu)
const { invoice, checkMinting } = await requestMintInvoice(
  'https://mint.minibits.cash/Bitcoin',
  amountSats,
  session.password
)
// Show invoice to user → they pay it
// Poll until paid:
const result = await checkMinting()

// Receive a token
await receiveToken(tokenString, session.password)

// Send a token
const token = await createSendToken(mintUrl, amountSats, session.password)
// Share token via QR, NFC, or Nostr DM
```

### Adding a QR code library

```bash
npm install qrcode.react
```

```jsx
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG
  value={address}
  size={180}
  bgColor="#ffffff"
  fgColor="#0A0A0F"
  level="M"
  imageSettings={{
    src: '/favicon.svg',
    x: undefined,
    y: undefined,
    height: 30,
    width: 30,
    excavate: true,
  }}
/>
```

---

## 15. Nostr Integration

Real Nostr is already wired in `src/lib/nostr.js`. Key flows:

### Publishing your profile

```javascript
import { createProfileEvent, publishEvent } from '../lib/nostr.js'

const event = createProfileEvent(session.nostr.privkey, {
  name: meta.username,
  about: 'Bitcoin sovereign. Ijma Wallet user.',
  picture: 'https://...',
  nip05: `${meta.username}@yourdomain.com`,
  lud16: meta.lightningAddress,  // Lightning Address
})
await publishEvent(event)
```

### NIP-05 verification server

Host a `/.well-known/nostr.json` on yourdomain.com:

```json
{
  "names": {
    "amisatoshi": "YOUR_HEX_PUBKEY_HERE"
  },
  "relays": {
    "YOUR_HEX_PUBKEY_HERE": [
      "wss://relay.damus.io",
      "wss://nos.lol"
    ]
  }
}
```

### Real-time Zaps

```javascript
import { createZapRequest, fetchZapInvoice } from '../lib/nostr.js'

// Create zap request
const zapReq = createZapRequest(
  privkey,
  recipientPubkey,
  amountSats * 1000,  // msats
  'بارك الله فيك 🧡'
)

// Fetch invoice from recipient's Lightning Address
const invoice = await fetchZapInvoice(
  'recipient@domain.com',
  amountSats * 1000,
  zapReq
)

// Pay invoice via Lightning
// ... (use Breez SDK or NWC)
```

---

## 16. PWA — Install on Device

### iOS (Safari)

1. Open `https://www.ijmawallet.com/app` in Safari
2. Tap the Share button (box with arrow)
3. Scroll down → **"Add to Home Screen"**
4. Tap **Add**

The app will open full-screen with no browser UI.

### Android (Chrome)

1. Open `https://www.ijmawallet.com/app` in Chrome
2. Chrome will show an install banner automatically
3. Or: tap **⋮ menu** → **"Add to Home screen"**

### Create PWA icons

You need two PNG icons. Create them using:

```bash
# Install sharp for image processing
npm install -g sharp-cli

# Create 192x192 and 512x512 from your SVG logo
npx sharp-cli --input logo.svg --output public/pwa-192x192.png --width 192 --height 192
npx sharp-cli --input logo.svg --output public/pwa-512x512.png --width 512 --height 512
npx sharp-cli --input logo.svg --output public/apple-touch-icon.png --width 180 --height 180
```

Or use https://www.pwabuilder.com/imageGenerator

---

## 17. Security Hardening Checklist

Before handling real funds, ensure ALL of these are done:

### Code security
- [ ] All secrets in `.env` — never in code
- [ ] `.env` in `.gitignore`
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] No `console.log` of sensitive data (keys, seeds)
- [ ] CSP header blocks all inline scripts
- [ ] WebAuthn (biometric) registered and tested

### Infrastructure
- [ ] HTTPS enforced (HTTP → HTTPS redirect)
- [ ] HSTS header set (1 year minimum)
- [ ] All security headers present (test at securityheaders.com)
- [ ] CDN cache purged after every deploy
- [ ] Server logs don't capture request bodies
- [ ] No analytics that phone home

### Wallet
- [ ] Seed phrase backup tested (restore from fresh device)
- [ ] PIN change works correctly
- [ ] Auto-lock tested (5 minutes)
- [ ] Wallet wipe tested (backs up first!)
- [ ] Cashu proofs verified on real mint
- [ ] Nostr keypair matches expected npub

### Production checklist
- [ ] `VITE_DEMO_MODE=false`
- [ ] `VITE_NETWORK=mainnet`
- [ ] Source maps disabled (`sourcemap: false` in vite.config.js)
- [ ] Professional security audit completed
- [ ] Bug bounty program announced
- [ ] Responsible disclosure policy published

---

## 18. Roadmap to Full Production

### Phase 1 — Current (v0.3.x)
✅ Real BIP39 mnemonic generation  
✅ NIP-06 Nostr key derivation from seed  
✅ AES-256-GCM vault encryption  
✅ PIN + WebAuthn biometric  
✅ Cashu library integrated (mint/melt/send/receive)  
✅ Nostr events, zaps, relays, DMs  
✅ PWA (offline, installable)  
✅ Bitcoin address derivation (SegWit + Taproot)  
✅ Mempool.space fee/balance API  

### Phase 2 (v0.4.0) — Q2 2026
- [ ] Breez SDK — real Lightning send/receive
- [ ] QR code scanning (camera)
- [ ] Real-time Nostr relay subscriptions
- [ ] Cashu multi-mint UI fully wired
- [ ] Transaction history from Mempool.space
- [ ] NIP-05 verification display
- [ ] LNURL-pay and LNURL-withdraw

### Phase 3 (v0.5.0) — Q4 2026
- [ ] Fedimint client (fedimint-client WASM)
- [ ] Hardware wallet (Jade, Coldcard via WebUSB)
- [ ] Social recovery (Shamir's Secret Sharing via Nostr DMs)
- [ ] Nostr Web Connect (NWC) — control from web apps
- [ ] Zakat calculator
- [ ] Sadaqah payment routing

### Phase 4 (v1.0.0) — 2027
- [ ] Full multi-sig (2-of-3, 3-of-5)
- [ ] Taproot + MuSig2
- [ ] Verifiable credentials (NIP-based)
- [ ] Web of Trust scoring (live from relays)
- [ ] Tor integration
- [ ] Professional security audit
- [ ] Bug bounty launch

---

## Support & Community

- **Website:** https://www.ijmawallet.com
- **GitHub:** https://github.com/amisatoshi/ijmawallet
- **Built by:** [Blockchainology](https://www.blockchainology.co.uk)
- **Nostr:** npub18z533j9gxhnlkqukp75wnd5mjv5njqkaj07atslnrk2dp9rxsp0q6650l4 (lead maintainer)

---

**License: MIT** | © 2025-2026 Blockchainology
