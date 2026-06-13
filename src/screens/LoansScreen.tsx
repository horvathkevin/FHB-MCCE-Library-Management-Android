import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllLoans, Loan } from '../db/services/LoanService';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';

type Filter = 'all' | 'active' | 'returned' | 'overdue';

interface Props { navigation: any }

function isOverdue(loan: Loan): boolean {
  return loan.status === 'active' && new Date(loan.dueDate) < new Date();
}

export function LoansScreen({ navigation }: Props) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const { refreshKey } = useAppContext();

  const load = useCallback(async () => {
    setLoading(true);
    setLoans(await getAllLoans());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load, refreshKey]));

  const filtered = loans.filter(l => {
    if (filter === 'active') return l.status === 'active' && !isOverdue(l);
    if (filter === 'returned') return l.status === 'returned';
    if (filter === 'overdue') return isOverdue(l);
    return true;
  });

  if (loading) return <ActivityIndicator style={{ flex: 1 }} testID="loans-loading" />;

  return (
    <View style={styles.container}>
      <View style={styles.filters} testID="loans-filter-bar">
        {(['all', 'active', 'overdue', 'returned'] as Filter[]).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)} testID={`loans-filter-${f}`}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState message="No loans found." testID="loans-empty-state" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          testID="loans-list"
          renderItem={({ item }) => {
            const overdue = isOverdue(item);
            const displayStatus = overdue ? 'overdue' : item.status;
            return (
              <TouchableOpacity
                style={styles.card}
                testID={`loan-item-${item.id}`}
                onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.title} testID={`loan-book-title-${item.id}`} numberOfLines={1}>{item.bookTitle}</Text>
                  <StatusBadge status={displayStatus as any} testID={`loan-status-badge-${item.id}`} />
                </View>
                <Text style={styles.sub} testID={`loan-member-name-${item.id}`}>{item.memberName} · {item.memberNumber}</Text>
                <Text style={styles.dates}>Borrowed: {item.borrowDate} · Due: {item.dueDate}</Text>
                {item.fee > 0 && <Text style={styles.fee} testID={`loan-fee-${item.id}`}>Fee: €{item.fee.toFixed(2)}</Text>}
              </TouchableOpacity>
            );
          }}
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
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  filterTextActive: { color: '#fff' },
  card: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  sub: { color: '#6b7280', fontSize: 13, marginBottom: 2 },
  dates: { color: '#9ca3af', fontSize: 12, marginBottom: 2 },
  fee: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
});
