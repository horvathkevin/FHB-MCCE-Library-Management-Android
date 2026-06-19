import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { reseedDatabase } from '../db/seed';
import { useAppContext } from '../context/AppContext';

interface Props { navigation: any }

export function MoreScreen({ navigation }: Props) {
  const [seeding, setSeeding] = useState(false);
  const { triggerRefresh } = useAppContext();

  function handleSeed() {
    Alert.alert(
      'Reset Database',
      'This will delete all current data and reload the sample dataset. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Reseed',
          style: 'destructive',
          onPress: () => {
            setSeeding(true);
            reseedDatabase()
              .then(() => { triggerRefresh(); })
              .catch(() => {})
              .finally(() => { setSeeding(false); });
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container} testID="more-screen">
      <Text style={styles.heading}>More</Text>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Search')} testID="more-search-button">
          <Text style={styles.menuIcon}>🔍</Text>
          <View>
            <Text style={styles.menuTitle}>Search</Text>
            <Text style={styles.menuSub}>Find books and members</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reports')} testID="more-reports-button">
          <Text style={styles.menuIcon}>📊</Text>
          <View>
            <Text style={styles.menuTitle}>Reports</Text>
            <Text style={styles.menuSub}>Library statistics and activity</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerSection}>
        <Text style={styles.dangerHeading}>Developer Tools</Text>
        <TouchableOpacity
          style={[styles.seedBtn, seeding && styles.disabled]}
          onPress={handleSeed}
          disabled={seeding}
          testID="seed-database-button"
          accessibilityLabel="Reset and reseed database"
        >
          {seeding ? (
            <ActivityIndicator color="#fff" testID="seed-loading-indicator" />
          ) : (
            <>
              <Text style={styles.seedIcon}>🔄</Text>
              <Text style={styles.seedTitle}>Reset / Re-seed Database</Text>
              <Text style={styles.seedSub}>Wipes all data and loads sample dataset</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  menuSection: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { fontSize: 24, marginRight: 14 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  menuSub: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  dangerSection: { marginTop: 8 },
  dangerHeading: { fontSize: 13, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  seedBtn: { backgroundColor: '#dc2626', borderRadius: 12, padding: 20, alignItems: 'center', elevation: 1 },
  disabled: { opacity: 0.6 },
  seedIcon: { fontSize: 28, marginBottom: 6 },
  seedTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  seedSub: { fontSize: 13, color: '#fca5a5', textAlign: 'center' },
});
