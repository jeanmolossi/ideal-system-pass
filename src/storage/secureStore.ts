declare const chrome: any;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufferToBase64(buffer: ArrayBuffer): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  } else {
    return Buffer.from(buffer).toString('base64');
  }
}

function base64ToBuffer(base64: string): ArrayBuffer {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } else {
    return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
  }
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function storageSet(obj: any): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(obj, () => {
      const err = chrome.runtime && (chrome.runtime as any).lastError;
      if (err) reject(err);
      else resolve();
    });
  });
}

function storageGet(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result: any) => resolve(result[key]));
  });
}

function storageRemove(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => resolve());
  });
}

export async function saveCredential(masterPassword: string, key: string, value: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await deriveKey(masterPassword, salt.buffer);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(value)
  );
  const payload = {
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(ciphertext)
  };
  await storageSet({ [key]: payload });
}

export async function getCredential(masterPassword: string, key: string): Promise<string | null> {
  const stored = await storageGet(key);
  if (!stored) return null;
  try {
    const salt = new Uint8Array(base64ToBuffer(stored.salt));
    const iv = new Uint8Array(base64ToBuffer(stored.iv));
    const data = base64ToBuffer(stored.data);
    const cryptoKey = await deriveKey(masterPassword, salt.buffer);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    return decoder.decode(plainBuffer);
  } catch {
    return null;
  }
}

export async function deleteCredential(key: string): Promise<void> {
  await storageRemove(key);
}

export default { saveCredential, getCredential, deleteCredential };
