import { getDatabase } from '../database';

export interface Member {
  id: number;
  memberNumber: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export async function getAllMembers(): Promise<Member[]> {
  const db = await getDatabase();
  return db.getAllAsync<Member>('SELECT * FROM members ORDER BY name ASC');
}

export async function getMemberById(id: number): Promise<Member | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Member>('SELECT * FROM members WHERE id = ?', [id]);
}

export async function searchMembers(query: string): Promise<Member[]> {
  const db = await getDatabase();
  const q = `%${query}%`;
  return db.getAllAsync<Member>(
    'SELECT * FROM members WHERE name LIKE ? OR email LIKE ? OR memberNumber LIKE ? ORDER BY name ASC',
    [q, q, q]
  );
}

async function nextMemberNumber(): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ memberNumber: string }>(
    "SELECT memberNumber FROM members ORDER BY memberNumber DESC LIMIT 1"
  );
  if (!row) return 'M0001';
  const num = parseInt(row.memberNumber.slice(1), 10) + 1;
  return `M${String(num).padStart(4, '0')}`;
}

export async function createMember(data: { name: string; email: string }): Promise<number> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync('SELECT id FROM members WHERE email = ?', [data.email]);
  if (existing) throw new Error('A member with this email already exists.');
  const memberNumber = await nextMemberNumber();
  const result = await db.runAsync(
    `INSERT INTO members (memberNumber, name, email, status) VALUES (?, ?, ?, 'active')`,
    [memberNumber, data.name, data.email]
  );
  return result.lastInsertRowId;
}

export async function updateMember(id: number, data: Partial<Pick<Member, 'name' | 'email' | 'status'>>): Promise<void> {
  const db = await getDatabase();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await db.runAsync(`UPDATE members SET ${fields} WHERE id = ?`, values);
}
