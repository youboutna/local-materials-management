
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    chunkSizeWarningLimit: 1000,
    commonjsOptions: { transformMixedEsModules: true },
  }
}))
