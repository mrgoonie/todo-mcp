export type Priority = 'none' | 'low' | 'medium' | 'high';
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'weekdays';

export interface TodoList {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TodoItem {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: Priority;
  status: TodoStatus;
  tags: string[];
  due_date?: Date;
  snoozed_until?: Date;
  recurrence?: {
    type: RecurrenceType;
    weekdays?: number[]; // 0-6 for Sunday-Saturday
    day_of_month?: number; // 1-31
    next_due?: Date;
  };
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SearchOptions {
  query?: string;
  assignee?: string;
  tags?: string[];
  status?: TodoStatus[];
  priority?: Priority[];
  list_id?: string;
  due_before?: Date;
  due_after?: Date;
}

export interface SortOptions {
  field: 'due_date' | 'priority' | 'created_at' | 'updated_at';
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}