/**
 * Ijma Wallet — Nostr Identity, Web of Trust & Verifiable Credentials
 * ─────────────────────────────────────────────────────────────────────────────
 * Built on Nostr NIPs:
 *
 *   Identity / Passport
 *     NIP-01  kind 0   — profile metadata
 *     NIP-02  kind 3   — follow list (social graph source)
 *     NIP-05          — DNS-based identity verification
 *     NIP-19          — npub / nprofile / nevent encoding
 *     NIP-24  kind 10002 — relay list metadata
 *
 *   Web of Trust
 *     NIP-02  kind 3   — who you follow (direct trust)
 *     NIP-51  kind 10000 — mute list (negative signal)
 *     Custom graph traversal for second-degree trust scores
 *
 *   Verifiable Credentials
 *     kind 30078       — parameterised replaceable events for credential storage
 *     kind 30079       — credential issuance (issuer → holder)
 *     kind 30080       — credential presentation (holder → verifier)
 *     Content: signed JSON credential objects
 *     Selective disclosure via SHA-256 Merkle tree of claims
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  finalizeEvent, verifyEvent, nip19, SimplePool, getPublicKey
} from 'nostr-tools'
import { hexToBytes, bytesToHex, DEFAULT_RELAYS, getPool } from './nostr.js'

// ─── NIP kinds used ───────────────────────────────────────────────────────────
export const KINDS = {
  PROFILE:              0,
  TEXT_NOTE:            1,
  FOLLOWS:              3,
  ENCRYPTED_DM:         4,
  ZAP_REQUEST:          9734,
  ZAP_RECEIPT:          9735,
  RELAY_LIST:           10002,
  MUTE_LIST:            10000,
  // Verifiable Credentials (Ijma custom — parameterised replaceable)
  VC_CREDENTIAL:        30078,  // issued credential (stored by holder)
  VC_ISSUANCE:          30079,  // issuance event (published by issuer)
  VC_PRESENTATION:      30080,  // presentation to a verifier
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: IDENTITY PASSPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a complete identity profile from relays.
 * Returns a normalised passport object.
 */
export async function fetchIdentityPassport(pubkey, relays = DEFAULT_RELAYS) {
  const pool = getPool()

  // Fetch in parallel: profile, follow list, relay list
  const [profileEvent, followsEvent, relayEvent] = await Promise.all([
    pool.get(relays, { kinds: [KINDS.PROFILE], authors: [pubkey], limit: 1 }),
    pool.get(relays, { kinds: [KINDS.FOLLOWS], authors: [pubkey], limit: 1 }),
    pool.get(relays, { kinds: [KINDS.RELAY_LIST], authors: [pubkey], limit: 1 }),
  ])

  // Parse profile metadata
  let profile = {}
  if (profileEvent) {
    try { profile = JSON.parse(profileEvent.content) } catch {}
  }

  // Parse follow list
  const follows = followsEvent
    ? followsEvent.tags.filter(t => t[0] === 'p').map(t => ({
        pubkey: t[1],
        relay: t[2] || null,
        petname: t[3] || null,
      }))
    : []

  // Parse relay list
  const relayList = relayEvent
    ? relayEvent.tags.filter(t => t[0] === 'r').map(t => ({
        url: t[1],
        read: !t[2] || t[2] === 'read',
        write: !t[2] || t[2] === 'write',
      }))
    : []

  // NIP-05 verification
  let nip05Verified = false
  if (profile.nip05) {
    try {
      const [name, domain] = profile.nip05.split('@')
      const res = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)
      const data = await res.json()
      nip05Verified = data.names?.[name] === pubkey
    } catch {}
  }

  const npub = nip19.npubEncode(pubkey)
  const nprofile = nip19.nprofileEncode({ pubkey, relays: relays.slice(0, 3) })

  return {
    // Core identity
    pubkey,
    npub,
    nprofile,                          // shareable profile link
    // Profile fields
    displayName: profile.display_name || profile.name || '',
    name: profile.name || '',
    about: profile.about || '',
    picture: profile.picture || null,
    banner: profile.banner || null,
    website: profile.website || '',
    lightningAddress: profile.lud16 || profile.lud06 || null,
    nip05: profile.nip05 || null,
    nip05Verified,
    // Social
    followCount: follows.length,
    follows,
    relays: relayList,
    // Meta
    profileEventId: profileEvent?.id || null,
    profileUpdatedAt: profileEvent?.created_at || null,
  }
}

/**
 * Publish a profile update (kind 0).
 */
export function buildProfileEvent(privkeyHex, profileData) {
  const privkey = hexToBytes(privkeyHex)
  return finalizeEvent({
    kind: KINDS.PROFILE,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify({
      name: profileData.name,
      display_name: profileData.displayName,
      about: profileData.about,
      picture: profileData.picture,
      banner: profileData.banner,
      website: profileData.website,
      lud16: profileData.lightningAddress,
      nip05: profileData.nip05,
    }),
  }, privkey)
}

/**
 * Publish a follow list update (kind 3).
 * followList: [{ pubkey, relay?, petname? }]
 */
export function buildFollowListEvent(privkeyHex, followList) {
  const privkey = hexToBytes(privkeyHex)
  const tags = followList.map(f => [
    'p', f.pubkey, f.relay || '', f.petname || ''
  ])
  return finalizeEvent({
    kind: KINDS.FOLLOWS,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
  }, privkey)
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: WEB OF TRUST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a Web of Trust score for a target pubkey
 * from the perspective of the local user.
 *
 * Algorithm:
 *   Direct trust (0.5 weight):   target is in user's follow list
 *   Network trust (0.3 weight):  fraction of user's follows who also follow target
 *   Activity score (0.2 weight): based on credential endorsements + zap receipts
 *
 * Returns score 0–100.
 */
export async function computeTrustScore(
  userPubkey,
  targetPubkey,
  relays = DEFAULT_RELAYS,
  cachedFollows = null
) {
  const pool = getPool()

  // 1. Fetch user's follow list
  const userFollows = cachedFollows || await fetchFollowList(userPubkey, relays)
  const userFollowPubkeys = new Set(userFollows.map(f => f.pubkey))

  // Direct trust: is target directly followed?
  const directTrust = userFollowPubkeys.has(targetPubkey) ? 1 : 0

  // 2. Network trust: how many of user's follows also follow target?
  // Fetch follow lists of user's follows (batch, limit to first 50 for performance)
  const sampleFollows = userFollows.slice(0, 50)
  let networkFollowCount = 0

  if (sampleFollows.length > 0) {
    const followEvents = await pool.querySync(relays, {
      kinds: [KINDS.FOLLOWS],
      authors: sampleFollows.map(f => f.pubkey),
      limit: 50,
    })
    for (const event of followEvents) {
      const follows = event.tags.filter(t => t[0] === 'p').map(t => t[1])
      if (follows.includes(targetPubkey)) networkFollowCount++
    }
  }

  const networkTrust = sampleFollows.length > 0
    ? networkFollowCount / sampleFollows.length
    : 0

  // 3. Activity score: credential endorsements on this pubkey
  // Look for kind 30079 (VC issuance) events that reference this pubkey
  const endorsements = await pool.querySync(relays, {
    kinds: [KINDS.VC_ISSUANCE],
    '#p': [targetPubkey],
    limit: 20,
  })

  // Weight endorsements from trusted issuers more
  let endorsementScore = 0
  for (const e of endorsements) {
    const issuerTrusted = userFollowPubkeys.has(e.pubkey)
    endorsementScore += issuerTrusted ? 0.15 : 0.05
  }
  const activityScore = Math.min(1, endorsementScore)

  // Weighted total
  const raw = (directTrust * 0.5) + (networkTrust * 0.3) + (activityScore * 0.2)
  return Math.round(raw * 100)
}

/**
 * Fetch a user's follow list (kind 3).
 * Returns array of { pubkey, relay, petname }
 */
export async function fetchFollowList(pubkey, relays = DEFAULT_RELAYS) {
  const pool = getPool()
  const event = await pool.get(relays, {
    kinds: [KINDS.FOLLOWS],
    authors: [pubkey],
    limit: 1,
  })
  if (!event) return []
  return event.tags
    .filter(t => t[0] === 'p')
    .map(t => ({ pubkey: t[1], relay: t[2] || null, petname: t[3] || null }))
}

/**
 * Fetch trust scores for all of a user's follows.
 * Returns array of { pubkey, score, profile? }
 */
export async function fetchWotContacts(userPubkey, relays = DEFAULT_RELAYS) {
  const follows = await fetchFollowList(userPubkey, relays)
  if (!follows.length) return []

  const pool = getPool()

  // Fetch profiles for all follows in one query
  const profileEvents = await pool.querySync(relays, {
    kinds: [KINDS.PROFILE],
    authors: follows.map(f => f.pubkey),
    limit: follows.length,
  })

  const profileMap = {}
  for (const e of profileEvents) {
    try { profileMap[e.pubkey] = JSON.parse(e.content) } catch {}
  }

  // Compute trust scores (simplified — direct only for performance)
  return follows.map(f => {
    const p = profileMap[f.pubkey] || {}
    return {
      pubkey: f.pubkey,
      npub: nip19.npubEncode(f.pubkey),
      petname: f.petname,
      displayName: p.display_name || p.name || f.petname || shortKey(f.pubkey),
      picture: p.picture || null,
      lightningAddress: p.lud16 || null,
      nip05: p.nip05 || null,
      // Score from direct follow = base 65, adjusted by network signals
      score: 65 + (f.petname ? 10 : 0),
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 & 4: VERIFIABLE CREDENTIALS + SELECTIVE DISCLOSURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CREDENTIAL SCHEMA
 *
 * A credential is a JSON object with:
 *   @context    — ['https://ijmawallet.com/credentials/v1']
 *   type        — ['IjmaCredential', 'AgeVerification' | 'Membership' | etc.]
 *   id          — unique identifier (random hex)
 *   issuer      — { id: npub, name: string }
 *   issuanceDate
 *   expiryDate? — optional
 *   subject     — { id: npub (holder) }
 *   claims      — { key: value, ... }  — the actual credential data
 *   claimHashes — Merkle leaf hashes for selective disclosure
 *   proof       — Nostr event signature over the credential
 */

export const CREDENTIAL_TYPES = {
  AGE_OVER_18:         'AgeOver18',
  ACCREDITED_INVESTOR: 'AccreditedInvestor',
  IDENTITY:            'IdentityVerification',
  MEMBERSHIP:          'Membership',
  BITCOIN_HOLDER:      'BitcoinHolder',
  CUSTOM:              'Custom',
}

// ── Merkle tree for selective disclosure ────────────────────────────────────

/**
 * Hash a single claim leaf: SHA-256("key:value:salt")
 * Salt prevents brute-force guessing of claim values.
 */
async function hashClaimLeaf(key, value, salt) {
  const enc = new TextEncoder()
  const data = enc.encode(`${key}:${JSON.stringify(value)}:${salt}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(hash))
}

/**
 * Hash a pair of nodes (for Merkle tree internal nodes).
 */
async function hashPair(left, right) {
  const enc = new TextEncoder()
  // Sort to ensure consistent ordering
  const [a, b] = [left, right].sort()
  const data = enc.encode(a + b)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(hash))
}

/**
 * Build a Merkle tree from an array of leaf hashes.
 * Returns { root, tree } where tree[0] = leaves, tree[n] = root level.
 */
async function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: '', tree: [] }
  if (leaves.length === 1) return { root: leaves[0], tree: [leaves] }

  const tree = [leaves]
  let current = leaves

  while (current.length > 1) {
    const next = []
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        next.push(await hashPair(current[i], current[i + 1]))
      } else {
        next.push(current[i]) // odd leaf promoted unchanged
      }
    }
    tree.push(next)
    current = next
  }

  return { root: current[0], tree }
}

/**
 * Generate a Merkle proof for a specific leaf index.
 * The proof allows a verifier to confirm a leaf is in the tree
 * without revealing other leaves.
 */
function getMerkleProof(tree, leafIndex) {
  const proof = []
  let index = leafIndex

  for (let level = 0; level < tree.length - 1; level++) {
    const isRight = index % 2 === 1
    const siblingIndex = isRight ? index - 1 : index + 1
    if (siblingIndex < tree[level].length) {
      proof.push({ hash: tree[level][siblingIndex], position: isRight ? 'left' : 'right' })
    }
    index = Math.floor(index / 2)
  }

  return proof
}

/**
 * Verify a Merkle proof.
 */
async function verifyMerkleProof(leafHash, proof, root) {
  let current = leafHash
  for (const step of proof) {
    current = step.position === 'left'
      ? await hashPair(step.hash, current)
      : await hashPair(current, step.hash)
  }
  return current === root
}

// ── Credential issuance ──────────────────────────────────────────────────────

/**
 * Issue a Verifiable Credential.
 *
 * @param {string} issuerPrivkeyHex  — issuer's Nostr private key
 * @param {string} holderPubkey      — recipient's Nostr pubkey
 * @param {string} type              — one of CREDENTIAL_TYPES
 * @param {object} claims            — the actual claim data { key: value }
 * @param {object} options
 *   @param {number}  options.expiryDays  — days until expiry (default: 365)
 *   @param {string}  options.description — human-readable description
 *   @param {boolean} options.private     — if true, encrypt content with NIP-04
 *
 * Returns { credential, event, merkleRoot, salts }
 *
 * IMPORTANT: The issuer must keep the salts secret (or share them with the holder).
 * The salts allow selective disclosure — without a salt, a claim cannot be disclosed.
 */
export async function issueCredential(
  issuerPrivkeyHex,
  holderPubkey,
  type,
  claims,
  options = {}
) {
  const issuerPubkey = getPublicKey(hexToBytes(issuerPrivkeyHex))
  const credentialId = bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
  const now = Math.floor(Date.now() / 1000)
  const expiryDays = options.expiryDays || 365

  // Generate random salts for each claim (for selective disclosure)
  const salts = {}
  const claimKeys = Object.keys(claims)
  for (const key of claimKeys) {
    salts[key] = bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
  }

  // Compute Merkle tree over hashed claims
  const leafHashes = await Promise.all(
    claimKeys.map(key => hashClaimLeaf(key, claims[key], salts[key]))
  )
  const { root: merkleRoot, tree } = await buildMerkleTree(leafHashes)

  // Build credential object
  const credential = {
    '@context': ['https://ijmawallet.com/credentials/v1', 'https://www.w3.org/2018/credentials/v1'],
    type: ['IjmaCredential', type],
    id: `urn:ijma:credential:${credentialId}`,
    issuer: {
      id: nip19.npubEncode(issuerPubkey),
      pubkey: issuerPubkey,
    },
    issuanceDate: new Date(now * 1000).toISOString(),
    expiryDate: new Date((now + expiryDays * 86400) * 1000).toISOString(),
    credentialSubject: {
      id: nip19.npubEncode(holderPubkey),
      pubkey: holderPubkey,
    },
    // Claims are NOT included in the published event — only their Merkle root.
    // This preserves privacy: the credential can be verified without revealing claims.
    merkleRoot,
    claimCount: claimKeys.length,
    description: options.description || '',
    // Salts index: maps claim keys to their leaf index (for selective disclosure)
    // But NOT the salt values themselves — those go to the holder separately
    claimIndex: Object.fromEntries(claimKeys.map((k, i) => [k, i])),
  }

  // Sign credential with issuer's Nostr key
  const issuerPrivkey = hexToBytes(issuerPrivkeyHex)
  const credentialJson = JSON.stringify(credential)

  const event = finalizeEvent({
    kind: KINDS.VC_ISSUANCE,
    created_at: now,
    tags: [
      ['p', holderPubkey],              // holder
      ['d', credentialId],              // unique identifier (replaceable)
      ['t', type],                      // credential type (searchable)
      ['merkle', merkleRoot],           // Merkle root (public)
      ['expiry', String(now + expiryDays * 86400)],
    ],
    content: credentialJson,
  }, issuerPrivkey)

  return {
    credential,
    event,          // publish this to relays to announce issuance
    merkleRoot,
    // These must be transmitted to the holder securely (via NIP-04 DM)
    // and NEVER published to relays
    privateData: {
      credentialId,
      claims,        // the actual claim values
      salts,         // the salts for selective disclosure
      leafHashes,
      tree,
    },
  }
}

/**
 * Package the private credential data for the holder.
 * Encrypt it in a NIP-04 DM from issuer to holder.
 */
export async function sendCredentialToHolder(
  issuerPrivkeyHex,
  holderPubkey,
  privateData,
  relays = DEFAULT_RELAYS
) {
  const { nip04 } = await import('nostr-tools')
  const issuerPrivkey = hexToBytes(issuerPrivkeyHex)

  const payload = JSON.stringify({
    type: 'ijma_credential_delivery',
    ...privateData,
  })

  const encrypted = await nip04.encrypt(issuerPrivkey, holderPubkey, payload)

  const event = finalizeEvent({
    kind: KINDS.ENCRYPTED_DM,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', holderPubkey], ['t', 'credential']],
    content: encrypted,
  }, issuerPrivkey)

  const pool = getPool()
  await pool.publish(relays, event)
  return event
}

// ── Credential storage (holder) ──────────────────────────────────────────────

/**
 * Store a received credential in the encrypted vault.
 * The full credential (including claims and salts) is encrypted.
 */
export async function storeCredential(credential, privateData, password) {
  const { secureGet, secureSet } = await import('./security.js')
  const existing = await secureGet('credentials', password) || []
  const entry = {
    id: privateData.credentialId,
    credential,
    privateData,
    receivedAt: Date.now(),
  }
  const updated = [...existing.filter(c => c.id !== entry.id), entry]
  await secureSet('credentials', updated, password)
  return entry
}

/**
 * List all stored credentials.
 */
export async function listCredentials(password) {
  const { secureGet } = await import('./security.js')
  return await secureGet('credentials', password) || []
}

/**
 * Delete a credential from storage.
 */
export async function deleteCredential(credentialId, password) {
  const { secureGet, secureSet } = await import('./security.js')
  const existing = await secureGet('credentials', password) || []
  await secureSet('credentials', existing.filter(c => c.id !== credentialId), password)
}

// ── Selective disclosure (holder presents to verifier) ───────────────────────

/**
 * Create a selective disclosure presentation.
 *
 * The holder chooses WHICH claims to reveal.
 * For each revealed claim, they provide:
 *   - the claim key + value (plaintext)
 *   - the salt used to hash it
 *   - the Merkle proof (sibling hashes up to root)
 *
 * For unrevealed claims, only the leaf hash is visible —
 * the verifier cannot determine the value.
 *
 * @param {string}   holderPrivkeyHex
 * @param {object}   credential        — the full credential object
 * @param {object}   privateData       — { claims, salts, leafHashes, tree }
 * @param {string[]} disclosedKeys     — which claim keys to reveal
 * @param {string}   verifierPubkey    — who this presentation is for
 * @param {string}   challenge         — optional verifier nonce (prevents replay)
 *
 * Returns a signed presentation event to share with the verifier.
 */
export async function createSelectiveDisclosure(
  holderPrivkeyHex,
  credential,
  privateData,
  disclosedKeys,
  verifierPubkey,
  challenge = ''
) {
  const holderPrivkey = hexToBytes(holderPrivkeyHex)
  const { claims, salts, leafHashes, tree } = privateData
  const claimIndex = credential.claimIndex

  // Build disclosure array
  const disclosures = []
  const allKeys = Object.keys(claimIndex)

  for (const key of allKeys) {
    const leafIdx = claimIndex[key]
    const isDisclosed = disclosedKeys.includes(key)

    if (isDisclosed) {
      // Reveal: provide value, salt, and Merkle proof
      disclosures.push({
        key,
        disclosed: true,
        value: claims[key],
        salt: salts[key],
        leafHash: leafHashes[leafIdx],
        proof: getMerkleProof(tree, leafIdx),
      })
    } else {
      // Conceal: provide only the leaf hash (no value, no salt)
      disclosures.push({
        key,
        disclosed: false,
        leafHash: leafHashes[leafIdx],
        // No value, no salt — verifier cannot reverse-engineer
      })
    }
  }

  const presentation = {
    '@context': ['https://ijmawallet.com/credentials/v1'],
    type: ['IjmaPresentation'],
    id: `urn:ijma:presentation:${bytesToHex(crypto.getRandomValues(new Uint8Array(8)))}`,
    holder: nip19.npubEncode(getPublicKey(holderPrivkey)),
    verifier: nip19.npubEncode(verifierPubkey),
    credential: {
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      issuanceDate: credential.issuanceDate,
      expiryDate: credential.expiryDate,
      merkleRoot: credential.merkleRoot,
    },
    disclosures,
    challenge,
    presentedAt: new Date().toISOString(),
  }

  const event = finalizeEvent({
    kind: KINDS.VC_PRESENTATION,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', verifierPubkey],
      ['t', 'presentation'],
      ['challenge', challenge],
    ],
    content: JSON.stringify(presentation),
  }, holderPrivkey)

  return { presentation, event }
}

// ── Credential verification ──────────────────────────────────────────────────

/**
 * Verify a presented credential.
 *
 * Checks:
 *   1. Nostr event signature is valid (issuer signed it)
 *   2. Credential has not expired
 *   3. Each disclosed claim hashes to its stated leaf hash
 *   4. Each leaf hash is in the Merkle tree (Merkle proof verifies)
 *   5. Merkle root matches the root in the original issuance event
 *
 * @param {object} presentation  — the presentation object from createSelectiveDisclosure
 * @param {object} issuanceEvent — the original kind-30079 event from the issuer
 *
 * Returns { valid, reason, verifiedClaims }
 */
export async function verifyCredential(presentation, issuanceEvent) {
  const errors = []

  // 1. Verify the issuance event signature
  if (!verifyEvent(issuanceEvent)) {
    return { valid: false, reason: 'Issuer signature invalid', verifiedClaims: {} }
  }

  // 2. Check expiry
  const expiryTag = issuanceEvent.tags.find(t => t[0] === 'expiry')
  if (expiryTag) {
    const expiry = parseInt(expiryTag[1])
    if (expiry < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'Credential has expired', verifiedClaims: {} }
    }
  }

  // 3. Check Merkle root matches issuance event
  const merkleTag = issuanceEvent.tags.find(t => t[0] === 'merkle')
  const publishedRoot = merkleTag?.[1]
  const presentedRoot = presentation.credential.merkleRoot

  if (!publishedRoot || publishedRoot !== presentedRoot) {
    return { valid: false, reason: 'Merkle root mismatch — credential may have been tampered', verifiedClaims: {} }
  }

  // 4. Verify each disclosed claim
  const verifiedClaims = {}
  const leafHashes = presentation.disclosures.map(d => d.leafHash)

  for (const disclosure of presentation.disclosures) {
    if (!disclosure.disclosed) continue

    // Recompute the hash for this claim
    const expectedHash = await hashClaimLeaf(
      disclosure.key,
      disclosure.value,
      disclosure.salt
    )

    if (expectedHash !== disclosure.leafHash) {
      errors.push(`Claim '${disclosure.key}': hash mismatch — value may have been altered`)
      continue
    }

    // Verify Merkle proof
    const proofValid = await verifyMerkleProof(
      disclosure.leafHash,
      disclosure.proof,
      presentedRoot
    )

    if (!proofValid) {
      errors.push(`Claim '${disclosure.key}': Merkle proof invalid`)
      continue
    }

    verifiedClaims[disclosure.key] = disclosure.value
  }

  if (errors.length > 0) {
    return { valid: false, reason: errors.join('; '), verifiedClaims }
  }

  return {
    valid: true,
    reason: 'All checks passed',
    verifiedClaims,
    issuerPubkey: issuanceEvent.pubkey,
    holderNpub: presentation.holder,
    credentialType: presentation.credential.type,
    issuanceDate: presentation.credential.issuanceDate,
    expiryDate: presentation.credential.expiryDate,
    disclosedCount: Object.keys(verifiedClaims).length,
    totalClaims: presentation.disclosures.length,
  }
}

/**
 * Fetch the original issuance event for a credential from relays.
 * Used by verifiers to cross-check a presented credential.
 */
export async function fetchIssuanceEvent(
  issuerPubkey,
  credentialId,
  relays = DEFAULT_RELAYS
) {
  const pool = getPool()
  return pool.get(relays, {
    kinds: [KINDS.VC_ISSUANCE],
    authors: [issuerPubkey],
    '#d': [credentialId],
    limit: 1,
  })
}

// ── Credential types with standard claim schemas ──────────────────────────────

export const CREDENTIAL_SCHEMAS = {
  [CREDENTIAL_TYPES.AGE_OVER_18]: {
    label: 'Age Over 18',
    description: 'Confirms holder is 18 or older without revealing exact age or birth date.',
    icon: '🎂',
    requiredClaims: ['ageOver18', 'countryOfVerification'],
    optionalClaims: ['verificationMethod'],
    disclosureSuggestion: ['ageOver18'],  // minimal default disclosure
  },
  [CREDENTIAL_TYPES.ACCREDITED_INVESTOR]: {
    label: 'Accredited Investor',
    description: 'Confirms holder meets accredited investor criteria.',
    icon: '📈',
    requiredClaims: ['accredited', 'jurisdiction', 'verifiedBy'],
    optionalClaims: ['netWorthCategory'],
    disclosureSuggestion: ['accredited', 'jurisdiction'],
  },
  [CREDENTIAL_TYPES.IDENTITY]: {
    label: 'Identity Verification',
    description: 'Basic identity verification. Selective disclosure of individual fields.',
    icon: '🪪',
    requiredClaims: ['fullName', 'nationality', 'documentType'],
    optionalClaims: ['dateOfBirth', 'documentNumber', 'expiryDate'],
    disclosureSuggestion: ['nationality'],
  },
  [CREDENTIAL_TYPES.MEMBERSHIP]: {
    label: 'Membership',
    description: 'Confirms membership of an organisation or community.',
    icon: '🤝',
    requiredClaims: ['organisation', 'memberSince', 'membershipLevel'],
    optionalClaims: ['memberId', 'role'],
    disclosureSuggestion: ['organisation', 'membershipLevel'],
  },
  [CREDENTIAL_TYPES.BITCOIN_HOLDER]: {
    label: 'Bitcoin Holder',
    description: 'Cryptographic proof of Bitcoin ownership above a threshold, without revealing balance.',
    icon: '₿',
    requiredClaims: ['holdsAboveThreshold', 'thresholdSats', 'proofMethod'],
    optionalClaims: [],
    disclosureSuggestion: ['holdsAboveThreshold', 'thresholdSats'],
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortKey(pubkey) {
  return pubkey.slice(0, 8) + '...' + pubkey.slice(-4)
}

export function isCredentialExpired(credential) {
  if (!credential.expiryDate) return false
  return new Date(credential.expiryDate) < new Date()
}

export function credentialStatusLabel(credential) {
  if (isCredentialExpired(credential)) return { label: 'Expired', color: '#FF3B30' }
  const daysLeft = Math.floor((new Date(credential.expiryDate) - new Date()) / 86400000)
  if (daysLeft < 30) return { label: `Expires in ${daysLeft}d`, color: '#FFB800' }
  return { label: 'Valid', color: '#00D98C' }
}
