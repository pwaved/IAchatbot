// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", //  main HTML file
    "./src/**/*.{js,ts,jsx,tsx,html}", // todas JS, TS, JSX, TSX, HTML files in src/
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00A859',
          darkgreen: '#007A41',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293D',
          900: '#0F172A',
        }
      },
    }
  },
  plugins: [],
}
