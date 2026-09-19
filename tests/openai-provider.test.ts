import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import OpenAI from 'openai';
import { OpenAIProvider } from '../server/providers/openai-provider';
import { PlannerAgent } from '../server/agents/planner-agent';
import { AppError } from '../server/errors';
import { preferences, validItinerary } from './fixtures';

const previousKey = process.env.TRAVELOS_OPENAI_API_KEY;
before(() => { process.env.TRAVELOS_OPENAI_API_KEY = 'test-only-not-a-real-key'; });
after(() => {
  if (previousKey === undefined) delete process.env.TRAVELOS_OPENAI_API_KEY;
  else process.env.TRAVELOS_OPENAI_API_KEY = previousKey;
});

const responseBody = (content: unknown[], status = 'completed') => ({
  id: 'resp_test', object: 'response', status,
  output: [{ id: 'msg_test', type: 'message', role: 'assistant', status: 'completed', content }],
});
const outputText = (text: string) => [{ type: 'output_text', text, annotations: [] }];

test('real SDK adapter sends a strict schema and parses a structured response', async () => {
  let calls = 0;
  const transport: typeof fetch = async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.text.format.strict, true);
    assert.equal(body.text.format.name, 'travel_itinerary');
    assert.equal(body.store, false);
    assert.deepEqual(JSON.parse(body.input), preferences);
    return Response.json(responseBody(outputText(JSON.stringify(validItinerary()))));
  };
  const result = await new PlannerAgent(new OpenAIProvider(transport)).generateItinerary(preferences);
  assert.deepEqual(result, validItinerary());
  assert.equal(calls, 1);
});

for (const [name, content, status] of [
  ['malformed JSON', outputText('{broken'), 'completed'],
  ['invalid schema', outputText('{"days":[]}'), 'completed'],
  ['refusal', [{ type: 'refusal', refusal: 'Cannot comply.' }], 'completed'],
  ['incomplete output', outputText(JSON.stringify(validItinerary())), 'incomplete'],
] as const) {
  test(`SDK adapter safely rejects ${name}`, async () => {
    const transport: typeof fetch = async () => Response.json(responseBody([...content], status));
    await assert.rejects(new PlannerAgent(new OpenAIProvider(transport)).generateItinerary(preferences),
      (error: unknown) => error instanceof AppError && error.code === 'INVALID_AI_OUTPUT');
  });
}

test('provider HTTP failure is sanitized and not automatically retried', async () => {
  let calls = 0;
  const transport: typeof fetch = async () => {
    calls++;
    return Response.json({ error: { message: 'private-provider-detail', type: 'server_error' } }, { status: 500 });
  };
  await assert.rejects(new PlannerAgent(new OpenAIProvider(transport)).generateItinerary(preferences),
    (error: unknown) => error instanceof AppError && error.code === 'ITINERARY_GENERATION_FAILED' && !error.message.includes('private-provider-detail'));
  assert.equal(calls, 1);
});

test('SDK connection timeout becomes a retryable application error', async () => {
  const transport: typeof fetch = async () => { throw new OpenAI.APIConnectionTimeoutError(); };
  await assert.rejects(new PlannerAgent(new OpenAIProvider(transport)).generateItinerary(preferences),
    (error: unknown) => error instanceof AppError && error.code === 'PLANNER_TIMEOUT');
});
