import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../db/database';

interface Stats {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  totalFees: number;
  pendingReservations: number;
  readyReservations: number;
  topBorrowedBooks: Array<{ title: string; count: number }>;
  mostActiveMembers: Array<{ name: string; memberNumber: string; count: number }>;
}

export function ReportsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const [books, members, activeLoans, returnedLoans, overdueLoans, fees, pendingRes, readyRes, topBooks, topMembers] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM books'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM members'),
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM loans WHERE status='active'"),
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM loans WHERE status='returned'"),
      db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM loans WHERE status='active' AND dueDate < '${today}'`),
      db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(fee),0) as total FROM loans'),
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM reservations WHERE status='pending'"),
      db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM reservations WHERE status='ready'"),
      db.getAllAsync<{ title: string; count: number }>('SELECT b.title, COUNT(l.id) as count FROM loans l JOIN books b ON b.id=l.bookId GROUP BY l.bookId ORDER BY count DESC LIMIT 5'),
      db.getAllAsync<{ name: string; memberNumber: string; count: number }>('SELECT m.name, m.memberNumber, COUNT(l.id) as count FROM loans l JOIN members m ON m.id=l.memberId GROUP BY l.memberId ORDER BY count DESC LIMIT 5'),
    ]);

    setStats({
      totalBooks: books?.count ?? 0,
      totalMembers: members?.count ?? 0,
      activeLoans: activeLoans?.count ?? 0,
      returnedLoans: returnedLoans?.count ?? 0,
      overdueLoans: overdueLoans?.count ?? 0,
      totalFees: fees?.total ?? 0,
      pendingReservations: pendingRes?.count ?? 0,
      readyReservations: readyRes?.count ?? 0,
      topBorrowedBooks: topBooks,
      mostActiveMembers: topMembers,
    });
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !stats) return <ActivityIndicator style={{ flex: 1 }} testID="reports-loading" />;

  return (
    <ScrollView style={styles.container} testID="reports-screen">
      <Text style={styles.heading}>Library Reports</Text>

      <View style={styles.grid}>
        <StatCard label="Books" value={stats.totalBooks} testID="stat-total-books" />
        <StatCard label="Members" value={stats.totalMembers} testID="stat-total-members" />
        <StatCard label="Active Loans" value={stats.activeLoans} testID="stat-active-loans" />
        <StatCard label="Overdue" value={stats.overdueLoans} color="#dc2626" testID="stat-overdue-loans" />
        <StatCard label="Returned" value={stats.returnedLoans} testID="stat-returned-loans" />
        <StatCard label="Total Fees" value={`€${stats.totalFees.toFixed(2)}`} testID="stat-total-fees" />
        <StatCard label="Pending Res." value={stats.pendingReservations} testID="stat-pending-reservations" />
        <StatCard label="Ready Res." value={stats.readyReservations} color="#16a34a" testID="stat-ready-reservations" />
      </View>

      <View style={styles.section} testID="top-borrowed-books">
        <Text style={styles.sectionTitle}>Most Borrowed Books</Text>
        {stats.topBorrowedBooks.length === 0 ? (
          <Text style={styles.empty}>No data yet.</Text>
        ) : (
          stats.topBorrowedBooks.map((b, i) => (
            <View key={i} style={styles.row} testID={`top-book-${i}`}>
              <Text style={styles.rank}>#{i + 1}</Text>
              <Text style={styles.rowTitle} numberOfLines={1}>{b.title}</Text>
              <Text style={styles.rowCount}>{b.count} loans</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section} testID="most-active-members">
        <Text style={styles.sectionTitle}>Most Active Members</Text>
        {stats.mostActiveMembers.length === 0 ? (
          <Text style={styles.empty}>No data yet.</Text>
        ) : (
          stats.mostActiveMembers.map((m, i) => (
            <View key={i} style={styles.row} testID={`top-member-${i}`}>
              <Text style={styles.rank}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{m.name}</Text>
                <Text style={styles.rowSub}>{m.memberNumber}</Text>
              </View>
              <Text style={styles.rowCount}>{m.count} loans</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, testID }: { label: string; value: number | string; color?: string; testID?: string }) {
  return (
    <View style={styles.statCard} testID={testID}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', margin: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  statCard: { width: '46%', margin: '2%', backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  section: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  rank: { width: 28, color: '#9ca3af', fontWeight: '600' },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowSub: { fontSize: 12, color: '#9ca3af' },
  rowCount: { color: '#6b7280', fontSize: 13 },
  empty: { color: '#9ca3af', textAlign: 'center', padding: 12 },
});
