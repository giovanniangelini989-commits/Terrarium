(function(){
'use strict';
const T=window.Terr;
const the=nome=>{ const s=Object.values(T.SPECIE).find(x=>x.nome===nome); return s?(s.g===0?'le ':'i ')+nome.toLowerCase():nome.toLowerCase(); };
const fem=nome=>{ const s=Object.values(T.SPECIE).find(x=>x.nome===nome); return !s||s.g===0; };
const ag=(nome,f,m)=>fem(nome)?f:m;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const pick=(arr,seed)=>arr[Math.abs(seed|0)%arr.length];
const TITOLI=['Ospite','Curioso','Osservatore','Custode','Testimone','Guardiano','Sognatore'];
// ---------- prologo (ricordo, in seconda persona: il giocatore è il bambino) ----------
const PRO={
 cielo:['Quella notte non riuscivi a dormire.','Dalla finestra hai visto una stella staccarsi dal cielo.'],
 giardino:['È caduta in giardino, dietro il gelso. Un rumore come di vetro su un tappeto.','Era un sasso nero con delle crepe viola. Era caldo. E batteva, piano, come un cuore.'],
 barattolo:['Hai svuotato il barattolo della marmellata. Dentro, solo il sasso.','Il vetro si è scaldato subito. La nonna dice che per fare un mondo ci vuole prima la terra, poi l’acqua. Il resto viene da sé.'],
 posto:['Dove lo metti? Vicino alla finestra il sole lo fa battere più forte. Ma ti fa un po’ paura.'],
 acqua:['Quanta acqua? La nonna dice che le piante bevono pochissimo. Le lumache invece…'],
 ospite:['Una formica ti ha seguito fin dentro. Era già lì, in fondo al muschio, come se aspettasse.'],
 oggetto:['Hai due cose in tasca. Il vaso ne regge una sola. Quale gli lasci?'],
 legenda:['La nonna dice che le stelle cadute portano un sogno. Il sasso non è un sasso: ascolta.','Più luce gli dai, più batte. E chi lo tocca, cambia.','Non sai cosa vuole. Forse vuole solo essere guardato.'],
 nome:['Come lo chiami, il tuo piccolo mondo?'],
 fine:['Il sasso batte sotto le tue dita. Adesso il barattolo è tuo.','Resta a guardarlo. Là dentro, qualcosa sta per cominciare.']
};
const OGG_VOCE={statuina:'una statuina di pietra, con una faccia seria',orologio:'l’orologio rotto del nonno, che ticchetta ancora se lo scuoti',giocattolo:'il tuo vecchio orso di stoffa',specchio:'uno specchietto che fa luce sul soffitto'};
// ---------- arrivi (le notifiche della storia) ----------
const ARR={
 specie:{mosche:['Dalla finestra','Una mosca è entrata e ha sbattuto sul vetro per un’ora. Poi ne sono arrivate altre. Ronzano attorno al coperchio.'],coleotteri:['Dal giardino','Un coleottero lucido ha attraversato il prato e si è fermato davanti al barattolo, come se leggesse l’etichetta.'],termiti:['Dal vecchio ceppo','Dal ceppo dietro il gelso è uscita una fila di termiti. Vanno dritte verso il vaso, e nessuno le ha chiamate.'],ragni:['Dal davanzale','Un ragno ha teso un filo tra il gelso e il davanzale. Guarda il vaso con tutti gli occhi che ha.'],lumache:['Dopo la pioggia','Due lumache hanno lasciato una scia d’argento fino al coperchio. Hanno l’aria di chi ha tutto il tempo.'],formiche:['Dal giardino','Una formica ha seguito l’odore della terra bagnata fino al barattolo. Dietro di lei, altre. Aspettano in fila davanti al vetro.']},
 pianta:{muschio:['Dal bosco dietro casa','Hai staccato un pezzo di muschio da una pietra umida. È morbido e freddo, come un animale che dorme.'],felce:['Dalla serra della nonna','La nonna ha tagliato un rametto di felce e te l’ha messo in mano. Dice che le felci conoscono l’ombra.'],fungo:['Dalla serra della nonna','La nonna ti ha dato un cestino: dentro, dei funghi piccolissimi. Dice che amano il buio e il silenzio.'],succulenta:['Dalla serra della nonna','Questa succulenta non vuole morire mai. La nonna dice che fa bene agli spiriti.'],carnivora:['Dalla serra della nonna','C’è una pianta che mangia le mosche. La nonna dice che ha un carattere gentile.']},
 oggetto:{statuina:['una statuina di pietra con una faccia seria'],orologio:['l’orologio rotto del nonno, che ticchetta ancora'],giocattolo:['un orso di stoffa'],specchio:['uno specchietto che fa luce sul soffitto'],libro:['un librino con le pagine strappate e disegni di stelle'],moneta:['una vecchia moneta d’argento'],radio:['una radiolina che prende solo fruscio'],candela:['una candela avanzata da un compleanno']}
};
// ---------- richieste: pensieri del giocatore ----------
// REQ[kind] resta [testo, pulsante] (firma invariata per app3.js), ma ogni lettura sceglie una variante
// legata a ciò che c'è nel vaso. La scelta resta ferma finché la richiesta è la stessa (giorno + richieste fatte).
const vivo=(v,id)=>v.sp.some(x=>x.id===id&&x.alive), pianta=(v,id)=>v.setup.piante.includes(id), popolo=v=>v.sp.find(x=>x.alive&&x.society);
// Preposizioni articolate: prep('a','le formiche') → «alle formiche», prep('di','l’acqua') → «dell’acqua». Senza articolo restano separate («a Marta»).
const PREP_T={di:{il:'del',lo:'dello',la:'della','l’':'dell’',i:'dei',gli:'degli',le:'delle'},a:{il:'al',lo:'allo',la:'alla','l’':'all’',i:'ai',gli:'agli',le:'alle'},da:{il:'dal',lo:'dallo',la:'dalla','l’':'dall’',i:'dai',gli:'dagli',le:'dalle'},in:{il:'nel',lo:'nello',la:'nella','l’':'nell’',i:'nei',gli:'negli',le:'nelle'},su:{il:'sul',lo:'sullo',la:'sulla','l’':'sull’',i:'sui',gli:'sugli',le:'sulle'}};
function prep(p,sint){ const t=PREP_T[p], str=String(sint||''); if(!t) return p+' '+str; const m=/^(il|lo|la|i|gli|le)\s+(.*)$/i.exec(str); if(m){ const a=m[1].toLowerCase(); return t[a]+' '+m[2]; } const e=/^(l[’'])(.*)$/i.exec(str); if(e) return t['l’']+e[2]; return p+' '+str; }
const OGG_BREVE={statuina:'la statuina',orologio:'l’orologio',giocattolo:'l’orso di stoffa',specchio:'lo specchietto',libro:'il librino',moneta:'la moneta',radio:'la radiolina',candela:'la candela'};
const REQV={
 pulisci:[
  {x:'Il vetro è velato. Vedi solo ombre che si muovono.',b:'Pulisci il vetro'},
  {c:v=>v.muffa>.45,x:'Una peluria grigia sale dal fondo del vetro. È muffa: cresce dove l’aria è umida e ferma.',b:'Pulisci il vetro'},
  {c:v=>vivo(v,'formiche'),x:'Le formiche camminano dietro un vetro opaco. Da qui non distingui più chi è chi.',b:'Passa il panno'},
  {c:v=>v.setup.luce===2,x:'Il sole accende ogni macchia sul vetro. Dentro, la luce arriva sporca.',b:'Pulisci il vetro'},
  {c:v=>pianta(v,'muschio'),x:'Il muschio sembra grigio, ma è il vetro. Dietro le macchie è ancora verde.',b:'Passa il panno'},
  {c:v=>!!popolo(v),x:'Il popolo lavora dietro un vetro sporco. Vorresti vedere cosa costruisce.',b:'Pulisci il vetro'},
  {c:v=>v.E>60,x:'Il sasso batte, ma il viola si vede appena: il vetro è coperto di aloni.',b:'Passa il panno'},
  {c:v=>vivo(v,'lumache'),x:'Le lumache hanno lasciato scie d’argento su tutto il vetro. Dentro non si vede più niente.',b:'Pulisci il vetro'},
  {x:'Ieri hai lasciato un’impronta sul vetro. Adesso sopra c’è la polvere.',b:'Passa il panno'}],
 acqua:[
  {x:'Le foglie pendono, molli. Hanno sete.',b:'Dai un po’ d’acqua'},
  {c:v=>pianta(v,'muschio'),x:'Il muschio è diventato grigio e croccante. Non è morto: aspetta l’acqua per riaprirsi.',b:'Spruzza il muschio'},
  {c:v=>pianta(v,'felce'),x:'La felce arrotola le foglie verso l’interno. Così perde meno acqua.',b:'Dai un po’ d’acqua'},
  {c:v=>vivo(v,'lumache'),x:'Le lumache si sono chiuse nel guscio. Lo fanno quando l’aria è troppo secca.',b:'Dai un po’ d’acqua'},
  {c:v=>v.setup.luce===2,x:'Il sole ha bevuto la terra. Sul vetro non resta neanche una goccia.',b:'Dai un po’ d’acqua'},
  {c:v=>vivo(v,'formiche'),x:'Le formiche scavano più a fondo del solito. Cercano l’umido.',b:'Bagna la terra'},
  {c:v=>pianta(v,'fungo'),x:'I funghi hanno il cappello raggrinzito. Il buio non basta: serve acqua.',b:'Dai un po’ d’acqua'},
  {x:'La terra si è staccata dal vetro: una riga chiara tutto intorno. È asciutta.',b:'Bagna la terra'},
  {x:'Stamattina sul tappo non c’è una goccia. Il vaso non suda più: ha sete.',b:'Dai un po’ d’acqua'}],
 nutri:[
  {x:'La terra è grigia e stanca. Le serve cibo buono.',b:'Nutri il suolo'},
  {c:v=>pianta(v,'muschio'),x:'Il muschio cresce piano, a chiazze. La terra sotto non ha più niente da dargli.',b:'Nutri il suolo'},
  {c:v=>vivo(v,'formiche'),x:'Le formiche tornano al nido a mani vuote. Non trovano più niente.',b:'Spargi terra buona'},
  {c:v=>vivo(v,'coleotteri'),x:'I coleotteri rosicchiano la stessa foglia da giorni. Non c’è altro.',b:'Nutri il suolo'},
  {c:v=>vivo(v,'termiti'),x:'Le termiti hanno finito il legno morto. Girano in tondo.',b:'Spargi terra buona'},
  {c:v=>!!popolo(v),x:'Il popolo divide le briciole in parti sempre più piccole. Il cibo sta finendo.',b:'Nutri il suolo'},
  {c:v=>pianta(v,'felce'),x:'Le foglie nuove della felce escono pallide. La terra non ha più forza.',b:'Nutri il suolo'},
  {x:'La terra è dura e chiara, come quella del cortile. Le radici non la bucano.',b:'Spargi terra buona'}],
 osserva:[
  {x:'Ti chiedi cosa fanno quando nessuno li guarda.',b:'Osserva il vaso'},
  {c:v=>vivo(v,'formiche'),x:'Le formiche vanno sempre dallo stesso lato del sasso. Vuoi capire perché.',b:'Guarda da vicino'},
  {c:v=>!!popolo(v),x:'Stanotte il popolo ha spostato qualcosa. Vuoi vedere cosa.',b:'Guarda da vicino'},
  {c:v=>v.sp.some(x=>x.alive&&x.mut.length),x:'Uno di loro cammina in modo diverso dagli altri. Vuoi guardarlo da vicino.',b:'Osserva il vaso'},
  {c:v=>v.E>60,x:'Il sasso batte forte, stamattina. Chi gli sta vicino si comporta in modo strano?',b:'Osserva il vaso'},
  {c:v=>v.setup.oggetti.length>0&&v.sp.some(x=>x.alive),x:v=>'Qualcuno gira intorno '+prep('a',OGG_BREVE[v.setup.oggetti[0]]||'qualcosa')+' da ieri. Vuoi sapere perché.',b:'Guarda da vicino'},
  {c:v=>v.wars.length>0,x:'Le due fazioni sono ferme da ore. Chi si muoverà per prima?',b:'Osserva il vaso'},
  {c:v=>v.sp.some(x=>x.alive&&x.monster),x:'La creatura più grande si è fermata contro il vetro. Sta guardando te?',b:'Guarda da vicino'},
  {c:v=>pianta(v,'felce'),x:'Sotto la felce c’è un’ombra che si muove. Vuoi sapere chi ci abita.',b:'Osserva il vaso'},
  {c:v=>vivo(v,'lumache'),x:'Una lumaca è salita sul vetro, a metà strada verso il tappo. Dove va?',b:'Guarda da vicino'},
  {c:v=>vivo(v,'ragni'),x:'Il ragno non si muove da stamattina. Sta aspettando qualcosa.',b:'Osserva il vaso'},
  {c:v=>v.sp.filter(x=>x.alive).length>=2,x:v=>{ const a=v.sp.filter(x=>x.alive); return cap(the(a[0].nome))+' e '+the(a[1].nome)+' si incrociano sul muschio. Si conoscono?'; },b:'Guarda da vicino'},
  {x:'Il vaso sembra fermo. Ma niente, qui dentro, è fermo davvero.',b:'Osserva il vaso'}],
 // il pulsante notte non c'è più: le notti passano da sole (o con una notte di scorta)
 notte:[
  {x:'Il vaso ha bisogno di tempo. Le notti passano da sole: domani troverai qualcosa di nuovo.',b:'Osserva il vaso'},
  {x:'Adesso tocca al vaso. Mentre dormi, qualcuno lì dentro lavora.',b:'Osserva il vaso'}]
};
const reqMemo={}, reqUltimo={};
function reqScegli(kind){ const L=REQV[kind]; const base=[L[0].x,L[0].b];
  try{ const A=window.__app; if(!A||!A.sim||!A.G) return base; const G=A.G, key=kind+'|'+((G.req&&G.req.day)||0)+'|'+((G.ui&&G.ui.reqN)||0);
   if(reqMemo[kind]&&reqMemo[kind].key===key) return reqMemo[kind].r;
   const v=A.sim.view(); const ok=L.filter(o=>{ try{ return !o.c||o.c(v); }catch(e){ return false; } });
   const peso=ok.map(o=>o.c?3:1); let tot=peso.reduce((a,b)=>a+b,0), h=0; for(const ch of key) h=(h*31+ch.charCodeAt(0))|0; let r=Math.abs(h)%tot, i=0; while(r>=peso[i]){ r-=peso[i]; i++; }
   const rec=reqUltimo[kind]||(reqUltimo[kind]=[]), mem=Math.min(5,ok.length-1); let o=ok[i];
   for(let j=0;j<ok.length&&rec.slice(0,mem).includes(o);j++) o=ok[(i+j+1)%ok.length];
   rec.unshift(o); rec.length=Math.min(rec.length,6);
   const out=[typeof o.x==='function'?o.x(v):o.x,o.b]; reqMemo[kind]={key,r:out}; return out; }catch(e){ return base; } }
const REQ={}; Object.keys(REQV).forEach(k=>Object.defineProperty(REQ,k,{enumerable:true,get:()=>reqScegli(k)}));
// ---------- la voce del vaso ----------
const NM={
 gigantismo:[N=>cap(N)+' crescono giorno dopo giorno. Mangiano per tre: il cibo, nel vaso, adesso finisce prima.',N=>'Qualcosa nella luce: '+N+' sono più grandi di ieri. Dove passano, gli altri si scansano.',N=>cap(N)+' non passano più tra i fili del muschio. Ci camminano sopra, e il muschio si piega.',N=>'Il vetro sembra più vicino: '+N+' hanno bisogno di spazio. E di molto più cibo.'],
 radioattivo:[(N,F)=>'Vicino al sasso la terra è tiepida. '+cap(N)+' ci passano sopra, e col tempo imparano a reggere la luce strana. Non sono diventat'+(F?'e':'i')+' pericolos'+(F?'e':'i')+': hanno solo la pelle più dura.',(N,F)=>cap(N)+' brillano appena, di un verde che non c’era. Ormai la luce del sasso non '+(F?'le':'li')+' disturba più.',(N,F)=>cap(N)+' dormono '+(F?'attaccate':'attaccati')+' al sasso. Lì nessun altro resiste: è il loro posto.',N=>'Nessuna radiazione esce da '+N+'. Semplicemente, adesso la sopportano.'],
 intelligenza:[N=>cap(N)+' si fermano più spesso. Guardano. Hanno capito che c’è un vetro, e che dietro ci sei tu.',N=>'Qualcuno, tra '+N+', ha trascinato una briciola fino al sasso. Come un’offerta. Stanno imparando.',N=>cap(N)+' hanno trovato una strada più corta per il cibo. Gli altri la seguono. Un popolo è vicino.',(N,F)=>'Quando ti avvicini, '+N+' si girano verso di te. '+(F?'Tutte':'Tutti')+' insieme, come una domanda.'],
 corazza:[N=>cap(N)+' si coprono di una scorza scura come inchiostro. Chi caccia, adesso, ci rinuncia.',(N,F)=>cap(N)+' hanno un guscio sempre più spesso. Sotto il dito suonano come sassolini. Nessuno '+(F?'le':'li')+' morde più.',N=>'Tic, tic: '+N+' battono contro il vetro con il guscio nuovo. Non hanno più paura di niente.',(N,F)=>cap(N)+' camminano piano, '+(F?'pesanti. La corazza le protegge, ma le rende lente.':'pesanti. La corazza li protegge, ma li rende lenti.')],
 velenoso:[N=>'Un odore dolce e sbagliato: '+N+' hanno imparato a difendersi. I predatori girano alla larga.',N=>cap(N)+' lasciano una traccia amara. Adesso nessuno si avvicina più.',N=>'Chi morde '+N+' sputa e scappa. Nel vaso è cambiato chi ha paura di chi.',N=>cap(N)+' attraversano il muschio senza nascondersi. Non ne hanno più bisogno.'],
 iperfertilita:[N=>'Provi a contare '+N+', ma nascono più in fretta di te. Il cibo non basterà a lungo.',N=>'Sono ovunque. '+cap(N)+' riempiono ogni angolo del muschio. Gli altri si stringono.',N=>'Ieri erano una manciata. Oggi '+N+' coprono il fondo. Domani avranno fame.',N=>cap(N)+' depongono uova sotto ogni foglia. Il vaso si fa stretto per tutti.'],
 bioluminescenza:[N=>'Quando spegni la luce, '+N+' accendono la loro. Belle, e visibili da chi caccia.',N=>cap(N)+' brillano nel buio come lucciole inquiete. Adesso chiunque sa dove sono.',N=>'Di notte il vaso ha una costellazione nuova: '+N+'. Chi caccia segue ogni loro passo.',N=>cap(N)+' fanno luce sul muschio. Di notte il vaso non è più buio, per nessuno.']
};
// conseguenza in una riga, per la scheda della mutazione (interfaccia): MUTFX[m]
const MUTFX={gigantismo:'Diventano grandi: mangiano di più e gli altri si scansano.',radioattivo:'Reggono la luce del sasso (radiotolleranza), ma fanno meno piccoli.',intelligenza:'Imparano in fretta. Un popolo è più vicino.',corazza:'Guscio duro: chi caccia ci rinuncia, ma costa fatica e fanno meno piccoli.',velenoso:'Hanno il veleno: i predatori girano alla larga.',iperfertilita:'Nascono in fretta: il cibo finirà prima.',bioluminescenza:'Brillano al buio: belle, ma si vedono da lontano.'};
const MUTMAP={}; Object.keys(T.MUT).forEach(m=>Object.values(T.SPECIE).forEach(s=>{ MUTMAP[T.MUT[m].txt(s.nome)]={m,nome:s.nome}; }));
function narra(e){ const t=e.text, d=e.d||0; let m;
  if(MUTMAP[t]){ const {m:mm,nome}=MUTMAP[t]; return pick(NM[mm],d)(the(nome),fem(nome)); }
  switch(e.kind){
   case 'meteorite': return pick(['Il meteorite ha un lampo viola. Per un istante si vede il fondo del muschio.','Un battito più forte degli altri: il sasso scarica la sua luce e il vaso trattiene il fiato.','Un lampo viola, poi di nuovo quiete. Il sasso sembra respirare.'],d);
   case 'societa': { const n=t.replace(' si organizzano in una società.',''); return cap(the(n))+' non vagano più a caso: si dividono i compiti, danno un nome alle cose, costruiscono. In fondo al muschio è nato un popolo.'; }
   case 'guerra': if(t.indexOf('Guerra tra')===0){ const mm=t.match(/tra (?:le società di )?(\S+) e (\S+)\./); return mm?'Due popoli, un solo pasto. Il vaso non basta per tutti: '+the(cap(mm[1]))+' e '+the(cap(mm[2]))+' si guardano storto.':t; } if(t.indexOf('La guerra finisce')===0){ const mm=t.match(/: (\S+) prevalgono/); return 'La guerra è finita. '+(mm?cap(the(cap(mm[1])))+' hanno vinto,':'Qualcuno ha vinto,')+' e il silenzio che segue pesa più del rumore.'; } return t;
   case 'pace': return 'Una moneta tra due popoli. Per la prima volta, parlano invece di colpirsi.';
   case 'scisma': return 'Metà del popolo si inginocchia, metà misura il tempo. Una sola idea li ha tagliati in due.';
   case 'mostro': { const n=t.replace(' giganti dominano il vaso.',''); return cap(the(n))+' sono '+ag(n,'cresciute','cresciuti')+' oltre misura. Il vetro, adesso, sembra troppo vicino.'; }
   case 'estinzione': { const n=t.replace(' si estinguono.',''); return cap(the(n))+' non ci sono più. Nel muschio resta un silenzio nuovo.'; }
   case 'finale': return 'Il vaso è fermo, come dopo un lungo respiro. Qualcosa è arrivato alla fine.';
   case 'ambiente':
     if(t.indexOf('muffa')>=0) return 'Una macchia grigia e pelosa sul vetro: la muffa è arrivata, silenziosa.';
     if(t.indexOf('si secca')>=0) return 'L’aria nel vaso è secca. Le foglie si arricciano come carta.';
     if(m=t.match(/^(.+) soffrono la siccità\.$/)) return cap(the(m[1]))+' stanno male: qui dentro è troppo secco per loro.';
     if(m=t.match(/^(.+) soffrono l’umidità eccessiva\.$/)) return cap(the(m[1]))+' stanno male: qui dentro è troppo umido.';
     if(m=t.match(/^(.+) entrano nel vaso\.$/)) return cap(the(m[1]))+' entrano nel vaso, e per un momento tutto il resto si ferma a guardare.';
     if(m=t.match(/^(.+) escono dal vaso\.$/)) return cap(the(m[1]))+' escono dal vaso. Il posto che occupavano sembra più grande di prima.';
     if(t.indexOf('scheggiato')>=0) return 'Il vetro si è scheggiato. Per qualche giorno il vaso sarà un po’ più scuro.';
     if(t.indexOf('non si è fissata')>=0) return 'La mutazione si è sciolta come neve su un vetro caldo. Non è rimasto niente.';
     return t;
   case 'mutazione':
     if(t.indexOf('funghi')>=0||t.indexOf('Funghi')>=0) return 'I funghi brillano e prosperano nella radiazione, come se il sasso li nutrisse.';
     if(t.indexOf('muschio')>=0||t.indexOf('Muschio')>=0) return 'Il muschio, vicino al sasso, ha cominciato a fare luce da solo.';
     return 'Una pianta cresce in forme strane vicino al meteorite. Sembra cercare qualcosa.';
   case 'azione':
     if(t.indexOf('pulito')>=0) return 'Passi il dito sul vetro: la condensa si apre come una finestra.';
     if(t.indexOf('acqua')>=0) return 'Un filo d’acqua scivola tra le radici. Il vaso beve.';
     if(t.indexOf('nutrito')>=0) return 'Spargi un po’ di terra buona. Qualcuno, sotto, ringrazia.';
     if(t.indexOf('spostato')>=0) return 'Sposti il vaso. La luce cambia faccia.';
     if(t.indexOf('protetto')>=0) return 'Apri una piccola bolla di vetro attorno al mutante. Il resto aspetta.';
     if(t.indexOf('rimosso')>=0) return 'Allontani il mutante dal gruppo. Il sasso continua a battere, paziente.';
     if(t.indexOf('separato')>=0) return 'Metti un foglio tra i due popoli. La guerra si ferma, per ora.';
     return t;
   case 'cultura': return t;
  } return t; }
// ---------- osservare (zoom guidato) ----------
function osserva(v,seed){ const soc=v.sp.find(x=>x.alive&&x.society), mon=v.sp.find(x=>x.alive&&x.monster), al=v.sp.filter(x=>x.alive);
  if(v.wars.length) return {focus:{kind:'centro'},text:'Ti avvicini al vetro. Due fazioni si fronteggiano, ferme, a un passo l’una dall’altra. Nessuno vuole cedere per primo.'};
  if(soc) return {focus:{kind:'specie',id:soc.id},text:pick(['Ti avvicini. Sul terreno ci sono segni che sembrano strade, e in fondo una piccola costruzione di terra. Qualcuno ha cominciato a raccontare storie.','Una fila ordinata si muove verso il centro del vaso. '+ag(soc.nome,'Ognuna porta qualcosa. Nessuna ti guarda, ma tutte sanno','Ognuno porta qualcosa. Nessuno ti guarda, ma tutti sanno')+' che ci sei.'],seed)};
  if(mon) return {focus:{kind:'specie',id:mon.id},text:'La creatura più grande occupa quasi metà del vetro. Quando ti avvicini, si ferma. Ti guarda. Poi riprende a mangiare.'};
  if(v.E>70) return {focus:{kind:'meteorite'},text:'Il sasso batte forte. Le crepe viola pulsano a ritmo con qualcosa che non è nel vaso, ma dentro di te.'};
  if(al.length){ const x=pick(al,seed); const mu=x.mut.length; return {focus:{kind:'specie',id:x.id},text:mu?cap(the(x.nome))+' si muovono con più sicurezza di prima. '+(x.mut.includes('radioattivo')?'Hanno un alone verde, appena visibile: la luce del sasso non li disturba più.':x.mut.includes('gigantismo')?'Hanno un passo pesante, nuovo.':'Qualcosa in loro è cambiato.'):'Ti avvicini a guardare '+the(x.nome)+'. Esplorano il muschio, una briciola alla volta, senza fretta.'}; }
  return {focus:{kind:'meteorite'},text:'Il sasso batte piano. Il vaso è quieto, come in attesa di qualcuno.'}; }
// ---------- voce ambientale ----------
function ambient(v,night,seed){ const p=[]; const nd=v.needs; if(!v.sp.length&&!v.setup.piante.length) return pick(['Il sasso batte, solo, nel barattolo vuoto.','Un filo di luce attraversa il vetro. Dentro non c’è ancora niente.','Il vuoto, qui dentro, ha un suono: è il battito.'],seed); if(nd){ if(nd.um<.28) return 'Le foglie si arricciano: qualcuno ha sete.'; if(nd.ter<.15) return 'Il terreno è grigio e stanco.'; if(nd.pul<.4) return 'Il vetro è appannato di sporco e la muffa avanza.'; }
  if(v.wars.length) p.push('Nessuno dorme, nel vaso.','Il cibo è poco e le voci si alzano.');
  if(v.sp.some(x=>x.society&&x.alive)) p.push('Qualcuno, laggiù, ha cominciato a raccontare storie.','Sul muschio ci sono tracce che sembrano strade.');
  if(v.sp.some(x=>x.monster&&x.alive)) p.push('Il vetro è sempre più vicino.');
  if(v.E>70) p.push('Il sasso batte forte. Tutto il vaso lo sente.'); else if(v.E<30) p.push('Il sasso è quasi quieto. Dorme.');
  if(v.vit<40) p.push('Le foglie sono stanche.'); if(v.muffa>.5) p.push('Una macchia grigia cresce sul vetro.');
  if(v.setup.luce===2) p.push('Il sole scalda il vetro. Il sasso sembra più sveglio.','Il barattolo chiuso al sole è una serra: dentro fa più caldo che nella stanza.'); if(v.setup.luce===0) p.push('L’ombra è fresca e lenta.');
  if(nd&&nd.um>.85) p.push('Il vetro è velato dall’interno: l’acqua sale dalla terra e si posa dove fa più fresco.','Una goccia scende dal tappo e cade sul muschio. Qui dentro piove da solo.');
  if(night) p.push('Al buio le crepe del sasso brillano, appena.','Fuori dal vetro, un grillo continua a cantare.');
  p.push('Una goccia scivola lungo il vetro.','Qualcosa si muove sotto il muschio.','Il tempo, qui dentro, passa in un altro modo.');
  return pick(p,seed); }
// ---------- pagine del quaderno ----------
const PAG={
 inizio:['Il primo giorno','Ho guardato il barattolo tutto il giorno. Non succede niente, ma il sasso batte. Credo che aspetti qualcosa. Forse aspetta me.'],
 mutazione:['Qualcosa è cambiato','Oggi una creatura era diversa. Non so spiegarlo: aveva un altro modo di camminare. Il sasso batteva più forte, come il mio cuore dopo una corsa.'],
 societa:['Hanno un nome per le cose','Non camminano più a caso. Costruiscono, si dividono i compiti. E quando passo vicino al vetro si fermano. Credo che mi vedano.'],
 guerra:['Litigano','Due popoli nello stesso barattolo. Io non volevo. Pensavo che un mondo piccolo fosse più facile di uno grande.'],
 mostro:['Troppo grande','Una creatura ha preso più posto del dovuto. Quando la guardo dal vetro, mi guarda anche lei. Devo aver sbagliato qualcosa. O forse no.'],
 spento:['Silenzio','È tutto fermo. Ho tenuto il coperchio chiuso un giorno intero, come se aspettassi. La mamma dice che anche i mondi piccoli finiscono. Ne farò un altro.'],
 pace:['La moneta in mezzo','Si sono fermati. Hanno messo la moneta tra loro. Non sapevo che una cosa così piccola potesse tanto.'],
 scisma:['Metà e metà','Metà vuole inginocchiarsi, metà vuole misurare. Per la prima volta ho capito che una cosa sola può dividere un mondo.'],
 biscotto:['Biscotto','Biscotto vuole sempre salire dove non deve. Oggi ha allungato la zampa verso il barattolo, ma non l’ha toccato. Ho trattenuto il respiro lo stesso.']
};
// ---------- diario: una pagina ogni 3–4 giorni di vaso, legata a ciò che succede ----------
// diario(view, G) → {id, titolo, testo} | null. Restituisce una pagina solo se l'ultima pagina del quaderno ha almeno 3 giorni
// e non ripete mai un id già scritto. Le pagine con una condizione vengono prima di quelle generiche.
const DIARIO=[
 {id:'diario-terra',t:'Terra e acqua',c:v=>v.setup.piante.length>0,x:'Ho messo la terra e l’acqua. Il vetro si è appannato subito, come quando respiro sulla finestra. Sotto, il sasso batte.'},
 {id:'diario-vetro',t:'Il vetro bianco',c:v=>v.needs&&v.needs.um>.5,x:'Ho capito una cosa: il vetro si appanna quando fuori fa più freddo che dentro. Di mattina è una finestra bianca, di pomeriggio torna chiaro.'},
 {id:'diario-formiche',t:'Le formiche',c:v=>vivo(v,'formiche'),x:'Ho contato le formiche: sette. Poi otto. Poi ho perso il conto. Vanno sempre dallo stesso lato del sasso.'},
 {id:'diario-muschio',t:'Il muschio',c:v=>pianta(v,'muschio'),x:'Ho toccato il muschio con un dito. È freddo, e se lo premo l’acqua esce come da una spugna. Dentro vive qualcuno di piccolissimo.'},
 {id:'diario-sole',t:'Troppo sole',c:v=>v.setup.luce===2,x:'Il barattolo al sole scottava. Il sole entra nel vetro e non riesce più a uscire. Il muschio ha le punte marroni.'},
 {id:'diario-ombra',t:'All’ombra',c:v=>v.setup.luce===0,x:'All’ombra il vaso è lento. Il sasso batte piano, come se dormisse. Mi piace, ma mi chiedo cosa si perde.'},
 {id:'diario-sete',t:'Ho dimenticato',c:v=>v.needs&&v.needs.um<.35,x:'Oggi le foglie pendevano. Ho dimenticato l’acqua. Nessuno mi ha sgridato, ma il vaso era più silenzioso.'},
 {id:'diario-ristagno',t:'Troppa acqua',c:v=>v.needs&&v.needs.um>.9,x:'Ho dato troppa acqua. In fondo, tra i sassolini, c’è una pozza ferma. La nonna dice che anche le radici devono respirare.'},
 {id:'diario-muffa',t:'La muffa',c:v=>v.muffa>.4,x:'Sul vetro c’è una macchia grigia. È muffa: nasce dove è umido e fermo. Devo pulire prima che arrivi alle foglie.'},
 {id:'diario-collemboli',t:'Puntini bianchi',c:v=>(v.bio?v.bio.collemboli>=20:v.muffa>.3),x:'Con la lente ho visto puntini bianchi che saltano. Si chiamano collemboli e mangiano la muffa. Il vaso si pulisce anche da solo.'},
 {id:'diario-regina',t:'La regina',c:v=>v.bio&&v.bio.formiche&&v.bio.formiche.regina&&v.bio.formiche.covata.uova>=2,x:'Con la lente ho visto la regina: è molto più grande delle altre. Le operaie le portano da mangiare, e dietro di lei ci sono mucchietti di uova bianche. Senza di lei il nido non crescerebbe.'},
 {id:'diario-senza-regina',t:'Il nido senza regina',c:v=>v.bio&&v.bio.formiche&&!v.bio.formiche.regina,x:'Non trovo più la regina. Le formiche camminano in fretta, senza uova da curare. Se non ne arriva un’altra, il nido si svuoterà piano.'},
 {id:'diario-sciame',t:'Ali sul vetro',c:v=>v.bio&&v.bio.termiti&&v.bio.termiti.fondati>0,x:'Dopo l’umido sono uscite le termiti con le ali, a centinaia. Sbattevano sul vetro. Poi le ali sono cadute come petali, e due di loro hanno scavato un nido nuovo.'},
 {id:'diario-larve',t:'Vermetti bianchi',c:v=>v.bio&&v.bio.mosche&&v.bio.mosche.larve>=6,x:'Nel marcio ci sono vermetti bianchi: sono le larve delle mosche. Sembrano inutili, ma ragni e coleotteri le aspettano.'},
 {id:'diario-sasso',t:'Il sasso acceso',c:v=>v.E>60,x:'Stasera ho spento la luce e le crepe del sasso erano accese. Viola. Ho messo la mano sul vetro: era tiepido.'},
 {id:'diario-tanti',t:'Coinquilini',c:v=>v.sp.filter(x=>x.alive).length>=2,x:'Adesso nel vaso sono in tanti. Ognuno ha il suo angolo. Mi chiedo se sanno degli altri, o se ognuno si crede solo.'},
 {id:'diario-oggetto',t:'Un pezzo di cielo',c:v=>v.setup.oggetti.length>0&&v.sp.some(x=>x.alive),x:v=>'Hanno trovato '+(OGG_BREVE[v.setup.oggetti[0]]||'la mia cosa')+'. Ci girano intorno ogni giorno. Per me era una cosa da tasca. Per loro è un pezzo di cielo.'},
 {id:'diario-mutanti',t:'Diversi',c:v=>v.sp.some(x=>x.alive&&x.mut.length),x:'Alcuni sono cambiati. Non so se è colpa del sasso o mia. La nonna dice che chi cambia non è sbagliato: è nuovo.'},
 {id:'diario-nome',t:'Un nome per me',c:v=>!!popolo(v),x:'Credo che mi abbiano dato un nome. Quando passo davanti al vetro si fermano tutti insieme. Ho fatto finta di niente.'},
 {id:'diario-statuina',t:'La faccia di pietra',c:v=>!!popolo(v)&&v.setup.oggetti.includes('statuina'),x:'Stanno grattando la statuina. Piano, ogni giorno un po’. Oggi ho visto il naso. Somiglia al mio.'},
 {id:'diario-guerra',t:'Il rumore',c:v=>v.wars.length>0,x:'Stanotte ho sentito colpi piccoli contro il vetro. Volevo separarli con un dito. Non so se è giusto entrare in una guerra non mia.'},
 {id:'diario-gigante',t:'Il più grande',c:v=>v.sp.some(x=>x.alive&&x.monster),x:'Uno è diventato enorme. Quando apro il tappo alza la testa. Ho chiuso piano, senza farmi vedere.'},
 {id:'diario-biscotto',t:'Biscotto e io',c:(v,G)=>!!(G&&G.ui&&G.ui.gattoF),x:'Biscotto dorme sulla sedia e ogni tanto apre un occhio verso il barattolo. Forse è geloso. O forse fa la guardia.'},
 {id:'diario-nonna',t:'Pioggia in casa',da:6,x:'La nonna dice che un barattolo chiuso fa piovere da solo: l’acqua sale, tocca il vetro e ricade. Non ci credevo. Stamattina pioveva.'},
 {id:'diario-domande',t:'Domande',da:10,x:'Mi chiedo se di notte sognano. Se il sasso, per loro, è il sole. Se sanno che il mondo finisce al vetro.'},
 {id:'diario-mese',t:'Un mese',da:28,x:'È passato un mese di vaso. Ho sempre un po’ di terra sotto le unghie. La mamma ride e dice che ho le mani da giardino.'},
 {id:'diario-niente',t:'Niente di speciale',x:'Oggi non è successo niente. Ho guardato lo stesso, per un’ora. Una goccia è scesa lungo il vetro, poi un’altra. Mi bastava.'},
 {id:'diario-buio',t:'Dal letto',da:14,x:'Di notte ho aperto gli occhi e il barattolo brillava appena. L’ho guardato dal letto finché gli occhi non si sono chiusi da soli.'},
 {id:'diario-lontano',t:'Se parto',da:20,x:'Ho chiesto alla mamma cosa succede se vado via qualche giorno. Lei dice che il vaso si addormenta e aspetta. Come i semi d’inverno.'}];
function diario(v,G){ try{ if(!v||!G) return null; const q=G.quaderno||[]; const last=q.reduce((a,p)=>Math.max(a,p.d||0),-99); if(v.d-last<3) return null;
  const used={}; q.forEach(p=>used[p.id]=1);
  for(const p of DIARIO){ if(used[p.id]||v.d<(p.da||0)) continue; let ok=true; try{ ok=!p.c||!!p.c(v,G); }catch(e){ ok=false; } if(ok) return {id:p.id,titolo:p.t,testo:typeof p.x==='function'?p.x(v):p.x}; }
  return null; }catch(e){ return null; } }
const MITO={sacro:'Hanno trovato un volto di pietra e ci hanno grattato sopra un’altra faccia: la tua. Da allora ogni sera la salutano.',sapere:'Hanno contato i battiti del sasso e ne hanno fatto un calendario. Dicono che il tempo, finalmente, ha un padrone.',commercio:'Hanno scoperto che due briciole valgono più di una. Da quel giorno non si sono più fermati.',gioco:'Hanno trovato una cosa morbida e colorata e ci hanno ballato intorno. Non l’hanno più lasciata.',mistero:'Hanno visto sé stessi nel vetro dello specchio e hanno pensato: siamo di più di quanto credevamo.',comunicazione:'Di notte, in silenzio, hanno sentito una voce lontana. Non sanno di chi sia. Rispondono lo stesso.',fuoco:'Hanno portato una scintilla in fondo al muschio. Quella luce non si è più spenta.',agricoltura:'Hanno capito che i funghi crescono dove qualcuno li cura. Da allora qualcuno li cura.',tribale:'Non hanno niente da adorare, e questo li ha resi vicini. Hanno nomi per ogni cosa, tranne per te.'};
const EPI={
 equilibrio:'Ho guardato il barattolo per settimane. Non è successo niente di grande, e forse è questo il bello: ogni sera il muschio respira, e io respiro con lui.',
 spento:'Si è spento tutto. Ho tenuto il coperchio chiuso un giorno intero, come se aspettassi. La mamma dice che anche i mondi piccoli finiscono. Io ne farò un altro.',
 gigante:'Una sola creatura ha preso tutto il posto. Quando la guardo, mi guarda. Non so se ha fame o se vuole uscire.',
 tribu:'Hanno un nome per ogni cosa, ma niente da adorare. Sembrano felici lo stesso, o almeno sembrano insieme.',
 fede:'Hanno grattato la statuina finché non ha preso la mia faccia. Ogni sera la guardano, poi guardano il vetro. Pregano me.',
 accademia:'Segnano ogni battito del sasso, uno dopo l’altro. Hanno scoperto che il sasso batte ogni quarantasette secondi. Dicono che è un messaggio.',
 mercato:'Si scambiano briciole e fili d’erba usando la moneta come misura di tutto. Ho provato a spiegare che non vale niente. Mi hanno risposto con un prezzo.',
 carnevale:'Il giocattolo è diventato la loro piazza. Ogni sera c’è una festa che dura finché il vetro non si appanna.',
 mistero:'Si fermano davanti allo specchio e si salutano. Credo che pensino che dall’altra parte ci sia una colonia più grande.',
 voci:'Di notte fanno silenzio e ascoltano la radio. Dicono che da lontano qualcuno parla. Io non sento niente, ma ormai ci credo anch’io.',
 fiamma:'La candela non la spegne nessuno. Fanno i turni per vegliarla, come se fosse il cuore di tutto. Forse lo è.',
 giardinieri:'Hanno imparato a coltivare i funghi nel muschio. Ho scoperto che mangiano meglio di me.',
 scisma:'Metà vuole inginocchiarsi, metà vuole misurare. Per la prima volta ho capito che una cosa sola può dividere un mondo.',
 conquista:'Qualcuno ha vinto. Il vaso è più silenzioso e più grande, ma non so se è meglio.',
 patto:'Hanno messo la moneta tra loro e hanno smesso di combattere. Non sapevo che una cosa così piccola potesse fare tanto.'};
function epilogo(k,culto){ let t=EPI[k]||''; if(k==='fede') return t+(culto==='meteorite'?' Quando il sasso batte, però, si girano verso di lui.':' Non so cosa mi chiedono. Torno ogni sera, perché mi aspettano.'); if(T.FINALI[k]&&T.FINALI[k].fam==='Società'){ if(culto==='giocatore') t+=' Dicono che qualcuno li guarda da fuori. Hanno ragione.'; else if(culto==='meteorite') t+=' Dicono che il sasso batte per loro. Forse ha ragione.'; } return t; }
// ---------- «La Fede»: sceneggiatura del finale animato (DECISIONI §2) ----------
// Per app/finali.js. Ogni scena: s = secondi, vedi = cosa si vede, testo = a schermo, suono, nodi = quali nodi di G.tree mostrare.
const FILM_FEDE=[
 {s:4,vedi:'Il vaso al buio, da lontano. Solo le crepe del sasso, viola, respirano.',testo:'All’inizio c’era solo un sasso che batteva.',suono:'battito lento, stanza silenziosa',nodi:['inizio']},
 {s:5,vedi:'Le foto dell’albero scorrono come pagine: la terra, il muschio, i primi arrivi.',testo:'Poi è arrivata la tua mano, con la terra e l’acqua.',suono:'acqua versata, carillon lontano',nodi:['nasce','pianta']},
 {s:5,vedi:'Il popolo in fila verso il centro. La statuina appare tra il muschio, ancora grezza.',testo:'Loro hanno trovato un volto di pietra.',suono:'ronzio del popolo, un colpo sordo',nodi:['popolo','oggetto']},
 {s:7,vedi:'Macro sulla statuina: piccoli segni la grattano. Naso, frangetta, gli occhi. Diventa la tua faccia.',testo:'E l’hanno scolpito a tua immagine.',suono:'grattare minuto, ritmico, come pioggia fine',nodi:['cultura']},
 {s:6,vedi:'Le scelte dell’albero si accendono una a una, la strada non presa sfuma.',testo:'Ogni cura, ogni notte, ogni scelta: l’hanno vista tutte.',suono:'note singole, una per nodo',nodi:['scelta','muta','gatto']},
 {s:6,vedi:'Il popolo si gira verso il vetro. Dietro il vetro, sfocato, il tuo riflesso.',testo:'Per loro il gigante che li cura ha un nome. Il tuo.',suono:'coro piccolissimo, il battito si allinea',nodi:['capitolo']},
 {s:5,vedi:'Il vaso intero sulla scrivania, alba. La statuina al centro, le file intorno.',testo:'Fino a quando guarderai, loro guarderanno te.',suono:'battito che sfuma, un uccello fuori',nodi:[]}];
// ---------- letargo (DECISIONI §1): testi per l’assenza ----------
const LETARGO={
 titolo:'Il vaso dorme',
 entrata:'Il vaso si addormenta. Le foglie si chiudono, il sasso batte piano. Ti aspetterà.',
 sonno:'Il vaso dorme. Basta una cura per svegliarlo.',
 risveglio:'Al tuo tocco il vaso si sveglia. Una goccia scivola, qualcuno si stira sotto il muschio.',
 perche:'Il tappo era chiuso: l’acqua è salita sul vetro ed è ricaduta, come pioggia. Non è morto niente.'};
// ritorno dopo l’assenza: L = G.letargo ({da, giorni})
function letargo(L){ const g=(L&&L.giorni)|0;
  if(g<=1) return 'Un giorno senza di te. Il vaso ha dormito e ti ha aspettato. '+LETARGO.perche;
  if(g<7) return g+' giorni senza di te. Il vaso si è addormentato e ti ha aspettato. '+LETARGO.perche;
  return 'Tanti giorni senza di te. Il vaso ha dormito sotto un velo di condensa. Qualcuno è calato, nessuno è sparito.'; }
// ---------- power card «Salta 2 giorni» ----------
// SALTO_NO[why] per i 5 blocchi di __app.powerCards().why; SALTO_DONO(n) per il toast del dono; SALTO_FATTO dopo l’uso.
const SALTO_NO={
 carte:'Le carte sono finite. Domani, sul comodino, ne trovi due nuove.',
 inizio:'Il vaso è appena nato. Prima riempilo, poi il tempo potrà correre.',
 letargo:'Il vaso dorme. Sveglialo con una cura, poi salta.',
 finale:'Il vaso ha trovato la sua strada. Prima chiudi il capitolo.',
 decisione:'Qualcosa nel vaso aspetta una tua decisione.'};
const SALTO_DONO=n=>!(n>0)?'':n===1?'Sul comodino trovi una notte di scorta.':'Sul comodino trovi '+n+' notti di scorta.';
const SALTO_FATTO='Chiudi gli occhi. Quando li riapri, nel vaso sono passati due giorni.';
// ---------- atti ----------
function atto(v){ if(v.finalePending) return {n:4,t:'Il destino',x:'Il vaso ha trovato la sua strada. Manca solo da decidere se chiudere il capitolo.'};
  if(v.sp.some(x=>x.society)) return {n:3,t:'Il popolo',x:'Qualcuno, nel vaso, ha cominciato a raccontare storie. Resta a guardare cosa ne fanno.'};
  if(v.sp.some(x=>x.mut.length)) return {n:2,t:'Qualcosa cambia',x:'Il sasso sta cambiando chi lo tocca. Nessuno sa ancora dove porta.'};
  return {n:1,t:'Il sasso che batte',x:'Il meteorite è appena arrivato. Il vaso si sta svegliando: osserva, cura, aspetta.'}; }
function biscotto(){ return {intro:'Un’ombra sul muro. Poi una zampa sul coperchio. Biscotto ha deciso che il barattolo è suo.',pallina:'Biscotto insegue la pallina e dimentica il vaso. Tu respiri.',pallinaNo:'Biscotto ignora la pallina e dà una zampata al coperchio.',davanzale:'Sposti il vaso sul davanzale, fuori portata. Qui il sole è più forte: il sasso lo sente.',ok:'Il vaso è salvo. Per questa volta.',male:'Il barattolo cade sul ripiano. Non si rompe, ma il vetro si scheggia: per qualche giorno entrerà meno luce.'}; }
// ---------- tempo, mani, calendario, fine del vaso (bozze in seconda persona; motore + storia) ----------
// Ritorno e dono della nonna (docs/CONTRATTI.md «Ritorno…»). Seconda persona, mai un obbligo.
const RITORNO={notti:n=>n===1?'È passata una notte.':'Sono passate '+n+' notti.',titolo:'Mentre non c’eri',buongiorno:'Buongiorno',guarda:'Guarda il vaso',salta:'Salta due giorni',saltaCariche:'Non hai più salti: domani ne arrivano due, o li compri con le gocce.',saltaDone:'Due notti passano. Il sasso batte, il muschio respira.',dono:'Sul davanzale'};
// Missioni (seconda persona, gentili: niente scadenze). Le gocce sono «gocce di rugiada».
const MISS={art:{coleotteri:'i',ragni:'i'},gocce:'gocce di rugiada',titolo:'Missioni',riposo:'Per oggi basta così: domani arrivano missioni nuove.',vuoto:'Per ora nessuna missione: il vaso deve prima riempirsi.',cambia:'Cambia',cambiata:'Una missione non era più possibile: ne è arrivata un’altra.',fatta:'Missione compiuta',tocca:'tocca Riscuoti',riscuoti:'Riscuoti',completata:'Completata',riscosse:g=>'Hai riscosso '+g+(g===1?' goccia':' gocce')+'.',guarda:'Guarda le missioni',
  spendi:{salto:'Un salto in più',carta:'Pesca una carta',nonna:'Un altro dono della nonna'},spendiSotto:{salto:'Due giorni in un tocco, quando vuoi.',carta:'Una carta del mazzo, una al giorno.',nonna:'Un secondo regalo sul davanzale, oggi.'},ok:{salto:'Hai un salto in più da usare.',carta:'Una carta nuova ti aspetta.',nonna:'La nonna ha lasciato qualcosa.'},no:{gocce:'Ti servono ancora un po’ di gocce.',tetto:'Ne hai già abbastanza da parte.',oggi:'Per oggi basta così: domani si può ancora.',inizio:'Il vaso deve prima riempirsi.'},cambiaCosto:n=>'Cambia · '+n+(n===1?' goccia':' gocce'),
  grandi:[{t:'Cinque giorni con il vaso',s:'Una cura in cinque giorni diversi. Niente fretta: i giorni si sommano, non si perdono.',f:'Passa a trovare il vaso in cinque giorni diversi. Basta una cura, quando vuoi tu.'},
    {t:'Cinque giorni di sguardi',s:'Osserva il vaso in cinque giorni diversi. I giorni si sommano.',f:'Fermati a guardare il vaso in cinque giorni diversi. Ogni giorno ti mostra qualcosa.'},
    {t:'Quattro giorni di salti',s:'Lascia passare il tempo in quattro giorni diversi.',f:'Lascia che il vaso viva quattro giorni diversi. Il tempo lavora per te.'}],
  altre:'Le prossime arrivano col tempo.',nuova:'Una nuova missione',falla:'Fallo ora',dopo:'Più tardi',fallo:'Fallo',piu:'In più giorni',tutte:'Le tue missioni',chiudi:'Chiudi',
  guida:{acqua:'Tocca Acqua',pulisci:'Tocca Pulisci',nutri:'Tocca Nutri',notte:'Tocca la clessidra per saltare due giorni',tocca:'Tocca le creature nel vaso',attendi:'Basta aspettare: ci pensa il tempo.',quaderno:'Guarda nel quaderno.'},
  vivi:{t:(n,a)=>'Tieni in vita '+a+' '+n+' per 3 giorni',s:'Basta che ci siano ancora, giorno dopo giorno.',f:(n,a)=>'Resta accanto '+prep('a',a+' '+n)+' per tre giorni. Non devi fare altro che esserci.'},
  pota:{t:'Pota la felce prima che copra il muschio',s:'Quando la felce cresce troppo, compare il tasto Pota.',f:'Una fronda sta per toccare il vetro. Prendi le forbici e falla tornare al suo posto.'},
  osserva:{t:(n,a)=>'Osserva da vicino '+a+' '+n,s:'Tocca Osserva mentre sono nel vaso.',f:(n,a)=>'Avvicinati al vetro: '+a+' '+n+' hanno qualcosa da farti vedere.'},
  umidita:{t:'Tieni l’umidità giusta per 2 giorni',s:'Né secco né zuppo. I giorni buoni si sommano.',f:'Senti l’aria del vaso: né secca né zuppa. Tienila così per due giorni.'},
  fungo:{t:'Fai crescere un fungo',s:'Accogli quello che bussa e tienilo umido.',f:'Nel terriccio c’è spazio per un fungo. Tienilo umido e vedrai.'},
  muta:{t:'Trova una mutazione',s:'Succede nei vasi in salute. Non ha fretta.',f:'Il sasso lavora piano. Cerca qualcuno che sia cambiato.'},
  cure:{t:'Dedica tre cure al vaso',s:'Acqua, terra o vetro: come preferisci.',f:'Dedica tre piccole cure al vaso: acqua, terra o vetro, come preferisci.'},
  vetro:{t:'Pulisci il vetro appannato',s:'Tocca Pulisci.',f:'Il vetro si è appannato e non vedi bene. Passaci sopra uno straccio.'},
  acqua:{t:(n,a,x)=>x==='felce'?'Dai acqua alla felce che appassisce':'Dai acqua al terriccio asciutto',s:'Tocca Acqua.',f:(n,a,x)=>x==='felce'?'Le fronde della felce si piegano. Dalle un po’ d’acqua.':'Il terriccio è asciutto. Una goccia fa bene a tutti.'},
  tocca:{t:(n,a)=>'Tocca 3 volte '+a+' '+n,s:'Toccale nel vaso: si fanno riconoscere.',f:(n,a)=>'Tocca '+a+' '+n+' nel vaso, tre volte. Ti riconosceranno.'},
  dormi:{t:'Usa un salto e guarda cosa cambia',s:'Tocca la clessidra e poi osserva il vaso.',f:'Lascia passare due giorni e guarda cosa cambia al mattino.'},
  arrivo:{t:'Accogli un nuovo ospite',s:'Quando qualcuno bussa, apri.',f:'Qualcuno bussa al vetro. Apri e accoglilo.'}};
const NONNA=[
 {id:'acqua',ic:'🥛',t:'Sul davanzale c’è un bicchiere d’acqua. L’ha lasciato la nonna: «Per le tue piante».'},
 {id:'terra',ic:'🍂',t:'Qualcuno ha lasciato una manciata di foglie secche accanto al vaso. Faranno da nutrimento.'},
 {id:'latte',ic:'☕',t:'C’è una tazza di latte caldo sul davanzale. Con quella, le mani si rimettono in moto.'},
 {id:'biscotto',ic:'🍪',t:'La nonna ha lasciato un biscotto per Biscotto. Per un po’ sarà il gatto più buono della casa.'},
 {id:'spago',ic:'🧶',t:'Un pezzo di spago, lasciato lì da qualcuno. Non serve a niente, ma ti fa sentire a casa.'}];
const TEMPO={
 prossima:ore=>ore<=0?'La prossima notte sta arrivando.':ore===1?'La prossima notte arriva tra un’ora.':'La prossima notte arriva tra '+ore+' ore.',
 prossimaAlle:h=>'La prossima notte arriva alle '+h+'.',
 notteOra:'Mentre guardavi, nel vaso è scesa la notte. Poi è tornato il giorno.',
 nottiOra:n=>'Mentre non guardavi, nel vaso sono passate '+n+' notti.',
 maniZero:'Hai le mani piene di terra. Il vaso sta bene: aspetta un po’.',
 maniGratis:'Hai le mani stanche, ma il vaso ha bisogno: lo curi lo stesso.',
 troppaAcqua:'Troppa acqua: il vetro si appanna e l’acqua cola sul fondo.',
 salto2:'Chiudi gli occhi. Quando li riapri, nel vaso sono passati due giorni.',
 saltiOggi:n=>n===1?'1 notte saltata oggi':n+' notti saltate oggi',
 letargoCal:'Il vaso dormiva: quel giorno non sei venuto.',
 risveglioCal:'Il vaso si è svegliato con la tua prima cura.',
 giornoVaso:(v,d)=>(v>1?'Vaso '+v+' · ':'')+'Giorno '+d+' del vaso',
 chiudiConferma:'Il vaso si addormenterà per sempre. Il sasso resta con te.',
 chiudiBottone:'Chiudi il capitolo',
 nuovoVaso:n=>'Svuoti il barattolo nel giardino, piano. Sul fondo resta solo il sasso, e batte. Vaso '+n+': si ricomincia dalla terra.',
 nuovoVasoTitolo:'Il vaso ricomincia dal sasso',
 ricomincia:'Ricomincia: metti la terra',
 eredita:{Quiete:'La terra nuova è già un po’ umida: il vaso di prima le ha lasciato il suo respiro.','Mostri':'Il sasso batte forte fin dal primo giorno: ricorda il gigante.','Società':'Sul tavolo, la prima cosa che troverai sarà quella che il popolo adorava.',Conflitti:'Chi arriverà per primo, arriverà in fretta: il vaso di prima ha insegnato la fretta.'},
 mensola:(n,nome,giorni)=>'Vaso '+n+' · '+nome+' · '+giorni+(giorni===1?' giorno':' giorni')+' nel vaso'};
const CAL={inizio:'Il vaso comincia',nasce:'Qualcuno arriva',estinta:'Non ne resta nessuna',muta:'Qualcuno cambia',popolo:'Nasce un popolo',cultura:'Il popolo cambia idea',mostro:'Nasce un gigante',guerra:'Scoppia una guerra',pace:'Torna la pace',pianta:'Cresce una pianta',oggetto:'Una cosa dal tavolo',scelta:'Hai scelto',carta:'Hai giocato una carta',gatto:'Biscotto',capitolo:'Un finale',pagina:'Hai scritto nel quaderno',letargo:'Il vaso dormiva',risveglio:'Il vaso si è svegliato',salto:'Hai saltato due giorni',vaso:'Un vaso nuovo'};
// ---------- Oggi: biglietto di domani, Lente, Atlante, festa del popolo, cosa portare nel vaso nuovo (docs/CONTRATTI.md «Atlante, biglietto, Lente, festa, eredità»). Seconda persona, gentile: nessuna scadenza, nessun «hai perso». ----------
const OGGI={titolo:'Oggi',nuovo:'Nel quaderno c’è qualcosa di nuovo',
  bigl:{titolo:'Il biglietto di domani',sera:'Scrivi che cosa pensi che succeda nel vaso.',scritto:'Hai scritto: «{t}». Domani lo vedrai.',vero:'Il tuo biglietto: «{t}». È successo.',altro:'Il tuo biglietto: «{t}». Il vaso ha preso un’altra strada.',aspetta:'Il vaso ha bisogno di qualche giorno prima di darti spunti.',scrivi:'Scrivilo',goccia:'+1 goccia',
    t:{pop:n=>'Domani ci saranno più '+n+'.',regina:()=>'Domani la regina deporrà altre uova.',collemboli:()=>'Domani i collemboli saranno di più.',pianta:a=>'Domani '+a+' starà meglio.',umido:()=>'Domani la terra sarà ancora umida.',muta:()=>'Domani qualcuno sarà cambiato.',arrivo:()=>'Domani arriverà qualcuno.',quieto:()=>'Domani il vaso resterà tranquillo.'},
    art:{muschio:'il muschio',felce:'la felce',succulenta:'la succulenta',fungo:'il fungo',carnivora:'la pianta carnivora'}},
  lente:{titolo:'La Lente',sotto:'Scegli una creatura e guardala da vicino per due giorni.',inCorso:'Stai guardando da vicino: {n}.',mancano:n=>n<=1?'ancora una notte':'ancora '+n+' notti',pronta:'La scheda è pronta',guarda:'Guarda la scheda',scegli:'Guarda da vicino',nessuna:'Nel vaso non c’è ancora nessuna creatura da guardare.',aspetta:'Oggi hai già guardato da vicino. Domani un’altra.',fatta:'scheda nell’Atlante',chiudi:'Nell’Atlante',kicker:'Con la Lente',visto:{
      su:(a,b)=>'Quando hai cominciato erano '+a+', ora sono '+b+'.',giu:(a,b)=>'Quando hai cominciato erano '+a+', ora sono '+b+': a volte il vaso rallenta.',pari:b=>'Sono rimaste circa '+b+': un vaso in equilibrio.',via:()=>'Ora non ce n’è più nessuna, ma ricordi com’erano.'}},
  atlante:{titolo:'Atlante del vaso',sotto:'Ogni cosa che scopri nel vaso, con un fatto vero.',nuova:'Una pagina nuova nell’Atlante',ignoto:'Non l’hai ancora incontrato.',ignotoSch:'Guardala da vicino con la Lente per aprire la sua scheda.',rango:['Curioso','Osservatore','Naturalista','Esploratore del vaso'],sez:{sp:'Creature',pl:'Piante',mu:'Mutazioni',ev:'Cose che succedono',sc:'Schede da vicino'}},
  ered:{titolo:'Una cosa da portare nel vaso nuovo',sotto:'Scegline una dal vaso che hai finito: partirà con te.',niente:'Niente, riparto dal sasso',pianta:'Una pianta',specie:'Una famiglia',oggetto:'Un oggetto',mutazione:'Un tratto addomesticato',
    testo:{pianta:n=>n+' del vecchio vaso: la porti con te, già radicata.',specie:n=>'Un gruppetto di '+n+' che conosce già il vetro.',oggetto:n=>n+' dal tavolo, ricordo del vaso di prima.',mutazione:(n,m)=>n+' con un tratto che hanno imparato a tenere: '+m+', più mansueto.'},
    pagina:{t:'Dal vaso di prima',x:n=>'Hai portato con te '+n+'. Il vetro nuovo non è più completamente vuoto.'},preso:'Hai con te qualcosa dal vaso di prima.',prossimo:'Arriverà con la prima creatura.'},
  festa:{titolo:'La festa del popolo',chiudi:'Resta a guardare',ric:{1:'ric_festa1',2:'ric_festa2',3:'ric_festa3'},
    t:{sacro:n=>'Una sera il vetro si riempie di piccole luci. '+n+' hanno portato la statuina in mezzo alla piazza e le girano intorno, piano. Senti un canto senza parole, fatto di zampette sul vetro.',
      sapere:n=>n+' hanno fermato tutto per ascoltare il tic tac. Una a una, contano i colpi insieme. Alla fine applaudono con le antenne.',
      commercio:n=>'In mezzo al vaso c’è un mercato che non c’era. '+n+' si scambiano briciole luccicanti, e per una volta nessuno litiga sul prezzo.',
      gioco:n=>n+' hanno trascinato il giocattolo sotto la luce e ci giocano, a turno. Qualcuna cade e ride. Dal vetro, il rumore è un brusio allegro.',
      mistero:n=>'Davanti allo specchio, '+n+' si mettono in fila. Ognuna si guarda per un attimo, poi si volta e sorride a quella dopo.',
      comunicazione:n=>'La radio crepita e '+n+' ballano al ritmo dei fruscii. Non è musica, ma a loro basta.',
      fuoco:n=>'La candela è spenta, ma '+n+' le stanno intorno come se brillasse. Ogni tanto una alza le zampe verso il soffitto, in silenzio.',
      agricoltura:n=>'I funghi sono in fiore, e '+n+' fanno un banchetto lungo il bordo del vetro. Per una notte non manca niente a nessuno.',
      guerra:n=>n+' hanno posato le armi per una sera. Si siedono tutte insieme, stanche e vive, a guardare la luce.',
      tribale:n=>n+' accendono una fila di puntini luminosi intorno al sasso e battono il ritmo con le zampe. Il sasso, per un po’, batte con loro.'},
    pagina:n=>'Oggi nel vaso c’è stata una festa. '+n+' hanno acceso piccole luci e ballato fino a notte. Io ho guardato, senza fare rumore.'},
  rangoRicordo:'ric_atlante'};
// Biglietti, Lente e Atlante: fatti biologici veri (docs/biologia/analisi-2026-10-29.md). Nelle schede: macro (come la vedi), tre fatti.
const SCHEDE={
 formiche:{macro:'Da vicino: antenne che tastano l’aria e mandibole che sollevano pesi molto più grandi di loro.',fatti:['Una colonia vive attorno a una regina: senza di lei le operaie non fanno nascere altre formiche.','Le operaie vivono mesi; la regina può vivere più di dieci anni.','Scavano gallerie e spostano la covata dove umidità e temperatura sono giuste.']},
 termiti:{macro:'Da vicino: corpo chiaro e molle, senza occhi che servano alla luce; vivono al buio.',fatti:['Mangiano cellulosa, cioè legno morto: ci riescono grazie a microbi, e alcune specie a funghi che coltivano.','Una volta l’anno le alate escono a sciamare per fondare nuove colonie; poi quasi tutte muoiono.','Soffrono molto il secco, per questo cercano il buio umido.']},
 mosche:{macro:'Da vicino: ali trasparenti con le nervature, occhi grandi rossi.',fatti:['Dall’uovo all’adulto passano circa dieci–quattordici giorni, a 25 gradi.','Le larve vivono nel terriccio e mangiano marcio e funghi; gli adulti bevono liquidi.','Una mosca depone tante uova: per questo il numero può esplodere e poi crollare.']},
 coleotteri:{macro:'Da vicino: le ali davanti sono diventate un guscio duro, le elitre, che protegge quelle di sotto.',fatti:['Molti coleotteri mangiano detriti e granaglie, altri cacciano gli afidi; pochissimi mangiano le felci.','Da larve vivono a lungo; da adulti, di solito per mesi.','Il guscio li protegge dai predatori e dal secco, ma li rende più pesanti.']},
 ragni:{macro:'Da vicino: otto zampe, otto occhi e un filo di seta che esce dal fondo della pancia.',fatti:['Sono predatori solitari: alcuni tessono una ragnatela-trappola, altri cacciano a vista.','Possono restare settimane senza mangiare.','Non toccano piante né marcio: vogliono solo prede vive.']},
 lumache:{macro:'Da vicino: la bava lucida lascia una scia, e le antenne lunghe portano gli occhi.',fatti:['La bava le fa scivolare e le protegge dal seccarsi.','Quando l’aria è troppo secca si chiudono nel guscio con un tappo di muco indurito, l’epifragma.','Mangiano foglie, marciume e muffa; a volte rosicchiano il guscio di altre lumache per prendere il calcio.']}};
const ATL={
 pl:{muschio:'Il muschio non ha vere radici: beve con le foglie e ama l’aria umida.',felce:'Le felci si riproducono con le spore, non con i semi.',fungo:'Il fungo che vedi è solo il frutto: il corpo vero è una rete di fili sotto terra, il micelio.',succulenta:'Conserva l’acqua nelle foglie: troppa acqua la fa marcire.',carnivora:'Prende dagli insetti l’azoto che la terra povera non le dà.'},
 mu:{gigantismo:'Gli insetti respirano con piccoli tubi, le trachee: per questo non diventano mai troppo grandi, e un gigante paga un prezzo.',radioattivo:'Alcuni animali resistono alle radiazioni perché riparano il DNA più in fretta. Nessuno emette radiazioni: la resistenza è l’unico tratto vero.',intelligenza:'Le formiche non diventano intelligenti da sole: la loro forza è lavorare in gruppo, e chi vive in gruppo impara.',corazza:'Un guscio più spesso protegge, ma pesa e costa energia a ogni muta.',velenoso:'Molte creature piccole hanno veleno e colori vivi che avvisano: «non mangiarmi».',iperfertilita:'Fare molte uova piccole funziona finché c’è cibo; poi il numero crolla.',bioluminescenza:'Alcuni funghi brillano davvero, con un orologio interno; gli insetti di casa quasi mai.'},
 ev:{regina:['La prima regina','Una colonia ha una regina che depone tutte le uova.'],covata:['La prima covata','Uova, larve e pupe stanno nel nido: vanno tenute al caldo e all’umido giusti.'],sciame:['Il primo sciame','Le termiti alate sciamano dopo l’umido, per fondare nuove colonie.'],collemboli:['Il primo collembolo','I collemboli sono pulitori minuscoli: mangiano muffa e detriti, e saltano con una piccola molla.'],giungla:['La prima giungla','Quando le piante crescono senza freni fanno ombra e le più piccole soffrono: serve potare.'],popolo:['Il primo popolo','Il popolo è la parte fantastica del meteorite: nessun insetto vero costruisce statuine.'],gigante:['Il primo gigante','Gli insetti veri non crescono così: qui è colpa del sasso.'],guerra:['La prima guerra','In natura le colonie di formiche si combattono per il territorio.']}};
window.__story={prep,RITORNO,OGGI,SCHEDE,ATL,NONNA,MISS,TEMPO,CAL,the,cap,pick,TITOLI,PRO,OGG_VOCE,ARR,REQ,REQV,narra,osserva,ambient,PAG,DIARIO,diario,MITO,EPI,epilogo,atto,biscotto,MUTMAP,MUTFX,LETARGO,letargo,SALTO_NO,SALTO_DONO,SALTO_FATTO,FILM_FEDE};
})();
