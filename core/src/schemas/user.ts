import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
