// Apply the last known theme before the first paint. IndexedDB takes precedence once opened.
try {
  const theme = localStorage.getItem('daymark.theme');
  if (['light', 'dark', 'system'].includes(theme)) document.documentElement.dataset.theme = theme;
} catch {
  // Browser storage can be blocked.
}
