import type { Screen } from '@mobilewright/test';

export async function reseed(screen: Screen) {
  await screen.getByLabel('tab-more').tap();
  await screen.getByTestId('seed-database-button').tap();
  // Android Alert.alert renders button text in uppercase
  await screen.getByText('RESET & RESEED').tap();
  // Dismiss the success alert (also uppercase on Android)
  await screen.getByText('OK').tap();
  // Return to Books tab as the default landing state
  await screen.getByLabel('tab-books').tap();
}
