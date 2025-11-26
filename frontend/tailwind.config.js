/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'maryland-red': '#e21833',
        'maryland-gold': '#ffd200',
      },
    },
  },
  plugins: [],
}

