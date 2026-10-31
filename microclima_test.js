// Scenari del microclima (agente ecologo): node microclima_test.js
const M=require('./app/microclima.js');
let fails=0; const ok=(c,t)=>{ console.log((c?'  ok   ':'  FAIL ')+t); if(!c) fails++; };
const row=(h,v)=>console.log('  h'+String(h).padStart(4)+' T '+v.T.aria.toFixed(1)+'° rh '+v.aria.rh.toFixed(2)+' rug '+v.aria.rugiada.toFixed(1)+'° vetro(alto) '+v.T.vetro.alto.toFixed(1)+'° cond[t/a/m/b] '+[v.condensa.tappo,v.condensa.alto,v.condensa.medio,v.condensa.basso].map(x=>x.toFixed(2)).join('/')+' gocce '+v.gocce.toFixed(2)+' acqua[s/t/d] '+[v.acqua.superficie,v.acqua.terriccio,v.acqua.drenaggio].map(x=>x.toFixed(2)).join('/')+' muffa[t/v/f] '+[v.muffa.terra,v.muffa.vetro,v.muffa.foglie].map(x=>x.toFixed(2)).join('/')+' lux '+v.luce.lux.toFixed(1)+(v.piante.muschio?' muschio '+v.piante.muschio.vigore.toFixed(2):'')+(v.piante.succulenta?' succ '+v.piante.succulenta.vigore.toFixed(2):''));
function run(titolo,m,ore,amb,ogni,hook){ console.log('\n== '+titolo); const out=[]; for(let h=0;h<ore;h++){ if(hook) hook(h,m); const v=m.step(1,amb); out.push(v); if(h%ogni===0||h===ore-1) row(h,v); } return out; }
const amb=(st,pos,extra)=>t=>Object.assign(M.ambienteDi(t,{stagione:st,posizione:pos}),extra||{});
const maxOf=(a,f)=>Math.max(...a.map(f)), minOf=(a,f)=>Math.min(...a.map(f));

// 1. Estate, davanzale al sole, tappo chiuso, una settimana
{ const m=M.create({piante:['muschio','felce'],posizione:'sole'}); const o=run('Estate al sole, tappo chiuso (7 giorni)',m,24*7,amb('estate','sole'),6);
  const g=o.slice(24*2,24*3); const Tmax=maxOf(g,v=>v.T.aria), Tamb=maxOf(g,v=>M.ambienteDi(0,{stagione:'estate'}).T+3);
  ok(Tmax>Tamb+4&&Tmax<45,'effetto serra: dentro a mezzogiorno '+Tmax.toFixed(1)+'° (stanza ≤ '+Tamb.toFixed(1)+'°)');
  ok(minOf(o.slice(24),v=>v.aria.rh)>.8,'aria sempre molto umida (min rh '+minOf(o.slice(24),v=>v.aria.rh).toFixed(2)+')');
  const notte=o.filter((v,i)=>i%24===4), mezzo=o.filter((v,i)=>i%24===13);
  ok(maxOf(notte,v=>v.condensa.alto)>.3,'condensa di notte sul vetro alto');
  ok(maxOf(o,v=>v.gocce)>0,'a un certo punto il velo cola in gocce');
  const t0=o[23].acqua.ml.terriccio+o[23].acqua.ml.superficie, t1=o[o.length-1].acqua.ml.terriccio+o[o.length-1].acqua.ml.superficie;
  ok(t1>t0*.9,'ciclo chiuso: in 6 giorni l’acqua cala meno del 10 % ('+t0.toFixed(0)+'→'+t1.toFixed(0)+' ml)');
  ok(o[o.length-1].muffa.terra>.4,'caldo+umido+aria ferma: la muffa sulla terra sale ('+o[o.length-1].muffa.terra.toFixed(2)+')');
  ok(o[o.length-1].piante.muschio.vigore<.6,'il muschio soffre il caldo del vetro al sole ('+o[o.length-1].piante.muschio.vigore.toFixed(2)+')'); }

// 2. Inverno, finestra, tappo chiuso: notti fredde sul vetro
{ const m=M.create({piante:['muschio','felce'],posizione:'mezza',brucatori:.25}); const o=run('Inverno alla finestra, tappo chiuso (5 giorni)',m,24*5,amb('inverno','mezza'),6);
  const n=o.filter((v,i)=>i%24===5), d=o.filter((v,i)=>i%24===14);
  ok(maxOf(n,v=>v.condensa.alto)>maxOf(d.slice(1),v=>v.condensa.alto),'appannato all’alba ('+maxOf(n,v=>v.condensa.alto).toFixed(2)+'), più chiaro nel pomeriggio ('+maxOf(d.slice(1),v=>v.condensa.alto).toFixed(2)+')');
  ok(maxOf(o,v=>v.T.aria)<26,'nessun surriscaldamento (max '+maxOf(o,v=>v.T.aria).toFixed(1)+'°)');
  ok(o[o.length-1].muffa.terra<.5,'la muffa cresce più piano che d’estate ('+o[o.length-1].muffa.terra.toFixed(2)+')');
  ok(o[o.length-1].piante.muschio.vigore>.6,'il muschio sta bene al fresco ('+o[o.length-1].piante.muschio.vigore.toFixed(2)+')'); }

// 3. Troppa acqua
{ const m=M.create({piante:['muschio','succulenta']}); m.act('bagna',200); const o=run('Troppa acqua: 200 ml in un vaso già umido (6 giorni)',m,24*6,amb('mezza','mezza'),12);
  ok(o[2].acqua.drenaggio>.9,'il drenaggio si riempie ('+o[2].acqua.drenaggio.toFixed(2)+')');
  ok(o[o.length-1].acqua.ristagno>.4,'ristagno: le radici restano senz’aria ('+o[o.length-1].acqua.ristagno.toFixed(2)+')');
  ok(minOf(o.slice(24),v=>Math.max(v.condensa.alto,v.condensa.tappo))>.1,'dal 2° giorno il vetro non si asciuga mai del tutto (min '+minOf(o.slice(24),v=>Math.max(v.condensa.alto,v.condensa.tappo)).toFixed(2)+')');
  ok(o[o.length-1].piante.succulenta.vigore<.3,'la succulenta marcisce ('+o[o.length-1].piante.succulenta.vigore.toFixed(2)+')');
  ok(o[o.length-1].muffa.terra>.5,'muffa alta sulla terra ('+o[o.length-1].muffa.terra.toFixed(2)+')'); }

// 4. Vaso trascurato col tappo aperto, poi letargo (assenza) e risveglio
{ const m=M.create({piante:['muschio'],tappo:'aperto'}); const a=run('Trascurato, tappo aperto: 4 giorni mentre giochi…',m,24*4,amb('mezza','mezza'),24);
  ok(a[a.length-1].acqua.terriccio<a[0].acqua.terriccio-.08,'aperto: il terriccio si asciuga ('+a[0].acqua.terriccio.toFixed(2)+'→'+a[a.length-1].acqua.terriccio.toFixed(2)+')');
  const b=run('…poi 20 giorni di assenza (letargo)',m,24*20,amb('mezza','mezza',{letargo:true}),24*5);
  ok(minOf(b,v=>v.acqua.terriccio)>=.3-1e-6,'in letargo il terriccio non scende sotto 0,30 (min '+minOf(b,v=>v.acqua.terriccio).toFixed(2)+')');
  ok(minOf(b,v=>v.piante.muschio.vigore)>=.4-1e-6,'in letargo il muschio non muore (min '+minOf(b,v=>v.piante.muschio.vigore).toFixed(2)+')');
  m.act('bagna',60); m.act('chiudi'); const c=run('…risveglio: bagni, chiudi il tappo e passano 2 giorni',m,48,amb('mezza','mezza'),24);
  ok(c[c.length-1].acqua.terriccio>b[b.length-1].acqua.terriccio+.05,'dopo l’acqua il terriccio risale ('+c[c.length-1].acqua.terriccio.toFixed(2)+')');
  ok(c[c.length-1].piante.muschio.vigore>b[b.length-1].piante.muschio.vigore,'il muschio si riprende'); }

// 5. Muffa che nasce e si combatte
{ const m=M.create({piante:['muschio','felce'],detrito:.9}); m.act('bagna',40); const a=run('Muffa: chiuso, materia morta, umido (5 giorni)',m,24*5,amb('mezza','mezza'),24);
  const picco=a[a.length-1].muffa.terra; ok(picco>.6,'la muffa invade la terra ('+picco.toFixed(2)+')');
  ok(a[a.length-1].muffa.vetro>.2,'e compare anche sul vetro in basso ('+a[a.length-1].muffa.vetro.toFixed(2)+')');
  m.act('apri'); m.act('pulisci'); m.act('collemboli',.6); const b=run('…apri il tappo, pulisci, aggiungi collemboli (4 giorni)',m,24*4,amb('mezza','mezza'),24);
  ok(b[b.length-1].muffa.terra<picco*.4,'la muffa cala ('+b[b.length-1].muffa.terra.toFixed(2)+')');
  ok(b[b.length-1].muffa.vetro<.1,'il vetro resta pulito ('+b[b.length-1].muffa.vetro.toFixed(2)+')');
  m.act('chiudi'); const c=run('…richiudi: con i collemboli la muffa non torna (6 giorni)',m,24*6,amb('mezza','mezza'),48);
  ok(c[c.length-1].muffa.terra<.35,'con i collemboli resta bassa ('+c[c.length-1].muffa.terra.toFixed(2)+')'); }

// 6. Salvataggio
{ const m=M.create({piante:['felce']}); m.step(30,amb('mezza','sole')); const s=m.save(); const m2=M.create(); m2.load(s); ok(JSON.stringify(m.view())===JSON.stringify(m2.view()),'save/load riproduce lo stato'); }

// 7. Allineamento col motore: ogni cura toglie il tappo per un giorno del vaso (6 h); imposta copia i bisogni del motore
{ const m=M.create({piante:['muschio']}); const a=m.act('bagna',30); ok(a.aperto===true,'per bagnare togli il tappo: il vaso è aperto');
  m.step(7,amb('mezza','mezza')); ok(m.view().aperto===false,'dopo un giorno del vaso (6 h) il tappo è di nuovo chiuso');
  const v=m.act('imposta',{um:.4,muffa:.6,tappo:'aperto',posizione:'sole',drenaggio:.5,collemboli:.2,piante:['felce']});
  ok(Math.abs(v.acqua.terriccio-.4)<.01&&v.muffa.terra===.6&&v.tappo==='aperto'&&v.posizione==='sole'&&v.acqua.drenaggio===.5&&v.collemboli===.2&&v.piante.felce&&!v.piante.muschio,'imposta allinea acqua, muffa, tappo, posizione, drenaggio, collemboli e piante'); }

// 8-11. Giungla: biomassa, spazio, brucatori, pota (1 giorno del vaso = 6 h)
const giorni=(m,n,f,a)=>{ const o=[]; for(let d=1;d<=n;d++){ if(f) f(d,m); o.push(m.step(6,a||amb('mezza','mezza'))); } return o; };
{ console.log('\n== Giungla: vaso lasciato a sé (48 giorni del vaso = 12 giorni reali)'); const m=M.create({piante:['muschio','felce']}); const o=giorni(m,48);
  const dS=o.findIndex(v=>v.soffocato)+1, dG=o.findIndex(v=>v.giungla>0)+1; console.log('  giungla dal giorno',dG,'· soffocato dal giorno',dS,'· copertura finale',o[47].copertura,'muschio',JSON.stringify(o[47].piante.muschio));
  ok(o[1].giungla===0&&o[1].copertura<.4,'al giorno 2 il vaso è ancora ordinato (copertura '+o[1].copertura+')');
  ok(dG>=12&&dG<=18,'la giungla comincia tra la notte 12 e 18 (3–4 giorni reali), piena a ~20 (notte '+dG+')');
  ok(o[11].copertura>=.6&&o[11].copertura<.8,'alla notte 12 il vaso è pieno (copertura '+o[11].copertura+')');
  ok(dS>=18&&dS<=26,'soffoca tra la notte 18 e 26 (5–6 giorni reali) (notte '+dS+')');
  ok(o[19].giungla>.2&&o[19].piante.muschio.ombra>.4,'alla notte 20 giungla: il muschio sotto soffre (giungla '+o[19].giungla+', ombra muschio '+o[19].piante.muschio.ombra+')');
  ok(o[47].piante.muschio.vigore<.15&&o[47].piante.muschio.ombra>.7,'il muschio all’ombra della felce ingiallisce (vigore '+o[47].piante.muschio.vigore+', ombra '+o[47].piante.muschio.ombra+')');
  ok(o[47].piante.felce.ombra<.3,'la felce in cima resta in luce');
  ok(o[47].detrito>o[0].detrito+.15&&o[47].muffa.foglie>.45,'foglie morte → detrito ('+o[0].detrito+'→'+o[47].detrito+') → muffa sulle foglie ('+o[47].muffa.foglie+')'); }
{ const mk=b=>{ const m=M.create({piante:['muschio','felce'],brucatori:b}); return giorni(m,48); };
  const o=mk(.25); console.log('\n== Giungla: con brucatori .25 (48 giorni)'); console.log('  copertura',o.filter((v,i)=>i%6===5).map(v=>v.copertura).join(' '),'mangiato',o[47].mangiato);
  ok(maxOf(o,v=>v.copertura)<.7&&maxOf(o,v=>v.giungla)===0&&!o[47].soffocato,'con brucatori .25 la copertura resta sotto 0,7 (max '+maxOf(o,v=>v.copertura)+')');
  ok(o[47].mangiato>.5&&o[47].mangiatoUltimo>0,'view() dice quanto è stato mangiato ('+o[47].mangiato+')');
  ok(o[47].piante.muschio.vigore>.4,'il muschio vive ('+o[47].piante.muschio.vigore+')');
  const debole=mk(.1); ok(debole.findIndex(v=>v.soffocato)>44||debole.findIndex(v=>v.soffocato)<0,'pochi brucatori (.1) ritardano molto la giungla (soffoca al giorno '+(debole.findIndex(v=>v.soffocato)+1)+')');
  const troppi=mk(1); ok(troppi[23].copertura<.15,'troppi brucatori spelano il vaso (copertura '+troppi[23].copertura+'), ma le radici ricacciano (≥ 0,02)'); }
{ console.log('\n== Pota'); const m=M.create({piante:['muschio','felce']}); giorni(m,36); const prima=m.view(); const v=m.act('pota');
  ok(v.pota.ultima.ok&&v.pota.ultima.pianta==='felce'&&v.pota.ultima.tagliato>.15&&v.pota.ultima.tagliato<=.3,'pota taglia la pianta più invadente ('+v.pota.ultima.pianta+' −'+v.pota.ultima.tagliato+')');
  ok(v.copertura<prima.copertura-.15&&v.detrito>prima.detrito,'la copertura scende ('+prima.copertura+'→'+v.copertura+') e resta un po’ di detrito');
  const v2=m.act('pota'); ok(!v2.pota.ultima.ok&&v2.pota.ultima.motivo==='riposo'&&v2.copertura===v.copertura,'una pota al giorno del vaso: la seconda subito dopo non taglia');
  m.step(6,amb('mezza','mezza')); ok(m.view().pota.pronta,'dopo un giorno del vaso si può potare di nuovo');
  const k=M.create({piante:['muschio','felce']}); const o=giorni(k,48,(d,mm)=>{ if(d>=24&&d%6===0) mm.act('pota'); }); console.log('  potando ogni 6 giorni dal 24°: copertura',o.filter((v,i)=>i%6===5).map(v=>v.copertura).join(' '));
  ok(o[47].giungla===0&&!o[47].soffocato&&o[47].copertura>.15,'potando ogni 6 giorni il vaso non soffoca né si spela (copertura '+o[47].copertura+')'); }
{ const m=M.create({piante:['felce']}); giorni(m,5); const a=m.view().copertura; m.step(24*10,t=>Object.assign(M.ambienteDi(t,{}),{letargo:true}));
  ok(Math.abs(m.view().copertura-a)<.01,'in letargo la biomassa si ferma ('+a+'→'+m.view().copertura+')');
  const s=m.save(); delete s.S.piante.felce.biomassa; delete s.S.piante.felce.ombra; delete s.S.potaFino; const m2=M.create(); m2.load(s); const v=m2.view(); ok(v.piante.felce.biomassa>0&&v.pota.pronta,'un salvataggio vecchio senza biomassa si apre'); }

{ console.log('\n== Crescita visibile (notti = giorni del vaso)'); const m=M.create({piante:['muschio','felce']}); const c0=m.view().copertura; const o=giorni(m,12);
  console.log('  copertura per notte',o.map(v=>v.copertura).join(' '));
  ok(o[0].piante.felce.crescita>.3&&o[0].piante.muschio.crescita>.5,'dopo la prima notte le ore buone sono già > 0 (muschio '+o[0].piante.muschio.crescita+', felce '+o[0].piante.felce.crescita+')');
  ok(o[3].piante.muschio.crescita>3.5&&o[3].piante.felce.crescita>4,'dopo 4 notti (1 giorno reale) piante giovani: ore buone muschio '+o[3].piante.muschio.crescita+', felce '+o[3].piante.felce.crescita);
  ok(o[3].copertura>c0+.04,'la copertura sale già nel primo giorno reale ('+c0+'→'+o[3].copertura+')'); }

console.log('\n'+(fails?fails+' controlli falliti':'tutti i controlli passano'));
process.exit(fails?1:0);
