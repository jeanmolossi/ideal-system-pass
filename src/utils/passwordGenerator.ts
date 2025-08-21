export type Complexity = 'simple' | 'medium' | 'strong';

export interface PasswordOptions {
  length?: number;
  complexity?: Complexity;
  includeLowercase?: boolean;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?';

const PRESETS: Record<Complexity, Required<Omit<PasswordOptions, 'length' | 'complexity'>>> = {
  simple: { includeLowercase: true, includeUppercase: false, includeNumbers: false, includeSymbols: false },
  medium: { includeLowercase: true, includeUppercase: true, includeNumbers: true, includeSymbols: false },
  strong: { includeLowercase: true, includeUppercase: true, includeNumbers: true, includeSymbols: true }
};

export function generatePassword(options: PasswordOptions = {}): string {
  const { length = 12, complexity = 'medium' } = options;
  const preset = PRESETS[complexity];
  const settings = {
    includeLowercase: options.includeLowercase ?? preset.includeLowercase,
    includeUppercase: options.includeUppercase ?? preset.includeUppercase,
    includeNumbers: options.includeNumbers ?? preset.includeNumbers,
    includeSymbols: options.includeSymbols ?? preset.includeSymbols
  };

  const sets: string[] = [];
  if (settings.includeLowercase) sets.push(LOWER);
  if (settings.includeUppercase) sets.push(UPPER);
  if (settings.includeNumbers) sets.push(NUMBERS);
  if (settings.includeSymbols) sets.push(SYMBOLS);

  if (!sets.length) throw new Error('No character sets selected');

  // Ensure at least one character from each selected set
  const required = sets.map((s) => s[Math.floor(Math.random() * s.length)]);
  const remainingLength = Math.max(length - required.length, 0);

  const allChars = sets.join('');
  let password = '';
  const array = new Uint32Array(remainingLength);
  crypto.getRandomValues(array);
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[array[i] % allChars.length];
  }

  // Insert required characters at random positions
  required.forEach((ch) => {
    const pos = Math.floor(Math.random() * (password.length + 1));
    password = password.slice(0, pos) + ch + password.slice(pos);
  });

  return password;
}
