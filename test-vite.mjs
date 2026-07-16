import { createServer } from 'vite';
const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'spa'
});
console.log(vite.config.server.hmr);
process.exit(0);
