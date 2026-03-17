/**
 * Ijma Wallet — Hardware Wallet Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Non-custodial hardware signing via WebUSB / WebHID / WebSerial.
 * The private key NEVER leaves the hardware device.
 *
 * Supported devices:
 *   Open Source:
 *     - Jade        (Blockstream) — USB/Bluetooth — FOSS
 *     - Coldcard    (Coinkite)    — USB/NFC/PSBT  — FOSS firmware
 *     - Passport    (Foundation)  — USB/QR/SD     — FOSS
 *     - SeedSigner  (community)   — QR-only        — FOSS
 *     - Krux        (community)   — QR-only        — FOSS
 *
 *   Commercial:
 *     - Ledger Nano S/X/S+/Stax  — USB/Bluetooth
 *     - Trezor One / Model T / Safe 3 / Safe 5
 *
 * Signing protocol: PSBT (BIP-174) for all devices.
 * QR-based devices use Animated QR (BC-UR encoding).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Device Registry ─────────────────────────────────────────────────────────

export const HARDWARE_WALLETS = [
  // ── Open Source ────────────────────────────────────────────────────────────
  {
    id: 'jade',
    name: 'Jade',
    manufacturer: 'Blockstream',
    type: 'open_source',
    connections: ['usb', 'bluetooth', 'serial'],
    interface: 'jade_api',
    usbVendorId: 0x10c4,  // Silicon Labs CP2102
    usbProductIds: [0xea60],
    icon: '🟢',
    features: ['multisig', 'taproot', 'miniscript', 'liquid'],
    firmware: 'https://github.com/Blockstream/Jade',
    notes: 'Fully open source. Best value. Supports Miniscript.',
    supported: true,
  },
  {
    id: 'coldcard',
    name: 'Coldcard',
    manufacturer: 'Coinkite',
    type: 'open_source',
    connections: ['usb', 'nfc', 'sd_card', 'qr'],
    interface: 'coldcard_psbt',
    usbVendorId: 0xd13e,
    usbProductIds: [0xcc10, 0xcc15],
    icon: '❄️',
    features: ['multisig', 'taproot', 'miniscript', 'payjoin', 'air_gap'],
    firmware: 'https://github.com/Coldcard/firmware',
    notes: 'Air-gap via SD card or NFC. Most security-focused.',
    supported: true,
  },
  {
    id: 'passport',
    name: 'Passport',
    manufacturer: 'Foundation Devices',
    type: 'open_source',
    connections: ['usb', 'qr', 'sd_card'],
    interface: 'passport_psbt',
    usbVendorId: 0x2b3e,
    usbProductIds: [0xac01],
    icon: '🛂',
    features: ['multisig', 'taproot', 'air_gap'],
    firmware: 'https://github.com/Foundation-Devices/passport2',
    notes: 'Beautiful open-source device. QR & SD card air-gap.',
    supported: true,
  },
  {
    id: 'seedsigner',
    name: 'SeedSigner',
    manufacturer: 'Community',
    type: 'open_source',
    connections: ['qr'],
    interface: 'qr_psbt',
    usbVendorId: null,
    icon: '🌱',
    features: ['multisig', 'air_gap', 'diy'],
    firmware: 'https://github.com/SeedSigner/seedsigner',
    notes: 'DIY on Raspberry Pi Zero. QR only. Ultimate air-gap.',
    supported: true,
  },
  {
    id: 'krux',
    name: 'Krux',
    manufacturer: 'Community',
    type: 'open_source',
    connections: ['qr'],
    interface: 'qr_psbt',
    usbVendorId: null,
    icon: '🔐',
    features: ['multisig', 'air_gap', 'diy'],
    firmware: 'https://github.com/selfcustody/krux',
    notes: 'DIY on M5StickV/Maix Amigo. Touchscreen QR signing.',
    supported: true,
  },
  // ── Commercial ─────────────────────────────────────────────────────────────
  {
    id: 'ledger_nano_s_plus',
    name: 'Ledger Nano S+',
    manufacturer: 'Ledger',
    type: 'commercial',
    connections: ['usb'],
    interface: 'ledger_hid',
    usbVendorId: 0x2c97,
    usbProductIds: [0x0005],
    icon: '🔵',
    features: ['multisig', 'taproot'],
    firmware: null,  // closed source
    notes: 'Most popular. Closed source. Requires Bitcoin app.',
    supported: true,
  },
  {
    id: 'ledger_nano_x',
    name: 'Ledger Nano X',
    manufacturer: 'Ledger',
    type: 'commercial',
    connections: ['usb', 'bluetooth'],
    interface: 'ledger_hid',
    usbVendorId: 0x2c97,
    usbProductIds: [0x0004],
    icon: '🔵',
    features: ['multisig', 'taproot', 'bluetooth'],
    firmware: null,
    notes: 'Bluetooth + USB. Closed source.',
    supported: true,
  },
  {
    id: 'ledger_stax',
    name: 'Ledger Stax',
    manufacturer: 'Ledger',
    type: 'commercial',
    connections: ['usb', 'bluetooth', 'nfc'],
    interface: 'ledger_hid',
    usbVendorId: 0x2c97,
    usbProductIds: [0x0006],
    icon: '🔵',
    features: ['multisig', 'taproot', 'bluetooth', 'nfc'],
    firmware: null,
    notes: 'Premium E-ink screen. Closed source.',
    supported: true,
  },
  {
    id: 'trezor_one',
    name: 'Trezor One',
    manufacturer: 'SatoshiLabs',
    type: 'commercial',
    connections: ['usb'],
    interface: 'trezor_webusb',
    usbVendorId: 0x534c,
    usbProductIds: [0x0001],
    icon: '🟦',
    features: ['multisig'],
    firmware: 'https://github.com/trezor/trezor-firmware',
    notes: 'Original Trezor. Open source firmware. No Taproot.',
    supported: true,
  },
  {
    id: 'trezor_model_t',
    name: 'Trezor Model T',
    manufacturer: 'SatoshiLabs',
    type: 'commercial',
    connections: ['usb'],
    interface: 'trezor_webusb',
    usbVendorId: 0x1209,
    usbProductIds: [0x53c1],
    icon: '🟦',
    features: ['multisig', 'taproot'],
    firmware: 'https://github.com/trezor/trezor-firmware',
    notes: 'Touchscreen. Open source firmware. Taproot support.',
    supported: true,
  },
  {
    id: 'trezor_safe_3',
    name: 'Trezor Safe 3',
    manufacturer: 'SatoshiLabs',
    type: 'commercial',
    connections: ['usb'],
    interface: 'trezor_webusb',
    usbVendorId: 0x1209,
    usbProductIds: [0x53c3],
    icon: '🟦',
    features: ['multisig', 'taproot', 'secure_element'],
    firmware: 'https://github.com/trezor/trezor-firmware',
    notes: 'Secure element (EAL6+). Open source firmware.',
    supported: true,
  },
]

// ─── Browser capability detection ────────────────────────────────────────────

export const HW_CAPABILITIES = {
  webusb: () => !!navigator.usb,
  webhid: () => !!navigator.hid,
  webserial: () => !!navigator.serial,
  webNfc: () => !!window.NDEFReader,
  // Camera for QR scanning
  camera: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.some(d => d.kind === 'videoinput')
    } catch { return false }
  },
}

/**
 * Check which hardware wallet connection methods are available in this browser.
 * Chrome/Edge: WebUSB + WebHID + WebSerial
 * Firefox: None (no WebUSB)
 * Safari: None
 */
export async function checkBrowserSupport() {
  return {
    webusb: HW_CAPABILITIES.webusb(),
    webhid: HW_CAPABILITIES.webhid(),
    webserial: HW_CAPABILITIES.webserial(),
    webNfc: HW_CAPABILITIES.webNfc(),
    camera: await HW_CAPABILITIES.camera(),
    recommended: 'Chrome or Brave for USB hardware wallets',
  }
}

/**
 * Get available connection methods for a device given browser support.
 */
export async function getAvailableConnections(deviceId) {
  const device = HARDWARE_WALLETS.find(d => d.id === deviceId)
  if (!device) return []

  const support = await checkBrowserSupport()
  const available = []

  if (device.connections.includes('usb') && support.webusb) available.push('usb')
  if (device.connections.includes('usb') && support.webhid) available.push('hid')
  if (device.connections.includes('serial') && support.webserial) available.push('serial')
  if (device.connections.includes('qr') && support.camera) available.push('qr')
  if (device.connections.includes('sd_card')) available.push('sd_card')
  if (device.connections.includes('nfc') && support.webNfc) available.push('nfc')

  return available
}

// ─── WebUSB device connection ─────────────────────────────────────────────────

/**
 * Request access to a hardware wallet via WebUSB.
 * Triggers the browser's device picker dialog.
 */
export async function requestUsbDevice(deviceId) {
  if (!navigator.usb) throw new Error('WebUSB not supported in this browser. Use Chrome or Brave.')

  const device = HARDWARE_WALLETS.find(d => d.id === deviceId)
  if (!device?.usbVendorId) throw new Error('Device does not support USB')

  const filters = device.usbProductIds.map(productId => ({
    vendorId: device.usbVendorId,
    productId,
  }))

  try {
    const usbDevice = await navigator.usb.requestDevice({ filters })
    await usbDevice.open()
    if (usbDevice.configuration === null) {
      await usbDevice.selectConfiguration(1)
    }
    await usbDevice.claimInterface(0)
    return usbDevice
  } catch (e) {
    if (e.name === 'NotFoundError') throw new Error('No device selected')
    throw new Error(`USB connection failed: ${e.message}`)
  }
}

/**
 * Request access to a hardware wallet via WebHID (alternative to WebUSB).
 * Ledger prefers WebHID.
 */
export async function requestHidDevice(deviceId) {
  if (!navigator.hid) throw new Error('WebHID not supported. Use Chrome 89+.')

  const device = HARDWARE_WALLETS.find(d => d.id === deviceId)
  if (!device?.usbVendorId) throw new Error('Device USB info not found')

  const filters = device.usbProductIds.map(productId => ({
    vendorId: device.usbVendorId,
    productId,
  }))

  const devices = await navigator.hid.requestDevice({ filters })
  if (!devices.length) throw new Error('No device selected')

  const hidDevice = devices[0]
  await hidDevice.open()
  return hidDevice
}

// ─── PSBT (Partially Signed Bitcoin Transaction) ─────────────────────────────

/**
 * Create a PSBT for hardware wallet signing.
 *
 * In production this uses bitcoinjs-lib or BDK-WASM to construct the PSBT.
 * The PSBT contains the transaction + all input metadata needed for
 * the hardware wallet to verify and sign.
 *
 * Returns a base64-encoded PSBT string.
 */
export async function createPsbt({ inputs, outputs, feeRate, network = 'mainnet' }) {
  // This is where you'd use bitcoinjs-lib Psbt or BDK-WASM
  // For now returns a structured object describing the transaction
  const psbt = {
    version: 2,
    inputs: inputs.map(inp => ({
      txid: inp.txid,
      vout: inp.vout,
      amount: inp.amount,
      address: inp.address,
      path: inp.derivationPath,  // e.g. m/84'/0'/0'/0/0
      script: inp.script,
    })),
    outputs: outputs.map(out => ({
      address: out.address,
      amount: out.amount,
    })),
    feeRate,
    network,
  }

  // TODO: Replace with actual PSBT encoding:
  // const { Psbt } = await import('bitcoinjs-lib')
  // const p = new Psbt({ network: networks.bitcoin })
  // ... add inputs + outputs ...
  // return p.toBase64()

  return btoa(JSON.stringify(psbt)) // placeholder
}

/**
 * Parse a PSBT returned from a hardware wallet.
 * Extracts signatures and finalises the transaction for broadcast.
 */
export function parsePsbt(psbtBase64) {
  try {
    // In production: use bitcoinjs-lib Psbt.fromBase64(psbtBase64)
    const decoded = JSON.parse(atob(psbtBase64))
    return {
      valid: true,
      inputs: decoded.inputs,
      outputs: decoded.outputs,
      isSigned: decoded.inputs?.every(i => i.signature),
    }
  } catch {
    return { valid: false }
  }
}

// ─── Jade-specific signing ────────────────────────────────────────────────────

/**
 * Sign a PSBT with a Jade device over USB serial.
 * Jade uses a JSON-RPC protocol over serial/USB.
 */
export async function signWithJade(psbtBase64, serialDevice) {
  if (!serialDevice) throw new Error('Jade not connected')

  // Jade protocol: send JSON-RPC, receive signed PSBT
  const request = {
    id: '1',
    method: 'sign_psbt',
    params: { psbt: psbtBase64 }
  }

  const encoder = new TextEncoder()
  const writer = serialDevice.writable.getWriter()
  await writer.write(encoder.encode(JSON.stringify(request) + '\n'))
  writer.releaseLock()

  // Read response
  const reader = serialDevice.readable.getReader()
  let response = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    response += new TextDecoder().decode(value)
    if (response.includes('\n')) break
  }
  reader.releaseLock()

  const parsed = JSON.parse(response.trim())
  if (parsed.error) throw new Error(`Jade error: ${parsed.error.message}`)
  return parsed.result.psbt  // signed PSBT base64
}

// ─── Coldcard / Passport / SeedSigner — SD card & QR flows ──────────────────

/**
 * Export a PSBT as a downloadable file for SD card signing.
 * User copies to SD card, signs on device, copies back.
 */
export function exportPsbtFile(psbtBase64, filename = 'transaction.psbt') {
  const binary = Uint8Array.from(atob(psbtBase64), c => c.charCodeAt(0))
  const blob = new Blob([binary], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Import a signed PSBT file (from SD card return trip).
 * Returns the base64-encoded PSBT content.
 */
export function importPsbtFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.psbt'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) { reject(new Error('No file selected')); return }
      const buffer = await file.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      resolve(b64)
    }
    input.click()
  })
}

/**
 * Generate BC-UR encoded animated QR data for air-gap signing.
 * Used by SeedSigner, Krux, and Passport.
 *
 * In production: use the 'bc-ur' npm package.
 * npm install bc-ur
 */
export async function generateQrPsbt(psbtBase64) {
  // Placeholder — real implementation uses bc-ur encoding
  // const { UREncoder } = await import('bc-ur')
  // const ur = UREncoder.encodePsbt(psbtBase64)
  // return ur.parts  // array of QR fragments for animated display

  return {
    type: 'psbt',
    data: psbtBase64,
    encoding: 'base64',
    note: 'Install bc-ur package for animated QR: npm install bc-ur',
  }
}

// ─── Ledger-specific signing (WebHID) ────────────────────────────────────────

/**
 * Sign a PSBT with a Ledger device over WebHID.
 * Requires Ledger Bitcoin app to be open on the device.
 *
 * In production: use @ledgerhq/hw-app-btc
 * npm install @ledgerhq/hw-transport-webhid @ledgerhq/hw-app-btc
 */
export async function signWithLedger(psbtBase64, hidDevice) {
  if (!hidDevice) throw new Error('Ledger not connected')

  // Production:
  // const TransportWebHID = (await import('@ledgerhq/hw-transport-webhid')).default
  // const AppBtc = (await import('@ledgerhq/hw-app-btc')).default
  // const transport = await TransportWebHID.open(hidDevice)
  // const btc = new AppBtc({ transport })
  // const result = await btc.signTransaction(...)

  throw new Error('Install @ledgerhq/hw-transport-webhid + @ledgerhq/hw-app-btc to enable Ledger signing')
}

// ─── Trezor-specific signing (WebUSB) ────────────────────────────────────────

/**
 * Sign a PSBT with a Trezor device.
 * In production: use @trezor/connect-web
 * npm install @trezor/connect-web
 */
export async function signWithTrezor(psbtBase64) {
  // Production:
  // import TrezorConnect from '@trezor/connect-web'
  // TrezorConnect.init({ manifest: { email: 'dev@ijmawallet.com', appUrl: 'https://ijmawallet.com' } })
  // const result = await TrezorConnect.signTransaction({ ... })

  throw new Error('Install @trezor/connect-web to enable Trezor signing')
}

// ─── Multi-device coordinator ─────────────────────────────────────────────────

/**
 * Coordinate multi-sig signing across multiple hardware wallets.
 * For 2-of-3: collect signatures from 2 different devices.
 *
 * @param {string} psbtBase64  - Unsigned PSBT
 * @param {Array}  signers     - Array of { deviceId, connection } objects
 * @param {number} required    - M in M-of-N
 */
export async function multiSigSign(psbtBase64, signers, required = 2) {
  if (signers.length < required) {
    throw new Error(`Need ${required} signers, only ${signers.length} connected`)
  }

  const signatures = []
  let currentPsbt = psbtBase64

  for (let i = 0; i < required; i++) {
    const signer = signers[i]
    const device = HARDWARE_WALLETS.find(d => d.id === signer.deviceId)

    let signedPsbt
    switch (device?.interface) {
      case 'jade_api':
        signedPsbt = await signWithJade(currentPsbt, signer.connection)
        break
      case 'ledger_hid':
        signedPsbt = await signWithLedger(currentPsbt, signer.connection)
        break
      case 'trezor_webusb':
        signedPsbt = await signWithTrezor(currentPsbt)
        break
      case 'coldcard_psbt':
      case 'passport_psbt':
      case 'qr_psbt':
        // Air-gap: export, sign offline, import back
        exportPsbtFile(currentPsbt, `sign-with-${device.name.toLowerCase()}.psbt`)
        signedPsbt = await importPsbtFile()
        break
      default:
        throw new Error(`Unsupported device interface: ${device?.interface}`)
    }

    currentPsbt = signedPsbt
    signatures.push({ device: device.name, signed: true })
  }

  // Finalise and extract raw transaction
  return {
    signedPsbt: currentPsbt,
    signatures,
    ready: signatures.length >= required,
  }
}

// ─── Device state management ─────────────────────────────────────────────────

let connectedDevices = {}

export function getConnectedDevices() {
  return Object.values(connectedDevices)
}

export function registerDevice(deviceId, connection) {
  connectedDevices[deviceId] = {
    deviceId,
    connection,
    connectedAt: Date.now(),
    device: HARDWARE_WALLETS.find(d => d.id === deviceId),
  }
}

export function disconnectDevice(deviceId) {
  const conn = connectedDevices[deviceId]
  if (conn?.connection?.close) conn.connection.close()
  delete connectedDevices[deviceId]
}

export function isDeviceConnected(deviceId) {
  return deviceId in connectedDevices
}
