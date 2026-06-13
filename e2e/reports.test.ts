import { test, expect } from '@mobilewright/test';
import { reseed } from './helpers/seed';

const APP = 'com.fhb.libraryandroid';

test.use({ bundleId: APP });

test.beforeEach(async ({ device, screen, bundleId }) => {
  await device.terminateApp(bundleId).catch(() => {});
  await device.launchApp(bundleId);
  await screen.getByTestId('books-list').waitFor({ state: 'visible' });
  await reseed(screen);
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
  const text = await screen.getByTestId('stat-total-books').getText();
  expect(parseInt(text)).toBe(10);
});

test('total members stat matches seed data count', async ({ screen }) => {
  const text = await screen.getByTestId('stat-total-members').getText();
  expect(parseInt(text)).toBe(8);
});

test('active loans stat reflects seeded loans', async ({ screen }) => {
  const text = await screen.getByTestId('stat-active-loans').getText();
  // Seed has 3 active loans
  expect(parseInt(text)).toBe(3);
});

test('overdue loans stat reflects seeded overdue loans', async ({ screen }) => {
  const text = await screen.getByTestId('stat-overdue-loans').getText();
  // Seed loan 3 is overdue
  expect(parseInt(text)).toBeGreaterThanOrEqual(1);
});

test('pending reservations stat reflects seeded reservations', async ({ screen }) => {
  const text = await screen.getByTestId('stat-pending-reservations').getText();
  // Seed has 2 pending reservations
  expect(parseInt(text)).toBe(2);
});

test('most borrowed books section is visible', async ({ screen }) => {
  await expect(screen.getByTestId('top-borrowed-books')).toBeVisible();
  await expect(screen.getByTestId('top-book-0')).toBeVisible();
});

test('most active members section is visible', async ({ screen }) => {
  await expect(screen.getByTestId('most-active-members')).toBeVisible();
  await expect(screen.getByTestId('top-member-0')).toBeVisible();
});

test('stats update after a new loan is created', async ({ screen }) => {
  const before = parseInt(await screen.getByTestId('stat-active-loans').getText());

  // Go borrow a book
  await screen.getByLabel('tab-books').tap();
  await screen.getByTestId('book-item-4').tap();
  await screen.getByTestId('borrow-button-4').tap();
  await screen.getByRole('button', { name: 'Felix Bauer' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Return to reports
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('more-reports-button').tap();
  await screen.getByTestId('reports-screen').waitFor({ state: 'visible' });

  const after = parseInt(await screen.getByTestId('stat-active-loans').getText());
  expect(after).toBe(before + 1);
});
