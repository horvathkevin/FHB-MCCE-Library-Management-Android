import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ScrollView, ActivityIndicator, Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllBooks, createBook, Book } from '../db/services/BookService';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';

interface Props {
  navigation: any;
}

export function BooksScreen({ navigation }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { refreshKey, triggerRefresh } = useAppContext();

  const [form, setForm] = useState({ isbn: '', title: '', author: '', genre: '', year: '', totalCopies: '1' });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllBooks();
    setBooks(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load, refreshKey]));

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.isbn || !form.title || !form.author || !form.genre || !form.year) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    await createBook({
      isbn: form.isbn,
      title: form.title,
      author: form.author,
      genre: form.genre,
      year: parseInt(form.year),
      totalCopies: parseInt(form.totalCopies) || 1,
      availableCopies: parseInt(form.totalCopies) || 1,
    });
    setForm({ isbn: '', title: '', author: '', genre: '', year: '', totalCopies: '1' });
    Keyboard.dismiss();
    setShowAdd(false);
    triggerRefresh();
    load();
  };

  if (loading) return <ActivityIndicator style={styles.loader} testID="books-loading" />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search books..."
        value={search}
        onChangeText={setSearch}
        testID="books-search-input"
        accessibilityLabel="Search books"
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} testID="add-book-button">
        <Text style={styles.addBtnText}>+ Add Book</Text>
      </TouchableOpacity>

      {filtered.length === 0 ? (
        <EmptyState message="No books found." testID="books-empty-state" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          testID="books-list"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              testID={`book-item-${item.id}`}
              onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title} testID={`book-title-${item.id}`}>{item.title}</Text>
                <StatusBadge
                  status={item.availableCopies > 0 ? 'active' : 'inactive'}
                  testID={`book-availability-${item.id}`}
                />
              </View>
              <Text style={styles.sub} testID={`book-author-${item.id}`}>{item.author} · {item.genre} · {item.year}</Text>
              <Text style={styles.copies} testID={`book-copies-${item.id}`}>
                {item.availableCopies}/{item.totalCopies} available
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" testID="add-book-modal">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add New Book</Text>
          {(['isbn', 'title', 'author', 'genre'] as const).map(field => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
              testID={`add-book-${field}-input`}
            />
          ))}
          <TextInput
            style={styles.input}
            placeholder="Year"
            value={form.year}
            onChangeText={v => setForm(f => ({ ...f, year: v }))}
            keyboardType="numeric"
            testID="add-book-year-input"
          />
          <TextInput
            style={styles.input}
            placeholder="Total Copies"
            value={form.totalCopies}
            onChangeText={v => setForm(f => ({ ...f, totalCopies: v }))}
            keyboardType="numeric"
            testID="add-book-copies-input"
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} testID="add-book-submit-button">
            <Text style={styles.submitText}>Save Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)} testID="add-book-cancel-button">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1 },
  search: { margin: 12, padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  addBtn: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  sub: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
  copies: { color: '#374151', fontSize: 13 },
  modal: { padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' },
  submitBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  submitText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#6b7280' },
});
