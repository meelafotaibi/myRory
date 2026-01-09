(() => {
  // ===== Elements =====
  const canvas = document.getElementById('heartCanvas');
  const ctx = canvas.getContext('2d', { alpha:false });

  const rosesLayer = document.getElementById('rosesLayer');
  const fallingRoses = document.getElementById('fallingRoses');
  const sprayRoses = document.getElementById('sprayRoses');
  const roseBed = document.getElementById('roseBed');

  const wrap = document.getElementById('wrap');
  const seal = document.getElementById('seal');
  const tryOpen = document.getElementById('tryOpen');

  const answer1 = document.getElementById('answer1');
  const check1 = document.getElementById('check1');
  const hintBtn1 = document.getElementById('hintBtn1');
  const feedback1 = document.getElementById('feedback1');
  const reveal1 = document.getElementById('reveal1');
  const choices1 = document.getElementById('choices1');
  const wantPuzzle2 = document.getElementById('wantPuzzle2');
  const wantSecret = document.getElementById('wantSecret');

  const puzzle2 = document.getElementById('puzzle2');
  const answer2 = document.getElementById('answer2');
  const check2 = document.getElementById('check2');
  const hintBtn2 = document.getElementById('hintBtn2');
  const feedback2 = document.getElementById('feedback2');

  const halfMessage = document.getElementById('halfMessage');
  const fullLetter = document.getElementById('fullLetter');
  const fullMessage = document.getElementById('fullMessage');

  const miniGame = document.getElementById('miniGame');
  const miniRow = document.getElementById('miniRow');
  const miniResult = document.getElementById('miniResult');

  const confetti = document.getElementById('confetti');

  // ===== Resize =====
  function resize(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize);
  resize();

  // ===== Pointer glow (subtle, behind heart) =====
  let pointer = { x: innerWidth/2, y: innerHeight/2 };
  addEventListener('pointermove', (e)=> { pointer.x=e.clientX; pointer.y=e.clientY; }, {passive:true});

  function glowBehind(){
    const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220);
    g.addColorStop(0, 'rgba(255,209,232,0.04)');
    g.addColorStop(0.35, 'rgba(255,182,217,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,innerWidth, innerHeight);
  }

  // ===== Heart curve =====
  function heartPoint(t){
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
    return {x,y};
  }

  // ~10s draw
  const totalTime = 10000;
  const startAt = performance.now();
  let t = 0;
  let finished = false;

  const step = 0.014;
  const raysPerFrame = 5;
  const baseScale = 14.8;
  const centerPull = 0.18;

  function clearSoft(alpha){
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0,0,innerWidth, innerHeight);
  }

  function drawRay(fx,fy,x,y,a){
    ctx.strokeStyle = `rgba(255,209,232,${a})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(fx,fy);
    ctx.lineTo(x,y);
    ctx.stroke();
  }

  function loop(now){
    clearSoft(finished ? 0.18 : 0.08);
    glowBehind();

    const W=innerWidth, H=innerHeight;
    const cx=W*0.5, cy=H*0.46;

    const timeProgress = Math.min(1, (now - startAt)/totalTime);
    const targetT = timeProgress * Math.PI*2;

    const breathe = 1 + Math.sin(now*0.003)*0.02;
    const scale = baseScale*breathe;

    if(!finished){
      for(let i=0;i<raysPerFrame;i++){
        if(t>=targetT) break;

        const p = heartPoint(t);
        const x = cx + p.x*scale;
        const y = cy - p.y*scale;
        const fx = cx + (p.x*scale)*centerPull;
        const fy = cy - (p.y*scale)*centerPull;

        const a = 0.22 + Math.sin((t/(Math.PI*2))*Math.PI)*0.52;
        drawRay(fx,fy,x,y,a);

        t += step;
      }

      if(timeProgress>=1){
        finished=true;
        setTimeout(()=>{
          document.body.classList.add('heart-fade');
          document.body.classList.add('roses-on');
          document.body.classList.add('ui-on');
          startRoseCurtain();
        }, 350);
      }
    } else {
      for(let i=0;i<2;i++){
        const tt=Math.random()*Math.PI*2;
        const p=heartPoint(tt);
        const x=cx+p.x*scale;
        const y=cy-p.y*scale;
        const fx=cx+(p.x*scale)*centerPull;
        const fy=cy-(p.y*scale)*centerPull;
        drawRay(fx,fy,x,y,0.08);
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ===== Rose factory =====
  function makeRoseEl(cls){
    const d=document.createElement('div');
    d.className=cls;
    d.innerHTML = `
      <div class="petals"><span></span><span></span><span></span><span></span><span></span></div>
      <div class="center"></div>
    `;
    return d;
  }

  function spawnFallingRose(){
    const rose=makeRoseEl("rose");
    const left=Math.random()*100;
    const size=14+Math.random()*12;
    const dur=5.8+Math.random()*6.2;
    const drift=(-26+Math.random()*52).toFixed(2)+"px";
    const rot=(-260+Math.random()*520).toFixed(0)+"deg";

    rose.style.left = left+"vw";
    rose.style.width = size+"px";
    rose.style.height = size+"px";
    rose.style.animationDuration = dur+"s";
    rose.style.setProperty("--drift", drift);
    rose.style.setProperty("--rot", rot);

    fallingRoses.appendChild(rose);

    rose.addEventListener("animationend", ()=>{
      addToBed(size);
      rose.remove();
    });
  }

  function addToBed(size, xOverride=null){
    const bedRect = roseBed.getBoundingClientRect();
    const x = (xOverride!==null)
      ? Math.max(0, Math.min(bedRect.width - size, xOverride - bedRect.left))
      : Math.random()*(bedRect.width - size);

    const y = (bedRect.height*0.42) + Math.random()*(bedRect.height*0.58);

    const r=makeRoseEl("bed-rose");
    const rot=(-260+Math.random()*520).toFixed(0)+"deg";
    r.style.setProperty("--rot", rot);
    r.style.left = x+"px";
    r.style.top  = (y - size/2)+"px";
    r.style.width = size+"px";
    r.style.height= size+"px";

    roseBed.appendChild(r);

    const max=480;
    if(roseBed.children.length>max){
      for(let i=0;i<24;i++) roseBed.children[0]?.remove();
    }
  }

  function startRoseCurtain(){
    const start=performance.now();
    const duration=14000;

    const interval=setInterval(()=>{
      const now=performance.now();
      if(now-start>duration){ clearInterval(interval); return; }

      const count = 3 + Math.floor(Math.random()*3);
      for(let i=0;i<count;i++) spawnFallingRose();
    }, 210);
  }

  // ===== Spray roses on pointer move (scatter then drop to bed) =====
  let lastSpray = 0;
  function sprayAt(x,y){
    if(!document.body.classList.contains('roses-on')) return;
    const now = performance.now();
    if(now - lastSpray < 35) return; // throttle
    lastSpray = now;

    const n = 1 + (Math.random() < 0.35 ? 1 : 0); // 1-2 roses
    for(let i=0;i<n;i++){
      const r = makeRoseEl("spray-rose");
      const size = 14 + Math.random()*10;

      // scatter vector
      const sx = (-120 + Math.random()*240).toFixed(0) + "px";
      const sy = (-120 + Math.random()*-220).toFixed(0) + "px"; // up
      const srot = (-260 + Math.random()*520).toFixed(0) + "deg";

      r.style.width = size + "px";
      r.style.height= size + "px";
      r.style.left = (x - size/2) + "px";
      r.style.top  = (y - size/2) + "px";
      r.style.setProperty("--sx", sx);
      r.style.setProperty("--sy", sy);
      r.style.setProperty("--srot", srot);

      sprayRoses.appendChild(r);

      // after the "fallAfter" ends, add to bed and remove
      const totalMs = 3300; // ~spray + fallAfter
      setTimeout(()=>{
        addToBed(size, x);
        r.remove();
      }, totalMs);
    }
  }

  addEventListener('pointermove', (e)=> sprayAt(e.clientX, e.clientY), {passive:true});
  addEventListener('pointerdown', (e)=> {
    // stronger spray on tap/click
    for(let i=0;i<6;i++) sprayAt(e.clientX, e.clientY);
  }, {passive:true});

  // ===== Envelope open ONLY via seal/try =====
  function openEnvelope(){ document.body.classList.add('env-open'); }
  seal.addEventListener('click', openEnvelope);
  tryOpen.addEventListener('click', openEnvelope);

  // ===== Confetti =====
  function burstConfetti(x=innerWidth/2, y=160){
    for(let i=0;i<36;i++){
      const p=document.createElement('i');
      const dx = (-180 + Math.random()*360).toFixed(0)+"px";
      const dr = (-540 + Math.random()*1080).toFixed(0)+"deg";
      p.style.left = (x + (-40 + Math.random()*80))+"px";
      p.style.top  = (y + (-20 + Math.random()*20))+"px";
      p.style.setProperty("--dx", dx);
      p.style.setProperty("--dr", dr);
      const colors = ["#ffd1e8","#ffb6d9","#ffc6df","rgba(255,255,255,.85)"];
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.animationDuration = (900 + Math.random()*600).toFixed(0)+"ms";
      confetti.appendChild(p);
      p.addEventListener('animationend', ()=> p.remove());
    }
  }

  // ===== Messages (your text, مرتب وناعم) =====
  const halfText = `
    وصلنا عند أهم حاجة…<br><br>
    <strong>رنيمي</strong> أنا جدًا فخورة بِك وبكل إنجاز سويتيه من أول ماعرفتك إلى الآن،
    من أبسط إلى أقوى إنجازاتك…
  `;

  const fullText = `
    وصلنا عند أهم حاجة، <strong>رنيمي</strong>…<br><br>
    أنا جدًا فخورة بِك وبكل إنجاز سويتيه من أول ماعرفتك إلى الآن،
    من أبسط إلى أقوى إنجازاتك. أقدر جدًا الشخص الجميل والقوي اللي فيك.<br><br>
    إنسانة عشت معاها أجمل وأفضل أيامي… كنتِ حنونة علي جدًا
    مثل طيف شمس دافي بفصل الشتاء.<br><br>
    كنتِ ولا زلتِ أحبك من كل قلبي…
    وبضل أحمل لك مشاعر جميلة ونظيفة 💗
  `;

  halfMessage.innerHTML = halfText;
  fullMessage.innerHTML = fullText;

  // ===== Puzzle 1 =====
  function norm(s){
    return (s||"").toLowerCase().trim().replace(/\s+/g,'');
  }
  const ok1 = new Set(["الحب","حب","love","hob","hub","alhob","alhub"]);

  hintBtn1.addEventListener('click', ()=>{
    feedback1.innerHTML = `<div class="hintline">تلميح: شيء يكبر بالمشاركة 🌸</div>`;
  });

  check1.addEventListener('click', ()=>{
    const a=norm(answer1.value);
    if(!a){ feedback1.innerHTML=`<div class="no">اكتبي جواب أول 🌸</div>`; return; }
    if(ok1.has(a)){
      feedback1.innerHTML = `<div class="ok">صح ✅</div>`;
      reveal1.classList.add('show');
      choices1.classList.add('show');
      burstConfetti();
    } else {
      feedback1.innerHTML = `<div class="no">مو هذا… جربي مرة ثانية 🌸</div>`;
    }
  });
  answer1.addEventListener('keydown', (e)=>{ if(e.key==="Enter") check1.click(); });

  // ===== Puzzle 2 =====
  const ok2 = new Set(["النار","نار","fire","nar"]);

  hintBtn2.addEventListener('click', ()=>{
    feedback2.innerHTML = `<div class="hintline">تلميح: إذا شرب “مويه” يموت 🌸</div>`;
  });

  check2.addEventListener('click', ()=>{
    const a=norm(answer2.value);
    if(!a){ feedback2.innerHTML=`<div class="no">اكتبي جواب 🌸</div>`; return; }
    if(ok2.has(a)){
      feedback2.innerHTML = `<div class="ok">صح ✅ يلا نبدأ خلط الأظرف 🎭</div>`;
      burstConfetti();
      showMiniGame();
    } else {
      feedback2.innerHTML = `<div class="no">قريبة… بس مو هي 🌸</div>`;
    }
  });
  answer2.addEventListener('keydown', (e)=>{ if(e.key==="Enter") check2.click(); });

  // choices
  wantSecret.addEventListener('click', ()=>{
    fullLetter.classList.add('show');
    miniGame.classList.remove('show');
    puzzle2.style.display="none";
    burstConfetti();
  });

  wantPuzzle2.addEventListener('click', ()=>{
    puzzle2.style.display="grid";
    fullLetter.classList.remove('show');
    miniGame.classList.remove('show');
  });

  // ===== Mini Envelope Game (shuffle) =====
  const messages = {
    1: `💗 (مشاعري لك)
كنتِ ولا زلتِ أحبك من كل قلبي…
ومهما تغيّر الوقت، مشاعري لك تظل نظيفة وجميلة.
وجودك بالنسبة لي نعمة—وأنا ممتنة لك بكل التفاصيل.`,
    2: `🌸 (فخري بإنجازاتك)
رنيمي… أنا جدًا فخورة بك وبكل إنجاز سويتيه من أول ما عرفتك إلى الآن،
من أبسط إلى أقوى إنجازاتك.
وأشهد إنك أفضل ممرضة بالكون.`,
    3: `🕊️ (مفاجأة)
لو عندي “عدسة” تخلي الناس تشوف اللي أشوفه فيك:
قوة + رحمة + قلب دافي مثل طيف شمس دافي بفصل الشتاء.
أحبك… وأتمنى لك أيام تليق فيك.`
  };

  let canPick = false;

  function showMiniGame(){
    miniGame.classList.add('show');
    miniResult.classList.remove('show');
    miniResult.textContent = "";
    canPick = false;

    const envs = [...miniRow.querySelectorAll('.mini-env')];
    envs.forEach(e => e.classList.add('disabled'));

    shuffleMini(envs, 2200).then(()=>{
      canPick = true;
      envs.forEach(e => e.classList.remove('disabled'));
    });
  }

  function shuffleMini(envs, durationMs){
    const start = performance.now();
    return new Promise((resolve)=>{
      function tick(now){
        const elapsed = now - start;
        if(elapsed >= durationMs){ resolve(); return; }

        if(Math.random() < 0.22){
          const a = Math.floor(Math.random()*3);
          let b = Math.floor(Math.random()*3);
          if(b===a) b=(b+1)%3;

          const children=[...miniRow.children];
          const nodeA=children[a];
          const nodeB=children[b];

          const ph=document.createElement('div');
          miniRow.replaceChild(ph, nodeA);
          miniRow.replaceChild(nodeA, nodeB);
          miniRow.replaceChild(nodeB, ph);
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  miniRow.addEventListener('click', (e)=>{
    const env = e.target.closest('.mini-env');
    if(!env || !canPick) return;
    const id = env.dataset.env;
    miniResult.textContent = messages[id] || messages[3];
    miniResult.classList.add('show');
    burstConfetti();
  });

})();
