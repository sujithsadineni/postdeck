import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/postdeck/",
  plugins: [react()],
  server: { port: 5182, strictPort: true },
});
