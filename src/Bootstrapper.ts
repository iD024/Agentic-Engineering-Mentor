import * as fs from 'fs';
import matter from 'gray-matter';
import { Database } from './Database';
import { usePedagogicalStore } from './store';

export async function bootstrapProject(db: Database) {
    if (!fs.existsSync('project-context.md')) return;

    const fileContent = fs.readFileSync('project-context.md', 'utf-8');
    const parsed = matter(fileContent);
    const milestones = parsed.data.milestones || [];

    await db.db!.run('INSERT INTO Versions (project_name) VALUES (?)', ['Todo App']);
    const result = await db.db!.get('SELECT last_insert_rowid() as id');
    const versionId = result.id;

    for (const ms of milestones) {
        await db.createSession(versionId, ms.objective);
    }

    if (milestones.length > 0) {
        usePedagogicalStore.getState().setObjective(milestones[0].objective);
    }
}
