import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

declare const chrome: any;

export default function Options() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    chrome.storage.local.get(['categories'], (res: any) => {
      setCategories(res.categories || []);
    });
  }, []);

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat) return;
    const updated = [...categories, newCat];
    chrome.storage.local.set({ categories: updated });
    setCategories(updated);
    setNewCat('');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <div className="flex justify-end mb-2">
        <ThemeToggle />
      </div>
      <h1 className="text-xl mb-2">Categories</h1>
      <ul className="mb-2 list-disc list-inside">
        {categories.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <form onSubmit={addCategory} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">New category</span>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="w-full p-1 border rounded"
            aria-label="new category"
          />
        </label>
        <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">
          Add
        </button>
      </form>
    </div>
  );
}
