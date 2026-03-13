import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'playwright.idw.spec.js',
  timeout: 30000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true
  },
  webServer: {
    command: 'python3 -m http.server 4174',
    port: 4174,
    reuseExistingServer: true,
    timeout: 120000
  }
});
