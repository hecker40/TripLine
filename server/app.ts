import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripPreferencesSchema } from '../shared/preferences';
import { PlannerAgent } from './agents/planner-agent';
import { AppError } from './errors';
import { OpenAIProvider } from './providers/openai-provider';
import type { AIProvider } from './providers/ai-provider';

const MAX_BODY_BYTES = 16_384;
const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
};

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Send preferences as application/json.', 415);
  }
  let size = 0;
  const chunks: Buffer[] = [];
  // Do not destroy the socket before returning the useful 413 response.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      req.resume();
      throw new AppError('REQUEST_TOO_LARGE', 'Trip preferences are too large.', 413);
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new AppError('INVALID_JSON', 'The request must contain valid JSON.', 400);
  }
}

async function serveFrontend(pathname: string, req: IncomingMessage, res: ServerResponse) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded === '/' || decoded === '/plan' ? 'index.html' : decoded.slice(1);
  const filename = path.resolve(dist, relative);
  if (!filename.startsWith(`${dist}${path.sep}`) || relative.split('/').some((part) => part.startsWith('.'))) {
    throw new AppError('NOT_FOUND', 'Not found.', 404);
  }
  let body: Buffer;
  try {
    body = await readFile(filename);
  } catch {
    throw new AppError('NOT_FOUND', 'Not found. Run npm run build before starting the production server.', 404);
  }
  res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filename)] || 'application/octet-stream' });
  res.end(req.method === 'HEAD' ? undefined : body);
}

export function createApp(provider: AIProvider = new OpenAIProvider()) {
  const planner = new PlannerAgent(provider);
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;
      if (pathname === '/api/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, service: 'travelos' });
      } else if (pathname === '/api/trips/generate') {
        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST');
          throw new AppError('METHOD_NOT_ALLOWED', 'Use POST to generate a trip.', 405);
        }
        const parsed = tripPreferencesSchema.safeParse(await readJson(req));
        if (!parsed.success) {
          throw new AppError('INVALID_PREFERENCES', 'Check your destination, dates (1–7 days), travelers, budget, and preferences.', 400);
        }
        const itinerary = await planner.generateItinerary(parsed.data);
        sendJson(res, 200, { itinerary });
      } else if (pathname.startsWith('/api/')) {
        throw new AppError('NOT_FOUND', 'API endpoint not found.', 404);
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        await serveFrontend(pathname, req, res);
      } else {
        throw new AppError('NOT_FOUND', 'Not found.', 404);
      }
    } catch (error) {
      const failure = error instanceof AppError ? error
        : new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);
      console.error('[api]', { code: failure.code, status: failure.status });
      sendJson(res, failure.status, { error: { code: failure.code, message: failure.message } });
    }
  });
}
