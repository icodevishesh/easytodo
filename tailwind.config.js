/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#1c1c1c",
          panel: "#242424",
          soft: "#303030",
          line: "#424242",
          accent: "yellowgreen",
        },
      },
    },
  },
  plugins: [],
};
