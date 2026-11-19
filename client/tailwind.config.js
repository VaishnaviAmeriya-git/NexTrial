/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F3A5F',
          hover: '#16304F',
        },
        secondary: {
          DEFAULT: '#2F6DB5',
        },
        saffron: {
          DEFAULT: '#E8892B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          page: '#F5F7FA',
        },
        border: {
          DEFAULT: '#D0D7DE',
        },
        text: {
          main: '#1B1F23',
          muted: '#4A5560',
        },
        status: {
          success: '#1E7B45',
          warning: '#B26A00',
          danger: '#B3261E',
          info: '#2F6DB5',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '4px',
      },
    },
  },
  plugins: [],
}
