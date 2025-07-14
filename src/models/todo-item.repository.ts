import { Database } from '@/db';
import type { TodoItem, SearchOptions, SortOptions, PaginationOptions, RecurrenceType } from '@/types';
import { randomUUID } from 'crypto';

export class TodoItemRepository {
  constructor(private db: Database) {}

  async create(data: Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>): Promise<TodoItem> {
    const id = randomUUID();
    const now = new Date();
    
    await this.db.transaction(async () => {
      // Insert todo item
      await this.db.run(
        `INSERT INTO todo_items (
          id, list_id, title, description, assignee, priority, status,
          due_date, snoozed_until, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, data.list_id, data.title, data.description || null,
          data.assignee || null, data.priority, data.status,
          data.due_date?.toISOString() || null,
          data.snoozed_until?.toISOString() || null,
          data.completed_at?.toISOString() || null,
          now.toISOString(), now.toISOString()
        ]
      );

      // Handle tags
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          await this.db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [tagName]);
          const tag = await this.db.get<{ id: number }>('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (tag) {
            await this.db.run('INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [id, tag.id]);
          }
        }
      }

      // Handle recurrence
      if (data.recurrence) {
        await this.db.run(
          `INSERT INTO recurrences (todo_id, type, weekdays, day_of_month, next_due) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            data.recurrence.type,
            data.recurrence.weekdays ? JSON.stringify(data.recurrence.weekdays) : null,
            data.recurrence.day_of_month || null,
            data.recurrence.next_due?.toISOString() || null
          ]
        );
      }
    });

    const created = await this.findById(id);
    if (!created) throw new Error('Failed to create todo item');
    return created;
  }

  async findById(id: string): Promise<TodoItem | null> {
    const row = await this.db.get<any>(
      `SELECT ti.*, r.type as recurrence_type, r.weekdays, r.day_of_month, r.next_due,
              GROUP_CONCAT(t.name) as tags
       FROM todo_items ti
       LEFT JOIN recurrences r ON ti.id = r.todo_id
       LEFT JOIN todo_tags tt ON ti.id = tt.todo_id
       LEFT JOIN tags t ON tt.tag_id = t.id
       WHERE ti.id = ?
       GROUP BY ti.id`,
      [id]
    );
    
    return row ? this.mapRowToTodoItem(row) : null;
  }

  async search(options: SearchOptions & SortOptions & PaginationOptions): Promise<TodoItem[]> {
    let query = `
      SELECT ti.*, r.type as recurrence_type, r.weekdays, r.day_of_month, r.next_due,
             GROUP_CONCAT(DISTINCT t.name) as tags
      FROM todo_items ti
      LEFT JOIN recurrences r ON ti.id = r.todo_id
      LEFT JOIN todo_tags tt ON ti.id = tt.todo_id
      LEFT JOIN tags t ON tt.tag_id = t.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.list_id) {
      conditions.push('ti.list_id = ?');
      params.push(options.list_id);
    }
    if (options.query) {
      conditions.push('(ti.title LIKE ? OR ti.description LIKE ?)');
      params.push(`%${options.query}%`, `%${options.query}%`);
    }
    if (options.assignee) {
      conditions.push('ti.assignee = ?');
      params.push(options.assignee);
    }
    if (options.status && options.status.length > 0) {
      conditions.push(`ti.status IN (${options.status.map(() => '?').join(', ')})`);
      params.push(...options.status);
    }
    if (options.priority && options.priority.length > 0) {
      conditions.push(`ti.priority IN (${options.priority.map(() => '?').join(', ')})`);
      params.push(...options.priority);
    }
    if (options.due_before) {
      conditions.push('ti.due_date <= ?');
      params.push(options.due_before.toISOString());
    }
    if (options.due_after) {
      conditions.push('ti.due_date >= ?');
      params.push(options.due_after.toISOString());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY ti.id';

    // Handle tag filtering after grouping
    if (options.tags && options.tags.length > 0) {
      query += ` HAVING ${options.tags.map(() => 'tags LIKE ?').join(' AND ')}`;
      params.push(...options.tags.map(tag => `%${tag}%`));
    }

    // Sorting
    const sortField = options.field || 'created_at';
    const sortOrder = options.order || 'desc';
    query += ` ORDER BY ti.${sortField} ${sortOrder}`;

    // Pagination
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = await this.db.all<any>(query, params);
    return rows.map(row => this.mapRowToTodoItem(row));
  }

  async update(id: string, data: Partial<Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>>): Promise<TodoItem | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db.transaction(async () => {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        values.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description || null);
      }
      if (data.assignee !== undefined) {
        updates.push('assignee = ?');
        values.push(data.assignee || null);
      }
      if (data.priority !== undefined) {
        updates.push('priority = ?');
        values.push(data.priority);
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        values.push(data.status);
      }
      if (data.due_date !== undefined) {
        updates.push('due_date = ?');
        values.push(data.due_date?.toISOString() || null);
      }
      if (data.snoozed_until !== undefined) {
        updates.push('snoozed_until = ?');
        values.push(data.snoozed_until?.toISOString() || null);
      }
      if (data.completed_at !== undefined) {
        updates.push('completed_at = ?');
        values.push(data.completed_at?.toISOString() || null);
      }

      if (updates.length > 0) {
        values.push(id);
        await this.db.run(
          `UPDATE todo_items SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update tags if provided
      if (data.tags !== undefined) {
        await this.db.run('DELETE FROM todo_tags WHERE todo_id = ?', [id]);
        for (const tagName of data.tags) {
          await this.db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [tagName]);
          const tag = await this.db.get<{ id: number }>('SELECT id FROM tags WHERE name = ?', [tagName]);
          if (tag) {
            await this.db.run('INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [id, tag.id]);
          }
        }
      }

      // Update recurrence if provided
      if (data.recurrence !== undefined) {
        await this.db.run('DELETE FROM recurrences WHERE todo_id = ?', [id]);
        if (data.recurrence) {
          await this.db.run(
            `INSERT INTO recurrences (todo_id, type, weekdays, day_of_month, next_due) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              data.recurrence.type,
              data.recurrence.weekdays ? JSON.stringify(data.recurrence.weekdays) : null,
              data.recurrence.day_of_month || null,
              data.recurrence.next_due?.toISOString() || null
            ]
          );
        }
      }
    });

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.run('DELETE FROM todo_items WHERE id = ?', [id]);
    return true;
  }

  async markDone(id: string): Promise<TodoItem | null> {
    return await this.update(id, {
      status: 'completed',
      completed_at: new Date()
    });
  }

  private mapRowToTodoItem(row: any): TodoItem {
    const item: TodoItem = {
      id: row.id,
      list_id: row.list_id,
      title: row.title,
      description: row.description || undefined,
      assignee: row.assignee || undefined,
      priority: row.priority,
      status: row.status,
      tags: row.tags ? row.tags.split(',') : [],
      due_date: row.due_date ? new Date(row.due_date) : undefined,
      snoozed_until: row.snoozed_until ? new Date(row.snoozed_until) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };

    if (row.recurrence_type) {
      item.recurrence = {
        type: row.recurrence_type as RecurrenceType,
        weekdays: row.weekdays ? JSON.parse(row.weekdays) : undefined,
        day_of_month: row.day_of_month || undefined,
        next_due: row.next_due ? new Date(row.next_due) : undefined
      };
    }

    return item;
  }
}