/* IndoMail Mail List V2 — stable renderer skin for dynamic Zoho messages. */
(() => {
  const list = document.querySelector('#mailList');
  if (!list) return;

  const style = document.createElement('style');
  style.id = 'indomail-mail-list-v2-style';
  style.textContent = `
    #mailList{padding:10px 0 94px!important}
    #mailList .mail{
      position:relative!important;display:grid!important;grid-template-columns:40px minmax(0,1fr) 34px!important;gap:10px!important;
      align-items:start!important;margin:0 0 9px!important;padding:12px!important;min-height:76px!important;border-radius:16px!important;
      background:linear-gradient(145deg,rgba(9,18,33,.98),rgba(6,13,24,.98))!important;
      border:1px solid rgba(118,150,212,.20)!important;box-shadow:0 10px 28px rgba(0,0,0,.18)!important;
      color:#f4f7ff!important;overflow:hidden!important
    }
    #mailList .mail::before{content:"";position:absolute;inset:0 auto 0 0;width:2px;background:linear-gradient(180deg,#7653ff,#1bb7ff);opacity:0;pointer-events:none}
    #mailList .mail:hover,#mailList .mail:focus-visible,#mailList .mail.is-selected{border-color:rgba(118,83,255,.48)!important;background:linear-gradient(145deg,rgba(18,21,48,.99),rgba(8,18,33,.99))!important;outline:none}
    #mailList .mail:hover::before,#mailList .mail:focus-visible::before,#mailList .mail.is-selected::before{opacity:1}
    #mailList .mail.unread .sender{color:#fff!important;font-weight:900!important}
    #mailList .mail .mail-avatar{width:40px!important;height:40px!important;border-radius:13px!important;display:grid!important;place-items:center!important;color:#fff!important;font-size:12px!important;font-weight:900!important;box-shadow:0 6px 18px rgba(34,105,220,.22)!important}
    #mailList .mail .mail-main{min-width:0!important;width:100%!important}
    #mailList .mail .mail-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-width:0!important}
    #mailList .mail .sender{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#f0f5ff!important;font-size:12px!important;font-weight:800!important}
    #mailList .mail .mail-time{white-space:nowrap!important;color:#7185a3!important;font-size:9px!important}
    #mailList .mail .subject{margin-top:4px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#dce7f8!important;font-size:11.5px!important;font-weight:750!important;line-height:1.25!important}
    #mailList .mail .preview{margin-top:4px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#7489a7!important;font-size:10px!important;line-height:1.3!important}
    #mailList .mail .mail-actions{display:flex!important;align-items:flex-start!important;justify-content:center!important;gap:2px!important}
    #mailList .mail .mail-actions .star{width:30px!important;height:30px!important;padding:0!important;border:0!important;background:transparent!important;color:#ffbd55!important;font-size:17px!important}
    #mailList .mail .mail-actions .delete-btn{display:none!important}
    @media(max-width:900px){
      #mailList{padding:8px 2px 94px!important}
      #mailList .mail{grid-template-columns:38px minmax(0,1fr) 30px!important;gap:9px!important;padding:11px 10px!important;min-height:72px!important;border-radius:14px!important}
      #mailList .mail .mail-avatar{width:38px!important;height:38px!important;border-radius:12px!important}
      #mailList .mail .sender{font-size:11.5px!important}
      #mailList .mail .subject{font-size:11px!important}
      #mailList .mail .preview{font-size:9.5px!important}
    }
    @media(max-width:380px){
      #mailList .mail{grid-template-columns:35px minmax(0,1fr) 28px!important;gap:8px!important;padding:10px 8px!important}
      #mailList .mail .mail-avatar{width:35px!important;height:35px!important}
    }
  `;
  document.head.appendChild(style);

  // Prevent repeated identical mailbox renders from replacing the visible DOM.
  // This stops the old/new mail list from flashing when multiple connection events fire.
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (descriptor?.set && !list.dataset.innerHtmlStableGuard) {
    const nativeSet = descriptor.set;
    const nativeGet = descriptor.get;
    Object.defineProperty(list, 'innerHTML', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() { return nativeGet.call(list); },
      set(value) {
        const next = String(value ?? '');
        if (list.dataset.renderSignature === next) return;
        list.dataset.renderSignature = next;
        nativeSet.call(list, next);
      }
    });
    list.dataset.innerHtmlStableGuard = '1';
  }

  function normalize() {
    list.dataset.uiVersion = '2';
    list.querySelectorAll('.mail').forEach(row => {
      row.classList.add('mail-v2');
      const avatar = row.querySelector('.mail-avatar');
      if (avatar && !avatar.dataset.v2Bg) {
        avatar.dataset.v2Bg = avatar.style.background || 'linear-gradient(145deg,#704bff,#1bb5ed)';
      }
      if (avatar) avatar.style.background = avatar.dataset.v2Bg;
      row.querySelectorAll('.delete-btn').forEach(btn => btn.setAttribute('aria-hidden','true'));
    });
  }

  normalize();
  new MutationObserver(normalize).observe(list,{childList:true,subtree:true});
  window.addEventListener('indomail:folder-counts-refresh',normalize);
})();
