const restroomBg = document.getElementById("restroom-bg");
const overlay = document.getElementById("mirror-overlay");
const video = document.getElementById("mirror-video");
const text = document.getElementById("mirror-text");
const portal = document.getElementById("mirror-portal");

let cameraActivated = false;

// Portal hover overlay handled in CSS; click portal to activate
if (portal) {
  portal.addEventListener('click', () => {
    if (!cameraActivated) {
      cameraActivated = true;
      activateMirror();
    }
  });
}

function activateMirror() {
  restroomBg.style.filter = "brightness(0.3)";
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = 'auto';

  // hide the portal visually to let the overlay cover the screen
  const portalEl = document.getElementById('mirror-portal');
  if (portalEl) portalEl.classList.add('portal-hidden');
  // set up webcam -> draw to canvas with filters and controls
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      // once video plays, start drawing to canvas
      video.addEventListener('playing', () => {
        startCanvasProcessing(video);
        text.style.opacity = '1';
        runConfetti();
        playTone();
        // show controls and continue button
        const ctrls = document.getElementById('controls');
        if (ctrls) ctrls.setAttribute('aria-hidden','false');
        const btn = document.getElementById('continue-btn');
        if (btn) {
          btn.classList.add('show');
          btn.setAttribute('aria-hidden','false');
        }
      }, { once: true });
      // ensure video plays
      video.play().catch(()=>{});
    })
    .catch((err) => {
      console.warn('Camera permission denied:', err);
      text.textContent = 'Camera unavailable — click to continue';
      text.style.opacity = '1';
      runConfetti();
      playTone();
      const btn = document.getElementById('continue-btn');
      if (btn) {
        btn.classList.add('show');
        btn.setAttribute('aria-hidden','false');
      }
    });
}

// require explicit user click on canvas or continue button to proceed
document.addEventListener('click', (e) => {
  const canvas = document.getElementById('mirror-canvas');
  const btn = document.getElementById('continue-btn');
  if (!cameraActivated) return;
  if (e.target === canvas || e.target === btn) {
    window.location.href = 'lgbtq.html';
  }
});

/* Canvas processing: draw webcam frames and apply filters */
function startCanvasProcessing(videoEl) {
  const canvas = document.getElementById('mirror-canvas');
  const ctx = canvas.getContext('2d');
  function resize() {
    const w = Math.min(window.innerWidth*0.8, 900);
    const h = w * (videoEl.videoHeight / videoEl.videoWidth || 0.75);
    canvas.width = Math.max(1920, Math.floor(w));
    canvas.height = Math.max(1080, Math.floor(h));
  }
  resize();
  window.addEventListener('resize', resize);

  const sat = document.getElementById('saturation');
  const contrast = document.getElementById('contrast');
  const bright = document.getElementById('brightness');
  const blur = document.getElementById('blur');
  const grain = document.getElementById('grain');
  const sharpen = document.getElementById('sharpen');

  function draw() {
    ctx.save();
    // apply CSS-like filters via canvas by drawing to an offscreen then applying
    ctx.filter = `saturate(${sat.value}) contrast(${contrast.value}) brightness(${bright.value}) blur(${blur.value}px)`;
    // mirror horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1,1);
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // add grain
    if (parseFloat(grain.value) > 0.001) {
      const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      const data = imageData.data;
      const amount = parseFloat(grain.value);
      for (let i=0;i<data.length;i+=4) {
        const g = (Math.random()*2-1)*255*amount;
        data[i] = Math.max(0, Math.min(255, data[i]+g));
        data[i+1] = Math.max(0, Math.min(255, data[i+1]+g));
        data[i+2] = Math.max(0, Math.min(255, data[i+2]+g));
      }
      ctx.putImageData(imageData,0,0);
    }

    // simple sharpen using convolution if enabled
    if (sharpen.checked) {
      // lightweight 3x3 sharpen kernel
      const img = ctx.getImageData(0,0,canvas.width,canvas.height);
      const w = img.width, h = img.height;
      const src = img.data;
      const out = new Uint8ClampedArray(src.length);
      const kernel = [0,-1,0,-1,5,-1,0,-1,0];
      const k = 1;
      for (let y=1;y<h-1;y++){
        for (let x=1;x<w-1;x++){
          let r=0,g=0,b=0,a=0;
          let idx = (y*w + x)*4;
          let ki=0;
          for (let ky=-1;ky<=1;ky++){
            for (let kx=-1;kx<=1;kx++){
              const ii = ((y+ky)*w + (x+kx))*4;
              const kval = kernel[ki++];
              r += src[ii]*kval;
              g += src[ii+1]*kval;
              b += src[ii+2]*kval;
            }
          }
          out[idx]=Math.min(255,Math.max(0,r));
          out[idx+1]=Math.min(255,Math.max(0,g));
          out[idx+2]=Math.min(255,Math.max(0,b));
          out[idx+3]=src[idx+3];
        }
      }
      // copy back
      img.data.set(out);
      ctx.putImageData(img,0,0);
    }

    requestAnimationFrame(draw);
  }
  draw();
}

/* --- playful helpers: confetti and tone --- */
function runConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.opacity = '1';

  const pieces = [];
  const colors = ['#ffd166','#89f7fe','#66a6ff','#7bd389','#ffadad'];
  for (let i=0;i<80;i++) {
    pieces.push({
      x: Math.random()*canvas.width,
      y: -Math.random()*canvas.height,
      w: 6+Math.random()*10,
      h: 6+Math.random()*10,
      vx: -2+Math.random()*4,
      vy: 2+Math.random()*6,
      r: Math.random()*360,
      color: colors[Math.floor(Math.random()*colors.length)]
    });
  }

  let frame = 0;
  const raf = () => {
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.r += 6;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.r*Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    }
    if (frame < 180) { // ~3 seconds at 60fps
      requestAnimationFrame(raf);
    } else {
      // fade out canvas
      canvas.style.opacity = '0';
      setTimeout(()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); }, 400);
    }
  };
  raf();
}

function playTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 440;
    g.gain.value = 0.001; // very quiet by default
    o.connect(g); g.connect(ctx.destination);
    o.start();
    // gentle ramp
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.25);
    setTimeout(()=>{
      g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.stop(ctx.currentTime + 0.25);
    }, 400);
  } catch(e) {
    // ignore if audio not allowed
  }
}

// Left arrow (#arrow1) navigation to Hong Kong page
const leftArrow = document.getElementById('arrow1');
if (leftArrow) {
  leftArrow.style.cursor = 'pointer';
  leftArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = 'hongkong.html';
  });
}
