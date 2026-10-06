import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: resolve(rootDir, 'src'),
    build: {
        outDir: resolve(rootDir, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(rootDir, 'src/index.html'),
                search: resolve(rootDir, 'src/search/index.html'),
                details: resolve(rootDir, 'src/details/index.html'),
                favorites: resolve(rootDir, 'src/favorites/index.html'),
            },
        },
    },
});

