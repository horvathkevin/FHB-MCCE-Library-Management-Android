import { defineConfig } from 'mobilewright';

export default defineConfig({
  platform: 'android',
  bundleId: 'com.fhb.libraryandroid',
  timeout: 120_000,
  testDir: 'e2e',
  testMatch: '**/*.test.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: 1,
  use: {
    actionTimeout: 90_000,
  },
  expect: {
    timeout: 10_000,
  },
});
