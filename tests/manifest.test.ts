import { readFileSync } from 'fs';
import path from 'path';

test('content script matches only https URLs', () => {
  const manifestPath = path.resolve(__dirname, '../manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  expect(manifest.content_scripts[0].matches).toEqual(['https://*/*']);
});
