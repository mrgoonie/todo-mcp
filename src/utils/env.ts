import { z } from "zod";

const envSchema = z.object({
	NOTIFICATION_WEBHOOK: z.union([z.literal(""), z.string().trim().url()]),
	DATABASE_PATH: z.string().default("./todo.db"),
	MCP_SERVER_NAME: z.string().default("mcp-todo"),
	MCP_SERVER_VERSION: z.string().default("1.0.0"),
});

export function loadEnv() {
	const env = {
		NOTIFICATION_WEBHOOK: process.env.NOTIFICATION_WEBHOOK,
		DATABASE_PATH: process.env.DATABASE_PATH,
		MCP_SERVER_NAME: process.env.MCP_SERVER_NAME,
		MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION,
	};

	return envSchema.parse(env);
}

export type Env = ReturnType<typeof loadEnv>;
