import { tools } from './registry.js';
// Roadmap entries are not registered as working tools or given launch links.
export const plannedTools = [];
export function statusEntries() {
 return [
  ...tools.map(tool => ({...tool,status:'Available',storage:tool.persistent?'Saved locally · backup supported':'Not saved'})),
  ...plannedTools.map(tool => ({...tool,status:'Planned',storage:'Not implemented'})),
 ];
}
export function mountToolStatus(container) {
 const entries=statusEntries();
 container.innerHTML='<div class="section-heading"><h2 id="status-heading">Tool status</h2><span class="subtle">Implementation progress</span></div><p class="status-explainer">Every implemented tool is listed below'+(plannedTools.length?', followed by selected roadmap items':'')+'. Available means implemented—not a live uptime guarantee. Browser and file-format limitations still apply.</p><div id="status-summary" class="status-summary"></div><div class="filters"><label class="search"><span aria-hidden="true">⌕</span><input id="status-search" type="search" placeholder="Search tool status…" aria-label="Search tool status"></label><label><span class="sr-only">Filter by status</span><select id="status-filter"><option value="all">All statuses</option><option>Available</option>'+(plannedTools.length?'<option>Planned</option>':'')+'</select></label></div><p id="status-count" role="status"></p><div class="table-scroll status-table" role="region" aria-label="Tool implementation status" tabindex="0"><table><caption class="sr-only">Available tools and selected planned tools</caption><thead><tr><th scope="col">Tool</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Data storage</th><th scope="col">Action</th></tr></thead><tbody id="status-rows"></tbody></table></div><p class="status-explainer">'+(plannedTools.length?'Planned entries are roadmap items, not launchable tools or delivery promises. ':'Every tool from the original roadmap is now available. ')+'Publishing to GitHub Pages and offline app caching remain pending.</p>';
 const $=selector=>container.querySelector(selector);
 $('#status-summary').textContent=`${tools.length} available · ${plannedTools.length?`${plannedTools.length} planned`:'none planned'} · ${tools.filter(t=>t.persistent).length} with local saving`;
 function render(){
  const query=$('#status-search').value.trim().toLowerCase(),status=$('#status-filter').value;
  const visible=entries.filter(t=>(status==='all'||t.status===status)&&`${t.name} ${t.category}`.toLowerCase().includes(query));
  $('#status-count').textContent=`Showing ${visible.length} of ${entries.length} entries`;
  const body=$('#status-rows');body.replaceChildren();
  for(const tool of visible){
   const row=document.createElement('tr');
   for(const value of [tool.name,tool.category,tool.status,tool.storage]){const cell=document.createElement('td');cell.textContent=value;if(value===tool.status){const badge=document.createElement('span');badge.className=`status-badge ${tool.status.toLowerCase()}`;badge.textContent=value;cell.replaceChildren(badge);}row.append(cell);}
   const action=document.createElement('td');
   if(tool.id){const link=document.createElement('a');link.href=`#tool/${tool.id}`;link.textContent='Open';link.setAttribute('aria-label',`Open ${tool.name}`);action.append(link);}else action.textContent='Not available yet';
   row.append(action);body.append(row);
  }
  if(!visible.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=5;cell.textContent='No tools match these filters.';row.append(cell);body.append(row);}
 }
 $('#status-search').oninput=render;$('#status-filter').onchange=render;render();
}
