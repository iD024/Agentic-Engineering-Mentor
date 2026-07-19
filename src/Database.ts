import * as sqlite3 from 'sqlite3';
import { open, Database as SQLiteDB } from 'sqlite';

export class Database {
    private db: SQLiteDB | null = null;

    constructor(private filename: string = ':memory:') {}

    async init() {
        this.db = await open({
            filename: this.filename,
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS Socratic_Logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                constraint_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    async logFailure(sessionId: string, constraintId: string) {
        if (!this.db) throw new Error('DB not initialized');
        await this.db.run(
            'INSERT INTO Socratic_Logs (session_id, constraint_id) VALUES (?, ?)',
            [sessionId, constraintId]
        );
    }

    async getFailureCount(sessionId: string, constraintId: string): Promise<number> {
        if (!this.db) throw new Error('DB not initialized');
        const row = await this.db.get(
            'SELECT COUNT(*) as count FROM Socratic_Logs WHERE session_id = ? AND constraint_id = ?',
            [sessionId, constraintId]
        );
        return row ? row.count : 0;
    }
}
