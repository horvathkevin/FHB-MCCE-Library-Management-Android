import { getDatabase } from '../database';

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  year: number;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDatabase();
  return db.getAllAsync<Book>('SELECT * FROM books ORDER BY title ASC');
}

export async function getBookById(id: number): Promise<Book | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Book>('SELECT * FROM books WHERE id = ?', [id]);
}

export async function searchBooks(query: string): Promise<Book[]> {
  const db = await getDatabase();
  const q = `%${query}%`;
  return db.getAllAsync<Book>(
    'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? ORDER BY title ASC',
    [q, q, q]
  );
}

export async function createBook(data: Omit<Book, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO books (isbn, title, author, genre, year, totalCopies, availableCopies)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.isbn, data.title, data.author, data.genre, data.year, data.totalCopies, data.availableCopies]
  );
  return result.lastInsertRowId;
}

export async function updateBook(id: number, data: Partial<Omit<Book, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDatabase();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await db.runAsync(`UPDATE books SET ${fields} WHERE id = ?`, values);
}

export async function deleteBook(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
}
