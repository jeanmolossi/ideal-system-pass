// Utility functions for securely storing credentials using Web Crypto API and chrome.storage

// chrome typings may not be available in Node test environment
// so we declare it as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any;

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  return Buffer.from(bytes).toString('base64');
}

function base64ToBuffer(base64: string): Uint8Array {
  const buffer = Buffer.from(base64, 'base64');
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey', 'deriveBits']);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hashPassword(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await getKeyMaterial(password);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' } as any,
    keyMaterial,
    256
  );
  return new Uint8Array(derived);
}

export async function setMasterPassword(password: string): Promise<void> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const iterations = 200000;
  const hash = await hashPassword(password, salt, iterations);
  await chrome.storage.local.set({
    master: {
      hash: bufferToBase64(hash),
      salt: bufferToBase64(salt),
      iterations
    }
  });
}

export async function isMasterPasswordSet(): Promise<boolean> {
  const { master } = await chrome.storage.local.get(['master']);
  return !!master;
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  const { master } = await chrome.storage.local.get(['master']);
  if (!master) return false;
  const salt = base64ToBuffer(master.salt);
  const iterations = master.iterations;
  const expected = base64ToBuffer(master.hash);
  const actual = await hashPassword(password, salt, iterations);
  return timingSafeEqual(expected, actual);
}

export async function changeMasterPassword(oldPassword: string, newPassword: string): Promise<boolean> {
  if (!(await verifyMasterPassword(oldPassword))) return false;
  const all = await chrome.storage.local.get(null);
  for (const [id, value] of Object.entries(all)) {
    if (id === 'master' || id === 'vaultIndex' || id === 'categories') continue;
    if (value && (value as any).ciphertext && (value as any).iv && (value as any).salt) {
      const plain = await getCredential(oldPassword, id);
      if (plain !== null) {
        await saveCredential(newPassword, id, plain);
      }
    }
  }
  await setMasterPassword(newPassword);
  return true;
}

export async function resetVault(): Promise<void> {
  await chrome.storage.local.clear();
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(password);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100000, hash: 'SHA-256' } as any,
    keyMaterial,
    { name: 'AES-GCM', length: 256 } as any,
    false,
    ['encrypt', 'decrypt']
  );
}

/** Save an encrypted credential in chrome.storage.local */
export async function saveCredential(
  masterPassword: string,
  id: string,
  credential: string
): Promise<void> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await deriveKey(masterPassword, salt);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const enc = new TextEncoder();
  const data = enc.encode(credential);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const stored = {
    ciphertext: bufferToBase64(cipher),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt)
  };
  await chrome.storage.local.set({ [id]: stored });
}

/** Retrieve and decrypt a credential from chrome.storage.local */
export async function getCredential(
  masterPassword: string,
  id: string
): Promise<string | null> {
  const result = await chrome.storage.local.get([id]);
  const stored = result[id];
  if (!stored) return null;
  try {
    const salt = base64ToBuffer(stored.salt);
    const iv = base64ToBuffer(stored.iv);
    const ciphertext = base64ToBuffer(stored.ciphertext);
    const key = await deriveKey(masterPassword, salt);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv } as any,
      key,
      ciphertext as unknown as BufferSource
    );
    const dec = new TextDecoder();
    return dec.decode(plainBuffer);
  } catch {
    return null;
  }
}

/** Delete a stored credential */
export async function deleteCredential(id: string): Promise<void> {
  await chrome.storage.local.remove(id);
}
