import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('extrae el mensaje del body de error de la API', () => {
    const error = new AxiosError('Request failed');
    error.response = {
      data: { error: { code: 'BAD_REQUEST', message: 'Email inválido' } },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    };

    expect(getErrorMessage(error)).toBe('Email inválido');
  });

  it('devuelve el fallback si no hay respuesta de la API', () => {
    const error = new AxiosError('Network Error');
    expect(getErrorMessage(error, 'Error de red')).toBe('Error de red');
  });

  it('devuelve el mensaje de un Error genérico', () => {
    expect(getErrorMessage(new Error('Algo falló'))).toBe('Algo falló');
  });

  it('devuelve el fallback para valores desconocidos', () => {
    expect(getErrorMessage('string suelto', 'Fallback')).toBe('Fallback');
  });
});
