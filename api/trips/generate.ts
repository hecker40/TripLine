import { createGenerationHandler } from '../../server/routes/generate';

// Vercel runs this on the server; the Vite bundle never imports it.
export default { fetch: createGenerationHandler() };
