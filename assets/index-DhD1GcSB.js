(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`github.com`;function t(e){return e===`github.com`?`https://api.github.com`:`https://${e}/api/v3`}function n(e){return{Authorization:`Bearer ${e}`,Accept:`application/vnd.github+json`,"Content-Type":`application/json`}}async function r(e,r,i,a){let o=`${t(e)}${i}`;console.log(`[github] ${a?.method??`GET`} ${o}`);let s=await fetch(o,{...a,headers:{...n(r),...a?.headers}});if(!s.ok){let e=await s.text();throw Error(`GitHub API ${s.status}: ${e}`)}return s.json()}function i(e,t){return r(e,t,`/user`)}async function a(e,t,n,i,a=`main`){return(await r(e,t,`/repos/${n}/${i}/git/trees/${a}?recursive=1`,{cache:`no-store`})).tree}function o(e){let t=[];for(let n of e){if(n.type!==`blob`||!n.path.startsWith(`text/`)||!n.path.endsWith(`/README.md`)&&n.path!==`text/README.md`)continue;let e=n.path.slice(5).replace(/\/README\.md$/,``);t.push(e===`README.md`?``:e)}return t}function s(e){let t=atob(e.replace(/\n/g,``)),n=Uint8Array.from(t,e=>e.charCodeAt(0));return new TextDecoder().decode(n)}function c(e){let t=new TextEncoder().encode(e),n=``;for(let e of t)n+=String.fromCharCode(e);return btoa(n)}async function l(e,t,n,i,a){let o=await r(e,t,`/repos/${n}/${i}/contents/${a}`);if(!o.content)throw Error(`File too large for Contents API. Only files under 1MB are supported.`);return{content:s(o.content),sha:o.sha}}async function u(e,t,n,r,i){return(await l(e,t,n,r,i)).content}async function d(e,r,i,a,o,s,l,u){let d=await fetch(`${t(e)}/repos/${i}/${a}/contents/${o}`,{method:`PUT`,headers:n(r),body:JSON.stringify({message:u,content:c(s),sha:l})});if(d.status===409)throw Error(`File was modified by someone else. Reload to get the latest version.`);if(!d.ok){let e=await d.text();throw Error(`GitHub API ${d.status}: ${e}`)}return(await d.json()).content.sha}async function f(e,r,i,a,o,s,l){let u=await fetch(`${t(e)}/repos/${i}/${a}/contents/${o}`,{method:`PUT`,headers:n(r),body:JSON.stringify({message:l,content:c(s)})});if(!u.ok){let e=await u.text();throw Error(`GitHub API ${u.status}: ${e}`)}return(await u.json()).content.sha}async function p(e,r,i,a,o,s,c){let l=await fetch(`${t(e)}/repos/${i}/${a}/contents/${o}`,{method:`DELETE`,headers:n(r),body:JSON.stringify({message:c,sha:s})});if(!l.ok){let e=await l.text();throw Error(`GitHub API ${l.status}: ${e}`)}}var m=`metabrowse:`,h=`${m}tree`;function g(e){return`${m}content:${e}`}function _(e){return`${m}etag:${e}`}function v(){let e=localStorage.getItem(h);if(!e)return null;try{return JSON.parse(e)}catch{return null}}function y(e){localStorage.setItem(h,JSON.stringify(e))}function b(e){return localStorage.getItem(g(e))}function x(e,t,n){localStorage.setItem(g(e),t),n&&localStorage.setItem(_(e),n)}function S(e){localStorage.removeItem(g(e)),localStorage.removeItem(_(e))}var C=`_app_debug_logs`,ee=1e3;function te(){try{let e=localStorage.getItem(C);return e?JSON.parse(e):[]}catch{return[]}}function ne(e){try{let t=e.slice(-ee);localStorage.setItem(C,JSON.stringify(t))}catch{}}function w(e,t){let n={timestamp:new Date().toISOString(),level:e,message:t},r=te();r.push(n),ne(r),console[e===`warn`?`warn`:e===`error`?`error`:`log`](`[${e.toUpperCase()}] ${t}`)}function T(e){w(`error`,e)}function E(e){w(`warn`,e)}function D(e){w(`info`,e)}function re(e){w(`debug`,e)}function ie(){let e=te();return e.length===0?`(no logs)`:e.map(e=>`[${new Date(e.timestamp).toLocaleTimeString()}] ${e.level.toUpperCase()}: ${e.message}`).join(`
`)}function ae(){try{localStorage.removeItem(C)}catch{}}function oe(){let e=document.createElement(`div`);e.id=`log-viewer-modal`,e.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;let t=document.createElement(`div`);t.style.cssText=`
    background: #1e1e1e;
    color: #e0e0e0;
    border: 1px solid #444;
    border-radius: 4px;
    width: 80vw;
    max-width: 800px;
    height: 70vh;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 12px;
  `;let n=document.createElement(`div`);n.style.cssText=`
    padding: 10px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,n.innerHTML=`<div>Debug Logs</div>`;let r=document.createElement(`button`);r.textContent=`×`,r.style.cssText=`
    background: none;
    border: none;
    color: #e0e0e0;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
  `,r.addEventListener(`click`,()=>e.remove()),n.appendChild(r);let i=document.createElement(`textarea`);i.readOnly=!0,i.value=ie(),i.style.cssText=`
    flex: 1;
    padding: 10px;
    background: #1e1e1e;
    color: #e0e0e0;
    border: none;
    font-family: monospace;
    font-size: 12px;
    resize: none;
    overflow: auto;
  `,i.scrollTop=i.scrollHeight;let a=document.createElement(`div`);a.style.cssText=`
    padding: 10px;
    border-top: 1px solid #444;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  `;let o=document.createElement(`button`);o.textContent=`Clear Logs`,o.style.cssText=`
    padding: 6px 12px;
    background: #d32f2f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `,o.addEventListener(`click`,()=>{ae(),i.value=`(no logs)`}),a.appendChild(o);let s=document.createElement(`button`);return s.textContent=`Refresh`,s.style.cssText=`
    padding: 6px 12px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `,s.addEventListener(`click`,()=>{i.value=ie(),i.scrollTop=i.scrollHeight}),a.appendChild(s),t.appendChild(n),t.appendChild(i),t.appendChild(a),e.appendChild(t),e.addEventListener(`click`,t=>{t.target===e&&e.remove()}),e}var se=null;function ce(e){let t=e.replace(/^#\/?/,``),n=`browse`;t.startsWith(`edit/`)?(n=`edit`,t=t.slice(5)):t===`edit`&&(n=`edit`,t=``),t=t.replace(/\/+$/,``);let r=t?`text/${t}/README.md`:`text/README.md`;return{kind:n,dirPath:t,contentPath:r}}function le(){return ce(window.location.hash)}function ue(e){se=e,window.addEventListener(`hashchange`,()=>{se?.(le())}),se(le())}var de=/<a\s+href="([^"]+)"[^>]*>.*?<\/a>/i,fe=/\[([^\]]+)\]\(([^)]+)\)\{target="([^"]+)"\}/,pe=/\[([^\]]+)\]\(([^)]+)\)/,me=/[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+|(?:mailto|tel|about):[^\s]+/;function O(e){return{text:null,target:null,rawHtml:null,indentLevel:0,comment:null,type:`link`,...e}}function he(e){if(!e.includes(`#`))return[e.trim(),null];let t=-1;for(let n=0;n<e.length;n++)if(e[n]===`#`&&(n===0||/\s/.test(e[n-1]))){t=n;break}return t===-1?[e.trim(),null]:[e.slice(0,t).trim(),e.slice(t+1).trim()||null]}function ge(e,t){let n=e.trim();n.startsWith(`- `)&&(n=n.slice(2).trim());let[r,i]=he(n);n=r;let a=de.exec(n);if(a)return O({url:a[1],rawHtml:a[0],indentLevel:t,comment:i});let o=fe.exec(n);if(o)return O({url:o[2],text:o[1],target:o[3],indentLevel:t,comment:i});let s=pe.exec(n);if(s)return O({url:s[2],text:s[1],indentLevel:t,comment:i});let c=me.exec(n);if(c){let e=c[0];return O({url:e,text:n.slice(0,c.index).trim()||null,indentLevel:t,comment:i})}return null}function _e(e){let t=e.split(`
`),n=[],r=null,i=null,a=-1;function o(){i!==null&&(r===null?n.push(i):r.items.push(i),i=null,a=-1)}function s(){r!==null&&(n.push(r),r=null)}function c(e){r===null?n.push(e):r.items.push(e)}for(let e of t){let t=e.length-e.trimStart().length,n=e.trim();if(!n)continue;if(n.startsWith(`## `)){o(),s();let[e,t]=he(n.slice(3).trim());r={name:e,items:[],indentLevel:0,comment:t,type:`section`};continue}let l=ge(e,t);if(l)i&&t>a?i.links.push(l):(o(),c(l));else if(n.startsWith(`- `)){o();let[e,r]=he(n.slice(2).trim());i={name:e,links:[],indentLevel:t,comment:r,type:`group`},a=t}}return o(),s(),{items:n}}var ve=[`mailto:`,`tel:`,`about:`];function ye(e){return e.includes(`://`)||ve.some(t=>e.startsWith(t))}function be(e){let t=5381;for(let n=0;n<e.length;n++)t=(t<<5)+t+e.charCodeAt(n)>>>0;return t.toString(16).padStart(8,`0`)}function xe(e){let t=[],n=[];function r(){n.length>0&&(t.push({links:[...n],type:`link_group`}),n=[])}for(let i of e)i.type===`link`?n.push(i):(r(),t.push(i));return r(),t}function Se(e){let t=ye(e.url),n;n=e.target?e.target:t?be(e.url):`_self`;let r=e.text??e.url,i=null;return t&&(e.url.startsWith(`http://`)||e.url.startsWith(`https://`))&&(i=n),{url:e.url,text:r,target:n,rawHtml:e.rawHtml,comment:e.comment,urlHash:i,type:`link`}}function Ce(e){let t=e.links.map(Se);return{name:e.name,links:t,comment:e.comment,type:`group`}}function we(e){let t=[];for(let n of e)if(n.type===`section`){let e=we(n.items);t.push({name:n.name,items:e,comment:n.comment,type:`section`})}else n.type===`group`?t.push(Ce(n)):t.push(Se(n));return xe(t)}function Te(e,t){return{title:t,items:we(e.items)}}function k(e){return e.replace(/[-_]/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}function Ee(e,t){return t.filter(t=>e?t.startsWith(e+`/`)&&!t.slice(e.length+1).includes(`/`):t!==``&&!t.includes(`/`)).sort()}function De(e){if(!e)return[];let t=e.split(`/`),n=[];for(let e=0;e<t.length-1;e++){let r=t.slice(0,e+1).join(`/`);n.push({name:k(t[e]),hash:`#/${r}`})}return n}function A(e,t,...n){let r=document.createElement(e);if(t)for(let[e,n]of Object.entries(t))r.setAttribute(e,n);for(let e of n)typeof e==`string`?r.appendChild(document.createTextNode(e)):r.appendChild(e);return r}function Oe(e){e.addEventListener(`click`,e=>{let t=e.target.closest(`.copy-btn`);if(!t)return;let n=t.getAttribute(`data-url`);if(!n)return;let r=document.createElement(`a`);r.href=n,navigator.clipboard.writeText(r.href).then(()=>{t.textContent=`✅`,setTimeout(()=>{t.textContent=`📋`},1500)})})}function ke(e){let t=A(`li`);if(e.rawHtml){let n=document.createElement(`span`);n.innerHTML=e.rawHtml,t.appendChild(n)}else e.urlHash&&t.appendChild(A(`img`,{src:``,alt:``,class:`link-favicon`,"data-link-url":e.url,"data-url-hash":e.urlHash})),t.appendChild(A(`a`,{href:e.url,target:e.target},e.text));return t.appendChild(A(`button`,{class:`copy-btn`,"data-url":e.url,title:`Copy URL`},`📋`)),e.comment&&t.appendChild(A(`span`,{class:`link-comment`},`ℹ `+e.comment)),t}function Ae(e){let t=A(`div`,{class:`subgroup`}),n=A(`div`,{class:`subgroup-header`},e.name);e.comment&&n.appendChild(A(`span`,{class:`group-comment`},`ℹ `+e.comment)),t.appendChild(n);let r=A(`ul`,{class:`group-links`});for(let t of e.links)r.appendChild(ke(t));return t.appendChild(r),t}function je(e){let t=A(`ul`,{class:`links`});for(let n of e.links)t.appendChild(ke(n));return t}function Me(e){let t=document.createElement(`details`);t.className=`section`,t.open=!0;let n=A(`summary`,{},e.name);e.comment&&n.appendChild(A(`span`,{class:`section-comment`},`ℹ `+e.comment)),t.appendChild(n);let r=A(`div`,{class:`section-content`});for(let t of e.items)r.appendChild(Ne(t));return t.appendChild(r),t}function Ne(e){switch(e.type){case`group`:return Ae(e);case`link_group`:return je(e);case`section`:return Me(e)}}function Pe(e,t){let n=Ee(e,t);if(n.length===0)return null;let r=A(`div`,{class:`children-nav`});for(let e of n){let t=k(e.split(`/`).pop()),n=`#/${e}`,i=A(`span`,{class:`child-link-wrap`});i.appendChild(A(`a`,{href:n,class:`child-link`,target:`_self`},t)),i.appendChild(A(`button`,{class:`copy-btn child-copy-btn`,"data-url":n,title:`Copy URL`},`📋`)),r.appendChild(i)}return r}function Fe(e){let t=A(`h1`,{class:`breadcrumbs`});if(t.appendChild(A(`a`,{href:`#/`,class:`breadcrumb-link`,target:`_self`},`Metabrowse`)),e){let n=De(e);for(let e of n)t.appendChild(A(`span`,{class:`breadcrumb-separator`},`/`)),t.appendChild(A(`a`,{href:e.hash,class:`breadcrumb-link`,target:`_self`},e.name));let r=k(e.split(`/`).pop());t.appendChild(A(`span`,{class:`breadcrumb-separator`},`/`)),t.appendChild(A(`span`,{class:`breadcrumb-current`},r))}else t.innerHTML=``,t.appendChild(A(`span`,{class:`breadcrumb-current`},`Metabrowse`));return t}function Ie(e,t,n,r){e.innerHTML=``;let i=A(`div`,{class:`container`}),a=A(`div`,{class:`fixed-header`}),o=A(`div`,{class:`header-bar`});o.appendChild(Fe(n.dirPath));let s=A(`div`,{class:`header-actions`}),c=n.dirPath?`#/edit/${n.dirPath}`:`#/edit/`,l=A(`a`,{href:c,class:`edit-link`},`Edit`);l.addEventListener(`click`,e=>{e.preventDefault(),window.open(c,`_blank`)}),s.appendChild(l);let u=A(`button`,{class:`tree-btn`,title:`Manage tree (t)`},`Tree`);u.addEventListener(`click`,()=>{r.onTreePanel?.()}),s.appendChild(u);let d=A(`button`,{class:`logs-btn`,title:`View debug logs`},`Logs`);d.addEventListener(`click`,()=>{document.body.appendChild(oe())}),s.appendChild(d),o.appendChild(s),a.appendChild(o);let f=A(`div`,{class:`search-bar`,role:`search`});f.appendChild(A(`span`,{class:`search-icon`},`🔍`)),f.appendChild(A(`input`,{type:`text`,id:`unified-search`,class:`search-input`,placeholder:`/ (this page) | ^K (global)`,"aria-label":`Search`}));let p=A(`button`,{type:`button`,id:`clear-search-btn`,class:`clear-search-btn`,title:`Clear search`,style:`display:none`},`×`);f.appendChild(p);let m=A(`label`,{class:`search-mode-toggle`}),h=A(`input`,{type:`checkbox`,id:`global-mode-checkbox`});h.checked=!0,m.appendChild(h),m.appendChild(A(`span`,{},`Global`)),f.appendChild(m),a.appendChild(f),i.appendChild(a);let g=A(`div`,{class:`scrollable-content`}),_=A(`div`,{id:`search-results-panel`,class:`search-results-panel`,style:`display:none`});_.appendChild(A(`div`,{id:`search-results-content`,class:`search-results`})),g.appendChild(_);let v=Pe(n.dirPath,r.contentPaths);v&&g.appendChild(v);for(let e of t.items)g.appendChild(Ne(e));i.appendChild(g),e.appendChild(i);let y=document.createElement(`footer`);y.className=`shortcut-help`,y.innerHTML=[`<kbd>t</kbd> Tree`,`<kbd>e</kbd> Edit`,`<kbd>/</kbd> Search page`,`<kbd>Ctrl+K</kbd> Search all`,`<kbd>c</kbd> Collapse/restore`,`<kbd>r</kbd> Reload`].join(`<span class="shortcut-sep">|</span>`),e.appendChild(y),Oe(e)}var j=`metabrowse-fav-`,Le=1440*60*1e3,Re=[`/favicon.ico`,`/favicon.png`,`/favicon.svg`];function ze(e){try{let t=localStorage.getItem(j+e);if(!t)return null;let n=JSON.parse(t);return n.failed?Date.now()-n.ts>Le?(localStorage.removeItem(j+e),null):`FAILED`:n.path??null}catch{return null}}function Be(e,t){try{localStorage.setItem(j+e,JSON.stringify({path:t,ts:Date.now()}))}catch{}}function Ve(e){try{localStorage.setItem(j+e,JSON.stringify({failed:!0,ts:Date.now()}))}catch{}}function He(e,t){let n=`https://icons.duckduckgo.com/ip3/`+t+`.ico`;e.onerror=()=>{e.style.display=`none`,Ve(t)},e.onload=()=>{Be(t,`ddg`)},e.src=n}function Ue(e,t,n,r){if(r>=Re.length){He(e,n);return}let i=Re[r];e.onerror=()=>{Ue(e,t,n,r+1)},e.onload=()=>{Be(n,i)},e.src=t+i}function We(e){let t=e.querySelectorAll(`.link-favicon[data-url-hash]`);for(let e of t){let t=e.getAttribute(`data-link-url`);if(!t)continue;let n,r;try{let e=new URL(t);n=e.origin,r=e.hostname}catch{e.style.display=`none`;continue}let i=ze(r);if(i===`FAILED`){e.style.display=`none`;continue}if(i){e.onerror=()=>{e.style.display=`none`},e.src=i===`ddg`?`https://icons.duckduckgo.com/ip3/`+r+`.ico`:n+i;continue}Ue(e,n,r,0)}}function M(e){return e.replace(/[-_]/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}function Ge(e){return e?`Metabrowse / `+e.split(`/`).map(M).join(` / `):`Metabrowse`}function Ke(e,t){let n=[];for(let r of e)if(r.type===`section`)n.push(...Ke(r.items,``));else if(r.type===`group`)for(let e of r.links)n.push({text:e.text,url:e.url,group:r.name,comment:e.comment??``});else if(r.type===`link_group`)for(let e of r.links)n.push({text:e.text,url:e.url,group:t,comment:e.comment??``});return n}function N(e,t){let n=[];for(let r of e)r.type===t&&n.push(r.name),r.type===`section`&&n.push(...N(r.items,t));return n}function qe(e,t){return t.filter(t=>e?t.startsWith(e+`/`)&&!t.slice(e.length+1).includes(`/`):t!==``&&!t.includes(`/`))}function Je(e,t,n){let r=_e(t),i=e?M(e.split(`/`).pop()):`Home`,a=Te(r,i);return{path:e?`#/${e}`:`#/`,title:i,breadcrumbs:Ge(e),links:Ke(a.items,``),groups:N(a.items,`group`),sections:N(a.items,`section`),children:qe(e,n).map(e=>M(e.split(`/`).pop()))}}var Ye=`metabrowse-search-mode`,Xe=`metabrowse-search-term`,P=null;function F(e){return(e.textContent??``).toLowerCase()}function Ze(e,t){let n=!1;for(let r of e.querySelectorAll(`:scope > li`)){let e=F(r).includes(t);e||r.querySelector(`a`)?.href?.toLowerCase().includes(t)&&(e=!0),r.style.display=e?``:`none`,e&&(n=!0)}return n}function Qe(e,t){let n=e.querySelector(`.subgroup-header`),r=n?F(n).includes(t):!1,i=e.querySelector(`.group-links`),a=!1;if(i)for(let e of i.querySelectorAll(`:scope > li`)){let n=F(e).includes(t);n||e.querySelector(`a`)?.href?.toLowerCase().includes(t)&&(n=!0),e.style.display=n||r?``:`none`,n&&(a=!0)}let o=r||a;return e.style.display=o?``:`none`,o}function I(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function $e(e,t){if(!t)return I(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n<0?I(e):I(e.substring(0,n))+`<mark>`+I(e.substring(n,n+t.length))+`</mark>`+I(e.substring(n+t.length))}function et(e,t){P&&P();let n=document.getElementById(`unified-search`),r=document.getElementById(`global-mode-checkbox`),i=document.getElementById(`clear-search-btn`),a=document.getElementById(`search-results-panel`),o=document.getElementById(`search-results-content`);if(!n||!r)return;let s=e.querySelectorAll(`.children-nav .child-link-wrap`),c=e.querySelectorAll(`.section`),l=e.querySelectorAll(`.scrollable-content > .subgroup`),u=e.querySelectorAll(`.scrollable-content > .links`),d=Array.from(c,e=>e.open);function f(){i&&(i.style.display=n.value?``:`none`)}function p(){try{localStorage.setItem(Ye,r.checked?`global`:`local`),localStorage.setItem(Xe,n.value)}catch{}}function m(){s.forEach(e=>{e.style.display=``}),c.forEach((e,t)=>{e.style.display=``,e.open=d[t],e.querySelectorAll(`.subgroup`).forEach(e=>{e.style.display=``,e.querySelectorAll(`.group-links > li`).forEach(e=>{e.style.display=``})}),e.querySelectorAll(`.links`).forEach(e=>{e.style.display=``,e.querySelectorAll(`:scope > li`).forEach(e=>{e.style.display=``})})}),l.forEach(e=>{e.style.display=``,e.querySelectorAll(`.group-links > li`).forEach(e=>{e.style.display=``})}),u.forEach(e=>{e.style.display=``,e.querySelectorAll(`:scope > li`).forEach(e=>{e.style.display=``})})}function h(){s.forEach(e=>{e.style.display=`none`}),c.forEach(e=>{e.style.display=`none`}),l.forEach(e=>{e.style.display=`none`}),u.forEach(e=>{e.style.display=`none`})}function g(e){if(a&&(a.style.display=`none`),!e){m();return}let t=e.toLowerCase();s.forEach(e=>{e.style.display=F(e).includes(t)?``:`none`}),c.forEach(e=>{let n=e.querySelector(`summary`),r=n?F(n).includes(t):!1,i=!1;e.querySelectorAll(`.section-content > .subgroup`).forEach(e=>{Qe(e,t)&&(i=!0)}),e.querySelectorAll(`.section-content > .links`).forEach(e=>{let n=Ze(e,t);e.style.display=n?``:`none`,n&&(i=!0)}),r||i?(e.style.display=``,e.open=!0):e.style.display=`none`}),l.forEach(e=>{Qe(e,t)}),u.forEach(e=>{let n=Ze(e,t);e.style.display=n?``:`none`})}function _(e){if(!e){a&&(a.style.display=`none`),m();return}a&&(a.style.display=``),h();let n=e.toLowerCase(),r=[],i=t();for(let e of i){e.breadcrumbs.toLowerCase().includes(n)&&r.push({page:e,type:`page`,text:e.breadcrumbs});for(let t of e.children)t.toLowerCase().includes(n)&&r.push({page:e,type:`child`,text:t});for(let t of e.sections)t.toLowerCase().includes(n)&&r.push({page:e,type:`section`,text:t});for(let t of e.groups)t.toLowerCase().includes(n)&&r.push({page:e,type:`group`,text:t});for(let t of e.links){let i=!1,a=t.text;t.text.toLowerCase().includes(n)?i=!0:t.url.toLowerCase().includes(n)?(i=!0,a=t.text+` — `+t.url):t.comment&&t.comment.toLowerCase().includes(n)&&(i=!0,a=t.text+` — `+t.comment),i&&r.push({page:e,type:`link`,text:a,link:t})}if(r.length>=50)break}if(!o)return;if(r.length===0){o.innerHTML=`<div class="search-no-results">No results found</div>`;return}let s=new Map,c=[];for(let e of r){let t=e.page.path;s.has(t)||(s.set(t,{page:e.page,items:[]}),c.push(t)),s.get(t).items.push(e)}let l=``;for(let t of c){let n=s.get(t);l+=`<div class="search-result-page">`,l+=`<a href="${I(n.page.path)}" class="search-result-page-link" target="_self">${$e(n.page.breadcrumbs,e)}</a>`;for(let t of n.items){let r=t.type===`link`?`→`:t.type===`section`?`§`:t.type===`group`?`▸`:t.type===`child`?`◆`:`📄`,i=t.type===`link`&&t.link?t.link.url:n.page.path,a=t.type===`link`&&t.link?`_blank`:`_self`;l+=`<div class="search-result-item">`,l+=`<span class="search-result-type">${r}</span> `,l+=`<a href="${I(i)}" class="search-result-link" target="${a}">${$e(t.text,e)}</a>`,l+=`</div>`}l+=`</div>`}o.innerHTML=l}function v(){let e=n.value.trim();f(),r.checked?_(e):g(e)}let y,b=()=>{clearTimeout(y),y=setTimeout(()=>{p(),v()},150)},x=()=>{p(),v()},S=()=>{n.value=``,p(),f(),v(),n.focus()};n.addEventListener(`input`,b),r.addEventListener(`change`,x),i&&i.addEventListener(`click`,S);try{let e=localStorage.getItem(Ye),t=localStorage.getItem(Xe);e===`local`&&(r.checked=!1),t&&(n.value=t)}catch{}f(),v(),P=()=>{n.removeEventListener(`input`,b),r.removeEventListener(`change`,x),i&&i.removeEventListener(`click`,S),clearTimeout(y)}}var L=null;function R(){let e=document.activeElement?.tagName;return e===`INPUT`||e===`TEXTAREA`||e===`SELECT`}function tt(e,t){L&&L();let n=e.querySelectorAll(`.section`),r=[],i=!1;function a(a){if(a.key===`t`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(R())return;a.preventDefault(),t?.onTreePanel?.()}if(a.key===`/`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(R())return;a.preventDefault();let e=document.getElementById(`global-mode-checkbox`),t=document.getElementById(`unified-search`);e&&(e.checked=!1),e&&e.dispatchEvent(new Event(`change`)),t&&(t.focus(),t.select())}if((a.ctrlKey||a.metaKey)&&a.key===`k`){a.preventDefault();let e=document.getElementById(`global-mode-checkbox`),t=document.getElementById(`unified-search`);e&&(e.checked=!e.checked,e.dispatchEvent(new Event(`change`))),t&&(t.focus(),t.select())}if(a.key===`e`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(R())return;let t=e.querySelector(`.edit-link`);t&&(a.preventDefault(),t.click())}if(a.key===`r`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(R())return;a.preventDefault(),location.reload()}if(a.key===`c`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(R()||n.length===0)return;a.preventDefault(),i?(n.forEach((e,t)=>{e.open=t<r.length?r[t]:!0}),i=!1):(r=Array.from(n,e=>e.open),n.forEach(e=>{e.open=!1}),i=!0)}}document.addEventListener(`keydown`,a),L=()=>{document.removeEventListener(`keydown`,a)}}var nt=`modulepreload`,rt=function(e){return`/metabrowse/`+e},it={},at=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=rt(t,n),t in it)return;it[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:nt,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},ot=`https://stabledog.github.io/veditor.web/`,z=null,st=!1;async function ct(){if(z)return z;if(!st){let e=document.createElement(`link`);e.rel=`stylesheet`,e.href=`${ot}/veditor.css`,document.head.appendChild(e),st=!0}z=await at(()=>import(`${ot}/veditor.js`),[]);let e=document.getElementById(`version-badge`);return e&&z.VERSION&&!e.textContent?.includes(`ve`)&&(e.textContent+=` \u00b7 ve${z.VERSION}`),z}function B(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}async function lt(e,t,n,r,i,a){let o=a?`text/${a}/README.md`:`text/README.md`;e.innerHTML=`<div class="editor-loading">Loading editor...</div>`;let s,c,u;try{let[e,a]=await Promise.all([ct(),l(t,n,r,i,o)]);s=e,c=a.content,u=a.sha}catch(t){e.innerHTML=`
      <div class="editor-loading" style="flex-direction:column;gap:1rem;">
        <div style="color:#f38ba8;">Failed to load editor</div>
        <div style="font-size:0.85rem;">${B(t instanceof Error?t.message:String(t))}</div>
      </div>
    `;return}let f=c,p=u;e.innerHTML=`
    <div class="editor-screen">
      <header>
        <a class="filename" href="https://${B(t)}/${B(r)}/${B(i)}/blob/main/${B(o)}" target="_blank" rel="noopener noreferrer">${B(o)}</a>
        <span id="status-msg"></span>
      </header>
      <div id="editor-container"></div>
    </div>
  `;function m(e,t=!1){let n=document.getElementById(`status-msg`);n&&(n.textContent=e,n.className=t?`error`:`success`,t||setTimeout(()=>{n.textContent===e&&(n.textContent=``)},2e3))}async function h(){let e=s.getEditorContent();if(e===f){m(`No changes`);return}let a=`Update ${o.split(`/`).pop()??o} via metabrowse editor`;try{m(`Saving...`);let s=await d(t,n,r,i,o,e,p,a);f=e,p=s,m(`Saved`);try{window.opener?.location.reload()}catch{}}catch(e){m(`Save failed: ${e instanceof Error?e.message:e}`,!0)}}function g(){window.close(),setTimeout(()=>{m(`You can close this tab.`)},100)}s.createEditor(document.getElementById(`editor-container`),f,{onSave:h,onQuit:g},{storagePrefix:`metabrowse`})}function ut(e){return!e||!e.trim()?`Name cannot be empty`:e.includes(`/`)||e.includes(`\\`)?`Name cannot contain / or \\`:null}function dt(e,t){if(!e)return[];let n=e+`/`;return t.filter(e=>e.startsWith(n))}function ft(e){return e.replace(/[-_]/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}async function pt(e,t,n,r,i,a,o){let s=ut(a);if(s)throw Error(`Invalid name: ${s}`);let c=i?`${i}/${a}`:a;if(o.includes(c))throw Error(`Node '${a}' already exists at this level`);let l=`text/${c}/README.md`,u=`# ${ft(a)}\n\n`;try{return await f(e,t,n,r,l,u,`Create node ${c}`),D(`TreeOps: Created node ${c}`),c}catch(e){throw T(`TreeOps: Failed to create ${c}: ${e instanceof Error?e.message:String(e)}`),e}}async function mt(e,t,n,r,i,a){if(i===``)throw Error(`Cannot delete root node`);let o=dt(i,a),s=[i,...o];if(o.length>0)return{needsConfirm:!0,paths:s};try{let a=`text/${i}/README.md`,{sha:o}=await l(e,t,n,r,a);return await p(e,t,n,r,a,o,`Delete node ${i}`),S(a),D(`TreeOps: Deleted node ${i}`),{needsConfirm:!1}}catch(e){throw T(`TreeOps: Failed to delete ${i}: ${e instanceof Error?e.message:String(e)}`),e}}async function ht(e,t,n,r,i){try{for(let a of i){let i=`text/${a}/README.md`,{sha:o}=await l(e,t,n,r,i);await p(e,t,n,r,i,o,`Delete node ${a}`),S(i)}D(`TreeOps: Deleted ${i.length} node(s)`)}catch(e){throw T(`TreeOps: Failed during cascade delete: ${e instanceof Error?e.message:String(e)}`),e}}async function gt(e,t,n,r,i,a,o){let s=ut(a);if(s)throw Error(`Invalid name: ${s}`);let c=[i,...dt(i,o)],u=i.includes(`/`)?i.slice(0,i.lastIndexOf(`/`)):``,d=u?`${u}/${a}`:a;if(d!==i&&o.includes(d))throw Error(`Node '${a}' already exists at this level`);try{for(let a of c){let o=`text/${a}/README.md`,s=`text/${a.replace(RegExp(`^${i}`),d)}/README.md`,{content:c,sha:u}=await l(e,t,n,r,o);await f(e,t,n,r,s,c,`Rename node ${i} → ${d}`),await p(e,t,n,r,o,u,`Delete old ${i} (renamed)`),S(o),S(s)}return D(`TreeOps: Renamed node ${i} → ${d}`),d}catch(e){throw T(`TreeOps: Failed to rename ${i}: ${e instanceof Error?e.message:String(e)}`),e}}function V(e){let t=new Set,n=e=>{for(let r of e)r.expanded&&t.add(r.dirPath),n(r.children)};return n(e),t}function H(e,t){let n=[],r={},i=e.filter(e=>e!==``).sort();for(let e of i){let i=e.split(`/`),a=i[i.length-1],o=i.slice(0,-1).join(`/`),s={name:a,dirPath:e,depth:i.length-1,children:[],expanded:t?t.has(e):!1};r[e]=s,o===``?n.push(s):r[o]&&r[o].children.push(s)}let a=e=>{e.sort((e,t)=>e.name.localeCompare(t.name));for(let t of e)a(t.children)};return a(n),n}function U(e){let t=[],n=e=>{for(let r of e)t.push(r),r.expanded&&r.children.length>0&&n(r.children)};return n(e),t}async function _t(e,t){D(`TreePanel: showTreePanel called, contentPaths=${e.contentPaths.length}`);let n=document.createElement(`div`);n.className=`tree-panel-overlay`,n.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;let r=document.createElement(`div`);r.className=`tree-panel`,r.style.cssText=`
    background: #1e1e1e;
    color: #e0e0e0;
    border: 1px solid #444;
    border-radius: 4px;
    width: 400px;
    height: 70vh;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 13px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  `;let i=document.createElement(`div`);i.style.cssText=`
    padding: 10px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  `,i.innerHTML=`<div>Tree Manager</div>`;let a=document.createElement(`button`);a.textContent=`×`,a.style.cssText=`
    background: none;
    border: none;
    color: #e0e0e0;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
  `,a.addEventListener(`click`,()=>n.remove()),i.appendChild(a),r.appendChild(i);let o=document.createElement(`div`);o.style.cssText=`
    padding: 8px 10px;
    border-bottom: 1px solid #444;
    font-size: 11px;
    color: #888;
    line-height: 1.4;
  `,o.innerHTML=`
    <div>↑↓ Nav | → Expand | ← Collapse | Enter Go</div>
    <div>Ins New | Del Delete | F2 Rename | Esc Close</div>
  `,r.appendChild(o);let s=document.createElement(`div`);s.className=`tree-list`,s.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    border-bottom: 1px solid #444;
  `,r.appendChild(s);let c=document.createElement(`div`);c.className=`tree-status`,c.style.cssText=`
    padding: 8px 10px;
    border-bottom: 1px solid #444;
    min-height: 20px;
    font-size: 11px;
    color: #888;
  `,c.textContent=``,r.appendChild(c);let l=document.createElement(`div`);l.className=`tree-footer`,l.style.cssText=`
    padding: 8px 10px;
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  `;let u=document.createElement(`button`);u.textContent=`Close`,u.style.cssText=`
    padding: 4px 8px;
    background: #333;
    color: #e0e0e0;
    border: 1px solid #555;
    border-radius: 2px;
    cursor: pointer;
    font-size: 12px;
  `,u.addEventListener(`click`,()=>n.remove()),l.appendChild(u),r.appendChild(l),n.appendChild(r);let d=H(e.contentPaths),f=0,p=null,m=null,h=null,g=null;function _(){s.innerHTML=``;let n=U(d);for(let r=0;r<n.length;r++){let i=n[r],a=document.createElement(`div`);a.className=`tree-node${r===f?` tree-node-selected`:``}`,a.setAttribute(`data-path`,i.dirPath),a.style.cssText=`
        padding: 4px 8px;
        margin-left: ${i.depth*16}px;
        cursor: pointer;
        border-left: 2px solid transparent;
        display: flex;
        align-items: center;
        gap: 4px;
        ${r===f?`background: #333; border-left-color: #0ea5e9;`:`border-left-color: transparent;`}
      `;let o=document.createElement(`span`);o.className=`tree-expand-icon`,o.textContent=i.children.length===0?`·`:i.expanded?`▼`:`▶`,o.style.cssText=`width: 12px; text-align: center; color: #888; flex-shrink: 0;`,a.appendChild(o);let l=document.createElement(`span`);if(l.className=`tree-node-name`,l.textContent=i.name,l.style.cssText=`flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`,a.appendChild(l),p&&m===i){l.style.display=`none`;let n=document.createElement(`input`);n.type=`text`,n.value=p===`rename`?i.name:``,n.placeholder=p===`new`?`Name`:`Rename`,n.style.cssText=`
          flex: 1;
          background: #2a2a2a;
          color: #e0e0e0;
          border: 1px solid #0ea5e9;
          border-radius: 2px;
          padding: 2px 4px;
          font-family: monospace;
          font-size: 13px;
        `;let r=async n=>{if(!n.trim()){p=null,m=null,_();return}try{let r=p===`new`,a=i.dirPath;c.textContent=r?`Creating...`:`Renaming...`,c.style.color=`#888`,r?await pt(e.host,e.token,e.owner,e.repo,i.dirPath,n.trim(),e.contentPaths):await gt(e.host,e.token,e.owner,e.repo,i.dirPath,n.trim(),e.contentPaths),p=null,m=null;let o=await t();e.contentPaths=o;let s=V(d);r&&s.add(a),d=H(o,s),f=Math.min(f,U(d).length-1),c.textContent=``,_()}catch(e){c.textContent=e instanceof Error?e.message:String(e),c.style.color=`#f87171`}};n.addEventListener(`keydown`,e=>{e.stopPropagation(),e.key===`Enter`?r(n.value):e.key===`Escape`&&(p=null,m=null,_())}),a.appendChild(n),g=n}a.addEventListener(`click`,()=>{f=n.indexOf(i),_()}),s.appendChild(a)}g&&=(g.focus(),g.select(),null)}function v(e){let t=U(d),r=t[f];if(p){e.key===`Escape`&&(e.preventDefault(),p=null,m=null,_());return}if(e.key===`ArrowUp`)e.preventDefault(),f=Math.max(0,f-1),_();else if(e.key===`ArrowDown`)e.preventDefault(),f=Math.min(t.length-1,f+1),_();else if(e.key===`ArrowRight`)e.preventDefault(),r&&r.children.length>0&&(r.expanded=!0,_());else if(e.key===`ArrowLeft`){if(e.preventDefault(),r){if(r.expanded)r.expanded=!1,_();else if(r.depth>0){let e=r.dirPath.slice(0,r.dirPath.lastIndexOf(`/`)),n=t.find(t=>t.dirPath===e);n&&(f=t.indexOf(n),_())}}}else e.key===`Enter`?(e.preventDefault(),r&&(location.hash=`#/${r.dirPath}`,n.remove())):e.key===`Insert`?(e.preventDefault(),r&&!h&&(p=`new`,m=r,_())):e.key===`Delete`?(e.preventDefault(),r&&r.dirPath!==``&&!p&&y(r)):e.key===`F2`?(e.preventDefault(),r&&!h&&!p&&(p=`rename`,m=r,_())):e.key===`Escape`?(e.preventDefault(),p?(p=null,m=null,_()):h?(h=null,b()):n.remove()):e.key===`Home`?(e.preventDefault(),f=0,_()):e.key===`End`&&(e.preventDefault(),f=t.length-1,_())}async function y(n){try{c.textContent=`Checking...`,c.style.color=`#888`;let r=await mt(e.host,e.token,e.owner,e.repo,n.dirPath,e.contentPaths);if(r.needsConfirm)h={paths:r.paths},b();else{let r=await t();e.contentPaths=r,d=H(r,V(d)),f=Math.min(f,U(d).length-1),c.textContent=``,_(),D(`TreePanel: Deleted ${n.dirPath}`)}}catch(e){c.textContent=e instanceof Error?e.message:String(e),c.style.color=`#f87171`}}function b(){if(!h){l.innerHTML=``;let e=document.createElement(`button`);e.textContent=`Close`,e.style.cssText=`
        padding: 4px 8px;
        background: #333;
        color: #e0e0e0;
        border: 1px solid #555;
        border-radius: 2px;
        cursor: pointer;
        font-size: 12px;
      `,e.addEventListener(`click`,()=>n.remove()),l.appendChild(e);return}l.innerHTML=``,c.textContent=`Delete ${h.paths.length} node(s)?`,c.style.color=`#fbbf24`;let r=document.createElement(`button`);r.textContent=`Cancel`,r.style.cssText=`
      padding: 4px 8px;
      background: #333;
      color: #e0e0e0;
      border: 1px solid #555;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    `,r.addEventListener(`click`,()=>{h=null,b(),_()}),l.appendChild(r);let i=document.createElement(`button`);i.textContent=`Confirm Delete ${h.paths.length}`,i.style.cssText=`
      padding: 4px 8px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    `,i.addEventListener(`click`,async()=>{try{c.textContent=`Deleting...`,c.style.color=`#888`,await ht(e.host,e.token,e.owner,e.repo,h.paths);let n=await t();e.contentPaths=n,d=H(n,V(d)),f=Math.min(f,U(d).length-1),h=null,c.textContent=``,b(),_()}catch(e){c.textContent=e instanceof Error?e.message:String(e),c.style.color=`#f87171`}}),l.appendChild(i)}n.addEventListener(`click`,e=>{e.target===n&&n.remove()});let x=e=>{n.parentElement&&v(e)};document.addEventListener(`keydown`,x);let S=n.remove.bind(n);n.remove=function(){document.removeEventListener(`keydown`,x),S()},_(),b(),document.body.appendChild(n)}function vt(e){let t=document.querySelector(`.import-toast`);t&&t.remove();let n=document.createElement(`div`);n.className=`import-toast`,n.textContent=e,document.body.appendChild(n),n.offsetWidth,n.classList.add(`visible`),setTimeout(()=>{n.classList.remove(`visible`),n.addEventListener(`transitionend`,()=>n.remove())},3e3)}function yt(e){return new Promise(t=>{let n=e;try{n=new URL(e).hostname.replace(/^www\./,``)}catch{}let r=document.createElement(`div`);r.className=`drop-modal-overlay`;let i=document.createElement(`div`);i.className=`drop-modal`,i.innerHTML=`
      <div class="drop-modal-header">Add Link</div>
      <form class="drop-modal-form">
        <label>Title
          <input type="text" id="drop-title" value="${Dt(n)}" />
        </label>
        <label>URL
          <input type="text" id="drop-url" value="${Dt(e)}" />
        </label>
        <label>Comment
          <input type="text" id="drop-comment" placeholder="Optional" />
        </label>
        <div class="drop-modal-buttons">
          <button type="submit" class="drop-modal-ok">OK</button>
          <button type="button" class="drop-modal-cancel">Cancel</button>
        </div>
      </form>
    `,r.appendChild(i),document.body.appendChild(r);let a=i.querySelector(`#drop-title`),o=i.querySelector(`#drop-url`),s=i.querySelector(`#drop-comment`),c=i.querySelector(`form`),l=i.querySelector(`.drop-modal-cancel`);a.focus(),a.select();function u(e){r.remove(),t(e)}c.addEventListener(`submit`,e=>{e.preventDefault();let t=a.value.trim(),n=o.value.trim();n&&u({title:t||n,url:n,comment:s.value.trim()})}),l.addEventListener(`click`,()=>u(null)),r.addEventListener(`click`,e=>{e.target===r&&u(null)}),r.addEventListener(`keydown`,e=>{e.key===`Escape`&&u(null)})})}function bt(e,t,n){let r=`- ${e} ${t}`;return n?`${r} # ${n}`:r}function xt(e){let t=[],n=new Set,r=/<a\s[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi,i;for(;(i=r.exec(e))!==null;){let e=i[1];n.has(e)||(n.add(e),t.push({text:Et(i[2].trim(),50)||e,url:e}))}let a=/https?:\/\/[^\s<>"')\]]+/g;for(;(i=a.exec(e))!==null;){let e=i[0].replace(/[.,;:!?)]+$/,``);n.has(e)||(n.add(e),t.push({text:e,url:e}))}return t}function St(e,t){let n=e.split(`
`),r=t.map(e=>`  ${e}`);for(let e=0;e<n.length;e++)if(n[e].trimEnd()===`- Imported:`){let t=e+1;for(;t<n.length&&/^\s+\S/.test(n[t]);)t++;let i=n.slice(0,t),a=n.slice(t);return[...i,...r,...a].join(`
`)}let i=0;for(let e=0;e<n.length;e++)if(n[e].startsWith(`# `)){i=e+1;break}let a=n.slice(0,i),o=n.slice(i);return[...a,``,`- Imported:`,...r,...o].join(`
`)}async function Ct(e,t,n){let r=t.route.contentPath;try{D(`${n}: Saving ${e.length} link(s) to ${r}`);let{content:i,sha:a}=await l(t.host,t.token,t.owner,t.repo,r),o=St(i,e);await d(t.host,t.token,t.owner,t.repo,r,o,a,`Add ${e.length} link(s) via ${n.toLowerCase()}`),S(r),D(`${n}: Saved successfully`);let s=e.length,c=r.replace(/^text\//,``).replace(/\/README\.md$/,``)||`root`;vt(`${s} link${s===1?``:`s`} imported into ${c}`),t.onSaved()}catch(e){let t=e instanceof Error?e.message:String(e);T(`${n}: Failed to save: ${t}`),alert(`Failed to save link(s): ${t}`)}}function wt(){let e=document.activeElement?.tagName;return e===`INPUT`||e===`TEXTAREA`||e===`SELECT`}function Tt(e,t){let n=e.querySelector(`.scrollable-content`);if(!n||t.route.kind!==`browse`)return;let r=0;n.addEventListener(`dragenter`,e=>{e.preventDefault(),r++,n.classList.add(`drop-target`)}),n.addEventListener(`dragover`,e=>{e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect=`copy`)}),n.addEventListener(`dragleave`,()=>{r--,r<=0&&(r=0,n.classList.remove(`drop-target`))}),n.addEventListener(`drop`,async e=>{if(e.preventDefault(),r=0,n.classList.remove(`drop-target`),!e.dataTransfer)return;let i=e.dataTransfer.getData(`text/uri-list`);if(i){let e=i.split(`
`).find(e=>e&&!e.startsWith(`#`))?.trim();if(!e)return;let n=await yt(e);if(!n)return;await Ct([bt(n.title,n.url,n.comment)],t,`Drop`)}}),document.addEventListener(`paste`,async e=>{if(wt())return;let n=e.clipboardData?.getData(`text/html`)??``,r=e.clipboardData?.getData(`text/plain`)??``;if(!n&&!r)return;let i=xt(n||r);if(i.length===0){vt(`No links found in pasted text`);return}e.preventDefault(),await Ct(i.map(e=>e.text&&e.text!==e.url?`- ${e.text} ${e.url}`:`- ${e.url}`),t,`Paste`)})}function Et(e,t){return e.length<=t?e:e.slice(0,t).trimEnd()+`...`}function Dt(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var Ot=`notehub:token`,kt=`notehub:host`,At=`metabrowse:owner`,jt=`metabrowse:repo`,W=document.getElementById(`app`),G=``,K=e,q=``,J=``,Y=[],X=[],Mt=[];async function Nt(){K=localStorage.getItem(kt)||`github.com`,q=localStorage.getItem(At)||``,J=localStorage.getItem(jt)||``;let e=localStorage.getItem(Ot);if(e&&q&&J)try{D(`Auth: Attempting to validate token for host=${K}`),await i(K,e),D(`Auth: Authenticated`),G=e,await Ft()}catch(e){T(`Auth: Token validation failed: ${e instanceof Error?e.message:e}`),Pt()}else Pt()}function Pt(e){let t=localStorage.getItem(kt)||`github.com`,n=localStorage.getItem(At)||``,r=localStorage.getItem(jt)||``;W.innerHTML=`
    <div class="auth-screen">
      <h1>metabrowse</h1>
      <p>Authenticate to access your links.</p>
      ${e?`<div class="error">${Z(e)}</div>`:``}
      <form id="auth-form">
        <label>GitHub Host
          <input type="text" id="host" value="${Q(t)}" required />
        </label>
        <label>Content Owner
          <input type="text" id="owner" value="${Q(n)}" placeholder="org-or-user" required />
        </label>
        <label>Content Repo
          <input type="text" id="repo" value="${Q(r)}" placeholder="bb-metabrowse-links" required />
        </label>
        <label>Personal Access Token
          <input type="password" id="pat" placeholder="ghp_..." required />
        </label>
        <button type="submit">Connect</button>
      </form>
    </div>
  `,document.getElementById(`auth-form`).addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`host`).value.trim(),n=document.getElementById(`owner`).value.trim(),r=document.getElementById(`repo`).value.trim(),a=document.getElementById(`pat`).value.trim();try{D(`Auth: Attempting to validate token for host=${t}`),await i(t,a),D(`Auth: Authenticated`),localStorage.setItem(kt,t),localStorage.setItem(At,n),localStorage.setItem(jt,r),localStorage.setItem(Ot,a),G=a,K=t,q=n,J=r,await Ft()}catch(e){let t=e instanceof Error?e.message:String(e);T(`Auth: Token validation failed: ${t}`),Pt(`Authentication failed: ${t}`)}})}async function Ft(){W.innerHTML=`<div class="loading">Loading...</div>`,re(`Tree: Config: host=${K} owner=${q} repo=${J}`);try{D(`Tree: Fetching directory tree for ${q}/${J}`);let e=await a(K,G,q,J);Y=e,y(e)}catch(e){let t=v();if(t)Y=t,E(`Tree: Using cached tree due to network error`);else{let t=String(e);T(`Tree: Failed to fetch tree: ${t}`),W.innerHTML=`<div class="error">Failed to load content tree: ${Z(t)}</div>`;return}}X=o(Y),D(`Tree: Loaded ${X.length} pages indexed`),ue(Lt),It()}async function It(){D(`Search: Building index for ${X.length} pages...`);let e=[],t=await Promise.allSettled(X.map(async e=>{let t=e?`text/${e}/README.md`:`text/README.md`,n=b(t);return n||(n=await u(K,G,q,J,t),x(t,n)),{dirPath:e,content:n}})),n=0;for(let r of t)r.status===`fulfilled`?e.push(Je(r.value.dirPath,r.value.content,X)):n++;n>0&&E(`Search: Failed to index some pages (${n}/${X.length})`),Mt=e,D(`Search: Search index built: ${e.length} pages indexed`)}async function Lt(e){if(e.kind===`edit`){D(`Edit: Opening editor for ${e.contentPath}`),await lt(W,K,G,q,J,e.dirPath);return}if(e.dirPath&&!X.includes(e.dirPath)){T(`Route: Page not found: ${e.dirPath}`),W.innerHTML=`<div class="error">Page not found: ${Z(e.dirPath)}</div>`;return}D(`Route: Navigating to #/${e.dirPath||``}`);let t=b(e.contentPath);t?(re(`Content: Using cached content for ${e.contentPath}`),Rt(e,t)):W.innerHTML=`<div class="loading">Loading ${Z(e.dirPath||`home`)}...</div>`;try{D(`Content: Fetching page ${e.dirPath||`home`} from ${e.contentPath}`);let n=await u(K,G,q,J,e.contentPath);D(`Content: Loaded ${e.contentPath}`),x(e.contentPath,n),n!==t&&Rt(e,n)}catch(n){let r=n instanceof Error?n.message:String(n);t?E(`Content: Failed to refresh ${e.contentPath}, using cache`):(T(`Content: Failed to load ${e.contentPath}: ${r}`),W.innerHTML=`<div class="error">Failed to load: ${Z(r)}</div>`)}}function Rt(e,t){let n=Te(_e(t),e.dirPath?e.dirPath.split(`/`).pop().replace(/[-_]/g,` `):`Home`),r=()=>{_t(zt(),Bt)};Ie(W,n,e,{contentPaths:X,owner:q,repo:J,host:K,onTreePanel:r}),We(W),et(W,()=>Mt),tt(W,{onTreePanel:r}),Tt(W,{host:K,token:G,owner:q,repo:J,route:e,onSaved:()=>Lt(e)})}function Z(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function Q(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function zt(){return{token:G,host:K,owner:q,repo:J,contentPaths:X,tree:Y}}async function Bt(){let e=await a(K,G,q,J);return Y=e,y(e),X=o(Y),It(),Lt(ce(location.hash)),X}var Vt=`0.3.0`,$=document.createElement(`span`);$.className=`version-badge`,$.id=`version-badge`,$.textContent=`v${Vt}`,document.body.appendChild($),Nt();
//# sourceMappingURL=index-DhD1GcSB.js.map