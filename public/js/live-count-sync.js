/* Keep folder badge refreshes lightweight and never trigger recursive mailbox reloads. */
(() => {
  let timer = null;
  const queueCounts = (delay = 250) => {
    clearTimeout(timer);
    timer = setTimeout(() => window.dispatchEvent(new Event('indomail:folder-counts-refresh')), delay);
  };

  window.addEventListener('indomail:logged-in', () => queueCounts(100));
  window.addEventListener('indomail:folder-changed', () => queueCounts(100));
  window.addEventListener('indomail:delete-success', () => queueCounts(100));

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="star"], [data-action="delete"], #composeBtn, #composeForm button[type="submit"], [data-draft-edit]')) {
      queueCounts(600);
    }
  }, true);

  // Do not observe #mailList and emit refresh events: inbox.js already renders
  // the list, and doing so creates a render -> mutation -> refresh -> render loop.
})();
