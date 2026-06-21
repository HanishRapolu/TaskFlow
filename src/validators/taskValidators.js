import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  listId: z.string().min(1, 'List ID is required'),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

export const moveTaskSchema = z.object({
  newListId: z.string().min(1, 'New List ID is required'),
  newOrder: z.number().int(),
});
