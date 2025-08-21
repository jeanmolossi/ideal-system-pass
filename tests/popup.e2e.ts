import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure popup page renders and has expected title
test('popup page loads', async ({ page }) => {
  const popupPath = path.resolve(
    __dirname,
    '../dist/src/popup/index.html'
  );
  await page.goto(`file://${popupPath}`);
  await expect(page).toHaveTitle('Popup');
});
