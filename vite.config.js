// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Ensure index.html exists in build directory
const copyIndexHtml = () => ({
  name: 'copy-index-html',
  closeBundle: () => {
    const srcHtml = path.resolve(__dirname, 'public/index.html');
    const destHtml = path.resolve(__dirname, 'public/build/index.html');
    fs.copyFileSync(srcHtml, destHtml);
  }
});

export default defineConfig(({ mode }) => {
  // Load env file based on mode to get environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  const HOST = env.DEV_SERVER_HOST || '192.168.159.224';
  const VITE_PORT = parseInt(env.VITE_PORT || '5173');
  
  return {
    plugins: [
      laravel({
        input: ['resources/css/app.css', 'resources/js/app.jsx'],
        refresh: true,
        ssr: false,
      }),
      tailwindcss(),
      react(),
      copyIndexHtml()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'resources/js'),
      },
    },
    build: {
      outDir: 'public/build',
      emptyOutDir: true,
    },
    server: {
      host: HOST,
      port: VITE_PORT,
      strictPort: true,
      hmr: {
        host: HOST,
        port: VITE_PORT
      },
      cors: true,
      watch: {
        usePolling: true,
      }
    }
  };
});