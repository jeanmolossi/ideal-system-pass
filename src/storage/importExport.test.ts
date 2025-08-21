import { importFromCSV, importFromJSON, exportEncrypted } from './importExport';
import { getCredential } from './secureStore';
import { webcrypto } from 'crypto';

declare const chrome: any;

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

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
          store.forEach((v, k) => { result[k] = v; });
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

describe('importExport', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  const master = 'master123';

  it('imports from CSV and JSON and exports encrypted data', async () => {
    await importFromCSV(master, 'id1,cred1\n');
    await importFromJSON(master, JSON.stringify([{ id: 'id2', credential: 'cred2' }]));

    expect(await getCredential(master, 'id1')).toBe('cred1');
    expect(await getCredential(master, 'id2')).toBe('cred2');

    const exported = await exportEncrypted();
    expect(typeof exported).toBe('string');
    expect(exported).not.toContain('cred1');
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('id1');
  });
});
