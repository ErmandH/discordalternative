/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          primary: '#36393f',
          secondary: '#2f3136',
          tertiary: '#202225',
          accent: '#5865f2',
          textPrimary: '#dcddde',
          textSecondary: '#96989d',
          channelHover: '#3c3f45',
          channelActive: '#42464D',
          serverIcon: '#36393f',
          divider: '#2d2f32'
        }
      }
    },
  },
  plugins: [],
}

