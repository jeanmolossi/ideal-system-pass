import React, { useState, useEffect, useRef } from 'react';
import PasswordGenerator from './PasswordGenerator';
import {
  saveCredential,
  getCredential,
  deleteCredential,
  setMasterPassword,
  verifyMasterPassword,
  changeMasterPassword,
  resetVault,
  isMasterPasswordSet
} from '../storage/secureStore';
import { inferServiceInfo } from '../utils/inferServiceInfo';
import { formatCredential } from '../utils/formatCredential';

declare const chrome: any;

type VaultEntry = {
  id: string;
  username: string;
  category: string;
  url: string;
};

export default function App() {
  const [master, setMaster] = useState('');
  const [newMaster, setNewMaster] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [hasMaster, setHasMaster] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [showChange, setShowChange] = useState(false);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ id: '', username: '', password: '', category: '', url: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [copied, setCopied] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const startTimer = (duration: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setUnlocked(false);
      setMaster('');
      chrome.storage.local.remove('sessionExpiry');
    }, duration);
  };

  useEffect(() => {
    chrome.storage.local.get(['vaultIndex', 'categories', 'sessionExpiry'], (res: any) => {
      setEntries((res.vaultIndex || []).map((en: any) => ({ ...en, url: en.url || '' })));
      setCategories(res.categories || []);
      if (res.sessionExpiry && res.sessionExpiry > Date.now()) {
        setUnlocked(true);
        startTimer(res.sessionExpiry - Date.now());
      } else {
        chrome.storage.local.remove('sessionExpiry');
      }
    });
    isMasterPasswordSet().then(setHasMaster);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (unlocked) {
      chrome.storage.local.get(['vaultIndex', 'categories'], (res: any) => {
        setEntries((res.vaultIndex || []).map((en: any) => ({ ...en, url: en.url || '' })));
        setCategories(res.categories || []);
      });
    }
  }, [unlocked]);

  useEffect(() => {
    if (unlocked) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const title = tabs[0]?.title || '';
        const url = tabs[0]?.url || '';
        const info = inferServiceInfo(title, categories);
        setForm((prev) => ({ ...prev, id: info.id, category: info.category, url }));
      });
    }
  }, [unlocked, categories]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyMasterPassword(master)) {
      setUnlocked(true);
      setError('');
      const expiry = Date.now() + 15 * 60 * 1000;
      chrome.storage.local.set({ sessionExpiry: expiry });
      startTimer(15 * 60 * 1000);
    } else {
      setError('Invalid password');
    }
  };

  const createMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    await setMasterPassword(master);
    setUnlocked(true);
    setHasMaster(true);
    const expiry = Date.now() + 15 * 60 * 1000;
    chrome.storage.local.set({ sessionExpiry: expiry });
    startTimer(15 * 60 * 1000);
  };

  const changeMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await changeMasterPassword(master, newMaster);
    if (ok) {
      setMaster(newMaster);
      setNewMaster('');
      setShowChange(false);
      setError('');
    } else {
      setError('Wrong current password');
    }
  };

  const resetAll = async () => {
    await resetVault();
    setUnlocked(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    chrome.storage.local.remove('sessionExpiry');
    setHasMaster(false);
    setEntries([]);
    setCategories([]);
    setMaster('');
    setNewMaster('');
  };

  const addOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = JSON.stringify({ username: form.username, password: form.password, category: form.category, url: form.url });
    await saveCredential(master, form.id, payload);
    const updated = entries
      .filter((en) => en.id !== form.id)
      .concat({ id: form.id, username: form.username, category: form.category, url: form.url });
    setEntries(updated);
    chrome.storage.local.set({ vaultIndex: updated });
    setForm({ id: '', username: '', password: '', category: '', url: '' });
  };

  const remove = async (id: string) => {
    await deleteCredential(id);
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    chrome.storage.local.set({ vaultIndex: updated });
  };

  const fillForm = async (id: string) => {
    const stored = await getCredential(master, id);
    if (stored) {
      const obj = JSON.parse(stored);
      setForm({ id, username: obj.username, password: obj.password, category: obj.category, url: obj.url || '' });
    }
  };

  const copyUsername = async (username: string, id: string) => {
    await navigator.clipboard.writeText(username);
    setCopied(`user-${id}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyPassword = async (id: string) => {
    const stored = await getCredential(master, id);
    if (stored) {
      const obj = JSON.parse(stored);
      await navigator.clipboard.writeText(obj.password);
      setCopied(`pass-${id}`);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const filtered = entries.filter((e) => e.id.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 w-[360px] max-w-full bg-gray-100 text-gray-900">
      <div className="rounded-lg bg-white shadow-sm p-4 transition-shadow hover:shadow">
      {hasMaster === false && !unlocked ? (
        <form onSubmit={createMaster} className="space-y-2">
            <label className="block">
              <span className="text-sm">Create Master Password</span>
              <input
                type="password"
                value={master}
                onChange={(e) => setMaster(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                aria-label="new master password"
              />
            </label>
          <button
            type="submit"
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded shadow-sm hover:shadow transition-colors hover:brightness-110 focus:ring active:scale-95"
          >
            Set Password
          </button>
        </form>
      ) : !unlocked ? (
        <form onSubmit={unlock} className="space-y-2">
            <label className="block">
              <span className="text-sm">Master Password</span>
              <input
                type="password"
                value={master}
                onChange={(e) => setMaster(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                aria-label="master password"
              />
            </label>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm hover:shadow transition-colors hover:brightness-110 focus:ring active:scale-95"
          >
            Unlock
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between">
            <button
              onClick={() => setShowChange(!showChange)}
              className="text-sm underline transition-colors hover:brightness-110 focus:ring active:scale-95"
            >
              {showChange ? 'Cancel' : 'Change Password'}
            </button>
            <button
              onClick={resetAll}
              className="text-sm text-red-600 underline transition-colors hover:brightness-110 focus:ring active:scale-95"
            >
              Reset Vault
            </button>
          </div>
          {showChange && (
            <form onSubmit={changeMaster} className="space-y-1">
              <input
                type="password"
                placeholder="Current"
                value={master}
                onChange={(e) => setMaster(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                aria-label="current master password"
              />
              <input
                type="password"
                placeholder="New"
                value={newMaster}
                onChange={(e) => setNewMaster(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                aria-label="new master password"
              />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm hover:shadow transition-colors hover:brightness-110 focus:ring active:scale-95"
            >
              Change
            </button>
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </form>
          )}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 transition-colors ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600`}
            >
              Credenciais
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 transition-colors ${activeTab === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600`}
            >
              Nova
            </button>
          </div>
          {activeTab === 'list' && (
            <>
              <div>
                <label className="block">
                  <span className="text-sm">Search</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                    aria-label="search credentials"
                  />
                </label>
              </div>
                <ul>
                  {filtered.map((e) => (
                    <li
                      key={e.id}
                      tabIndex={0}
                      className="mb-1 p-2 rounded transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                    >
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => chrome.tabs.create({ url: e.url })}
                          className="text-left underline flex-1 transition-colors hover:brightness-110 focus:ring active:scale-95"
                        >
                          {formatCredential(e.id, e.category)}
                        </button>
                        <div className="flex space-x-2 ml-2">
                          <button
                            onClick={() => {
                              fillForm(e.id);
                              setActiveTab('add');
                            }}
                            aria-label={`edit ${e.id}`}
                            className="text-blue-500 transition-colors hover:brightness-110 focus:ring active:scale-95"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => remove(e.id)}
                            aria-label={`delete ${e.id}`}
                            className="text-red-500 transition-colors hover:brightness-110 focus:ring active:scale-95"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={() => copyUsername(e.username, e.id)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                        >
                          {copied === `user-${e.id}` ? 'Copiado!' : 'Copiar usuário'}
                        </button>
                        <button
                          onClick={() => copyPassword(e.id)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                        >
                          {copied === `pass-${e.id}` ? 'Copiado!' : 'Copiar senha'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
            </>
          )}
          {activeTab === 'add' && (
            <form onSubmit={addOrUpdate} className="space-y-1">
              <input
                placeholder="Service"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                aria-label="service"
              />
              <input
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                aria-label="username"
              />
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <input
                    placeholder="Password"
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 flex-1 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                    aria-label="password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? 'hide password' : 'show password'}
                    className="ml-1 text-sm underline transition-colors hover:brightness-110 focus:ring active:scale-95"
                  >
                    {showPwd ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div>
                  <PasswordGenerator onGenerate={(pwd) => setForm({ ...form, password: pwd })} />
                </div>
              </div>
              <div>
                <input
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 border-opacity-70 rounded bg-gray-50 transition-all hover:bg-gray-100 focus:ring animate-[fade-in_.2s_ease-in]"
                  aria-label="category"
                  list="category-list"
                />
                <datalist id="category-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded shadow-sm hover:shadow transition-colors hover:brightness-110 focus:ring active:scale-95"
              >
                Save
              </button>
            </form>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
