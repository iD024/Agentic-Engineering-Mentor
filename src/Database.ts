import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';

export class Database {
    public db: SqliteDatabase | null = null; // Changed to public for testing access

    async init(filename: string = 'pedagogy.sqlite') {
        this.db = await open({
            filename,
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS failure_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT,
                error_msg TEXT
            );
            CREATE TABLE IF NOT EXISTS Versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT
            );
            CREATE TABLE IF NOT EXISTS Sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER,
                objective_text TEXT,
                status TEXT DEFAULT 'ACTIVE',
                FOREIGN KEY(version_id) REFERENCES Versions(id)
            );
            CREATE TABLE IF NOT EXISTS Socratic_Logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                ast_constraint TEXT,
                escalation_level TEXT,
                hint_text TEXT,
                FOREIGN KEY(session_id) REFERENCES Sessions(id)
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

    async createSession(versionId: number, objective: string): Promise<number> {
        if (!this.db) throw new Error('DB not initialized');
        const result = await this.db.run(
            'INSERT INTO Sessions (version_id, objective_text) VALUES (?, ?)',
            [versionId, objective]
        );
        return result.lastID!;
    }

    async logSocraticInteraction(sessionId: number, constraint: string, level: string, hint: string) {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO Socratic_Logs (session_id, ast_constraint, escalation_level, hint_text) VALUES (?, ?, ?, ?)',
            [sessionId, constraint, level, hint]
        );
    }
}
