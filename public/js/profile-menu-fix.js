/* IndoMail stable profile/menu interaction layer. */
(()=>{
  const css=document.createElement('style');
  css.textContent=`
    .account-pop{max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - 78px)!important;overflow:auto!important}
    .settings-modal,.account-modal,.feature-modal{z-index:2000!important}
    .settings-card,.account-card,.feature-card{max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important;box-sizing:border-box!important}
    @media(max-width:900px){
      .account-pop{left:10px!important;right:10px!important;top:58px!important;width:auto!important;max-width:none!important;max-height:calc(100dvh - 70px)!important}
      .settings-modal,.account-modal,.feature-modal{padding:10px!important}
      .settings-card,.account-card,.feature-card{width:min(100%,620px)!important;max-width:100%!important;max-height:calc(100dvh - 20px)!important}
    }
  `;
  document.head.appendChild(css);
  function closeMenu(){document.querySelector('.account-pop')?.remove();}
  document.addEventListener('click',event=>{
    const menu=event.target.closest?.('.account-pop');
    const trigger=event.target.closest?.('#accountBtn');
    if(!menu&&!trigger)closeMenu();
  },false);
  window.addEventListener('resize',()=>{
    const menu=document.querySelector('.account-pop');
    if(menu&&window.innerWidth<=900){menu.style.left='10px';menu.style.right='10px';menu.style.width='auto';}
  });
})();
