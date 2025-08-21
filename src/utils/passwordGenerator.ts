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

  let chars = '';
  if (settings.includeLowercase) chars += LOWER;
  if (settings.includeUppercase) chars += UPPER;
  if (settings.includeNumbers) chars += NUMBERS;
  if (settings.includeSymbols) chars += SYMBOLS;

  if (!chars) throw new Error('No character sets selected');

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}
