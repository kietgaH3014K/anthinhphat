import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  envDir: "..", // dùng chung file .env ở thư mục gốc dự án
  server: { port: 5173 },
});
