import { saveCredential, getCredential, deleteCredential } from '../src/storage/secureStore';

declare const chrome: any;

describe('secureStore', () => {
  const master = 'super-secret';
  let store: Record<string, any> = {};

  beforeEach(() => {
    store = {};
    (global as any).chrome = {
      storage: {
        local: {
          set: (obj: any, cb: () => void) => { Object.assign(store, obj); cb(); },
          get: (key: string, cb: (res: any) => void) => { cb({ [key]: store[key] }); },
          remove: (key: string, cb: () => void) => { delete store[key]; cb(); }
        }
      },
      runtime: {}
    };
  });

  test('saves and retrieves credentials', async () => {
    await saveCredential(master, 'email', 'my-password');
    const plain = await getCredential(master, 'email');
    expect(plain).toBe('my-password');
  });

  test('returns null on tampered data', async () => {
    await saveCredential(master, 'email', 'my-password');
    const entry = store['email'];
    entry.data = entry.data.slice(0, -2) + 'AA';
    const plain = await getCredential(master, 'email');
    expect(plain).toBeNull();
  });

  test('returns null on wrong password', async () => {
    await saveCredential(master, 'email', 'my-password');
    const plain = await getCredential('wrong', 'email');
    expect(plain).toBeNull();
  });

  test('deletes credential', async () => {
    await saveCredential(master, 'email', 'my-password');
    await deleteCredential('email');
    const plain = await getCredential(master, 'email');
    expect(plain).toBeNull();
  });
});
