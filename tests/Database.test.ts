import { Database } from '../src/Database';
import * as fs from 'fs';

describe('Database', () => {
    let db: Database;
    
    beforeEach(async () => {
        if (fs.existsSync('test.sqlite')) fs.unlinkSync('test.sqlite');
        db = new Database();
        await db.init('test.sqlite');
    });

    afterEach(async () => {
        if (fs.existsSync('test.sqlite')) fs.unlinkSync('test.sqlite');
    });

    it('should create session and log socratic interaction', async () => {
        await (db as any).db.run('INSERT INTO Versions (project_name) VALUES (?)', ['Test Project']);
        const versionId = 1;
        const sessionId = await db.createSession(versionId, 'Test Objective');
        expect(sessionId).toBe(1);
        
        await db.logSocraticInteraction(sessionId, 'AST constraint', 'Inquiry', 'Test hint');
        const count = await (db as any).db.get('SELECT COUNT(*) as count FROM Socratic_Logs');
        expect(count.count).toBe(1);
    });
});
