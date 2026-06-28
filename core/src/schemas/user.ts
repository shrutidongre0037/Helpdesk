import { z } from 'zod';

export enum Role {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role, { required_error: 'Role is required' }),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.union([
    z.string().trim().min(8, 'Password must be at least 8 characters'),
    z.string().trim().length(0),
    z.undefined()
  ]).optional(),
  role: z.nativeEnum(Role, { required_error: 'Role is required' }),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
