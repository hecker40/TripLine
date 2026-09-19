import type { z } from 'zod';

export interface StructuredOutputRequest<T> {
  instructions: string;
  input: string;
  schema: z.ZodType<T>;
  schemaName: string;
}

export interface AIProvider {
  generateStructuredOutput<T>(request: StructuredOutputRequest<T>): Promise<unknown>;
}
