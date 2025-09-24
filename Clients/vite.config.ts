import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "@svgr/rollup";
import { version } from "./package.json"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
  server: {
    host: "0.0.0.0",
    port: process.env.VITE_APP_PORT
      ? parseInt(process.env.VITE_APP_PORT)
      : 5173,
  },
  build: {
    // Generate manifest for cache busting
    manifest: true,
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  define: { global: "globalThis", __APP_VERSION__: JSON.stringify(version) },
});
