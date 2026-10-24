import path from 'path';
import { defineConfig } from 'vitest/config';

// Los tests corren con el mismo alias «@» que Vite y sin DOM: lo que se prueba es lógica pura.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { include: ['src/**/*.test.ts'] },
});
