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
        'status-done': {
          50:  '#edf9f7',
          100: '#d4f2ee',
          500: '#2b7268',
          600: '#2b7268',
          700: '#235f55',
        },
        'status-progress': {
          50:  '#f0f5f4',
          100: '#dfe9e7',
          500: '#5d8a82',
          600: '#5d8a82',
          700: '#4a7069',
        },
        'status-todo': {
          50:  '#f5f7fa',
          100: '#e2e8f0',
          500: '#8da4b8',
          600: '#627d98',
          700: '#4a6074',
        },
        'status-waiting': {
          50:  '#f0f4fa',
          100: '#dce4f0',
          500: '#4a6fa5',
          600: '#4a6fa5',
          700: '#3b5b8a',
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
