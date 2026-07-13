import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, updateUserSchema, Role, type CreateUserFormValues, type UpdateUserFormValues } from '@helpdesk/core';
import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export function UserForm({ onSuccess, initialData }: UserFormProps) {
  const [createError, setCreateError] = useState('');
  const queryClient = useQueryClient();

  const isEditing = !!initialData;
  const schema = isEditing ? updateUserSchema : createUserSchema;
  type FormValues = CreateUserFormValues | UpdateUserFormValues;

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: initialData?.name || '', 
      email: initialData?.email || '', 
      password: '',
      role: initialData?.role || Role.AGENT
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");
      
      if (isEditing) {
        const response = await axios.put(`${backendUrl}/api/users/${initialData.id}`, data, { withCredentials: true });
        return response.data;
      } else {
        const response = await axios.post(`${backendUrl}/api/users`, data, { withCredentials: true });
        return response.data;
      }
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

  const onSubmit = (data: FormValues) => {
    setCreateError('');
    saveUserMutation.mutate(data);
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
          className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
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
          className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className={errors.role ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.AGENT}>Agent</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Password {isEditing && <span className="text-muted-foreground text-xs font-normal">(Leave empty to keep current password)</span>}</Label>
        <Input
          type="password"
          {...register('password')}
          autoComplete="new-password"
          placeholder={isEditing ? '••••••••' : '••••••••'}
          className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={saveUserMutation.isPending}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-600/90 text-primary-foreground"
        >
          {saveUserMutation.isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
        </Button>
      </div>
    </form>
  );
}
