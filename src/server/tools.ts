import { z } from 'zod';
import type { TodoListRepository } from '@/models/todo-list.repository';
import type { TodoItemRepository } from '@/models/todo-item.repository';
import type { TodoStatus } from '@/types';

export function createTools(
  todoListRepo: TodoListRepository,
  todoItemRepo: TodoItemRepository
) {
  return {
    // Todo List Tools
    createTodoList: {
      description: 'Create a new todo list',
      inputSchema: {
        name: z.string().describe('Name of the todo list'),
        description: z.string().optional().describe('Description of the todo list')
      },
      handler: async (input: { name: string; description?: string }) => {
        const list = await todoListRepo.create(input);
        return { success: true, list };
      }
    },

    getTodoList: {
      description: 'Get a todo list by ID',
      inputSchema: {
        id: z.string().describe('ID of the todo list')
      },
      handler: async (input: { id: string }) => {
        const list = await todoListRepo.findById(input.id);
        return { success: !!list, list };
      }
    },

    getAllTodoLists: {
      description: 'Get all todo lists',
      inputSchema: {},
      handler: async () => {
        const lists = await todoListRepo.findAll();
        return { success: true, lists };
      }
    },

    updateTodoList: {
      description: 'Update a todo list',
      inputSchema: {
        id: z.string().describe('ID of the todo list'),
        name: z.string().optional().describe('New name'),
        description: z.string().optional().describe('New description')
      },
      handler: async (input: { id: string; name?: string; description?: string }) => {
        const { id, ...data } = input;
        const list = await todoListRepo.update(id, data);
        return { success: !!list, list };
      }
    },

    deleteTodoList: {
      description: 'Delete a todo list',
      inputSchema: {
        id: z.string().describe('ID of the todo list')
      },
      handler: async (input: { id: string }) => {
        const success = await todoListRepo.delete(input.id);
        return { success };
      }
    },

    // Todo Item Tools
    createTodoItem: {
      description: 'Create a new todo item',
      inputSchema: {
        list_id: z.string().describe('ID of the parent list'),
        title: z.string().describe('Title of the todo'),
        description: z.string().optional().describe('Description'),
        assignee: z.string().optional().describe('Assignee name'),
        priority: z.enum(['none', 'low', 'medium', 'high']).default('none').describe('Priority level'),
        tags: z.array(z.string()).default([]).describe('Tags for the todo'),
        due_date: z.string().optional().describe('Due date in ISO format'),
        recurrence: z.object({
          type: z.enum(['daily', 'weekly', 'monthly', 'weekdays']).describe('Recurrence type'),
          weekdays: z.array(z.number().min(0).max(6)).optional().describe('For weekly: 0=Sunday, 6=Saturday'),
          day_of_month: z.number().min(1).max(31).optional().describe('For monthly: day of month')
        }).optional().describe('Recurrence settings')
      },
      handler: async (input: any) => {
        const todoData = {
          ...input,
          status: 'pending' as TodoStatus,
          due_date: input.due_date ? new Date(input.due_date) : undefined,
          recurrence: input.recurrence ? {
            ...input.recurrence,
            next_due: input.due_date ? new Date(input.due_date) : undefined
          } : undefined
        };
        const item = await todoItemRepo.create(todoData);
        return { success: true, item };
      }
    },

    getTodoItem: {
      description: 'Get a todo item by ID',
      inputSchema: {
        id: z.string().describe('ID of the todo item')
      },
      handler: async (input: { id: string }) => {
        const item = await todoItemRepo.findById(input.id);
        return { success: !!item, item };
      }
    },

    searchTodoItems: {
      description: 'Search and filter todo items',
      inputSchema: {
        query: z.string().optional().describe('Search query for title/description'),
        list_id: z.string().optional().describe('Filter by list ID'),
        assignee: z.string().optional().describe('Filter by assignee'),
        tags: z.array(z.string()).optional().describe('Filter by tags'),
        status: z.array(z.enum(['pending', 'in_progress', 'completed', 'cancelled'])).optional().describe('Filter by status'),
        priority: z.array(z.enum(['none', 'low', 'medium', 'high'])).optional().describe('Filter by priority'),
        due_before: z.string().optional().describe('Filter by due date before (ISO format)'),
        due_after: z.string().optional().describe('Filter by due date after (ISO format)'),
        sort_field: z.enum(['due_date', 'priority', 'created_at', 'updated_at']).default('created_at').describe('Sort field'),
        sort_order: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
        limit: z.number().min(1).max(100).default(50).describe('Max items to return'),
        offset: z.number().min(0).default(0).describe('Pagination offset')
      },
      handler: async (input: any) => {
        const searchOptions = {
          ...input,
          due_before: input.due_before ? new Date(input.due_before) : undefined,
          due_after: input.due_after ? new Date(input.due_after) : undefined,
          field: input.sort_field,
          order: input.sort_order
        };
        const items = await todoItemRepo.search(searchOptions);
        return { success: true, items, count: items.length };
      }
    },

    updateTodoItem: {
      description: 'Update a todo item',
      inputSchema: {
        id: z.string().describe('ID of the todo item'),
        title: z.string().optional().describe('New title'),
        description: z.string().optional().describe('New description'),
        assignee: z.string().optional().describe('New assignee'),
        priority: z.enum(['none', 'low', 'medium', 'high']).optional().describe('New priority'),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('New status'),
        tags: z.array(z.string()).optional().describe('New tags'),
        due_date: z.string().optional().describe('New due date (ISO format)'),
        snoozed_until: z.string().optional().describe('Snooze until (ISO format)'),
        recurrence: z.object({
          type: z.enum(['daily', 'weekly', 'monthly', 'weekdays']).describe('Recurrence type'),
          weekdays: z.array(z.number().min(0).max(6)).optional().describe('For weekly: 0=Sunday, 6=Saturday'),
          day_of_month: z.number().min(1).max(31).optional().describe('For monthly: day of month')
        }).optional().nullable().describe('New recurrence (null to remove)')
      },
      handler: async (input: any) => {
        const { id, ...data } = input;
        const updateData = {
          ...data,
          due_date: data.due_date ? new Date(data.due_date) : undefined,
          snoozed_until: data.snoozed_until ? new Date(data.snoozed_until) : undefined,
          recurrence: data.recurrence === null ? null : (data.recurrence ? {
            ...data.recurrence,
            next_due: data.due_date ? new Date(data.due_date) : undefined
          } : undefined)
        };
        const item = await todoItemRepo.update(id, updateData);
        return { success: !!item, item };
      }
    },

    markTodoDone: {
      description: 'Mark a todo item as done/completed',
      inputSchema: {
        id: z.string().describe('ID of the todo item')
      },
      handler: async (input: { id: string }) => {
        const item = await todoItemRepo.markDone(input.id);
        return { success: !!item, item };
      }
    },

    deleteTodoItem: {
      description: 'Delete a todo item',
      inputSchema: {
        id: z.string().describe('ID of the todo item')
      },
      handler: async (input: { id: string }) => {
        const success = await todoItemRepo.delete(input.id);
        return { success };
      }
    }
  };
}