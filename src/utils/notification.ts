import type { TodoItem } from "@/types";

export async function sendNotification(webhookUrl: string, todo: TodoItem): Promise<void> {
	const payload = {
		content: `Task deadline approaching!`,
		data: todo,
	};

	const response = await fetch(webhookUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(`Failed to send notification: ${response.statusText}`);
	}
}
