import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ZodError } from 'zod';
import { getAIConfig } from '../config';
import { AppError } from '../errors';
import type { AIProvider, StructuredOutputRequest } from './ai-provider';

export class OpenAIProvider implements AIProvider {
  constructor(private readonly transport?: typeof fetch) {}

  async generateStructuredOutput<T>(request: StructuredOutputRequest<T>): Promise<unknown> {
    const { apiKey, model, timeout } = getAIConfig();
    const client = new OpenAI({ apiKey, timeout, maxRetries: 0, fetch: this.transport });
    try {
      const response = await client.responses.parse({
        model,
        store: false,
        instructions: request.instructions,
        input: request.input,
        max_output_tokens: 16_000,
        text: { format: zodTextFormat(request.schema, request.schemaName) },
      });
      if (response.status !== 'completed' || !response.output_parsed) {
        throw new AppError('INVALID_AI_OUTPUT', 'The planner could not finish a valid itinerary. Please try again.', 502);
      }
      return response.output_parsed;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof OpenAI.APIConnectionTimeoutError) {
        throw new AppError('PLANNER_TIMEOUT', 'Planning took too long. Please try again.', 504);
      }
      if (error instanceof SyntaxError || error instanceof ZodError) {
        throw new AppError('INVALID_AI_OUTPUT', 'The planner returned an invalid itinerary. Please try again.', 502);
      }
      // Never log provider messages, request bodies, headers, or user preferences.
      console.error('[provider] request failed', { status: error instanceof OpenAI.APIError ? error.status : undefined });
      throw new AppError('ITINERARY_GENERATION_FAILED', 'We could not generate your itinerary. Please try again.', 502);
    }
  }
}
