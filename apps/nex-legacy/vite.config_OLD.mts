import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import vitePluginSingleSpa from "vite-plugin-single-spa";

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
    plugins: [
        treatJsAsJsx(),
        react(),
        tailwindcss(),
        tsconfigPaths(),
        vitePluginSingleSpa({
            type: "mife",
            serverPort: 3000,
            spaEntryPoints: "src/spa.tsx",
        }),
    ],
    esbuild: {
        jsx: "automatic",
        include: /src\/.*\.[jt]sx?$/,
    },
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
    },
    preview: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
    },
});