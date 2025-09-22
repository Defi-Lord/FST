/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--tg-theme-bg-color, #0b0b0c)',
        text: 'var(--tg-theme-text-color, #fff)',
        secondary: 'var(--tg-theme-secondary-bg-color, #151516)',
        hint: 'var(--tg-theme-hint-color, #9aa0a6)',
        link: 'var(--tg-theme-link-color, #6ea8fe)',
        button: 'var(--tg-theme-button-color, #2ea6ff)',
        buttonText: 'var(--tg-theme-button-text-color, #fff)'
      },
      borderRadius: { figma: 'var(--radius, 12px)' },
      boxShadow: { figma: 'var(--shadow, 0 8px 24px rgba(0,0,0,.2))' },
      spacing: { safe: 'env(safe-area-inset-bottom)' }
    }
  },
  plugins: []
};
