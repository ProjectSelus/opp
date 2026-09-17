/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        opp: {
          blue: {
            deep: '#0F2942',
            primary: '#1A365D',
            light: '#2563EB',
            surface: '#EFF6FF',
          },
          green: {
            action: '#059669',
            light: '#10B981',
            surface: '#ECFDF5',
          },
          amber: {
            alert: '#D97706',
            surface: '#FFFBEB',
          },
          civic: {
            dark: '#1E293B',
            muted: '#64748B',
            border: '#E2E8F0',
            bg: '#F8FAFC'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
