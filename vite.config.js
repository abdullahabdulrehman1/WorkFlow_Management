// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

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

// Restore helper: copy public/index.html to public/build/index.html after build
const copyIndexHtml = () => ({
  name: 'copy-index-html',
  closeBundle() {
    const manifestPath = path.resolve(__dirname, 'public/build/manifest.json');
    const srcHtmlPath = path.resolve(__dirname, 'public/index.html');
    const destDir = path.resolve(__dirname, 'public/build');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(srcHtmlPath)) return;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Find entry for main React app (resources/js/app.jsx or .js)
    const entryKey = Object.keys(manifest).find(k => k.endsWith('resources/js/app.jsx') || k.endsWith('resources/js/app.js'));
    if (!entryKey) {
      console.warn('⚠️ Unable to find app entry in manifest, index.html not updated');
      return;
    }
    const hashedFile = manifest[entryKey].file; // e.g. assets/app-XYZ.js

    let html = fs.readFileSync(srcHtmlPath, 'utf8');
    // Replace any existing script src pointing to assets/app-*.js
    html = html.replace(/<script type="module" src="[^"]+app-[^"]+\.js"><\/script>/, `<script type="module" src="/${hashedFile}"></script>`);

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, 'index.html'), html);
    console.log(`🗂️  index.html written with ${hashedFile}`);
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
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false
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
      https: false,
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