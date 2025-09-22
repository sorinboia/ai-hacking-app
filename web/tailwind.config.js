/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0f172a',
          accent: '#38bdf8',
          warning: '#f97316',
        },
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2200px',
      },
    },
  },
  plugins: [],
};

