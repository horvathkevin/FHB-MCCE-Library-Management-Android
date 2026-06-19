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
  await screen.getByTestId('more-search-button').tap();
  await screen.getByTestId('search-input').waitFor({ state: 'visible' });
});

test('search input is visible and focused', async ({ screen }) => {
  await expect(screen.getByTestId('search-input')).toBeVisible();
});
