import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { reseedDatabase } from '../db/seed';
import { useAppContext } from '../context/AppContext';

interface Props { navigation: any }

export function ReseedConfirmScreen({ navigation }: Props) {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);
  const { triggerRefresh } = useAppContext();

  async function handleConfirm() {
    setSeeding(true);
    try {
      await reseedDatabase();
      triggerRefresh();
      setDone(true);
    } catch (_e) {
      navigation.goBack();
    } finally {
      setSeeding(false);
    }
  }

  if (seeding) {
    return (
      <View style={[styles.container, styles.center]} testID="reseed-seeding-screen">
        <ActivityIndicator size="large" color="#dc2626" testID="seed-loading-indicator" />
        <Text style={styles.seedingText}>Reseeding database…</Text>
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.container, styles.center]} testID="reseed-success-screen">
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Done!</Text>
        <Text style={styles.successMsg}>Database has been reseeded with sample data.</Text>
        <TouchableOpacity
          style={[styles.btn, styles.confirmBtn, { marginTop: 24 }]}
          onPress={() => navigation.goBack()}
          testID="reseed-success-ok-button"
          accessibilityLabel="reseed-success-ok-button"
        >
          <Text style={styles.confirmBtnText}>OK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="reseed-confirm-screen">
      <Text style={styles.heading}>Reset Database?</Text>
      <Text style={styles.msg}>
        This will delete all current data and reload the sample dataset. Are you sure?
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={() => navigation.goBack()}
          testID="reseed-cancel-button"
          accessibilityLabel="reseed-cancel-button"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.confirmBtn]}
          onPress={handleConfirm}
          testID="reseed-confirm-button"
          accessibilityLabel="reseed-confirm-button"
        >
          <Text style={styles.confirmBtnText}>Reset &amp; Reseed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 24 },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  msg: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 32 },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#e5e7eb' },
  confirmBtn: { backgroundColor: '#dc2626' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  seedingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successMsg: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
});
