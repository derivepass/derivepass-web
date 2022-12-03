import { defineConfig } from 'vite';
import wasmPack from 'vite-plugin-wasm-pack';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), wasmPack(['./scrypt-crate'])],
})
