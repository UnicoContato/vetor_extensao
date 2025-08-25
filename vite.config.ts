import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Quando uma chamada para '/api-zetti' for feita...
      '/api-zetti': {
        // ...redirecione para este endereço
        target: 'https://integracao.zetti.dev',
        // Necessário para o servidor de destino aceitar a requisição
        changeOrigin: true,
        // Remove o '/api-zetti' antes de enviar a requisição final
        // (Ex: '/api-zetti/produtos' vira '/produtos')
        rewrite: (path) => path.replace(/^\/api-zetti/, ''),
      },
    },
  },
   resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});