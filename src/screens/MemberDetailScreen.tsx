import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { getMemberById, updateMember, Member } from '../db/services/MemberService';
import { getLoansByMember, Loan } from '../db/services/LoanService';
import { StatusBadge } from '../components/StatusBadge';
import { useAppContext } from '../context/AppContext';

interface Props { route: any; navigation: any }

export function MemberDetailScreen({ route, navigation }: Props) {
  const { memberId } = route.params;
  const [member, setMember] = useState<Member | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const { triggerRefresh } = useAppContext();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const m = await getMemberById(memberId);
    const l = await getLoansByMember(memberId);
    setMember(m);
    setLoans(l);
    if (m) setForm({ name: m.name, email: m.email });
  }

  async function handleSave() {
    await updateMember(memberId, { name: form.name, email: form.email });
    setEditing(false);
    triggerRefresh();
    loadData();
  }

  async function toggleStatus() {
    if (!member) return;
    const next = member.status === 'active' ? 'inactive' : 'active';
    await updateMember(memberId, { status: next });
    triggerRefresh();
    loadData();
  }

  if (!member) return <ActivityIndicator style={{ flex: 1 }} testID="member-detail-loading" />;

  const activeLoans = loans.filter(l => l.status === 'active');

  return (
    <ScrollView style={styles.container} testID={`member-detail-${memberId}`}>
      <View style={styles.section}>
        {editing ? (
          <>
            <Text style={styles.sectionTitle}>Edit Member</Text>
            <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} testID="edit-member-name-input" />
            <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" testID="edit-member-email-input" />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} testID="edit-member-save-button"><Text style={styles.btnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditing(false)} testID="edit-member-cancel-button"><Text style={styles.secondaryText}>Cancel</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.memberName} testID={`member-detail-name-${memberId}`}>{member.name}</Text>
              <StatusBadge status={member.status} testID={`member-detail-status-${memberId}`} />
            </View>
            <Text style={styles.meta} testID={`member-detail-number-${memberId}`}>Member #: {member.memberNumber}</Text>
            <Text style={styles.meta}>Email: {member.email}</Text>
            <Text style={styles.meta}>Active Loans: {activeLoans.length}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} testID={`edit-member-button-${memberId}`}><Text style={styles.secondaryText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={toggleStatus} testID={`toggle-member-status-${memberId}`}>
                <Text style={styles.secondaryText}>{member.status === 'active' ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan History</Text>
        {loans.length === 0 ? (
          <Text style={styles.empty} testID="member-loans-empty">No loans yet.</Text>
        ) : (
          loans.map(loan => (
            <TouchableOpacity
              key={loan.id}
              style={styles.loanRow}
              testID={`member-loan-item-${loan.id}`}
              onPress={() => navigation.navigate('Loans', { screen: 'LoanDetail', params: { loanId: loan.id } })}
            >
              <Text style={styles.loanTitle} testID={`member-loan-title-${loan.id}`}>{loan.bookTitle}</Text>
              <View style={styles.loanMeta}>
                <StatusBadge status={loan.status} testID={`member-loan-status-${loan.id}`} />
                {loan.fee > 0 && <Text style={styles.fee} testID={`member-loan-fee-${loan.id}`}>€{loan.fee.toFixed(2)}</Text>}
              </View>
              <Text style={styles.dates}>{loan.borrowDate} → {loan.returnDate ?? loan.dueDate}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  memberName: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 8 },
  meta: { color: '#374151', fontSize: 14, marginBottom: 4 },
  actions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 10 },
  primaryBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  secondaryBtn: { flex: 1, backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  editBtn: { flex: 1, backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  secondaryText: { color: '#374151', fontWeight: '600' },
  loanRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  loanTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  loanMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  fee: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  dates: { color: '#9ca3af', fontSize: 12 },
  empty: { color: '#9ca3af', textAlign: 'center', padding: 16 },
});
