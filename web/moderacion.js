(() => {
'use strict';
const $ = s => document.querySelector(s);
const make = (tag, value, cls) => {const element = document.createElement(tag);element.textContent = String(value ?? '');if(cls)element.className = cls;return element;};
let csrf='',status='open';
async function request(path,method='GET',body) {
  const result=await fetch('/portal'+path,{method,credentials:'same-origin',headers:{Accept:'application/json',...(method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await result.json().catch(()=>({}));
  if(!result.ok)throw new Error(Object.values(data.errors||{}).flat()[0]||data.message||'Error '+result.status);
  return data;
}
function announce(text,err=false) { const el=$('[data-mod-status]');el.textContent=text;el.classList.toggle('ok',!err);el.classList.toggle('error',err);}
async function refresh() {
  const data=await request('/reports?status='+encodeURIComponent(status));
  const out=$('[data-mod-list]');out.replaceChildren();
  if(!(data.items||[]).length)out.append(make('p','Sin reportes en esta categoría.','portal-empty-state'));
  for(const report of data.items||[]) {
    const card=make('article',null,'portal-member-box');
    card.append(make('strong','#'+report.id+' · '+report.target_type+' #'+report.target_id),make('p','Motivo: '+report.reason),make('p','Descripción: '+(report.details||'Sin descripción')));
    if(status==='open')for(const [label,decision] of [['Marcar revisado','reviewed'],['Descartar','dismissed']]) {
      const button=make('button',label,'portal-backlink');button.type='button';button.style.marginRight='20px';
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try{await request('/reports/'+report.id,'PATCH',{status:decision});await refresh();announce('Reporte actualizado.');}
        catch(e){announce(e.message,true);} finally{button.disabled=false;}
      });
      card.append(button);
    }
    out.append(card);
  }
  announce('Reportes consultados. Categoría: '+status+'.');
}
async function start() {
 try {
  const session=await request('/session');
  csrf=session.csrf||'';
  const staff=Boolean(session.user?.is_staff);
  $('[data-mod-panel]').hidden=!staff;
  $('[data-mod-denied]').hidden=staff;
  if(!staff){announce('Acceso restringido a administradores.',true);return;}
  for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{
    status=button.dataset.filter;
    for(const item of document.querySelectorAll('[data-filter]'))item.classList.toggle('active',item===button);
    refresh().catch(e=>announce(e.message,true));
  });
  await refresh();
 }catch(e){announce('API no disponible: '+e.message,true);}
}
start();
})();