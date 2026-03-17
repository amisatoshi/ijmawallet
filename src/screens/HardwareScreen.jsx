/**
 * Ijma Wallet — Hardware Wallet Screen
 */
import { useState, useEffect } from 'react'
import {
  HARDWARE_WALLETS, checkBrowserSupport, getAvailableConnections,
  requestUsbDevice, requestHidDevice, registerDevice, disconnectDevice,
  isDeviceConnected, getConnectedDevices, exportPsbtFile, importPsbtFile,
  multiSigSign
} from '../lib/hardware.js'
import { C, Card, PrimaryBtn, SecondaryBtn, SectionLabel, ScreenWrapper, Badge } from '../components/shared.jsx'

const TYPE_COLORS = {
  open_source: C.cashuGreen,
  commercial: C.nostrBlue,
}

const CONNECTION_ICONS = {
  usb: '🔌', hid: '🔌', serial: '📡', qr: '📷',
  sd_card: '💾', nfc: '📶', bluetooth: '📶',
}

export default function HardwareScreen() {
  const [tab, setTab] = useState('devices')      // devices | sign | multisig | guide
  const [browserSupport, setBrowserSupport] = useState(null)
  const [connectedDevices, setConnectedDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [connecting, setConnecting] = useState(null)
  const [error, setError] = useState('')
  const [psbtB64, setPsbtB64] = useState('')
  const [signedPsbt, setSignedPsbt] = useState('')
  const [signing, setSigning] = useState(false)
  const [filter, setFilter] = useState('all')    // all | open_source | commercial

  useEffect(() => {
    checkBrowserSupport().then(setBrowserSupport)
    setConnectedDevices(getConnectedDevices())
  }, [])

  const filtered = HARDWARE_WALLETS.filter(d =>
    filter === 'all' ? true : d.type === filter
  )

  async function handleConnect(device) {
    setError('')
    setConnecting(device.id)
    try {
      const available = await getAvailableConnections(device.id)
      if (!available.length) throw new Error('No supported connection method available in this browser')

      let connection = null
      const preferHid = available.includes('hid')
      const preferUsb = available.includes('usb')
      const isQrOnly = device.connections.every(c => ['qr', 'sd_card', 'nfc'].includes(c))

      if (isQrOnly) {
        // QR-only device — no USB connection needed
        connection = { type: 'qr', deviceId: device.id }
      } else if (preferHid && device.interface === 'ledger_hid') {
        connection = await requestHidDevice(device.id)
        connection.type = 'hid'
      } else if (preferUsb) {
        connection = await requestUsbDevice(device.id)
        connection.type = 'usb'
      } else {
        throw new Error(`Available: ${available.join(', ')} — connect your ${device.name} and try again`)
      }

      registerDevice(device.id, connection)
      setConnectedDevices(getConnectedDevices())
      setSelectedDevice(device.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setConnecting(null)
    }
  }

  function handleDisconnect(deviceId) {
    disconnectDevice(deviceId)
    setConnectedDevices(getConnectedDevices())
    if (selectedDevice === deviceId) setSelectedDevice(null)
  }

  async function handleSign() {
    if (!psbtB64 || !selectedDevice) return
    setSigning(true)
    setError('')
    try {
      const device = HARDWARE_WALLETS.find(d => d.id === selectedDevice)
      const conn = connectedDevices.find(c => c.deviceId === selectedDevice)

      if (['qr_psbt', 'coldcard_psbt', 'passport_psbt'].includes(device?.interface)) {
        // Air-gap: export → sign → import
        exportPsbtFile(psbtB64, `sign-with-${device.name}.psbt`)
        const signed = await importPsbtFile()
        setSignedPsbt(signed)
      } else {
        // Direct USB/HID signing
        const { multiSigSign: sign } = await import('../lib/hardware.js')
        const result = await sign(psbtB64, [{ deviceId: selectedDevice, connection: conn?.connection }], 1)
        setSignedPsbt(result.signedPsbt)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSigning(false)
    }
  }

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Hardware Wallets</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
        Your keys never leave the device
      </div>

      {/* Browser support banner */}
      {browserSupport && !browserSupport.webusb && (
        <div style={{ marginBottom: 12, padding: 12, background: C.warning + '11', border: `1px solid ${C.warning}33`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 4 }}>⚠️ Limited browser support</div>
          <div style={{ fontSize: 11, color: C.muted }}>
            WebUSB requires Chrome or Brave. QR-based signing (SeedSigner, Krux) works in all browsers.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { id: 'devices', label: '🔌 Devices' },
          { id: 'sign', label: '✍️ Sign PSBT' },
          { id: 'multisig', label: '🛡️ Multi-sig' },
          { id: 'guide', label: '📖 Guide' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 10,
            background: tab === t.id ? C.btcOrange + '22' : C.surface,
            border: `1px solid ${tab === t.id ? C.btcOrange : C.border}`,
            color: tab === t.id ? C.btcOrange : C.muted,
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Connected devices summary */}
      {connectedDevices.length > 0 && (
        <Card style={{ marginBottom: 12, background: C.cashuGreen + '08', border: `1px solid ${C.cashuGreen}33` }}>
          <div style={{ fontSize: 10, color: C.cashuGreen, fontWeight: 700, marginBottom: 8 }}>
            🔗 {connectedDevices.length} DEVICE{connectedDevices.length > 1 ? 'S' : ''} CONNECTED
          </div>
          {connectedDevices.map(cd => (
            <div key={cd.deviceId} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{cd.device?.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{cd.device?.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{cd.device?.manufacturer} · Connected</div>
              </div>
              <button onClick={() => handleDisconnect(cd.deviceId)} style={{
                background: C.error + '22', border: `1px solid ${C.error}44`,
                borderRadius: 8, padding: '4px 10px', color: C.error, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>Disconnect</button>
            </div>
          ))}
        </Card>
      )}

      {error && (
        <div style={{ marginBottom: 12, padding: 10, background: C.error + '11', border: `1px solid ${C.error}33`, borderRadius: 10, fontSize: 11, color: C.error }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── DEVICES TAB ─────────────────────────────────────────────────── */}
      {tab === 'devices' && (
        <>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[['all', 'All Devices'], ['open_source', '🟢 Open Source'], ['commercial', '🔵 Commercial']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 8,
                background: filter === val ? C.lightningPurple + '22' : C.surface,
                border: `1px solid ${filter === val ? C.lightningPurple : C.border}`,
                color: filter === val ? C.lightningPurple : C.muted,
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>{lbl}</button>
            ))}
          </div>

          {filtered.map(device => {
            const connected = isDeviceConnected(device.id)
            const isConnecting = connecting === device.id
            const isQrOnly = device.connections.every(c => ['qr', 'sd_card'].includes(c))

            return (
              <Card key={device.id} style={{ marginBottom: 10, border: `1px solid ${connected ? C.cashuGreen + '55' : C.border}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: TYPE_COLORS[device.type] + '18',
                    border: `1px solid ${TYPE_COLORS[device.type]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>{device.icon}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{device.name}</span>
                      <Badge label={device.type === 'open_source' ? 'Open Source' : 'Commercial'}
                        color={TYPE_COLORS[device.type]} />
                      {connected && <Badge label="Connected" color={C.cashuGreen} />}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{device.manufacturer}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>{device.notes}</div>

                    {/* Features */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      {device.features.map(f => (
                        <span key={f} style={{
                          background: C.surface2, border: `1px solid ${C.border}`,
                          borderRadius: 6, padding: '2px 6px', fontSize: 9, color: C.muted, fontWeight: 600,
                        }}>{f}</span>
                      ))}
                    </div>

                    {/* Connection methods */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {device.connections.map(c => (
                        <span key={c} style={{ fontSize: 10, color: C.muted }}>
                          {CONNECTION_ICONS[c]} {c}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {connected ? (
                        <button onClick={() => { setSelectedDevice(device.id); setTab('sign') }} style={{
                          background: C.btcOrange + '22', border: `1px solid ${C.btcOrange}44`,
                          borderRadius: 8, padding: '7px 12px', color: C.btcOrange, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}>✍️ Sign PSBT</button>
                      ) : (
                        <button onClick={() => handleConnect(device)} disabled={isConnecting} style={{
                          background: isConnecting ? C.surface2 : C.cashuGreen + '22',
                          border: `1px solid ${isConnecting ? C.border : C.cashuGreen}44`,
                          borderRadius: 8, padding: '7px 12px',
                          color: isConnecting ? C.muted : C.cashuGreen,
                          fontSize: 11, fontWeight: 700, cursor: isConnecting ? 'wait' : 'pointer',
                        }}>
                          {isConnecting ? '⏳ Connecting...' : isQrOnly ? '📷 Use QR' : '🔌 Connect'}
                        </button>
                      )}
                      {device.firmware && (
                        <a href={device.firmware} target="_blank" rel="noopener noreferrer" style={{
                          background: C.surface2, border: `1px solid ${C.border}`,
                          borderRadius: 8, padding: '7px 12px', color: C.muted, fontSize: 11, fontWeight: 700,
                          textDecoration: 'none', cursor: 'pointer',
                        }}>GitHub →</a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </>
      )}

      {/* ── SIGN TAB ─────────────────────────────────────────────────────── */}
      {tab === 'sign' && (
        <>
          {connectedDevices.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔌</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>No device connected</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Connect a hardware wallet from the Devices tab</div>
              <button onClick={() => setTab('devices')} style={{
                background: C.btcOrange + '22', border: `1px solid ${C.btcOrange}44`,
                borderRadius: 10, padding: '10px 20px', color: C.btcOrange, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Browse Devices</button>
            </Card>
          ) : (
            <>
              {/* Device selector */}
              <SectionLabel>SIGNING DEVICE</SectionLabel>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {connectedDevices.map(cd => (
                  <button key={cd.deviceId} onClick={() => setSelectedDevice(cd.deviceId)} style={{
                    background: selectedDevice === cd.deviceId ? C.btcOrange + '22' : C.surface,
                    border: `1px solid ${selectedDevice === cd.deviceId ? C.btcOrange : C.border}`,
                    borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 18 }}>{cd.device?.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: selectedDevice === cd.deviceId ? C.btcOrange : C.text }}>{cd.device?.name}</div>
                      <div style={{ fontSize: 9, color: C.cashuGreen }}>● Connected</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* PSBT input */}
              <SectionLabel>PSBT (PARTIALLY SIGNED BITCOIN TRANSACTION)</SectionLabel>
              <div style={{ marginBottom: 8 }}>
                <textarea
                  value={psbtB64}
                  onChange={e => { setPsbtB64(e.target.value); setSignedPsbt('') }}
                  placeholder="Paste base64-encoded PSBT here..."
                  rows={4}
                  style={{
                    width: '100%', background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 12, color: C.text, fontSize: 11,
                    fontFamily: 'monospace', outline: 'none', resize: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => importPsbtFile().then(setPsbtB64)} style={{
                  flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 10, color: C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>📁 Import .psbt file</button>
                <button onClick={() => { navigator.clipboard?.readText().then(setPsbtB64) }} style={{
                  flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 10, color: C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>📋 Paste</button>
              </div>

              {psbtB64 && selectedDevice && (
                <>
                  {/* Show signing flow for air-gap devices */}
                  {['coldcard', 'passport', 'seedsigner', 'krux'].includes(selectedDevice) && (
                    <Card style={{ marginBottom: 12, background: C.nostrBlue + '08' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.nostrBlue, marginBottom: 8 }}>
                        📋 Air-gap signing flow
                      </div>
                      {['Export .psbt file →', 'Copy to SD card / scan QR →', `Sign on ${HARDWARE_WALLETS.find(d => d.id === selectedDevice)?.name} →`, 'Return SD card / scan result →', 'Import signed .psbt'].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                          <div style={{ width: 20, height: 20, borderRadius: 10, background: C.nostrBlue + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.nostrBlue, flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{step}</div>
                        </div>
                      ))}
                    </Card>
                  )}

                  <PrimaryBtn onClick={handleSign} disabled={signing}>
                    {signing ? '⏳ Awaiting signature...' : `✍️ Sign with ${HARDWARE_WALLETS.find(d => d.id === selectedDevice)?.name}`}
                  </PrimaryBtn>
                </>
              )}

              {signedPsbt && (
                <Card style={{ marginTop: 12, border: `1px solid ${C.cashuGreen}44` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.cashuGreen, marginBottom: 8 }}>✅ Signed PSBT</div>
                  <div style={{ background: C.surface2, borderRadius: 10, padding: 10, fontFamily: 'monospace', fontSize: 10, color: C.text, wordBreak: 'break-all', marginBottom: 10 }}>
                    {signedPsbt.slice(0, 80)}...
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigator.clipboard?.writeText(signedPsbt)} style={{
                      flex: 1, background: C.cashuGreen + '22', border: `1px solid ${C.cashuGreen}44`,
                      borderRadius: 10, padding: 10, color: C.cashuGreen, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>📋 Copy</button>
                    <button onClick={() => exportPsbtFile(signedPsbt, 'signed.psbt')} style={{
                      flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, color: C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>💾 Export</button>
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ── MULTI-SIG TAB ────────────────────────────────────────────────── */}
      {tab === 'multisig' && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>2-of-3 Multi-signature</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
              Require 2 hardware wallets to sign before any transaction broadcasts.
              Your bitcoin is safe even if one device is lost or stolen.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'key1', label: 'Key 1', sub: 'Mobile device (hot)', icon: '📱' },
                { key: 'key2', label: 'Key 2', sub: 'Hardware wallet (cold)', icon: '🔑' },
                { key: 'key3', label: 'Key 3', sub: 'Backup / second HW', icon: '🔐' },
              ].map((k, i) => (
                <div key={k.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  background: C.surface2, borderRadius: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{k.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{k.label}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{k.sub}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <Badge label={i === 0 ? 'This device' : 'Add'} color={i === 0 ? C.cashuGreen : C.muted} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ padding: 12, background: C.lightningPurple + '11', border: `1px solid ${C.lightningPurple}33`, borderRadius: 10, fontSize: 11, color: C.lightningPurple }}>
            🔜 Full multi-sig coordination coming in v0.3.0 with output descriptor sharing and co-signer communication via Nostr DMs.
          </div>
        </>
      )}

      {/* ── GUIDE TAB ─────────────────────────────────────────────────────── */}
      {tab === 'guide' && (
        <>
          {[
            {
              title: '🟢 Open Source Recommendations',
              items: [
                { name: 'Jade', note: 'Best value. Fully open source. USB + Bluetooth. Miniscript support. ~$65.' },
                { name: 'Coldcard Mk4', note: 'Air-gap specialist. SD card + NFC. Advanced security. ~$157.' },
                { name: 'Passport', note: 'Beautiful device. Open source. QR + SD. ~$199.' },
                { name: 'SeedSigner', note: 'DIY. Raspberry Pi Zero. ~$30 in parts. Ultimate sovereignty.' },
              ]
            },
            {
              title: '🔵 Commercial Devices',
              items: [
                { name: 'Ledger Nano S+', note: 'Most popular. WebHID support. Closed source firmware. ~$79.' },
                { name: 'Trezor Safe 3', note: 'Open source firmware. Secure element. USB. ~$79.' },
                { name: 'Trezor Model T', note: 'Touchscreen. Taproot. USB. ~$179.' },
              ]
            },
            {
              title: '📋 Signing methods',
              items: [
                { name: 'USB (WebUSB/WebHID)', note: 'Direct browser connection. Chrome/Brave only. Best UX.' },
                { name: 'QR Code (BC-UR)', note: 'Animated QR between screen and camera. Works on all browsers. Best security.' },
                { name: 'SD Card (PSBT file)', note: 'Export .psbt file, sign on device, import back. Works everywhere.' },
                { name: 'NFC', note: 'Tap to sign. Coldcard Mk4. Experimental.' },
              ]
            },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              <SectionLabel>{section.title.toUpperCase().replace(/[^A-Z0-9 ]/g, '')}</SectionLabel>
              <Card>
                {section.items.map((item, i) => (
                  <div key={item.name}>
                    <div style={{ padding: '10px 0' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{item.note}</div>
                    </div>
                    {i < section.items.length - 1 && <div style={{ height: 1, background: C.border }} />}
                  </div>
                ))}
              </Card>
            </div>
          ))}

          <div style={{ padding: 12, background: C.cashuGreen + '11', border: `1px solid ${C.cashuGreen}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: C.cashuGreen, lineHeight: 1.6 }}>
              🌟 <strong>Ijma recommends:</strong> Jade for most users (best open-source value), Coldcard for maximum security consciousness, SeedSigner for those who want full sovereignty and don't mind DIY.
            </div>
          </div>
        </>
      )}
    </ScreenWrapper>
  )
}
