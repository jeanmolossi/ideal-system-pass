import React from 'react';

interface Props {
  onGenerate: (pwd: string) => void;
}

export default function PasswordGenerator({ onGenerate }: Props) {
  const generate = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onGenerate(pwd);
  };

  return (
    <button
      type="button"
      onClick={generate}
      aria-label="generate password"
      className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
    >
      Generate
    </button>
  );
}
