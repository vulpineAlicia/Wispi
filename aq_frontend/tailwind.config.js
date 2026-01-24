/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EEF6FC",
          100: "#CBE5F6",
          200: "#97CAED",
          300: "#63B0E3",
          400: "#3498DB",
          500: "#2280BF",
          700: "#185D8B",
          900: "#0F3A57",
        },
      },
    },
  },
  plugins: [],
};