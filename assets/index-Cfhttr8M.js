(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`github.com`;function t(e){return e===`github.com`?`https://api.github.com`:`https://${e}/api/v3`}function n(e){return{Authorization:`Bearer ${e}`,Accept:`application/vnd.github+json`,"Content-Type":`application/json`}}async function r(e,r,i,a){let o=`${t(e)}${i}`;console.log(`[github] ${a?.method??`GET`} ${o}`);let s=await fetch(o,{...a,headers:{...n(r),...a?.headers}});if(!s.ok){let e=await s.text();throw Error(`GitHub API ${s.status}: ${e}`)}return s.json()}function i(e,t){return r(e,t,`/user`)}async function a(e,t,n,i,a=`main`){return(await r(e,t,`/repos/${n}/${i}/git/trees/${a}?recursive=1`,{cache:`no-store`})).tree}function o(e){let t=[];for(let n of e){if(n.type!==`blob`||!n.path.startsWith(`text/`)||!n.path.endsWith(`/README.md`)&&n.path!==`text/README.md`)continue;let e=n.path.slice(5).replace(/\/README\.md$/,``);t.push(e===`README.md`?``:e)}return t}function s(e){let t=atob(e.replace(/\n/g,``)),n=Uint8Array.from(t,e=>e.charCodeAt(0));return new TextDecoder().decode(n)}function c(e){let t=new TextEncoder().encode(e),n=``;for(let e of t)n+=String.fromCharCode(e);return btoa(n)}async function l(e,t,n,i,a){let o=await r(e,t,`/repos/${n}/${i}/contents/${a}`);if(!o.content)throw Error(`File too large for Contents API. Only files under 1MB are supported.`);return{content:s(o.content),sha:o.sha}}async function u(e,t,n,r,i){return(await l(e,t,n,r,i)).content}async function d(e,r,i,a,o,s,l,u){let d=await fetch(`${t(e)}/repos/${i}/${a}/contents/${o}`,{method:`PUT`,headers:n(r),body:JSON.stringify({message:u,content:c(s),sha:l})});if(d.status===409)throw Error(`File was modified by someone else. Reload to get the latest version.`);if(!d.ok){let e=await d.text();throw Error(`GitHub API ${d.status}: ${e}`)}return(await d.json()).content.sha}async function f(e,r,i,a,o,s,l){let u=await fetch(`${t(e)}/repos/${i}/${a}/contents/${o}`,{method:`PUT`,headers:n(r),body:JSON.stringify({message:l,content:c(s)})});if(!u.ok){let e=await u.text();throw Error(`GitHub API ${u.status}: ${e}`)}return(await u.json()).content.sha}async function p(e,r,i,a,o,s,c){let l=await fetch(`${t(e)}/repos/${i}/${a}/contents/${o}`,{method:`DELETE`,headers:n(r),body:JSON.stringify({message:c,sha:s})});if(!l.ok){let e=await l.text();throw Error(`GitHub API ${l.status}: ${e}`)}}var m=`metabrowse:`,h=`${m}tree`;function g(e){return`${m}content:${e}`}function _(e){return`${m}etag:${e}`}function v(){let e=localStorage.getItem(h);if(!e)return null;try{return JSON.parse(e)}catch{return null}}function y(e){localStorage.setItem(h,JSON.stringify(e))}function b(e){return localStorage.getItem(g(e))}function x(e,t,n){localStorage.setItem(g(e),t),n&&localStorage.setItem(_(e),n)}function S(e){localStorage.removeItem(g(e)),localStorage.removeItem(_(e))}var C=`_app_debug_logs`,ee=1e3;function te(){try{let e=localStorage.getItem(C);return e?JSON.parse(e):[]}catch{return[]}}function ne(e){try{let t=e.slice(-ee);localStorage.setItem(C,JSON.stringify(t))}catch{}}function w(e,t){let n={timestamp:new Date().toISOString(),level:e,message:t},r=te();r.push(n),ne(r),console[e===`warn`?`warn`:e===`error`?`error`:`log`](`[${e.toUpperCase()}] ${t}`)}function T(e){w(`error`,e)}function re(e){w(`warn`,e)}function E(e){w(`info`,e)}function ie(e){w(`debug`,e)}function ae(){let e=te();return e.length===0?`(no logs)`:e.map(e=>`[${new Date(e.timestamp).toLocaleTimeString()}] ${e.level.toUpperCase()}: ${e.message}`).join(`
`)}function oe(){try{localStorage.removeItem(C)}catch{}}function se(){let e=document.createElement(`div`);e.id=`log-viewer-modal`,e.style.cssText=`
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
  `,r.addEventListener(`click`,()=>e.remove()),n.appendChild(r);let i=document.createElement(`textarea`);i.readOnly=!0,i.value=ae(),i.style.cssText=`
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
  `,o.addEventListener(`click`,()=>{oe(),i.value=`(no logs)`}),a.appendChild(o);let s=document.createElement(`button`);return s.textContent=`Refresh`,s.style.cssText=`
    padding: 6px 12px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `,s.addEventListener(`click`,()=>{i.value=ae(),i.scrollTop=i.scrollHeight}),a.appendChild(s),t.appendChild(n),t.appendChild(i),t.appendChild(a),e.appendChild(t),e.addEventListener(`click`,t=>{t.target===e&&e.remove()}),e}var ce=null;function le(e){let t=e.replace(/^#\/?/,``),n=`browse`;t.startsWith(`edit/`)?(n=`edit`,t=t.slice(5)):t===`edit`&&(n=`edit`,t=``),t=t.replace(/\/+$/,``);let r=t?`text/${t}/README.md`:`text/README.md`;return{kind:n,dirPath:t,contentPath:r}}function ue(){return le(window.location.hash)}function de(e){ce=e,window.addEventListener(`hashchange`,()=>{ce?.(ue())}),ce(ue())}var fe=/<a\s+href="([^"]+)"[^>]*>.*?<\/a>/i,pe=/\[([^\]]+)\]\(([^)]+)\)\{target="([^"]+)"\}/,me=/\[([^\]]+)\]\(([^)]+)\)/,he=/[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+|(?:mailto|tel|about):[^\s]+/;function D(e){return{text:null,target:null,rawHtml:null,indentLevel:0,comment:null,type:`link`,...e}}function ge(e){if(!e.includes(`#`))return[e.trim(),null];let t=-1;for(let n=0;n<e.length;n++)if(e[n]===`#`&&(n===0||/\s/.test(e[n-1]))){t=n;break}return t===-1?[e.trim(),null]:[e.slice(0,t).trim(),e.slice(t+1).trim()||null]}function _e(e,t){let n=e.trim();n.startsWith(`- `)&&(n=n.slice(2).trim());let[r,i]=ge(n);n=r;let a=fe.exec(n);if(a)return D({url:a[1],rawHtml:a[0],indentLevel:t,comment:i});let o=pe.exec(n);if(o)return D({url:o[2],text:o[1],target:o[3],indentLevel:t,comment:i});let s=me.exec(n);if(s)return D({url:s[2],text:s[1],indentLevel:t,comment:i});let c=he.exec(n);if(c){let e=c[0];return D({url:e,text:n.slice(0,c.index).trim()||null,indentLevel:t,comment:i})}return null}function ve(e){let t=e.split(`
`),n=[],r=null,i=null,a=-1;function o(){i!==null&&(r===null?n.push(i):r.items.push(i),i=null,a=-1)}function s(){r!==null&&(n.push(r),r=null)}function c(e){r===null?n.push(e):r.items.push(e)}for(let e of t){let t=e.length-e.trimStart().length,n=e.trim();if(!n)continue;if(n.startsWith(`## `)){o(),s();let[e,t]=ge(n.slice(3).trim());r={name:e,items:[],indentLevel:0,comment:t,type:`section`};continue}let l=_e(e,t);if(l)i&&t>a?i.links.push(l):(o(),c(l));else if(n.startsWith(`- `)){o();let[e,r]=ge(n.slice(2).trim());i={name:e,links:[],indentLevel:t,comment:r,type:`group`},a=t}}return o(),s(),{items:n}}var ye=[`mailto:`,`tel:`,`about:`];function be(e){return e.includes(`://`)||ye.some(t=>e.startsWith(t))}function xe(e){let t=5381;for(let n=0;n<e.length;n++)t=(t<<5)+t+e.charCodeAt(n)>>>0;return t.toString(16).padStart(8,`0`)}function Se(e){let t=[],n=[];function r(){n.length>0&&(t.push({links:[...n],type:`link_group`}),n=[])}for(let i of e)i.type===`link`?n.push(i):(r(),t.push(i));return r(),t}function Ce(e){let t=be(e.url),n;n=e.target?e.target:t?xe(e.url):`_self`;let r=e.text??e.url,i=null;return t&&(e.url.startsWith(`http://`)||e.url.startsWith(`https://`))&&(i=n),{url:e.url,text:r,target:n,rawHtml:e.rawHtml,comment:e.comment,urlHash:i,type:`link`}}function we(e){let t=e.links.map(Ce);return{name:e.name,links:t,comment:e.comment,type:`group`}}function Te(e){let t=[];for(let n of e)if(n.type===`section`){let e=Te(n.items);t.push({name:n.name,items:e,comment:n.comment,type:`section`})}else n.type===`group`?t.push(we(n)):t.push(Ce(n));return Se(t)}function Ee(e,t){return{title:t,items:Te(e.items)}}function O(e){return e.replace(/[-_]/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}function De(e,t){return t.filter(t=>e?t.startsWith(e+`/`)&&!t.slice(e.length+1).includes(`/`):t!==``&&!t.includes(`/`)).sort()}function Oe(e){if(!e)return[];let t=e.split(`/`),n=[];for(let e=0;e<t.length-1;e++){let r=t.slice(0,e+1).join(`/`);n.push({name:O(t[e]),hash:`#/${r}`})}return n}function k(e,t,...n){let r=document.createElement(e);if(t)for(let[e,n]of Object.entries(t))r.setAttribute(e,n);for(let e of n)typeof e==`string`?r.appendChild(document.createTextNode(e)):r.appendChild(e);return r}function ke(e){e.addEventListener(`click`,e=>{let t=e.target.closest(`.copy-btn`);if(!t)return;let n=t.getAttribute(`data-url`);if(!n)return;let r=document.createElement(`a`);r.href=n,navigator.clipboard.writeText(r.href).then(()=>{t.textContent=`✅`,setTimeout(()=>{t.textContent=`📋`},1500)})})}function Ae(e){let t=k(`li`);if(e.rawHtml){let n=document.createElement(`span`);n.innerHTML=e.rawHtml,t.appendChild(n)}else e.urlHash&&t.appendChild(k(`img`,{src:``,alt:``,class:`link-favicon`,"data-link-url":e.url,"data-url-hash":e.urlHash})),t.appendChild(k(`a`,{href:e.url,target:e.target},e.text));return t.appendChild(k(`button`,{class:`copy-btn`,"data-url":e.url,title:`Copy URL`},`📋`)),e.comment&&t.appendChild(k(`span`,{class:`link-comment`},`ℹ `+e.comment)),t}function je(e){let t=k(`div`,{class:`subgroup`}),n=k(`div`,{class:`subgroup-header`},e.name);e.comment&&n.appendChild(k(`span`,{class:`group-comment`},`ℹ `+e.comment)),t.appendChild(n);let r=k(`ul`,{class:`group-links`});for(let t of e.links)r.appendChild(Ae(t));return t.appendChild(r),t}function Me(e){let t=k(`ul`,{class:`links`});for(let n of e.links)t.appendChild(Ae(n));return t}function Ne(e){let t=document.createElement(`details`);t.className=`section`,t.open=!0;let n=k(`summary`,{},e.name);e.comment&&n.appendChild(k(`span`,{class:`section-comment`},`ℹ `+e.comment)),t.appendChild(n);let r=k(`div`,{class:`section-content`});for(let t of e.items)r.appendChild(Pe(t));return t.appendChild(r),t}function Pe(e){switch(e.type){case`group`:return je(e);case`link_group`:return Me(e);case`section`:return Ne(e)}}function Fe(e,t){let n=De(e,t);if(n.length===0)return null;let r=k(`div`,{class:`children-nav`});for(let e of n){let t=O(e.split(`/`).pop()),n=`#/${e}`,i=k(`span`,{class:`child-link-wrap`});i.appendChild(k(`a`,{href:n,class:`child-link`,target:`_self`},t)),i.appendChild(k(`button`,{class:`copy-btn child-copy-btn`,"data-url":n,title:`Copy URL`},`📋`)),r.appendChild(i)}return r}function Ie(e){let t=k(`h1`,{class:`breadcrumbs`});if(t.appendChild(k(`a`,{href:`#/`,class:`breadcrumb-link`,target:`_self`},`Metabrowse`)),e){let n=Oe(e);for(let e of n)t.appendChild(k(`span`,{class:`breadcrumb-separator`},`/`)),t.appendChild(k(`a`,{href:e.hash,class:`breadcrumb-link`,target:`_self`},e.name));let r=O(e.split(`/`).pop());t.appendChild(k(`span`,{class:`breadcrumb-separator`},`/`)),t.appendChild(k(`span`,{class:`breadcrumb-current`},r))}else t.innerHTML=``,t.appendChild(k(`span`,{class:`breadcrumb-current`},`Metabrowse`));return t}function Le(e,t,n,r){e.innerHTML=``;let i=k(`div`,{class:`container`}),a=k(`div`,{class:`fixed-header`}),o=k(`div`,{class:`header-bar`});o.appendChild(Ie(n.dirPath));let s=k(`div`,{class:`header-actions`}),c=n.dirPath?`#/edit/${n.dirPath}`:`#/edit/`,l=k(`a`,{href:c,class:`edit-link`},`Edit`);l.addEventListener(`click`,e=>{e.preventDefault(),window.open(c,`_blank`)}),s.appendChild(l);let u=k(`button`,{class:`tree-btn`,title:`Manage tree (t)`},`Tree`);u.addEventListener(`click`,()=>{r.onTreePanel?.()}),s.appendChild(u);let d=k(`button`,{class:`logs-btn`,title:`View debug logs`},`Logs`);d.addEventListener(`click`,()=>{document.body.appendChild(se())}),s.appendChild(d);let f=k(`button`,{class:`settings-btn`,title:`Settings`},`Settings`);f.addEventListener(`click`,()=>{r.onSettings?.()}),s.appendChild(f),o.appendChild(s),a.appendChild(o);let p=k(`div`,{class:`search-bar`,role:`search`});p.appendChild(k(`span`,{class:`search-icon`},`🔍`)),p.appendChild(k(`input`,{type:`text`,id:`unified-search`,class:`search-input`,placeholder:`/ (this page) | ^K (global)`,"aria-label":`Search`}));let m=k(`button`,{type:`button`,id:`clear-search-btn`,class:`clear-search-btn`,title:`Clear search`,style:`display:none`},`×`);p.appendChild(m);let h=k(`label`,{class:`search-mode-toggle`}),g=k(`input`,{type:`checkbox`,id:`global-mode-checkbox`});g.checked=!0,h.appendChild(g),h.appendChild(k(`span`,{},`Global`)),p.appendChild(h),a.appendChild(p),i.appendChild(a);let _=k(`div`,{class:`scrollable-content`}),v=k(`div`,{id:`search-results-panel`,class:`search-results-panel`,style:`display:none`});v.appendChild(k(`div`,{id:`search-results-content`,class:`search-results`})),_.appendChild(v);let y=Fe(n.dirPath,r.contentPaths);y&&_.appendChild(y);for(let e of t.items)_.appendChild(Pe(e));i.appendChild(_),e.appendChild(i);let b=document.createElement(`footer`);b.className=`shortcut-help`,b.innerHTML=[`<kbd>t</kbd> Tree`,`<kbd>e</kbd> Edit`,`<kbd>/</kbd> Search page`,`<kbd>Ctrl+K</kbd> Search all`,`<kbd>c</kbd> Collapse/restore`,`<kbd>r</kbd> Reload`].join(`<span class="shortcut-sep">|</span>`),e.appendChild(b),ke(e)}var A=`metabrowse-fav-`,Re=1440*60*1e3,ze=[`/favicon.ico`,`/favicon.png`,`/favicon.svg`];function Be(e){try{let t=localStorage.getItem(A+e);if(!t)return null;let n=JSON.parse(t);return n.failed?Date.now()-n.ts>Re?(localStorage.removeItem(A+e),null):`FAILED`:n.path??null}catch{return null}}function Ve(e,t){try{localStorage.setItem(A+e,JSON.stringify({path:t,ts:Date.now()}))}catch{}}function He(e){try{localStorage.setItem(A+e,JSON.stringify({failed:!0,ts:Date.now()}))}catch{}}function Ue(e,t){let n=`https://icons.duckduckgo.com/ip3/`+t+`.ico`;e.onerror=()=>{e.style.display=`none`,He(t)},e.onload=()=>{Ve(t,`ddg`)},e.src=n}function We(e,t,n,r){if(r>=ze.length){Ue(e,n);return}let i=ze[r];e.onerror=()=>{We(e,t,n,r+1)},e.onload=()=>{Ve(n,i)},e.src=t+i}function Ge(e){let t=e.querySelectorAll(`.link-favicon[data-url-hash]`);for(let e of t){let t=e.getAttribute(`data-link-url`);if(!t)continue;let n,r;try{let e=new URL(t);n=e.origin,r=e.hostname}catch{e.style.display=`none`;continue}let i=Be(r);if(i===`FAILED`){e.style.display=`none`;continue}if(i){e.onerror=()=>{e.style.display=`none`},e.src=i===`ddg`?`https://icons.duckduckgo.com/ip3/`+r+`.ico`:n+i;continue}We(e,n,r,0)}}function j(e){return e.replace(/[-_]/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}function Ke(e){return e?`Metabrowse / `+e.split(`/`).map(j).join(` / `):`Metabrowse`}function qe(e,t){let n=[];for(let r of e)if(r.type===`section`)n.push(...qe(r.items,``));else if(r.type===`group`)for(let e of r.links)n.push({text:e.text,url:e.url,group:r.name,comment:e.comment??``});else if(r.type===`link_group`)for(let e of r.links)n.push({text:e.text,url:e.url,group:t,comment:e.comment??``});return n}function M(e,t){let n=[];for(let r of e)r.type===t&&n.push(r.name),r.type===`section`&&n.push(...M(r.items,t));return n}function Je(e,t){return t.filter(t=>e?t.startsWith(e+`/`)&&!t.slice(e.length+1).includes(`/`):t!==``&&!t.includes(`/`))}function Ye(e,t,n){let r=ve(t),i=e?j(e.split(`/`).pop()):`Home`,a=Ee(r,i);return{path:e?`#/${e}`:`#/`,title:i,breadcrumbs:Ke(e),links:qe(a.items,``),groups:M(a.items,`group`),sections:M(a.items,`section`),children:Je(e,n).map(e=>j(e.split(`/`).pop()))}}var Xe=`metabrowse-search-mode`,Ze=`metabrowse-search-term`,N=null;function P(e){return(e.textContent??``).toLowerCase()}function Qe(e,t){let n=!1;for(let r of e.querySelectorAll(`:scope > li`)){let e=P(r).includes(t);e||r.querySelector(`a`)?.href?.toLowerCase().includes(t)&&(e=!0),r.style.display=e?``:`none`,e&&(n=!0)}return n}function $e(e,t){let n=e.querySelector(`.subgroup-header`),r=n?P(n).includes(t):!1,i=e.querySelector(`.group-links`),a=!1;if(i)for(let e of i.querySelectorAll(`:scope > li`)){let n=P(e).includes(t);n||e.querySelector(`a`)?.href?.toLowerCase().includes(t)&&(n=!0),e.style.display=n||r?``:`none`,n&&(a=!0)}let o=r||a;return e.style.display=o?``:`none`,o}function F(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function et(e,t){if(!t)return F(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n<0?F(e):F(e.substring(0,n))+`<mark>`+F(e.substring(n,n+t.length))+`</mark>`+F(e.substring(n+t.length))}function tt(e,t){N&&N();let n=document.getElementById(`unified-search`),r=document.getElementById(`global-mode-checkbox`),i=document.getElementById(`clear-search-btn`),a=document.getElementById(`search-results-panel`),o=document.getElementById(`search-results-content`);if(!n||!r)return;let s=e.querySelectorAll(`.children-nav .child-link-wrap`),c=e.querySelectorAll(`.section`),l=e.querySelectorAll(`.scrollable-content > .subgroup`),u=e.querySelectorAll(`.scrollable-content > .links`),d=Array.from(c,e=>e.open);function f(){i&&(i.style.display=n.value?``:`none`)}function p(){try{localStorage.setItem(Xe,r.checked?`global`:`local`),localStorage.setItem(Ze,n.value)}catch{}}function m(){s.forEach(e=>{e.style.display=``}),c.forEach((e,t)=>{e.style.display=``,e.open=d[t],e.querySelectorAll(`.subgroup`).forEach(e=>{e.style.display=``,e.querySelectorAll(`.group-links > li`).forEach(e=>{e.style.display=``})}),e.querySelectorAll(`.links`).forEach(e=>{e.style.display=``,e.querySelectorAll(`:scope > li`).forEach(e=>{e.style.display=``})})}),l.forEach(e=>{e.style.display=``,e.querySelectorAll(`.group-links > li`).forEach(e=>{e.style.display=``})}),u.forEach(e=>{e.style.display=``,e.querySelectorAll(`:scope > li`).forEach(e=>{e.style.display=``})})}function h(){s.forEach(e=>{e.style.display=`none`}),c.forEach(e=>{e.style.display=`none`}),l.forEach(e=>{e.style.display=`none`}),u.forEach(e=>{e.style.display=`none`})}function g(e){if(a&&(a.style.display=`none`),!e){m();return}let t=e.toLowerCase();s.forEach(e=>{e.style.display=P(e).includes(t)?``:`none`}),c.forEach(e=>{let n=e.querySelector(`summary`),r=n?P(n).includes(t):!1,i=!1;e.querySelectorAll(`.section-content > .subgroup`).forEach(e=>{$e(e,t)&&(i=!0)}),e.querySelectorAll(`.section-content > .links`).forEach(e=>{let n=Qe(e,t);e.style.display=n?``:`none`,n&&(i=!0)}),r||i?(e.style.display=``,e.open=!0):e.style.display=`none`}),l.forEach(e=>{$e(e,t)}),u.forEach(e=>{let n=Qe(e,t);e.style.display=n?``:`none`})}function _(e){if(!e){a&&(a.style.display=`none`),m();return}a&&(a.style.display=``),h();let n=e.toLowerCase(),r=[],i=t();for(let e of i){e.breadcrumbs.toLowerCase().includes(n)&&r.push({page:e,type:`page`,text:e.breadcrumbs});for(let t of e.children)t.toLowerCase().includes(n)&&r.push({page:e,type:`child`,text:t});for(let t of e.sections)t.toLowerCase().includes(n)&&r.push({page:e,type:`section`,text:t});for(let t of e.groups)t.toLowerCase().includes(n)&&r.push({page:e,type:`group`,text:t});for(let t of e.links){let i=!1,a=t.text;t.text.toLowerCase().includes(n)?i=!0:t.url.toLowerCase().includes(n)?(i=!0,a=t.text+` — `+t.url):t.comment&&t.comment.toLowerCase().includes(n)&&(i=!0,a=t.text+` — `+t.comment),i&&r.push({page:e,type:`link`,text:a,link:t})}if(r.length>=50)break}if(!o)return;if(r.length===0){o.innerHTML=`<div class="search-no-results">No results found</div>`;return}let s=new Map,c=[];for(let e of r){let t=e.page.path;s.has(t)||(s.set(t,{page:e.page,items:[]}),c.push(t)),s.get(t).items.push(e)}let l=``;for(let t of c){let n=s.get(t);l+=`<div class="search-result-page">`,l+=`<a href="${F(n.page.path)}" class="search-result-page-link" target="_self">${et(n.page.breadcrumbs,e)}</a>`;for(let t of n.items){let r=t.type===`link`?`→`:t.type===`section`?`§`:t.type===`group`?`▸`:t.type===`child`?`◆`:`📄`,i=t.type===`link`&&t.link?t.link.url:n.page.path,a=t.type===`link`&&t.link?`_blank`:`_self`;l+=`<div class="search-result-item">`,l+=`<span class="search-result-type">${r}</span> `,l+=`<a href="${F(i)}" class="search-result-link" target="${a}">${et(t.text,e)}</a>`,l+=`</div>`}l+=`</div>`}o.innerHTML=l}function v(){let e=n.value.trim();f(),r.checked?_(e):g(e)}let y,b=()=>{clearTimeout(y),y=setTimeout(()=>{p(),v()},150)},x=()=>{p(),v()},S=()=>{n.value=``,p(),f(),v(),n.focus()};n.addEventListener(`input`,b),r.addEventListener(`change`,x),i&&i.addEventListener(`click`,S);try{let e=localStorage.getItem(Xe),t=localStorage.getItem(Ze);e===`local`&&(r.checked=!1),t&&(n.value=t)}catch{}f(),v(),N=()=>{n.removeEventListener(`input`,b),r.removeEventListener(`change`,x),i&&i.removeEventListener(`click`,S),clearTimeout(y)}}var nt=null;function I(){let e=document.activeElement?.tagName;return e===`INPUT`||e===`TEXTAREA`||e===`SELECT`}function rt(e,t){nt&&nt();let n=e.querySelectorAll(`.section`),r=[],i=!1;function a(a){if(a.key===`t`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(I())return;a.preventDefault(),t?.onTreePanel?.()}if(a.key===`/`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(I())return;a.preventDefault();let e=document.getElementById(`global-mode-checkbox`),t=document.getElementById(`unified-search`);e&&(e.checked=!1),e&&e.dispatchEvent(new Event(`change`)),t&&(t.focus(),t.select())}if((a.ctrlKey||a.metaKey)&&a.key===`k`){a.preventDefault();let e=document.getElementById(`global-mode-checkbox`),t=document.getElementById(`unified-search`);e&&(e.checked=!e.checked,e.dispatchEvent(new Event(`change`))),t&&(t.focus(),t.select())}if(a.key===`e`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(I())return;let t=e.querySelector(`.edit-link`);t&&(a.preventDefault(),t.click())}if(a.key===`r`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(I())return;a.preventDefault(),location.reload()}if(a.key===`c`&&!a.ctrlKey&&!a.metaKey&&!a.altKey){if(I()||n.length===0)return;a.preventDefault(),i?(n.forEach((e,t)=>{e.open=t<r.length?r[t]:!0}),i=!1):(r=Array.from(n,e=>e.open),n.forEach(e=>{e.open=!1}),i=!0)}}document.addEventListener(`keydown`,a),nt=()=>{document.removeEventListener(`keydown`,a)}}var it=`modulepreload`,at=function(e){return`/metabrowse/`+e},ot={},st=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=at(t,n),t in ot)return;ot[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:it,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},ct=`https://stabledog.github.io/veditor.web/`,L=null,lt=!1;async function ut(){if(L)return L;if(!lt){let e=document.createElement(`link`);e.rel=`stylesheet`,e.href=`${ct}/veditor.css`,document.head.appendChild(e),lt=!0}L=await st(()=>import(`${ct}/veditor.js`),[]);let e=document.getElementById(`version-badge`);return e&&L.VERSION&&!e.textContent?.includes(`ve`)&&(e.textContent+=` \u00b7 ve${L.VERSION}`),L}function R(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}async function dt(e,t,n,r,i,a){let o=a?`text/${a}/README.md`:`text/README.md`;e.innerHTML=`<div class="editor-loading">Loading editor...</div>`;let s,c,u;try{let[e,a]=await Promise.all([ut(),l(t,n,r,i,o)]);s=e,c=a.content,u=a.sha}catch(t){e.innerHTML=`
      <div class="editor-loading" style="flex-direction:column;gap:1rem;">
        <div style="color:#f38ba8;">Failed to load editor</div>
        <div style="font-size:0.85rem;">${R(t instanceof Error?t.message:String(t))}</div>
      </div>
    `;return}let f=c,p=u;e.innerHTML=`
    <div class="editor-screen">
      <header>
        <a class="filename" href="https://${R(t)}/${R(r)}/${R(i)}/blob/main/${R(o)}" target="_blank" rel="noopener noreferrer">${R(o)}</a>
        <span id="status-msg"></span>
      </header>
      <div id="editor-container"></div>
    </div>
  `;function m(e,t=!1){let n=document.getElementById(`status-msg`);n&&(n.textContent=e,n.className=t?`error`:`success`,t||setTimeout(()=>{n.textContent===e&&(n.textContent=``)},2e3))}async function h(){let e=s.getEditorContent();if(e===f){m(`No changes`);return}let a=`Update ${o.split(`/`).pop()??o} via metabrowse editor`;try{m(`Saving...`);let s=await d(t,n,r,i,o,e,p,a);f=e,p=s,m(`Saved`);try{window.opener?.location.reload()}catch{}}catch(e){m(`Save failed: ${e instanceof Error?e.message:e}`,!0)}}function g(){window.close(),setTimeout(()=>{m(`You can close this tab.`)},100)}s.createEditor(document.getElementById(`editor-container`),f,{onSave:h,onQuit:g},{storagePrefix:`metabrowse`})}function ft(e){return!e||!e.trim()?`Name cannot be empty`:e.includes(`/`)||e.includes(`\\`)?`Name cannot contain / or \\`:null}function pt(e,t){if(!e)return[];let n=e+`/`;return t.filter(e=>e.startsWith(n))}function mt(e){return e.replace(/[-_]/g,` `).replace(/\b\w/g,e=>e.toUpperCase())}async function ht(e,t,n,r,i,a,o){let s=ft(a);if(s)throw Error(`Invalid name: ${s}`);let c=i?`${i}/${a}`:a;if(o.includes(c))throw Error(`Node '${a}' already exists at this level`);let l=`text/${c}/README.md`,u=`# ${mt(a)}\n\n`;try{return await f(e,t,n,r,l,u,`Create node ${c}`),E(`TreeOps: Created node ${c}`),c}catch(e){throw T(`TreeOps: Failed to create ${c}: ${e instanceof Error?e.message:String(e)}`),e}}async function gt(e,t,n,r,i,a){if(i===``)throw Error(`Cannot delete root node`);let o=pt(i,a),s=[i,...o];if(o.length>0)return{needsConfirm:!0,paths:s};try{let a=`text/${i}/README.md`,{sha:o}=await l(e,t,n,r,a);return await p(e,t,n,r,a,o,`Delete node ${i}`),S(a),E(`TreeOps: Deleted node ${i}`),{needsConfirm:!1}}catch(e){throw T(`TreeOps: Failed to delete ${i}: ${e instanceof Error?e.message:String(e)}`),e}}async function _t(e,t,n,r,i){try{for(let a of i){let i=`text/${a}/README.md`,{sha:o}=await l(e,t,n,r,i);await p(e,t,n,r,i,o,`Delete node ${a}`),S(i)}E(`TreeOps: Deleted ${i.length} node(s)`)}catch(e){throw T(`TreeOps: Failed during cascade delete: ${e instanceof Error?e.message:String(e)}`),e}}async function vt(e,t,n,r,i,a,o){let s=ft(a);if(s)throw Error(`Invalid name: ${s}`);let c=[i,...pt(i,o)],u=i.includes(`/`)?i.slice(0,i.lastIndexOf(`/`)):``,d=u?`${u}/${a}`:a;if(d!==i&&o.includes(d))throw Error(`Node '${a}' already exists at this level`);try{for(let a of c){let o=`text/${a}/README.md`,s=`text/${a.replace(RegExp(`^${i}`),d)}/README.md`,{content:c,sha:u}=await l(e,t,n,r,o);await f(e,t,n,r,s,c,`Rename node ${i} → ${d}`),await p(e,t,n,r,o,u,`Delete old ${i} (renamed)`),S(o),S(s)}return E(`TreeOps: Renamed node ${i} → ${d}`),d}catch(e){throw T(`TreeOps: Failed to rename ${i}: ${e instanceof Error?e.message:String(e)}`),e}}function yt(e){let t=new Set,n=e=>{for(let r of e)r.expanded&&t.add(r.dirPath),n(r.children)};return n(e),t}function z(e,t){let n=[],r={},i=e.filter(e=>e!==``).sort();for(let e of i){let i=e.split(`/`),a=i[i.length-1],o=i.slice(0,-1).join(`/`),s={name:a,dirPath:e,depth:i.length-1,children:[],expanded:t?t.has(e):!1};r[e]=s,o===``?n.push(s):r[o]&&r[o].children.push(s)}let a=e=>{e.sort((e,t)=>e.name.localeCompare(t.name));for(let t of e)a(t.children)};return a(n),n}function B(e){let t=[],n=e=>{for(let r of e)t.push(r),r.expanded&&r.children.length>0&&n(r.children)};return n(e),t}async function bt(e,t){E(`TreePanel: showTreePanel called, contentPaths=${e.contentPaths.length}`);let n=document.createElement(`div`);n.className=`tree-panel-overlay`,n.style.cssText=`
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
  `,u.addEventListener(`click`,()=>n.remove()),l.appendChild(u),r.appendChild(l),n.appendChild(r);let d=z(e.contentPaths),f=0,p=null,m=null,h=null,g=null;function _(){s.innerHTML=``;let n=B(d);for(let r=0;r<n.length;r++){let i=n[r],a=document.createElement(`div`);a.className=`tree-node${r===f?` tree-node-selected`:``}`,a.setAttribute(`data-path`,i.dirPath),a.style.cssText=`
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
        `;let r=async n=>{if(!n.trim()){p=null,m=null,_();return}try{let r=p===`new`,a=i.dirPath;c.textContent=r?`Creating...`:`Renaming...`,c.style.color=`#888`,r?await ht(e.host,e.token,e.owner,e.repo,i.dirPath,n.trim(),e.contentPaths):await vt(e.host,e.token,e.owner,e.repo,i.dirPath,n.trim(),e.contentPaths),p=null,m=null;let o=await t();e.contentPaths=o;let s=yt(d);r&&s.add(a),d=z(o,s),f=Math.min(f,B(d).length-1),c.textContent=``,_()}catch(e){c.textContent=e instanceof Error?e.message:String(e),c.style.color=`#f87171`}};n.addEventListener(`keydown`,e=>{e.stopPropagation(),e.key===`Enter`?r(n.value):e.key===`Escape`&&(p=null,m=null,_())}),a.appendChild(n),g=n}a.addEventListener(`click`,()=>{f=n.indexOf(i),_()}),s.appendChild(a)}g&&=(g.focus(),g.select(),null)}function v(e){let t=B(d),r=t[f];if(p){e.key===`Escape`&&(e.preventDefault(),p=null,m=null,_());return}if(e.key===`ArrowUp`)e.preventDefault(),f=Math.max(0,f-1),_();else if(e.key===`ArrowDown`)e.preventDefault(),f=Math.min(t.length-1,f+1),_();else if(e.key===`ArrowRight`)e.preventDefault(),r&&r.children.length>0&&(r.expanded=!0,_());else if(e.key===`ArrowLeft`){if(e.preventDefault(),r){if(r.expanded)r.expanded=!1,_();else if(r.depth>0){let e=r.dirPath.slice(0,r.dirPath.lastIndexOf(`/`)),n=t.find(t=>t.dirPath===e);n&&(f=t.indexOf(n),_())}}}else e.key===`Enter`?(e.preventDefault(),r&&(location.hash=`#/${r.dirPath}`,n.remove())):e.key===`Insert`?(e.preventDefault(),r&&!h&&(p=`new`,m=r,_())):e.key===`Delete`?(e.preventDefault(),r&&r.dirPath!==``&&!p&&y(r)):e.key===`F2`?(e.preventDefault(),r&&!h&&!p&&(p=`rename`,m=r,_())):e.key===`Escape`?(e.preventDefault(),p?(p=null,m=null,_()):h?(h=null,b()):n.remove()):e.key===`Home`?(e.preventDefault(),f=0,_()):e.key===`End`&&(e.preventDefault(),f=t.length-1,_())}async function y(n){try{c.textContent=`Checking...`,c.style.color=`#888`;let r=await gt(e.host,e.token,e.owner,e.repo,n.dirPath,e.contentPaths);if(r.needsConfirm)h={paths:r.paths},b();else{let r=await t();e.contentPaths=r,d=z(r,yt(d)),f=Math.min(f,B(d).length-1),c.textContent=``,_(),E(`TreePanel: Deleted ${n.dirPath}`)}}catch(e){c.textContent=e instanceof Error?e.message:String(e),c.style.color=`#f87171`}}function b(){if(!h){l.innerHTML=``;let e=document.createElement(`button`);e.textContent=`Close`,e.style.cssText=`
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
    `,i.addEventListener(`click`,async()=>{try{c.textContent=`Deleting...`,c.style.color=`#888`,await _t(e.host,e.token,e.owner,e.repo,h.paths);let n=await t();e.contentPaths=n,d=z(n,yt(d)),f=Math.min(f,B(d).length-1),h=null,c.textContent=``,b(),_()}catch(e){c.textContent=e instanceof Error?e.message:String(e),c.style.color=`#f87171`}}),l.appendChild(i)}n.addEventListener(`click`,e=>{e.target===n&&n.remove()});let x=e=>{n.parentElement&&v(e)};document.addEventListener(`keydown`,x);let S=n.remove.bind(n);n.remove=function(){document.removeEventListener(`keydown`,x),S()},_(),b(),document.body.appendChild(n)}function xt(e){let t=document.querySelector(`.import-toast`);t&&t.remove();let n=document.createElement(`div`);n.className=`import-toast`,n.textContent=e,document.body.appendChild(n),n.offsetWidth,n.classList.add(`visible`),setTimeout(()=>{n.classList.remove(`visible`),n.addEventListener(`transitionend`,()=>n.remove())},3e3)}function St(e){return new Promise(t=>{let n=e;try{n=new URL(e).hostname.replace(/^www\./,``)}catch{}let r=document.createElement(`div`);r.className=`drop-modal-overlay`;let i=document.createElement(`div`);i.className=`drop-modal`,i.innerHTML=`
      <div class="drop-modal-header">Add Link</div>
      <form class="drop-modal-form">
        <label>Title
          <input type="text" id="drop-title" value="${At(n)}" />
        </label>
        <label>URL
          <input type="text" id="drop-url" value="${At(e)}" />
        </label>
        <label>Comment
          <input type="text" id="drop-comment" placeholder="Optional" />
        </label>
        <div class="drop-modal-buttons">
          <button type="submit" class="drop-modal-ok">OK</button>
          <button type="button" class="drop-modal-cancel">Cancel</button>
        </div>
      </form>
    `,r.appendChild(i),document.body.appendChild(r);let a=i.querySelector(`#drop-title`),o=i.querySelector(`#drop-url`),s=i.querySelector(`#drop-comment`),c=i.querySelector(`form`),l=i.querySelector(`.drop-modal-cancel`);a.focus(),a.select();function u(e){r.remove(),t(e)}c.addEventListener(`submit`,e=>{e.preventDefault();let t=a.value.trim(),n=o.value.trim();n&&u({title:t||n,url:n,comment:s.value.trim()})}),l.addEventListener(`click`,()=>u(null)),r.addEventListener(`click`,e=>{e.target===r&&u(null)}),r.addEventListener(`keydown`,e=>{e.key===`Escape`&&u(null)})})}function Ct(e,t,n){let r=`- ${e} ${t}`;return n?`${r} # ${n}`:r}function wt(e){let t=[],n=new Set,r=/<a\s[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi,i;for(;(i=r.exec(e))!==null;){let e=i[1];n.has(e)||(n.add(e),t.push({text:kt(i[2].trim(),50)||e,url:e}))}let a=/https?:\/\/[^\s<>"')\]]+/g;for(;(i=a.exec(e))!==null;){let e=i[0].replace(/[.,;:!?)]+$/,``);n.has(e)||(n.add(e),t.push({text:e,url:e}))}return t}function Tt(e,t){let n=e.split(`
`),r=t.map(e=>`  ${e}`);for(let e=0;e<n.length;e++)if(n[e].trimEnd()===`- Imported:`){let t=e+1;for(;t<n.length&&/^\s+\S/.test(n[t]);)t++;let i=n.slice(0,t),a=n.slice(t);return[...i,...r,...a].join(`
`)}let i=0;for(let e=0;e<n.length;e++)if(n[e].startsWith(`# `)){i=e+1;break}let a=n.slice(0,i),o=n.slice(i);return[...a,``,`- Imported:`,...r,...o].join(`
`)}async function Et(e,t,n){let r=t.route.contentPath;try{E(`${n}: Saving ${e.length} link(s) to ${r}`);let{content:i,sha:a}=await l(t.host,t.token,t.owner,t.repo,r),o=Tt(i,e);await d(t.host,t.token,t.owner,t.repo,r,o,a,`Add ${e.length} link(s) via ${n.toLowerCase()}`),S(r),E(`${n}: Saved successfully`);let s=e.length,c=r.replace(/^text\//,``).replace(/\/README\.md$/,``)||`root`;xt(`${s} link${s===1?``:`s`} imported into ${c}`),t.onSaved()}catch(e){let t=e instanceof Error?e.message:String(e);T(`${n}: Failed to save: ${t}`),alert(`Failed to save link(s): ${t}`)}}function Dt(){let e=document.activeElement?.tagName;return e===`INPUT`||e===`TEXTAREA`||e===`SELECT`}function Ot(e,t){let n=e.querySelector(`.scrollable-content`);if(!n||t.route.kind!==`browse`)return;let r=0;n.addEventListener(`dragenter`,e=>{e.preventDefault(),r++,n.classList.add(`drop-target`)}),n.addEventListener(`dragover`,e=>{e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect=`copy`)}),n.addEventListener(`dragleave`,()=>{r--,r<=0&&(r=0,n.classList.remove(`drop-target`))}),n.addEventListener(`drop`,async e=>{if(e.preventDefault(),r=0,n.classList.remove(`drop-target`),!e.dataTransfer)return;let i=e.dataTransfer.getData(`text/uri-list`);if(i){let e=i.split(`
`).find(e=>e&&!e.startsWith(`#`))?.trim();if(!e)return;let n=await St(e);if(!n)return;await Et([Ct(n.title,n.url,n.comment)],t,`Drop`)}}),document.addEventListener(`paste`,async e=>{if(Dt())return;let n=e.clipboardData?.getData(`text/html`)??``,r=e.clipboardData?.getData(`text/plain`)??``;if(!n&&!r)return;let i=wt(n||r);if(i.length===0){xt(`No links found in pasted text`);return}e.preventDefault(),await Et(i.map(e=>e.text&&e.text!==e.url?`- ${e.text} ${e.url}`:`- ${e.url}`),t,`Paste`)})}function kt(e,t){return e.length<=t?e:e.slice(0,t).trimEnd()+`...`}function At(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var V=`notehub:token`,jt=`notehub:host`,Mt=`metabrowse:owner`,Nt=`metabrowse:repo`,H=document.getElementById(`app`),U=``,W=e,G=``,K=``,q=[],J=[],Pt=[];async function Ft(){W=localStorage.getItem(jt)||`github.com`,G=localStorage.getItem(Mt)||``,K=localStorage.getItem(Nt)||``;let e=localStorage.getItem(V);if(e&&G&&K)try{E(`Auth: Attempting to validate token for host=${W}`),await i(W,e),E(`Auth: Authenticated`),U=e,await It()}catch(e){T(`Auth: Token validation failed: ${e instanceof Error?e.message:e}`),Y()}else Y()}function Y(e){let t=localStorage.getItem(jt)||`github.com`,n=localStorage.getItem(Mt)||``,r=localStorage.getItem(Nt)||``,a=localStorage.getItem(V)||``;H.innerHTML=`
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
          <input type="password" id="pat" value="${Q(a)}" placeholder="ghp_..." required />
        </label>
        <button type="submit">Connect</button>
      </form>
    </div>
  `,document.getElementById(`auth-form`).addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`host`).value.trim(),n=document.getElementById(`owner`).value.trim(),r=document.getElementById(`repo`).value.trim(),a=document.getElementById(`pat`).value.trim();try{E(`Auth: Attempting to validate token for host=${t}`),await i(t,a),E(`Auth: Authenticated`),localStorage.setItem(jt,t),localStorage.setItem(Mt,n),localStorage.setItem(Nt,r),localStorage.setItem(V,a),U=a,W=t,G=n,K=r,await It()}catch(e){let t=e instanceof Error?e.message:String(e);T(`Auth: Token validation failed: ${t}`),Y(`Authentication failed: ${t}`)}})}async function It(){H.innerHTML=`<div class="loading">Loading...</div>`,ie(`Tree: Config: host=${W} owner=${G} repo=${K}`);try{E(`Tree: Fetching directory tree for ${G}/${K}`);let e=await a(W,U,G,K);q=e,y(e)}catch(e){let t=v();if(t)q=t,re(`Tree: Using cached tree due to network error`);else{let t=String(e);T(`Tree: Failed to fetch tree: ${t}`),H.innerHTML=`<div class="error">Failed to load content tree: ${Z(t)}</div>`;return}}J=o(q),E(`Tree: Loaded ${J.length} pages indexed`),de(X),Lt()}async function Lt(){E(`Search: Building index for ${J.length} pages...`);let e=[],t=await Promise.allSettled(J.map(async e=>{let t=e?`text/${e}/README.md`:`text/README.md`,n=b(t);return n||(n=await u(W,U,G,K,t),x(t,n)),{dirPath:e,content:n}})),n=0;for(let r of t)r.status===`fulfilled`?e.push(Ye(r.value.dirPath,r.value.content,J)):n++;n>0&&re(`Search: Failed to index some pages (${n}/${J.length})`),Pt=e,E(`Search: Search index built: ${e.length} pages indexed`)}async function X(e){if(e.kind===`edit`){E(`Edit: Opening editor for ${e.contentPath}`),await dt(H,W,U,G,K,e.dirPath);return}if(e.dirPath&&!J.includes(e.dirPath)){T(`Route: Page not found: ${e.dirPath}`),H.innerHTML=`<div class="error">Page not found: ${Z(e.dirPath)}</div>`;return}E(`Route: Navigating to #/${e.dirPath||``}`);let t=b(e.contentPath);t?(ie(`Content: Using cached content for ${e.contentPath}`),Rt(e,t)):H.innerHTML=`<div class="loading">Loading ${Z(e.dirPath||`home`)}...</div>`;try{E(`Content: Fetching page ${e.dirPath||`home`} from ${e.contentPath}`);let n=await u(W,U,G,K,e.contentPath);E(`Content: Loaded ${e.contentPath}`),x(e.contentPath,n),n!==t&&Rt(e,n)}catch(n){let r=n instanceof Error?n.message:String(n);t?re(`Content: Failed to refresh ${e.contentPath}, using cache`):(T(`Content: Failed to load ${e.contentPath}: ${r}`),H.innerHTML=`<div class="error">Failed to load: ${Z(r)}</div>`)}}function Rt(e,t){let n=Ee(ve(t),e.dirPath?e.dirPath.split(`/`).pop().replace(/[-_]/g,` `):`Home`),r=()=>{bt(zt(),Bt)};Le(H,n,e,{contentPaths:J,owner:G,repo:K,host:W,onTreePanel:r,onSettings:()=>Y()}),Ge(H),tt(H,()=>Pt),rt(H,{onTreePanel:r}),Ot(H,{host:W,token:U,owner:G,repo:K,route:e,onSaved:()=>X(e)})}function Z(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function Q(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function zt(){return{token:U,host:W,owner:G,repo:K,contentPaths:J,tree:q}}async function Bt(){let e=await a(W,U,G,K);return q=e,y(e),J=o(q),Lt(),X(le(location.hash)),J}var Vt=`0.4.0`,$=document.createElement(`span`);$.className=`version-badge`,$.id=`version-badge`,$.textContent=`v${Vt}`,document.body.appendChild($),Ft();
//# sourceMappingURL=index-Cfhttr8M.js.map