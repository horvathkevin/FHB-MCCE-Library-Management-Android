import { test, expect } from '@mobilewright/test';

const APP = 'com.fhb.libraryandroid';

test.use({ bundleId: APP });

// Dedicated tests for the re-seed feature itself

test.beforeEach(async ({ device, screen, bundleId }) => {
  await device.terminateApp(bundleId).catch(() => {});
  await device.launchApp(bundleId);
  await screen.getByTestId('books-list').waitFor({ state: 'visible' });
});

test('seed button is visible in More tab', async ({ screen }) => {
  await screen.getByLabel('tab-more').tap();
  await expect(screen.getByTestId('seed-database-button')).toBeVisible();
});



test('cancelling the re-seed dialog keeps existing data', async ({ screen }) => {
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  // Cancel instead of confirming
  await screen.getByText('CANCEL').tap();

  // Data should be untouched
  await screen.getByLabel('tab-books').tap();
  await expect(screen.getByTestId('books-list')).toBeVisible();
  await expect(screen.getByText('1984')).toBeVisible();
});

test('re-seeding twice produces identical state', async ({ screen }) => {
  // First seed
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByText('RESET & RESEED').tap();
  await screen.getByText('OK').tap();

  // Second seed
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByText('RESET & RESEED').tap();
  await screen.getByText('OK').tap();

  // Reports should show consistent counts
  await screen.getByTestId('more-reports-button').tap();
  await screen.getByTestId('reports-screen').waitFor({ state: 'visible' });

  // Seed always produces 10 books and 8 members
  await expect(screen.getByText('10')).toBeVisible();
  await expect(screen.getByText('8')).toBeVisible();
});
