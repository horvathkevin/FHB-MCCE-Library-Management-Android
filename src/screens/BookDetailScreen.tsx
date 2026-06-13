import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { getBookById, updateBook, Book } from '../db/services/BookService';
import { getAllMembers, Member } from '../db/services/MemberService';
import { borrowBook } from '../db/services/LoanService';
import { createReservation } from '../db/services/ReservationService';
import { useAppContext } from '../context/AppContext';

interface Props {
  route: any;
  navigation: any;
}

export function BookDetailScreen({ route, navigation }: Props) {
  const { bookId } = route.params;
  const [book, setBook] = useState<Book | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', genre: '', year: '', totalCopies: '' });
  const { triggerRefresh } = useAppContext();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const b = await getBookById(bookId);
    const m = await getAllMembers();
    setBook(b);
    setMembers(m.filter(m => m.status === 'active'));
    if (b) setForm({ title: b.title, author: b.author, genre: b.genre, year: String(b.year), totalCopies: String(b.totalCopies) });
  }

  async function handleSave() {
    await updateBook(bookId, { title: form.title, author: form.author, genre: form.genre, year: parseInt(form.year), totalCopies: parseInt(form.totalCopies) });
    setEditing(false);
    triggerRefresh();
    loadData();
  }

  function promptBorrow() {
    if (!book || book.availableCopies < 1) return;
    const options = members.map(m => ({ text: m.name, onPress: () => { doBorrow(m.id); } }));
    options.push({ text: 'Cancel', onPress: () => {} });
    Alert.alert('Select Member', 'Who is borrowing this book?', options as any);
  }

  async function doBorrow(memberId: number) {
    try {
      const { loanId } = await borrowBook(bookId, memberId);
      triggerRefresh();
      loadData();
      Alert.alert('Success', `Book borrowed! Loan #${loanId}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function promptReserve() {
    const options = members.map(m => ({ text: m.name, onPress: () => { doReserve(m.id); } }));
    options.push({ text: 'Cancel', onPress: () => {} });
    Alert.alert('Reserve for Member', 'Who is reserving this book?', options as any);
  }

  async function doReserve(memberId: number) {
    try {
      await createReservation(bookId, memberId);
      triggerRefresh();
      Alert.alert('Success', 'Reservation placed.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  if (!book) return <ActivityIndicator style={{ flex: 1 }} testID="book-detail-loading" />;

  return (
    <ScrollView style={styles.container} testID={`book-detail-${bookId}`}>
      {editing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Book</Text>
          {(['title', 'author', 'genre'] as const).map(f => (
            <TextInput key={f} style={styles.input} placeholder={f} value={form[f]} onChangeText={v => setForm(p => ({ ...p, [f]: v }))} testID={`edit-book-${f}-input`} />
          ))}
          <TextInput style={styles.input} placeholder="Year" value={form.year} onChangeText={v => setForm(p => ({ ...p, year: v }))} keyboardType="numeric" testID="edit-book-year-input" />
          <TextInput style={styles.input} placeholder="Total Copies" value={form.totalCopies} onChangeText={v => setForm(p => ({ ...p, totalCopies: v }))} keyboardType="numeric" testID="edit-book-copies-input" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} testID="edit-book-save-button"><Text style={styles.btnText}>Save</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditing(false)} testID="edit-book-cancel-button"><Text style={styles.secondaryText}>Cancel</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.bookTitle} testID={`book-detail-title-${bookId}`}>{book.title}</Text>
          <Text style={styles.meta} testID={`book-detail-author-${bookId}`}>Author: {book.author}</Text>
          <Text style={styles.meta}>Genre: {book.genre}</Text>
          <Text style={styles.meta}>Year: {book.year}</Text>
          <Text style={styles.meta}>ISBN: {book.isbn}</Text>
          <Text style={styles.meta} testID={`book-detail-copies-${bookId}`}>Copies: {book.availableCopies}/{book.totalCopies} available</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, book.availableCopies < 1 && styles.disabled]}
              onPress={promptBorrow}
              disabled={book.availableCopies < 1}
              testID={`borrow-button-${bookId}`}
            >
              <Text style={styles.btnText}>Borrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={promptReserve} testID={`reserve-button-${bookId}`}>
              <Text style={styles.secondaryText}>Reserve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} testID={`edit-book-button-${bookId}`}>
              <Text style={styles.secondaryText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  bookTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#374151', fontSize: 15, marginBottom: 4 },
  actions: { marginTop: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 10 },
  primaryBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondaryBtn: { backgroundColor: '#f3f4f6', padding: 14, borderRadius: 8, alignItems: 'center' },
  editBtn: { backgroundColor: '#fef3c7', padding: 14, borderRadius: 8, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600' },
  secondaryText: { color: '#374151', fontWeight: '600' },
});
