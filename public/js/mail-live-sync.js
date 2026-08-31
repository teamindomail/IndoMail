/* IndoMail live mailbox sync — lightweight background polling without rebuilding the list. */
(() => {
  const list = document.querySelector('#mailList');
  const API_BASE_URL = 'https://indomail-production.up.railway.app';
  if (!list) return;
  const get = key => localStorage.getItem(key) || sessionStorage.getItem(key) || '';
  let timer = 0;
  let running = false;
  let lastIds = new Set();

  function zohoHeaders() {
    const token = get('indomail_zoho_access_token');
    if (!token) return null;
    return {
      Accept: 'application/json',
      Authorization: `Zoho-oauthtoken ${token}`,
      'X-Zoho-Api-Domain': get('indomail_zoho_api_domain') || 'https://mail.zoho.com'
    };
  }

  async function getLatestIds() {
    const headers = zohoHeaders();
    if (!headers) return null;
    const accountId = get('indomail_zoho_account_id');
    const folderId = get('indomail_selected_folder_id');
    if (!accountId || !folderId) return null;
    const url = `${API_BASE_URL}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/messages/view?folderId=${encodeURIComponent(folderId)}&limit=10&sortBy=date&sortorder=false&includeto=true`;
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json();
    return (payload?.data || []).map(m => String(m.messageId || m.id || '')).filter(Boolean);
  }

  async function poll() {
    if (running || document.hidden) return;
    running = true;
    try {
      const ids = await getLatestIds();
      if (!ids) return;
      const next = new Set(ids);
      const hasNew = lastIds.size > 0 && ids.some(id => !lastIds.has(id));
      lastIds = next;
      if (hasNew) window.dispatchEvent(new CustomEvent('indomail:new-mail-detected'));
    } catch (error) {
      console.debug('IndoMail live sync:', error);
    } finally {
      running = false;
    }
  }

  async function seed() {
    const ids = await getLatestIds();
    if (ids) lastIds = new Set(ids);
  }

  function schedule() {
    clearInterval(timer);
    timer = window.setInterval(poll, 15000);
  }

  window.addEventListener('indomail:logged-in', () => { seed(); schedule(); });
  window.addEventListener('indomail:folder-changed', () => seed());
  window.addEventListener('focus', () => seed());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) seed(); });
  window.addEventListener('beforeunload', () => clearInterval(timer));

  seed();
  schedule();
})();
