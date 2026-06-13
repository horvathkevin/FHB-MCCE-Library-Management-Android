import { getDatabase } from '../database';
import { promoteReservation } from './ReservationService';

export interface Loan {
  id: number;
  bookId: number;
  memberId: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'active' | 'returned';
  fee: number;
  createdAt: string;
  // joined fields
  bookTitle?: string;
  bookIsbn?: string;
  memberName?: string;
  memberNumber?: string;
}

const LOAN_TERM_DAYS = 14;
const FEE_PER_DAY = 0.5;
const MAX_FEE = 20;
const MAX_ACTIVE_LOANS = 5;

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function getAllLoans(): Promise<Loan[]> {
  const db = await getDatabase();
  return db.getAllAsync<Loan>(`
    SELECT l.*, b.title as bookTitle, b.isbn as bookIsbn,
           m.name as memberName, m.memberNumber
    FROM loans l
    JOIN books b ON b.id = l.bookId
    JOIN members m ON m.id = l.memberId
    ORDER BY l.createdAt DESC
  `);
}

export async function getLoansByMember(memberId: number): Promise<Loan[]> {
  const db = await getDatabase();
  return db.getAllAsync<Loan>(`
    SELECT l.*, b.title as bookTitle, b.isbn as bookIsbn,
           m.name as memberName, m.memberNumber
    FROM loans l
    JOIN books b ON b.id = l.bookId
    JOIN members m ON m.id = l.memberId
    WHERE l.memberId = ?
    ORDER BY l.createdAt DESC
  `, [memberId]);
}

export async function getLoanById(id: number): Promise<Loan | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Loan>(`
    SELECT l.*, b.title as bookTitle, b.isbn as bookIsbn,
           m.name as memberName, m.memberNumber
    FROM loans l
    JOIN books b ON b.id = l.bookId
    JOIN members m ON m.id = l.memberId
    WHERE l.id = ?
  `, [id]);
}

export async function borrowBook(bookId: number, memberId: number): Promise<{ loanId: number }> {
  const db = await getDatabase();

  // Validate available copies
  const book = await db.getFirstAsync<{ availableCopies: number }>('SELECT availableCopies FROM books WHERE id = ?', [bookId]);
  if (!book || book.availableCopies < 1) throw new Error('No copies available');

  // Validate active loan count
  const loanCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM loans WHERE memberId = ? AND status = 'active'", [memberId]
  );
  if ((loanCount?.count ?? 0) >= MAX_ACTIVE_LOANS) throw new Error(`Maximum ${MAX_ACTIVE_LOANS} active loans allowed`);

  const today = new Date();
  const borrowDate = today.toISOString().split('T')[0];
  const dueDate = addDays(today, LOAN_TERM_DAYS);

  const result = await db.runAsync(
    `INSERT INTO loans (bookId, memberId, borrowDate, dueDate, status, fee) VALUES (?, ?, ?, ?, 'active', 0)`,
    [bookId, memberId, borrowDate, dueDate]
  );
  await db.runAsync('UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?', [bookId]);

  return { loanId: result.lastInsertRowId };
}

export async function returnBook(loanId: number): Promise<{ fee: number }> {
  const db = await getDatabase();

  const loan = await db.getFirstAsync<Loan>('SELECT * FROM loans WHERE id = ?', [loanId]);
  if (!loan) throw new Error('Loan not found');
  if (loan.status === 'returned') throw new Error('Book already returned');

  const today = new Date();
  const returnDate = today.toISOString().split('T')[0];
  const dueDate = new Date(loan.dueDate);
  const lateDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
  const fee = Math.min(lateDays * FEE_PER_DAY, MAX_FEE);

  await db.runAsync(
    `UPDATE loans SET returnDate = ?, status = 'returned', fee = ? WHERE id = ?`,
    [returnDate, fee, loanId]
  );
  await db.runAsync('UPDATE books SET availableCopies = availableCopies + 1 WHERE id = ?', [loan.bookId]);

  // Auto-promote first pending reservation for this book
  await promoteReservation(loan.bookId);

  return { fee };
}
