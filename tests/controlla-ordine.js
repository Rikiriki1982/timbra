// Controlla che i file JavaScript divisi in più parti (stesse variabili, caricati in ordine)
// non usino al caricamento qualcosa che è scritto in un file successivo.
// Uso: node controlla-ordine.js file1.js file2.js ...
const acorn=require('acorn'),fs=require('fs');
const files=process.argv.slice(2),def=Object.create(null),fnBody=Object.create(null),asts=[];
function walk(n,cb,skipFns){if(!n||typeof n.type!=='string')return;if(skipFns&&/Function/.test(n.type))return;cb(n);for(const k in n){if(k==='type')continue;if(k==='property'&&n.type==='MemberExpression'&&!n.computed)continue;if(k==='key'&&(n.type==='Property'||n.type==='MethodDefinition'||n.type==='PropertyDefinition')&&!n.computed)continue;const v=n[k];if(Array.isArray(v))v.forEach(x=>walk(x,cb,skipFns));else if(v&&typeof v.type==='string')walk(v,cb,skipFns)}}
files.forEach((f,i)=>{const ast=acorn.parse(fs.readFileSync(f,'utf8'),{ecmaVersion:2022,locations:true});asts.push(ast);
 for(const s of ast.body){if(s.type==='FunctionDeclaration'){def[s.id.name]=i;fnBody[s.id.name]=s.body}
  if(s.type==='VariableDeclaration')for(const d of s.declarations){def[d.id.name]=i;if(d.init&&/Function/.test(d.init.type))fnBody[d.id.name]=d.init.body}}});
let bad=0;
asts.forEach((ast,i)=>{for(const s of ast.body){if(s.type==='FunctionDeclaration')continue;
 const roots=s.type==='VariableDeclaration'?s.declarations.map(d=>d.init&&/Function/.test(d.init.type)?null:d.init):[s];
 const used=new Set(),q=[],done=new Set();
 const scan=node=>walk(node,n=>{if(n.type==='Identifier')used.add(n.name);if(n.type==='CallExpression'&&n.callee.type==='Identifier')q.push(n.callee.name)},true);
 roots.forEach(scan);
 while(q.length){const f=q.pop();if(done.has(f)||!fnBody[f])continue;done.add(f);scan(fnBody[f])}
 for(const n of used)if(def[n]>i){bad++;console.log(files[i]+':'+s.loc.start.line+' usa subito «'+n+'» che è in '+files[def[n]])}}});
console.log(bad?bad+' problemi':'OK: nessun riferimento in avanti eseguito al caricamento');process.exitCode=bad?1:0;
