export const config = Object.freeze({
  name: 'Newleaf',
  organization: 'StepOneArt',
  brandMark: './assets/icons/newleaf-192.png',
  organizationLogo: './assets/images/steponeart-logo.webp',
  organizationArtwork: './assets/images/steponeart-artwork.webp',
  tagline: 'Just for today. Keep growing.',
  site: 'https://steponeart24.com/',
  deployment: 'https://app.steponeart24.com/',
  version: '1.5.0',
  themeColor: { light: '#f8f7ef', dark: '#151e19' },
});

export function shareURL(route) {
  const current = new URL('.', location.href);
  const isPreview = ['localhost', '127.0.0.1', '[::1]'].includes(current.hostname);
  const canonical = new URL(config.deployment);
  const base = !isPreview && current.origin === canonical.origin ? canonical : current;
  base.hash = route;
  return base.href;
}
