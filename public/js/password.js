const passwordInput = document.querySelector('#password');
const toggle = document.querySelector('#showPassword');

if (passwordInput && toggle) {
  toggle.addEventListener('change', () => {
    passwordInput.type = toggle.checked ? 'text' : 'password';
  });
}