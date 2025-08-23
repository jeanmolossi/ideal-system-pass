import { formatCredential } from '../src/utils/formatCredential';

test('credential without category shows only service name', () => {
  expect(formatCredential('Service', '')).toBe('Service');
});
