-- Todo lists table
CREATE TABLE IF NOT EXISTS todo_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Todo items table
CREATE TABLE IF NOT EXISTS todo_items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    priority TEXT NOT NULL CHECK(priority IN ('none', 'low', 'medium', 'high')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date DATETIME,
    snoozed_until DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES todo_lists(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Todo-Tag relationship table
CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todo_items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Recurrence table
CREATE TABLE IF NOT EXISTS recurrences (
    todo_id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('daily', 'weekly', 'monthly', 'weekdays')),
    weekdays TEXT, -- JSON array of weekday numbers (0-6)
    day_of_month INTEGER,
    next_due DATETIME,
    FOREIGN KEY (todo_id) REFERENCES todo_items(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todo_items_list_id ON todo_items(list_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todo_items_priority ON todo_items(priority);
CREATE INDEX IF NOT EXISTS idx_todo_items_assignee ON todo_items(assignee);
CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);

-- Triggers to update updated_at
CREATE TRIGGER IF NOT EXISTS update_todo_lists_timestamp 
AFTER UPDATE ON todo_lists
BEGIN
    UPDATE todo_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_todo_items_timestamp 
AFTER UPDATE ON todo_items
BEGIN
    UPDATE todo_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;