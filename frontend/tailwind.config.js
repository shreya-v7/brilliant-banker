/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pnc: {
          orange: '#E35205',
          'orange-dark': '#C44704',
          'orange-light': '#FF7A33',
          navy: '#002D5F',
          'navy-light': '#1B4F8A',
          blue: '#0065A4',
          'gray-50': '#F7F8FA',
          'gray-100': '#EEF0F3',
          'gray-200': '#D9DDE3',
          'gray-500': '#6B7280',
          'gray-700': '#374151',
          'gray-900': '#111827',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
