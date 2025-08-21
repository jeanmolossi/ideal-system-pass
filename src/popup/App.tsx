import React, { useState, useEffect } from 'react';
import { saveCredential, getCredential, deleteCredential } from '../storage/secureStore';

declare const chrome: any;

type VaultEntry = {
  id: string;
  username: string;
  category: string;
};

export default function App() {
  const [master, setMaster] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ id: '', username: '', password: '', category: '' });

  useEffect(() => {
    if (unlocked) {
      chrome.storage.local.get(['vaultIndex', 'categories'], (res: any) => {
        setEntries(res.vaultIndex || []);
        setCategories(res.categories || []);
      });
    }
  }, [unlocked]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocked(true);
  };

  const addOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = JSON.stringify({ username: form.username, password: form.password, category: form.category });
    await saveCredential(master, form.id, payload);
    const updated = entries.filter((en) => en.id !== form.id).concat({ id: form.id, username: form.username, category: form.category });
    setEntries(updated);
    chrome.storage.local.set({ vaultIndex: updated });
    setForm({ id: '', username: '', password: '', category: '' });
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
      setForm({ id, username: obj.username, password: obj.password, category: obj.category });
    }
  };

  const filtered = entries.filter((e) => e.id.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 w-80 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {!unlocked ? (
        <form onSubmit={unlock} className="space-y-2">
          <label className="block">
            <span className="text-sm">Master Password</span>
            <input
              type="password"
              value={master}
              onChange={(e) => setMaster(e.target.value)}
              className="w-full p-1 border rounded"
              aria-label="master password"
            />
          </label>
          <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">Unlock</button>
        </form>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block">
              <span className="text-sm">Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-1 border rounded"
                aria-label="search credentials"
              />
            </label>
          </div>
          <ul>
            {filtered.map((e) => (
              <li key={e.id} className="flex justify-between items-center mb-1">
                <button onClick={() => fillForm(e.id)} className="text-left underline flex-1">
                  {e.id} ({e.category})
                </button>
                <button onClick={() => remove(e.id)} aria-label={`delete ${e.id}`} className="ml-2 text-red-500">
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addOrUpdate} className="space-y-1">
            <input
              placeholder="Service"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full p-1 border rounded"
              aria-label="service"
            />
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-1 border rounded"
              aria-label="username"
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-1 border rounded"
              aria-label="password"
            />
            <div>
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-1 border rounded"
                aria-label="category"
                list="category-list"
              />
              <datalist id="category-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
