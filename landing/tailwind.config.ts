import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
        muted: "var(--muted)",
        line: "var(--line)",
        lineStrong: "var(--line-strong)",
        panel: "var(--panel)",
        panelStrong: "var(--panel-strong)",
        panelSoft: "var(--panel-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
      boxShadow: {
        panel: "var(--shadow)",
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Segoe UI"', "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
