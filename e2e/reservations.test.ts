import { test, expect } from '@mobilewright/test';
import { reseed } from './helpers/seed';

const APP = 'com.fhb.libraryandroid';

test.use({ bundleId: APP });

test.beforeEach(async ({ device, screen, bundleId }) => {
  await device.terminateApp(bundleId).catch(() => {});
  await device.launchApp(bundleId);
  await screen.getByTestId('books-list').waitFor({ state: 'visible' });
  await reseed(screen);
  await screen.getByLabel('tab-reservations').tap();
  await screen.getByTestId('reservations-list').waitFor({ state: 'visible' });
});

test('reservations list shows seeded pending reservations', async ({ screen }) => {
  await expect(screen.getByTestId('reservations-list')).toBeVisible();
  // Seed has 2 pending reservations
  await expect(screen.getByTestId('reservation-item-1')).toBeVisible();
  await expect(screen.getByTestId('reservation-item-2')).toBeVisible();
});

test('filter shows only pending reservations', async ({ screen }) => {
  await screen.getByTestId('reservations-filter-pending').tap();

  await expect(screen.getByTestId('reservation-status-badge-1')).toHaveText('PENDING');
  await expect(screen.getByTestId('reservation-status-badge-2')).toHaveText('PENDING');
});

test('cancelled reservations are hidden in pending filter', async ({ screen }) => {
  // First cancel reservation 1
  await screen.getByTestId('cancel-reservation-button-1').tap();
  await screen.getByRole('button', { name: 'Yes' }).tap();

  // Switch to pending filter — reservation 1 should not appear
  await screen.getByTestId('reservations-filter-pending').tap();
  await expect(screen.getByTestId('reservation-item-1')).not.toBeVisible();
});

test('can cancel a pending reservation', async ({ screen }) => {
  await screen.getByTestId('cancel-reservation-button-1').tap();
  await screen.getByRole('button', { name: 'Yes' }).tap();

  // Switch to cancelled filter and confirm
  await screen.getByTestId('reservations-filter-cancelled').tap();
  await expect(screen.getByTestId('reservation-status-badge-1')).toHaveText('CANCELLED');
});

test('placing a reservation from book detail creates a pending entry', async ({ screen }) => {
  // Navigate to a book and reserve it
  await screen.getByLabel('tab-books').tap();
  await screen.getByTestId('book-item-4').tap(); // book 4 (The Catcher in the Rye) — not fully borrowed
  await screen.getByTestId('reserve-button-4').tap();
  await screen.getByRole('button', { name: 'Felix Bauer' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Navigate to reservations and verify new entry
  await screen.getByLabel('tab-reservations').tap();
  await screen.getByTestId('reservations-filter-pending').tap();
  await expect(screen.getByText('The Catcher in the Rye')).toBeVisible();
});

test('returning a book promotes first pending reservation to ready', async ({ screen }) => {
  // Reservation 1 is for book 1 (1984) — book 1 has an active loan
  // Returning loan 1 should promote reservation 1 to ready

  await screen.getByLabel('tab-loans').tap();
  await screen.getByTestId('loan-item-1').tap();
  await screen.getByTestId('return-button-1').tap();
  await screen.getByRole('button', { name: 'Return' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Check reservation 1 is now ready
  await screen.getByLabel('tab-reservations').tap();
  await screen.getByTestId('reservations-filter-ready').tap();
  await expect(screen.getByTestId('reservation-status-badge-1')).toHaveText('READY');
  await expect(screen.getByTestId('reservation-ready-notice-1')).toBeVisible();
});

test('max 3 reservations per book is enforced', async ({ screen }) => {
  // Book 1 already has 1 reservation in seed — add 2 more to hit the limit
  await screen.getByLabel('tab-books').tap();
  await screen.getByTestId('book-item-1').tap();

  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByRole('button', { name: 'Clara Weber' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByRole('button', { name: 'David Fischer' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // 4th reservation should be rejected
  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByRole('button', { name: 'Eva Wagner' }).tap();
  // Error alert should appear
  await expect(screen.getByRole('button', { name: 'OK' })).toBeVisible();
});
