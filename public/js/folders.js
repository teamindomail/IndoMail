const FOLDER_API='https://indomail-production.up.railway.app';

async function getZohoFolders(){
  const token=sessionStorage.getItem('indomail_zoho_access_token');
  const accountId=sessionStorage.getItem('indomail_zoho_account_id');
  const domain=sessionStorage.getItem('indomail_zoho_api_domain')||'https://mail.zoho.com';
  if(!token||!accountId) throw new Error('Connect Zoho Mail first.');
  const r=await fetch(`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/folders`,{headers:{Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'}});
  if(!r.ok) throw new Error(`Zoho folders ${r.status}`);
  const p=await r.json();
  return p?.data||[];
}

async function selectZohoFolder(name,button){
  try{
    const folders=await getZohoFolders();
    const wanted=name.toLowerCase();
    const folder=folders.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===wanted);
    if(!folder) throw new Error(`Zoho ${name} folder not found`);
    const folderId=String(folder.folderId||folder.id||'');
    if(!folderId) throw new Error(`Zoho ${name} folder ID not found`);
    sessionStorage.setItem('indomail_zoho_inbox_folder_id',folderId);
    sessionStorage.setItem('indomail_selected_folder',name);
    document.querySelectorAll('.sidebar .nav').forEach(n=>n.classList.remove('active'));
    button?.classList.add('active');
    document.querySelector('.panel-head h2').textContent=name;
    document.querySelector('.panel-head span').textContent='Loading…';
    document.querySelector('#refreshBtn')?.click();
    if(window.innerWidth<=700) document.querySelector('#sidebar')?.classList.remove('open');
  }catch(e){
    const list=document.querySelector('#mailList');
    if(list) list.innerHTML=`<div class="status" style="padding:24px 10px">${String(e.message).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</div>`;
  }
}

function initFolderNavigation(){
  const navs=[...document.querySelectorAll('.sidebar .nav')];
  const names={Inbox:'Inbox',Sent:'Sent',Drafts:'Drafts',Trash:'Trash'};
  navs.forEach(button=>{
    const label=button.textContent.trim().replace(/\s+\d+$/,'');
    if(names[label]) button.addEventListener('click',()=>selectZohoFolder(names[label],button));
  });
}

window.addEventListener('indomail:logged-in',initFolderNavigation);
window.addEventListener('load',initFolderNavigation);
initFolderNavigation();
