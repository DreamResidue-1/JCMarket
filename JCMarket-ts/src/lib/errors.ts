import axios from 'axios';

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong.') => {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
