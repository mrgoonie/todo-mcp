a TODO MCP server using `modelfetch` follow these instructions:

## Features
* Manage todo lists: CRUD
* Manage todo items: CRUD, assignee, snooze, recursion (daily, weekly, monthly, specific week days), priority (none, low, medium, high), tags & status
* Mark done
* Search by keywords
* Sort by time, priority
* Filter by assignee, day/week/month, tags & status

## Database: SQLite

## Environment variables
* NOTIFICATION_WEBHOOK: to post task data when meeting deadline

## Documentation
* ModelFetch: https://github.com/phuctm97/modelfetch
* Model Context Protocol TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

## Instructions
* Use BunJS
* Use Context7
* Create Dockerfile and docker-compose.yaml
* Write tests
* Write detailed README.md after finishing implementation