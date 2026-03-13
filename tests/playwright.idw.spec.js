import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEAFLET_JS = fs.readFileSync(path.join(__dirname, '../../node_modules/leaflet/dist/leaflet.js'), 'utf8');
const LEAFLET_CSS = fs.readFileSync(path.join(__dirname, '../../node_modules/leaflet/dist/leaflet.css'), 'utf8');

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5f2xwAAAAASUVORK5CYII=',
  'base64'
);

test.beforeEach(async ({ page }) => {
  await page.route('**/leaflet@1.9.4/dist/leaflet.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: LEAFLET_JS
    });
  });

  await page.route('**/leaflet@1.9.4/dist/leaflet.css', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: LEAFLET_CSS
    });
  });

  await page.route('**://*.tile.openstreetmap.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: ONE_PIXEL_PNG
    });
  });

  await page.route('**://*.tile.openstreetmap.fr/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: ONE_PIXEL_PNG
    });
  });
});

test('renders IDW map and supports query modes', async ({ page }) => {
  await page.goto('/?contour=yes');

  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#status')).toContainText('Live', { timeout: 10000 });
  await expect(page.locator('.idw-contour-layer')).toBeVisible();

  await page.goto('/?notice=no&humidity=yes&www=yes');

  await expect(page.locator('#notice-panel')).toBeHidden();
  await expect(page.locator('#mode-chips')).toContainText('humidity: yes');
  await expect(page.locator('#mode-chips')).toContainText('www: yes');
});
