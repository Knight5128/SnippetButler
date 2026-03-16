import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)"
        },
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        surface: "var(--color-surface)"
      }
    }
  },
  plugins: []
};

export default config;

