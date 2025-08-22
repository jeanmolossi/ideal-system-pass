import {
  saveCredential,
  getCredential,
  deleteCredential,
  listCredentials,
  setMasterPassword,
  verifyMasterPassword,
  changeMasterPassword,
  resetVault,
  isMasterPasswordSet
} from './secureStore';
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
      async get(keys: string[] | null) {
        const result: Record<string, unknown> = {};
        if (Array.isArray(keys)) {
          keys.forEach((k) => {
            result[k] = store.get(k);
          });
        } else {
          store.forEach((v, k) => {
            result[k] = v;
          });
        }
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
    expect(stored.tag).toBeDefined();
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

  it('lists stored credential ids', async () => {
    const master = 'master123';
    await saveCredential(master, 'id1', 'cred1');
    await saveCredential(master, 'id2', 'cred2');
    const list = await listCredentials();
    expect(list).toEqual(expect.arrayContaining(['id1', 'id2']));
  });

  it('creates and verifies master password', async () => {
    await setMasterPassword('a');
    expect(await verifyMasterPassword('a')).toBe(true);
    expect(await verifyMasterPassword('b')).toBe(false);
  });

  it('changes master password and reencrypts data', async () => {
    await setMasterPassword('old');
    await saveCredential('old', 'id', 'cred');
    const changed = await changeMasterPassword('old', 'new');
    expect(changed).toBe(true);
    expect(await verifyMasterPassword('new')).toBe(true);
    expect(await getCredential('new', 'id')).toBe('cred');
    expect(await getCredential('old', 'id')).toBeNull();
  });

  it('resets vault deleting all data', async () => {
    await setMasterPassword('m');
    await saveCredential('m', 'id', 'cred');
    await resetVault();
    expect(await isMasterPasswordSet()).toBe(false);
    expect(await getCredential('m', 'id')).toBeNull();
  });
});
