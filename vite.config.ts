import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/BigData_CBT/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor", test: /node_modules/ },
            { name: "lesson-content", test: /src[\\/]content[\\/]lessons\.json$/ },
            { name: "case-content", test: /src[\\/]content[\\/]cases\.json$/ },
            { name: "question-content", test: /src[\\/]content[\\/]questions\.json$/ },
            { name: "course-question-content", test: /src[\\/]content[\\/]course[\\/]questions\.json$/ },
            { name: "course-study-content", test: /src[\\/]content[\\/]course[\\/](?:sources|topics|lessons|cases|blueprints|meta)\.json$/ },
            { name: "source-figure-content", test: /src[\\/]content[\\/]source-figures\.json$/ },
          ],
        },
      },
    },
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
