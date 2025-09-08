import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, createMockProject, createMockTask } from '@/test/utils';
import { ProjectCard } from '@/components/ProjectCard';

// Mock react-router-dom Link
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    const mockProject = createMockProject({
      name: 'Test Project',
      description: 'This is a test project',
      status: 'in-progress',
      dueDate: '2024-12-31',
    });

    renderWithProviders(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('This is a test project')).toBeInTheDocument();
    expect(screen.getByText('En Progreso')).toBeInTheDocument();
    expect(screen.getByText('Fecha límite: 2024-12-31')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    const completedTask = createMockTask({ status: 'completed' });
    const pendingTask = createMockTask({ status: 'not-started' });
    const inProgressTask = createMockTask({ status: 'in-progress' });
    
    const mockProject = createMockProject({
      tasks: [completedTask, pendingTask, inProgressTask],
    });

    renderWithProviders(<ProjectCard project={mockProject} />);

    // Should show 33% progress (1 completed out of 3 total tasks)
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('handles project with no tasks', () => {
    const mockProject = createMockProject({
      tasks: [],
    });

    renderWithProviders(<ProjectCard project={mockProject} />);

    // Should not show progress bar when there are no tasks
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('displays correct status variants', () => {
    const completedProject = createMockProject({ status: 'completed' });
    const pendingProject = createMockProject({ status: 'pending' });

    const { rerender } = renderWithProviders(<ProjectCard project={completedProject} />);
    expect(screen.getByText('Completado')).toBeInTheDocument();

    rerender(<ProjectCard project={pendingProject} />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('creates correct navigation link', () => {
    const mockProject = createMockProject({ id: 'test-123' });

    renderWithProviders(<ProjectCard project={mockProject} />);

    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/projects/test-123');
  });

  it('handles project without due date', () => {
    const mockProject = createMockProject({
      dueDate: undefined,
    });

    renderWithProviders(<ProjectCard project={mockProject} />);

    expect(screen.queryByText(/Fecha límite/)).not.toBeInTheDocument();
  });

  it('applies hover effects', () => {
    const mockProject = createMockProject();

    renderWithProviders(<ProjectCard project={mockProject} />);

    const cardElement = screen.getByRole('link').firstElementChild;
    expect(cardElement).toHaveClass('hover:shadow-lg', 'transition-shadow');
  });

  it('shows all completed tasks as 100% progress', () => {
    const completedTask1 = createMockTask({ status: 'completed' });
    const completedTask2 = createMockTask({ status: 'completed' });
    
    const mockProject = createMockProject({
      tasks: [completedTask1, completedTask2],
    });

    renderWithProviders(<ProjectCard project={mockProject} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles empty project name gracefully', () => {
    const mockProject = createMockProject({
      name: '',
      description: 'Project with empty name',
    });

    renderWithProviders(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Project with empty name')).toBeInTheDocument();
  });
});