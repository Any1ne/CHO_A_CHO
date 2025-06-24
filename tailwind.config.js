/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx,mdx}", // змінюй шлях, якщо в тебе інша структура
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: "var(--font-geist-sans)",
          mono: "var(--font-geist-mono)",
          oswald: "var(--font-oswald)",
          playpen: "var(--font-playpen-sans)",
          zain: "var(--font-zain)"
        },
        colors: {
          background: "var(--color-background)",
          foreground: "var(--color-foreground)",
          primary: "var(--color-primary)",
          "primary-foreground": "var(--color-primary-foreground)",
        },
      },
    },
    plugins: [],
  };
  