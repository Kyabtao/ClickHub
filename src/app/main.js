import '../styles/main.css';
import { tools } from './registry.js';
import { mountToolStatus } from './tool-status.js';
import { load, save } from '../lib/storage/index.js';
import { stats, transform } from '../tools/text/text-workbench/logic.js';
import { formatJSON } from '../tools/developer/json-formatter/logic.js';
import { generatePassword } from '../tools/security/password-generator/logic.js';
import { mount as encoding_converter } from '../tools/developer/encoding-converter/view.js';
import { mount as uuid_generator } from '../tools/developer/uuid-generator/view.js';
import { mount as timestamp_converter } from '../tools/developer/timestamp-converter/view.js';
import { mount as unit_converter } from '../tools/math-science/unit-converter/view.js';
import { mount as percentage_calculator } from '../tools/math-science/percentage-calculator/view.js';
import { mount as discount_calculator } from '../tools/finance/discount-calculator/view.js';
import { mount as compound_interest } from '../tools/finance/compound-interest/view.js';
import { mount as loan_calculator } from '../tools/finance/loan-calculator/view.js';
import { mount as bmi_calculator } from '../tools/health-fitness/bmi-calculator/view.js';
import { mount as aspect_ratio } from '../tools/design/aspect-ratio/view.js';
import { mount as color_converter } from '../tools/design/color-converter/view.js';
import { mount as hash_calculator } from '../tools/security/hash-calculator/view.js';
import { mount as url_inspector } from '../tools/developer/url-inspector/view.js';
import { mount as number_base } from '../tools/developer/number-base/view.js';
import { mount as csv_json } from '../tools/data/csv-json/view.js';
import { mount as jwt_inspector } from '../tools/developer/jwt-inspector/view.js';
import { mount as slug_generator } from '../tools/seo-marketing/slug-generator/view.js';
import { mount as contrast_checker } from '../tools/accessibility/contrast-checker/view.js';
import { mount as date_difference } from '../tools/productivity/date-difference/view.js';
import { mount as statistics_calculator } from '../tools/data/statistics-calculator/view.js';
import { mount as resistor_calculator } from '../tools/math-science/resistor-calculator/view.js';
import { mount as bill_splitter } from '../tools/finance/bill-splitter/view.js';
import { mount as recipe_scaler } from '../tools/home-lifestyle/recipe-scaler/view.js';
import { mount as morse_translator } from '../tools/language/morse-translator/view.js';
import { mount as notes } from '../tools/productivity/notes/view.js';
import { mount as tasks } from '../tools/productivity/tasks/view.js';
import { mount as habit_tracker } from '../tools/productivity/habit-tracker/view.js';
import { mount as bookmarks } from '../tools/productivity/bookmarks/view.js';
import { mount as expense_tracker } from '../tools/finance/expense-tracker/view.js';
import { mount as qr_generator } from '../tools/design/qr-generator/view.js';
import { mount as image_resizer } from '../tools/media-files/image-resizer/view.js';
import { mount as image_converter } from '../tools/media-files/image-converter/view.js';
import { mount as pomodoro } from '../tools/productivity/pomodoro/view.js';
import { mount as stopwatch } from '../tools/productivity/stopwatch/view.js';
import { mount as pdf_merger } from '../tools/media-files/pdf-merger/view.js';
import { mount as pdf_extractor } from '../tools/media-files/pdf-extractor/view.js';
import { mount as pdf_organizer } from '../tools/media-files/pdf-organizer/view.js';
import { mount as images_to_pdf } from '../tools/media-files/images-to-pdf/view.js';
import { mount as csv_viewer } from '../tools/data/csv-viewer/view.js';
const toolViews = { 'pdf-merger': pdf_merger, 'pdf-extractor': pdf_extractor, 'pdf-organizer': pdf_organizer, 'images-to-pdf': images_to_pdf, 'csv-viewer': csv_viewer, 'qr-generator': qr_generator, 'image-resizer': image_resizer, 'image-converter': image_converter, 'pomodoro': pomodoro, 'stopwatch': stopwatch, 'notes': notes, 'tasks': tasks, 'habit-tracker': habit_tracker, 'bookmarks': bookmarks, 'expense-tracker': expense_tracker, 'csv-json': csv_json, 'jwt-inspector': jwt_inspector, 'slug-generator': slug_generator, 'contrast-checker': contrast_checker, 'date-difference': date_difference, 'statistics-calculator': statistics_calculator, 'resistor-calculator': resistor_calculator, 'bill-splitter': bill_splitter, 'recipe-scaler': recipe_scaler, 'morse-translator': morse_translator, 'percentage-calculator': percentage_calculator, 'discount-calculator': discount_calculator, 'compound-interest': compound_interest, 'loan-calculator': loan_calculator, 'bmi-calculator': bmi_calculator, 'aspect-ratio': aspect_ratio, 'color-converter': color_converter, 'hash-calculator': hash_calculator, 'url-inspector': url_inspector, 'number-base': number_base, 'encoding-converter': encoding_converter, 'uuid-generator': uuid_generator, 'timestamp-converter': timestamp_converter, 'unit-converter': unit_converter };
const storedFavorites = load('favorites', []), storedRecent = load('recent', []);
let favorites = Array.isArray(storedFavorites) ? storedFavorites.filter(id => tools.some(t => t.id === id)) : [];
let recent = Array.isArray(storedRecent) ? storedRecent.filter(id => tools.some(t => t.id === id)) : [];
let view = 'All tools', category = 'All categories', query = '';
document.documentElement.dataset.theme = load('theme', 'light') === 'dark' ? 'dark' : 'light';
document.querySelector('#app').innerHTML = `
<aside><a class="brand" href="#"><span class="brand-icon">✳</span> ClickHub<span class="brand-dot">.</span></a><div class="workspace">PERSONAL WORKSPACE</div><nav aria-label="Main navigation">${['All tools','Favorites','Recently used'].map((name,i) => `<button class="nav-item ${i===0?'active':''}" data-view="${name}"><span>${['▦','☆','◷'][i]}</span>${name}<small>${i===0 ? tools.length : ''}</small></button>`).join('')}</nav><div class="sidebar-note"><span>◈</span><strong>Your data. Your device.</strong><p>Tools run in your browser.<br>No uploads. No accounts.</p></div><button id="theme" class="theme-button">◐ <span>Switch theme</span></button></aside>
<div class="page"><header><span>Your everyday toolbox</span><a class="status-jump" href="#tool-status">Tool status ↗</a><div><span class="status-dot"></span> Local-first <span class="avatar">CH</span></div></header><main><p id="app-notice" role="status" hidden></p><div class="eyebrow">LESS FRICTION. MORE DOING.</div><div class="heading-row"><div><h1>Your tools, all in one place<span>.</span></h1><p class="intro">Small tools for big and little tasks. Free, simple, and right here.</p></div><div class="edition">PERSONAL EDITION<br><b>Built for your everyday.</b></div></div>
<section class="feature"><div><span class="feature-label">A LITTLE MORE FOCUS</span><h2>Get things done.<br>Keep things private.</h2><p>Format code, clean up text, and create secure passwords.<br>Everything happens on your device.</p><a href="#tools" class="feature-link">Explore your tools <span>↗</span></a></div><div class="feature-art" aria-hidden="true"><div class="orbit"></div><div class="art-tile tile-a">{ }</div><div class="art-tile tile-b">Aa</div><div class="art-tile tile-c">✳</div><span class="art-spark">✦</span></div></section>
<section id="tools"><div class="section-heading"><h2 id="view-title">All tools</h2><span class="subtle">A growing collection of useful things</span></div><div class="filters"><label class="search"><span>⌕</span><input id="search" type="search" placeholder="Find a tool…" aria-label="Search tools"><kbd>/</kbd></label><label class="category-label"><span class="sr-only">Category</span><select id="category"><option>All categories</option>${[...new Set(tools.map(t=>t.category))].map(c=>`<option>${c}</option>`).join('')}</select></label></div><div id="cards" class="cards"></div><div class="coming"><span>＋</span><div><strong>A toolbox that grows with you</strong><p>More tools are on the roadmap. Browse available tools and the roadmap below.</p></div><a class="status-jump" href="#tool-status">View tool status ↗</a></div></section><section id="tool-status" aria-labelledby="status-heading"></section><footer><span>ClickHub <span class="footer-dot">/</span> A simpler way to get things done.</span><span>No sign-up. No uploads. Just tools.</span></footer></main></div>
<dialog id="tool-dialog" aria-labelledby="tool-title"><div class="dialog-heading"><div><span id="tool-category" class="eyebrow"></span><h2 id="tool-title"></h2></div><button id="close" aria-label="Close tool">✕</button></div><p class="tool-privacy">Processed locally. Tool inputs are not saved.</p><div id="tool-content"></div><p id="feedback" role="status"></p></dialog>`;
mountToolStatus(document.querySelector('#tool-status'));
const cards = document.querySelector('#cards');
function persist(key, value) {
 if (!save(key, value)) {
  const notice = document.querySelector('#app-notice');
  notice.hidden = false;
  notice.textContent = 'Browser storage is unavailable or full. Preferences will last only for this session.';
 }
}
let openedId = null;
let disposeTool = null;
function renderCards() {
 const list = tools.filter(t => (view !== 'Favorites' || favorites.includes(t.id)) && (view !== 'Recently used' || recent.includes(t.id)) && (category === 'All categories' || category === t.category) && `${t.name} ${t.description} ${t.tags}`.toLowerCase().includes(query.toLowerCase()));
 if(view === 'Recently used') list.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
 document.querySelector('#view-title').textContent = `${view} · ${list.length}`;
 cards.innerHTML = list.length ? list.map(t=>`<article class="tool-card"><div class="card-top"><span class="tool-icon ${t.color}">${t.icon}</span><button class="favorite ${favorites.includes(t.id)?'selected':''}" data-favorite="${t.id}" aria-label="Favorite ${t.name}" aria-pressed="${favorites.includes(t.id)}">${favorites.includes(t.id)?'★':'☆'}</button></div><button class="open-tool" data-open="${t.id}"><h3>${t.name}</h3><p>${t.description}</p><div class="card-bottom"><span>${t.category}</span><span class="arrow">↗</span></div></button></article>`).join('') : '<div class="empty"><h3>No tools here yet</h3><p>Try another search or category, or favorite a tool to keep it here.</p></div>';
 document.querySelectorAll('[data-view]').forEach(b=> { b.classList.toggle('active',b.dataset.view===view); b.setAttribute('aria-current',b.dataset.view===view?'page':'false'); });
}
renderCards();
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;renderCards();});
document.querySelector('#search').oninput=e=>{query=e.target.value;renderCards();};
document.querySelector('#category').onchange=e=>{category=e.target.value;renderCards();};
document.querySelector('#theme').onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;persist('theme',theme);};
document.addEventListener('keydown', e=>{if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog').open){e.preventDefault();document.querySelector('#search').focus();}});
cards.onclick=e=>{const favorite=e.target.closest('[data-favorite]');if(favorite){const id=favorite.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];persist('favorites',favorites);renderCards();(cards.querySelector(`[data-favorite="${id}"]`) || document.querySelector('#search')).focus();return;}const open=e.target.closest('[data-open]');if(open) location.hash=`tool/${open.dataset.open}`;};
const dialog=document.querySelector('#tool-dialog');
document.querySelector('#close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{
 if(dialog.open) return;
 disposeTool?.();disposeTool=null;
 document.querySelector('#tool-content').replaceChildren();
 if(location.hash.startsWith('#tool/')) history.replaceState(null,'',location.pathname+location.search);
 (cards.querySelector(`[data-open="${openedId}"]`) || document.querySelector('#search')).focus();
});
function openTool(id) {
 const tool=tools.find(t=>t.id===id);
 if(!tool){
  if(dialog.open) dialog.close();
  const notice=document.querySelector('#app-notice');notice.hidden=false;notice.textContent='That tool was not found. Choose a tool from the collection.';
  history.replaceState(null,'',location.pathname+location.search);
  return;
 }
 disposeTool?.();disposeTool=null;
 openedId=id;
 document.querySelector('.tool-privacy').textContent=tool.persistent?'Saved on this device after you press Add or Save. No cloud sync; backups are unencrypted.':'Processed locally. Tool inputs are not saved.';
 recent=[id,...recent.filter(x=>x!==id)].slice(0,10);persist('recent',recent);renderCards();
 document.querySelector('#tool-title').textContent=tool.name;document.querySelector('#tool-category').textContent=tool.category;
 const content=document.querySelector('#tool-content');content.oninput=null;content.onchange=null;const feedback=document.querySelector('#feedback');feedback.textContent='';
 if(toolViews[id]) {
  disposeTool = toolViews[id](content, feedback) || null;
 } else if(id==='password-generator') {
  content.innerHTML='<label class="field-label" for="length">Password length (8–128)</label><input id="length" type="number" min="8" max="128" value="20"><div class="actions"><button id="generate" class="primary">Generate password</button><button id="copy">Copy password</button></div><label class="field-label" for="result">Generated password</label><textarea id="result" readonly spellcheck="false"></textarea><p>Uses browser cryptography. Passwords are never stored.</p>';
  const generate=()=>{try{document.querySelector('#result').value=generatePassword(Number(document.querySelector('#length').value));feedback.textContent='New password generated.';}catch(e){document.querySelector('#result').value='';feedback.textContent=e.message;}};
  document.querySelector('#generate').onclick=generate;document.querySelector('#length').oninput=()=>{document.querySelector('#result').value='';feedback.textContent='';};generate();
 } else {
  const text=id==='text-workbench';
  content.innerHTML=`<label class="field-label" for="input">${text?'Your text':'JSON input'}</label><textarea id="input" spellcheck="false" placeholder="${text?'Paste or type your text here…':'Paste JSON here…'}"></textarea><div class="actions">${(text?[['upper','UPPERCASE'],['lower','lowercase'],['clean','Clean spaces'],['unique','Remove duplicate lines']]:[['format','Format JSON'],['minify','Minify']]).map(([mode,label])=>`<button data-mode="${mode}">${label}</button>`).join('')}<button id="copy">Copy ${text?'text':'result'}</button></div>${text?'<p id="stats"></p>':'<p>JavaScript JSON parsing may round very large numbers and keeps only the last duplicate key.</p><label class="field-label" for="result">Formatted output</label><textarea id="result" readonly spellcheck="false"></textarea>'}`;
  const input=document.querySelector('#input');
  function updateStats(){const s=stats(input.value);document.querySelector('#stats').textContent=`${s.words} words · ${s.characters} UTF-16 characters · ${s.lines} lines`;}
  if(text){input.oninput=updateStats;updateStats();}else{input.oninput=()=>{document.querySelector('#result').value='';feedback.textContent='';};}
  content.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{try{if(text){input.value=transform(input.value,b.dataset.mode);updateStats();}else document.querySelector('#result').value=formatJSON(input.value,b.dataset.mode==='minify');feedback.textContent=text?'Text updated.':'Valid JSON. Output ready.';}catch(e){document.querySelector('#result').value='';feedback.textContent=`Invalid JSON: ${e.message}`;}});
 }
 const output=content.querySelector(id==='text-workbench'?'#input':'#result');
 const copyButton=content.querySelector('#copy');
 if(copyButton) copyButton.onclick=async()=>{
  if(!output.value){feedback.textContent='Nothing to copy yet.';return;}
  try{await navigator.clipboard.writeText(output.value);if(output.isConnected)feedback.textContent='Copied to clipboard.';}
  catch{if(output.isConnected)feedback.textContent='Clipboard unavailable. Select the text and copy manually.';}
 };
 if(!dialog.open)dialog.showModal();
}
function route(){if(location.hash.startsWith('#tool/'))openTool(location.hash.slice(6));else if(dialog.open)dialog.close();}
window.addEventListener('hashchange',route);route();
