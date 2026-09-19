import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../server/app';
import { AppError } from '../server/errors';
import type { AIProvider } from '../server/providers/ai-provider';
import { getAIConfig } from '../server/config';
import { OpenAIProvider } from '../server/providers/openai-provider';
import { preferences, validItinerary } from './fixtures';
import { zodTextFormat } from 'openai/helpers/zod';
import { itinerarySchema } from '../shared/itinerary';

async function request(provider: AIProvider, body: unknown = preferences, raw = false) {
  const server = createApp(provider);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/trips/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: raw ? String(body) : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('POST → validation → Planner → structured provider → output validation → response', async () => {
  let calls = 0;
  const result = await request({ async generateStructuredOutput(input) {
    calls++;
    assert.deepEqual(JSON.parse(input.input), preferences);
    assert.match(input.instructions, /NO tools or live data/);
    assert.equal(input.schemaName, 'travel_itinerary');
    return validItinerary();
  } });
  assert.equal(calls, 1);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { itinerary: validItinerary() });
});

test('provider schema converts to strict OpenAI structured output format', () => {
  const format = zodTextFormat(itinerarySchema, 'travel_itinerary');
  assert.equal(format.type, 'json_schema');
  assert.equal(format.strict, true);
});

test('invalid input is rejected before invoking the provider', async () => {
  let calls = 0;
  const result = await request({ async generateStructuredOutput() { calls++; return validItinerary(); } }, { ...preferences, travelers: 0 });
  assert.equal(calls, 0);
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'INVALID_PREFERENCES');
});

test('malformed JSON and oversized payloads receive controlled errors', async () => {
  const provider: AIProvider = { async generateStructuredOutput() { throw new Error('Must not run'); } };
  assert.equal((await request(provider, '{bad', true)).body.error.code, 'INVALID_JSON');
  assert.equal((await request(provider, 'x'.repeat(20_000), true)).status, 413);
});

test('invalid AI output never reaches the frontend as a successful itinerary', async () => {
  for (const output of [null, '{broken', { days: [] }, { ...validItinerary(), travelers: 3 }]) {
    const result = await request({ async generateStructuredOutput() { return output; } });
    assert.equal(result.status, 502);
    assert.equal(result.body.error.code, 'INVALID_AI_OUTPUT');
    assert.equal('itinerary' in result.body, false);
  }
});

test('known provider failures and timeout retain consistent safe error contracts', async () => {
  for (const [code, status] of [['PLANNER_TIMEOUT', 504], ['ITINERARY_GENERATION_FAILED', 502]] as const) {
    const result = await request({ async generateStructuredOutput() { throw new AppError(code, 'Please try again.', status); } });
    assert.equal(result.status, status);
    assert.equal(result.body.error.code, code);
  }
});

test('unexpected errors do not leak raw provider content', async () => {
  const result = await request({ async generateStructuredOutput() { throw new Error('secret-provider-detail'); } });
  assert.equal(result.status, 500);
  assert.equal(JSON.stringify(result.body).includes('secret-provider-detail'), false);
});

test('site config never falls back to the host agent key', () => {
  const previous = process.env.TRAVELOS_OPENAI_API_KEY;
  const hostKey = process.env.OPENAI_API_KEY;
  delete process.env.TRAVELOS_OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'host-key-must-not-be-used';
  try {
    assert.throws(getAIConfig, (error: unknown) => error instanceof AppError && error.code === 'AI_NOT_CONFIGURED');
    process.env.TRAVELOS_OPENAI_API_KEY = 'sk-pro…abbreviated';
    assert.throws(getAIConfig);
  } finally {
    if (previous === undefined) delete process.env.TRAVELOS_OPENAI_API_KEY;
    else process.env.TRAVELOS_OPENAI_API_KEY = previous;
    if (hostKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = hostKey;
  }
});

test('normal provider returns a safe 503 when the site key is missing', async () => {
  const previous = process.env.TRAVELOS_OPENAI_API_KEY;
  delete process.env.TRAVELOS_OPENAI_API_KEY;
  try {
    const result = await request(new OpenAIProvider());
    assert.equal(result.status, 503);
    assert.equal(result.body.error.code, 'AI_NOT_CONFIGURED');
    assert.equal('itinerary' in result.body, false);
  } finally {
    if (previous !== undefined) process.env.TRAVELOS_OPENAI_API_KEY = previous;
  }
});
