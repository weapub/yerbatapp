import { AxiosError } from 'axios';
import { ApiErrorBody } from '@/types/common';

export const getErrorMessage = (error: unknown, fallback = 'Ocurrió un error inesperado'): string => {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
