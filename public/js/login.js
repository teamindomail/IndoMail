const loginView = document.querySelector('#loginView');
const inboxView = document.querySelector('#inboxView');
const form = document.querySelector('#loginForm');
const status = document.querySelector('#loginStatus');

form?.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  status.textContent = '';
  loginView?.classList.add('hidden');
  inboxView?.classList.remove('hidden');
  window.dispatchEvent(new CustomEvent('indomail:logged-in'));
});
