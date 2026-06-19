import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { searchBooks, Book } from '../db/services/BookService';
import { searchMembers, Member } from '../db/services/MemberService';

interface Props { navigation: any }

type ResultItem = { type: 'book'; data: Book } | { type: 'member'; data: Member };

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const [books, members] = await Promise.all([searchBooks(q), searchMembers(q)]);
    setResults([
      ...books.map(b => ({ type: 'book' as const, data: b })),
      ...members.map(m => ({ type: 'member' as const, data: m })),
    ]);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search books or members..."
        value={query}
        onChangeText={handleSearch}
        testID="search-input"
        accessibilityLabel="Global search input"
      />
      {loading && <ActivityIndicator testID="search-loading" style={{ marginTop: 16 }} />}
      {!loading && query.length >= 2 && results.length === 0 && (
        <Text style={styles.noResults} testID="search-no-results">No results for "{query}"</Text>
      )}
      {query.trim().length >= 2 && results.length > 0 && <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.type}-${item.data.id}-${i}`}
        testID="search-results-list"
        renderItem={({ item }) => {
          if (item.type === 'book') {
            const book = item.data as Book;
            return (
              <TouchableOpacity
                style={styles.card}
                testID={`search-book-result-${book.id}`}
                onPress={() => {
                  const parent = navigation.getParent();
                  const nav = parent ?? navigation;
                  nav.navigate('Books', { screen: 'BookDetail', params: { bookId: book.id } });
                }}
              >
                <Text style={styles.typeTag}>BOOK</Text>
                <Text style={styles.title} testID={`search-book-title-${book.id}`}>{book.title}</Text>
                <Text style={styles.sub}>{book.author} · {book.year}</Text>
              </TouchableOpacity>
            );
          }
          const member = item.data as Member;
          return (
            <TouchableOpacity
              style={styles.card}
              testID={`search-member-result-${member.id}`}
              onPress={() => navigation.navigate('Members', { screen: 'MemberDetail', params: { memberId: member.id } })}
            >
              <Text style={styles.typeTag}>MEMBER</Text>
              <Text style={styles.title} testID={`search-member-name-${member.id}`}>{member.name}</Text>
              <Text style={styles.sub}>{member.memberNumber} · {member.email}</Text>
            </TouchableOpacity>
          );
        }}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  input: { margin: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
  card: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 1 },
  typeTag: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sub: { color: '#6b7280', fontSize: 13 },
  noResults: { textAlign: 'center', color: '#9ca3af', marginTop: 32, fontSize: 16 },
});
