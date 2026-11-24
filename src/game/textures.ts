import * as THREE from 'three';

export interface ProceduralTextureSet {
  cobbleMap: THREE.CanvasTexture;
  cobbleBump: THREE.CanvasTexture;
  snowBump: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickBump: THREE.CanvasTexture;
  plasterTimberMap: THREE.CanvasTexture;
  woodPlankMap: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  awningStripeMap: THREE.CanvasTexture;
  warmWindowMap: THREE.CanvasTexture;
  snowflakeSprite: THREE.CanvasTexture;
  glowHaloSprite: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  speechBubbleSprite: THREE.CanvasTexture;
  startBannerMap: THREE.CanvasTexture;
  finishBannerMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = Math.min(8, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. European Fan Cobblestone Albedo + Bump
  const [cobbleC, cCtx] = makeCanvas(256, 256);
  const [cobbleBC, cbCtx] = makeCanvas(256, 256);
  cCtx.fillStyle = '#5f5b58';
  cCtx.fillRect(0, 0, 256, 256);
  cbCtx.fillStyle = '#252525';
  cbCtx.fillRect(0, 0, 256, 256);

  const stonePalette = ['#8c827b', '#7b736f', '#9a8f85', '#736d6a', '#a1968d'];
  for (let row = 0; row < 12; row++) {
    const y = row * 22;
    const offset = (row % 2) * 16;
    for (let col = -1; col < 10; col++) {
      const x = col * 30 + offset;
      const w = 25 + ((row * 7 + col * 13) % 5);
      const h = 17 + ((row * 11 + col * 5) % 4);
      const color = stonePalette[(row * 5 + col * 3 + 100) % stonePalette.length];

      cCtx.fillStyle = color;
      cCtx.beginPath();
      cCtx.roundRect(x, y, w, h, 4);
      cCtx.fill();

      // Subtle warm highlight + frost speck
      cCtx.fillStyle = 'rgba(235, 242, 255, 0.12)';
      cCtx.fillRect(x + 2, y + 2, w - 4, 4);

      cbCtx.fillStyle = '#d4d4d4';
      cbCtx.beginPath();
      cbCtx.roundRect(x + 1, y + 1, w - 2, h - 2, 4);
      cbCtx.fill();
    }
  }
  // Light snow dusting in crevices
  cCtx.fillStyle = 'rgba(230, 240, 255, 0.22)';
  for (let i = 0; i < 65; i++) {
    const px = (i * 73) % 256;
    const py = (i * 139) % 256;
    cCtx.fillRect(px, py, 6, 3);
  }

  // 2. Snow sparkle micro-relief bump map
  const [snowBC, sbCtx] = makeCanvas(256, 256);
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const x = (i * 53 + (i % 17) * 19) % 256;
    const y = (i * 97 + (i % 23) * 11) % 256;
    const v = 100 + ((i * 29) % 90);
    sbCtx.fillStyle = `rgb(${v},${v},${v})`;
    sbCtx.fillRect(x, y, 3, 3);
  }

  // 3. Red-Brick Masonry Albedo + Bump (Grand Town Hall)
  const [brickC, brCtx] = makeCanvas(256, 256);
  const [brickBC, brbCtx] = makeCanvas(256, 256);
  brCtx.fillStyle = '#c8bfb4'; // Mortar
  brCtx.fillRect(0, 0, 256, 256);
  brbCtx.fillStyle = '#333333';
  brbCtx.fillRect(0, 0, 256, 256);

  const bricks = ['#9c3c35', '#8a322c', '#a8453b', '#7f2f2a', '#953931'];
  for (let r = 0; r < 16; r++) {
    const y = r * 16;
    const off = (r % 2) * 20;
    for (let c = -1; c < 8; c++) {
      const x = c * 40 + off;
      brCtx.fillStyle = bricks[(r * 7 + c * 3 + 50) % bricks.length];
      brCtx.fillRect(x + 2, y + 2, 36, 12);
      brbCtx.fillStyle = '#d8d8d8';
      brbCtx.fillRect(x + 2, y + 2, 36, 12);
    }
  }

  // 4. Half-Timbered European Cream Plaster & Timber Texture
  const [plasterC, plCtx] = makeCanvas(256, 256);
  plCtx.fillStyle = '#e7dac2';
  plCtx.fillRect(0, 0, 256, 256);
  // Subtle stucco grain
  for (let i = 0; i < 500; i++) {
    const x = (i * 41) % 256;
    const y = (i * 89) % 256;
    plCtx.fillStyle = i % 2 === 0 ? 'rgba(180,160,130,0.16)' : 'rgba(255,250,240,0.14)';
    plCtx.fillRect(x, y, 4, 4);
  }
  // Dark timber beams
  plCtx.fillStyle = '#472d1c';
  plCtx.fillRect(0, 0, 256, 18);
  plCtx.fillRect(0, 120, 256, 16);
  plCtx.fillRect(0, 238, 256, 18);
  plCtx.fillRect(0, 0, 18, 256);
  plCtx.fillRect(118, 0, 18, 256);
  plCtx.fillRect(238, 0, 18, 256);
  // Diagonal braces
  plCtx.strokeStyle = '#472d1c';
  plCtx.lineWidth = 12;
  plCtx.beginPath();
  plCtx.moveTo(14, 124);
  plCtx.lineTo(122, 16);
  plCtx.moveTo(242, 124);
  plCtx.lineTo(132, 16);
  plCtx.stroke();

  // 5. Warm Wood Planks + Bump (Bridges, Cottages, Fences, Chairlift benches)
  const [woodC, wCtx] = makeCanvas(256, 256);
  const [woodBC, wbCtx] = makeCanvas(256, 256);
  wCtx.fillStyle = '#754c2e';
  wCtx.fillRect(0, 0, 256, 256);
  wbCtx.fillStyle = '#707070';
  wbCtx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 8; p++) {
    const y = p * 32;
    wCtx.fillStyle = p % 2 === 0 ? '#855734' : '#734a2b';
    wCtx.fillRect(0, y + 2, 256, 28);
    wCtx.fillStyle = '#4a2e1a';
    wCtx.fillRect(0, y, 256, 2);

    wbCtx.fillStyle = '#c8c8c8';
    wbCtx.fillRect(0, y + 2, 256, 28);
    wbCtx.fillStyle = '#222222';
    wbCtx.fillRect(0, y, 256, 2);

    // Grain streaks
    for (let g = 0; g < 16; g++) {
      wCtx.fillStyle = 'rgba(55, 30, 14, 0.22)';
      wCtx.fillRect(0, y + 4 + ((g * 7) % 24), 256, 1.5);
    }
  }

  // 6. Red & White Striped Awning
  const [awningC, awCtx] = makeCanvas(256, 128);
  for (let i = 0; i < 8; i++) {
    awCtx.fillStyle = i % 2 === 0 ? '#c42b2b' : '#f4eee2';
    awCtx.fillRect(i * 32, 0, 32, 128);
  }
  // Scallop shadow along bottom
  awCtx.fillStyle = 'rgba(50, 12, 12, 0.22)';
  awCtx.fillRect(0, 114, 256, 14);

  // 7. Warm Glowing Multi-Pane Christmas Window Texture
  const [winC, wiCtx] = makeCanvas(128, 128);
  const grad = wiCtx.createRadialGradient(64, 70, 8, 64, 64, 82);
  grad.addColorStop(0, '#fff7cf');
  grad.addColorStop(0.5, '#ffcb57');
  grad.addColorStop(1, '#e68c22');
  wiCtx.fillStyle = grad;
  wiCtx.fillRect(0, 0, 128, 128);
  // Subtle warm interior silhouette
  wiCtx.fillStyle = 'rgba(130, 58, 16, 0.18)';
  wiCtx.fillRect(14, 88, 100, 34);
  // Dark wood mullions
  wiCtx.fillStyle = '#3b2416';
  wiCtx.fillRect(0, 0, 128, 10);
  wiCtx.fillRect(0, 118, 128, 10);
  wiCtx.fillRect(0, 0, 10, 128);
  wiCtx.fillRect(118, 0, 10, 128);
  wiCtx.fillRect(60, 0, 8, 128);
  wiCtx.fillRect(0, 60, 128, 8);

  // 8. Soft Snowflake Particle Sprite
  const [snowC, sfCtx] = makeCanvas(64, 64);
  const sfGrad = sfCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  sfGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  sfGrad.addColorStop(0.45, 'rgba(235, 246, 255, 0.85)');
  sfGrad.addColorStop(1, 'rgba(220, 238, 255, 0)');
  sfCtx.fillStyle = sfGrad;
  sfCtx.fillRect(0, 0, 64, 64);

  // 9. Warm Lantern Glow Halo Sprite
  const [haloC, hCtx] = makeCanvas(128, 128);
  const hGrad = hCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
  hGrad.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  hGrad.addColorStop(0.32, 'rgba(255, 194, 84, 0.45)');
  hGrad.addColorStop(0.7, 'rgba(255, 150, 48, 0.12)');
  hGrad.addColorStop(1, 'rgba(255, 140, 30, 0)');
  hCtx.fillStyle = hGrad;
  hCtx.fillRect(0, 0, 128, 128);

  // 10. Soft Radial Contact Shadow Disc
  const [shadC, shCtx] = makeCanvas(128, 128);
  const shGrad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  shGrad.addColorStop(0, 'rgba(7, 14, 28, 0.58)');
  shGrad.addColorStop(0.55, 'rgba(7, 14, 28, 0.25)');
  shGrad.addColorStop(1, 'rgba(7, 14, 28, 0)');
  shCtx.fillStyle = shGrad;
  shCtx.fillRect(0, 0, 128, 128);

  // 11. Floating Storybook Speech Bubble Sprite (Red Postbox & Toy Shop Door!)
  const [bubC, bCtx] = makeCanvas(256, 160);
  bCtx.clearRect(0, 0, 256, 160);
  // Soft drop shadow
  bCtx.fillStyle = 'rgba(10, 18, 34, 0.42)';
  bCtx.beginPath();
  bCtx.roundRect(18, 16, 224, 102, 28);
  bCtx.fill();
  // Warm cream parchment bubble
  bCtx.fillStyle = '#fff9ec';
  bCtx.strokeStyle = '#d49a38';
  bCtx.lineWidth = 6;
  bCtx.beginPath();
  bCtx.roundRect(14, 10, 224, 102, 28);
  bCtx.fill();
  bCtx.stroke();
  // Speech pointer tail
  bCtx.beginPath();
  bCtx.moveTo(106, 110);
  bCtx.lineTo(128, 146);
  bCtx.lineTo(148, 110);
  bCtx.closePath();
  bCtx.fillStyle = '#fff9ec';
  bCtx.fill();
  bCtx.stroke();
  // Cover inner tail seam
  bCtx.fillStyle = '#fff9ec';
  bCtx.fillRect(104, 100, 48, 14);
  // Crisp red-gold E badge + festive star dots
  bCtx.fillStyle = '#b9262d';
  bCtx.beginPath();
  bCtx.roundRect(36, 36, 52, 52, 14);
  bCtx.fill();
  bCtx.fillStyle = '#fff8eb';
  bCtx.font = 'bold 32px sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('E', 62, 63);
  bCtx.fillStyle = '#2d1c10';
  bCtx.font = 'bold 28px sans-serif';
  bCtx.fillText('대화하기', 158, 63);

  // 12. Start Line ("출발선") & Finish Line ("도착선") Ski Track Arch Banners
  const makeGateBanner = (label: string, bg: string, accent: string): HTMLCanvasElement => {
    const [gc, gCtx] = makeCanvas(512, 128);
    gCtx.fillStyle = bg;
    gCtx.fillRect(0, 0, 512, 128);
    gCtx.strokeStyle = accent;
    gCtx.lineWidth = 10;
    gCtx.strokeRect(8, 8, 496, 112);
    // Festive corner checkers
    gCtx.fillStyle = '#fff8eb';
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        if ((r + c) % 2 === 0) {
          gCtx.fillRect(20 + c * 22, 24 + r * 40, 22, 40);
          gCtx.fillRect(426 + c * 22, 24 + r * 40, 22, 40);
        }
      }
    }
    gCtx.fillStyle = '#fff8eb';
    gCtx.font = 'bold 54px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillText(label, 256, 66);
    return gc;
  };
  const startBannerC = makeGateBanner('★ 출발선 ★', '#1c5938', '#f2c86b');
  const finishBannerC = makeGateBanner('★ 도착선 · 리프트 ★', '#b9262d', '#f2c86b');

  const cobbleMap = finalizeTexture(cobbleC, true, maxAnisotropy, 16, 16);
  const cobbleBump = finalizeTexture(cobbleBC, false, maxAnisotropy, 16, 16);
  const snowBump = finalizeTexture(snowBC, false, maxAnisotropy, 24, 24);
  const brickMap = finalizeTexture(brickC, true, maxAnisotropy, 3, 2);
  const brickBump = finalizeTexture(brickBC, false, maxAnisotropy, 3, 2);
  const plasterTimberMap = finalizeTexture(plasterC, true, maxAnisotropy, 2, 2);
  const woodPlankMap = finalizeTexture(woodC, true, maxAnisotropy, 2, 2);
  const woodBump = finalizeTexture(woodBC, false, maxAnisotropy, 2, 2);
  const awningStripeMap = finalizeTexture(awningC, true, maxAnisotropy, 1, 1);
  const warmWindowMap = finalizeTexture(winC, true, maxAnisotropy, 1, 1);
  const snowflakeSprite = finalizeTexture(snowC, true, 1, 1, 1);
  const glowHaloSprite = finalizeTexture(haloC, true, 1, 1, 1);
  const contactShadowMap = finalizeTexture(shadC, false, 1, 1, 1);
  const speechBubbleSprite = finalizeTexture(bubC, true, 1, 1, 1);
  const startBannerMap = finalizeTexture(startBannerC, true, maxAnisotropy, 1, 1);
  const finishBannerMap = finalizeTexture(finishBannerC, true, maxAnisotropy, 1, 1);

  const all = [
    cobbleMap,
    cobbleBump,
    snowBump,
    brickMap,
    brickBump,
    plasterTimberMap,
    woodPlankMap,
    woodBump,
    awningStripeMap,
    warmWindowMap,
    snowflakeSprite,
    glowHaloSprite,
    contactShadowMap,
    speechBubbleSprite,
    startBannerMap,
    finishBannerMap,
  ];

  return {
    cobbleMap,
    cobbleBump,
    snowBump,
    brickMap,
    brickBump,
    plasterTimberMap,
    woodPlankMap,
    woodBump,
    awningStripeMap,
    warmWindowMap,
    snowflakeSprite,
    glowHaloSprite,
    contactShadowMap,
    speechBubbleSprite,
    startBannerMap,
    finishBannerMap,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
