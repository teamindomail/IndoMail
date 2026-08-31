/* Recover automatically when Zoho rejects an API request because the token is
   expired or was issued before the current permission set was granted. */
(() => {
  const originalFetch = window.fetch.bind(window);
  let redirecting = false;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const requestUrl = String(args[0]?.url || args[0] || '');

    if (!redirecting && response.status === 401 && requestUrl.includes('/api/zoho/')) {
      let body = '';
      try {
        body = await response.clone().text();
      } catch (_) {}

      if (/INVALID_OAUTHSCOPE|INVALID_OAUTH_SCOPE|invalid_oauth_scope|invalid_token|invalid_oauthtoken/i.test(body)) {
        redirecting = true;
        localStorage.removeItem('indomail_zoho_access_token');
        localStorage.removeItem('indomail_zoho_expires_at');
        sessionStorage.removeItem('indomail_zoho_access_token');

        const redirectUri = `${location.origin}${location.pathname}`;
        const params = new URLSearchParams({
          response_type: 'token',
          client_id: '1000.G7COWJ6TSJVGN7R9SA9Z3SSZAHSM1A',
          scope: 'ZohoMail.messages.READ,ZohoMail.messages.UPDATE,ZohoMail.messages.CREATE,ZohoMail.messages.DELETE,ZohoMail.accounts.READ,ZohoMail.folders.READ',
          redirect_uri: redirectUri,
          access_type: 'online',
          prompt: 'consent'
        });

        location.assign(`https://accounts.zoho.com/oauth/v2/auth?${params}`);
      }
    }

    return response;
  };
})();
