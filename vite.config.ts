import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace or merge with your existing Vite config
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Exclude the problematic file from build import analysis
      external: ['src/components/auth/ProtectedRoute'],
    },
  },
});