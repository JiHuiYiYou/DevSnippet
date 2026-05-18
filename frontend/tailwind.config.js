/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1e1e2e',
        },
        panel: {
          DEFAULT: '#f8fafc',
          dark: '#181825',
        },
        border: {
          DEFAULT: '#e2e8f0',
          dark: '#313244',
        },
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      spacing: {
        'sidebar': '16rem',
      },
    },
  },
  plugins: [],
}
