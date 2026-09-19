import { createApp } from './app';
import { getServerConfig } from './config';

const { port, host } = getServerConfig();
const server = createApp();
server.listen(port, host, () => console.log(`TravelOS listening on http://${host}:${port}`));
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error('Server could not start.', { code: error.code });
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
