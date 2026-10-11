import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(
    new URL('.', import.meta.url)
);

export default defineConfig({
    root: resolve(rootDir, 'src'),

    build: {
        outDir: resolve(rootDir, 'dist'),
        emptyOutDir: true,

        rollupOptions: {
            input: {
                main: resolve(rootDir, 'src/index.html'),
                search: resolve(rootDir, 'src/search/index.html'),
                genres: resolve(rootDir, 'src/genres/index.html'),
                details: resolve(rootDir, 'src/details/index.html'),
                favorites: resolve(rootDir, 'src/favorites/index.html'),
            },
        },
    },
});

