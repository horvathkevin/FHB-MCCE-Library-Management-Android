import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllReservations, cancelReservation, Reservation } from '../db/services/ReservationService';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';

type Filter = 'all' | 'pending' | 'ready' | 'cancelled';

interface Props { navigation: any }

export function ReservationsScreen({ navigation }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const { refreshKey, triggerRefresh } = useAppContext();

  const load = useCallback(async () => {
    setLoading(true);
    setReservations(await getAllReservations());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load, refreshKey]));

  const filtered = reservations.filter(r => filter === 'all' || r.status === filter);

  async function handleCancel(id: number) {
    Alert.alert('Cancel Reservation', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive', onPress: async () => {
          await cancelReservation(id);
          triggerRefresh();
        }
      }
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} testID="reservations-loading" />;

  return (
    <View style={styles.container}>
      <View style={styles.filters} testID="reservations-filter-bar">
        {(['all', 'pending', 'ready', 'cancelled'] as Filter[]).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)} testID={`reservations-filter-${f}`}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState message="No reservations found." testID="reservations-empty-state" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          testID="reservations-list"
          renderItem={({ item }) => (
            <View style={styles.card} testID={`reservation-item-${item.id}`}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} testID={`reservation-book-title-${item.id}`} numberOfLines={1}>{item.bookTitle}</Text>
                <StatusBadge status={item.status} testID={`reservation-status-badge-${item.id}`} />
              </View>
              <Text style={styles.sub} testID={`reservation-member-name-${item.id}`}>{item.memberName} · {item.memberNumber}</Text>
              <Text style={styles.date}>Reserved: {item.createdAt.split('T')[0]}</Text>
              {item.status === 'ready' && (
                <Text style={styles.readyText} testID={`reservation-ready-notice-${item.id}`}>Book is ready for pickup!</Text>
              )}
              {(item.status === 'pending' || item.status === 'ready') && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)} testID={`cancel-reservation-button-${item.id}`}>
                  <Text style={styles.cancelText}>Cancel Reservation</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filters: { flexDirection: 'row', padding: 8, gap: 6 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  filterActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  filterTextActive: { color: '#fff' },
  card: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  sub: { color: '#6b7280', fontSize: 13, marginBottom: 2 },
  date: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  readyText: { color: '#16a34a', fontWeight: '600', fontSize: 13, marginBottom: 6 },
  cancelBtn: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#991b1b', fontWeight: '600', fontSize: 13 },
});
