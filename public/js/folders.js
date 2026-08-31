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
  document.querySelectorAll('.sidebar .nav').forEach(n=>n.classList.remove('active'));button?.classList.add('active');const head=document.querySelector('.panel-head h2');if(head)head.textContent=name;const status=document.querySelector('.panel-head span');if(status)status.textContent='Loading…';if(window.innerWidth<=900)document.querySelector('#sidebar')?.classList.remove('open');
  if(name==='Starred'){let inboxId=cachedFolderId('Inbox')||storeGet('indomail_zoho_inbox_folder_id')||'';if(!inboxId&&zohoFoldersCache){const inbox=zohoFoldersCache.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()==='inbox');inboxId=String(inbox?.folderId||inbox?.id||'');}if(inboxId){storeSet('indomail_selected_folder','Starred');storeSet('indomail_selected_folder_id',inboxId);window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name:'Starred',folderId:inboxId}}));return;}try{await getZohoFolders();const inbox=zohoFoldersCache.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()==='inbox');inboxId=String(inbox?.folderId||inbox?.id||'');if(!inboxId)throw new Error('Zoho Inbox folder not found');storeSet('indomail_selected_folder','Starred');storeSet('indomail_selected_folder_id',inboxId);window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name:'Starred',folderId:inboxId}}));}catch(e){const list=document.querySelector('#mailList');if(list)list.innerHTML=`<div class="status" style="padding:24px 10px">${String(e.message).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</div>`;}return;}
  let folderId=cachedFolderId(name);if(!folderId&&zohoFoldersCache){const folder=zohoFoldersCache.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===name.toLowerCase());folderId=String(folder?.folderId||folder?.id||'');}if(folderId){storeSet('indomail_selected_folder',name);storeSet('indomail_selected_folder_id',folderId);if(name==='Inbox')storeSet('indomail_zoho_inbox_folder_id',folderId);window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name,folderId}}));return;}try{const folders=await getZohoFolders();const folder=folders.find(f=>String(f.folderName||f.name||'').trim().toLowerCase()===name.toLowerCase());if(!folder)throw new Error(`Zoho ${name} folder not found`);folderId=String(folder.folderId||folder.id||'');if(!folderId)throw new Error(`Zoho ${name} folder ID not found`);storeSet('indomail_selected_folder',name);storeSet('indomail_selected_folder_id',folderId);if(name==='Inbox')storeSet('indomail_zoho_inbox_folder_id',folderId);window.dispatchEvent(new CustomEvent('indomail:folder-changed',{detail:{name,folderId}}));}catch(e){const list=document.querySelector('#mailList');if(list)list.innerHTML=`<div class="status" style="padding:24px 10px">${String(e.message).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</div>`;}
}
function initFolderNavigation(){const navs=[...document.querySelectorAll('.sidebar .nav')];const names={Inbox:'Inbox',Starred:'Starred',Sent:'Sent',Drafts:'Drafts',Trash:'Trash'};navs.forEach(button=>{if(button.dataset.folderBound==='1')return;const label=button.textContent.trim().replace(/\s+\d+$/,'');if(names[label]){button.dataset.folderBound='1';button.addEventListener('click',()=>selectZohoFolder(names[label],button));}});getZohoFolders().catch(()=>{});}
window.addEventListener('indomail:logged-in',initFolderNavigation);window.addEventListener('load',initFolderNavigation);initFolderNavigation();

// Starred is a virtual view. Load every message with the Important flag,
// including sent and archived mail, before the normal folder loader runs.
window.addEventListener('indomail:folder-changed',async event=>{
  if(String(event.detail?.name||'').toLowerCase()!=='starred')return;
  event.stopImmediatePropagation();
  const list=document.querySelector('#mailList');
  try{
    const token=storeGet('indomail_zoho_access_token');const accountId=storeGet('indomail_zoho_account_id');const domain=storeGet('indomail_zoho_api_domain')||'https://mail.zoho.com';
    if(!token||!accountId)throw new Error('Connect Zoho Mail first.');
    const headers={Authorization:`Zoho-oauthtoken ${token}`,'X-Zoho-Api-Domain':domain,Accept:'application/json'};
    const url=`${FOLDER_API}/api/zoho/api/accounts/${encodeURIComponent(accountId)}/messages/view?start=1&limit=200&sortBy=date&sortorder=false&includeto=true&includesent=true&includearchive=true&flagid=2&flaggedMails=true`;
    const response=await fetch(url,{headers});if(!response.ok)throw new Error(`Zoho starred ${response.status}`);const payload=await response.json();
    currentMessages=(payload?.data||[]).map(m=>({accountId,folderId:String(m.folderId||''),messageId:String(m.messageId||m.id||''),threadId:String(m.threadId||''),sender:m.fromAddress||m.sender||'Unknown sender',toAddress:m.toAddress||'',subject:m.subject||'(No subject)',preview:m.summary||m.snippet||'',time:typeof formatDate==='function'?formatDate(m.sentDateInGMT||m.receivedTime||m.date):'',color:typeof colorFor==='function'?colorFor(m.fromAddress||m.sender||m.subject):'',unread:Boolean(m.isRead===false||m.read===false||String(m.status||'').toLowerCase()==='unread'),starred:true}));
    if(typeof renderMessages==='function')renderMessages();if(typeof setUnreadCount==='function')setUnreadCount();const status=document.querySelector('.panel-head span');if(status)status.textContent=`${currentMessages.length} starred`;
  }catch(error){console.error(error);if(list)list.innerHTML=`<div class="status" style="padding:24px 10px">${String(error.message).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</div>`;}
},true);
