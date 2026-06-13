import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { getDatabase } from './src/db/database';
import { isDatabaseSeeded, seedDatabase } from './src/db/seed';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await getDatabase();
      const seeded = await isDatabaseSeeded();
      if (!seeded) await seedDatabase();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash} testID="app-loading">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
});
