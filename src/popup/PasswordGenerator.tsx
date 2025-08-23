import React, { useState } from 'react';
import { generatePassword, type Complexity } from '../utils/passwordGenerator';

interface Props {
  onGenerate: (pwd: string) => void;
}

export default function PasswordGenerator({ onGenerate }: Props) {
  const [length, setLength] = useState(12);
  const [complexity, setComplexity] = useState<Complexity>('medium');
  const [generated, setGenerated] = useState('');

  const generate = () => {
    const pwd = generatePassword({ length, complexity });
    setGenerated(pwd);
    onGenerate(pwd);
  };

  const copy = async () => {
    if (generated) {
      await navigator.clipboard.writeText(generated);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min={4}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-20 px-2 py-1 border border-gray-300 border-opacity-70 rounded text-sm bg-gray-50"
          aria-label="password length"
        />
        <select
          value={complexity}
          onChange={(e) => setComplexity(e.target.value as Complexity)}
          className="flex-1 px-2 py-1 border border-gray-300 border-opacity-70 rounded text-sm bg-gray-50"
          aria-label="password complexity"
        >
          <option value="simple">Simple</option>
          <option value="medium">Medium</option>
          <option value="strong">Strong</option>
        </select>
        <button
          type="button"
          onClick={generate}
          aria-label="generate password"
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm hover:shadow transition-colors hover:brightness-110 focus:ring active:scale-95"
        >
          Generate
        </button>
      </div>
      {generated && (
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono break-all">{generated}</span>
          <button
            type="button"
            onClick={copy}
            aria-label="copy password"
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded shadow-sm hover:shadow transition-colors hover:brightness-110 focus:ring active:scale-95"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

