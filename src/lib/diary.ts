import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'diary.db';

export type Entry = { clientId: string; content: string; writtenAt: string; syncedAt: string | null };

export type Insight = { id: string; body: string; createdAt: string };

/** Everything sync needs from local storage; the SQLite implementation is {@link SqliteDiary}. */
export interface DiaryStore {
  unsyncedEntries(limit: number): Promise<Entry[]>;
  markSynced(clientId: string, syncedAt: string): Promise<void>;
  /** After the account is replaced, every entry must be uploaded again. */
  markAllUnsynced(): Promise<void>;
  /** Returns false when the insight was already stored. */
  saveInsight(insight: Insight): Promise<boolean>;
}

// Append only: each step runs once per device, in order, tracked by PRAGMA user_version.
const MIGRATIONS = [
  `CREATE TABLE entries (
     client_id  TEXT PRIMARY KEY NOT NULL,
     content    TEXT NOT NULL,
     written_at TEXT NOT NULL,
     synced_at  TEXT
   );
   CREATE INDEX entries_unsynced ON entries (written_at) WHERE synced_at IS NULL;
   CREATE TABLE insights (
     id         TEXT PRIMARY KEY NOT NULL,
     body       TEXT NOT NULL,
     created_at TEXT NOT NULL
   );`,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let version = row?.user_version ?? 0; version < MIGRATIONS.length; version++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[version]);
      await txn.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

type EntryRow = { client_id: string; content: string; written_at: string; synced_at: string | null };
type InsightRow = { id: string; body: string; created_at: string };

const toEntry = (row: EntryRow): Entry => ({
  clientId: row.client_id,
  content: row.content,
  writtenAt: row.written_at,
  syncedAt: row.synced_at,
});

const toInsight = (row: InsightRow): Insight => ({ id: row.id, body: row.body, createdAt: row.created_at });

export class SqliteDiary implements DiaryStore {
  constructor(private readonly db: SQLiteDatabase) {}

  async addEntry(entry: Entry): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO entries (client_id, content, written_at, synced_at) VALUES (?, ?, ?, ?)',
      [entry.clientId, entry.content, entry.writtenAt, entry.syncedAt],
    );
  }

  async entries(): Promise<Entry[]> {
    return (await this.db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY written_at')).map(toEntry);
  }

  async insights(): Promise<Insight[]> {
    return (await this.db.getAllAsync<InsightRow>('SELECT * FROM insights ORDER BY created_at')).map(toInsight);
  }

  async unsyncedEntries(limit: number): Promise<Entry[]> {
    const rows = await this.db.getAllAsync<EntryRow>(
      'SELECT * FROM entries WHERE synced_at IS NULL ORDER BY written_at LIMIT ?',
      [limit],
    );
    return rows.map(toEntry);
  }

  async markSynced(clientId: string, syncedAt: string): Promise<void> {
    await this.db.runAsync('UPDATE entries SET synced_at = ? WHERE client_id = ?', [syncedAt, clientId]);
  }

  async markAllUnsynced(): Promise<void> {
    await this.db.runAsync('UPDATE entries SET synced_at = NULL');
  }

  async saveInsight(insight: Insight): Promise<boolean> {
    const result = await this.db.runAsync(
      'INSERT OR IGNORE INTO insights (id, body, created_at) VALUES (?, ?, ?)',
      [insight.id, insight.body, insight.createdAt],
    );
    return result.changes > 0;
  }
}

export type TimelineItem =
  | { kind: 'entry'; key: string; at: string; entry: Entry }
  | { kind: 'insight'; key: string; at: string; insight: Insight };

/** Entries and insights interleaved, newest first (the chat list renders inverted). */
export function timeline(entries: Entry[], insights: Insight[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...entries.map((entry) => ({ kind: 'entry' as const, key: `e:${entry.clientId}`, at: entry.writtenAt, entry })),
    ...insights.map((insight) => ({
      kind: 'insight' as const,
      key: `i:${insight.id}`,
      at: insight.createdAt,
      insight,
    })),
  ];
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
