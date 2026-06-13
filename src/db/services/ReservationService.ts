import { getDatabase } from '../database';

export interface Reservation {
  id: number;
  bookId: number;
  memberId: number;
  status: 'pending' | 'ready' | 'cancelled';
  createdAt: string;
  // joined
  bookTitle?: string;
  bookIsbn?: string;
  memberName?: string;
  memberNumber?: string;
}

const MAX_RESERVATIONS_PER_BOOK = 3;

export async function getAllReservations(): Promise<Reservation[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reservation>(`
    SELECT r.*, b.title as bookTitle, b.isbn as bookIsbn,
           m.name as memberName, m.memberNumber
    FROM reservations r
    JOIN books b ON b.id = r.bookId
    JOIN members m ON m.id = r.memberId
    ORDER BY r.createdAt DESC
  `);
}

export async function getReservationsByBook(bookId: number): Promise<Reservation[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reservation>(`
    SELECT r.*, b.title as bookTitle, m.name as memberName, m.memberNumber
    FROM reservations r
    JOIN books b ON b.id = r.bookId
    JOIN members m ON m.id = r.memberId
    WHERE r.bookId = ? AND r.status IN ('pending','ready')
    ORDER BY r.createdAt ASC
  `, [bookId]);
}

export async function createReservation(bookId: number, memberId: number): Promise<number> {
  const db = await getDatabase();

  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM reservations WHERE bookId = ? AND status IN ('pending','ready')", [bookId]
  );
  if ((count?.count ?? 0) >= MAX_RESERVATIONS_PER_BOOK) throw new Error(`Max ${MAX_RESERVATIONS_PER_BOOK} reservations per book`);

  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM reservations WHERE bookId = ? AND memberId = ? AND status IN ('pending','ready')", [bookId, memberId]
  );
  if (existing) throw new Error('You already have an active reservation for this book');

  const result = await db.runAsync(
    `INSERT INTO reservations (bookId, memberId, status) VALUES (?, ?, 'pending')`,
    [bookId, memberId]
  );
  return result.lastInsertRowId;
}

export async function cancelReservation(reservationId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE reservations SET status = 'cancelled' WHERE id = ?`, [reservationId]
  );
}

// Called internally when a book is returned
export async function promoteReservation(bookId: number): Promise<void> {
  const db = await getDatabase();
  const next = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM reservations WHERE bookId = ? AND status = 'pending' ORDER BY createdAt ASC LIMIT 1",
    [bookId]
  );
  if (next) {
    await db.runAsync("UPDATE reservations SET status = 'ready' WHERE id = ?", [next.id]);
  }
}
