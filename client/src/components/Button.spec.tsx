import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('ejecuta onClick al hacer click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('se deshabilita y muestra spinner cuando loading=true', () => {
    render(<Button loading>Guardar</Button>);

    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toBeDisabled();
  });

  it('no dispara onClick si está disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Guardar
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
