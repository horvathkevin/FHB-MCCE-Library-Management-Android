import type { Screen } from '@mobilewright/test';

export async function reseed(screen: Screen) {
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  await screen.getByRole('button', { name: 'Reset & Reseed' }).tap();
  await screen.getByRole('button', { name: 'OK' }).tap();
  // Return to Books tab as the default landing state
  await screen.getByLabel('tab-books').tap();
}
