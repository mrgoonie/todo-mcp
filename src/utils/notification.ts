import type { TodoItem } from '@/types';

export async function sendNotification(webhookUrl: string, todo: TodoItem): Promise<void> {
  const payload = {
    content: `Task deadline approaching!`,
    embeds: [{
      title: todo.title,
      description: todo.description || 'No description',
      color: todo.priority === 'high' ? 0xFF0000 : 
             todo.priority === 'medium' ? 0xFFA500 : 
             todo.priority === 'low' ? 0x00FF00 : 0x808080,
      fields: [
        {
          name: 'Assignee',
          value: todo.assignee || 'Unassigned',
          inline: true
        },
        {
          name: 'Priority',
          value: todo.priority,
          inline: true
        },
        {
          name: 'Status',
          value: todo.status,
          inline: true
        },
        {
          name: 'Due Date',
          value: todo.due_date ? todo.due_date.toISOString() : 'No due date',
          inline: true
        },
        {
          name: 'Tags',
          value: todo.tags.length > 0 ? todo.tags.join(', ') : 'No tags',
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.statusText}`);
  }
}