// Microclima del barattolo — modello autonomo (agente ecologo).
// Browser: window.__MICRO · Node: module.exports. Non tocca sim.js né gli altri file.
// Unità: ore, °C, hPa, grammi d'acqua (1 g ≈ 1 ml). Fonti e motivazioni in docs/ecologia/modello.md.
(function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a==null?0:a,Math.min(b==null?1:b,x));

// ---------- fisica dell'aria umida (Magnus, Sensirion/NPL: α=6.112 hPa, β=17.62, λ=243.12 °C) ----------
function eSat(T){ return 6.112*Math.exp(17.62*T/(243.12+T)); }                 // pressione di vapore saturo, hPa
function dewPoint(T,rh){ const H=Math.log(Math.max(1e-4,rh))+17.62*T/(243.12+T); return 243.12*H/(17.62-H); }
function absHum(e,T){ return 216.7*e/(T+273.15); }                             // g/m³

// ---------- geometria del barattolo (vaso alto ~2 L: ø 11 cm, terra 5 cm, ghiaia 2 cm) ----------
const JAR={
  area_cm2:95,               // sezione (π·5.5²)
  aria_m3:0.0015,            // volume d'aria
  // capacità d'acqua per strato (g). Terriccio: 475 ml × ~50 % in volume alla capacità di campo (potting mix 40–60 %).
  cap:{superficie:30, terriccio:240, drenaggio:75},
  filmCap:2.0,               // g d'acqua per zona di vetro quando è tutta appannata/gocciolante (stima)
  zone:['tappo','alto','medio','basso']
};
// quanto ogni zona di vetro segue la stanza (1) o l'interno (0): il tappo e la parte alta sono le più esposte
const ZONA_ESPOSTA={tappo:.7,alto:.6,medio:.5,basso:.35};
const ZONA_AREA={tappo:.2,alto:.3,medio:.3,basso:.2};

// ---------- piante: finestre di benessere (vedi studio.md §5) ----------
// lux in migliaia (kl); rh aria; acqua = frazione della capacità di campo del terriccio; T °C
const PIANTE={
  muschio:   {lux:[0.3,3,8],   rh:[.75,1],  acqua:[.35,.95], T:[5,15,28],  nota:'ama l’umido e la mezza luce; si secca ma si riprende'},
  felce:     {lux:[1,5,10],    rh:[.6,1],   acqua:[.4,.85],  T:[12,20,30], nota:'umidità e luce indiretta'},
  succulenta:{lux:[5,10,30],   rh:[.1,.55], acqua:[.08,.4],  T:[15,25,38], nota:'sole, aria secca, poca acqua: marcisce nel chiuso'},
  fungo:     {lux:[0,0.3,3],   rh:[.85,1],  acqua:[.5,1],    T:[10,18,26], nota:'buio umido e materia morta; fruttifica in pochi giorni'},
  carnivora: {lux:[4,8,20],    rh:[.6,.9],  acqua:[.6,1],    T:[18,25,32], nota:'molta luce, torba sempre bagnata'}
};
// ---------- biomassa, spazio, brucatori (docs/ecologia/modello.md §9) ----------
// r: crescita logistica per ora a condizioni ottime (la copertura totale limita tutte: 1-cop); alt: altezza relativa (chi è più alto ombreggia chi è più basso);
// pal: appetibilità per lumache e coleotteri; b0: copertura iniziale
const BIO={ muschio:{r:.2,alt:.1,pal:.3,b0:.15}, felce:{r:.4,alt:1,pal:1,b0:.08}, succulenta:{r:.1,alt:.5,pal:.6,b0:.06}, fungo:{r:.2,alt:.25,pal:.2,b0:.04}, carnivora:{r:.15,alt:.55,pal:.3,b0:.06} };
const GIUNGLA_DA=.7, GIUNGLA_PIENA=1.0, SOFFOCO=.8, BIO_MIN=.02, POTA_ORE=6, POTA_TAGLIO=.4, POTA_MAX=.3, BRUCA_G=.08;
const nuovaPianta=(p,v)=>({vigore:v,crescita:0,biomassa:BIO[p].b0,ombra:0});
// finestra di benessere: 1 in una fascia larga attorno all'ottimo, scende a 0 ai limiti
function finestra(x,lo,opt,hi){ if(x<=lo||x>=hi) return 0; return x<opt?clamp((x-lo)/((opt-lo)*.6)):clamp((hi-x)/((hi-opt)*.6)); }
function banda(x,lo,hi){ const m=(hi-lo)*.25; if(x<lo-m||x>hi+m) return 0; if(x<lo) return (x-(lo-m))/m; if(x>hi) return ((hi+m)-x)/m; return 1; }

// ---------- ambiente di default: stanza con finestra ----------
// ora (0–24), stagione ∈ estate|inverno|mezza, posizione ∈ ombra|mezza|sole, meteo ∈ sereno|nuvolo|pioggia
function ambienteDi(ora,o){ o=o||{}; const st=o.stagione||'mezza', pos=o.posizione||'mezza', met=o.meteo||'sereno';
  const h=((ora%24)+24)%24;
  const base={estate:{T:26,dT:3,alba:6,tram:21,Tfin:0},inverno:{T:20,dT:2,alba:8,tram:17,Tfin:-6},mezza:{T:22,dT:2.5,alba:7,tram:19,Tfin:-3}}[st];
  const giorno=h>base.alba&&h<base.tram, f=giorno?Math.sin(Math.PI*(h-base.alba)/(base.tram-base.alba)):0;
  const cielo={sereno:1,nuvolo:.35,pioggia:.15}[met];
  const T=base.T+base.dT*Math.sin(Math.PI*(h-9)/12);                       // minimo verso le 3, massimo verso le 15
  const sole={ombra:.05,mezza:.35,sole:1}[pos]*f*cielo;                      // 1 = sole diretto sul vetro a mezzogiorno
  const lux={ombra:.4,mezza:3,sole:9}[pos]*f*(cielo*.8+.2);                  // kl: davanzale sud 5–10 kl, nord 0.2–0.5 kl
  const rh={estate:.55,inverno:.4,mezza:.5}[st]+(met==='pioggia'?.2:0);
  // il vetro della finestra di notte è più freddo della stanza (vetro singolo = superficie più fredda): il lato esposto lo sente
  const Tfinestra=T+(giorno?0:base.Tfin*{ombra:.2,mezza:.5,sole:1}[pos]);
  return {ora:h,T,Tfinestra,sole,lux,rh,giorno}; }

// ---------- modello ----------
function create(st0){ st0=st0||{};
  const S={
    t:0, tappo:st0.tappo||'chiuso', posizione:st0.posizione||'mezza',
    T:{aria:st0.T!=null?st0.T:22, suolo:st0.T!=null?st0.T:22, vetro:{tappo:22,alto:22,medio:22,basso:22}},
    acqua:{superficie:st0.superficie!=null?st0.superficie:12, terriccio:st0.terriccio!=null?st0.terriccio:150, drenaggio:st0.drenaggio!=null?st0.drenaggio:10, aria:0},
    film:{tappo:0,alto:0,medio:0,basso:0}, gocce:0,
    detrito:st0.detrito!=null?st0.detrito:.3, sporcoVetro:st0.sporcoVetro||.1, collemboli:st0.collemboli||0,
    muffa:{terra:st0.muffa||0, vetro:0, foglie:0}, marciume:0,
    piante:{}, lux:0, luxMed:{ombra:.15,mezza:1.2,sole:3.5}[st0.posizione||'mezza'], dli:0, rh:.9, e:0, letargo:false, log:[],
    brucatori:clamp(st0.brucatori||0), mangiato:0, mangiatoUltimo:0, potaFino:-99, potato:0, ultimaPota:null, copertura:0,
    apertoFino:0,              // ogni cura apre il barattolo per CURA_ORE ore (si versa, si pulisce): è lì che l'acqua esce
    Tmax:st0.T!=null?st0.T:22, Tstanza:st0.T!=null?st0.T:22, Tsum:0, Tn:0
  };
  (st0.piante||['muschio']).forEach(p=>{ if(PIANTE[p]) S.piante[p]=nuovaPianta(p,.7); });
  S.acqua.aria=absHum(eSat(S.T.aria)*.9,S.T.aria)*JAR.aria_m3;

  const CURA_ORE=6;                                                          // un giorno del vaso (6 h reali): il tappo resta aperto dopo una cura
  function aperto(){ return S.tappo==='aperto'||S.t<S.apertoFino; }
  function copertura(){ let c=0; Object.keys(S.piante).forEach(p=>{ c+=S.piante[p].biomassa; }); return c; }
  function giungla(){ return clamp((copertura()-GIUNGLA_DA)/(GIUNGLA_PIENA-GIUNGLA_DA)); }
  function ventilazione(){ return (aperto()?.07:.0005)*(1-.4*giungla()); }   // fogliame fitto = aria ferma                     // g/(h·hPa) di scambio con la stanza (taratura in modello.md)

  function sub(dt,A){
    // --- temperatura: la stanza trascina il barattolo (τ≈1 h); il sole lo scalda da dentro (serra, +8 °C a pieno sole, stima)
    const tauIn=1.0, serra=8, ap=aperto();
    S.T.aria+=((A.T-S.T.aria)/tauIn+serra*A.sole*(ap?.6:1))*dt;
    S.Tmax=Math.max(S.Tmax,S.T.aria); S.Tsum+=A.T*dt; S.Tn+=dt;
    S.T.suolo+=((S.T.aria+3*A.sole-S.T.suolo)/3)*dt;                          // il suolo ha inerzia e il sole lo scalda direttamente
    JAR.zone.forEach(z=>{ const k=ZONA_ESPOSTA[z]; const Tfuori=A.Tfinestra!=null?A.Tfinestra:A.T; const goal=S.T.aria*(1-k)+Tfuori*k; S.T.vetro[z]+=(goal-S.T.vetro[z])/.25*dt; });
    // --- vapore: equilibrio quasi istantaneo (l'aria di un barattolo tiene < 0,05 g d'acqua)
    const wetS=clamp(S.acqua.superficie/JAR.cap.superficie), wetT=clamp(S.acqua.terriccio/JAR.cap.terriccio);
    const wet=Math.max(wetS, wetT*.6);
    const gS=(.05+.1*A.sole)*wet, eS=eSat(S.T.suolo);                       // superficie bagnata → aria
    const gX=ventilazione(), eX=eSat(A.T)*A.rh;                              // scambio con la stanza
    let traspira=0; Object.keys(S.piante).forEach(p=>{ traspira+=.01*S.piante[p].vigore*(.3+A.lux/10)*(.5+2.5*S.piante[p].biomassa); });
    const gP=traspira*wetT;                                                  // traspirazione delle piante (dal terriccio)
    // il vetro scambia vapore solo se condensa (più freddo del punto di rugiada) o se ha già un velo da far evaporare
    const num0=gS*eS+gX*eX+gP*eSat(S.T.aria), den0=gS+gX+gP; let e=num0/den0; const gZ={};
    for(let it=0;it<2;it++){ let num=num0, den=den0; JAR.zone.forEach(z=>{ const ez=eSat(S.T.vetro[z]); const attivo=ez<e||S.film[z]>.01; const g=attivo?.1*ZONA_AREA[z]*4:0; gZ[z]=g; num+=g*ez; den+=g; }); e=num/den; }
    e=Math.min(e,eSat(S.T.aria)); S.e=e; S.rh=clamp(e/eSat(S.T.aria),0,1);
    // --- flussi d'acqua (g)
    const evap=gS*(eS-e)*dt; S.acqua.superficie=Math.max(0,S.acqua.superficie-evap);
    const tr=gP*(eSat(S.T.aria)-e)*dt; S.acqua.terriccio=Math.max(0,S.acqua.terriccio-tr);
    const persa=gX*(e-eX)*dt;                                                // > 0: esce dal barattolo
    let gocce=0;
    JAR.zone.forEach(z=>{ let f=gZ[z]*(e-eSat(S.T.vetro[z]))*dt; if(f<0) f=Math.max(f,-S.film[z]); S.film[z]=Math.max(0,S.film[z]+f);
      if(S.film[z]>JAR.filmCap*.6){ const g=(S.film[z]-JAR.filmCap*.6)*.5*dt; S.film[z]-=g; gocce+=g; } });  // sopra il 60 % il velo cola
    S.gocce=gocce/dt; S.acqua.superficie+=gocce;
    // bilancio: ciò che evapora e non condensa né esce resta "in aria" (trascurabile); la perdita verso la stanza si sottrae alla superficie
    S.acqua.superficie=Math.max(0,S.acqua.superficie-Math.max(0,persa));
    // --- percolazione e risalita capillare
    if(S.acqua.superficie>JAR.cap.superficie){ const x=(S.acqua.superficie-JAR.cap.superficie)*Math.min(1,dt*2); S.acqua.superficie-=x; S.acqua.terriccio+=x; }
    if(S.acqua.terriccio>JAR.cap.terriccio){ const x=(S.acqua.terriccio-JAR.cap.terriccio)*Math.min(1,dt*.5); S.acqua.terriccio-=x; S.acqua.drenaggio+=x; }
    if(S.acqua.drenaggio>0&&wetT<.9){ const x=Math.min(S.acqua.drenaggio,.3*dt); S.acqua.drenaggio-=x; S.acqua.terriccio+=x; }  // risalita lenta (~7 ml/giorno): il serbatoio si svuota solo se sopra si asciuga
    if(wetS<.5&&wetT>.2){ const x=Math.min(S.acqua.terriccio,1.2*dt*(wetT-.2)*(.5-wetS)/.5); S.acqua.terriccio-=x; S.acqua.superficie+=x; }  // capillarità: ~10 ml/giorno con terriccio umido e superficie secca
    // ristagno: drenaggio pieno e terriccio oltre la capacità → radici senza aria. Sale in ~1 giorno reale (4 giorni del vaso), cala in ~4 quando il serbatoio si svuota
    const rist=S.acqua.drenaggio>=JAR.cap.drenaggio*.95&&S.acqua.terriccio>JAR.cap.terriccio*.95;
    S.marciume=clamp(S.marciume+(rist?.02:-.005)*dt);
    // --- luce
    S.lux=A.lux*(S.tappo==='aperto'?1:.92); S.dli+=S.lux*dt; S.luxMed+=(S.lux-S.luxMed)*Math.min(1,dt/24);   // media mobile ~1 giorno: le piante rispondono alla luce del giorno, non all'istante
    // --- detrito: si accumula piano (foglie morte, materia), lo mangiano i collemboli
    S.detrito=clamp(S.detrito+(.0004-.0015*S.collemboli)*dt);
    S.sporcoVetro=clamp(S.sporcoVetro+(.0003+.002*S.gocce)*dt);
    // --- muffa per zona: cresce con umidità alla superficie > 80 %, 5–40 °C, materia morta, aria ferma; muore con aria, luce, collemboli
    const fT=clamp(1-Math.abs(S.T.aria-25)/20);
    const rhTerra=Math.max(S.rh, wetS>.5?.98:0), rhVetro=Math.max(S.rh, S.film.basso>.3?.98:0), rhFoglie=S.rh;
    const stressP=Object.keys(S.piante).length?1-Object.keys(S.piante).reduce((a,p)=>a+S.piante[p].vigore,0)/Object.keys(S.piante).length:0;
    const aria=ap?1:0, uv=A.sole, gj=giungla();
    const zone={terra:[rhTerra,.4+.6*S.detrito,0], vetro:[rhVetro,.25+.75*S.sporcoVetro,uv], foglie:[rhFoglie,Math.min(1,.2+.8*stressP+.4*gj),uv*.5]};
    Object.keys(zone).forEach(z=>{ const [rh,sub,luce]=zone[z]; const fRH=clamp((rh-.8)/.17);
      const cresce=.02*fRH*fT*sub*(1-.3*aria)*(1+.6*gj);
      const muore=.004+.02*aria*(1-fRH)+.035*S.collemboli+.01*luce;
      S.muffa[z]=clamp(S.muffa[z]+(cresce*(1-S.muffa[z])-muore*S.muffa[z])*dt); });
    // collemboli: stanno in quasi ogni terriccio e arrivano da soli dove c'è muffa e umido (da 0 a 0,1 in ~8 giorni reali); poi crescono col cibo, calano se secco
    const cibo=Math.max(S.muffa.terra,S.detrito*.5);
    if(S.collemboli<.1&&S.muffa.terra>.5&&S.rh>.8) S.collemboli=clamp(S.collemboli+.0004*dt);
    if(S.collemboli>0) S.collemboli=clamp(S.collemboli+(.004*cibo*(S.rh>.7?1:0)-.003*(S.rh<.6?1:0))*dt,0,1);
    // --- piante
    const cop=copertura(); S.copertura=cop;
    Object.keys(S.piante).forEach(p=>{ const q=S.piante[p]; let sh=0; Object.keys(S.piante).forEach(o=>{ if(BIO[o].alt>BIO[p].alt) sh+=S.piante[o].biomassa; });
      q.ombra=clamp(1.4*Math.max(0,sh-.1)+2*Math.max(0,cop-SOFFOCO)); });                    // chi sta sotto una chioma fitta vede poca luce; sopra 0,8 di copertura ombreggia anche la più alta
    Object.keys(S.piante).forEach(p=>{ const P=PIANTE[p], q=S.piante[p];
      const lm=S.luxMed*2.2*(1-.7*q.ombra);                                                  // media giornaliera → equivalente di picco (giorno ≈ 11 h su 24 con profilo a seno)
      const fL=P.lux[1]>0?finestra(lm,P.lux[0]*.5,P.lux[1],P.lux[2]):(lm<P.lux[2]?1:0);
      const fR=banda(S.rh,P.rh[0],P.rh[1]), fW=banda(wetT,P.acqua[0],P.acqua[1]), fTp=finestra(S.T.aria,P.T[0],P.T[1],P.T[2]);
      let bene=Math.min(fL,fR,fW,fTp);
      if(p==='fungo') bene*=.3+.7*S.detrito;
      if(p==='succulenta'&&(S.rh>.8||S.marciume>.3)) bene=0;
      let dv=(bene-q.vigore)/48; if(S.marciume>.5) dv-=.01; if(S.muffa.foglie>.6) dv-=.004; if(p!=='fungo') dv-=.01*q.ombra;
      q.vigore=clamp(q.vigore+dv*dt); q.crescita+=Math.max(0,bene)*q.vigore*dt*(A.lux>0?1:.2);
      if(!S.letargo){ const gr=BIO[p].r*Math.max(0,bene)*q.vigore*q.biomassa*Math.max(0,1-cop)*(A.lux>0?1:.2);
        const perso=q.biomassa*(.004*(1-q.vigore)+.02*q.ombra*q.ombra)*(p==='fungo'?.5:1);   // foglie ingiallite e secche
        q.biomassa=Math.max(BIO_MIN,q.biomassa+(gr-perso)*dt); S.detrito=clamp(S.detrito+perso*.6*dt); } });
    // --- brucatori: lumache e coleotteri mangiano foglie e germogli (risposta satura: poca pianta = poco morso); ripartono per appetibilità×biomassa; le radici ricacciano (BIO_MIN)
    if(!S.letargo&&S.brucatori>0&&cop>BIO_MIN*1.5){ const w={}; let wt=0; Object.keys(S.piante).forEach(p=>{ w[p]=BIO[p].pal*S.piante[p].biomassa; wt+=w[p]; });
      let x_tot=0; const eat=Math.min(cop-BIO_MIN,BRUCA_G*S.brucatori*cop/(cop+.5)*dt);
      if(wt>0) Object.keys(w).forEach(p=>{ const q=S.piante[p], x=Math.min(q.biomassa-BIO_MIN,eat*w[p]/wt); if(x>0){ q.biomassa-=x; S.mangiatoUltimo+=x; x_tot+=x; S.detrito=clamp(S.detrito+x*.15); } });   // 15 % torna come feci
      S.mangiato+=x_tot; }
    // --- letargo (docs/DECISIONI.md §1): il vaso dorme, i valori scendono fino a una soglia e lì si fermano
    if(S.letargo){ S.acqua.terriccio=Math.max(S.acqua.terriccio,JAR.cap.terriccio*.3); S.acqua.superficie=Math.max(S.acqua.superficie,JAR.cap.superficie*.2);
      Object.keys(S.muffa).forEach(z=>{ S.muffa[z]=Math.min(S.muffa[z],.5); }); Object.keys(S.piante).forEach(p=>{ S.piante[p].vigore=Math.max(S.piante[p].vigore,.4); }); }
    S.t+=dt; }

  function step(ore,amb){ ore=ore||1; let left=ore; S.mangiatoUltimo=0; S.Tmax=S.T.aria; S.Tsum=0; S.Tn=0; while(left>1e-9){ const dt=Math.min(.25,left); const A=typeof amb==='function'?amb(S.t):(amb||ambienteDi(S.t,{posizione:S.posizione}));
      if(A.Tfinestra==null) A.Tfinestra=A.T; S.letargo=!!A.letargo; sub(dt,A); left-=dt; } if(S.Tn>0) S.Tstanza=S.Tsum/S.Tn; return view(); }

  function act(a,arg){ a=a||{}; if(typeof a==='string') a={tipo:a,v:arg}; const t=a.tipo;
    if(t==='bagna'||t==='terra'||t==='nutri'||t==='pulisci') S.apertoFino=S.t+CURA_ORE;   // per curare si toglie il tappo: per un giorno del vaso entra aria ed esce acqua
    if(S.log.length>40) S.log.splice(0,S.log.length-40);
    if(t==='bagna'){ const ml=a.v!=null?a.v:30; S.acqua.superficie+=ml*.3; S.acqua.terriccio+=ml*.7; S.log.push([S.t,'bagna',ml]); }   // l'acqua versata filtra subito nel terriccio
    else if(t==='terra'){ S.detrito=clamp(S.detrito+(a.v!=null?a.v:.3)); S.log.push([S.t,'terra']); }
    else if(t==='nutri'){ S.detrito=clamp(S.detrito+(a.v!=null?a.v:.15)); S.log.push([S.t,'nutri']); }   // materia organica: cibo per il suolo, ma anche per la muffa
    else if(t==='pulisci'){ const z=a.zona; if(!z||z==='vetro'){ S.muffa.vetro*=.1; S.sporcoVetro*=.2; JAR.zone.forEach(k=>{ S.film[k]*=.2; }); } if(!z||z==='terra'){ S.muffa.terra*=.4; S.detrito*=.7; } if(z==='foglie'){ S.muffa.foglie*=.2; } S.log.push([S.t,'pulisci',z||'tutto']); }
    else if(t==='asciuga'){ const q=clamp(a.v!=null?a.v:.5), zz=a.zona?[a.zona]:JAR.zone; zz.forEach(z=>{ S.film[z]*=(1-q); }); S.acqua.superficie=Math.max(0,S.acqua.superficie-JAR.filmCap*q*.2*zz.length); }
    else if(t==='brucatori'){ S.brucatori=clamp(a.v!=null?a.v:0); }
    else if(t==='pota'){ S.apertoFino=Math.max(S.apertoFino,S.t+CURA_ORE); const ps=Object.keys(S.piante);   // per tagliare si toglie il tappo
      if(S.t<S.potaFino){ S.ultimaPota={ok:false,motivo:'riposo',pianta:null,tagliato:0}; }
      else if(!ps.length){ S.ultimaPota={ok:false,motivo:'vuoto',pianta:null,tagliato:0}; }
      else { const id=a.zona&&S.piante[a.zona]?a.zona:ps.reduce((m,p)=>(S.piante[p].biomassa*(.5+BIO[p].alt)>S.piante[m].biomassa*(.5+BIO[m].alt)?p:m),ps[0]);   // la più invadente: biomassa pesata per altezza
        const q=S.piante[id], cut=Math.min(POTA_MAX,Math.max(0,q.biomassa-BIO_MIN)*POTA_TAGLIO); q.biomassa-=cut; q.vigore=clamp(q.vigore-.05); S.detrito=clamp(S.detrito+cut*.3);
        S.potaFino=S.t+POTA_ORE; S.potato+=cut; S.ultimaPota={ok:true,motivo:'',pianta:id,tagliato:Math.round(cut*100)/100}; S.log.push([S.t,'pota',id]); } }
    else if(t==='apri'){ S.tappo='aperto'; } else if(t==='chiudi'){ S.tappo='chiuso'; }
    else if(t==='sposta'){ S.posizione=a.v||'mezza'; }
    else if(t==='collemboli'){ S.collemboli=clamp(S.collemboli+(a.v!=null?a.v:.4)); }
    else if(t==='pianta'){ if(PIANTE[a.v]&&!S.piante[a.v]) S.piante[a.v]=nuovaPianta(a.v,.6); }
    else if(t==='togli'){ delete S.piante[a.v]; }
    else if(t==='imposta'){ const o=a.v||{};                                    // allineamento ai bisogni del motore (setNeeds, letargo, carte, notti): valori assoluti
      if(o.um!=null){ const u=clamp(o.um); S.acqua.terriccio=u*JAR.cap.terriccio; S.acqua.superficie=u*JAR.cap.superficie*.6; if(u<.9) S.acqua.drenaggio=Math.min(S.acqua.drenaggio,JAR.cap.drenaggio*.9); }
      if(o.muffa!=null){ const m=clamp(o.muffa); S.muffa.terra=m; S.muffa.vetro=Math.min(S.muffa.vetro,m); S.muffa.foglie=Math.min(S.muffa.foglie,m); }
      if(o.brucatori!=null) S.brucatori=clamp(o.brucatori); if(o.tappo) S.tappo=o.tappo; if(o.posizione) S.posizione=o.posizione;
      if(o.drenaggio!=null) S.acqua.drenaggio=clamp(o.drenaggio)*JAR.cap.drenaggio; if(o.collemboli!=null) S.collemboli=clamp(o.collemboli);
      if(o.piante){ o.piante.forEach(p=>{ if(PIANTE[p]&&!S.piante[p]) S.piante[p]=nuovaPianta(p,.6); }); Object.keys(S.piante).forEach(p=>{ if(!o.piante.includes(p)) delete S.piante[p]; }); } }
    return view(); }

  function view(){ const r=x=>Math.round(x*100)/100; const cond={}; JAR.zone.forEach(z=>{ cond[z]=r(clamp(S.film[z]/JAR.filmCap)); });
    const rischio={}; Object.keys(S.muffa).forEach(z=>{ rischio[z]=r(S.muffa[z]); });
    const piante={}; Object.keys(S.piante).forEach(p=>{ piante[p]={vigore:r(S.piante[p].vigore),crescita:r(S.piante[p].crescita),biomassa:r(S.piante[p].biomassa),ombra:r(S.piante[p].ombra)}; });
    return { t:S.t, tappo:S.tappo, aperto:aperto(), posizione:S.posizione,
      aria:{rh:r(S.rh), T:r(S.T.aria), rugiada:r(dewPoint(S.T.aria,Math.max(.01,S.rh))), Tmax:r(S.Tmax)}, stanza:{T:r(S.Tstanza)},
      T:{aria:r(S.T.aria), suolo:r(S.T.suolo), vetro:{tappo:r(S.T.vetro.tappo),alto:r(S.T.vetro.alto),medio:r(S.T.vetro.medio),basso:r(S.T.vetro.basso)}},
      acqua:{superficie:r(clamp(S.acqua.superficie/JAR.cap.superficie)), terriccio:r(clamp(S.acqua.terriccio/JAR.cap.terriccio)), drenaggio:r(clamp(S.acqua.drenaggio/JAR.cap.drenaggio)),
             ml:{superficie:r(S.acqua.superficie),terriccio:r(S.acqua.terriccio),drenaggio:r(S.acqua.drenaggio)}, ristagno:r(S.marciume)},
      condensa:cond, gocce:r(S.gocce), muffa:rischio, detrito:r(S.detrito), sporcoVetro:r(S.sporcoVetro), collemboli:r(S.collemboli),
      luce:{lux:r(S.lux), dli:r(S.dli)}, piante, letargo:S.letargo,
      copertura:r(copertura()), giungla:r(giungla()), soffocato:copertura()>=SOFFOCO,
      brucatori:r(S.brucatori), mangiato:r(S.mangiato), mangiatoUltimo:r(S.mangiatoUltimo), potato:r(S.potato), pota:{pronta:S.t>=S.potaFino, attesa:r(Math.max(0,S.potaFino-S.t)), ultima:S.ultimaPota} }; }

  function save(){ return JSON.parse(JSON.stringify({v:1,S})); }
  function load(o){ if(o&&o.S){ Object.assign(S,JSON.parse(JSON.stringify(o.S)));
      Object.keys(S.piante).forEach(p=>{ const q=S.piante[p]; if(q.biomassa==null) q.biomassa=BIO[p]?BIO[p].b0:.1; if(q.ombra==null) q.ombra=0; });   // salvataggi vecchi
      if(S.potaFino==null) S.potaFino=-99; ['brucatori','mangiato','mangiatoUltimo','potato','copertura'].forEach(k=>{ if(S[k]==null) S[k]=0; }); }
    return view(); }
  return {step,act,view,save,load,_S:S}; }

const API={create,ambienteDi,eSat,dewPoint,absHum,PIANTE,JAR,BIO};
if(typeof module!=='undefined'&&module.exports) module.exports=API;
if(typeof window!=='undefined') window.__MICRO=API;
})();
