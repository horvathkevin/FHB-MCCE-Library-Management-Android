import { test, expect } from '@mobilewright/test';
import { reseed } from './helpers/seed';

const APP = 'com.fhb.libraryandroid';

test.use({ bundleId: APP });

let seeded = false;

test.beforeEach(async ({ device, screen, bundleId }) => {
  await device.terminateApp(bundleId).catch(() => {});
  await device.launchApp(bundleId);
  await screen.getByTestId('books-list').waitFor({ state: 'visible' });
  if (!seeded) {
    await reseed(screen);
    seeded = true;
  }
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

  await expect(screen.getByText('PENDING')).toBeVisible();
  await expect(screen.getByTestId('reservation-item-1')).toBeVisible();
  await expect(screen.getByTestId('reservation-item-2')).toBeVisible();
});

test('cancelled reservations are hidden in pending filter', async ({ screen }) => {
  // First cancel reservation 1
  await screen.getByTestId('cancel-reservation-button-1').tap();
  await screen.getByText('YES').tap();

  // Switch to pending filter — reservation 1 should not appear
  await screen.getByTestId('reservations-filter-pending').tap();
  await expect(screen.getByTestId('reservation-item-1')).not.toBeVisible();
});

test('can cancel a pending reservation', async ({ screen }) => {
  // Use reservation 2 — reservation 1 was already cancelled in the previous test
  await screen.getByTestId('cancel-reservation-button-2').tap();
  await screen.getByText('YES').tap();

  // Switch to cancelled filter and confirm
  await screen.getByTestId('reservations-filter-cancelled').tap();
  await expect(screen.getByText('CANCELLED')).toBeVisible();
});

test('placing a reservation from book detail creates a pending entry', async ({ screen }) => {
  // Navigate to a book and reserve it
  await screen.getByLabel('tab-books').tap();
  await screen.getByTestId('book-item-4').tap(); // book 4 (The Catcher in the Rye) — not fully borrowed
  await screen.getByTestId('reserve-button-4').tap();
  await screen.getByText('ALICE MÜLLER').tap();
  await screen.getByText('OK').tap();

  // Navigate to reservations and verify new entry
  await screen.getByLabel('tab-reservations').tap();
  await screen.getByTestId('reservations-filter-pending').tap();
  await expect(screen.getByText('The Catcher in the Rye')).toBeVisible();
});


test('max 3 reservations per book is enforced', async ({ screen }) => {
  // Book 1 has 0 pending reservations at this point (seed reservation was cancelled in test 3).
  // Fill all 3 slots, then verify a 4th attempt is rejected.
  await screen.getByLabel('tab-books').tap();
  await screen.getByTestId('book-item-1').tap();

  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByText('ALICE MÜLLER').tap();
  await screen.getByText('OK').tap();

  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByText('BOB SCHMIDT').tap();
  await screen.getByText('OK').tap();

  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByText('CLARA WEBER').tap();
  await screen.getByText('OK').tap();

  // 4th reservation should be rejected (max 3 already filled: Alice + Bob + Clara)
  await screen.getByTestId('reserve-button-1').tap();
  await screen.getByText('ALICE MÜLLER').tap();
  // Error alert should appear
  await expect(screen.getByText('OK')).toBeVisible();
});
