import { Database } from '@/db';
import type { TodoList } from '@/types';
import { randomUUID } from 'crypto';

export class TodoListRepository {
  constructor(private db: Database) {}

  async create(data: Omit<TodoList, 'id' | 'created_at' | 'updated_at'>): Promise<TodoList> {
    const id = randomUUID();
    const now = new Date();
    
    await this.db.run(
      `INSERT INTO todo_lists (id, name, description, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.name, data.description || null, now.toISOString(), now.toISOString()]
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Failed to create todo list');
    return created;
  }

  async findById(id: string): Promise<TodoList | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM todo_lists WHERE id = ?',
      [id]
    );
    
    return row ? this.mapRowToTodoList(row) : null;
  }

  async findAll(): Promise<TodoList[]> {
    const rows = await this.db.all<any>('SELECT * FROM todo_lists ORDER BY created_at DESC');
    return rows.map(row => this.mapRowToTodoList(row));
  }

  async update(id: string, data: Partial<Omit<TodoList, 'id' | 'created_at' | 'updated_at'>>): Promise<TodoList | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description || null);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    await this.db.run(
      `UPDATE todo_lists SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.run('DELETE FROM todo_lists WHERE id = ?', [id]);
    return true;
  }

  private mapRowToTodoList(row: any): TodoList {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}