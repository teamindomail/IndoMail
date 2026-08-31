/* Keep all five folder badges in sync as soon as the mail UI changes. */
(() => {
  let timer = null;
  const queue = (delay = 250) => {
    clearTimeout(timer);
    timer = setTimeout(() => window.dispatchEvent(new Event('indomail:refresh')), delay);
  };

  window.addEventListener('indomail:logged-in', () => queue(50));
  window.addEventListener('indomail:refresh', () => queue(0));
  window.addEventListener('indomail:folder-changed', () => queue(50));
  window.addEventListener('indomail:delete-success', () => queue(50));
  window.addEventListener('indomail:folder-counts-refresh', () => queue(50));

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="star"], [data-action="delete"], #composeBtn, #composeForm button[type="submit"], [data-draft-edit]')) {
      queue(600);
    }
  }, true);

  const watch = () => {
    const list = document.querySelector('#mailList');
    if (!list || list.dataset.liveCountWatcher === '1') return;
    list.dataset.liveCountWatcher = '1';
    new MutationObserver(() => queue(250)).observe(list, {childList: true, subtree: true, characterData: true});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, {once: true});
  else watch();
  window.addEventListener('load', watch, {once: true});
})();
