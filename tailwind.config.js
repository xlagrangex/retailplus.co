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
          50:  '#f0f5f4',
          100: '#dfe9e7',
          200: '#c2d8d4',
          300: '#a0bfb9',
          400: '#7da39c',
          500: '#5d8a82',
          600: '#4a7069',
          700: '#3a5c56',
          800: '#2f4a45',
          900: '#273E3A',
          950: '#1a2b28',
        },
        accent: {
          50:  '#edf9f7',
          100: '#d4f2ee',
          200: '#afe5de',
          300: '#84d4c9',
          400: '#5bbfb1',
          500: '#3da797',
          600: '#329083',
          700: '#2b7268',
          800: '#235f55',
          900: '#1a4d44',
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
        heading: ['Poppins', 'Inter', '-apple-system', 'sans-serif'],
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
