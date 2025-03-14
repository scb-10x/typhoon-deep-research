export class AiError extends Error {
  constructor(
    public readonly source: string,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export function throwAiError(source: string, error: Error | unknown): never {
  if (error instanceof Error) {
    throw new AiError(source, error.message, error);
  } else {
    throw new AiError(source, String(error));
  }
} 