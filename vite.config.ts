import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set this if deploying to GitHub Pages; safe to leave as-is on Vercel.
  base: process.env.GITHUB_PAGES ? '/histura-game/' : '/'
});
