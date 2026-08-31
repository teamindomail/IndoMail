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
  zohoFoldersPromise=fetch(`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/folders`,{headers:{Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error(`Zoho folders ${r.status}`);const p=await r.json();zohoFoldersCache=p?.data||[];zohoFoldersCache.forEach(f=>{const n=String(f.folderName||f.name||'').trim();const id=String(f.folderId||f.id||'');if(n&&id)storeSet(`indomail_folder_id_${n.toLowerCase()}`,id);});return zohoFoldersCache;}).finally(()=>{zohoFoldersPromise=null;});
  return zohoFoldersPromise;
}
function cachedFolderId(name){return storeGet(`indomail_folder_id_${name.toLowerCase()}`)||'';}
async function selectZohoFolder(name,button){
  document.querySelectorAll('.sidebar .nav').forEach(n=>n.classList.remove('active'));button?.classList.add('active');
  const head=document.querySelector('.panel-head h2');if(head)head.textContent=name;
  const status=document.querySelector('.panel-head span');if(status)status.textContent='Loading…';
  if(window.innerWidth<=900)document.querySelector('#sidebar')?.classList.remove('open');
  const folderId=name==='Starred' ? (cachedFolderId('Inbox')||storeGet('indomail_zoho_inbox_folder_id')||'') : (cachedFolderId(name) || (zohoFoldersCache?.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===name.toLowerCase())?.folderId||''));
  storeSet('indomail_selected_folder',name);
  if(folderId)storeSet('indomail_selected_folder_id',String(folderId));else{localStorage.removeItem('indomail_selected_folder_id');sessionStorage.removeItem('indomail_selected_folder_id');}
  window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name,folderId:String(folderId||'')}}));
}
function mountFloatingCompose(){
  let button=document.querySelector('#floatingCompose');
  if(button)return;
  button=document.createElement('button');button.id='floatingCompose';button.type='button';button.setAttribute('aria-label','Compose new mail');button.textContent='＋ Compose';
  button.addEventListener('click',()=>document.querySelector('#composeBtn')?.click());
  document.body.appendChild(button);
  const style=document.createElement('style');style.id='floating-compose-style';style.textContent=`#floatingCompose{position:fixed;right:28px;bottom:28px;z-index:80;border:0;border-radius:14px;padding:12px 18px;background:#5b4bdb;color:#fff;font-weight:700;box-shadow:0 12px 28px rgba(20,30,60,.2);cursor:pointer}#floatingCompose:hover{transform:translateY(-1px)}@media(max-width:900px){#floatingCompose{right:18px;bottom:18px;padding:11px 15px;font-size:13px}}`;document.head.appendChild(style);
}
function removeSidebarCompose(){const compose=document.querySelector('#sidebar #composeBtn');if(compose)compose.style.display='none';mountFloatingCompose();}
function initFolderNavigation(){const navs=[...document.querySelectorAll('.sidebar .nav')];const names={Inbox:'Inbox',Starred:'Starred',Sent:'Sent',Drafts:'Drafts',Trash:'Trash'};navs.forEach(button=>{if(button.dataset.folderBound==='1')return;const label=button.textContent.trim().replace(/\s+\d+$/,'');if(names[label]){button.dataset.folderBound='1';button.addEventListener('click',()=>selectZohoFolder(names[label],button));}});removeSidebarCompose();getZohoFolders().catch(()=>{});}
window.addEventListener('indomail:logged-in',initFolderNavigation);window.addEventListener('load',initFolderNavigation);initFolderNavigation();
