/* TINY DUNGEON - vanilla ES6 + Canvas 2D turn-based RPG */
'use strict';
const CV=document.getElementById('cv'),CX=CV.getContext('2d');
const W=CV.width,H=CV.height,T=32,COLS=15,ROWS=11,MY=96,MAXF=10;
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const PK=a=>a[R(0,a.length-1)];
const CL=(v,a,b)=>Math.max(a,Math.min(b,v));

let AC;
function beep(f,d){try{AC=AC||new(window.AudioContext||webkitAudioContext)();
const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=f;
g.gain.setValueAtTime(.05,AC.currentTime);
g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);
o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}

let mode='title',floor=1,map,seen,foes,items,stairs,hero,bat=null;
let msg='',msgT=0,tick=0,btns=[],best=0;
try{best=+(localStorage.getItem('td_best')||0);}catch(e){}

const FOES=[
{n:'Slime',hp:12,atk:4,def:0,ex:6,gd:5,c:'#66dd66',min:1},
{n:'Bat',hp:10,atk:5,def:0,ex:7,gd:6,c:'#bb77ff',min:1},
{n:'Skeleton',hp:20,atk:7,def:2,ex:12,gd:10,c:'#eeeeee',min:2},
{n:'Orc',hp:30,atk:9,def:3,ex:18,gd:16,c:'#55aa55',min:4},
{n:'Dragon',hp:90,atk:15,def:6,ex:99,gd:150,c:'#ff5544',min:99}];

function newHero(){return{x:1,y:1,hp:32,mhp:32,mp:10,mmp:10,atk:6,def:2,lv:1,ex:0,gold:0,pot:2};}
function toast(s){msg=s;msgT=tick+140;}

function gen(n){
  floor=n;foes=[];items=[];
  map=Array.from({length:ROWS},()=>Array(COLS).fill(1));
  seen=Array.from({length:ROWS},()=>Array(COLS).fill(0));
  let x=1,y=1;
  for(let i=0;i<480;i++){map[y][x]=0;const d=R(0,3);
    x=CL(x+[1,-1,0,0][d],1,COLS-2);y=CL(y+[0,0,1,-1][d],1,ROWS-2);}
  let fx=1,fy=1,bd=-1;
  for(let yy=1;yy<ROWS-1;yy++)for(let xx=1;xx<COLS-1;xx++)
    if(map[yy][xx]===0){const d=Math.abs(xx-1)+Math.abs(yy-1);
      if(d>bd){bd=d;fx=xx;fy=yy;}}
  for(let xx=1;xx<=fx;xx++)map[1][xx]=0;
  for(let yy=1;yy<=fy;yy++)map[yy][fx]=0;
  hero.x=1;hero.y=1;
  if(n===MAXF){stairs=null;foes.push(mkFoe(FOES[4],fx,fy,1));}
  else stairs={x:fx,y:fy};
  const pool=FOES.filter(f=>f.min<=n);
  for(let i=0,c=4+Math.min(5,n);i<c;i++){
    const p=freeTile();if(p)foes.push(mkFoe(PK(pool),p.x,p.y,1+(n-1)*.14));}
  for(let i=0;i<3;i++){const p=freeTile();if(p)items.push({x:p.x,y:p.y,k:'gold',v:R(5,9)+n*2});}
  for(let i=0;i<2;i++){const p=freeTile();if(p)items.push({x:p.x,y:p.y,k:'pot'});}
  reveal();
  toast(n===MAXF?'FLOOR 10 ~ THE DRAGON LAIR':'FLOOR '+n+' ~ find the stairs down');
}
function mkFoe(b,x,y,sc){return{n:b.n,c:b.c,x:x,y:y,boss:b.n==='Dragon'?1:0,
  hp:Math.round(b.hp*sc),mhp:Math.round(b.hp*sc),atk:Math.round(b.atk*sc),
  def:b.def,ex:Math.round(b.ex*sc),gd:Math.round(b.gd*sc)};}
function freeTile(){for(let t=0;t<90;t++){const x=R(1,COLS-2),y=R(1,ROWS-2);
  if(map[y][x]!==0||x===hero.x&&y===hero.y)continue;
  if(stairs&&x===stairs.x&&y===stairs.y)continue;
  if(foes.some(e=>e.x===x&&e.y===y))continue;
  if(items.some(i=>i.x===x&&i.y===y))continue;
  return{x:x,y:y};}return null;}
function reveal(){for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const x=hero.x+dx,y=hero.y+dy;
  if(x>=0&&x<COLS&&y>=0&&y<ROWS&&Math.abs(dx)+Math.abs(dy)<4)seen[y][x]=1;}}

function move(dx,dy){
  if(mode!=='play')return;
  const x=hero.x+dx,y=hero.y+dy;
  if(x<0||y<0||x>=COLS||y>=ROWS||map[y][x]===1)return;
  const f=foes.find(e=>e.x===x&&e.y===y);
  if(f){startBattle(f);return;}
  hero.x=x;hero.y=y;
  const it=items.find(i=>i.x===x&&i.y===y);
  if(it){items=items.filter(i=>i!==it);
    if(it.k==='gold'){hero.gold+=it.v;toast('+'+it.v+' gold!');beep(660,.1);}
    if(it.k==='pot'){hero.pot++;toast('Picked up a potion');beep(520,.1);}}
  if(stairs&&x===stairs.x&&y===stairs.y){
    beep(300,.2);hero.mp=Math.min(hero.mmp,hero.mp+2);save();gen(floor+1);return;}
  reveal();
  foes.forEach(e=>{
    if(Math.random()>.35)return;
    if(Math.abs(e.x-hero.x)+Math.abs(e.y-hero.y)>4)return;
    const nx=e.x+Math.sign(hero.x-e.x),ny=e.y+Math.sign(hero.y-e.y);
    if(nx===hero.x&&ny===hero.y)return;
    if(map[ny][nx]===0&&!foes.some(o=>o!==e&&o.x===nx&&o.y===ny)){e.x=nx;e.y=ny;}});
}

function startBattle(f){mode='battle';beep(200,.15);
  bat={f:f,turn:'hero',busy:0,
    log:f.boss?'THE '+f.n.toUpperCase()+' AWAKENS!':'A wild '+f.n+' appears!'};}
function heroAct(a){
  if(!bat||bat.turn!=='hero')return;
  const f=bat.f;
  if(a==='atk'){const d=Math.max(1,hero.atk+R(-1,2)-f.def);
    f.hp-=d;beep(440,.08);bat.log='You hit '+f.n+' for '+d+'!';}
  else if(a==='fire'){
    if(hero.mp<4){bat.log='Not enough MP!';beep(120,.1);return;}
    hero.mp-=4;const d=Math.max(3,hero.atk*2+R(0,4)-f.def);
    f.hp-=d;beep(180,.2);bat.log='FIREBALL blasts '+f.n+' for '+d+'!';}
  else if(a==='pot'){
    if(hero.pot<1){bat.log='No potions left!';beep(120,.1);return;}
    hero.pot--;const h=Math.min(hero.mhp-hero.hp,18+hero.lv*2);
    hero.hp+=h;beep(700,.12);bat.log='Glug glug... +'+h+' HP';}
  else if(a==='run'){
    if(f.boss){bat.log='There is no escape from the boss!';return;}
    if(R(0,4)<3){mode='play';bat=null;toast('You got away!');return;}
    bat.log='Escape failed!';}
  if(f.hp<=0){winBattle();return;}
  bat.turn='foe';bat.busy=tick+42;
}
function foeAct(){const f=bat.f;
  let d=Math.max(1,f.atk+R(-1,2)-hero.def),note='';
  if(f.n==='Dragon'&&R(0,2)===0){d=Math.round(d*1.6);note=' FIRE BREATH!';}
  hero.hp-=d;beep(140,.12);bat.log=f.n+' hits you for '+d+'!'+note;
  if(hero.hp<=0){hero.hp=0;bat=null;mode='dead';saveBest();beep(80,.5);return;}
  bat.turn='hero';}
function winBattle(){const f=bat.f;
  foes=foes.filter(e=>e!==f);hero.ex+=f.ex;hero.gold+=f.gd;beep(880,.2);bat=null;
  if(f.n==='Dragon'){mode='win';saveBest();
    try{localStorage.removeItem('td_save');}catch(e){}return;}
  mode='play';toast(f.n+' defeated! +'+f.ex+' EXP +'+f.gd+'g');
  let need=hero.lv*20;
  while(hero.ex>=need){hero.ex-=need;hero.lv++;
    hero.mhp+=6;hero.mmp+=3;hero.atk+=2;hero.def+=1;
    hero.hp=hero.mhp;hero.mp=hero.mmp;
    toast('LEVEL UP! now Lv '+hero.lv);beep(990,.25);need=hero.lv*20;}}

function save(){try{localStorage.setItem('td_save',JSON.stringify({floor:floor,hero:hero}));}catch(e){}}
function loadSave(){try{const d=JSON.parse(localStorage.getItem('td_save'));
  if(!d||!d.hero)return 0;hero=d.hero;gen(d.floor);return 1;}catch(e){return 0;}}
function hasSave(){try{return!!localStorage.getItem('td_save');}catch(e){return false;}}
function saveBest(){try{if(floor>best){best=floor;localStorage.setItem('td_best',String(best));}}catch(e){}}
function startNew(){try{localStorage.removeItem('td_save');}catch(e){}
  hero=newHero();gen(1);mode='play';}
function contGame(){if(!loadSave()){hero=newHero();gen(1);}mode='play';}

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(mode==='title'){
    if(k==='enter'||k===' ')startNew();
    else if(k==='c'&&hasSave())contGame();
    return;}
  if(mode==='dead'||mode==='win'){if(k==='enter')mode='title';return;}
  if(mode==='battle'){
    if(k==='1')heroAct('atk');else if(k==='2')heroAct('fire');
    else if(k==='3')heroAct('pot');else if(k==='4')heroAct('run');
    return;}
  const mv={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],
    arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]}[k];
  if(mv){e.preventDefault();move(mv[0],mv[1]);}
});
CV.addEventListener('pointerdown',e=>{
  const r=CV.getBoundingClientRect();
  const px=(e.clientX-r.left)*W/r.width,py=(e.clientY-r.top)*H/r.height;
  for(const b of btns)
    if(px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h){b.fn();return;}
});

function txt(s,x,y,size,col,align){CX.font='bold '+size+'px monospace';
  CX.fillStyle=col;CX.textAlign=align||'left';CX.textBaseline='middle';
  CX.fillText(s,x,y);}
function rect(x,y,w,h,c){CX.fillStyle=c;CX.fillRect(x,y,w,h);}
function bar(x,y,w,h,v,m,c){rect(x,y,w,h,'#221a38');
  rect(x+1,y+1,(w-2)*CL(v/m,0,1),h-2,c);}
function addBtn(x,y,w,h,fn){btns.push({x:x,y:y,w:w,h:h,fn:fn});}
function menuBtn(x,y,w,h,label,fn){rect(x,y,w,h,'#241d3f');
  rect(x+3,y+3,w-6,h-6,'#3b2f66');
  txt(label,x+w/2,y+h/2,16,'#ffe9a0','center');addBtn(x,y,w,h,fn);}
function dBtn(x,y,w,h,label,fn){rect(x,y,w,h,'#241d3f');
  rect(x+2,y+2,w-4,h-4,'#332a57');
  txt(label,x+w/2,y+h/2,15,'#cfc8ee','center');addBtn(x,y,w,h,fn);}
function drawHero(cx,cy,s){const b=Math.sin(tick/10)*1.5*s;
  rect(cx-7*s,cy-5*s+b,14*s,15*s,'#3f74d8');
  CX.fillStyle='#ffd9b0';CX.beginPath();CX.arc(cx,cy-9*s+b,6*s,0,7);CX.fill();
  rect(cx-6*s,cy-16*s+b,12*s,4*s,'#c8452c');
  rect(cx+8*s,cy-12*s+b,3*s,16*s,'#d8d8e8');
  rect(cx+6*s,cy-2*s+b,7*s,3*s,'#a8842f');
  CX.fillStyle='#14101f';
  CX.fillRect(cx-3*s,cy-10*s+b,2*s,2*s);
  CX.fillRect(cx+s,cy-10*s+b,2*s,2*s);}
function drawFoe(f,cx,cy,s){const b=Math.sin(tick/12+cx)*2*s;
  CX.fillStyle=f.c;
  if(f.n==='Slime'){CX.beginPath();CX.ellipse(cx,cy+4*s+b,10*s,8*s,0,0,7);CX.fill();}
  else if(f.n==='Bat'){CX.beginPath();
    CX.moveTo(cx-13*s,cy-4*s+b);CX.lineTo(cx-2*s,cy+b);CX.lineTo(cx-5*s,cy-9*s+b);
    CX.moveTo(cx+13*s,cy-4*s+b);CX.lineTo(cx+2*s,cy+b);CX.lineTo(cx+5*s,cy-9*s+b);
    CX.fill();CX.beginPath();CX.arc(cx,cy+b,6*s,0,7);CX.fill();}
  else if(f.n==='Dragon'){CX.beginPath();
    CX.moveTo(cx-8*s,cy+b);CX.lineTo(cx-24*s,cy-16*s+b);CX.lineTo(cx-15*s,cy+8*s+b);
    CX.moveTo(cx+8*s,cy+b);CX.lineTo(cx+24*s,cy-16*s+b);CX.lineTo(cx+15*s,cy+8*s+b);
    CX.fill();CX.beginPath();CX.ellipse(cx,cy+b,11*s,14*s,0,0,7);CX.fill();}
  else{rect(cx-9*s,cy-10*s+b,18*s,20*s,f.c);
    if(f.n==='Skeleton')for(let i=0;i<3;i++)
      rect(cx-6*s,cy-3*s+i*5*s+b,12*s,2*s,'#14101f');
    if(f.n==='Orc'){rect(cx-12*s,cy-8*s+b,3*s,8*s,f.c);
      rect(cx+9*s,cy-8*s+b,3*s,8*s,f.c);}}
  CX.fillStyle='#14101f';
  CX.fillRect(cx-4*s,cy-5*s+b,2.4*s,2.4*s);
  CX.fillRect(cx+1.6*s,cy-5*s+b,2.4*s,2.4*s);}

function drawHUD(){
  rect(0,0,W,MY,'#151022');
  txt('Lv '+hero.lv+' HERO',12,16,15,'#ffd76a');
  txt('FLOOR '+floor+'/'+MAXF,W-12,16,14,'#9f97c9','right');
  bar(12,30,214,14,hero.hp,hero.mhp,'#e5484d');
  txt('HP '+hero.hp+'/'+hero.mhp,20,37,11,'#fff');
  bar(12,48,214,12,hero.mp,hero.mmp,'#4f7cff');
  txt('MP '+hero.mp+'/'+hero.mmp,20,54,11,'#fff');
  bar(12,64,214,8,hero.ex,hero.lv*20,'#3ddc84');
  txt('ATK '+hero.atk+'   DEF '+hero.def+'   GOLD '+hero.gold+'   POT x'+hero.pot,12,82,12,'#cfc8ee');
  txt('BEST F'+best,W-12,82,12,'#6f68a0','right');}
function drawMap(){
  rect(0,MY,W,ROWS*T,'#05030a');
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(!seen[y][x])continue;
    const sx=x*T,sy=MY+y*T;
    if(map[y][x]===1){rect(sx,sy,T,T,'#2c2545');rect(sx+2,sy+2,T-4,T-8,'#3a3160');}
    else rect(sx,sy,T,T,(x+y)%2?'#191430':'#1d1738');}
  if(stairs&&seen[stairs.y][stairs.x]){
    const sx=stairs.x*T,sy=MY+stairs.y*T;
    rect(sx+5,sy+5,22,22,'#0a0812');
    rect(sx+8,sy+8,16,4,'#8d86b8');
    rect(sx+11,sy+14,13,4,'#8d86b8');
    rect(sx+14,sy+20,10,4,'#8d86b8');}
  for(const it of items){
    if(!seen[it.y][it.x])continue;
    const cx=it.x*T+16,cy=MY+it.y*T+16;
    if(it.k==='gold'){CX.fillStyle='#ffd23f';
      CX.beginPath();CX.arc(cx,cy+3,7,0,7);CX.fill();
      txt('$',cx,cy+3,10,'#7a5a00','center');}
    else{rect(cx-2,cy-10,5,5,'#caa66a');
      CX.fillStyle='#e5484d';
      CX.beginPath();CX.arc(cx,cy+2,7,0,7);CX.fill();}}
  for(const f of foes)
    if(seen[f.y][f.x])drawFoe(f,f.x*T+16,MY+f.y*T+16,1);
  drawHero(hero.x*T+16,MY+hero.y*T+16,1);}
function drawControls(){
  rect(0,MY+ROWS*T,W,H-MY-ROWS*T,'#151022');
  if(tick<msgT)txt(msg,W/2,464,13,'#ffe9a0','center');
  else txt('Walk into monsters to fight. Stairs lead down.',W/2,464,11,'#5e5687','center');
  txt('WASD / arrows',100,486,10,'#5e5687','center');
  dBtn(78,496,44,40,'^',()=>move(0,-1));
  dBtn(30,542,44,40,'<',()=>move(-1,0));
  dBtn(126,542,44,40,'>',()=>move(1,0));
  dBtn(78,588,44,40,'v',()=>move(0,1));
  txt('MONSTERS',268,492,11,'#8f86bb');
  let ly=510;
  for(const f of FOES){
    if(f.min>floor)continue;
    rect(268,ly-5,10,10,f.c);
    txt(f.n,284,ly,10,'#8f86bb');
    ly+=17;}
  txt('keys 1-4 in battle',350,620,10,'#494270');}
function drawTitle(){
  rect(0,0,W,H,'#0b0912');
  for(let i=0;i<70;i++)
    rect((i*89)%W,(i*53)%H,2,2,i%3?'#221b3d':'#4a4073');
  txt('TINY DUNGEON',W/2,128+Math.sin(tick/25)*4,40,'#ffd76a','center');
  txt('~ a vanilla js canvas rpg ~',W/2,166,13,'#8f86bb','center');
  drawHero(W/2-95,262,2.6);
  drawFoe({n:'Dragon',c:'#ff5544'},W/2+95,262,2.2);
  menuBtn(W/2-115,350,230,54,'NEW GAME',startNew);
  if(hasSave())menuBtn(W/2-115,416,230,54,'CONTINUE (C)',contGame);
  txt('best run: floor '+best,W/2,512,13,'#6f68a0','center');
  txt('move: WASD / arrows / d-pad',W/2,556,11,'#5e5687','center');
  txt('walk into monsters to fight - stairs lead down',W/2,576,11,'#5e5687','center');
  txt('game saves when you take the stairs',W/2,596,11,'#5e5687','center');}
function drawBattle(){
  rect(0,0,W,H,'#120d1e');
  const f=bat.f;
  txt('FLOOR '+floor,W-12,22,12,'#6f68a0','right');
  txt(f.n+(f.boss?'  ~ BOSS ~':''),W/2,56,22,f.c,'center');
  bar(W/2-130,78,260,14,Math.max(0,f.hp),f.mhp,'#e5484d');
  txt('HP '+Math.max(0,f.hp)+'/'+f.mhp,W/2,85,11,'#fff','center');
  rect(0,300,W,62,'#1a1330');
  drawFoe(f,W/2,205,5);
  drawHero(110,305,2.4);
  bar(24,348,200,12,hero.hp,hero.mhp,'#e5484d');
  txt('HP '+hero.hp+'/'+hero.mhp,30,354,10,'#fff');
  bar(24,364,200,10,hero.mp,hero.mmp,'#4f7cff');
  txt('MP '+hero.mp+'/'+hero.mmp,30,369,10,'#fff');
  rect(24,388,W-48,42,'#1d1636');
  txt(bat.log,W/2,409,13,'#ffe9a0','center');
  const on=bat.turn==='hero';
  actBtn(24,448,'1  ATTACK',on,()=>heroAct('atk'));
  actBtn(248,448,'2  FIREBALL  4MP',on,()=>heroAct('fire'));
  actBtn(24,516,'3  POTION  x'+hero.pot,on,()=>heroAct('pot'));
  actBtn(248,516,'4  ESCAPE',on,()=>heroAct('run'));
  txt(on?'your move':f.n+' is acting...',W/2,600,12,'#8f86bb','center');}
function actBtn(x,y,label,on,fn){
  const w=208,h=52;
  rect(x,y,w,h,on?'#241d3f':'#171226');
  rect(x+2,y+2,w-4,h-4,on?'#3b2f66':'#1c1631');
  txt(label,x+w/2,y+h/2,13,on?'#ffe9a0':'#57507a','center');
  if(on)addBtn(x,y,w,h,fn);}
function drawDead(){
  rect(0,0,W,H,'#0b0912');
  txt('YOU DIED',W/2,190,44,'#e5484d','center');
  txt('You fell on floor '+floor+'.',W/2,240,15,'#cfc8ee','center');
  txt('best run: floor '+best,W/2,266,13,'#6f68a0','center');
  if(hasSave())txt('CONTINUE on title = respawn at floor start',W/2,300,11,'#5e5687','center');
  menuBtn(W/2-115,350,230,54,'BACK TO TITLE',()=>mode='title');}
function drawWin(){
  rect(0,0,W,H,'#0b0912');
  for(let i=0;i<90;i++){
    const sp=(i%3)+1;
    rect((i*67+tick*sp)%W,(i*97+tick*sp*2)%H,3,3,
      ['#ffd23f','#e5484d','#4f7cff','#3ddc84'][i%4]);}
  txt('VICTORY!',W/2,170,46,'#ffd76a','center');
  txt('The dragon is slain. The dungeon is free.',W/2,224,15,'#cfc8ee','center');
  txt('Lv '+hero.lv+'   gold '+hero.gold,W/2,252,13,'#8f86bb','center');
  menuBtn(W/2-115,350,230,54,'TITLE',()=>mode='title');}

function update(){tick++;
  if(mode==='battle'&&!bat)mode='play';
  if(mode==='battle'&&bat&&bat.turn==='foe'&&tick>=bat.busy)foeAct();}
function draw(){btns=[];
  if(mode==='title')drawTitle();
  else if(mode==='battle'&&bat)drawBattle();
  else if(mode==='dead')drawDead();
  else if(mode==='win')drawWin();
  else{drawHUD();drawMap();drawControls();}}
(function loop(){update();draw();requestAnimationFrame(loop);})();
