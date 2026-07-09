/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F4F2ED',
        leaf: '#FDFCF9',
        ink: '#26291F',
        rule: '#D9D4C4',
        accent: {
          DEFAULT: '#8B5E3C',
          soft: '#EDE1D2',
        },
        good: '#3F6B4A',
        bad: '#A8442E',
      },
      fontFamily: {
        display: ['"Fraunces"', '"Space Grotesk"', 'serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '0.375rem',
      },
    },
  },
  plugins: [],
};
