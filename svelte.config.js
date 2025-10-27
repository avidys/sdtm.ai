import adapterAuto from '@sveltejs/adapter-auto';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';

const adapters = {
  auto: adapterAuto(),
  vercel: adapterVercel(),
  cloudflare: adapterCloudflare()
};

const adapterChoice = process.env.SDTM_AI_ADAPTER ?? 'auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapters[adapterChoice] ?? adapters.auto,
    alias: {
      $lib: 'src/lib',
      $components: 'src/lib/components'
    }
  }
};

export default config;
