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
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('more-reports-button').tap();
  await screen.getByTestId('reports-screen').waitFor({ state: 'visible' });
});

test('reports screen shows all stat cards', async ({ screen }) => {
  await expect(screen.getByTestId('stat-total-books')).toBeVisible();
  await expect(screen.getByTestId('stat-total-members')).toBeVisible();
  await expect(screen.getByTestId('stat-active-loans')).toBeVisible();
  await expect(screen.getByTestId('stat-overdue-loans')).toBeVisible();
  await expect(screen.getByTestId('stat-returned-loans')).toBeVisible();
  await expect(screen.getByTestId('stat-total-fees')).toBeVisible();
  await expect(screen.getByTestId('stat-pending-reservations')).toBeVisible();
  await expect(screen.getByTestId('stat-ready-reservations')).toBeVisible();
});

test('total books stat matches seed data count', async ({ screen }) => {
  await expect(screen.getByTestId('stat-total-books')).toBeVisible();
  // Seed has 10 books — the value "10" appears in the stat card
  await expect(screen.getByText('10')).toBeVisible();
});

test('total members stat matches seed data count', async ({ screen }) => {
  await expect(screen.getByTestId('stat-total-members')).toBeVisible();
  // Seed has 8 members
  await expect(screen.getByText('8')).toBeVisible();
});

test('active loans stat reflects seeded loans', async ({ screen }) => {
  await expect(screen.getByTestId('stat-active-loans')).toBeVisible();
  // Seed has 3 active loans
  await expect(screen.getByText('3')).toBeVisible();
});

test('overdue loans stat reflects seeded overdue loans', async ({ screen }) => {
  await expect(screen.getByTestId('stat-overdue-loans')).toBeVisible();
  // Seed loan 3 is overdue — at least 1 overdue loan exists
  await expect(screen.getByText('1')).toBeVisible();
});

test('pending reservations stat reflects seeded reservations', async ({ screen }) => {
  await expect(screen.getByTestId('stat-pending-reservations')).toBeVisible();
  // Seed has 2 pending reservations
  await expect(screen.getByText('2')).toBeVisible();
});

test('most borrowed books section is visible', async ({ screen }) => {
  await expect(screen.getByTestId('top-borrowed-books')).toBeVisible();
  await expect(screen.getByTestId('top-book-0')).toBeVisible();
});

test('most active members section is visible', async ({ screen }) => {
  await expect(screen.getByTestId('most-active-members')).toBeVisible();
});

test('stats update after a new loan is created', async ({ screen }) => {
  // Seed: 3 active loans. Borrow one more → should become 4.
  await screen.getByLabel('tab-books').tap();
  await screen.getByTestId('book-item-4').tap();
  await screen.getByTestId('borrow-button-4').tap();
  await screen.getByText('ALICE MÜLLER').tap();
  await screen.getByText('OK').tap();

  // Return to reports — More tab was already on Reports from beforeEach,
  // so tapping tab-more restores that screen and useFocusEffect refreshes stats.
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('reports-screen').waitFor({ state: 'visible' });

  // Active loans should now be 4
  await expect(screen.getByText('4')).toBeVisible();
});
