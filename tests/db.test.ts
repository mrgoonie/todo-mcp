import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from '../src/db';
import { unlinkSync } from 'node:fs';

describe('Database', () => {
  let db: Database;
  const testDbPath = './test-todo.db';

  beforeEach(async () => {
    db = new Database(testDbPath);
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
    try {
      unlinkSync(testDbPath);
    } catch {}
  });

  test('should initialize database with schema', async () => {
    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('todo_lists');
    expect(tableNames).toContain('todo_items');
    expect(tableNames).toContain('tags');
    expect(tableNames).toContain('todo_tags');
    expect(tableNames).toContain('recurrences');
  });

  test('should execute transactions', async () => {
    const result = await db.transaction(async () => {
      await db.run('INSERT INTO todo_lists (id, name) VALUES (?, ?)', ['test-id', 'Test List']);
      return await db.get<{ id: string; name: string }>('SELECT * FROM todo_lists WHERE id = ?', ['test-id']);
    });

    expect(result?.id).toBe('test-id');
    expect(result?.name).toBe('Test List');
  });

  test('should rollback transaction on error', async () => {
    try {
      await db.transaction(async () => {
        await db.run('INSERT INTO todo_lists (id, name) VALUES (?, ?)', ['test-id', 'Test List']);
        throw new Error('Rollback test');
      });
    } catch {}

    const result = await db.get('SELECT * FROM todo_lists WHERE id = ?', ['test-id']);
    expect(result).toBeUndefined();
  });
});