import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { AppError } from './errors';

// A project-specific name prevents accidental use of the agent host's OpenAI key.
config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)), quiet: true });

export function getAIConfig() {
  const apiKey = process.env.TRAVELOS_OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey.includes('…') || apiKey.includes('...')) {
    throw new AppError('AI_NOT_CONFIGURED', 'Trip generation is not configured. Add the site API key on the server.', 503);
  }
  return { apiKey, model: process.env.TRAVELOS_OPENAI_MODEL?.trim() || 'gpt-4o-mini', timeout: 90_000 };
}

export function getServerConfig() {
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server PORT.');
  return { port, host: process.env.HOST || '127.0.0.1' };
}
