import { defineConfig } from 'vite';
import wasmPack from 'vite-plugin-wasm-pack';
import { VitePWA } from 'vite-plugin-pwa';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    svelte(),
    wasmPack(['./scrypt-crate']),
    VitePWA(),
  ],
})
