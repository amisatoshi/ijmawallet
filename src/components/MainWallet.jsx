import { useState } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import { C, GeomPattern } from './shared.jsx'
import HomeScreen from '../screens/HomeScreen.jsx'
import { SendScreen, ReceiveScreen, EcashScreen, NostrScreen, SettingsScreen } from '../screens/AllScreens.jsx'
import SwapScreen from '../screens/SwapScreen.jsx'
import HardwareScreen from '../screens/HardwareScreen.jsx'
import IdentityScreen from '../screens/IdentityScreen.jsx'

const TABS = [
  { id: 'home',     icon: '⌂',  label: 'Home' },
  { id: 'identity', icon: '🪪', label: 'Identity' },
  { id: 'send',     icon: '↗',  label: 'Send' },
  { id: 'receive',  icon: '↙',  label: 'Receive' },
  { id: 'swap',     icon: '⇄',  label: 'Swap' },
  { id: 'ecash',    icon: '🪙', label: 'Ecash' },
  { id: 'hardware', icon: '🔑', label: 'HW' },
  { id: 'settings', icon: '⚙',  label: 'More' },
]

export default function MainWallet() {
  const [tab, setTab] = useState('home')
  const { lock } = useWallet()

  const screens = {
    home:     <HomeScreen onNavigate={setTab} />,
    send:     <SendScreen />,
    receive:  <ReceiveScreen />,
    swap:     <SwapScreen />,
    identity: <IdentityScreen />,
    ecash:    <EcashScreen />,
    hardware: <HardwareScreen />,
    settings: <SettingsScreen />,
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#FAF8F5' }}>
      {/* Background pattern */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, maxWidth: 430, margin: '0 auto' }}>
        <GeomPattern opacity={0.025} />
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px 4px', position: 'relative', zIndex: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: C.cashuGreen }}>●</span>
          <span style={{ fontSize: 10, color: C.muted }}>mainnet</span>
          <button onClick={lock} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.muted, fontSize: 14, padding: 0,
          }}>🔒</button>
        </div>
      </div>

      {/* Screen content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {screens[tab]}
      </div>

      {/* Tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'rgba(250,248,245,0.94)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, border: 'none', background: 'none',
            color: tab === t.id ? '#F7931A' : '#9A8F83',
            padding: '10px 0 6px', cursor: 'pointer', transition: 'color 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: 0.5 }}>{t.label}</span>
            {tab === t.id && (
              <div style={{ width: 4, height: 4, borderRadius: 2, background: '#F7931A' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
