/* Desktop reading pane companion for the premium demo layout. */
(() => {
  const list = document.querySelector('#mailList');
  const pane = document.querySelector('#readingPane');
  if (!list || !pane) return;

  const title = pane.querySelector('[data-read-title]');
  const meta = pane.querySelector('[data-read-meta]');
  const body = pane.querySelector('[data-read-body]');
  const star = pane.querySelector('[data-read-star]');
  const reply = pane.querySelector('[data-read-reply]');
  let active = null;

  const esc = (v='') => String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const text = el => el?.textContent?.trim() || '';

  function paint(row) {
    if (!row) return;
    list.querySelectorAll('.mail.is-selected').forEach(x => x.classList.remove('is-selected'));
    row.classList.add('is-selected');
    active = row;
    const sender = text(row.querySelector('.sender')) || 'Unknown sender';
    const subject = text(row.querySelector('.subject')) || '(No subject)';
    const preview = text(row.querySelector('.preview'));
    const time = text(row.querySelector('.mail-time'));
    const avatar = text(row.querySelector('.mail-avatar')) || sender.slice(0,1);
    title.textContent = subject;
    meta.textContent = `From ${sender} • ${time || 'Today'}`;
    body.innerHTML = `<div class="inline-avatar">${esc(avatar.slice(0,2))}</div><h3>${esc(subject)}</h3><p>${esc(preview || 'Your message preview will appear here. Select another message from the inbox to read it in this premium three-column view.')}</p><p>IndoMail is designed around a secure, focused mail workflow with fast navigation, rich message previews and a modern workspace.</p>`;
    star.textContent = row.querySelector('.star')?.textContent?.trim() === '★' ? '★ Star' : '☆ Star';
  }

  // Capture before inbox.js bubble listeners so desktop clicks stay in the reading pane.
  list.addEventListener('click', (event) => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (event.target.closest('[data-action]')) return;
    const row = event.target.closest('.mail');
    if (!row) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    paint(row);
  }, true);

  list.addEventListener('keydown', (event) => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.closest('[data-action]')) return;
    const row = event.target.closest('.mail');
    if (!row) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    paint(row);
  }, true);

  star.addEventListener('click', () => {
    if (!active) return;
    active.querySelector('.star')?.click();
    setTimeout(() => paint(active), 0);
  });

  reply.addEventListener('click', () => {
    if (!active) return;
    document.querySelector('#composeBtn')?.click();
    setTimeout(() => {
      const to = document.querySelector('#composeTo');
      const sender = text(active.querySelector('.sender'));
      if (to && sender.includes('@')) to.value = sender;
    }, 50);
  });

  const observer = new MutationObserver(() => {
    if (!active || !document.body.contains(active)) {
      active = null;
      if (title) title.textContent = 'Welcome to IndoMail!';
      if (meta) meta.textContent = 'Select an email from your inbox';
    }
    if (!active) {
      const first = list.querySelector('.mail');
      if (first) paint(first);
    }
  });
  observer.observe(list, {childList:true, subtree:true});

  setTimeout(() => {
    const first = list.querySelector('.mail');
    if (first) paint(first);
  }, 500);
})();
