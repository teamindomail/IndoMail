const FOLDER_API='https://indomail-production.up.railway.app';
const storeGet=(key)=>localStorage.getItem(key)||sessionStorage.getItem(key);
const storeSet=(key,value)=>{localStorage.setItem(key,value);sessionStorage.setItem(key,value);};

let zohoFoldersCache=null;
let zohoFoldersPromise=null;
let folderCountTimer=null;
let refreshTimer=null;
let listObserver=null;
let refreshing=false;
const optimistic=new Map();
const lastServerCounts=new Map();

async function getZohoFolders(){
  if(zohoFoldersCache)return zohoFoldersCache;
  const token=storeGet('indomail_zoho_access_token');
  const accountId=storeGet('indomail_zoho_account_id');
  const domain=storeGet('indomail_zoho_api_domain')||'https://mail.zoho.com';
  if(!token||!accountId)throw new Error('Connect Zoho Mail first.');
  if(zohoFoldersPromise)return zohoFoldersPromise;
  zohoFoldersPromise=fetch(`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/folders`,{headers:{Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'}})
    .then(async r=>{if(!r.ok)throw new Error(`Zoho folders ${r.status}`);const p=await r.json();zohoFoldersCache=p?.data||[];zohoFoldersCache.forEach(f=>{const n=String(f.folderName||f.name||'').trim();const id=String(f.folderId||f.id||'');if(n&&id)storeSet(`indomail_folder_id_${n.toLowerCase()}`,id);});return zohoFoldersCache;})
    .finally(()=>{zohoFoldersPromise=null;});
  return zohoFoldersPromise;
}

function cachedFolderId(name){return storeGet(`indomail_folder_id_${name.toLowerCase()}`)||'';}
function selectedFolder(){return String(storeGet('indomail_selected_folder')||'Inbox');}
function getNavByName(name){return [...document.querySelectorAll('.sidebar .nav')].find(button=>{const label=button.textContent.trim().replace(/\s+\d+$/,'').replace(/\s+—$/,'');return label===name;})||null;}
function setFolderCount(name,count){const button=getNavByName(name);if(!button)return;let badges=button.querySelectorAll('b');let badge=button.querySelector('.folder-count');if(!badge){badge=badges[0]||document.createElement('b');badge.classList.add('folder-count');badge.setAttribute('aria-label',`${name} mail count`);if(!badge.isConnected)button.appendChild(badge);}[...button.querySelectorAll('b')].forEach(other=>{if(other!==badge)other.remove();});badge.textContent=Number.isFinite(count)?String(Math.max(0,Math.floor(count))):'—';}
function getFolderCount(name){const button=getNavByName(name);if(!button)return null;const value=Number(button.querySelector('.folder-count')?.textContent);return Number.isFinite(value)?Math.max(0,value):null;}
function adjustFolderCount(name,delta){const current=getFolderCount(name);if(current!==null)setFolderCount(name,current+delta);else optimistic.set(name,(optimistic.get(name)||0)+delta);}
function renderedListCount(){const list=document.querySelector('#mailList');return list?list.querySelectorAll('.mail').length:null;}
function syncActiveCountFromList(){const list=document.querySelector('#mailList');if(!list)return;setFolderCount(selectedFolder(),list.querySelectorAll('.mail').length);}

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
  if(refreshing)return;
  const token=storeGet('indomail_zoho_access_token');
  const accountId=storeGet('indomail_zoho_account_id')||'';
  const domain=storeGet('indomail_zoho_api_domain')||'https://mail.zoho.com';
  if(!token||!accountId)return;
  refreshing=true;
  try{
    const folders=await getZohoFolders();
    const headers={Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'};
    const byName=new Map();
    folders.forEach(f=>{const n=String(f.folderName||f.name||'').trim().toLowerCase();const id=String(f.folderId||f.id||'');if(n&&id)byName.set(n,id);});
    const active=selectedFolder().toLowerCase();
    let activeChanged=false;
    for(const name of ['Inbox','Starred','Sent','Drafts','Trash']){
      const key=name.toLowerCase();
      const folderId=key==='starred'?(cachedFolderId('Inbox')||storeGet('indomail_zoho_inbox_folder_id')||byName.get('inbox')||''):(cachedFolderId(name)||byName.get(key)||'');
      if(!folderId){setFolderCount(name,0);continue;}
      const serverCount=await countFolderMessages(accountId,folderId,headers,key==='starred');
      if(serverCount===null)continue;
      const previous=lastServerCounts.get(key);
      lastServerCounts.set(key,serverCount);
      if(key===active&&previous!==undefined&&previous!==serverCount)activeChanged=true;
      const visible=key===active?renderedListCount():null;
      const delta=optimistic.get(key)||0;
      if(key===active&&visible!==null){
        setFolderCount(name,visible);
      }else if(delta&&previous===serverCount){
        setFolderCount(name,serverCount+delta);
      }else{
        setFolderCount(name,serverCount);
        optimistic.delete(key);
      }
    }
    if(activeChanged){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>window.dispatchEvent(new CustomEvent('indomail:refresh')),50);}
  }catch(e){console.warn('Folder count refresh failed',e);}
  finally{refreshing=false;}
}

function applyDeleteDelta(type,folderName){
  const selected=String(folderName||selectedFolder());
  const trash=selected.toLowerCase()==='trash';
  if(type==='move-to-trash'&&!trash){adjustFolderCount(selected,-1);adjustFolderCount('Trash',1);}
  else if(type==='permanent-delete'||trash){adjustFolderCount('Trash',-1);}
}
window.addEventListener('indomail:delete-success',e=>{applyDeleteDelta(e.detail?.type,e.detail?.folder);refreshFolderCounts();});
window.addEventListener('indomail:folder-counts-refresh',e=>{applyDeleteDelta(e.detail?.type,e.detail?.folder);refreshFolderCounts();});

function queueLiveCountRefresh(delay=250){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshFolderCounts,delay);}

document.addEventListener('click',e=>{
  const target=e.target.closest?.('[data-action="delete"],[data-action="star"],[data-draft-edit],#composeForm button[type="submit"]');
  if(!target)return;
  if(target.matches('[data-action="delete"]')){
    const selected=selectedFolder();
    if(selected.toLowerCase()==='trash')applyDeleteDelta('permanent-delete',selected);
    else applyDeleteDelta('move-to-trash',selected);
  }else if(target.matches('[data-action="star"]')){
    const starred=target.textContent.includes('★');
    adjustFolderCount('Starred',starred?-1:1);
  }
  queueLiveCountRefresh(500);
},true);

function observeMailList(){
  const list=document.querySelector('#mailList');
  if(!list||listObserver===list)return;
  listObserver=new MutationObserver(()=>{syncActiveCountFromList();queueLiveCountRefresh(350);});
  listObserver.observe(list,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  syncActiveCountFromList();
}

async function selectZohoFolder(name,button){
  document.querySelectorAll('.sidebar .nav').forEach(n=>n.classList.remove('active'));
  button?.classList.add('active');
  const head=document.querySelector('.panel-head h2');if(head)head.textContent=name;
  if(window.innerWidth<=900)document.querySelector('#sidebar')?.classList.remove('open');
  const folderId=name==='Starred'?(cachedFolderId('Inbox')||storeGet('indomail_zoho_inbox_folder_id')||''):(cachedFolderId(name)||(zohoFoldersCache?.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===name.toLowerCase())?.folderId||''));
  storeSet('indomail_selected_folder',name);
  if(folderId)storeSet('indomail_selected_folder_id',String(folderId));
  else{localStorage.removeItem('indomail_selected_folder_id');sessionStorage.removeItem('indomail_selected_folder_id');}
  observeMailList();
  window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name,folderId:String(folderId||'')}}));
  syncActiveCountFromList();
  refreshFolderCounts();
}

function removeLegacyComposeElements(){document.querySelectorAll('#floatingCompose,.indomail-floating-compose').forEach(el=>el.remove());}
function initFolderNavigation(){
  removeLegacyComposeElements();
  observeMailList();
  const navs=[...document.querySelectorAll('.sidebar .nav')];
  const names={Inbox:'Inbox',Starred:'Starred',Sent:'Sent',Drafts:'Drafts',Trash:'Trash'};
  navs.forEach(button=>{if(button.dataset.folderBound==='1')return;const label=button.textContent.trim().replace(/\s+\d+$/,'').replace(/\s+—$/,'');if(names[label]){button.dataset.folderBound='1';button.addEventListener('click',()=>selectZohoFolder(names[label],button));}});
  getZohoFolders().then(()=>refreshFolderCounts()).catch(()=>{});
  if(folderCountTimer)clearInterval(folderCountTimer);
  folderCountTimer=setInterval(refreshFolderCounts,1000);
}
window.addEventListener('indomail:logged-in',initFolderNavigation);
window.addEventListener('indomail:refresh',()=>{observeMailList();syncActiveCountFromList();refreshFolderCounts();});
window.addEventListener('indomail:folder-changed',()=>{observeMailList();syncActiveCountFromList();refreshFolderCounts();});
window.addEventListener('load',initFolderNavigation);
initFolderNavigation();