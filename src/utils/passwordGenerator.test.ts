import { generatePassword } from './passwordGenerator';
import { webcrypto } from 'crypto';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

describe('passwordGenerator', () => {
  it('generates simple passwords with lowercase only', () => {
    const pwd = generatePassword({ length: 8, complexity: 'simple' });
    expect(pwd).toHaveLength(8);
    expect(pwd).toMatch(/^[a-z]+$/);
  });

  it('generates strong passwords with diverse characters', () => {
    const pwd = generatePassword({ length: 16, complexity: 'strong' });
    expect(pwd).toHaveLength(16);
    expect(/[A-Z]/.test(pwd)).toBeTruthy();
    expect(/[a-z]/.test(pwd)).toBeTruthy();
    expect(/[0-9]/.test(pwd)).toBeTruthy();
    expect(/[^A-Za-z0-9]/.test(pwd)).toBeTruthy();
  });
});
