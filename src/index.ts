import handle, { getEndpoint } from "@modelfetch/bun";
import { createServer } from "./server";

async function main() {
	try {
		console.log("Starting MCP Todo Server...");
		const { server } = await createServer();

		// Run as a Bun HTTP server
		const bunServer = handle(server, {
			port: process.env.PORT || 3000,
		});

		// Log the endpoint when the server starts listening
		console.log(`MCP server is available at ${getEndpoint(bunServer)}`);
		console.error("MCP Todo Server started successfully");
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

main();
