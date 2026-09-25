const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>[...scope.querySelectorAll(s)];

// mobile menu
const menu=$('.mobile-menu'), nav=$('.nav-links');
menu?.addEventListener('click',()=>nav.classList.toggle('open'));
$$('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

// cursor glow
const glow=$('.cursor-glow');
window.addEventListener('pointermove',e=>{if(glow){glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'}});

// reveal
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});
$$('.reveal').forEach(el=>io.observe(el));

// nav active section
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}})},{rootMargin:'-35% 0px -55% 0px'});
$$('main section[id]').forEach(s=>sectionObserver.observe(s));

// image modal
const modal=$('#imageModal'), modalImg=$('#imageModal img');
$$('[data-image]').forEach(btn=>btn.addEventListener('click',()=>{modalImg.src=btn.dataset.image;modal.showModal()}));
$('.modal-close')?.addEventListener('click',()=>modal.close());
modal?.addEventListener('click',e=>{if(e.target===modal)modal.close()});

// tabs
$$('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  $$('.tab-content').forEach(c=>c.classList.toggle('active',c.dataset.content===btn.dataset.tab));
}));

// countdown
function updateCountdown(){
  const target=new Date('2026-09-30T23:59:59-03:00').getTime(), now=Date.now(), diff=Math.max(0,target-now);
  const d=Math.floor(diff/86400000), h=Math.floor(diff%86400000/3600000), m=Math.floor(diff%3600000/60000);
  $('#daysLeft').textContent=String(d).padStart(2,'0'); $('#hoursLeft').textContent=String(h).padStart(2,'0'); $('#minsLeft').textContent=String(m).padStart(2,'0');
}
updateCountdown(); setInterval(updateCountdown,30000);

// telemetry demo
let t=0;
function points(vals){return vals.map((v,i)=>`${i*(160/(vals.length-1))},${40-v}`).join(' ')}
const tempHist=[10,11,13,14,16,18,19,21,22], tiltHist=[18,16,20,17,22,20,23,22,26];
function telemetry(){
  t+=.18;
  const rpm=Math.round(3800+650*Math.sin(t)+180*Math.sin(t*2.7));
  const speed=Math.max(0,Math.round(27+7*Math.sin(t*.72)+2*Math.sin(t*2)));
  const bat=(12.55+.12*Math.sin(t*.35)).toFixed(1);
  const temp=Math.round(78+5*Math.sin(t*.22)+2*Math.sin(t*.8));
  const tilt=(6+5*Math.sin(t*.5)).toFixed(1);
  $('#rpmValue').textContent=rpm; $('#speedValue').textContent=speed; $('#batteryValue').textContent=bat; $('#tempValue').textContent=temp+' °C'; $('#tiltValue').textContent=tilt+'°';
  $('[data-gauge="rpm"]').style.setProperty('--pct',Math.min(92,Math.max(18,rpm/70))+'%');
  $('[data-gauge="speed"]').style.setProperty('--pct',Math.min(92,Math.max(12,speed*1.55))+'%');
  $('[data-gauge="battery"]').style.setProperty('--pct',Math.min(96,Math.max(40,(parseFloat(bat)-10)*34))+'%');
  tempHist.push(Math.max(5,Math.min(35,(temp-65)*1.1))); tempHist.shift();
  tiltHist.push(Math.max(6,Math.min(34,20+parseFloat(tilt)))); tiltHist.shift();
  $('#tempLine').setAttribute('points',points(tempHist)); $('#tiltLine').setAttribute('points',points(tiltHist));
}
setInterval(telemetry,900); telemetry();

// ===== Canvas pseudo-3D Baja model =====
const canvas=$('#baja3d'), ctx=canvas.getContext('2d');
let DPR=Math.min(window.devicePixelRatio||1,2), W=0,H=0,yaw=-.66,pitch=-.18,zoom=132,drag=false,lastX=0,lastY=0,auto=true,focus='all';
const stateName={all:'VISÃO COMPLETA',frame:'CHASSI TUBULAR',susp:'SUSPENSÃO',power:'MOTOR + CVT',electronics:'ELETRÔNICA'};
const colors={frame:'#56b1ff',susp:'#f4bd4c',power:'#ff675d',electronics:'#2ce59a',tire:'#07101d',rim:'#728aa5',muted:'rgba(110,150,195,.12)'};
const V=(x,y,z)=>({x,y,z});
function rot(p){let cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);let x=p.x*cy-p.z*sy,z=p.x*sy+p.z*cy,y=p.y;return{x,y:y*cp-z*sp,z:y*sp+z*cp}}
function project(p){const q=rot(p),dist=7.5,s=zoom/(q.z+dist);return{x:W/2+q.x*s,y:H*.57-q.y*s,s,z:q.z}}
function alpha(group){return focus==='all'||focus===group?1:.10}
function line(a,b,color,w=3,group='frame'){const A=project(a),B=project(b);ctx.save();ctx.globalAlpha=alpha(group);ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,w*(A.s+B.s)/250);ctx.lineCap='round';ctx.shadowBlur=group===focus?12:0;ctx.shadowColor=color;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.restore()}
function poly(points,fill,stroke,group='frame'){const P=points.map(project);ctx.save();ctx.globalAlpha=alpha(group);ctx.beginPath();ctx.moveTo(P[0].x,P[0].y);P.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}ctx.restore()}
function box(cx,cy,cz,sx,sy,sz,fill,stroke,group){const p=[V(cx-sx,cy-sy,cz-sz),V(cx+sx,cy-sy,cz-sz),V(cx+sx,cy+sy,cz-sz),V(cx-sx,cy+sy,cz-sz),V(cx-sx,cy-sy,cz+sz),V(cx+sx,cy-sy,cz+sz),V(cx+sx,cy+sy,cz+sz),V(cx-sx,cy+sy,cz+sz)];[[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,3,7,4]].forEach(f=>poly(f.map(i=>p[i]),fill,stroke,group))}
function wheel(x,y,z,group='susp'){for(let k=-2;k<=2;k++){let xx=x+k*.055,pts=[];for(let i=0;i<=38;i++){let a=i/38*Math.PI*2;pts.push(V(xx,y+Math.sin(a)*.48,z+Math.cos(a)*.48))}for(let i=0;i<pts.length-1;i++)line(pts[i],pts[i+1],colors.tire,9,group)}let rim=[];for(let i=0;i<=30;i++){let a=i/30*Math.PI*2;rim.push(V(x,y+Math.sin(a)*.28,z+Math.cos(a)*.28))}for(let i=0;i<rim.length-1;i++)line(rim[i],rim[i+1],colors.rim,3,group);for(let a=0;a<6;a++){let ang=a/6*Math.PI*2;line(V(x,y,z),V(x,y+Math.sin(ang)*.24,z+Math.cos(ang)*.24),colors.rim,2,group)}}
const tubes=[[V(-.7,.42,-1.22),V(-.7,.42,1.22)],[V(.7,.42,-1.22),V(.7,.42,1.22)],[V(-.7,.42,-1.22),V(.7,.42,-1.22)],[V(-.7,.42,1.22),V(.7,.42,1.22)],[V(-.63,.45,-.23),V(-.63,1.72,-.34)],[V(.63,.45,-.23),V(.63,1.72,-.34)],[V(-.63,1.72,-.34),V(.63,1.72,-.34)],[V(-.63,1.72,-.34),V(-.54,1.72,.78)],[V(.63,1.72,-.34),V(.54,1.72,.78)],[V(-.54,1.72,.78),V(.54,1.72,.78)],[V(-.54,1.72,.78),V(-.7,.42,1.22)],[V(.54,1.72,.78),V(.7,.42,1.22)],[V(-.7,.42,-1.22),V(-.44,1.03,-1.4)],[V(.7,.42,-1.22),V(.44,1.03,-1.4)],[V(-.44,1.03,-1.4),V(.44,1.03,-1.4)],[V(-.44,1.03,-1.4),V(-.63,1.72,-.34)],[V(.44,1.03,-1.4),V(.63,1.72,-.34)],[V(-.7,.45,.25),V(-.63,1.72,-.34)],[V(.7,.45,.25),V(.63,1.72,-.34)],[V(-.7,.45,-.62),V(-.54,1.72,.78)],[V(.7,.45,-.62),V(.54,1.72,.78)]];
function drawGrid(){ctx.save();ctx.globalAlpha=.16;for(let i=-6;i<=6;i++)line(V(i*.45,0,-2.6),V(i*.45,0,2.4),'#2a5e8f',1,'all');for(let z=-6;z<=6;z++)line(V(-2.7,0,z*.42),V(2.7,0,z*.42),'#2a5e8f',1,'all');ctx.restore()}
function drawVehicle(){drawGrid();[[-1.08,.48,-1.15],[1.08,.48,-1.15],[-1.08,.48,1.06],[1.08,.48,1.06]].forEach(p=>wheel(...p));const hubs=[V(-1.08,.48,-1.15),V(1.08,.48,-1.15),V(-1.08,.48,1.06),V(1.08,.48,1.06)], mounts=[V(-.66,.5,-.9),V(.66,.5,-.9),V(-.68,.5,.87),V(.68,.5,.87)];hubs.forEach((h,i)=>{let m=mounts[i];line(h,V(m.x,m.y+.07,m.z),colors.susp,3,'susp');line(h,V(m.x,m.y+.32,m.z),colors.susp,3,'susp');line(V(h.x,h.y+.03,h.z),V(m.x,m.y+.82,m.z),colors.susp,4,'susp')});tubes.forEach(t=>line(t[0],t[1],colors.frame,5,'frame'));poly([V(-.43,.5,-1.31),V(.43,.5,-1.31),V(.37,1.0,-1.38),V(-.37,1.0,-1.38)],'rgba(6,15,28,.94)',colors.frame,'frame');box(0,.86,.08,.34,.47,.22,'rgba(8,18,31,.96)','#355676','frame');box(0,.76,.93,.38,.27,.28,'rgba(255,103,93,.24)',colors.power,'power');
  // CVT pulleys
  for(let a=0;a<Math.PI*2;a+=.12){line(V(.46,.82,.75),V(.46,.82+Math.sin(a)*.22,.75+Math.cos(a)*.22),colors.power,1.1,'power');line(V(.46,.82,1.02),V(.46,.82+Math.sin(a)*.15,1.02+Math.cos(a)*.15),colors.power,1,'power')}
  line(V(.46,.82,.75),V(.46,.82,1.02),colors.power,8,'power');line(V(-1.08,.48,1.06),V(1.08,.48,1.06),colors.power,5,'power');box(-.35,.76,-.52,.23,.18,.25,'rgba(44,229,154,.2)',colors.electronics,'electronics');[V(-.9,.52,-1.15),V(.9,.52,-1.15),V(0,1.08,.94),V(-.55,.67,-.65)].forEach(p=>{const c=project(p);ctx.save();ctx.globalAlpha=alpha('electronics');ctx.fillStyle=colors.electronics;ctx.shadowBlur=12;ctx.shadowColor=colors.electronics;ctx.beginPath();ctx.arc(c.x,c.y,4,0,Math.PI*2);ctx.fill();ctx.restore()})
}
function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
function render(){ctx.clearRect(0,0,W,H);const g=ctx.createRadialGradient(W*.5,H*.55,20,W*.5,H*.55,Math.max(W,H)*.7);g.addColorStop(0,'#122d50');g.addColorStop(1,'#050a12');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);drawVehicle();if(auto&&!drag)yaw+=.002;requestAnimationFrame(render)}
resize();window.addEventListener('resize',resize);render();
canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.008;pitch=Math.max(-.7,Math.min(.35,pitch+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(85,Math.min(200,zoom-e.deltaY*.08))},{passive:false});
$$('.part-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.part-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');focus=btn.dataset.focus;$('#viewerState').textContent=stateName[focus]}));
$('#autoRotate').addEventListener('click',e=>{auto=!auto;e.currentTarget.textContent=auto?'⟳ Auto-rotação':'⟳ Rotação pausada'});$('#reset3d').addEventListener('click',()=>{yaw=-.66;pitch=-.18;zoom=132;focus='all';$('#viewerState').textContent=stateName.all;$$('.part-btn').forEach((b,i)=>b.classList.toggle('active',i===0))});
