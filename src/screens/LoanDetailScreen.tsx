import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { getLoanById, returnBook, Loan } from '../db/services/LoanService';
import { StatusBadge } from '../components/StatusBadge';
import { useAppContext } from '../context/AppContext';

interface Props { route: any; navigation: any }

function isOverdue(loan: Loan): boolean {
  return loan.status === 'active' && new Date(loan.dueDate) < new Date();
}

export function LoanDetailScreen({ route, navigation }: Props) {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<Loan | null>(null);
  const { triggerRefresh } = useAppContext();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoan(await getLoanById(loanId));
  }

  async function handleReturn() {
    Alert.alert('Return Book', 'Confirm returning this book?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Return', onPress: async () => {
          try {
            const { fee } = await returnBook(loanId);
            triggerRefresh();
            loadData();
            const msg = fee > 0 ? `Book returned. Late fee: €${fee.toFixed(2)}` : 'Book returned successfully.';
            Alert.alert('Success', msg);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  }

  if (!loan) return <ActivityIndicator style={{ flex: 1 }} testID="loan-detail-loading" />;

  const overdue = isOverdue(loan);
  const displayStatus = overdue ? 'overdue' : loan.status;

  return (
    <ScrollView style={styles.container} testID={`loan-detail-${loanId}`}>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.heading} testID={`loan-detail-book-${loanId}`}>{loan.bookTitle}</Text>
          <StatusBadge status={displayStatus as any} testID={`loan-detail-status-${loanId}`} />
        </View>
        <Text style={styles.meta} testID={`loan-detail-member-${loanId}`}>{loan.memberName} ({loan.memberNumber})</Text>
        <Text style={styles.meta}>Borrowed: {loan.borrowDate}</Text>
        <Text style={[styles.meta, overdue && styles.red]} testID={`loan-detail-due-${loanId}`}>Due: {loan.dueDate}</Text>
        {loan.returnDate && <Text style={styles.meta}>Returned: <Text style={styles.bold}>{loan.returnDate}</Text></Text>}
        {loan.fee > 0 && (
          <Text style={[styles.meta, styles.red]} testID={`loan-detail-fee-${loanId}`}>Late fee: €{loan.fee.toFixed(2)}</Text>
        )}
        {loan.status === 'active' && (
          <TouchableOpacity style={styles.returnBtn} onPress={handleReturn} testID={`return-button-${loanId}`}>
            <Text style={styles.btnText}>Return Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heading: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 8 },
  meta: { fontSize: 15, color: '#374151', marginBottom: 6 },
  bold: { fontWeight: '600' },
  red: { color: '#dc2626' },
  returnBtn: { marginTop: 16, backgroundColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
