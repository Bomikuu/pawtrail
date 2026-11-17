import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const authoringAssets = fileURLToPath(new URL('./assets/', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Keep public runtime assets watched so newly exported images become available.
  // Exclude large binary authoring sources, but watch imported JSON catalogues.
  // Tailwind's independent class discovery is scoped separately in src/index.css.
  server: { port: 5173, strictPort: true, watch: { ignored: [(path:string) => path.startsWith(authoringAssets) && /\.(png|jpe?g|webp|gif|mp3|wav|ogg|mp4|blend|glb|gltf)$/i.test(path), '**/backend/**', '**/output/**', '**/.playwright-cli/**', '**/.pixelsbymiku/**', '**/.agents/**', '**/docs/**'] } },
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
})
