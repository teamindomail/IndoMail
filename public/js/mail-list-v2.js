/* IndoMail Mail List V2 — authoritative renderer skin for dynamic Zoho messages. */
(() => {
  const list = document.querySelector('#mailList');
  if (!list) return;

  const style = document.createElement('style');
  style.id = 'indomail-mail-list-v2-style';
  style.textContent = `
    #mailList[data-ui-version="2"]{padding:10px 0 94px;}
    #mailList[data-ui-version="2"] .mail.mail-v2{
      position:relative!important;
      display:grid!important;
      grid-template-columns:40px minmax(0,1fr) 34px!important;
      gap:10px!important;
      align-items:start!important;
      margin:0 0 9px!important;
      padding:12px!important;
      min-height:76px!important;
      border-radius:16px!important;
      background:linear-gradient(145deg,rgba(9,18,33,.98),rgba(6,13,24,.98))!important;
      border:1px solid rgba(118,150,212,.20)!important;
      box-shadow:0 10px 28px rgba(0,0,0,.18)!important;
      color:#f4f7ff!important;
      overflow:hidden!important;
    }
    #mailList[data-ui-version="2"] .mail.mail-v2::before{content:"";position:absolute;inset:0 auto 0 0;width:2px;background:linear-gradient(180deg,#7653ff,#1bb7ff);opacity:.0;transition:opacity .16s}
    #mailList[data-ui-version="2"] .mail.mail-v2:hover,
    #mailList[data-ui-version="2"] .mail.mail-v2:focus-visible,
    #mailList[data-ui-version="2"] .mail.mail-v2.is-selected{border-color:rgba(118,83,255,.48)!important;background:linear-gradient(145deg,rgba(18,21,48,.99),rgba(8,18,33,.99))!important;outline:none}
    #mailList[data-ui-version="2"] .mail.mail-v2:hover::before,
    #mailList[data-ui-version="2"] .mail.mail-v2:focus-visible::before,
    #mailList[data-ui-version="2"] .mail.mail-v2.is-selected::before{opacity:1}
    #mailList[data-ui-version="2"] .mail.mail-v2.unread .sender{color:#fff!important;font-weight:900!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-avatar{width:40px!important;height:40px!important;border-radius:13px!important;display:grid!important;place-items:center!important;color:#fff!important;font-size:12px!important;font-weight:900!important;box-shadow:0 6px 18px rgba(34,105,220,.22)!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-main{min-width:0!important;width:100%!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-width:0!important}
    #mailList[data-ui-version="2"] .mail-v2 .sender{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#f0f5ff!important;font-size:12px!important;font-weight:800!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-time{white-space:nowrap!important;color:#7185a3!important;font-size:9px!important}
    #mailList[data-ui-version="2"] .mail-v2 .subject{margin-top:4px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#dce7f8!important;font-size:11.5px!important;font-weight:750!important;line-height:1.25!important}
    #mailList[data-ui-version="2"] .mail-v2 .preview{margin-top:4px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#7489a7!important;font-size:10px!important;line-height:1.3!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-actions{display:flex!important;align-items:flex-start!important;justify-content:center!important;gap:2px!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-actions .star{width:30px!important;height:30px!important;padding:0!important;border:0!important;background:transparent!important;color:#ffbd55!important;font-size:17px!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-actions .delete-btn{display:none!important}
    #mailList[data-ui-version="2"] .mail-v2 .mail-actions .star:focus-visible{outline:1px solid rgba(255,189,85,.5);outline-offset:2px;border-radius:8px}
    @media(max-width:900px){
      #mailList[data-ui-version="2"]{padding:8px 2px 94px!important}
      #mailList[data-ui-version="2"] .mail.mail-v2{grid-template-columns:38px minmax(0,1fr) 30px!important;gap:9px!important;padding:11px 10px!important;min-height:72px!important;border-radius:14px!important}
      #mailList[data-ui-version="2"] .mail-v2 .mail-avatar{width:38px!important;height:38px!important;border-radius:12px!important}
      #mailList[data-ui-version="2"] .mail-v2 .sender{font-size:11.5px!important}
      #mailList[data-ui-version="2"] .mail-v2 .subject{font-size:11px!important}
      #mailList[data-ui-version="2"] .mail-v2 .preview{font-size:9.5px!important}
    }
    @media(max-width:380px){
      #mailList[data-ui-version="2"] .mail.mail-v2{grid-template-columns:35px minmax(0,1fr) 28px!important;gap:8px!important;padding:10px 8px!important}
      #mailList[data-ui-version="2"] .mail-v2 .mail-avatar{width:35px!important;height:35px!important}
    }
  `;
  document.head.appendChild(style);
  list.dataset.uiVersion = '2';

  function normalize() {
    list.dataset.uiVersion = '2';
    list.querySelectorAll('.mail').forEach(row => {
      row.classList.add('mail-v2');
      row.removeAttribute('style');
      const avatar = row.querySelector('.mail-avatar');
      if (avatar) {
        const bg = avatar.style.background;
        if (bg && !avatar.dataset.v2Bg) avatar.dataset.v2Bg = bg;
        avatar.style.background = avatar.dataset.v2Bg || 'linear-gradient(145deg,#704bff,#1bb5ed)';
      }
      row.querySelectorAll('.delete-btn').forEach(btn => {
        if (btn.closest('.mail-actions')) btn.setAttribute('aria-hidden','true');
      });
    });
  }

  normalize();
  new MutationObserver(normalize).observe(list,{childList:true,subtree:true});
  window.addEventListener('indomail:refresh',normalize);
  window.addEventListener('indomail:logged-in',normalize);
})();
