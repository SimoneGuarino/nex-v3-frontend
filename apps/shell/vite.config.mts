import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginSingleSpa from "vite-plugin-single-spa";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss(), vitePluginSingleSpa({ type: "root", imo: "3.1.1" })], server: { host: "0.0.0.0", port: 3001, strictPort: true, origin: "http://localhost:3001" }, preview: { host: "0.0.0.0", port: 3001, strictPort: true } });
