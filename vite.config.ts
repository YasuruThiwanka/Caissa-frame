import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site base path
// https://yasuruthiwanka.github.io/Caissa-frame/
export default defineConfig({
  plugins: [react()],

  // This is the critical fix
  base: "/Caissa-frame/",

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});