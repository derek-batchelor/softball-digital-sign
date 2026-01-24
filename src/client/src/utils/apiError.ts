import axios from 'axios';

type ApiErrorPayload = {
  message?: string;
};

/**
 * Extracts a human-friendly error message from Axios or general errors.
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.message ?? error.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
};
