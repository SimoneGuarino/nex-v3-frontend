import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginSingleSpa from "vite-plugin-single-spa";

export default defineConfig({
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
    },
    preview: {
        host: "0.0.0.0",
        port: 3002,
        strictPort: true,
    },
});