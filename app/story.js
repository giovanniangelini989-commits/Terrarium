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
const REQ={pulisci:['Il vetro è appannato. Non vedi niente.','Pulisci il vetro'],acqua:['Le foglie pendono, molli. Hanno sete.','Dai un po’ d’acqua'],nutri:['La terra è grigia e stanca. Le serve cibo buono.','Nutri il suolo'],osserva:['Ti chiedi cosa fanno quando nessuno li guarda.','Osserva il vaso']};
// ---------- la voce del vaso ----------
const NM={
 gigantismo:[N=>cap(N)+' crescono, giorno dopo giorno, finché il vaso non sembra più abbastanza grande.',N=>'Qualcosa nel cibo, o nella luce: '+N+' sono più grandi di ieri. E di avantieri.'],
 radioattivo:[N=>'Vicino al sasso la terra è tiepida. '+cap(N)+' ci passano sopra, e qualcosa in loro cambia.',N=>cap(N)+' brillano appena, di un verde che non c’era. Il sasso batte più piano, soddisfatto.'],
 intelligenza:[N=>cap(N)+' si fermano più spesso. Guardano. Come se avessero capito che c’è un vetro.',N=>'Qualcuno, tra '+N+', ha trascinato una briciola fino al sasso e l’ha lasciata lì. Come un’offerta.'],
 corazza:[N=>cap(N)+' si coprono di una scorza dura, scura come inchiostro.',N=>cap(N)+' hanno un guscio sempre più spesso. Sotto il dito, suonano come sassolini.'],
 velenoso:[N=>'Un odore dolce e sbagliato: '+N+' hanno imparato a difendersi.',N=>cap(N)+' lasciano una traccia amara. Adesso nessuno si avvicina più.'],
 iperfertilita:[N=>'Provi a contare '+N+', ma nascono più in fretta di te.',N=>'Sono ovunque. '+cap(N)+' riempiono ogni angolo del muschio.'],
 bioluminescenza:[N=>'Quando spegni la luce, '+N+' accendono la loro.',N=>cap(N)+' brillano nel buio come lucciole inquiete.']
};
const MUTMAP={}; Object.keys(T.MUT).forEach(m=>Object.values(T.SPECIE).forEach(s=>{ MUTMAP[T.MUT[m].txt(s.nome)]={m,nome:s.nome}; }));
function narra(e){ const t=e.text, d=e.d||0; let m;
  if(MUTMAP[t]){ const {m:mm,nome}=MUTMAP[t]; return pick(NM[mm],d)(the(nome)); }
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
  if(al.length){ const x=pick(al,seed); const mu=x.mut.length; return {focus:{kind:'specie',id:x.id},text:mu?cap(the(x.nome))+' si muovono con più sicurezza di prima. '+(x.mut.includes('radioattivo')?'Hanno un alone verde, appena visibile.':x.mut.includes('gigantismo')?'Hanno un passo pesante, nuovo.':'Qualcosa in loro è cambiato.'):'Ti avvicini a guardare '+the(x.nome)+'. Esplorano il muschio, una briciola alla volta, senza fretta.'}; }
  return {focus:{kind:'meteorite'},text:'Il sasso batte piano. Il vaso è quieto, come in attesa di qualcuno.'}; }
// ---------- voce ambientale ----------
function ambient(v,night,seed){ const p=[]; const nd=v.needs; if(!v.sp.length&&!v.setup.piante.length) return pick(['Il sasso batte, solo, nel barattolo vuoto.','Un filo di luce attraversa il vetro. Dentro non c’è ancora niente.','Il vuoto, qui dentro, ha un suono: è il battito.'],seed); if(nd){ if(nd.um<.28) return 'Le foglie si arricciano: qualcuno ha sete.'; if(nd.ter<.15) return 'Il terreno è grigio e stanco.'; if(nd.pul<.4) return 'Il vetro è appannato di sporco e la muffa avanza.'; }
  if(v.wars.length) p.push('Nessuno dorme, nel vaso.','Il cibo è poco e le voci si alzano.');
  if(v.sp.some(x=>x.society&&x.alive)) p.push('Qualcuno, laggiù, ha cominciato a raccontare storie.','Sul muschio ci sono tracce che sembrano strade.');
  if(v.sp.some(x=>x.monster&&x.alive)) p.push('Il vetro è sempre più vicino.');
  if(v.E>70) p.push('Il sasso batte forte. Tutto il vaso lo sente.'); else if(v.E<30) p.push('Il sasso è quasi quieto. Dorme.');
  if(v.vit<40) p.push('Le foglie sono stanche.'); if(v.muffa>.5) p.push('Una macchia grigia cresce sul vetro.');
  if(v.setup.luce===2) p.push('Il sole scalda il vetro. Il sasso sembra più sveglio.'); if(v.setup.luce===0) p.push('L’ombra è fresca e lenta.');
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
const MITO={sacro:'Hanno trovato un volto di pietra e hanno deciso che li guardava. Da allora ogni sera lo salutano.',sapere:'Hanno contato i battiti del sasso e ne hanno fatto un calendario. Dicono che il tempo, finalmente, ha un padrone.',commercio:'Hanno scoperto che due briciole valgono più di una. Da quel giorno non si sono più fermati.',gioco:'Hanno trovato una cosa morbida e colorata e ci hanno ballato intorno. Non l’hanno più lasciata.',mistero:'Hanno visto sé stessi nel vetro dello specchio e hanno pensato: siamo di più di quanto credevamo.',comunicazione:'Di notte, in silenzio, hanno sentito una voce lontana. Non sanno di chi sia. Rispondono lo stesso.',fuoco:'Hanno portato una scintilla in fondo al muschio. Quella luce non si è più spenta.',agricoltura:'Hanno capito che i funghi crescono dove qualcuno li cura. Da allora qualcuno li cura.',tribale:'Non hanno niente da adorare, e questo li ha resi vicini. Hanno nomi per ogni cosa, tranne per te.'};
const EPI={
 equilibrio:'Ho guardato il barattolo per settimane. Non è successo niente di grande, e forse è questo il bello: ogni sera il muschio respira, e io respiro con lui.',
 spento:'Si è spento tutto. Ho tenuto il coperchio chiuso un giorno intero, come se aspettassi. La mamma dice che anche i mondi piccoli finiscono. Io ne farò un altro.',
 gigante:'Una sola creatura ha preso tutto il posto. Quando la guardo, mi guarda. Non so se ha fame o se vuole uscire.',
 tribu:'Hanno un nome per ogni cosa, ma niente da adorare. Sembrano felici lo stesso, o almeno sembrano insieme.',
 fede:'Hanno messo la statuina al centro e le girano intorno. Io dico che è solo una statuina. Loro dicono che mi guarda. Forse hanno ragione loro.',
 accademia:'Segnano ogni battito del sasso, uno dopo l’altro. Hanno scoperto che il sasso batte ogni quarantasette secondi. Dicono che è un messaggio.',
 mercato:'Si scambiano briciole e fili d’erba usando la moneta come misura di tutto. Ho provato a spiegare che non vale niente. Mi hanno risposto con un prezzo.',
 carnevale:'Il giocattolo è diventato la loro piazza. Ogni sera c’è una festa che dura finché il vetro non si appanna.',
 mistero:'Si fermano davanti allo specchio e si salutano. Credo che pensino che dall’altra parte ci sia una colonia più grande.',
 voci:'Di notte fanno silenzio e ascoltano la radio. Dicono che da lontano qualcuno parla. Io non sento niente, ma ormai ci credo anch’io.',
 fiamma:'La candela non la spegne nessuno. Fanno i turni per vegliarla, come se fosse il cuore di tutto. Forse lo è.',
 giardinieri:'Hanno imparato a coltivare i funghi nel muschio. Mi sono accorto che mangiano meglio di me.',
 scisma:'Metà vuole inginocchiarsi, metà vuole misurare. Per la prima volta ho capito che una cosa sola può dividere un mondo.',
 conquista:'Qualcuno ha vinto. Il vaso è più silenzioso e più grande, ma non so se è meglio.',
 patto:'Hanno messo la moneta tra loro e hanno smesso di combattere. Non sapevo che una cosa così piccola potesse fare tanto.'};
function epilogo(k,culto){ let t=EPI[k]||''; if(T.FINALI[k]&&T.FINALI[k].fam==='Società'){ if(culto==='giocatore') t+=' Dicono che qualcuno li guarda da fuori. Hanno ragione.'; else if(culto==='meteorite') t+=' Dicono che il sasso batte per loro. Forse ha ragione.'; } return t; }
// ---------- atti ----------
function atto(v){ if(v.finalePending) return {n:4,t:'Il destino',x:'Il vaso ha trovato la sua strada. Manca solo da decidere se chiudere il capitolo.'};
  if(v.sp.some(x=>x.society)) return {n:3,t:'Il popolo',x:'Qualcuno, nel vaso, ha cominciato a raccontare storie. Resta a guardare cosa ne fanno.'};
  if(v.sp.some(x=>x.mut.length)) return {n:2,t:'Qualcosa cambia',x:'Il sasso sta cambiando chi lo tocca. Nessuno sa ancora dove porta.'};
  return {n:1,t:'Il sasso che batte',x:'Il meteorite è appena arrivato. Il vaso si sta svegliando: osserva, cura, aspetta.'}; }
function biscotto(){ return {intro:'Un’ombra sul muro. Poi una zampa sul coperchio. Biscotto ha deciso che il barattolo è suo.',pallina:'Biscotto insegue la pallina e dimentica il vaso. Tu respiri.',pallinaNo:'Biscotto ignora la pallina e dà una zampata al coperchio.',davanzale:'Sposti il vaso sul davanzale, fuori portata. Qui il sole è più forte: il sasso lo sente.',ok:'Il vaso è salvo. Per questa volta.',male:'Il barattolo cade sul ripiano. Non si rompe, ma il vetro si scheggia: per qualche giorno entrerà meno luce.'}; }
window.__story={the,cap,pick,TITOLI,PRO,OGG_VOCE,ARR,REQ,narra,osserva,ambient,PAG,MITO,EPI,epilogo,atto,biscotto,MUTMAP};
})();
