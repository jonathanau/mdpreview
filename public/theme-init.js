// Runs synchronously before main JS to set theme and prevent flash of wrong colors.
(function() {
  var saved = localStorage.getItem('md-theme');
  var theme = 'solarized-light';
  if (saved === 'light') theme = 'folio';
  else if (saved === 'dark') theme = 'ember';
  else if (saved) theme = saved;
  document.documentElement.setAttribute('data-theme', theme);
})();
