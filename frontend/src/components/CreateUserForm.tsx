import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserFormValues } from '@helpdesk/core';
import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateUserFormProps {
  onSuccess: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [createError, setCreateError] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormValues) => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.post(`${backendUrl}/api/users`, data, { withCredentials: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onSuccess();
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create user');
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    setCreateError('');
    createUserMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
      {createError && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {createError}
        </div>
      )}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          type="text"
          {...register('name')}
          autoComplete="off"
          placeholder="John Doe"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          {...register('email')}
          autoComplete="new-email"
          placeholder="john@example.com"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          {...register('password')}
          autoComplete="new-password"
          placeholder="••••••••"
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={createUserMutation.isPending}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-600/90 text-primary-foreground"
        >
          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
