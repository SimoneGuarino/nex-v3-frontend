import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginSingleSpa from "vite-plugin-single-spa";

export default defineConfig({
    // In dev, access-builder viene caricato dalla shell HTTPS tramite nginx.
    // Questo prefisso tecnico evita collisioni tra asset/HMR della shell e asset/HMR del MFE.
    base: "/__mfe_access__/",
    plugins: [
        react(),
        tailwindcss(),
        vitePluginSingleSpa({
            type: "mife",
            serverPort: 3002,
            spaEntryPoints: "src/spa.tsx",
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 3002,
        strictPort: true,
        origin: "https://localhost/__mfe_access__",
        hmr: {
            protocol: "wss",
            host: "localhost",
            clientPort: 443,
            path: "/__hmr_access__",
        },
        watch: {
            usePolling: true,
            interval: 250,
        },
    },
    preview: {
        host: "0.0.0.0",
        port: 3002,
        strictPort: true,
    },
});
