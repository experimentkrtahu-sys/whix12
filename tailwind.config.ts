import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#080b12',
        surface: '#0f1724',
        brand: '#7c3aed'
      }
    }
  },
  plugins: []
};

export default config;
