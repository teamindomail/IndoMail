const FOLDER_API='https://indomail-production.up.railway.app';
const storeGet=(key)=>localStorage.getItem(key)||sessionStorage.getItem(key);
const storeSet=(key,value)=>{localStorage.setItem(key,value);sessionStorage.setItem(key,value);};
let zohoFoldersCache=null;
let zohoFoldersPromise=null;

async function getZohoFolders(){
  if(zohoFoldersCache) return zohoFoldersCache;
  const token=storeGet('indomail_zoho_access_token');
  const accountId=storeGet('indomail_zoho_account_id');
  const domain=storeGet('indomail_zoho_api_domain')||'https://mail.zoho.com';
  if(!token||!accountId) throw new Error('Connect Zoho Mail first.');
  if(zohoFoldersPromise) return zohoFoldersPromise;
  zohoFoldersPromise=fetch(`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/folders`,{headers:{Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error(`Zoho folders ${r.status}`);const p=await r.json();zohoFoldersCache=p?.data||[];return zohoFoldersCache;}).finally(()=>{zohoFoldersPromise=null;});
  return zohoFoldersPromise;
}

async function selectZohoFolder(name,button){
  try{
    const folders=await getZohoFolders();
    const wanted=name.toLowerCase();
    const folder=folders.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===wanted);
    if(!folder) throw new Error(`Zoho ${name} folder not found`);
    const folderId=String(folder.folderId||folder.id||'');
    if(!folderId) throw new Error(`Zoho ${name} folder ID not found`);
    storeSet('indomail_selected_folder',name);
    storeSet('indomail_selected_folder_id',folderId);
    storeSet('indomail_zoho_inbox_folder_id',folderId);
    document.querySelectorAll('.sidebar .nav').forEach(n=>n.classList.remove('active'));
    button?.classList.add('active');
    const head=document.querySelector('.panel-head h2');if(head)head.textContent=name;
    const status=document.querySelector('.panel-head span');if(status)status.textContent='Loading…';
    window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name,folderId}}));
    window.dispatchEvent(new CustomEvent('indomail:refresh'));
    if(window.innerWidth<=900) document.querySelector('#sidebar')?.classList.remove('open');
  }catch(e){
    const list=document.querySelector('#mailList');
    if(list) list.innerHTML=`<div class="status" style="padding:24px 10px">${String(e.message).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</div>`;
  }
}

function initFolderNavigation(){
  const navs=[...document.querySelectorAll('.sidebar .nav')];
  const names={Inbox:'Inbox',Sent:'Sent',Drafts:'Drafts',Trash:'Trash'};
  navs.forEach(button=>{
    if(button.dataset.folderBound==='1') return;
    const label=button.textContent.trim().replace(/\s+\d+$/,'');
    if(names[label]){button.dataset.folderBound='1';button.addEventListener('click',()=>selectZohoFolder(names[label],button));}
  });
  getZohoFolders().catch(()=>{});
}

window.addEventListener('indomail:logged-in',initFolderNavigation);
window.addEventListener('load',initFolderNavigation);
initFolderNavigation();
