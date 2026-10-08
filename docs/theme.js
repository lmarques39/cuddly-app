// Light/dark toggle for the site (#116). Loaded in <head> so a saved choice
// is applied before the first paint (no flash of the wrong theme). With no
// saved choice the site simply follows the system (see base.css).
(function () {
  var KEY = 'cuddly-theme';
  var root = document.documentElement;

  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch (e) {
    // Storage blocked (private mode etc.) — following the system still works.
  }

  function isDark() {
    if (root.dataset.theme) return root.dataset.theme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function label(button) {
    var pt = root.lang !== 'en';
    button.textContent = isDark() ? '☀' : '☾';
    button.setAttribute(
      'aria-label',
      isDark() ? (pt ? 'Mudar para modo claro' : 'Switch to light mode') : pt ? 'Mudar para modo escuro' : 'Switch to dark mode'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    label(button);
    button.addEventListener('click', function () {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, root.dataset.theme);
      } catch (e) {}
      label(button);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      label(button);
    });
  });
})();
