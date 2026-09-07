import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('gallery application', () => {
  it('filters cards and exposes a useful empty state', () => {
    render(<App />);

    const total = screen.getByText(/\d+ of \d+ templates/);
    expect(total).toHaveTextContent('10 of 10 templates');

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
});
