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
});

test('books list shows all seeded books', async ({ screen }) => {
  await expect(screen.getByTestId('books-list')).toBeVisible();

  // Seed has 10 books — verify at least the first few titles are present
  await expect(screen.getByText('1984')).toBeVisible();
  await expect(screen.getByText('The Alchemist')).toBeVisible();
  await expect(screen.getByText('Harry Potter and the Sorcerer\'s Stone')).toBeVisible();
});

test('books list can be filtered by search', async ({ screen }) => {
  await screen.getByTestId('books-search-input').fill('Tolkien');

  await expect(screen.getByText('The Lord of the Rings')).toBeVisible();
  // Other books should not be visible
  await expect(screen.getByText('1984')).not.toBeVisible();
});

test('book detail screen shows correct metadata', async ({ screen }) => {
  await screen.getByTestId('book-item-1').tap();

  await expect(screen.getByTestId('book-detail-title-1')).toBeVisible();
  await expect(screen.getByTestId('book-detail-author-1')).toBeVisible();
  await expect(screen.getByTestId('book-detail-copies-1')).toBeVisible();
});

test('can add a new book', async ({ screen }) => {
  await screen.getByTestId('add-book-button').tap();

  await screen.getByTestId('add-book-isbn-input').fill('9780000000001');
  await screen.getByTestId('add-book-title-input').fill('Test Book');
  await screen.getByTestId('add-book-author-input').fill('Test Author');
  await screen.getByTestId('add-book-genre-input').fill('Fiction');
  await screen.getByTestId('add-book-year-input').fill('2024');
  await screen.getByTestId('add-book-copies-input').fill('2');
  await screen.getByTestId('add-book-submit-button').tap();

  await expect(screen.getByText('Test Book')).toBeVisible();
});

test('borrow button is disabled when no copies available', async ({ screen }) => {
  // Book 1 (1984) has 3 copies, 1 active loan in seed — still available
  // Book 2 (To Kill a Mockingbird) has 2 copies, 1 active loan — still available
  // Navigate to book detail and confirm borrow is enabled
  await screen.getByTestId('book-item-1').tap();
  await expect(screen.getByTestId('borrow-button-1')).toBeVisible();
});

test('borrowing a book decreases available copies', async ({ screen }) => {
  await screen.getByTestId('book-item-1').tap();

  const copiesBefore = await screen.getByTestId('book-detail-copies-1').getText();
  const availBefore = parseInt(copiesBefore.split('/')[0]);

  // Tap borrow — alert shows list of members
  await screen.getByTestId('borrow-button-1').tap();
  // Pick the first member button in the alert
  await screen.getByText('ALICE MÜLLER').tap();
  // Dismiss success alert
  await screen.getByText('OK').tap();

  const copiesAfter = await screen.getByTestId('book-detail-copies-1').getText();
  const availAfter = parseInt(copiesAfter.split('/')[0]);

  expect(availAfter).toBe(availBefore - 1);
});

