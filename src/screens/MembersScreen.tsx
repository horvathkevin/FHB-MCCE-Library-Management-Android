import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllMembers, createMember, Member } from '../db/services/MemberService';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';

interface Props { navigation: any }

export function MembersScreen({ navigation }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const { refreshKey, triggerRefresh } = useAppContext();

  const load = useCallback(async () => {
    setLoading(true);
    setMembers(await getAllMembers());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load, refreshKey]));

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.memberNumber.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!form.name || !form.email) { Alert.alert('Validation', 'Name and email required.'); return; }
    try {
      await createMember(form);
      setForm({ name: '', email: '' });
      setShowAdd(false);
      triggerRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} testID="members-loading" />;

  return (
    <View style={styles.container}>
      <TextInput style={styles.search} placeholder="Search members..." value={search} onChangeText={setSearch} testID="members-search-input" />
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} testID="add-member-button">
        <Text style={styles.addBtnText}>+ Add Member</Text>
      </TouchableOpacity>

      {filtered.length === 0 ? (
        <EmptyState message="No members found." testID="members-empty-state" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          testID="members-list"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              testID={`member-item-${item.id}`}
              onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.name} testID={`member-name-${item.id}`}>{item.name}</Text>
                <StatusBadge status={item.status} testID={`member-status-badge-${item.id}`} />
              </View>
              <Text style={styles.sub} testID={`member-number-${item.id}`}>{item.memberNumber} · {item.email}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" testID="add-member-modal">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add New Member</Text>
          <TextInput style={styles.input} placeholder="Full Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} testID="add-member-name-input" />
          <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" testID="add-member-email-input" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} testID="add-member-submit-button"><Text style={styles.submitText}>Save Member</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)} testID="add-member-cancel-button"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  search: { margin: 12, padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  addBtn: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  sub: { color: '#6b7280', fontSize: 13 },
  modal: { padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' },
  submitBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  submitText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#6b7280' },
});
