import { defineConfig } from 'vite';

const base = process.env.VITE_BASE;
if (!base) {
  throw new Error(
    'VITE_BASE environment variable is required. Set it to the base path for your deployment.\n' +
    'Examples:\n' +
    '  VITE_BASE=/metabrowse/ npm run build              # public GitHub Pages\n' +
    '  VITE_BASE=/pages/user/metabrowse/ npm run build   # GHES Pages\n' +
    '  VITE_BASE=/ npm run dev                            # local development',
  );
}

export default defineConfig({
  base,
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  test: {
    environment: 'node',
  },
});
