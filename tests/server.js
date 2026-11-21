/* piccolo server per aprire l'app in locale durante i test (nessuna dipendenza) */
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),PORT=+process.env.PORT||4173;
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer((q,r)=>{
  let p=decodeURIComponent(new URL(q.url,'http://x').pathname);
  if(p.endsWith('/'))p+='index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT))return r.writeHead(403).end();
  fs.readFile(f,(e,d)=>{if(e)return r.writeHead(404).end('not found');r.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream'});r.end(d)});
}).listen(PORT,()=>console.log('http://localhost:'+PORT));
