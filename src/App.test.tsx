import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('gallery application', () => {
  it('filters cards and exposes a useful empty state', () => {
    const { container } = render(<App />);

    const total = screen.getByText(/\d+ of \d+ templates/);
    expect(total).toHaveTextContent('10 of 10 templates');
    expect(container.querySelector('.card-visual')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="generated/previews"]')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search templates' }), {
      target: { value: 'no-such-template' },
    });

    expect(screen.getByRole('heading', { name: 'No templates match yet' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset all filters' })).toBeEnabled();
  });

  it('filters by a generated Rayfin capability', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Power BI' }));

    expect(screen.getByText('1 of 10 templates')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Power BI Fixer' })).toBeVisible();
  });

  it('switches themes and persists the preference', () => {
    window.localStorage.setItem('awesome-rayfin-theme', 'dark');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('awesome-rayfin-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  });
});
