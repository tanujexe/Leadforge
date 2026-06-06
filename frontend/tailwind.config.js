/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        "background-secondary": "#1F1F23",
        card: "#18181B",
        elevated: "#27272A",
        border: "#3F3F46",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        text: {
          DEFAULT: "#FAFAFA",
          secondary: "#A1A1AA",
          muted: "#71717A",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        brand: ["Outfit", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      }
    },
  },
  plugins: [],
}
