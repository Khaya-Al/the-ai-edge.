import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), "index.html"),
        app: resolve(process.cwd(), "app.html"),
        login: resolve(process.cwd(), "login.html"),
        workspace: resolve(process.cwd(), "workspace.html"),
        academy: resolve(process.cwd(), "academy.html"),
        about: resolve(process.cwd(), "about.html"),
        services: resolve(process.cwd(), "services.html"),
        contact: resolve(process.cwd(), "contact.html")
      }
    }
  }
});
