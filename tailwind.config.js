/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lab-black': '#050505',
        'lab-cyan': '#00ffff',
        'lab-red': '#ff003c',
      },
      fontFamily: {
        'arabic': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
