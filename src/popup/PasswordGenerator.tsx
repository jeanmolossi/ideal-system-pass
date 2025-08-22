import React, { useState } from 'react';
import { generatePassword, type Complexity } from '../utils/passwordGenerator';

interface Props {
  onGenerate: (pwd: string) => void;
}

export default function PasswordGenerator({ onGenerate }: Props) {
  const [length, setLength] = useState(12);
  const [complexity, setComplexity] = useState<Complexity>('medium');

  const generate = () => {
    const pwd = generatePassword({ length, complexity });
    onGenerate(pwd);
  };

  return (
    <div className="ml-2 flex items-center space-x-1">
      <input
        type="number"
        min={4}
        max={64}
        value={length}
        onChange={(e) => setLength(Number(e.target.value))}
        className="w-12 p-1 border rounded text-sm"
        aria-label="password length"
      />
      <select
        value={complexity}
        onChange={(e) => setComplexity(e.target.value as Complexity)}
        className="p-1 border rounded text-sm"
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
        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
      >
        Generate
      </button>
    </div>
  );
}

