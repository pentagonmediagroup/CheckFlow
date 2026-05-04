import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { surface: '#080B14', card: '#111525', panel: '#0C0F1E', border: '#1A1F38' } } },
  plugins: [],
}
export default config
