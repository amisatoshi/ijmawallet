/**
 * Ijma Wallet — App Root (updated with splash screen)
 * Add SplashScreen import and splashDone state to your existing App.jsx
 */

import { useState } from 'react'
import { WalletProvider, useWallet } from './context/WalletContext.jsx'
import { NodeConfigProvider } from './context/NodeConfigContext.jsx'
import { C, GeomPattern } from './components/shared.jsx'
import Onboarding from './components/Onboarding.jsx'
import LockScreen from './components/LockScreen.jsx'
import MainWallet from './components/MainWallet.jsx'
import SplashScreen from './components/SplashScreen.jsx'  // ← ADD THIS

function AppRouter() {
  const { status } = useWallet()
  if (status === 'loading')    return <LoadingDots />
  if (status === 'no_wallet')  return <Onboarding />
  if (status === 'locked')     return <LockScreen />
  if (status === 'unlocked')   return <MainWallet />
  return <LoadingDots />
}

function LoadingDots() {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: '#F5C518', fontSize: 12, fontFamily: 'monospace', letterSpacing: 3 }}>
        ···
      </div>
    </div>
  )
}

export default function App() {
  // ── Splash state — show once per app session ──────────────────────────────
  const [splashDone, setSplashDone] = useState(false)

  // Show splash on first render. Once onComplete fires → show the real app.
  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />
  }

  return (
    <NodeConfigProvider>
      <WalletProvider>
        <div style={{
          maxWidth: 430, margin: '0 auto', minHeight: '100vh',
          background: C.bg, color: C.text, position: 'relative', overflow: 'hidden',
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
          <AppRouter />
        </div>
      </WalletProvider>
    </NodeConfigProvider>
  )
}
