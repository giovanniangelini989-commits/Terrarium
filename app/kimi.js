/* Modelli procedurali (Kimi, pass 1) — creature e oggetti */
window.__KIMI=function(THREE){

/* Terrario — procedural asset library, Pass 1.
   1 unit = 10 cm. All geometry is indexed and carries linear vertex colors. */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const C = hex => new THREE.Color(hex);
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const M = (p=[0,0,0], s=[1,1,1], r=[0,0,0]) => new THREE.Matrix4().compose(
  V(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), V(...s)
);
const sphere = (w=7,h=5) => new THREE.SphereGeometry(1,w,h);
const cylinder = (rt=1,rb=1,h=1,n=6,open=false) => new THREE.CylinderGeometry(rt,rb,h,n,1,open);
const box = () => new THREE.BoxGeometry(1,1,1);
const cone = (n=6) => new THREE.ConeGeometry(1,1,n);
const octa = () => new THREE.OctahedronGeometry(1,0);

function part(g, p, s, c, r=[0,0,0], anim=[0,0], emit=0, sway=0) {
  return { g, m:M(p,s,r), c:C(c), anim, emit, sway };
}
function segment(a,b,r1,r2,color,sides=5,anim=[0,0],emit=0) {
  const av=V(...a), bv=V(...b), d=bv.clone().sub(av), mid=av.clone().add(bv).multiplyScalar(.5);
  const q=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.clone().normalize());
  const m=new THREE.Matrix4().compose(mid,q,V(1,1,1));
  return {g:cylinder(r2,r1,d.length(),sides,true),m,c:C(color),anim,emit,sway:0};
}

/** Merge indexed parts without BufferGeometryUtils. */
function mergeParts(parts) {
  let vertexCount=0,indexCount=0;
  const prepared=parts.map(p=>{
    const g=p.g.clone();
    if(p.m) g.applyMatrix4(p.m);
    if(!g.index) g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
    vertexCount+=g.attributes.position.count;
    indexCount+=g.index.count;
    return {p,g};
  });
  const pos=new Float32Array(vertexCount*3), nor=new Float32Array(vertexCount*3), col=new Float32Array(vertexCount*3);
  const anim=new Float32Array(vertexCount*2), emit=new Float32Array(vertexCount), sway=new Float32Array(vertexCount);
  const idx=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
  let vo=0,io=0;
  for(const {p,g} of prepared){
    const n=g.attributes.position.count;
    pos.set(g.attributes.position.array,vo*3);
    if(g.attributes.normal) nor.set(g.attributes.normal.array,vo*3);
    const gc=g.attributes.color;
    for(let i=0;i<n;i++){
      const cc=gc?C(0xffffff).fromBufferAttribute(gc,i):p.c||C(0xffffff);
      col[(vo+i)*3]=cc.r; col[(vo+i)*3+1]=cc.g; col[(vo+i)*3+2]=cc.b;
      anim[(vo+i)*2]=p.anim?.[0]||0; anim[(vo+i)*2+1]=p.anim?.[1]||0;
      emit[vo+i]=p.emit||0; sway[vo+i]=p.sway||0;
    }
    for(let i=0;i<g.index.count;i++) idx[io+i]=g.index.array[i]+vo;
    vo+=n; io+=g.index.count; g.dispose();
  }
  const out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.BufferAttribute(pos,3));
  out.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.setAttribute('aAnim',new THREE.BufferAttribute(anim,2));
  out.setAttribute('aEmit',new THREE.BufferAttribute(emit,1));
  out.setAttribute('aSway',new THREE.BufferAttribute(sway,1));
  out.setIndex(new THREE.BufferAttribute(idx,1));
  out.computeBoundingSphere();
  return out;
}
function meshOf(parts,materialHint={}){
  const geometry=mergeParts(parts);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.05,...materialHint});
  const mesh=new THREE.Mesh(geometry,material); mesh.castShadow=true; mesh.receiveShadow=true;
  return mesh;
}
function objectResult(parts,size,materialHint={}){
  const group=new THREE.Group(); group.add(meshOf(parts,materialHint));
  return {group,size:{w:size[0],h:size[1],d:size[2]},materials:[materialHint]};
}
function creature(parts,length,materialHint={}){
  const geometry=mergeParts(parts);
  geometry.computeBoundingBox();
  geometry.translate(0,-geometry.boundingBox.min.y,0); // feet exactly on y=0
  geometry.computeBoundingSphere();
  return {geometry,length,materialHint:{vertexColors:true,roughness:.7,metalness:.05,...materialHint}};
}

// Low-resolution shared primitives keep every creature below 350 triangles.
const S56=sphere(7,5), S36=sphere(6,4), S24=sphere(6,3), O8=octa();

function antBuild(){
  const p=[], body='#2B1D14', joint='#3A281B';
  p.push(part(S56,[-.063,.071,0],[.050,.043,.041],body));
  p.push(part(S36,[-.005,.069,0],[.034,.032,.030],body));
  p.push(part(S56,[.060,.074,0],[.039,.038,.036],body));
  p.push(segment([-.030,.068,0],[-.020,.068,0],.011,.009,joint,5));
  p.push(part(O8,[-.101,.071,0],[.012,.025,.022],'#40291A',[0,0,-.15],[0,0],1));
  for(const side of [-1,1]){
    p.push(part(O8,[.083,.085,side*.030],[.005,.005,.004],'#100D0B'));
    for(let i=0;i<3;i++){
      const x=.047-i*.043, phase=((i+(side>0?1:0))%2?1:-1);
      const a=[x,.060,side*.021], k=[x+(i-1)*.010,.035,side*.052], f=[x+(i-1)*.019,.004,side*.073];
      p.push(segment(a,k,.005,.004,body,4,[1,phase]));
      p.push(segment(k,f,.004,.0022,joint,4,[1,phase]));
    }
    const a=[.080,.099,side*.014], e=[.102,.125,side*.026], t=[.126,.131,side*.037];
    p.push(segment(a,e,.0032,.0025,body,4,[2,side]));
    p.push(segment(e,t,.0025,.0014,body,4,[2,side]));
    p.push(segment([.090,.058,side*.014],[.107,.051,side*.023],.004,.0015,'#1B120D',4,[4,side]));
  }
  return creature(p,.20);
}

function termiteBuild(){
  const p=[], cream='#E6D6A8', brown='#7A5A30';
  const xs=[-.077,-.040,-.005,.027], scales=[[.037,.032,.032],[.034,.031,.031],[.030,.029,.029],[.026,.027,.027]];
  xs.forEach((x,i)=>p.push(part(S36,[x,.056,0],scales[i],i===0?'#DDCB9B':cream)));
  p.push(part(S36,[.068,.058,0],[.035,.031,.030],brown));
  for(const side of [-1,1]){
    p.push(part(O8,[.084,.068,side*.025],[.0035,.0035,.003],'#261D12'));
    for(let i=0;i<3;i++){
      const x=.040-i*.039, ph=(i+(side>0?1:0))%2?1:-1;
      const k=[x-.005,.029,side*.041], f=[x+.007,.003,side*.058];
      p.push(segment([x,.049,side*.020],k,.004,.003,brown,4,[1,ph]));
      p.push(segment(k,f,.003,.0018,brown,4,[1,ph]));
    }
    p.push(segment([.086,.077,side*.012],[.112,.092,side*.025],.0023,.0012,brown,4,[2,side]));
  }
  return creature(p,.24);
}

function beetleBuild(){
  const p=[], shell='#2F9A60', dark='#14281C';
  p.push(part(S56,[-.036,.079,0],[.112,.070,.075],shell));
  p.push(part(S36,[.092,.061,0],[.051,.045,.049],dark));
  p.push(part(S36,[.040,.066,0],[.052,.047,.060],'#267B4D'));
  p.push(segment([-.132,.112,0],[.026,.137,0],.002,.002,'#173C29',4,[0,0],.3));
  for(const side of [-1,1]){
    p.push(part(O8,[.114,.071,side*.037],[.004,.004,.003],'#080D0A'));
    for(let i=0;i<3;i++){
      const x=.068-i*.064, ph=(i+(side>0?1:0))%2?1:-1;
      const k=[x+(i-1)*.012,.035,side*.080], f=[x+(i-1)*.025,.003,side*.105];
      p.push(segment([x,.052,side*.050],k,.006,.004,dark,4,[1,ph]));
      p.push(segment(k,f,.004,.002,dark,4,[1,ph]));
    }
    p.push(segment([.120,.080,side*.020],[.147,.093,side*.040],.0025,.0012,dark,4,[2,side]));
    p.push(segment([-.090,.059,side*.066],[.025,.055,side*.073],.003,.003,'#67B66F',4,[0,0],.3));
  }
  return creature(p,.34,{roughness:.32,metalness:.12});
}

function spiderBuild(){
  const p=[], abdomen='#3A2A35', thorax='#241A22';
  p.push(part(S56,[-.052,.091,0],[.073,.064,.063],abdomen));
  p.push(part(S36,[.050,.064,0],[.052,.041,.045],thorax));
  for(const side of [-1,1]) for(let i=0;i<4;i++){
    const x=.070-i*.037, reach=.115+(.5-Math.abs(i-1.5))*.035;
    const knee=[x+(1.5-i)*.027,.120,side*(.073+reach*.34)];
    const foot=[x+(1.5-i)*.061,.003,side*reach];
    const ph=(i+(side>0?1:0))%2?1:-1;
    p.push(segment([x,.058,side*.027],knee,.005,.004,thorax,4,[1,ph]));
    p.push(segment(knee,foot,.004,.0018,abdomen,4,[1,ph]));
  }
  for(const side of [-1,1]) for(let j=0;j<2;j++)
    p.push(part(O8,[.091,.074+j*.009,side*(.012+j*.010)],[.0035,.0035,.003],'#B88662'));
  return creature(p,.22);
}

function spiralShell(){
  // A true Archimedean spiral tube, not a torus: 25 path rings × 4 sides.
  const path=25,sides=4,positions=[],normals=[],colors=[],indices=[];
  const ca=C('#9A6A3C'), cb=C('#6A4220');
  for(let i=0;i<path;i++){
    const t=i/(path-1), ang=t*Math.PI*4.35, rad=.006+.070*t;
    const cx=-.035+Math.cos(ang)*rad, cy=.137+Math.sin(ang)*rad;
    const tube=.007+.012*t;
    for(let j=0;j<sides;j++){
      const a=j/sides*Math.PI*2;
      const nx=Math.cos(ang)*Math.cos(a), ny=Math.sin(ang)*Math.cos(a), nz=Math.sin(a);
      positions.push(cx+nx*tube,cy+ny*tube,nz*tube*.82);
      normals.push(nx,ny,nz);
      const cc=(i%8<3)?cb:ca; colors.push(cc.r,cc.g,cc.b);
    }
  }
  for(let i=0;i<path-1;i++) for(let j=0;j<sides;j++){
    const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
    indices.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); g.setIndex(indices); g.computeBoundingSphere();
  return g;
}
function snailBuild(){
  const p=[part(S36,[-.020,.039,0],[.151,.034,.047],'#C9B79C'),part(S36,[.110,.052,0],[.064,.041,.041],'#C9B79C')];
  p.push({g:spiralShell(),m:M([0,0,0],[1,1,1]),c:C('#9A6A3C'),anim:[0,0],emit:0,sway:0});
  for(const side of [-1,1]){
    p.push(segment([.133,.073,side*.020],[.158,.126,side*.032],.0035,.0022,'#C9B79C',4,[2,side]));
    p.push(part(O8,[.158,.127,side*.032],[.005,.005,.005],'#211A16'));
    p.push(segment([.146,.066,side*.025],[.171,.082,side*.042],.002,.001,'#C9B79C',4,[2,-side]));
  }
  return creature(p,.38);
}

function wingGeometry(){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.07,.008,.045,-.12,.005,.10,-.035,0,.115,.035,0,.040],3));
  g.setIndex([0,1,4,1,2,3,1,3,4]); g.computeVertexNormals(); return g;
}
function flyBuild(){
  const p=[], body='#222A2E';
  p.push(part(S36,[-.043,.068,0],[.049,.041,.036],body));
  p.push(part(S36,[.015,.071,0],[.043,.043,.041],'#303B40'));
  p.push(part(S36,[.064,.073,0],[.032,.033,.035],body));
  for(const side of [-1,1]){
    p.push(part(S24,[.071,.081,side*.029],[.021,.024,.014],'#7A1A1A',[0,0,0],[0,0],.4));
    p.push({g:wingGeometry(),m:M([.005,.105,side*.012],[1,1,1],[side<0?Math.PI:0,0,side*.10]),c:C('#CFD8DC'),anim:[3,side],emit:0,sway:0});
    for(let i=0;i<3;i++){
      const x=.045-i*.039, ph=(i+(side>0?1:0))%2?1:-1;
      p.push(segment([x,.053,side*.020],[x+(1-i)*.018,.003,side*(.055+i*.008)],.0022,.0012,body,4,[1,ph]));
    }
    p.push(segment([.087,.061,side*.010],[.103,.054,side*.016],.0018,.001,body,4,[2,side]));
  }
  return creature(p,.18);
}

const CREATURE_BUILDERS={formiche:antBuild,termiti:termiteBuild,coleotteri:beetleBuild,ragni:spiderBuild,lumache:snailBuild,mosche:flyBuild};

function statuinaBuild(THREE_,opts={}){
  const rnd=mulberry32(opts.seed??11), stone=rnd()>.5?'#8B8272':'#817A6D', p=[];
  p.push(part(box(),[0,.035,0],[.34,.07,.25],stone));
  p.push(part(box(),[0,.225,0],[.25,.34,.20],stone,[0,0,-.025]));
  p.push(part(S36,[0,.445,.005],[.20,.105,.15],stone));
  p.push(part(box(),[0,.432,.112],[.23,.115,.075],stone));
  for(const side of [-1,1]){
    p.push(part(box(),[side*.065,.458,.153],[.055,.037,.012],'#403D37'));
    p.push(part(box(),[side*.145,.250,.015],[.065,.22,.12],stone,[0,0,side*.10]));
  }
  p.push(part(box(),[0,.405,.158],[.040,.060,.035],'#756E62'));
  return objectResult(p,[.40,.55,.30]);
}

function clockBuild(THREE_,opts={}){
  const p=[], brass='#A8864F', face='#D7CFB6';
  p.push(part(box(),[0,.025,0],[.30,.05,.20],'#64513B'));
  p.push(part(cylinder(1,1,1,16),[0,.285,0],[.25,.20,.25],brass,[Math.PI/2,0,0]));
  p.push(part(cylinder(1,1,1,16),[0,.285,.104],[.217,.012,.217],face,[Math.PI/2,0,0]));
  const rim=new THREE.TorusGeometry(.229,.016,4,16);
  p.push(part(rim,[0,.285,.116],[1,1,1],brass));
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    p.push(part(box(),[Math.sin(a)*.176,.285+Math.cos(a)*.176,.120],[.012,.030,.008],'#594D3B',[0,0,-a]));
  }
  p.push(segment([0,.285,.130],[-.080,.350,.130],.007,.005,'#3F3A32',4));
  p.push(segment([0,.285,.134],[.108,.300,.134],.005,.003,'#3F3A32',4));
  p.push(part(S24,[0,.285,.139],[.014,.014,.008],brass));
  p.push(part(new THREE.TorusGeometry(.045,.009,4,8),[0,.566,0],[1,1,1],brass));
  return objectResult(p,[.50,.62,.20],{roughness:.5,metalness:.28});
}

function teddyBuild(){
  const p=[], fur='#9A7654', light='#B99A73', dark='#47382D';
  p.push(part(S36,[0,.245,0],[.175,.215,.145],fur));
  p.push(part(S36,[0,.475,0],[.190,.155,.150],fur));
  for(const side of [-1,1]){
    p.push(part(S36,[side*.145,.565,-.005],[.077,.077,.055],fur));
    p.push(part(S24,[side*.145,.565,.043],[.042,.044,.018],light));
    p.push(part(S36,[side*.190,.290,.005],[.075,.155,.070],fur,[0,0,side*.30]));
    p.push(part(S36,[side*.105,.085,.035],[.095,.085,.115],fur));
    p.push(part(O8,[side*.065,.495,.139],[.012,.014,.009],dark));
  }
  p.push(part(S36,[0,.430,.133],[.093,.065,.050],light));
  p.push(part(O8,[0,.457,.179],[.026,.019,.015],dark));
  p.push(segment([0,.431,.181],[0,.402,.181],.004,.003,dark,4));
  p.push(part(box(),[0,.275,.145],[.016,.14,.012],'#71563F',[0,0,.08]));
  const result=objectResult(p,[.45,.60,.40]), g=result.group.children[0].geometry;
  g.computeBoundingBox(); const size=g.boundingBox.getSize(new THREE.Vector3());
  g.applyMatrix4(M([0,0,0],[.45/size.x,.60/size.y,.40/size.z])); g.computeBoundingSphere();
  return result;
}

function mirrorBuild(){
  const p=[], frame='#9B8354';
  p.push(part(cylinder(1,1,1,24),[0,.565,0],[.275,.07,.275],frame,[Math.PI/2,0,0]));
  p.push(part(new THREE.TorusGeometry(.258,.018,5,24),[0,.565,.045],[1,1,1],'#B09862'));
  p.push(part(box(),[0,.160,0],[.075,.29,.065],frame,[0,0,-.04]));
  p.push(part(S24,[0,.035,0],[.065,.035,.055],frame));
  const result=objectResult(p,[.55,.85,.14],{roughness:.42,metalness:.55});
  const glassGeo=mergeParts([part(cylinder(1,1,1,24),[0,.565,.047],[.235,.008,.235],'#C6D1D1',[Math.PI/2,0,0])]);
  const glassHint={vertexColors:true,metalness:1,roughness:.05};
  const glass=new THREE.Mesh(glassGeo,new THREE.MeshStandardMaterial(glassHint)); glass.name='mirror_glass';
  result.group.add(glass); result.materials.push(glassHint); return result;
}

function bookBuild(THREE_,opts={}){
  const rnd=mulberry32(opts.seed??29), cover=rnd()>.5?'#705347':'#5E6A60', p=[];
  p.push(part(box(),[0,.018,0],[.70,.036,.50],cover,[0,.025,0]));
  p.push(part(box(),[0,.066,0],[.66,.068,.465],'#C9BFA5',[0,.025,0]));
  p.push(part(box(),[0,.108,0],[.70,.024,.50],cover,[0,.025,0]));
  p.push(part(box(),[-.337,.063,0],[.026,.105,.50],'#4E4038',[0,.025,0]));
  for(let i=0;i<4;i++) p.push(part(box(),[.015,.043+i*.014,.235],[.61,.003,.003],'#9D927C',[0,.025,0]));
  p.push(part(box(),[.09,.122,.01],[.20,.003,.12],'#A58C5F',[0,.025,0]));
  return objectResult(p,[.70,.124,.50]);
}

function coinBuild(){
  const p=[], gold='#B3934F';
  p.push(part(cylinder(1,1,1,24),[0,.15,0],[.15,.04,.15],gold,[Math.PI/2,0,0]));
  p.push(part(new THREE.TorusGeometry(.125,.007,4,24),[0,.15,.023],[1,1,1],'#D0B86E'));
  p.push(part(box(),[0,.15,.029],[.022,.13,.008],'#765E35'));
  p.push(part(box(),[0,.15,.030],[.095,.022,.008],'#765E35'));
  for(const side of [-1,1]) p.push(part(box(),[side*.05,.15,.030],[.018,.07,.008],'#765E35',[0,0,side*.35]));
  return objectResult(p,[.30,.30,.048],{roughness:.38,metalness:.72});
}

function radioBuild(){
  const p=[], caseC='#65716B', trim='#B19A70', dark='#343C39';
  p.push(part(box(),[0,.185,0],[.60,.35,.20],caseC));
  p.push(part(box(),[-.115,.190,.104],[.29,.25,.012],dark));
  for(let i=0;i<6;i++) p.push(part(box(),[-.115,.092+i*.039,.113],[.25,.012,.009],'#879088'));
  p.push(part(box(),[.155,.255,.108],[.17,.075,.012],'#D2C6A2'));
  p.push(part(box(),[.155,.255,.117],[.11,.008,.005],'#6B5B43'));
  for(const y of [.125,.190]) p.push(part(cylinder(1,1,1,12),[.185,y,.122],[.035,.025,.035],trim,[Math.PI/2,0,0]));
  p.push(segment([.23,.355,0],[.30,.55,0],.008,.004,'#8F9690',6));
  p.push(part(box(),[0,.018,0],[.54,.036,.19],'#424B47'));
  return objectResult(p,[.60,.55,.20],{roughness:.58,metalness:.16});
}

function candleBuild(){
  const p=[], wax='#D7C49C';
  p.push(part(cylinder(1,1,1,16),[0,.260,0],[.075,.52,.075],wax));
  p.push(part(cylinder(1,1,1,16),[0,.517,0],[.066,.012,.066],'#BDA87F'));
  p.push(segment([0,.515,0],[0,.548,0],.006,.003,'#3B3025',5));
  for(const a of [.2,2.3,4.5]){
    const x=Math.cos(a)*.071,z=Math.sin(a)*.071;
    p.push(part(S24,[x,.45,z],[.013,.07,.013],wax));
  }
  const result=objectResult(p,[.15,.64,.15]);
  const flameGeo=mergeParts([part(S24,[0,.586,0],[.027,.055,.022],'#FFC46B',[0,0,-.12],[0,0],1)]);
  const flameHint={vertexColors:true,roughness:.7,emissive:'#FF9D45',emissiveIntensity:2};
  const flame=new THREE.Mesh(flameGeo,new THREE.MeshStandardMaterial(flameHint)); flame.name='candle_flame';
  result.group.add(flame); result.materials.push(flameHint); return result;
}

const OBJECT_BUILDERS={statuina:statuinaBuild,orologio:clockBuild,giocattolo:teddyBuild,specchio:mirrorBuild,libro:bookBuild,moneta:coinBuild,radio:radioBuild,candela:candleBuild};

function wrapCreature(fn){ return {build:(THREE_,opts={})=>fn(THREE_,opts)}; }
function wrapObject(fn){ return {build:(THREE_,opts={})=>fn(THREE_,opts)}; }

const MODELS={
  meta:{unit_cm:10,version:'1.0-pass1'},
  creatures:Object.fromEntries(Object.entries(CREATURE_BUILDERS).map(([k,v])=>[k,wrapCreature(v)])),
  objects:Object.fromEntries(Object.entries(OBJECT_BUILDERS).map(([k,v])=>[k,wrapObject(v)]))
};


return MODELS;
};
