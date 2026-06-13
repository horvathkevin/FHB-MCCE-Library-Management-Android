import { test, expect } from '@mobilewright/test';
import { reseed } from './helpers/seed';

const APP = 'com.fhb.libraryandroid';

test.use({ bundleId: APP });

test.beforeEach(async ({ device, screen, bundleId }) => {
  await device.terminateApp(bundleId).catch(() => {});
  await device.launchApp(bundleId);
  await screen.getByTestId('books-list').waitFor({ state: 'visible' });
  await reseed(screen);
  await screen.getByLabel('tab-members').tap();
  await screen.getByTestId('members-list').waitFor({ state: 'visible' });
});

test('members list shows all seeded members', async ({ screen }) => {
  await expect(screen.getByTestId('members-list')).toBeVisible();
  await expect(screen.getByText('Alice Müller')).toBeVisible();
  await expect(screen.getByText('Bob Schmidt')).toBeVisible();
  await expect(screen.getByText('Hans Richter')).toBeVisible();
});

test('members list can be filtered by name', async ({ screen }) => {
  await screen.getByTestId('members-search-input').fill('Clara');

  await expect(screen.getByText('Clara Weber')).toBeVisible();
  await expect(screen.getByText('Alice Müller')).not.toBeVisible();
});

test('member detail shows number and status badge', async ({ screen }) => {
  await screen.getByTestId('member-item-1').tap();

  await expect(screen.getByTestId('member-detail-name-1')).toBeVisible();
  await expect(screen.getByTestId('member-detail-number-1')).toBeVisible();
  await expect(screen.getByTestId('member-detail-status-1')).toBeVisible();
});

test('can add a new member', async ({ screen }) => {
  await screen.getByTestId('add-member-button').tap();

  await screen.getByTestId('add-member-name-input').fill('New Student');
  await screen.getByTestId('add-member-email-input').fill('new.student@example.com');
  await screen.getByTestId('add-member-submit-button').tap();

  await expect(screen.getByText('New Student')).toBeVisible();
});

test('duplicate email is rejected', async ({ screen }) => {
  await screen.getByTestId('add-member-button').tap();

  await screen.getByTestId('add-member-name-input').fill('Duplicate');
  // alice.mueller@example.com already exists in seed
  await screen.getByTestId('add-member-email-input').fill('alice.mueller@example.com');
  await screen.getByTestId('add-member-submit-button').tap();

  // Error alert should appear
  await expect(screen.getByRole('button', { name: 'OK' })).toBeVisible();
});

test('can deactivate and reactivate a member', async ({ screen }) => {
  await screen.getByTestId('member-item-1').tap();

  await screen.getByTestId('toggle-member-status-1').tap();
  await expect(screen.getByTestId('member-detail-status-1')).toHaveText('INACTIVE');

  await screen.getByTestId('toggle-member-status-1').tap();
  await expect(screen.getByTestId('member-detail-status-1')).toHaveText('ACTIVE');
});

test('member detail shows loan history', async ({ screen }) => {
  // Member 1 (Alice Müller) has an active loan in seed data
  await screen.getByTestId('member-item-1').tap();

  await expect(screen.getByTestId('member-loan-item-1')).toBeVisible();
  await expect(screen.getByTestId('member-loan-status-1')).toBeVisible();
});
