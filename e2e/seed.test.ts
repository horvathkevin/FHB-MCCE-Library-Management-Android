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

test('re-seed restores the original 10 books', async ({ screen }) => {
  // Add an extra book first
  await screen.getByTestId('add-book-button').tap();
  await screen.getByTestId('add-book-isbn-input').fill('9780000000099');
  await screen.getByTestId('add-book-title-input').fill('Extra Book');
  await screen.getByTestId('add-book-author-input').fill('Extra Author');
  await screen.getByTestId('add-book-genre-input').fill('Fiction');
  await screen.getByTestId('add-book-year-input').fill('2024');
  await screen.getByTestId('add-book-submit-button').tap();
  await expect(screen.getByText('Extra Book')).toBeVisible();

  // Re-seed
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByRole('button', { name: 'Reset & Reseed' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Extra book should be gone
  await screen.getByLabel('tab-books').tap();
  await expect(screen.getByText('Extra Book')).not.toBeVisible();
  await expect(screen.getByText('1984')).toBeVisible();
});

test('re-seed restores original member count', async ({ screen }) => {
  // Add a new member
  await screen.getByLabel('tab-members').tap();
  await screen.getByTestId('add-member-button').tap();
  await screen.getByTestId('add-member-name-input').fill('Temp Member');
  await screen.getByTestId('add-member-email-input').fill('temp@example.com');
  await screen.getByTestId('add-member-submit-button').tap();
  await expect(screen.getByText('Temp Member')).toBeVisible();

  // Re-seed
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByRole('button', { name: 'Reset & Reseed' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  await screen.getByLabel('tab-members').tap();
  await expect(screen.getByText('Temp Member')).not.toBeVisible();
  await expect(screen.getByText('Alice Müller')).toBeVisible();
});

test('cancelling the re-seed dialog keeps existing data', async ({ screen }) => {
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  // Cancel instead of confirming
  await screen.getByRole('button', { name: 'Cancel' }).tap();

  // Data should be untouched
  await screen.getByLabel('tab-books').tap();
  await expect(screen.getByTestId('books-list')).toBeVisible();
  await expect(screen.getByText('1984')).toBeVisible();
});

test('re-seeding twice produces identical state', async ({ screen }) => {
  // First seed
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByRole('button', { name: 'Reset & Reseed' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  await screen.getByLabel('tab-more').tap();
  const loansText1 = await screen.getByTestId('more-reports-button').getText();

  // Second seed
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByRole('button', { name: 'Reset & Reseed' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Reports should show same numbers both times
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('more-reports-button').tap();
  await screen.getByTestId('reports-screen').waitFor({ state: 'visible' });

  const booksText = await screen.getByTestId('stat-total-books').getText();
  expect(parseInt(booksText)).toBe(10);

  const membersText = await screen.getByTestId('stat-total-members').getText();
  expect(parseInt(membersText)).toBe(8);
});
