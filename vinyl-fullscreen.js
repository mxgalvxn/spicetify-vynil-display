
// vinyl-fullscreen.js
// Spicetify extension: fullscreen vinyl record player.
(function VinylFullscreen() {
  if (!(window.Spicetify && Spicetify.Player && Spicetify.Playbar && Spicetify.Playbar.Button)) {
    setTimeout(VinylFullscreen, 300);
    return;
  }

  // ---------- Easy-to-customize settings ----------
  const RPM = 25;                         // Vinyl rotation speed
  const DEG_PER_SEC = RPM * 6;            // 33 RPM = 198 degrees/second
  const EASE = 2.7;                       // Higher values = faster acceleration/deceleration
  const ARM_REST = 11.5;                  // Raised tonearm angle (degrees)
  const ARM_PLAY_START = -10.5;           // Tonearm angle at the beginning of the song (outer grooves)
  const ARM_PLAY_END = -25;               // Tonearm angle at the end of the song (inner grooves)
  const ARM_EASE = 2.2;                   // Tonearm movement speed
  const LABEL_RATIO = 0.35;               // Album artwork = 15% of the record size

  // ---------- Styles ----------
  const css = `
  #vf-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;
    font-family:"Inter","Roboto",system-ui,sans-serif;color:#fff;overflow:hidden;background:#111}
  #vf-overlay.open{display:flex}
  #vf-bg{position:absolute;inset:-60px;background-size:cover;background-position:center;
    filter:blur(20px) saturate(1.2);transform:scale(1.1);transition:background-image .4s}
  #vf-shade{position:absolute;inset:0;background:rgba(0,0,0,.55)}
  #vf-card{position:relative;display:flex;flex-direction:column;align-items:center;
    width:min(560px,90vw);gap:clamp(12px,2.4vh,24px)}
  #vf-close{position:absolute;top:-8px;right:-48px;background:none;border:0;color:#fff;opacity:.6;
    cursor:pointer;font-size:26px;line-height:1}
  #vf-close:hover{opacity:1}

  /* Vinyl record */
  #vf-disc{--size:min(50vh,80vw);position:relative;width:var(--size);height:var(--size);border-radius:50%;
    background:
      repeating-radial-gradient(circle at center,
        rgba(255,255,255,0) 0, rgba(255,255,255,0) 2px,
        rgba(255,255,255,.045) 3px, rgba(255,255,255,0) 4px),
      radial-gradient(circle at center,#2b2b2e 0%,#1b1b1d 45%,#0d0d0e 100%);
    box-shadow:inset 0 0 0 3px #060607, inset 0 0 30px rgba(0,0,0,.8);
    will-change:transform}
  /* Smooth rings between grooves */
  #vf-disc::before{content:"";position:absolute;inset:7%;border-radius:50%;
    box-shadow:0 0 0 1px rgba(255,255,255,.05), inset 0 0 0 1px rgba(255,255,255,.04);}
  #vf-disc::after{content:"";position:absolute;inset:16%;border-radius:50%;
    box-shadow:0 0 0 1px rgba(255,255,255,.05);}
  /* Fixed highlight (does not rotate): placed in a sibling element */
  #vf-disc-wrap{position:relative;width:var(--size,min(50vh,80vw));height:min(50vh,80vw)}
  #vf-disc-wrap::before{content:"";position:absolute;inset:0;border-radius:50%;
    box-shadow:0 20px 60px rgba(0,0,0,.6)}
  #vf-shine{position:absolute;inset:0;border-radius:50%;pointer-events:none;
    background:conic-gradient(from 20deg,
      rgba(255,255,255,0) 0deg, rgba(255,255,255,.18) 25deg, rgba(255,255,255,0) 60deg,
      rgba(255,255,255,0) 180deg, rgba(255,255,255,.14) 205deg, rgba(255,255,255,0) 240deg,
      rgba(255,255,255,0) 360deg);
    mix-blend-mode:screen}
  #vf-label{position:absolute;top:50%;left:50%;width:${LABEL_RATIO * 100}%;height:${LABEL_RATIO * 100}%;
    transform:translate(-50%,-50%);border-radius:50%;background-size:cover;background-position:center;
    box-shadow:0 0 0 2px rgba(0,0,0,.5)}
  #vf-label::after{content:"";position:absolute;top:50%;left:50%;width:14%;height:14%;
    transform:translate(-50%,-50%);border-radius:50%;background:#0d0d0e;box-shadow:inset 0 0 3px #000}

  /* Turntable tonearm
     Pivot: 108% to the right and 12% below the disc's top-left edge.
     The tonearm is drawn pointing left and rotates around the pivot. */
  #vf-base{position:absolute;left:101%;top:9%;width:20%;height:15%;background:#0e0e0f;border-radius:4px 4px 6px 6px}
  #vf-base::before{content:"";position:absolute;left:0;right:0;top:-24%;height:32%;background:#1a1a1c;
    clip-path:polygon(0 100%,22% 0,100% 0,100% 100%)}
  #vf-base::after{content:"";position:absolute;right:8%;top:26%;bottom:14%;width:30%;
    background:repeating-linear-gradient(90deg,rgba(255,255,255,.22) 0 1.5px,transparent 1.5px 5px)}
  #vf-arm{position:absolute;left:108%;top:12%;width:0;height:0;transform-origin:0 0;will-change:transform}
  #vf-shaft{position:absolute;right:0;top:calc(var(--size)*-0.011);width:calc(var(--size)*0.79);
    height:calc(var(--size)*0.022);border-radius:3px;
    background:linear-gradient(180deg,#4a4c52 0%,#8a8d93 28%,#b4b7bd 45%,#767980 70%,#3f4146 100%)}
  #vf-head{position:absolute;right:calc(var(--size)*0.78);top:calc(var(--size)*-0.025);
    width:calc(var(--size)*0.10);height:calc(var(--size)*0.05);background:#151516;
    clip-path:polygon(0 18%,100% 0,100% 100%,0 82%)}
  #vf-head::after{content:"";position:absolute;left:0;top:18%;bottom:18%;width:30%;background:#e5192b;
    clip-path:polygon(0 50%,100% 0,100% 100%)}
  #vf-pivot{position:absolute;left:calc(var(--size)*-0.027);top:calc(var(--size)*-0.027);
    width:calc(var(--size)*0.054);height:calc(var(--size)*0.054);border-radius:50%;
    background:radial-gradient(circle at 35% 35%,#f7f8fa,#8b8e94)}

  /* Track information */
  #vf-info{width:100%;text-align:center}
  #vf-title{font-size:clamp(20px,3.2vh,28px);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #vf-artist{margin-top:4px;font-size:clamp(13px,2vh,16px);color:rgba(255,255,255,.65);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* Playback progress */
  #vf-progress{display:flex;align-items:center;gap:12px;width:100%}
  #vf-bar{position:relative;flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.25);cursor:pointer}
  #vf-bar::before{content:"";position:absolute;left:0;right:0;top:-8px;bottom:-8px} /* Larger clickable area */
  #vf-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;background:#fff}
  #vf-thumb{position:absolute;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;
    background:#fff;left:0}
  #vf-time{min-width:36px;text-align:right;font-size:12px;font-variant-numeric:tabular-nums}

  /* Playback controls */
  #vf-controls{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:360px}
  #vf-controls button{background:none;border:0;padding:6px;cursor:pointer;color:#fff;display:flex;
    align-items:center;justify-content:center;opacity:.85;transition:opacity .15s, transform .15s}
  #vf-controls button:hover{opacity:1;transform:scale(1.08)}
  #vf-controls svg{width:24px;height:24px;fill:currentColor}
  #vf-controls button.active{color:#1ed760;opacity:1}
  #vf-play{width:64px;height:64px;border-radius:50%;background:#fff!important;color:#000!important;opacity:1!important}
  #vf-play svg{width:28px;height:28px}
  @media (prefers-reduced-motion:reduce){#vf-bg{transition:none}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- HTML ----------
  const ICONS = {
    shuffle: '<svg viewBox="0 0 24 24"><path d="M17 3h4v4l-1.5-1.5-4.6 4.6-1.4-1.4 4.6-4.6L17 3zM3 7h3.5c1.3 0 2.5.6 3.3 1.6L16 16.5c.4.6 1 .9 1.7.9H18l-1.5-1.5 1.4-1.4L22 18l-4.1 4.1-1.4-1.4L18 19.2h-.3c-1.3 0-2.5-.6-3.3-1.6L8.2 9.5C7.8 8.9 7.2 8.6 6.5 8.6H3V7zm0 10h3.5c.7 0 1.3-.3 1.7-.9l.7-.9 1.3 1.3-.4.5c-.8 1-2 1.6-3.3 1.6H3v-1.6z" transform="scale(.95) translate(.6 .6)"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6V5zm3.5 7L19 5v14l-9.5-7z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2V5zM5 19V5l9.5 7L5 19z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z"/></svg>',
    repeat: '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
    repeatOne: '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>',
  };

  const overlay = document.createElement("div");
  overlay.id = "vf-overlay";
  overlay.innerHTML = `
    <div id="vf-bg"></div><div id="vf-shade"></div>
    <div id="vf-card">
      <button id="vf-close" title="Close">&times;</button>
      <div id="vf-disc-wrap">
        <div id="vf-disc"><div id="vf-label"></div></div>
        <div id="vf-shine"></div>
        <div id="vf-base"></div>
        <div id="vf-arm"><div id="vf-shaft"></div><div id="vf-head"></div><div id="vf-pivot"></div></div>
      </div>
      <div id="vf-info"><div id="vf-title"></div><div id="vf-artist"></div></div>
      <div id="vf-progress">
        <div id="vf-bar"><div id="vf-fill"></div><div id="vf-thumb"></div></div>
        <div id="vf-time">0:00</div>
      </div>
      <div id="vf-controls">
        <button id="vf-shuffle" title="Shuffle">${ICONS.shuffle}</button>
        <button id="vf-prev" title="Previous">${ICONS.prev}</button>
        <button id="vf-play" title="Play/Pause"></button>
        <button id="vf-next" title="Next">${ICONS.next}</button>
        <button id="vf-repeat" title="Repeat">${ICONS.repeat}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const $ = (id) => overlay.querySelector("#" + id);
  const el = {
    arm: $("vf-arm"), bg: $("vf-bg"), disc: $("vf-disc"), label: $("vf-label"), title: $("vf-title"), artist: $("vf-artist"),
    bar: $("vf-bar"), fill: $("vf-fill"), thumb: $("vf-thumb"), time: $("vf-time"),
    shuffle: $("vf-shuffle"), prev: $("vf-prev"), play: $("vf-play"), next: $("vf-next"), repeat: $("vf-repeat"),
  };
  // The rotating record and its wrapper share the same dimensions
  overlay.querySelector("#vf-disc-wrap").style.setProperty("--size", "min(50vh,80vw)");

  // ---------- Track information ----------
  function getCover(item) {
    const m = (item && item.metadata) || {};
    let u = m.image_xlarge_url || m.image_large_url || m.image_url;
    if (u && u.startsWith("spotify:image:")) return "https://i.scdn.co/image/" + u.split(":")[2];
    return u || (item && item.album && item.album.images && item.album.images[0] && item.album.images[0].url) || "";
  }
  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  function updateTrack() {
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!item) return;
    const m = item.metadata || {};
    const cover = getCover(item);
    el.title.textContent = item.name || m.title || "";
    el.artist.textContent =
      (item.artists && item.artists.map((a) => a.name).join(", ")) || m.artist_name || "";
    if (cover) {
      el.label.style.backgroundImage = `url("${cover}")`;
      el.bg.style.backgroundImage = `url("${cover}")`;
    }
  }
  function updateButtons() {
    el.play.innerHTML = Spicetify.Player.isPlaying() ? ICONS.pause : ICONS.play;
    el.shuffle.classList.toggle("active", !!Spicetify.Player.getShuffle());
    const r = Spicetify.Player.getRepeat(); // 0 = off, 1 = all, 2 = one
    el.repeat.classList.toggle("active", r > 0);
    el.repeat.innerHTML = r === 2 ? ICONS.repeatOne : ICONS.repeat;
  }

  // ---------- Animation: inertia-based rotation + playback progress ----------
  let angle = 0, speed = 0, last = performance.now(), raf = null;
  let armAngle = ARM_REST;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const target = Spicetify.Player.isPlaying() ? DEG_PER_SEC : 0;
    speed += (target - speed) * Math.min(1, EASE * dt); // Smooth acceleration/deceleration
    if (Math.abs(speed) < 0.05 && target === 0) speed = 0;
    angle = (angle + speed * dt) % 360;
    el.disc.style.transform = `rotate(${angle}deg)`;

    const dur = Spicetify.Player.getDuration() || 1;
    const pos = Spicetify.Player.getProgress();
    const pct = Math.min(100, (pos / dur) * 100);
    el.fill.style.width = pct + "%";
    el.thumb.style.left = pct + "%";
    el.time.textContent = fmt(pos);

    // Tonearm: lowers during playback, moves toward the center as the song progresses, and lifts when paused
    const armTarget = Spicetify.Player.isPlaying()
      ? ARM_PLAY_START + (ARM_PLAY_END - ARM_PLAY_START) * (pct / 100)
      : ARM_REST;
    armAngle += (armTarget - armAngle) * Math.min(1, ARM_EASE * dt);
    el.arm.style.transform = `rotate(${armAngle}deg)`;

    raf = requestAnimationFrame(frame);
  }

  // ---------- Open / close ----------
  function open() {
    updateTrack(); updateButtons();
    overlay.classList.add("open");
    armAngle = ARM_REST;
    el.arm.style.transform = `rotate(${armAngle}deg)`;
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
    if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
  }
  function close() {
    overlay.classList.remove("open");
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && overlay.classList.contains("open")) close(); // Esc key
  });

  // ---------- Event handlers ----------
  $("vf-close").onclick = close;
  el.play.onclick = () => Spicetify.Player.togglePlay();
  el.prev.onclick = () => Spicetify.Player.back();
  el.next.onclick = () => Spicetify.Player.next();
  el.shuffle.onclick = () => { Spicetify.Player.toggleShuffle(); setTimeout(updateButtons, 150); };
  el.repeat.onclick = () => { Spicetify.Player.toggleRepeat(); setTimeout(updateButtons, 150); };
  el.bar.onclick = (e) => {
    const r = el.bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    Spicetify.Player.seek(Math.round(ratio * Spicetify.Player.getDuration()));
  };
  Spicetify.Player.addEventListener("songchange", updateTrack);
  Spicetify.Player.addEventListener("onplaypause", updateButtons);

  // ---------- Player bar button ----------
  // Disc icon (inserted inside an <svg viewBox="0 0 16 16">)
  // ---------- Activation buttons ----------

  // Native Spicetify icon (always renders correctly)
  const iconName = (Spicetify.SVGIcons && Spicetify.SVGIcons.album) ? "album" : "play";

  // Player bar
  try { new Spicetify.Playbar.Button("Vinyl Mode", iconName, open, false, false); }
  catch (e) { console.warn("[vinyl] Playbar.Button failed:", e); }

  // Top bar (fallback)
  try { new Spicetify.Topbar.Button("Vinyl Mode", iconName, open, false); }
  catch (e) { console.warn("[vinyl] Topbar.Button failed:", e); }

  // Keyboard shortcut: Ctrl+Shift+V
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") open();
  });

  console.log("[vinyl] extension loaded");
})();
