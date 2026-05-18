/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--app-bg)",
          panel: "var(--app-panel)",
          soft: "var(--app-soft)",
          line: "var(--app-line)",
          accent: "var(--app-accent)",
        },
      },
    },
  },
  plugins: [],
};
