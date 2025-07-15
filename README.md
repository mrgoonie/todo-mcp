# TODO MCP Server

A Model Context Protocol (MCP) server for managing todo lists and items with webhook notifications, built with Bun and TypeScript.

## Features

### Todo List Management
- **Create** new todo lists with names and descriptions
- **Read** individual lists or get all lists
- **Update** list names and descriptions
- **Delete** lists (cascades to all items)

### Todo Item Management
- **CRUD Operations**: Create, read, update, delete todo items
- **Assignee Support**: Assign todos to specific people
- **Priority Levels**: None, low, medium, high
- **Status Tracking**: pending, in_progress, completed, cancelled
- **Tags**: Flexible tagging system for categorization
- **Due Dates**: Set deadlines for tasks
- **Snooze Functionality**: Temporarily hide items until a specific time

### Advanced Features
- **Recurrence**: Daily, weekly, monthly, or specific weekdays
- **Search**: Find todos by title, description, or keywords
- **Filtering**: Filter by assignee, tags, status, priority, due dates
- **Sorting**: Sort by time, priority, creation date, or update date
- **Pagination**: Limit and offset for large datasets
- **Notifications**: Webhook notifications for approaching deadlines

## Installation

### Prerequisites
- [Bun](https://bun.sh) runtime
- SQLite3 (included with most systems)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd mcp-todo

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables
```env
# webhook URL for task notifications (optional)
NOTIFICATION_WEBHOOK=http://localhost:3000/api/webhooks/your-webhook-url

# Database configuration
DATABASE_PATH=./todo.db

# Server configuration
MCP_SERVER_NAME=mcp-todo
MCP_SERVER_VERSION=1.0.0
```

## Usage

### Development
```bash
# Start in development mode with auto-reload
bun run dev

# Run type checking
bun run typecheck

# Run tests
bun test
```

### Production
```bash
# Start the server
bun run start

# Or build and run with Docker
docker-compose up -d
```

## MCP Tools

The server provides the following MCP tools:

### Todo List Operations
- `createTodoList` - Create a new todo list
- `getTodoList` - Get a todo list by ID
- `getAllTodoLists` - Get all todo lists
- `updateTodoList` - Update a todo list
- `deleteTodoList` - Delete a todo list

### Todo Item Operations
- `createTodoItem` - Create a new todo item
- `getTodoItem` - Get a todo item by ID
- `searchTodoItems` - Search and filter todo items
- `updateTodoItem` - Update a todo item
- `markTodoDone` - Mark a todo item as completed
- `deleteTodoItem` - Delete a todo item

### Usage Examples

#### Creating a Todo List
```json
{
  "name": "Work Tasks",
  "description": "Tasks related to work projects"
}
```

#### Creating a Todo Item
```json
{
  "list_id": "list-uuid",
  "title": "Complete project documentation",
  "description": "Write comprehensive docs for the new feature",
  "assignee": "john.doe@example.com",
  "priority": "high",
  "tags": ["documentation", "urgent"],
  "due_date": "2024-12-31T23:59:59Z",
  "recurrence": {
    "type": "weekly",
    "weekdays": [1, 3, 5]
  }
}
```

#### Searching Todo Items
```json
{
  "query": "documentation",
  "status": ["pending", "in_progress"],
  "priority": ["high", "medium"],
  "assignee": "john.doe@example.com",
  "due_before": "2024-12-31T23:59:59Z",
  "sort_field": "due_date",
  "sort_order": "asc",
  "limit": 10
}
```

## Database Schema

The server uses SQLite with the following tables:

- **todo_lists**: Stores todo list information
- **todo_items**: Stores individual todo items
- **tags**: Stores unique tag names
- **todo_tags**: Many-to-many relationship between todos and tags
- **recurrences**: Stores recurrence patterns for todos

## Docker Deployment

### Using Docker Compose
```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker directly
```bash
# Build the image
docker build -t mcp-todo .

# Run the container
docker run -d \
  --name mcp-todo \
  -v todo-data:/data \
  -e NOTIFICATION_WEBHOOK=your-webhook-url \
  mcp-todo
```

## Notifications

When a `NOTIFICATION_WEBHOOK` is configured, the server will:

1. Check for tasks with due dates within the next hour every 5 minutes
2. Send webhook notifications for upcoming deadlines
3. Automatically snooze notifications for 1 hour to avoid spam
4. Include task details like title, assignee, priority, and tags

### Webhook Payload Format
```json
{
  "content": "Task deadline approaching!",
  "data": {
    "id": "string";
    "list_id": "string";
    "title": "string";
    "description": "string";
    "assignee": "string";
    "priority": "none"; // none, low, medium, high
    "status": "completed"; // pending, in_progress, completed, cancelled
    "tags": [];
    "due_date": Date;
    "snoozed_until": Date;
    "recurrence": {
      "type": "daily"; // daily, weekly, monthly, weekdays 
      "weekdays": []; // 0-6 for Sunday-Saturday
      "day_of_month": 1; // 1-31
      "next_due": Date;
    };
    "completed_at"?: Date;
    "created_at": Date;
    "updated_at": Date;
    "metadata": {};
  }
}
```

## API Reference

### Recurrence Types
- `daily`: Repeats every day
- `weekly`: Repeats on specific weekdays (0=Sunday, 6=Saturday)
- `monthly`: Repeats on a specific day of the month
- `weekdays`: Repeats on weekdays only (Monday-Friday)

### Priority Levels
- `none`: No priority set
- `low`: Low priority
- `medium`: Medium priority
- `high`: High priority

### Status Options
- `pending`: Task not started
- `in_progress`: Task is being worked on
- `completed`: Task is finished
- `cancelled`: Task was cancelled

## Development

### Project Structure
```
src/
├── db/           # Database connection and schema
├── models/       # Repository classes for data access
├── server/       # MCP server implementation
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

### Testing
```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test tests/todo-list.repository.test.ts
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

1. **Database locked error**: Ensure only one instance of the server is running
2. **Permission denied**: Check file permissions for the database path
3. **Webhook not working**: Verify the webhook URL is correct and accessible

### Debug Mode
Set `NODE_ENV=development` to enable additional logging.

## Support

For issues and questions, please:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information