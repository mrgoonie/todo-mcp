import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Database } from "@/db";
import { TodoListRepository } from "@/models/todo-list.repository";
import { TodoItemRepository } from "@/models/todo-item.repository";
import { createTools } from "./tools";
import { loadEnv } from "@/utils/env";
import { sendNotification } from "@/utils/notification";
import { setInterval } from "timers";

export async function createServer() {
	const env = loadEnv();

	// Initialize database
	const db = new Database(env.DATABASE_PATH);
	await db.initialize();

	// Initialize repositories
	const todoListRepo = new TodoListRepository(db);
	const todoItemRepo = new TodoItemRepository(db);

	// Create MCP server
	const server = new McpServer({
		name: env.MCP_SERVER_NAME,
		version: env.MCP_SERVER_VERSION,
		description: "A TODO MCP server for managing tasks with advanced features",
	});

	// Register tools
	const tools = createTools(todoListRepo, todoItemRepo);

	for (const [toolName, toolConfig] of Object.entries(tools)) {
		server.registerTool(
			toolName,
			{
				description: toolConfig.description,
				inputSchema: toolConfig.inputSchema,
			},
			async (args: any) => {
				const result = await toolConfig.handler(args);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}
		);
	}

	// Start deadline notification checker if webhook is configured
	if (env.NOTIFICATION_WEBHOOK) {
		setInterval(
			async () => {
				try {
					const now = new Date();
					const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

					// Find todos with upcoming deadlines
					const upcomingTodos = await todoItemRepo.search({
						status: ["pending", "in_progress"],
						due_after: now,
						due_before: oneHourFromNow,
						field: "due_date",
						order: "asc",
					});

					for (const todo of upcomingTodos) {
						if (todo.due_date && !todo.snoozed_until) {
							await sendNotification(env.NOTIFICATION_WEBHOOK!, todo);
							// Snooze for 1 hour to avoid repeated notifications
							await todoItemRepo.update(todo.id, {
								snoozed_until: oneHourFromNow,
							});
						}
					}
				} catch (error) {
					console.error("Error checking deadlines:", error);
				}
			},
			1 * 60 * 1000
		); // Check every 1 minutes
	}

	// Handle server shutdown
	process.on("SIGINT", async () => {
		await db.close();
		process.exit(0);
	});

	return { server, db };
}
