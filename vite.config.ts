import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, PluginOption } from 'vite';

import sparkPlugin from '@github/spark/spark-vite-plugin';
import createIconImportProxy from '@github/spark/vitePhosphorIconProxyPlugin';
import { resolve } from 'path';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
  build: {
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
    cssTarget: ['chrome90', 'firefox88', 'safari14', 'edge90'],
    minify: 'terser',
    reportCompressedSize: true,
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('@phosphor-icons') || id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('recharts') || id.includes('d3') || id.includes('three')) return 'vendor-charts';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html-to-image')) return 'vendor-export';
          if (id.includes('framer-motion')) return 'vendor-motion';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
});
