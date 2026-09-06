import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#00201c",
        panel: "#0a2b26",
        line: "rgba(25,246,167,.10)",
        ink: "#f2fbf8",
        dim: "#89b3a9",
        mint: "#19f6a7",
        mint2: "#0ed88f",
        gold: "#ffd700",
        coral: "#ff5c6c",
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
