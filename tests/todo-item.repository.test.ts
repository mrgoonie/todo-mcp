import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from '../src/db';
import { TodoListRepository } from '../src/models/todo-list.repository';
import { TodoItemRepository } from '../src/models/todo-item.repository';
import { unlinkSync } from 'node:fs';

describe('TodoItemRepository', () => {
  let db: Database;
  let listRepo: TodoListRepository;
  let itemRepo: TodoItemRepository;
  let testListId: string;
  const testDbPath = './test-todo-item.db';

  beforeEach(async () => {
    db = new Database(testDbPath);
    await db.initialize();
    listRepo = new TodoListRepository(db);
    itemRepo = new TodoItemRepository(db);
    
    // Create a test list
    const list = await listRepo.create({ name: 'Test List' });
    testListId = list.id;
  });

  afterEach(async () => {
    await db.close();
    try {
      unlinkSync(testDbPath);
    } catch {}
  });

  test('should create a todo item', async () => {
    const item = await itemRepo.create({
      list_id: testListId,
      title: 'Test Todo',
      description: 'Test Description',
      assignee: 'John Doe',
      priority: 'high',
      status: 'pending',
      tags: ['urgent', 'work'],
      due_date: new Date('2024-12-31')
    });

    expect(item.id).toBeTruthy();
    expect(item.title).toBe('Test Todo');
    expect(item.assignee).toBe('John Doe');
    expect(item.priority).toBe('high');
    expect(item.tags).toEqual(['urgent', 'work']);
  });

  test('should create todo item with recurrence', async () => {
    const item = await itemRepo.create({
      list_id: testListId,
      title: 'Recurring Task',
      priority: 'medium',
      status: 'pending',
      tags: [],
      recurrence: {
        type: 'weekly',
        weekdays: [1, 3, 5], // Mon, Wed, Fri
        next_due: new Date('2024-12-31')
      }
    });

    expect(item.recurrence).toBeTruthy();
    expect(item.recurrence?.type).toBe('weekly');
    expect(item.recurrence?.weekdays).toEqual([1, 3, 5]);
  });

  test('should search todo items', async () => {
    await itemRepo.create({
      list_id: testListId,
      title: 'Find me',
      priority: 'high',
      status: 'pending',
      tags: ['important']
    });

    await itemRepo.create({
      list_id: testListId,
      title: 'Another task',
      priority: 'low',
      status: 'completed',
      tags: ['done']
    });

    const results = await itemRepo.search({
      query: 'Find',
      priority: ['high'],
      field: 'created_at',
      order: 'desc'
    });

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Find me');
  });

  test('should filter by tags', async () => {
    await itemRepo.create({
      list_id: testListId,
      title: 'Task 1',
      priority: 'none',
      status: 'pending',
      tags: ['work', 'urgent']
    });

    await itemRepo.create({
      list_id: testListId,
      title: 'Task 2',
      priority: 'none',
      status: 'pending',
      tags: ['personal']
    });

    const results = await itemRepo.search({
      tags: ['work'],
      field: 'created_at',
      order: 'desc'
    });

    expect(results.length).toBe(1);
    expect(results[0].tags).toContain('work');
  });

  test('should update todo item', async () => {
    const item = await itemRepo.create({
      list_id: testListId,
      title: 'Original',
      priority: 'low',
      status: 'pending',
      tags: ['old']
    });

    const updated = await itemRepo.update(item.id, {
      title: 'Updated',
      priority: 'high',
      tags: ['new', 'updated']
    });

    expect(updated?.title).toBe('Updated');
    expect(updated?.priority).toBe('high');
    expect(updated?.tags).toEqual(['new', 'updated']);
  });

  test('should mark todo as done', async () => {
    const item = await itemRepo.create({
      list_id: testListId,
      title: 'Complete me',
      priority: 'medium',
      status: 'pending',
      tags: []
    });

    const completed = await itemRepo.markDone(item.id);

    expect(completed?.status).toBe('completed');
    expect(completed?.completed_at).toBeInstanceOf(Date);
  });

  test('should delete todo item', async () => {
    const item = await itemRepo.create({
      list_id: testListId,
      title: 'Delete me',
      priority: 'none',
      status: 'pending',
      tags: []
    });

    const result = await itemRepo.delete(item.id);
    expect(result).toBe(true);

    const found = await itemRepo.findById(item.id);
    expect(found).toBeNull();
  });
});