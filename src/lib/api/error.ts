/**
 * Shared HTTP / Axios error inspection helpers.
 *
 * The Axios response interceptor normalises errors into Error instances while
 * preserving `.status` and `.response`. These helpers let UI views distinguish
 * permission errors (403), missing routes (404), and general API failures.
 */

export function getHttpErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const errObj = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof errObj.response?.status === 'number') {
    return errObj.response.status;
  }
  if (typeof errObj.status === 'number') {
    return errObj.status;
  }
  return undefined;
}

export function isPermissionError(error: unknown): boolean {
  return getHttpErrorStatus(error) === 403;
}

export function isNotFoundError(error: unknown): boolean {
  if (getHttpErrorStatus(error) === 404) return true;
  if (error instanceof Error) {
    return (
      error.message.includes('404') ||
      error.message.includes('Cannot POST') ||
      error.message.includes('Cannot DELETE')
    );
  }
  return false;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  const errObj = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };
  const backendMsg = errObj?.response?.data?.message;
  if (typeof backendMsg === 'string' && backendMsg.trim()) {
    return backendMsg;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof errObj?.message === 'string' && errObj.message.trim()) {
    return errObj.message;
  }
  return fallback;
}
