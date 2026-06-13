import { defineConfig } from 'mobilewright';

export default defineConfig({
  // Auto-discovers any booted Android emulator — no specific device targeted
  bundleId: 'com.fhb.libraryandroid',
  timeout: 15_000,
  testDir: 'e2e',
  testMatch: '**/*.test.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: 1,
});
