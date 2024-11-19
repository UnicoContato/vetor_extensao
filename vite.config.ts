import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Aumenta o limite de aviso de tamanho do chunk
    chunkSizeWarningLimit: 1000,

    // Configuração de chunking manual
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa dependências de node_modules em chunks diferentes
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },

    // Habilita a compressão de código
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
