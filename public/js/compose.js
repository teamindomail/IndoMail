const composeBtn=document.querySelector('#composeBtn');const modal=document.querySelector('#composeModal');const closeBtn=document.querySelector('#composeClose');
function openCompose(){modal?.classList.remove('hidden');document.querySelector('#composeTo')?.focus()}
function closeCompose(){modal?.classList.add('hidden')}
composeBtn?.addEventListener('click',openCompose);closeBtn?.addEventListener('click',closeCompose);modal?.addEventListener('click',e=>{if(e.target===modal)closeCompose()});
document.querySelector('#composeCancel')?.addEventListener('click',closeCompose);document.querySelector('#composeForm')?.addEventListener('submit',e=>{e.preventDefault();closeCompose();alert('Compose is ready for real mail-engine integration.')});