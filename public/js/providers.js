const GOOGLE_CLIENT_ID = '564678253197-oqo4omi2r8co0vlui5ev3tq7c9j8jm13.apps.googleusercontent.com';
// Add the Client ID from a Zoho client-based JavaScript application here.
const ZOHO_CLIENT_ID = 'REPLACE_WITH_ZOHO_CLIENT_ID';
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';

let gmailToken = sessionStorage.getItem('indomail_gmail_access_token') || '';
let gmailTokenClient;

const styles = `
.provider-test{margin-top:20px;padding:18px;border:1px solid #e2e6ef;border-radius:16px;background:#fbfcff;text-align:left}.provider-test h2{margin:0 0 6px;font-size:18px}.provider-test-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.provider-test button{border:1px solid #d5dbea;background:#fff;color:#182033;border-radius:10px;padding:10px 14px;font:inherit;cursor:pointer}.provider-test-status{min-height:20px;font-size:13px}.provider-test-status.error{color:#a54d4d}.provider-test-status.success{color:#3f7a52}.provider-results{display:grid;gap:8px;margin-top:10px}.provider-result{padding:10px 12px;border:1px solid #e5e8f0;border-radius:10px;background:#fff}.provider-result strong{display:block}.provider-result span{display:block;font-size:12px;color:#737b89;margin-top:3px}.provider-result p{margin:5px 0 0;font-size:12px;color:#5b6371}
`;

document.head.appendChild(Object.assign(document.createElement('style'), {textContent: styles}));

function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function setStatus(panel, message, error=false) {
  const node = panel.querySelector('.provider-test-status');
  node.textContent = message;
  node.className = `provider-test-status ${error ? 'error' : 'success'}`;
}

function header(headers=[], name='') {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

async function gmailRequest(url) {
  if (!gmailToken) throw new Error('Gmail is not connected.');
  const response = await fetch(url, {headers:{Authorization:`Bearer ${gmailToken}`}});
  if (!response.ok) throw new Error(`Gmail API ${response.status}: ${await response.text()}`);
  return response.json();
}

async function loadGmail(panel) {
  setStatus(panel, 'Reading Gmail inbox…');
  const list = await gmailRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=10');
  const messages = await Promise.all((list.messages || []).map(item => gmailRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)));
  panel.querySelector('.provider-results').innerHTML = messages.map(m => {
    const h = m.payload?.headers || [];
    return `<div class="provider-result"><strong>${escapeHtml(header(h,'Subject') || '(No subject)')}</strong><span>${escapeHtml(header(h,'From') || 'Unknown sender')}</span><p>${escapeHtml(header(h,'Date'))}</p></div>`;
  }).join('') || '<p>No inbox messages returned.</p>';
  setStatus(panel, `Gmail connected — ${messages.length} inbox message${messages.length === 1 ? '' : 's'} loaded.`);
}

function connectGmail(panel) {
  setStatus(panel, 'Opening Google permission for Gmail access…');
  const wait = () => {
    if (!window.google?.accounts?.oauth2) return setTimeout(wait, 100);
    gmailTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: async response => {
        if (!response?.access_token) return setStatus(panel, 'Google did not return a Gmail access token.', true);
        gmailToken = response.access_token;
        sessionStorage.setItem('indomail_gmail_access_token', gmailToken);
        try { await loadGmail(panel); }
        catch (error) { sessionStorage.removeItem('indomail_gmail_access_token'); gmailToken=''; setStatus(panel, error.message, true); }
      },
    });
    gmailTokenClient.requestAccessToken({prompt: gmailToken ? '' : 'consent'});
  };
  wait();
}

function connectZoho(panel) {
  if (ZOHO_CLIENT_ID.startsWith('REPLACE_')) {
    return setStatus(panel, 'Zoho needs its Client ID first. Create a Zoho client-based JavaScript app, then add its Client ID to providers.js.', true);
  }
  const redirectUri = `${location.origin}${location.pathname}`;
  const params = new URLSearchParams({
    response_type:'token',
    client_id:ZOHO_CLIENT_ID,
    scope:'ZohoMail.messages.READ,ZohoMail.accounts.READ',
    redirect_uri:redirectUri,
    access_type:'online',
    prompt:'consent',
  });
  location.assign(`${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params}`);
}

function parseZohoReturn(panel) {
  const params = new URLSearchParams(location.hash.replace(/^#/,''));
  const token = params.get('access_token');
  if (!token) return;
  sessionStorage.setItem('indomail_zoho_access_token', token);
  history.replaceState({}, document.title, `${location.pathname}${location.search}`);
  setStatus(panel, 'Zoho authorization succeeded. Mail API access can now be wired in the next step.');
}

function mountProviderPanel() {
  if (document.querySelector('#providerTest')) return document.querySelector('#providerTest');
  const login = document.querySelector('#loginView');
  const inbox = document.querySelector('#inboxView');
  if (!login || !inbox) return null;
  const panel = document.createElement('section');
  panel.id = 'providerTest';
  panel.className = 'provider-test hidden';
  panel.innerHTML = `<h2>Mailbox connection test</h2><p class="muted">Connect a provider separately from Google identity sign-in.</p><div class="provider-test-actions"><button type="button" data-provider-connect="gmail">Connect Gmail</button><button type="button" data-provider-connect="zoho">Connect Zoho Mail</button></div><p class="provider-test-status" role="status" aria-live="polite"></p><div class="provider-results"></div>`;
  inbox.querySelector('.mail-panel')?.prepend(panel);
  panel.querySelector('[data-provider-connect="gmail"]').addEventListener('click', () => connectGmail(panel));
  panel.querySelector('[data-provider-connect="zoho"]').addEventListener('click', () => connectZoho(panel));
  return panel;
}

const panel = mountProviderPanel();
window.addEventListener('indomail:logged-in', () => {
  panel?.classList.remove('hidden');
});
if (sessionStorage.getItem('indomail_google_id_token')) panel?.classList.remove('hidden');
if (sessionStorage.getItem('indomail_zoho_access_token')) panel?.classList.remove('hidden');

const loginZohoButton = document.querySelector('[data-provider="Zoho"]');
loginZohoButton?.addEventListener('click', () => {
  if (panel) connectZoho(panel);
});

if (panel) {
  const before = sessionStorage.getItem('indomail_zoho_access_token');
  parseZohoReturn(panel);
  if (!before && sessionStorage.getItem('indomail_zoho_access_token')) {
    document.querySelector('#loginView')?.classList.add('hidden');
    document.querySelector('#inboxView')?.classList.remove('hidden');
    panel.classList.remove('hidden');
  }
}
