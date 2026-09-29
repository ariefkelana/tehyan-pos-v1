/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wall: { DEFAULT: '#f5f2eb', dark: '#e6dfd1' },
        mural: { red: '#8b2727', blue: '#1a3687' }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        cursive: ['Dancing Script', 'cursive'],
      },
    },
  },
  plugins: [],
};