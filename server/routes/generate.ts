import { AppError, safeError } from '../errors';
import type { AIProvider } from '../providers/ai-provider';
import { OpenAIProvider } from '../providers/openai-provider';
import { generateTrip } from '../services/generate-trip';

const MAX_BODY_BYTES = 16_384;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Send preferences as application/json.', 415);
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    throw new AppError('REQUEST_TOO_LARGE', 'Trip preferences are too large.', 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AppError('INVALID_JSON', 'The request must contain valid JSON.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new AppError('REQUEST_TOO_LARGE', 'Trip preferences are too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new AppError('INVALID_JSON', 'The request must contain valid JSON.', 400);
  }
}

export function createGenerationHandler(provider: AIProvider = new OpenAIProvider()) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return Response.json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST to generate a trip.' } }, {
        status: 405, headers: { ...headers, Allow: 'POST' },
      });
    }
    try {
      return Response.json(await generateTrip(await readJson(request), provider), { headers });
    } catch (error) {
      const failure = safeError(error);
      return Response.json({ error: { code: failure.code, message: failure.message } }, { status: failure.status, headers });
    }
  };
}
