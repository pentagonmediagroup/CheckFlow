/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6B21A8',
          'purple-light': '#7C3AED',
          'purple-dark': '#4C1D95',
          gold: '#EAB308',
          'gold-light': '#FDE047',
          'gold-dark': '#A16207',
        },
        surface: {
          DEFAULT: '#0F0A1E',
          card: '#1A1030',
          border: '#2D1F4E',
          hover: '#241840',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6B21A8 0%, #4C1D95 100%)',
        'gold-gradient': 'linear-gradient(135deg, #EAB308 0%, #A16207 100%)',
        'card-gradient': 'linear-gradient(135deg, #1A1030 0%, #0F0A1E 100%)',
      },
      boxShadow: {
        'purple-glow': '0 0 20px rgba(107, 33, 168, 0.4)',
        'gold-glow': '0 0 20px rgba(234, 179, 8, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
