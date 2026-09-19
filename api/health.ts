export default {
  fetch() {
    return Response.json({ ok: true, service: 'travelos', runtime: 'vercel' }, {
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  },
};
