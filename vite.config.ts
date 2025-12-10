import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    exclude: ['@supabase/ssr']
  },
  ssr: {
    noExternal: ['@supabase/ssr', 'parquetjs-lite', 'sas7bdat', 'duckdb']
  }
});

// server: {
//   proxy: process.env.VITE_DEV_PROXY ? JSON.parse(process.env.VITE_DEV_PROXY) : undefined
// }