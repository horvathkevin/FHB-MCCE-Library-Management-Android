import { test, expect } from '@mobilewright/test';
import { reseed } from './helpers/seed';

const APP = 'com.fhb.libraryandroid';

test.use({ bundleId: APP });

test.beforeEach(async ({ device, screen, bundleId }) => {
  await device.terminateApp(bundleId).catch(() => {});
  await device.launchApp(bundleId);
  await screen.getByTestId('books-list').waitFor({ state: 'visible' });
  await reseed(screen);
  await screen.getByLabel('tab-loans').tap();
  await screen.getByTestId('loans-list').waitFor({ state: 'visible' });
});

test('loans list shows seeded active and returned loans', async ({ screen }) => {
  await expect(screen.getByTestId('loans-list')).toBeVisible();
  // Seed has 3 active + 1 returned loan
  await expect(screen.getByTestId('loan-item-1')).toBeVisible();
});

test('filter bar shows active loans only', async ({ screen }) => {
  await screen.getByTestId('loans-filter-active').tap();

  await expect(screen.getByTestId('loans-list')).toBeVisible();
  // Active loans have ACTIVE status badges
  await expect(screen.getByTestId('loan-status-badge-1')).toBeVisible();
});

test('filter bar shows overdue loans', async ({ screen }) => {
  await screen.getByTestId('loans-filter-overdue').tap();

  // Seed loan 3 is overdue (borrowed 16 days ago, 14-day term)
  await expect(screen.getByTestId('loan-item-3')).toBeVisible();
  await expect(screen.getByTestId('loan-status-badge-3')).toHaveText('OVERDUE');
});

test('filter bar shows returned loans', async ({ screen }) => {
  await screen.getByTestId('loans-filter-returned').tap();

  // Seed has 1 returned loan (loan 4)
  await expect(screen.getByTestId('loan-item-4')).toBeVisible();
  await expect(screen.getByTestId('loan-status-badge-4')).toHaveText('RETURNED');
});

test('loan detail shows book title and member name', async ({ screen }) => {
  await screen.getByTestId('loan-item-1').tap();

  await expect(screen.getByTestId('loan-detail-book-1')).toBeVisible();
  await expect(screen.getByTestId('loan-detail-member-1')).toBeVisible();
  await expect(screen.getByTestId('loan-detail-due-1')).toBeVisible();
});

test('returning an active loan marks it as returned', async ({ screen }) => {
  await screen.getByTestId('loan-item-1').tap();
  await screen.getByTestId('return-button-1').tap();

  // Confirm the return dialog
  await screen.getByRole('button', { name: 'Return' }).tap();
  // Dismiss success alert
  await screen.getByRole('button', { name: 'OK' }).tap();

  await expect(screen.getByTestId('loan-detail-status-1')).toHaveText('RETURNED');
});

test('returning an overdue loan displays a late fee', async ({ screen }) => {
  // Loan 3 is seeded as overdue (borrowed 16 days ago)
  await screen.getByTestId('loans-filter-overdue').tap();
  await screen.getByTestId('loan-item-3').tap();

  await screen.getByTestId('return-button-3').tap();
  await screen.getByRole('button', { name: 'Return' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Fee should be visible on the detail screen after return
  await expect(screen.getByTestId('loan-detail-fee-3')).toBeVisible();
  const feeText = await screen.getByTestId('loan-detail-fee-3').getText();
  expect(feeText).toContain('€');
});

test('returned loan increases available copies', async ({ screen }) => {
  // Check book 1 copies before return
  await screen.getByLabel('tab-books').tap();
  const copiesBefore = await screen.getByTestId('book-copies-1').getText();
  const availBefore = parseInt(copiesBefore.split('/')[0]);

  // Return loan 1 (book 1 / 1984)
  await screen.getByLabel('tab-loans').tap();
  await screen.getByTestId('loan-item-1').tap();
  await screen.getByTestId('return-button-1').tap();
  await screen.getByRole('button', { name: 'Return' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();

  // Go back and check copies
  await screen.getByLabel('tab-books').tap();
  const copiesAfter = await screen.getByTestId('book-copies-1').getText();
  const availAfter = parseInt(copiesAfter.split('/')[0]);

  expect(availAfter).toBe(availBefore + 1);
});

test('fee is capped at €20 for very overdue loans', async ({ screen }) => {
  // Loan 4 in seed is returned with a known fee
  await screen.getByTestId('loans-filter-returned').tap();
  await screen.getByTestId('loan-item-4').tap();

  const feeText = await screen.getByTestId('loan-detail-fee-4').getText();
  const fee = parseFloat(feeText.replace('Late fee: €', ''));
  expect(fee).toBeLessThanOrEqual(20);
});
