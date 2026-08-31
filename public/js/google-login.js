const loginView = document.querySelector('#loginView');
const inboxView = document.querySelector('#inboxView');
const status = document.querySelector('#loginStatus');
const googleHost = document.querySelector('[data-provider="Google"]');

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

  // Keep Google's official button hidden only as the authentication trigger.
  // The visible control is a native IndoMail button so it matches the Zoho button exactly.
  const wrapper = document.createElement('div');
  wrapper.className = 'google-auth-wrapper';
  wrapper.style.cssText = 'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
  const holder = document.createElement('div');
  holder.className = 'google-signin-holder';
  wrapper.appendChild(holder);
  document.body.appendChild(wrapper);

  window.google.accounts.id.renderButton(holder, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width: 320,
    logo_alignment: 'left',
  });

  const googleButton = holder.querySelector('div[role="button"]') || holder.querySelector('button');
  const visibleButton = document.createElement('button');
  visibleButton.type = 'button';
  visibleButton.className = `${googleHost.className || 'provider'} google`;
  visibleButton.setAttribute('aria-label', 'Continue with Google');
  visibleButton.innerHTML = '<span class="google-mark" aria-hidden="true">G</span>Continue with Google';

  visibleButton.addEventListener('click', () => {
    if (googleButton) {
      googleButton.click();
      return;
    }
    setStatus('Google sign-in is loading. Please try again.');
  });

  googleHost.replaceWith(visibleButton);
}

renderGoogleButton();
