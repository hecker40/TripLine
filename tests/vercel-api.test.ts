import { test } from 'node:test';
import assert from 'node:assert/strict';
import health from '../api/health';
import deployedGeneration from '../api/trips/generate';
import { createGenerationHandler } from '../server/routes/generate';
import { AppError } from '../server/errors';
import { preferences, validItinerary } from './fixtures';

const request = (body: unknown = preferences) => new Request('https://travelos.example/api/trips/generate', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('Vercel health function is callable without binding a port', async () => {
  const response = health.fetch();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: 'travelos', runtime: 'vercel' });
});

test('Vercel generation entrypoint exposes the supported fetch handler', async () => {
  const response = await deployedGeneration.fetch(new Request('https://travelos.example/api/trips/generate'));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});

test('serverless route invokes the same Planner and validates output', async () => {
  let calls = 0;
  const handler = createGenerationHandler({ async generateStructuredOutput(input) {
    calls++;
    assert.deepEqual(JSON.parse(input.input), preferences);
    return validItinerary();
  } });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { itinerary: validItinerary() });
  assert.equal(calls, 1);
});

test('serverless input checks run before the provider', async () => {
  const handler = createGenerationHandler({ async generateStructuredOutput() { assert.fail('Provider must not run'); } });
  assert.equal((await handler(request({ ...preferences, travelers: 0 }))).status, 400);
  assert.equal((await handler(new Request('https://travelos.example/api/trips/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken',
  }))).status, 400);
  assert.equal((await handler(new Request('https://travelos.example/api/trips/generate', {
    method: 'POST', body: JSON.stringify(preferences),
  }))).status, 415);
});

test('serverless route enforces body limit with and without content-length', async () => {
  const handler = createGenerationHandler({ async generateStructuredOutput() { assert.fail('Provider must not run'); } });
  const withoutLength = request({ additionalPreferences: 'x'.repeat(20_000) });
  assert.equal((await handler(withoutLength)).status, 413);
  const withLength = request();
  withLength.headers.set('Content-Length', '20000');
  assert.equal((await handler(withLength)).status, 413);
});

test('invalid model output is rejected by the serverless route', async () => {
  const handler = createGenerationHandler({ async generateStructuredOutput() { return { days: [] }; } });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, 'INVALID_AI_OUTPUT');
});

test('serverless errors preserve safe status and hide unexpected details', async () => {
  const timeout = createGenerationHandler({ async generateStructuredOutput() { throw new AppError('PLANNER_TIMEOUT', 'Planning took too long.', 504); } });
  assert.equal((await timeout(request())).status, 504);
  const unexpected = createGenerationHandler({ async generateStructuredOutput() { throw new Error('private-provider-detail'); } });
  const response = await unexpected(request());
  assert.equal(response.status, 500);
  assert.equal((await response.text()).includes('private-provider-detail'), false);
});

test('deployed handler uses runtime server environment and reports missing key safely', async () => {
  const previous = process.env.TRAVELOS_OPENAI_API_KEY;
  process.env.TRAVELOS_OPENAI_API_KEY = '';
  try {
    const response = await deployedGeneration.fetch(request());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'AI_NOT_CONFIGURED');
  } finally {
    if (previous === undefined) delete process.env.TRAVELOS_OPENAI_API_KEY;
    else process.env.TRAVELOS_OPENAI_API_KEY = previous;
  }
});
