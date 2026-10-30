const V="septimatest-1.6.0.0-2026.10.30-230323",FONTS="septimatest-fonts",META="septimatest-meta";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
/* an update is used only after «Обновить»: the version the person agreed to is remembered ("approved"), and pages keep
   coming from it even if the browser switches to the new worker by itself (pulling the page down, app closed and reopened) */
async function approved(){try{const c=await caches.open(META);const r=await c.match("approved");return r?await r.text():null}catch(_){return null}}
async function approve(v){try{const c=await caches.open(META);await c.put("approved",new Response(v))}catch(_){}}
async function tidy(keep){const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith("septimatest-")&&k!==V&&k!==FONTS&&k!==META&&k!==keep).map(k=>caches.delete(k)))}
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)))});
self.addEventListener("message",e=>{
  if(e.data==="skip")e.waitUntil((async()=>{await approve(V);await tidy(V);self.skipWaiting();const cs=await self.clients.matchAll();cs.forEach(c=>c.postMessage("approved"))})());
  if(e.data==="state"&&e.source)e.waitUntil((async()=>{e.source.postMessage({state:1,v:V,approved:await approved()})})());
});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{let a=await approved();if(!a){await approve(V);a=V}await tidy(a);await self.clients.claim()})())});
async function served(){const a=await approved();if(a&&a!==V&&await caches.has(a))return a;return V}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===self.location.origin){
    if(/\/(version\.json|sw\.js)$/.test(u.pathname))return;
    e.respondWith((async()=>{const name=await served();const c=await caches.open(name);
      let m=r.mode==="navigate"?await c.match("./index.html"):await c.match(r,{ignoreSearch:true});
      if(!m&&name!==V){const c2=await caches.open(V);m=r.mode==="navigate"?await c2.match("./index.html"):await c2.match(r,{ignoreSearch:true})}
      return m||fetch(r)})());return}
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(FONTS).then(async c=>{const m=await c.match(r);if(m)return m;try{const res=await fetch(r);if(res.ok||res.type==="opaque")c.put(r,res.clone());return res}catch(_){return Response.error()}}))}
});
