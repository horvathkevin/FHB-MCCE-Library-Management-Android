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
  await screen.getByTestId('more-search-button').tap();
  await screen.getByTestId('search-input').waitFor({ state: 'visible' });
});

test('search input is visible and focused', async ({ screen }) => {
  await expect(screen.getByTestId('search-input')).toBeVisible();
});

test('searching a book title returns matching results', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('1984');

  await expect(screen.getByTestId('search-book-title-1')).toBeVisible();
  await expect(screen.getByTestId('search-book-title-1')).toHaveText('1984');
});

test('searching an author returns matching books', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('Orwell');

  await expect(screen.getByText('1984')).toBeVisible();
});

test('searching a member name returns matching members', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('Alice');

  await expect(screen.getByTestId('search-member-name-1')).toBeVisible();
  await expect(screen.getByTestId('search-member-name-1')).toHaveText('Alice Müller');
});

test('searching a member number returns that member', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('M0003');

  await expect(screen.getByText('Clara Weber')).toBeVisible();
});

test('query shorter than 2 characters shows no results', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('a');

  await expect(screen.getByTestId('search-results-list')).not.toBeVisible();
});

test('unmatched query shows no-results message', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('zzznomatch');

  await expect(screen.getByTestId('search-no-results')).toBeVisible();
  await expect(screen.getByTestId('search-no-results')).toContainText('zzznomatch');
});

test('tapping a book result navigates to book detail', async ({ screen }) => {
  await screen.getByTestId('search-input').fill('1984');
  await screen.getByTestId('search-book-result-1').tap();

  await expect(screen.getByTestId('book-detail-title-1')).toBeVisible();
});
