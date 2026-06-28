import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import Users from './Users';
import { useSession } from '../lib/auth';

// Mock dependencies
vi.mock('../lib/auth', () => ({
  useSession: vi.fn(),
}));

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Users Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/users" element={<Users />} />
            <Route path="/" element={<div data-testid="home-page">Home Redirect</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('redirects to / if user is not authenticated', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('redirects to / if user is authenticated but not an ADMIN', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { role: 'AGENT' }, session: {} },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders loading state when auth or query is pending', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { role: 'ADMIN' }, session: {} },
      isPending: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    // Provide a delayed mock implementation to ensure we see the loading state
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    renderComponent();

    // The component renders a skeleton when loading. There are 24 skeletons inside.
    // Instead of counting all of them, let's verify the main title shows up
    expect(screen.getByText('Users Management')).toBeInTheDocument();
    
    // Check if the skeletons are present. We know there are multiple skeletons.
    // Skeleton elements have 'animate-pulse' from Shadcn.
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error message if API fails', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { role: 'ADMIN' }, session: {} },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockedAxios.get.mockRejectedValue({
      response: { data: { error: 'Network failure' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error: Network failure')).toBeInTheDocument();
    });
  });

  it('renders users successfully', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { role: 'ADMIN' }, session: {} },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockedAxios.get.mockResolvedValue({
      data: [
        {
          id: 'user123',
          name: 'Admin Test',
          email: 'admin@test.com',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user456',
          name: 'Agent Test',
          email: 'agent@test.com',
          role: 'AGENT',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Admin Test')).toBeInTheDocument();
      expect(screen.getByText('Agent Test')).toBeInTheDocument();
    });

    // Check emails
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('agent@test.com')).toBeInTheDocument();
  });

  it('opens and closes the create user dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue({
      data: { user: { role: 'ADMIN' }, session: {} },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockedAxios.get.mockResolvedValue({ data: [] });

    renderComponent();

    // Verify dialog is initially closed (Shadcn Dialog renders as role="dialog")
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Wait for the data to load and the button to be available
    const newBtn = await screen.findByRole('button', { name: /new user/i });
    
    // Click "New User" button
    await user.click(newBtn);

    // Verify dialog opens
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument();

    // Press Escape to close
    await user.keyboard('{Escape}');
    
    // Verify dialog closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
