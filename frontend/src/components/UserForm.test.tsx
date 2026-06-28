import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { UserForm } from './UserForm';
import { Role } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('UserForm Component', () => {
  let queryClient: QueryClient;
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <UserForm onSuccess={mockOnSuccess} />
      </QueryClientProvider>
    );
  };

  it('renders all form fields', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    const user = userEvent.setup();
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: 'Create User' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('submits form successfully and calls onSuccess', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValueOnce({ data: { id: 1 } });
    
    renderComponent();

    await user.type(screen.getByPlaceholderText('John Doe'), 'Admin User');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');

    const submitBtn = screen.getByRole('button', { name: 'Create User' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        { name: 'Admin User', email: 'admin@example.com', password: 'Password123!', role: Role.AGENT },
        { withCredentials: true }
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('displays API error message on failure', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Email already exists' } },
    });
    
    renderComponent();

    await user.type(screen.getByPlaceholderText('John Doe'), 'Admin User');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');

    const submitBtn = screen.getByRole('button', { name: 'Create User' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
