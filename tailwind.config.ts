import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#136dec",
        "background-light": "#f6f7f8",
        "background-dark": "#101822",
        "bg-deep": "#0a0c10",
        "bg-surface": "#161b22",
        "bg-card": "#1c2128",
        "border-subtle": "#30363d",
        "text-main": "#f0f6fc",
        "text-muted": "#8b949e",
        "green-glow": "#238636",
        "red-glow": "#da3633",
        bullish: "#10b981",
        bearish: "#ef4444",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
