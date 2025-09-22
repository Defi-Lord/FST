export const theme = {
  fonts: {
    base: '"Your Figma Font", system-ui, -apple-system, Segoe UI, Roboto',
  },
  sizes: {
    h1: { size: 24, line: 28, weight: 600 },
    body: { size: 14, line: 20, weight: 400 }
  },
  radii: { sm: 8, md: 12, lg: 16 },
  shadow: '0 8px 24px rgba(0,0,0,.2)'
};

export function applyTheme() {
  document.documentElement.style.setProperty('--radius', theme.radii.md + 'px');
  document.documentElement.style.setProperty('--shadow', theme.shadow);
  document.documentElement.style.setProperty('--font-base', theme.fonts.base);
}
