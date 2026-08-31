const passwordInput = document.querySelector('#password');
const toggle = document.querySelector('#showPassword');

if (passwordInput && toggle) {
  toggle.addEventListener('change', () => {
    passwordInput.type = toggle.checked ? 'text' : 'password';
  });
}

// Mobile UI hard cleanup: the legacy floating Compose/Mail-Up control is not part
// of the mobile navigation. Only the bottom navigation Compose action is allowed.
function enforceMobileComposeCleanup() {
  if (!window.matchMedia('(max-width: 900px)').matches) return;
  document.querySelectorAll('.floating-compose').forEach((el) => {
    if (!el.closest('.mobile-nav')) {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('tabindex', '-1');
    }
  });
}

enforceMobileComposeCleanup();
window.addEventListener('resize', enforceMobileComposeCleanup);
new MutationObserver(enforceMobileComposeCleanup).observe(document.body, {
  childList: true,
  subtree: true
});
