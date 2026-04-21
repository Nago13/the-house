import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        house: {
          bg:      "#0a0a0a",
          surface: "#141414",
          border:  "#262626",
          text:    "#f0ebe0",
          muted:   "#6b6560",
          amber:   "#e8a030",
          live:    "#ff3333",
          chain:   "#00d084",
          mom:     "#c8894a",
          dad:     "#2dd4bf",
          child:   "#a78bfa",
        },
        obsidian:  "#07060A",
        surface:   "#0E0C14",
        text: {
          primary:   "#F5F5F7",
          secondary: "#A1A1AA",
        },
      },
      fontFamily: {
        sans:    ["var(--font-geist-sans)", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-in-out",
        "pulse-live": "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
