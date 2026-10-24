/* Micro-interazioni di Terrario — tre livelli (piccolo · medio · grande). Animazioni native, nessuna dipendenza.
   Tabella completa degli eventi in cima ad app3.js. Si animano solo transform e opacity.
   piccolo: tocco su un comando (press 120 ms) · medio: pannelli, notifiche, bisogni, conteggi (200–350 ms) · grande: finale, livello (600–1200 ms) */
(function(){
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const SUP=window.CSS&&CSS.supports&&CSS.supports('animation-timing-function','linear(0, 1)');
const SPRING=SUP?'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)':'cubic-bezier(.34,1.56,.64,1)';
const OUT='cubic-bezier(.22,1,.36,1)';
const an=(el,kf,o)=>{ if(!el||RM||!el.animate) return null; try{ return el.animate(kf,Object.assign({duration:220,easing:OUT},o)); }catch(e){ return null; } };
const done=(a,el)=>{ if(a) a.onfinish=()=>el.remove(); else el.remove(); };
function press(el){ an(el,[{transform:'scale(.94)'},{transform:'scale(1)'}],{duration:120,easing:OUT,composite:'add'}); }
function pop(el,delay){ an(el,[{transform:'scale(.55)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:280,delay:delay||0,easing:SPRING,fill:'backwards'}); }
function rise(nodes,step,base){ Array.from(nodes||[]).slice(0,24).forEach((n,i)=>an(n,[{transform:'translateY(10px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:260,delay:(base||0)+i*(step||35),easing:OUT,fill:'backwards',composite:'add'})); }
function sheetIn(sh,scrim){ if(scrim) an(scrim,[{opacity:0},{opacity:1}],{duration:200}); if(!sh) return; an(sh,[{transform:'translateY(42px) scale(.98)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:320,easing:SPRING,composite:'add'}); rise(sh.querySelectorAll('.tbig, .kicker, h2, p, .li, .stack > *'),26,80); }
function ghostOut(layer){ if(RM||!layer) return; const sh=layer.querySelector('.sheet'); if(!sh) return; const r=sh.getBoundingClientRect(); if(!r.width) return; const cs=getComputedStyle(sh), g=sh.cloneNode(true);
  g.className='fx-ghost'; g.setAttribute('aria-hidden','true'); g.querySelectorAll('[data-a],[id]').forEach(n=>{ n.removeAttribute('data-a'); n.removeAttribute('id'); });
  ['background','backgroundColor','backgroundImage','border','borderRadius','boxShadow','padding','color','fontFamily','fontSize','textAlign'].forEach(p=>{ g.style[p]=cs[p]; });
  Object.assign(g.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',margin:'0',zIndex:9998,pointerEvents:'none',overflow:'hidden'}); document.body.appendChild(g);
  done(an(g,[{transform:'translateY(0)',opacity:1},{transform:'translateY(70px)',opacity:0}],{duration:230,easing:'cubic-bezier(.4,0,1,1)'}),g); }
function bump(el,up){ an(el,[{transform:'scale(1)',opacity:1},{transform:up?'scale(1.12)':'scale(.9)',opacity:up?1:.7},{transform:'scale(1)',opacity:1}],{duration:320,easing:SPRING}); }
function bar(fill,from,to){ an(fill,[{transform:'scaleX('+Math.max(0,Math.min(1,from))+')'},{transform:'scaleX('+Math.max(0,Math.min(1,to))+')'}],{duration:350,easing:OUT}); }
function shake(el){ an(el,[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(-2px)'},{transform:'translateX(0)'}],{duration:260,composite:'add'}); }
function ring(el){ if(RM) return; const r=el.getBoundingClientRect(); if(!r.width) return; const s=document.createElement('div'); s.className='fx-ring'; Object.assign(s.style,{width:r.width+'px',height:r.height+'px',left:r.left+'px',top:r.top+'px'}); document.body.appendChild(s); done(an(s,[{transform:'scale(1)',opacity:.9},{transform:'scale(1.65)',opacity:0}],{duration:300,easing:OUT}),s); }
function ripple(el,x,y){ if(RM) return; const r=el.getBoundingClientRect(); if(!r.width) return; const s=document.createElement('span'), d=Math.max(r.width,r.height)*1.5; s.className='fx-rip'; Object.assign(s.style,{width:d+'px',height:d+'px',left:(x-r.left-d/2)+'px',top:(y-r.top-d/2)+'px'}); el.appendChild(s); done(an(s,[{transform:'scale(0)',opacity:.32},{transform:'scale(1)',opacity:0}],{duration:250,easing:OUT}),s); }
function count(el,from,to){ if(RM||from===to||from==null){ el.textContent=to; return; } const t0=performance.now(), D=400; const step=t=>{ const k=Math.min(1,(t-t0)/D), e=1-Math.pow(1-k,3); el.textContent=Math.round(from+(to-from)*e); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); pop(el); }
function grande(color){ if(RM) return; const d=document.createElement('div'); d.className='fx-flash'; d.style.background='radial-gradient(circle at 50% 42%,'+(color||'rgba(255,226,160,.62)')+',rgba(255,226,160,.12) 55%,transparent 80%)'; document.body.appendChild(d);
  done(an(d,[{opacity:0},{opacity:1,offset:.22},{opacity:0}],{duration:1150,easing:'ease-out'}),d); const st=document.querySelector('.stage'); if(st) an(st,[{transform:'translate(0,0)'},{transform:'translate(2px,-1px)'},{transform:'translate(-2px,1px)'},{transform:'translate(0,0)'}],{duration:280,composite:'add'}); }
document.addEventListener('pointerdown',e=>{ const b=e.target.closest&&e.target.closest('.btn,.rb,.nf,.np,.day,.tn,.back,.qhandle,.cta,.seg button'); if(!b) return; press(b); if(b.matches('.rb,.nf')) ring(b); else if(b.matches('.btn,.cta')) ripple(b,e.clientX,e.clientY); },{passive:true});
window.__fx={press,pop,rise,sheetIn,ghostOut,bump,bar,shake,ring,ripple,count,grande,RM};
})();
