import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#dfe9ff",
          200: "#b8cdff",
          300: "#8fadff",
          400: "#5f87ff",
          500: "#3a63f2", // primary
          600: "#2c4bd6",
          700: "#2239aa",
          800: "#1c2f85",
          900: "#182968",
        },
        ink: {
          950: "#0b0e14",
          900: "#11151d",
          800: "#181e29",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
