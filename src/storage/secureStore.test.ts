import { saveCredential, getCredential, deleteCredential } from './secureStore';
import { webcrypto } from 'crypto';

declare const chrome: any;

// Ensure Web Crypto API is available in Jest environment
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

// Simple in-memory mock for chrome.storage.local
const store = new Map<string, any>();
(globalThis as any).chrome = {
  storage: {
    local: {
      async set(obj: Record<string, unknown>) {
        Object.entries(obj).forEach(([k, v]) => store.set(k, v));
      },
      async get(keys: string[]) {
        const result: Record<string, unknown> = {};
        keys.forEach((k) => {
          result[k] = store.get(k);
        });
        return result;
      },
      async remove(key: string) {
        store.delete(key);
      },
      async clear() {
        store.clear();
      }
    }
  }
};

describe('secureStore', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  it('saves and retrieves credentials with integrity', async () => {
    const master = 'master123';
    const id = 'service';
    const credential = 'secret';
    await saveCredential(master, id, credential);
    const stored = store.get(id);
    expect(stored.ciphertext).not.toContain(credential);
    const result = await getCredential(master, id);
    expect(result).toBe(credential);
  });

  it('returns null when using wrong master password', async () => {
    const master = 'master123';
    const id = 'service2';
    const credential = 'secret2';
    await saveCredential(master, id, credential);
    const result = await getCredential('wrong', id);
    expect(result).toBeNull();
  });

  it('deletes stored credentials', async () => {
    const master = 'master123';
    const id = 'service3';
    const credential = 'secret3';
    await saveCredential(master, id, credential);
    await deleteCredential(id);
    const result = await getCredential(master, id);
    expect(result).toBeNull();
  });
});
