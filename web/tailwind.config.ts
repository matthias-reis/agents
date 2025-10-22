import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        urbanist: ["'Urbanist'", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 45px -15px rgba(56, 189, 248, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
