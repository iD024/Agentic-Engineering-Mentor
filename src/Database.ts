import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';

export class Database {
    private db: SqliteDatabase | null = null;

    async init() {
        this.db = await open({
            filename: 'pedagogy.sqlite',
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS failure_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT,
                error_msg TEXT
            );
        `);
    }

    async logFailure(filePath: string, errorMsg: string) {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO failure_logs (file_path, error_msg) VALUES (?, ?)',
            [filePath, errorMsg]
        );
    }

    async getFailureCount(filePath: string): Promise<number> {
        if (!this.db) return 0;
        const result = await this.db.get(
            'SELECT COUNT(*) as count FROM failure_logs WHERE file_path = ?',
            [filePath]
        );
        return result?.count || 0;
    }
}
