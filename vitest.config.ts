
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/hooks/salesforce/__tests__/setupTests.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mjs,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/hooks/salesforce/useBaseStats.ts',
        'src/hooks/salesforce/useFellowsStats.ts',
        'src/hooks/salesforce/useLeadsStats.ts',
        'src/hooks/salesforce/useOpportunitiesStats.ts',
        'src/hooks/salesforce/useStats.ts'
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
