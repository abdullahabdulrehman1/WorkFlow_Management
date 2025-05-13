// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

// Ensure index.html exists in build directory
const copyIndexHtml = () => ({
  name: 'copy-index-html',
  closeBundle: () => {
    const srcHtml = path.resolve(__dirname, 'public/index.html');
    const destHtml = path.resolve(__dirname, 'public/build/index.html');
    fs.copyFileSync(srcHtml, destHtml);
  }
});

// Read icons from icons.json file
let iconsManifest = [];
try {
  const iconsJsonPath = path.resolve(__dirname, 'public/icons/icons.json');
  if (fs.existsSync(iconsJsonPath)) {
    const iconsJson = JSON.parse(fs.readFileSync(iconsJsonPath, 'utf8'));
    iconsManifest = iconsJson.icons.map(icon => ({
      src: `/icons/${icon.src}`,
      sizes: icon.sizes,
      type: 'image/png',
      purpose: 'any'
    }));
  }
} catch (error) {
  console.error('Error loading icons from icons.json:', error);
}

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
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Workflow Management',
          short_name: 'WorkflowApp',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0f172a',
          scope: '/',
          icons: iconsManifest.length > 0 ? iconsManifest : [
            {
              src: '/icons/android/android-launchericon-192-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/android/android-launchericon-512-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          // Updated screenshot sizes to match the exact required dimensions
          screenshots: [
            {
              src: "/screenshots/screen-mobile.png",
              sizes: "540x720",
              type: "image/png",
              form_factor: "narrow",
              label: "Workflow App Mobile View"
            },
            {
              src: "/screenshots/screen-desktop.png",
              sizes: "1200x800",
              type: "image/png",
              form_factor: "wide",
              label: "Workflow App Desktop View"
            }
          ]
        },
        includeAssets: [
          'favicon.ico', 
          'icons/android/**/*.png', 
          'icons/ios/**/*.png', 
          'icons/windows11/**/*.png', 
          'screenshots/*.png'
        ],
      }),
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
      https: true,
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