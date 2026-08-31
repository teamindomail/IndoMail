const googleHost = document.querySelector('[data-provider="Google"]');
const loginView = document.querySelector('#loginView');
const inboxView = document.querySelector('#inboxView');
const status = document.querySelector('#loginStatus');

const GOOGLE_CLIENT_ID = '564678253197-oqo4omi2r8co0vlui5ev3tq7c9j8jm13.apps.googleusercontent.com';

function setStatus(message, isError = true) {
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? '#ff8596' : '#6ef0bc';
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

function initGoogle() {
  if (!window.google?.accounts?.id || !googleHost) {
    window.setTimeout(initGoogle, 150);
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
  });

  // Keep the IndoMail custom dark button visible. Do not replace it with
  // Google's hosted iframe, which forces its own white/light presentation.
  googleHost.type = 'button';
  googleHost.classList.add('google-provider-button');
  googleHost.addEventListener('click', event => {
    event.preventDefault();
    window.google.accounts.id.prompt(notification => {
      if (notification?.isNotDisplayed?.()) {
        setStatus('Google sign-in is unavailable in this browser.');
      } else if (notification?.isSkippedMoment?.()) {
        setStatus('Google sign-in was cancelled.');
      }
    });
  });
}

initGoogle();
