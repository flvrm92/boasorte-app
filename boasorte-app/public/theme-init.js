// Applies the theme before first paint (spec 004, FR-402). Loaded synchronously from <head>; kept as a file
// (not inline) so the Content-Security-Policy can stay `script-src 'self'`. Mirrors ThemeService and THEME_STORAGE_KEY.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('boasorte-theme');
  } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
