const loginView = document.querySelector('#loginView');
const inboxView = document.querySelector('#inboxView');
const status = document.querySelector('#loginStatus');
const googleHost = document.querySelector('[data-provider="Google"]');

const GOOGLE_CLIENT_ID = '564678253197-oqo4omi2r8co0vlui5ev3tq7c9j8jm13.apps.googleusercontent.com';

function setStatus(message, isError = true) {
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#a54d4d' : '#3f7a52';
}

function handleCredentialResponse(response) {
  if (!response?.credential) {
    setStatus('Google sign-in did not return a credential.');
    return;
  }

  sessionStorage.setItem('indomail_google_id_token', response.credential);
  setStatus('Google sign-in successful.', false);
  loginView?.classList.add('hidden');
  inboxView?.classList.remove('hidden');
  window.dispatchEvent(new CustomEvent('indomail:logged-in'));
}

function renderGoogleButton() {
  if (!window.google?.accounts?.id || !googleHost) {
    window.setTimeout(renderGoogleButton, 100);
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });

  const holder = document.createElement('div');
  holder.className = 'google-signin-holder';
  holder.setAttribute('aria-label', 'Login with Google');
  googleHost.replaceWith(holder);

  const width = Math.min(400, Math.max(240, Math.floor(holder.parentElement?.clientWidth || 320)));
  window.google.accounts.id.renderButton(holder, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width,
    logo_alignment: 'left',
  });
}

renderGoogleButton();