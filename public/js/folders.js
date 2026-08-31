const FOLDER_API='https://indomail-production.up.railway.app';
const storeGet=(key)=>localStorage.getItem(key)||sessionStorage.getItem(key);
const storeSet=(key,value)=>{localStorage.setItem(key,value);sessionStorage.setItem(key,value);};
let zohoFoldersCache=null;
let zohoFoldersPromise=null;
let folderCountTimer=null;
const pendingCountDeltas=new Map();

async function getZohoFolders(){
  if(zohoFoldersCache) return zohoFoldersCache;
  const token=storeGet('indomail_zoho_access_token');
  const accountId=storeGet('indomail_zoho_account_id');
  const domain=storeGet('indomail_zoho_api_domain')||'https://mail.zoho.com';
  if(!token||!accountId) throw new Error('Connect Zoho Mail first.');
  if(zohoFoldersPromise) return zohoFoldersPromise;
  zohoFoldersPromise=fetch(`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/folders`,{headers:{Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'}}).then(async r=>{
    if(!r.ok) throw new Error(`Zoho folders ${r.status}`);
    const p=await r.json();
    zohoFoldersCache=p?.data||[];
    zohoFoldersCache.forEach(f=>{
      const n=String(f.folderName||f.name||'').trim();
      const id=String(f.folderId||f.id||'');
      if(n&&id) storeSet(`indomail_folder_id_${n.toLowerCase()}`,id);
    });
    return zohoFoldersCache;
  }).finally(()=>{zohoFoldersPromise=null;});
  return zohoFoldersPromise;
}
function cachedFolderId(name){return storeGet(`indomail_folder_id_${name.toLowerCase()}`)||'';}
function getNavByName(name){return [...document.querySelectorAll('.sidebar .nav')].find(button=>{const label=button.textContent.trim().replace(/\s+\d+$/,'').replace(/\s+—$/,'');return label===name;})||null;}
function setFolderCount(name,count){
  const button=getNavByName(name); if(!button) return;
  let badges=button.querySelectorAll('b');
  let badge=button.querySelector('.folder-count');
  if(!badge){badge=badges[0]||document.createElement('b');badge.classList.add('folder-count');badge.setAttribute('aria-label',`${name} mail count`);if(!badge.isConnected)button.appendChild(badge);}
  [...button.querySelectorAll('b')].forEach(other=>{if(other!==badge)other.remove();});
  badge.textContent=Number.isFinite(count)?String(Math.max(0,Math.floor(count))):'—';
}
function getFolderCount(name){const button=getNavByName(name);if(!button)return null;const badge=button.querySelector('.folder-count');const value=Number(badge?.textContent);return Number.isFinite(value)?Math.max(0,Math.floor(value)):null;}
function adjustFolderCount(name,delta){const current=getFolderCount(name);if(current!==null)setFolderCount(name,current+delta);else pendingCountDeltas.set(name,(pendingCountDeltas.get(name)||0)+delta);}
async function countFolderMessages(accountId,folderId,headers,isStarred=false){
  if(!accountId||!folderId)return null;
  let url=`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/messages/view?folderId=${encodeURIComponent(folderId)}&limit=200&sortBy=date&sortorder=false`;
  if(isStarred)url+='&flaggedMails=true';
  const r=await fetch(url,{headers});
  if(!r.ok)return null;
  const p=await r.json();
  return Array.isArray(p?.data)?p.data.length:null;
}
async function refreshFolderCounts(){
  const token=storeGet('indomail_zoho_access_token');
  const accountId=storeGet('indomail_zoho_account_id')||'';
  const domain=storeGet('indomail_zoho_api_domain')||'https://mail.zoho.com';
  if(!token||!accountId)return;
  try{
    const folders=await getZohoFolders();
    const headers={Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'};
    const byName=new Map();
    folders.forEach(f=>{const name=String(f.folderName||f.name||'').trim();const id=String(f.folderId||f.id||'');if(name&&id)byName.set(name.toLowerCase(),id);});
    const names=['Inbox','Starred','Sent','Drafts','Trash'];
    await Promise.all(names.map(async name=>{
      const wanted=name.toLowerCase();
      const folderId=wanted==='starred'?(cachedFolderId('Inbox')||storeGet('indomail_zoho_inbox_folder_id')||byName.get('inbox')||''):(cachedFolderId(name)||byName.get(wanted)||'');
      if(!folderId){setFolderCount(name,0);return;}
      const count=await countFolderMessages(accountId,folderId,headers,wanted==='starred');
      if(count!==null){
        const delta=pendingCountDeltas.get(name)||0;
        setFolderCount(name,count+delta);
        pendingCountDeltas.delete(name);
      }
    }));
  }catch(e){console.warn('Folder count refresh failed',e);}
}
function applyDeleteDelta(type,folderName){
  const selected=String(folderName||storeGet('indomail_selected_folder')||'Inbox');
  const isTrash=selected.toLowerCase()==='trash';
  if(type==='move-to-trash'&&!isTrash){adjustFolderCount(selected,-1);adjustFolderCount('Trash',1);}
  else if(type==='permanent-delete'||isTrash){adjustFolderCount('Trash',-1);}
}
window.addEventListener('indomail:delete-success',e=>applyDeleteDelta(e.detail?.type,e.detail?.folder));
window.addEventListener('indomail:folder-counts-refresh',e=>applyDeleteDelta(e.detail?.type,e.detail?.folder));
async function selectZohoFolder(name,button){
  document.querySelectorAll('.sidebar .nav').forEach(n=>n.classList.remove('active'));
  button?.classList.add('active');
  const head=document.querySelector('.panel-head h2');if(head)head.textContent=name;
  if(window.innerWidth<=900)document.querySelector('#sidebar')?.classList.remove('open');
  const folderId=name==='Starred'?(cachedFolderId('Inbox')||storeGet('indomail_zoho_inbox_folder_id')||''):(cachedFolderId(name)||(zohoFoldersCache?.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===name.toLowerCase())?.folderId||''));
  storeSet('indomail_selected_folder',name);
  if(folderId)storeSet('indomail_selected_folder_id',String(folderId));else{localStorage.removeItem('indomail_selected_folder_id');sessionStorage.removeItem('indomail_selected_folder_id');}
  window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name,folderId:String(folderId||'')}}));
  refreshFolderCounts();
}
function removeLegacyComposeElements(){document.querySelectorAll('#floatingCompose,.indomail-floating-compose').forEach(el=>el.remove());}
function initFolderNavigation(){
  removeLegacyComposeElements();
  const navs=[...document.querySelectorAll('.sidebar .nav')];
  const names={Inbox:'Inbox',Starred:'Starred',Sent:'Sent',Drafts:'Drafts',Trash:'Trash'};
  navs.forEach(button=>{if(button.dataset.folderBound==='1')return;const label=button.textContent.trim().replace(/\s+\d+$/,'').replace(/\s+—$/,'');if(names[label]){button.dataset.folderBound='1';button.addEventListener('click',()=>selectZohoFolder(names[label],button));}});
  getZohoFolders().then(()=>refreshFolderCounts()).catch(()=>{});
  if(folderCountTimer)clearInterval(folderCountTimer);
  folderCountTimer=setInterval(refreshFolderCounts,5000);
}
window.addEventListener('indomail:logged-in',initFolderNavigation);
window.addEventListener('indomail:refresh',refreshFolderCounts);
window.addEventListener('indomail:folder-changed',refreshFolderCounts);
window.addEventListener('load',initFolderNavigation);
initFolderNavigation();
