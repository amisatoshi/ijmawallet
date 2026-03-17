/**
 * Ijma Wallet — Identity Screen
 * Four tabs: Passport · Web of Trust · Credentials · Present
 */
import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import { C, Card, PrimaryBtn, SectionLabel, ScreenWrapper, Badge } from '../components/shared.jsx'
import { Icon } from '../components/icons.jsx'
import {
  fetchIdentityPassport, fetchWotContacts, computeTrustScore,
  issueCredential, storeCredential, listCredentials, deleteCredential,
  createSelectiveDisclosure, verifyCredential,
  CREDENTIAL_TYPES, CREDENTIAL_SCHEMAS, credentialStatusLabel, isCredentialExpired,
} from '../lib/identity.js'
import { nip19 } from 'nostr-tools'

const TABS = [
  { id: 'passport',     label: 'Passport',    icon: 'contact' },
  { id: 'wot',          label: 'Web of Trust', icon: 'trust'   },
  { id: 'credentials',  label: 'Credentials', icon: 'shield'  },
  { id: 'present',      label: 'Present',     icon: 'share'   },
]

export default function IdentityScreen() {
  const [tab, setTab] = useState('passport')

  return (
    <ScreenWrapper>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>
        Identity Passport
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
        Sovereign identity · Decentralised · Nostr-powered
      </div>

      {/* Tab bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? C.nostrBlue + '22' : C.surface,
            border: `1px solid ${tab === t.id ? C.nostrBlue : C.border}`,
            borderRadius: 10, padding: '8px 4px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <Icon name={t.icon} size={16} color={tab === t.id ? C.nostrBlue : C.muted} />
            <span style={{ fontSize: 9, fontWeight: 700, color: tab === t.id ? C.nostrBlue : C.muted }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {tab === 'passport'    && <PassportTab />}
      {tab === 'wot'         && <WebOfTrustTab />}
      {tab === 'credentials' && <CredentialsTab />}
      {tab === 'present'     && <PresentTab />}
    </ScreenWrapper>
  )
}

// ─── Tab 1: Passport ──────────────────────────────────────────────────────────
function PassportTab() {
  const { session, meta } = useWallet()
  const nostr = session?.nostr
  const [passport, setPassport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (nostr?.pubkey) loadPassport()
  }, [nostr?.pubkey])

  async function loadPassport() {
    setLoading(true)
    try {
      const p = await fetchIdentityPassport(nostr.pubkey)
      setPassport(p)
    } catch (e) {
      console.error('Failed to load passport:', e)
    } finally {
      setLoading(false)
    }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!nostr) return (
    <Card>
      <div style={{ textAlign: 'center', padding: 24, color: C.muted, fontSize: 13 }}>
        No Nostr identity found. Create or restore a wallet to generate your identity.
      </div>
    </Card>
  )

  return (
    <>
      {/* Identity card */}
      <Card glow={C.nostrBlue} style={{
        background: `linear-gradient(135deg, #0d1520 0%, #0a0a1a 100%)`,
        marginBottom: 12, padding: 20,
      }}>
        {/* Card header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.nostrBlue, fontWeight: 700 }}>
            IJMA IDENTITY PASSPORT
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {passport?.nip05Verified && <Badge label="✓ Verified" color={C.cashuGreen} />}
            <Badge label="NIP-06" color={C.nostrBlue} />
          </div>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 30, flexShrink: 0,
            background: passport?.picture
              ? `url(${passport.picture}) center/cover`
              : `linear-gradient(135deg, ${C.btcOrange}, ${C.lightningPurple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
            border: `2px solid ${C.nostrBlue}44`,
          }}>
            {!passport?.picture && (meta?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
              {passport?.displayName || meta?.username || 'Anonymous'}
            </div>
            {passport?.nip05 && (
              <div style={{ fontSize: 12, color: C.nostrBlue }}>
                {passport.nip05Verified ? '✓ ' : '⚠ '}{passport.nip05}
              </div>
            )}
            {meta?.lightningAddress && (
              <div style={{ fontSize: 11, color: C.lightningPurple, marginTop: 2 }}>
                ⚡ {meta.lightningAddress}
              </div>
            )}
          </div>
        </div>

        {/* npub */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>NOSTR PUBLIC KEY (npub)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, fontFamily: 'monospace', fontSize: 10, color: C.text,
              background: 'rgba(0,195,255,0.06)', borderRadius: 6, padding: '6px 8px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {nostr.npub}
            </div>
            <button onClick={() => copy(nostr.npub, 'npub')} style={{
              background: C.nostrBlue + '22', border: `1px solid ${C.nostrBlue}44`,
              borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
              color: copied === 'npub' ? C.cashuGreen : C.nostrBlue, fontSize: 11, fontWeight: 700,
              flexShrink: 0,
            }}>
              {copied === 'npub' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { label: 'Following', value: loading ? '…' : passport?.followCount ?? 0 },
            { label: 'Credentials', value: '—' },
            { label: 'Trust Score', value: '—' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(0,195,255,0.05)', borderRadius: 8, padding: '8px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* About */}
      {passport?.about && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>About</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{passport.about}</div>
        </Card>
      )}

      {/* Share options */}
      <SectionLabel>SHARE IDENTITY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Copy npub', action: () => copy(nostr.npub, 'npub'), color: C.nostrBlue },
          { label: 'Copy nprofile', action: () => copy(passport?.nprofile || '', 'nprofile'), color: C.nostrBlue },
          { label: 'Share QR', action: () => {}, color: C.cashuGreen },
          { label: 'Refresh', action: loadPassport, color: C.muted },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{
            background: btn.color + '11', border: `1px solid ${btn.color}33`,
            borderRadius: 10, padding: 10, cursor: 'pointer',
            color: btn.color, fontSize: 12, fontWeight: 700,
          }}>{btn.label}</button>
        ))}
      </div>

      {/* Relay list */}
      {passport?.relays?.length > 0 && (
        <>
          <SectionLabel>RELAYS</SectionLabel>
          <Card>
            {passport.relays.slice(0, 5).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: C.cashuGreen, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</span>
                <span style={{ fontSize: 9, color: C.muted }}>{r.read && r.write ? 'R/W' : r.read ? 'R' : 'W'}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  )
}

// ─── Tab 2: Web of Trust ──────────────────────────────────────────────────────
function WebOfTrustTab() {
  const { session } = useWallet()
  const nostr = session?.nostr
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (nostr?.pubkey) loadWot()
  }, [nostr?.pubkey])

  async function loadWot() {
    setLoading(true)
    try {
      const wot = await fetchWotContacts(nostr.pubkey)
      // Sort by trust score descending
      setContacts(wot.sort((a, b) => b.score - a.score))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = contacts.filter(c => {
    if (filter === 'high' && c.score < 70) return false
    if (filter === 'mid' && (c.score < 40 || c.score >= 70)) return false
    if (filter === 'low' && c.score >= 40) return false
    if (search && !c.displayName.toLowerCase().includes(search.toLowerCase()) &&
        !c.npub.includes(search)) return false
    return true
  })

  const scoreColor = score =>
    score >= 70 ? C.cashuGreen : score >= 40 ? C.warning : C.error

  return (
    <>
      {/* Algorithm explanation */}
      <Card style={{ marginBottom: 12, background: C.lightningPurple + '08' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.lightningPurple, marginBottom: 8 }}>
          Trust Score Algorithm
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { label: 'Direct', pct: '50%', desc: 'You follow them' },
            { label: 'Network', pct: '30%', desc: 'Your follows follow them' },
            { label: 'Activity', pct: '20%', desc: 'Credentials & endorsements' },
          ].map(f => (
            <div key={f.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.lightningPurple }}>{f.pct}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{f.label}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts..."
          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 12, outline: 'none' }}
        />
        {['all', 'high', 'mid', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? C.nostrBlue + '22' : C.surface,
            border: `1px solid ${filter === f ? C.nostrBlue : C.border}`,
            borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
            color: filter === f ? C.nostrBlue : C.muted, fontSize: 10, fontWeight: 700,
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>
          Loading your network from relays…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 24, color: C.muted }}>
            <Icon name="contacts" size={32} color={C.muted} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, marginBottom: 6 }}>No contacts loaded yet</div>
            <div style={{ fontSize: 11 }}>Your Nostr follow list will appear here once published to relays.</div>
          </div>
        </Card>
      ) : (
        <Card>
          {filtered.map((contact, i) => (
            <div key={contact.pubkey}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: 21, flexShrink: 0,
                  background: contact.picture ? `url(${contact.picture}) center/cover` : `linear-gradient(135deg, ${C.btcOrange}88, ${C.lightningPurple}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#fff',
                }}>
                  {!contact.picture && contact.displayName[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 1 }}>
                    {contact.displayName}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.npub.slice(0, 16)}...
                  </div>
                  {contact.lightningAddress && (
                    <div style={{ fontSize: 9, color: C.lightningPurple, marginTop: 1 }}>⚡ {contact.lightningAddress}</div>
                  )}
                </div>

                {/* Trust score */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: scoreColor(contact.score) + '18',
                    border: `2px solid ${scoreColor(contact.score)}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: scoreColor(contact.score),
                  }}>
                    {contact.score}
                  </div>
                  <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>trust</div>
                </div>
              </div>
              {i < filtered.length - 1 && <div style={{ height: 1, background: C.border, marginLeft: 54 }} />}
            </div>
          ))}
        </Card>
      )}

      <button onClick={loadWot} style={{
        width: '100%', marginTop: 10,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 10, color: C.muted, fontSize: 12, cursor: 'pointer',
      }}>
        Refresh from relays
      </button>
    </>
  )
}

// ─── Tab 3: Credentials ───────────────────────────────────────────────────────
function CredentialsTab() {
  const { session } = useWallet()
  const [credentials, setCredentials] = useState([])
  const [issueMode, setIssueMode] = useState(false)
  const [loading, setLoading] = useState(false)

  // New credential form state
  const [newType, setNewType] = useState(CREDENTIAL_TYPES.AGE_OVER_18)
  const [holderInput, setHolderInput] = useState('')
  const [claimValues, setClaimValues] = useState({})
  const [issueResult, setIssueResult] = useState(null)

  useEffect(() => {
    if (session?.password) loadCredentials()
  }, [session?.password])

  async function loadCredentials() {
    const creds = await listCredentials(session.password)
    setCredentials(creds)
  }

  async function handleIssue() {
    if (!holderInput || !session?.nostr) return
    setLoading(true)
    try {
      // Resolve holder pubkey from npub or hex
      let holderPubkey = holderInput
      if (holderInput.startsWith('npub1')) {
        const decoded = nip19.decode(holderInput)
        holderPubkey = decoded.data
      }

      const schema = CREDENTIAL_SCHEMAS[newType]
      const claims = {}
      for (const key of [...schema.requiredClaims, ...(schema.optionalClaims || [])]) {
        if (claimValues[key]) claims[key] = claimValues[key]
      }

      const result = await issueCredential(
        session.nostr.privkey,
        holderPubkey,
        newType,
        claims,
        { description: schema.label }
      )

      // If issuing to yourself, store it
      if (holderPubkey === session.nostr.pubkey) {
        await storeCredential(result.credential, result.privateData, session.password)
        await loadCredentials()
      }

      setIssueResult(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const schema = CREDENTIAL_SCHEMAS[newType]

  return (
    <>
      {/* Held credentials */}
      <SectionLabel>YOUR CREDENTIALS</SectionLabel>
      {credentials.length === 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ textAlign: 'center', padding: 20, color: C.muted }}>
            <Icon name="shield" size={28} color={C.muted} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 13, marginBottom: 4 }}>No credentials yet</div>
            <div style={{ fontSize: 11 }}>Request credentials from issuers, or issue one to yourself below.</div>
          </div>
        </Card>
      ) : (
        credentials.map(entry => {
          const { label, icon } = CREDENTIAL_SCHEMAS[entry.credential.type?.[1]] || {}
          const status = credentialStatusLabel(entry.credential)
          return (
            <Card key={entry.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: C.nostrBlue + '18', border: `1px solid ${C.nostrBlue}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{icon || '🪪'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label || entry.credential.type?.[1]}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    Issued by {entry.credential.issuer?.pubkey?.slice(0, 12)}...
                  </div>
                </div>
                <Badge label={status.label} color={status.color} />
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.keys(entry.privateData?.claims || {}).map(k => (
                  <span key={k} style={{
                    background: C.nostrBlue + '11', border: `1px solid ${C.nostrBlue}22`,
                    borderRadius: 6, padding: '2px 8px', fontSize: 10, color: C.muted,
                  }}>{k}</span>
                ))}
              </div>
            </Card>
          )
        })
      )}

      {/* Issue credential */}
      <SectionLabel style={{ marginTop: 8 }}>ISSUE A CREDENTIAL</SectionLabel>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
          As an issuer, you sign a credential and send it to a holder. The holder stores it privately and can selectively disclose claims to verifiers.
        </div>

        {/* Type selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>CREDENTIAL TYPE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(CREDENTIAL_SCHEMAS).map(([type, s]) => (
              <button key={type} onClick={() => { setNewType(type); setClaimValues({}) }} style={{
                background: newType === type ? C.nostrBlue + '22' : C.surface2,
                border: `1px solid ${newType === type ? C.nostrBlue : C.border}`,
                borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: newType === type ? C.nostrBlue : C.text }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Holder input */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>HOLDER (npub or pubkey hex)</div>
          <input value={holderInput} onChange={e => setHolderInput(e.target.value)}
            placeholder="npub1... or hex pubkey — leave blank to issue to yourself"
            style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
        </div>

        {/* Claims input */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>CLAIMS</div>
          {schema?.requiredClaims?.map(key => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                {key} <span style={{ color: C.error }}>*required</span>
              </div>
              <input
                value={claimValues[key] || ''}
                onChange={e => setClaimValues(p => ({ ...p, [key]: e.target.value }))}
                placeholder={`Enter ${key}...`}
                style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={handleIssue} disabled={loading}>
          {loading ? '⏳ Issuing…' : `Sign & Issue ${schema?.icon} ${schema?.label}`}
        </PrimaryBtn>

        {issueResult && (
          <div style={{ marginTop: 12, padding: 12, background: C.cashuGreen + '11', border: `1px solid ${C.cashuGreen}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.cashuGreen, marginBottom: 4 }}>✓ Credential issued</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Merkle root: {issueResult.merkleRoot}
            </div>
          </div>
        )}
      </Card>
    </>
  )
}

// ─── Tab 4: Present (Selective Disclosure) ────────────────────────────────────
function PresentTab() {
  const { session } = useWallet()
  const [credentials, setCredentials] = useState([])
  const [selected, setSelected] = useState(null)
  const [disclosedKeys, setDisclosedKeys] = useState([])
  const [verifierInput, setVerifierInput] = useState('')
  const [challenge, setChallenge] = useState('')
  const [presentation, setPresentation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verifyInput, setVerifyInput] = useState('')
  const [verifyResult, setVerifyResult] = useState(null)

  useEffect(() => {
    if (session?.password) loadCredentials()
  }, [session?.password])

  async function loadCredentials() {
    const creds = await listCredentials(session.password)
    setCredentials(creds)
  }

  async function handlePresent() {
    if (!selected || !session?.nostr) return
    setLoading(true)
    try {
      let verifierPubkey = verifierInput || session.nostr.pubkey
      if (verifierInput.startsWith('npub1')) {
        verifierPubkey = nip19.decode(verifierInput).data
      }

      const { presentation: p, event } = await createSelectiveDisclosure(
        session.nostr.privkey,
        selected.credential,
        selected.privateData,
        disclosedKeys,
        verifierPubkey,
        challenge
      )
      setPresentation({ p, event, json: JSON.stringify(p, null, 2) })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!verifyInput) return
    setLoading(true)
    try {
      const pres = JSON.parse(verifyInput)
      // For demo: verify against locally held issuance data
      // In production: fetch issuance event from relays using fetchIssuanceEvent()
      const result = await verifyCredential(pres, {
        pubkey: pres.credential?.issuer?.pubkey,
        tags: [
          ['merkle', pres.credential?.merkleRoot],
          ['expiry', String(Math.floor(new Date(pres.credential?.expiryDate).getTime() / 1000))],
        ],
        sig: 'demo', // would be real sig from relay
      })
      setVerifyResult(result)
    } catch (e) {
      setVerifyResult({ valid: false, reason: 'Parse error: ' + e.message, verifiedClaims: {} })
    } finally {
      setLoading(false)
    }
  }

  const selectedEntry = credentials.find(c => c.id === selected?.id)
  const allClaims = selectedEntry ? Object.keys(selectedEntry.privateData?.claims || {}) : []

  return (
    <>
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
        Selective disclosure lets you prove specific claims from a credential without revealing everything. For example: prove you are over 18 without revealing your name or birth date.
      </div>

      {/* Choose credential */}
      <SectionLabel>SELECT CREDENTIAL TO PRESENT</SectionLabel>
      {credentials.length === 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ textAlign: 'center', padding: 16, color: C.muted, fontSize: 12 }}>
            No credentials in your wallet. Add credentials from the Credentials tab first.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {credentials.map(entry => {
            const s = CREDENTIAL_SCHEMAS[entry.credential.type?.[1]]
            const isSelected = selected?.id === entry.id
            return (
              <button key={entry.id} onClick={() => { setSelected(entry); setDisclosedKeys([]); setPresentation(null) }} style={{
                background: isSelected ? C.nostrBlue + '18' : C.surface,
                border: `1px solid ${isSelected ? C.nostrBlue : C.border}`,
                borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${isSelected ? C.nostrBlue : C.muted}`, background: isSelected ? C.nostrBlue : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 16 }}>{s?.icon || '🪪'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? C.nostrBlue : C.text }}>{s?.label || entry.credential.type?.[1]}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{allClaims.length} claims available</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Choose what to disclose */}
      {selected && (
        <>
          <SectionLabel>CHOOSE WHAT TO REVEAL</SectionLabel>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
              Ticked claims will be shared. Unticked claims remain private — the verifier only sees a cryptographic hash.
            </div>
            {allClaims.map(key => {
              const isRevealed = disclosedKeys.includes(key)
              const value = selectedEntry.privateData.claims[key]
              return (
                <div key={key} onClick={() => setDisclosedKeys(prev =>
                  prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                )} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    background: isRevealed ? C.cashuGreen + '22' : C.surface2,
                    border: `2px solid ${isRevealed ? C.cashuGreen : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isRevealed && <Icon name="checkCircle" size={12} color={C.cashuGreen} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{key}</div>
                    <div style={{ fontSize: 10, color: isRevealed ? C.text : C.muted }}>
                      {isRevealed ? String(value) : '••••• (hidden)'}
                    </div>
                  </div>
                  <Badge label={isRevealed ? 'Revealed' : 'Hidden'} color={isRevealed ? C.cashuGreen : C.muted} />
                </div>
              )
            })}
          </Card>

          {/* Verifier + challenge */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>VERIFIER npub (optional)</div>
            <input value={verifierInput} onChange={e => setVerifierInput(e.target.value)}
              placeholder="npub1... — leave blank to generate a self-contained proof"
              style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', marginBottom: 8 }}
            />
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>CHALLENGE (verifier nonce, prevents replay)</div>
            <input value={challenge} onChange={e => setChallenge(e.target.value)}
              placeholder="Optional — paste the verifier's challenge string"
              style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
          </div>

          <PrimaryBtn onClick={handlePresent} disabled={loading || disclosedKeys.length === 0}>
            {loading ? '⏳ Building proof…' : `Generate Presentation (${disclosedKeys.length} claims revealed)`}
          </PrimaryBtn>

          {presentation && (
            <Card style={{ marginTop: 12, border: `1px solid ${C.cashuGreen}44` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.cashuGreen, marginBottom: 8 }}>
                ✓ Presentation ready — {disclosedKeys.length} of {allClaims.length} claims revealed
              </div>
              <div style={{ background: C.surface2, borderRadius: 8, padding: 10, fontFamily: 'monospace', fontSize: 9, color: C.muted, maxHeight: 120, overflow: 'auto', wordBreak: 'break-all' }}>
                {presentation.json.slice(0, 400)}...
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => navigator.clipboard?.writeText(presentation.json)} style={{
                  flex: 1, background: C.cashuGreen + '22', border: `1px solid ${C.cashuGreen}44`, borderRadius: 8, padding: 8, color: C.cashuGreen, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>📋 Copy JSON</button>
                <button style={{
                  flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, color: C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>📷 Show QR</button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Verify section */}
      <SectionLabel style={{ marginTop: 20 }}>VERIFY A PRESENTATION</SectionLabel>
      <Card>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
          Paste a presentation JSON to verify the cryptographic proofs and see which claims have been disclosed and confirmed.
        </div>
        <textarea value={verifyInput} onChange={e => setVerifyInput(e.target.value)}
          placeholder='Paste presentation JSON here…'
          rows={4}
          style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.text, fontSize: 10, fontFamily: 'monospace', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }}
        />
        <button onClick={handleVerify} disabled={!verifyInput || loading} style={{
          width: '100%', background: verifyInput ? C.nostrBlue + '22' : C.surface2,
          border: `1px solid ${verifyInput ? C.nostrBlue : C.border}`, borderRadius: 10,
          padding: 10, color: verifyInput ? C.nostrBlue : C.muted, fontSize: 12, fontWeight: 700, cursor: verifyInput ? 'pointer' : 'default',
        }}>
          {loading ? '⏳ Verifying…' : '🔍 Verify Proof'}
        </button>

        {verifyResult && (
          <div style={{ marginTop: 12, padding: 12, background: (verifyResult.valid ? C.cashuGreen : C.error) + '11', border: `1px solid ${(verifyResult.valid ? C.cashuGreen : C.error)}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: verifyResult.valid ? C.cashuGreen : C.error, marginBottom: 8 }}>
              {verifyResult.valid ? '✓ Valid presentation' : '✗ Verification failed'}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: verifyResult.valid ? 8 : 0 }}>{verifyResult.reason}</div>
            {verifyResult.valid && Object.entries(verifyResult.verifiedClaims).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.muted }}>{k}</span>
                <span style={{ fontSize: 11, color: C.cashuGreen, fontWeight: 700 }}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
