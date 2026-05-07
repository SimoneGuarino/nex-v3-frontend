import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginSingleSpa from "vite-plugin-single-spa";
import tsconfigPaths from "vite-tsconfig-paths";

function treatJsAsJsx() {
    return {
        name: "treat-js-files-as-jsx",
        enforce: "pre" as const,
        async transform(code: string, id: string) {
            if (!id.includes("/src/")) return null;
            if (!id.endsWith(".js")) return null;

            return transformWithEsbuild(code, id, {
                loader: "jsx",
                jsx: "automatic",
            });
        },
    };
}

export default defineConfig({
    // In dev, access-builder viene caricato dalla shell HTTPS tramite nginx.
    // Questo prefisso tecnico evita collisioni tra asset/HMR della shell e asset/HMR del MFE.
    base: "/__mfe_access_legacy__/",
    resolve: {
        dedupe: ["react", "react-dom"],
    },
    plugins: [
        tsconfigPaths(),
        treatJsAsJsx(),
        react(),
        tailwindcss(),
        vitePluginSingleSpa({
            type: "mife",
            serverPort: 3000,
            spaEntryPoints: "src/spa.tsx",
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
        origin: "https://localhost/__mfe_access_legacy__",
        hmr: {
            protocol: "wss",
            host: "localhost",
            clientPort: 443,
            path: "/__hmr_access_legacy__",
        },
        watch: {
            usePolling: true,
            interval: 250,
        },
    },
    preview: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
    },
});
