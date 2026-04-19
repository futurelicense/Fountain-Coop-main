
/** @type {import('tailwindcss').Config} */
export default {
   content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        fountain: {
          dark: '#1e3a5f',
          blue: '#2563eb',
          teal: '#0d9488',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            400: '#94a3b8',
            600: '#475569',
            900: '#0f172a',
          }
        }
      }
    },
  },
  plugins: [],
}
