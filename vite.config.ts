import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/word/" : "/",
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3333,
  },
  preview: {
    host: "0.0.0.0",
  },
});
