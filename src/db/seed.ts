import { getDatabase } from './database';

const SEED_BOOKS = [
  { isbn: '9780451524935', title: '1984', author: 'George Orwell', genre: 'Dystopian', year: 1949, totalCopies: 3 },
  { isbn: '9780061096662', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', year: 1960, totalCopies: 2 },
  { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', year: 1925, totalCopies: 2 },
  { isbn: '9780316769174', title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Fiction', year: 1951, totalCopies: 2 },
  { isbn: '9780679720201', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', genre: 'Classic', year: 1866, totalCopies: 1 },
  { isbn: '9780140449136', title: 'The Odyssey', author: 'Homer', genre: 'Classic', year: -800, totalCopies: 2 },
  { isbn: '9780062316097', title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', year: 1988, totalCopies: 3 },
  { isbn: '9780525559474', title: 'The Hunger Games', author: 'Suzanne Collins', genre: 'Young Adult', year: 2008, totalCopies: 2 },
  { isbn: '9780439023481', title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', genre: 'Fantasy', year: 1997, totalCopies: 3 },
  { isbn: '9780618640157', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', genre: 'Fantasy', year: 1954, totalCopies: 2 },
];

const SEED_MEMBERS = [
  { name: 'Alice Müller', email: 'alice.mueller@example.com' },
  { name: 'Bob Schmidt', email: 'bob.schmidt@example.com' },
  { name: 'Clara Weber', email: 'clara.weber@example.com' },
  { name: 'David Fischer', email: 'david.fischer@example.com' },
  { name: 'Eva Wagner', email: 'eva.wagner@example.com' },
  { name: 'Felix Bauer', email: 'felix.bauer@example.com' },
  { name: 'Greta Koch', email: 'greta.koch@example.com' },
  { name: 'Hans Richter', email: 'hans.richter@example.com' },
];

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();
  const today = new Date();

  // Insert books
  const bookIds: number[] = [];
  for (const book of SEED_BOOKS) {
    const result = await db.runAsync(
      `INSERT INTO books (isbn, title, author, genre, year, totalCopies, availableCopies)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [book.isbn, book.title, book.author, book.genre, book.year, book.totalCopies, book.totalCopies]
    );
    bookIds.push(result.lastInsertRowId);
  }

  // Insert members
  const memberIds: number[] = [];
  for (let i = 0; i < SEED_MEMBERS.length; i++) {
    const m = SEED_MEMBERS[i];
    const memberNumber = `M${String(i + 1).padStart(4, '0')}`;
    const result = await db.runAsync(
      `INSERT INTO members (memberNumber, name, email, status) VALUES (?, ?, ?, 'active')`,
      [memberNumber, m.name, m.email]
    );
    memberIds.push(result.lastInsertRowId);
  }

  // Seed 3 active loans (books 0,1,2 borrowed by members 0,1,2)
  const activeLoans = [
    { bookIdx: 0, memberIdx: 0, daysAgo: 5 },
    { bookIdx: 1, memberIdx: 1, daysAgo: 3 },
    { bookIdx: 2, memberIdx: 2, daysAgo: 16 }, // overdue
  ];
  for (const loan of activeLoans) {
    const borrowDate = addDays(today, -loan.daysAgo);
    const dueDate = addDays(today, -loan.daysAgo + 14);
    await db.runAsync(
      `INSERT INTO loans (bookId, memberId, borrowDate, dueDate, status, fee)
       VALUES (?, ?, ?, ?, 'active', 0)`,
      [bookIds[loan.bookIdx], memberIds[loan.memberIdx], borrowDate, dueDate]
    );
    await db.runAsync(
      `UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?`,
      [bookIds[loan.bookIdx]]
    );
  }

  // Seed 1 returned loan with a fee
  const returnedBorrowDate = addDays(today, -20);
  const returnedDueDate = addDays(today, -6);
  const returnedReturnDate = addDays(today, -2);
  const lateDays = 4;
  const fee = Math.min(lateDays * 0.5, 20);
  await db.runAsync(
    `INSERT INTO loans (bookId, memberId, borrowDate, dueDate, returnDate, status, fee)
     VALUES (?, ?, ?, ?, ?, 'returned', ?)`,
    [bookIds[3], memberIds[3], returnedBorrowDate, returnedDueDate, returnedReturnDate, fee]
  );

  // Seed 2 reservations
  await db.runAsync(
    `INSERT INTO reservations (bookId, memberId, status) VALUES (?, ?, 'pending')`,
    [bookIds[0], memberIds[4]]
  );
  await db.runAsync(
    `INSERT INTO reservations (bookId, memberId, status) VALUES (?, ?, 'pending')`,
    [bookIds[1], memberIds[5]]
  );
}

export async function reseedDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM reservations;
    DELETE FROM loans;
    DELETE FROM members;
    DELETE FROM books;
    DELETE FROM sqlite_sequence WHERE name IN ('books','members','loans','reservations');
  `);
  await seedDatabase();
}

export async function isDatabaseSeeded(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM books');
  return (result?.count ?? 0) > 0;
}
