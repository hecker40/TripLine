export class AppError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = 'AppError';
  }
}

export function safeError(error: unknown): AppError {
  const failure = error instanceof AppError ? error
    : new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);
  console.error('[api]', { code: failure.code, status: failure.status });
  return failure;
}
