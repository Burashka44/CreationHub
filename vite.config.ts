import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/v1/rest/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/rest\/v1/, ''),
        secure: false,
      },
      '/api': {
        target: 'http://localhost:9191',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api'),
        secure: false,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
