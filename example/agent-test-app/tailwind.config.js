// tailwind.config.js
/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./node_modules/agentic-chatbot-preview/dist/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      colors: {
        'whatsapp-chat-bg': '#e5ddd5',
        'whatsapp-sent-bg': '#dcf8c6',
        'whatsapp-header-bg': '#082f49',
        'whatsapp-container-bg': '#f0f2f5',
        'whatsapp-time': '#667781',
      },
      maxWidth: {
        '750px': '750px',
      },
      fontFamily: {
        sans: ['Rubik', 'PT Sans', 'system-ui', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
  ],
}
