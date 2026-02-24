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
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1929',
        },
        accent: {
          50:  '#e6f6ff',
          100: '#bae3ff',
          200: '#7cc4fa',
          300: '#47a3f3',
          400: '#2186eb',
          500: '#0967d2',
          600: '#0552b5',
          700: '#03449e',
          800: '#01337d',
          900: '#002159',
        },
        success: {
          50:  '#e3f9e5',
          100: '#c1eac5',
          400: '#57ae5b',
          500: '#3f9142',
          600: '#2f8132',
          700: '#207227',
        },
        warning: {
          50:  '#fffbea',
          100: '#fff3c4',
          400: '#f7c948',
          500: '#de911d',
          600: '#cb6e17',
        },
        danger: {
          50:  '#ffe3e3',
          100: '#ffbdbd',
          400: '#ef4e4e',
          500: '#d64545',
          600: '#ba2525',
        },
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          600: '#4f46e5',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
