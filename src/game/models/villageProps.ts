import * as THREE from 'three';
import {
  BENCH_SPECS,
  BRIDGES,
  COLLECTIBLES,
  FENCE_RUNS,
  INTERACTABLES,
  JUMP_RAMPS,
  LAMP_POSITIONS,
  PINE_TREES,
  SKI_TRACK_GATES,
  SNOWMAN_POS,
  TREE_CENTER,
  getBaseTerrainHeight,
  getSledTrackCenterX,
  getSledTrackHalfWidth,
  getStreamCenterX,
  getStreamHalfWidth,
  getTerrainHeight,
} from '../worldLayout';
import type { ProceduralTextureSet } from '../textures';

export interface AnimatedPropsHandle {
  group: THREE.Group;
  starMeshes: Map<string, THREE.Group>;
  twinkleBulbs: THREE.Mesh[];
  topStar: THREE.Mesh;
  flags: THREE.Mesh[];
  update: (elapsed: number, activeNpcId: string | null) => void;
  setNightFactor: (nightFactor: number) => void;
}

export function buildVillagePropsAndNature(textures: ProceduralTextureSet): AnimatedPropsHandle {
  const group = new THREE.Group();
  group.name = 'VillagePropsAndNature';

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xeef5ff,
    bumpMap: textures.snowBump,
    bumpScale: 0.025,
    roughness: 0.9,
    metalness: 0.0,
  });
  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x1b462d,
    roughness: 0.86,
    metalness: 0.02,
  });
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4d311d,
    roughness: 0.9,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.woodPlankMap,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.8,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e242c,
    roughness: 0.38,
    metalness: 0.78,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x626b75,
    roughness: 0.92,
  });
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfff0be,
    emissive: 0xffb838,
    emissiveIntensity: 2.2,
    roughness: 0.18,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xc9252d,
    roughness: 0.42,
    metalness: 0.15,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf4c245,
    emissive: 0x8a5b0c,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.82,
  });
  const creamWrapMat = new THREE.MeshStandardMaterial({
    color: 0xf4ebd6,
    roughness: 0.65,
  });
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xd9262e,
    roughness: 0.35,
  });
  const hollyMat = new THREE.MeshStandardMaterial({
    color: 0x1c4a2b,
    roughness: 0.82,
  });

  const twinkleBulbs: THREE.Mesh[] = [];
  const twinkleBaseColors: THREE.Color[] = [];
  const lampHaloMats: THREE.SpriteMaterial[] = [];
  const groundGlowMats: THREE.MeshBasicMaterial[] = [];
  const flags: THREE.Mesh[] = [];

  // =========================================================================
  // 1. HERO GIANT CHRISTMAS TREE (Central Plaza) — Composite Multi-Tier Model
  // =========================================================================
  const heroTree = new THREE.Group();
  heroTree.position.set(TREE_CENTER.x, 0, TREE_CENTER.z);
  heroTree.scale.setScalar(1.22);

  // Sturdy trunk + snow base mound
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.88, 3.0, 12), trunkMat);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  heroTree.add(trunk);

  // 7 lush snow-dusted evergreen tiers
  const tiers = [
    { y: 2.8, r: 4.1, h: 2.6 },
    { y: 4.4, r: 3.55, h: 2.5 },
    { y: 5.9, r: 3.0, h: 2.35 },
    { y: 7.3, r: 2.45, h: 2.15 },
    { y: 8.6, r: 1.9, h: 1.95 },
    { y: 9.75, r: 1.35, h: 1.75 },
    { y: 10.75, r: 0.82, h: 1.45 },
  ];

  const baubleGeo = new THREE.SphereGeometry(0.18, 12, 10);
  const bulbGeo = new THREE.SphereGeometry(0.095, 8, 8);
  const bulbColors = [0xffdf7a, 0xff5a5a, 0x6ce8ff, 0xffe484, 0xff9b42];

  tiers.forEach((tier, tIdx) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 12), pineMat);
    cone.position.y = tier.y;
    cone.rotation.y = tIdx * 0.42;
    cone.castShadow = true;
    cone.receiveShadow = true;
    heroTree.add(cone);

    // Snow cap mantle perched over bough tips
    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(tier.r * 0.96, tier.h * 0.56, 12),
      snowMat,
    );
    snowCap.position.y = tier.y + tier.h * 0.24;
    snowCap.rotation.y = tIdx * 0.42 + 0.12;
    heroTree.add(snowCap);

    // Ornaments & twinkling fairy lights around each tier edge
    const count = Math.max(5, 14 - tIdx * 2);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + tIdx * 0.65;
      const rad = tier.r * 0.88;
      const bx = Math.cos(ang) * rad;
      const bz = Math.sin(ang) * rad;
      const by = tier.y - tier.h * 0.34;

      if (i % 2 === 0) {
        const bauble = new THREE.Mesh(baubleGeo, i % 4 === 0 ? redMat : goldMat);
        bauble.position.set(bx, by, bz);
        heroTree.add(bauble);
      } else {
        const col = bulbColors[(i + tIdx) % bulbColors.length];
        const bMat = new THREE.MeshBasicMaterial({ color: col });
        const bulb = new THREE.Mesh(bulbGeo, bMat);
        bulb.position.set(bx * 1.03, by + 0.14, bz * 1.03);
        heroTree.add(bulb);
        twinkleBulbs.push(bulb);
        twinkleBaseColors.push(new THREE.Color(col));
      }
    }
  });

  // Glowing 5-Pointed Golden Star Topper
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.92 : 0.38;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const topStarGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  topStarGeo.center();
  const topStar = new THREE.Mesh(
    topStarGeo,
    new THREE.MeshStandardMaterial({
      color: 0xfff2a6,
      emissive: 0xffc838,
      emissiveIntensity: 2.6,
      roughness: 0.15,
      metalness: 0.5,
    }),
  );
  topStar.position.y = 11.85;
  heroTree.add(topStar);

  const starHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textures.glowHaloSprite,
      color: 0xffe485,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.92,
    }),
  );
  starHalo.position.set(0, 11.85, 0);
  starHalo.scale.set(4.5, 4.5, 1);
  heroTree.add(starHalo);

  // =========================================================================
  // 2. STACKED WRAPPED GIFT BOXES AROUND THE TREE BASE
  // =========================================================================
  const addGiftBox = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rotY: number,
    boxMat: THREE.Material,
    ribMat: THREE.Material,
  ) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMat);
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h * 0.18, d + 0.08), boxMat);
    lid.position.y = h - h * 0.06;
    g.add(lid);

    const rib1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.08, 0.14), ribMat);
    rib1.position.y = h * 0.5;
    g.add(rib1);

    const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, h + 0.08, d + 0.1), ribMat);
    rib2.position.y = h * 0.5;
    g.add(rib2);

    // 3D twin-loop ribbon bow on top
    for (const s of [-1, 1]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), ribMat);
      loop.position.set(s * 0.14, h + 0.14, 0);
      loop.rotation.y = s * 0.4;
      g.add(loop);
    }

    heroTree.add(g);
  };

  const giftSpecs: Array<[number, number, number, number, number, number, number, number]> = [
    [-2.4, 0, 1.5, 1.15, 1.05, 1.15, 0.25, 0],
    [-2.35, 1.05, 1.48, 0.78, 0.72, 0.78, -0.2, 2],
    [-1.2, 0, 2.3, 1.35, 1.18, 1.2, 0.12, 0],
    [0.25, 0, 2.55, 1.05, 0.95, 1.05, -0.3, 1],
    [1.35, 0, 2.1, 1.2, 1.05, 1.1, 0.4, 1],
    [1.3, 1.05, 2.05, 0.75, 0.7, 0.75, 0.1, 0],
    [2.6, 0, 1.1, 1.25, 1.15, 1.15, -0.25, 2],
    [2.55, 1.15, 1.08, 0.85, 0.78, 0.85, 0.3, 0],
    [-2.8, 0, 0.1, 1.1, 1.0, 1.1, 0.5, 2],
    [2.5, 0, -0.6, 1.15, 1.05, 1.1, -0.4, 0],
    [-1.5, 0, -2.3, 1.2, 1.0, 1.1, 0.2, 1],
    [0.8, 0, -2.4, 1.1, 0.95, 1.1, -0.15, 2],
  ];
  const boxMats = [redMat, creamWrapMat, goldMat];
  const ribMats = [goldMat, redMat, redMat];
  for (const [gx, gy, gz, gw, gh, gd, rot, mIdx] of giftSpecs) {
    addGiftBox(gx, gy, gz, gw, gh, gd, rot, boxMats[mIdx], ribMats[mIdx]);
  }

  group.add(heroTree);

  // =========================================================================
  // 3. CHEERFUL SNOWMAN beside the Central Tree
  // =========================================================================
  const snowman = new THREE.Group();
  snowman.position.set(SNOWMAN_POS.x, 0, SNOWMAN_POS.z);
  snowman.rotation.y = 0.55;

  const sBot = new THREE.Mesh(new THREE.SphereGeometry(0.66, 16, 14), snowMat);
  sBot.position.y = 0.58;
  sBot.castShadow = true;
  snowman.add(sBot);

  const sMid = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 14), snowMat);
  sMid.position.y = 1.38;
  sMid.castShadow = true;
  snowman.add(sMid);

  const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), snowMat);
  sHead.position.y = 2.02;
  sHead.castShadow = true;
  snowman.add(sHead);

  // Red scarf + tail
  const smScarf = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.085, 8, 18), redMat);
  smScarf.rotation.x = Math.PI / 2;
  smScarf.position.y = 1.74;
  snowman.add(smScarf);

  const smScarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.06), redMat);
  smScarfTail.position.set(0.24, 1.5, 0.28);
  smScarfTail.rotation.z = -0.25;
  snowman.add(smScarfTail);

  // Carrot nose
  const carrot = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0xeb6e1e, roughness: 0.6 }),
  );
  carrot.rotation.x = Math.PI / 2;
  carrot.position.set(0, 2.0, 0.42);
  snowman.add(carrot);

  // Coal eyes & buttons
  const coalGeo = new THREE.SphereGeometry(0.045, 8, 8);
  for (const sx of [-0.11, 0.11]) {
    const e = new THREE.Mesh(coalGeo, ironMat);
    e.position.set(sx, 2.1, 0.3);
    snowman.add(e);
  }
  for (let bIdx = 0; bIdx < 3; bIdx++) {
    const btn = new THREE.Mesh(coalGeo, ironMat);
    btn.position.set(0, 1.52 - bIdx * 0.18, 0.46);
    snowman.add(btn);
  }

  // Classic black top hat + red ribbon
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 14), ironMat);
  hatBrim.position.y = 2.3;
  snowman.add(hatBrim);
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.42, 14), ironMat);
  hatCrown.position.y = 2.52;
  snowman.add(hatCrown);
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.285, 0.09, 14), redMat);
  hatBand.position.y = 2.37;
  snowman.add(hatBand);

  // Twig arms
  const twigGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.85, 6);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(twigGeo, trunkMat);
    arm.position.set(s * 0.68, 1.48, 0.05);
    arm.rotation.z = s * 1.15;
    snowman.add(arm);
  }

  group.add(snowman);

  // =========================================================================
  // 4. THREE ARCHED WOODEN FOOTBRIDGES WITH CORNER LANTERNS
  // =========================================================================
  for (const br of BRIDGES) {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(br.centerX, 0, br.z);

    const plankCount = 13;
    const plankLen = br.span / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const t = (i + 0.5) / plankCount; // 0..1
      const lx = (t - 0.5) * br.span;
      const norm = (t - 0.5) * 2; // -1..1
      const ly = 0.08 + (1 - norm * norm) * br.archHeight;
      const slope = -2 * norm * (br.archHeight / (br.span * 0.5));

      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(plankLen * 0.9, 0.14, br.width),
        woodMat,
      );
      plank.position.set(lx, ly, 0);
      plank.rotation.z = Math.atan(slope);
      plank.receiveShadow = true;
      plank.castShadow = true;
      bridgeGroup.add(plank);
    }

    // Arched side handrails & posts on both north & south sides
    for (const side of [-1, 1]) {
      const rz = side * (br.width * 0.5 - 0.12);
      const railPts: THREE.Vector3[] = [];
      const postCount = 5;
      for (let p = 0; p < postCount; p++) {
        const u = p / (postCount - 1);
        const px = (u - 0.5) * br.span;
        const norm = (u - 0.5) * 2;
        const py = 0.1 + (1 - norm * norm) * br.archHeight;

        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.18), trunkMat);
        post.position.set(px, py + 0.5, rz);
        post.castShadow = true;
        bridgeGroup.add(post);

        railPts.push(new THREE.Vector3(px, py + 0.98, rz));

        // Warm glowing post lanterns on bridge entrances
        if (p === 0 || p === postCount - 1) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), lanternGlassMat);
          cap.position.set(px, py + 1.15, rz);
          bridgeGroup.add(cap);
        }
      }
      const railCurve = new THREE.CatmullRomCurve3(railPts);
      const railMesh = new THREE.Mesh(
        new THREE.TubeGeometry(railCurve, 20, 0.085, 6, false),
        trunkMat,
      );
      bridgeGroup.add(railMesh);

      // Snow dusting along top rail
      const railSnowPts = railPts.map((v) => new THREE.Vector3(v.x, v.y + 0.08, v.z));
      const railSnow = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railSnowPts), 16, 0.06, 6, false),
        snowMat,
      );
      bridgeGroup.add(railSnow);
    }

    group.add(bridgeGroup);
  }

  // =========================================================================
  // 5. VINTAGE CAST-IRON STREET LAMPS + WARM HALO SPRITES (100% synced with colliders)
  // =========================================================================
  const lampPositions = LAMP_POSITIONS;

  const addStreetLamp = (lx: number, lz: number) => {
    const ly = Math.max(0, getTerrainHeight(lx, lz));
    const lg = new THREE.Group();
    lg.position.set(lx, ly, lz);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.65, 8), ironMat);
    base.position.y = 0.32;
    lg.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.1, 8), ironMat);
    pole.position.y = 2.0;
    pole.castShadow = true;
    lg.add(pole);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.44, 6), lanternGlassMat);
    head.position.y = 3.68;
    lg.add(head);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 6), ironMat);
    cap.position.y = 4.0;
    lg.add(cap);

    const haloMat = new THREE.SpriteMaterial({
      map: textures.glowHaloSprite,
      color: 0xffc862,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.86,
    });
    lampHaloMats.push(haloMat);
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(0, 3.7, 0);
    halo.scale.set(4.1, 4.1, 1);
    lg.add(halo);

    // Warm golden ground pool beneath every streetlamp
    const groundGlowMat = new THREE.MeshBasicMaterial({
      map: textures.glowHaloSprite,
      color: 0xffb84a,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.36,
    });
    groundGlowMats.push(groundGlowMat);
    const groundGlow = new THREE.Mesh(new THREE.CircleGeometry(3.6, 20), groundGlowMat);
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = 0.06;
    lg.add(groundGlow);

    group.add(lg);
  };

  for (const [lx, lz] of lampPositions) {
    addStreetLamp(lx, lz);
  }

  // =========================================================================
  // 6. LEFT SLED TRACK: RED TRIANGULAR FLAGS + WOODEN RAIL FENCES + LANTERNS
  // =========================================================================
  const flagZList = [-36, -25, -14, -3, 8, 19, 30, 39];
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.068, 2.9, 8);
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(1.45, -0.4);
  flagShape.lineTo(0, -0.84);
  flagShape.closePath();
  const flagGeo = new THREE.ShapeGeometry(flagShape);
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xe6242b,
    emissive: 0x4a080a,
    emissiveIntensity: 0.45,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });

  flagZList.forEach((fz, idx) => {
    const side = idx % 2 === 0 ? 1 : -1;
    const fx = getSledTrackCenterX(fz) + side * (getSledTrackHalfWidth() + 0.55);
    const fy = Math.max(0, getTerrainHeight(fx, fz));

    const fg = new THREE.Group();
    fg.position.set(fx, fy, fz);

    const pole = new THREE.Mesh(poleGeo, creamWrapMat);
    pole.position.y = 1.45;
    fg.add(pole);

    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.5, 8), redMat);
    stripe.position.y = 1.5;
    fg.add(stripe);

    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.04, 2.82, 0);
    fg.add(flag);
    flags.push(flag);

    // Add cozy glowing wooden-post lantern beside every other flag along the sled run
    if (idx % 2 === 1) {
      const lx = getSledTrackCenterX(fz) - side * (getSledTrackHalfWidth() + 0.75);
      const ly = Math.max(0, getTerrainHeight(lx, fz));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 0.22), trunkMat);
      post.position.set(lx, ly + 0.67, fz);
      group.add(post);

      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.32), lanternGlassMat);
      lantern.position.set(lx, ly + 1.5, fz);
      group.add(lantern);

      const lHaloMat = new THREE.SpriteMaterial({
        map: textures.glowHaloSprite,
        color: 0xffc862,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.78,
      });
      lampHaloMats.push(lHaloMat);
      const lHalo = new THREE.Sprite(lHaloMat);
      lHalo.position.set(lx, ly + 1.5, fz);
      lHalo.scale.set(2.5, 2.5, 1);
      group.add(lHalo);
    }

    group.add(fg);
  });

  // Rustic wooden split-rail fences bordering the sled track & stream foreground
  const addFenceRun = (points: Array<[number, number]>) => {
    for (let i = 0; i < points.length; i++) {
      const [x1, z1] = points[i];
      const y1 = Math.max(0, getTerrainHeight(x1, z1));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.16), trunkMat);
      post.position.set(x1, y1 + 0.5, z1);
      post.castShadow = true;
      group.add(post);

      if (i < points.length - 1) {
        const [x2, z2] = points[i + 1];
        const y2 = Math.max(0, getTerrainHeight(x2, z2));
        const len = Math.hypot(x2 - x1, z2 - z1);
        const ang = Math.atan2(x2 - x1, z2 - z1);
        for (const rh of [0.38, 0.78]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, len), woodMat);
          rail.position.set((x1 + x2) * 0.5, (y1 + y2) * 0.5 + rh, (z1 + z2) * 0.5);
          rail.rotation.y = ang;
          group.add(rail);
        }
      }
    }
  };

  // Render exact wooden split-rail fences from shared FENCE_RUNS (100% synced with physics collision!)
  for (const run of FENCE_RUNS) {
    addFenceRun(run);
  }

  // =========================================================================
  // 6B. 3 SNOWY JUMP RAMPS (눈 둔덕 점프대) + START / FINISH SKI GATES
  // =========================================================================
  const rampIceMat = new THREE.MeshStandardMaterial({
    color: 0xd6ecff,
    emissive: 0x1d4066,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0.08,
  });

  for (const r of JUMP_RAMPS) {
    const rg = new THREE.Group();
    const hNorth = Math.max(0, getBaseTerrainHeight(r.x, r.z - r.halfLength));
    const hCenter = Math.max(0, getBaseTerrainHeight(r.x, r.z));
    const hSouth = Math.max(0, getBaseTerrainHeight(r.x, r.z + r.halfLength));
    const slopePitch = Math.atan2(hNorth - hSouth, r.halfLength * 2);
    rg.position.set(r.x, hCenter, r.z);
    rg.rotation.x = slopePitch;

    // Sculpted snowy kicker wedge mesh matching getJumpRampElevation flush along the steep mountain
    const rampShape = new THREE.Shape();
    rampShape.moveTo(-r.halfLength, 0);
    rampShape.quadraticCurveTo(0, r.height * 0.62, r.halfLength * 0.48, r.height);
    rampShape.quadraticCurveTo(r.halfLength * 0.84, r.height * 0.72, r.halfLength, 0);
    rampShape.closePath();

    const rampGeo = new THREE.ExtrudeGeometry(rampShape, {
      depth: r.halfWidth * 1.78,
      bevelEnabled: true,
      bevelThickness: 0.28,
      bevelSize: 0.22,
      bevelSegments: 2,
    });
    // Rotate so length runs along Z (+Z downhill lip) and width spans X
    rampGeo.rotateY(-Math.PI / 2);
    rampGeo.translate(r.halfWidth * 0.89, -0.18, 0);
    const rampMesh = new THREE.Mesh(rampGeo, rampIceMat);
    rampMesh.receiveShadow = true;
    rampMesh.castShadow = true;
    rg.add(rampMesh);

    // Bright red & gold takeoff lip strip + twin side marker poles
    const lipStrip = new THREE.Mesh(
      new THREE.BoxGeometry(r.halfWidth * 1.68, 0.14, 0.3),
      redMat,
    );
    lipStrip.position.set(0, r.height * 0.96, r.halfLength * 0.46);
    rg.add(lipStrip);

    for (const side of [-1, 1]) {
      const mPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 1.65, 8), creamWrapMat);
      mPost.position.set(side * (r.halfWidth + 0.18), r.height * 0.52 + 0.6, r.halfLength * 0.42);
      rg.add(mPost);

      const mTop = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), goldMat);
      mTop.position.set(side * (r.halfWidth + 0.18), r.height * 0.52 + 1.48, r.halfLength * 0.42);
      rg.add(mTop);
    }

    group.add(rg);
  }

  // Start Line ("출발선") & Finish Line ("도착선 · 리프트") wide overhead arch gates spanning the 2x wide slope
  const addSkiGateArch = (x: number, z: number, bannerMap: THREE.CanvasTexture) => {
    const gg = new THREE.Group();
    const gy = Math.max(0, getBaseTerrainHeight(x, z));
    gg.position.set(x, gy, z);
    const halfSpan = 9.2;
    const archH = 5.4;

    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, archH, 10), trunkMat);
      post.position.set(side * halfSpan, archH * 0.5, 0);
      post.castShadow = true;
      gg.add(post);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), goldMat);
      cap.position.set(side * halfSpan, archH + 0.22, 0);
      gg.add(cap);
    }

    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerMap,
      roughness: 0.48,
      metalness: 0.05,
    });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(halfSpan * 2 + 0.5, 1.65, 0.28), bannerMat);
    banner.position.set(0, archH - 0.55, 0);
    gg.add(banner);

    group.add(gg);
  };

  addSkiGateArch(SKI_TRACK_GATES.startLine.x, SKI_TRACK_GATES.startLine.z, textures.startBannerMap);
  addSkiGateArch(SKI_TRACK_GATES.finishLine.x, SKI_TRACK_GATES.finishLine.z, textures.finishBannerMap);

  // =========================================================================
  // 7. WOODEN PARK BENCHES AROUND PLAZA & COBBLESTONE PROMENADE (100% synced with colliders)
  // =========================================================================
  const benchSpecs = BENCH_SPECS;
  for (const [bx, bz, rot] of benchSpecs) {
    const bg = new THREE.Group();
    bg.position.set(bx, Math.max(0, getTerrainHeight(bx, bz)), bz);
    bg.rotation.y = rot;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.55), woodMat);
    seat.position.set(0, 0.52, 0);
    seat.castShadow = true;
    bg.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.48, 0.08), woodMat);
    back.position.set(0, 0.88, -0.24);
    back.rotation.x = -0.15;
    bg.add(back);

    for (const sx of [-0.75, 0.75]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.5), ironMat);
      leg.position.set(sx, 0.26, 0);
      bg.add(leg);
    }
    group.add(bg);
  }

  // =========================================================================
  // 8. STREAM BANK SNOW-CAPPED BOULDERS & RED WINTERBERRY BUSHES
  // =========================================================================
  const rockGeo = new THREE.DodecahedronGeometry(0.65, 1);
  const bushGeo = new THREE.IcosahedronGeometry(0.55, 1);

  for (let z = -44; z <= 42; z += 3.4) {
    // Skip right on bridge crossings
    if (BRIDGES.some((b) => Math.abs(z - b.z) < b.width * 0.78)) continue;
    const sx = getStreamCenterX(z);
    const hw = getStreamHalfWidth(z);
    for (const side of [-1, 1]) {
      const rx = sx + side * (hw + 0.42 + ((Math.abs(z * 13) % 7) * 0.12));
      const ry = Math.max(-0.2, getTerrainHeight(rx, z));
      const scale = 0.78 + ((Math.abs(Math.floor(z * 7 + side * 3)) % 5) * 0.15);

      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, ry + 0.18 * scale, z);
      rock.scale.set(scale * 1.15, scale * 0.72, scale);
      rock.rotation.y = z * 0.7;
      group.add(rock);

      const cap = new THREE.Mesh(rockGeo, snowMat);
      cap.position.set(rx, ry + 0.36 * scale, z);
      cap.scale.set(scale * 0.92, scale * 0.42, scale * 0.85);
      group.add(cap);

      // Periodic festive red winterberry bush
      if (Math.abs(Math.floor(z)) % 4 === 1) {
        const bx = rx + side * 0.65;
        const bush = new THREE.Mesh(bushGeo, hollyMat);
        bush.position.set(bx, Math.max(0, getTerrainHeight(bx, z)) + 0.35, z);
        bush.scale.set(1.1, 0.78, 1.1);
        group.add(bush);
        for (let b = 0; b < 5; b++) {
          const ang = (b / 5) * Math.PI * 2;
          const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), berryMat);
          berry.position.set(
            bx + Math.cos(ang) * 0.45,
            Math.max(0, getTerrainHeight(bx, z)) + 0.48 + (b % 2) * 0.14,
            z + Math.sin(ang) * 0.45,
          );
          group.add(berry);
        }
      }
    }
  }

  // =========================================================================
  // 9. FESTIVE FESTOON STRING LIGHTS BETWEEN TREE & COTTAGES
  // =========================================================================
  const addStringLights = (p1: THREE.Vector3, p2: THREE.Vector3, sag: number) => {
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const wire = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.025, 4, false),
      ironMat,
    );
    group.add(wire);

    const bulbCount = 9;
    for (let i = 1; i < bulbCount; i++) {
      const pt = curve.getPoint(i / bulbCount);
      const col = bulbColors[i % bulbColors.length];
      const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: col }));
      bulb.position.copy(pt);
      bulb.position.y -= 0.08;
      group.add(bulb);
      twinkleBulbs.push(bulb);
      twinkleBaseColors.push(new THREE.Color(col));
    }
  };

  addStringLights(
    new THREE.Vector3(TREE_CENTER.x - 2.0, 7.6, TREE_CENTER.z - 1.5),
    new THREE.Vector3(-22.5, 4.4, -13.0),
    1.8,
  );
  addStringLights(
    new THREE.Vector3(TREE_CENTER.x + 2.2, 7.4, TREE_CENTER.z - 2.4),
    new THREE.Vector3(-6.2, 5.4, -27.5),
    2.1,
  );
  addStringLights(
    new THREE.Vector3(21.5, 4.8, 3.2),
    new THREE.Vector3(32.5, 5.0, -8.5),
    1.5,
  );
  addStringLights(
    new THREE.Vector3(19.2, 6.2, -28.0),
    new THREE.Vector3(30.2, 6.4, -31.0),
    1.3,
  );

  // =========================================================================
  // 10. INSTANCED SNOW-LADEN PINE FOREST PERIMETER (100% synced with PINE_TREES colliders!)
  // =========================================================================
  const pinePositions = PINE_TREES.map((p) => ({ x: p.x, y: p.y, z: p.z, s: p.scale }));

  const pCount = pinePositions.length;
  const instTrunk = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.36, 1.6, 7),
    trunkMat,
    pCount,
  );
  const instLow = new THREE.InstancedMesh(new THREE.ConeGeometry(2.05, 2.7, 8), pineMat, pCount);
  const instMid = new THREE.InstancedMesh(new THREE.ConeGeometry(1.55, 2.3, 8), pineMat, pCount);
  const instTop = new THREE.InstancedMesh(new THREE.ConeGeometry(1.05, 1.85, 8), pineMat, pCount);
  const instSnow1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.88, 1.35, 8), snowMat, pCount);
  const instSnow2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.38, 1.15, 8), snowMat, pCount);
  const instSnow3 = new THREE.InstancedMesh(new THREE.ConeGeometry(0.95, 1.15, 8), snowMat, pCount);

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  pinePositions.forEach((p, idx) => {
    const s = p.s;
    const rot = idx * 1.1;

    dummy.position.set(p.x, p.y + 0.8 * s, p.z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    instTrunk.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 2.3 * s, p.z);
    dummy.updateMatrix();
    instLow.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 3.85 * s, p.z);
    dummy.updateMatrix();
    instMid.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 5.15 * s, p.z);
    dummy.updateMatrix();
    instTop.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 2.95 * s, p.z);
    dummy.updateMatrix();
    instSnow1.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 4.4 * s, p.z);
    dummy.updateMatrix();
    instSnow2.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, p.y + 5.55 * s, p.z);
    dummy.updateMatrix();
    instSnow3.setMatrixAt(idx, dummy.matrix);

    // Subtle organic foliage tint variation
    tint.setRGB(0.85 + (idx % 5) * 0.05, 0.94 + (idx % 4) * 0.03, 0.9 + (idx % 3) * 0.04);
    instLow.setColorAt(idx, tint);
    instMid.setColorAt(idx, tint);
    instTop.setColorAt(idx, tint);
  });

  [instTrunk, instLow, instMid, instTop, instSnow1, instSnow2, instSnow3].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    group.add(m);
  });

  // =========================================================================
  // 11. COLLECTIBLE GOLDEN FESTIVE STAR ORNAMENTS (8 Village Landmarks)
  // =========================================================================
  const starMeshes = new Map<string, THREE.Group>();
  const collectStarGeo = new THREE.OctahedronGeometry(0.42, 0);
  const collectStarMat = new THREE.MeshStandardMaterial({
    color: 0xfff0a3,
    emissive: 0xffbf33,
    emissiveIntensity: 2.1,
    roughness: 0.15,
    metalness: 0.75,
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffe07d,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });

  for (const c of COLLECTIBLES) {
    const cg = new THREE.Group();
    const baseY = c.isAerial ? c.y : Math.max(0, getTerrainHeight(c.x, c.z)) + c.y;
    cg.position.set(c.x, baseY, c.z);

    const gem = new THREE.Mesh(collectStarGeo, collectStarMat);
    gem.scale.set(1, 1.35, 1);
    cg.add(gem);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 6, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    cg.add(ring);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: textures.glowHaloSprite,
        color: 0xffdf75,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.75,
      }),
    );
    halo.scale.set(2.2, 2.2, 1);
    cg.add(halo);

    cg.userData.baseY = baseY;
    group.add(cg);
    starMeshes.set(c.id, cg);
  }

  // =========================================================================
  // 12. FLOATING 3D SPEECH BUBBLES (Red Postbox & Toy Shop Front Door!)
  // =========================================================================
  const speechBubbles = new Map<string, { sprite: THREE.Sprite; baseY: number }>();
  for (const npc of INTERACTABLES) {
    const baseY = Math.max(0, getTerrainHeight(npc.x, npc.z)) + npc.bubbleY;
    const spMat = new THREE.SpriteMaterial({
      map: textures.speechBubbleSprite,
      transparent: true,
      depthTest: false,
      opacity: 0,
    });
    const sprite = new THREE.Sprite(spMat);
    sprite.position.set(npc.x, baseY, npc.z);
    sprite.scale.set(2.8, 1.75, 1);
    sprite.visible = false;
    group.add(sprite);
    speechBubbles.set(npc.id, { sprite, baseY });
  }

  const dayLanternColor = new THREE.Color(0xcbd6e2);
  const nightLanternColor = new THREE.Color(0xfff0be);
  const offBulbColor = new THREE.Color(0x3a424d);
  const topStarMat = topStar.material as THREE.MeshStandardMaterial;
  const starHaloMat = starHalo.material as THREE.SpriteMaterial;
  let currentNightFactor = 1;

  const setNightFactor = (nightFactor: number) => {
    const f = Math.max(0, Math.min(1, nightFactor));
    currentNightFactor = f;
    lanternGlassMat.emissiveIntensity = 0.04 + 2.2 * f;
    lanternGlassMat.color.copy(dayLanternColor).lerp(nightLanternColor, f);
    topStarMat.emissiveIntensity = 0.18 + 2.45 * f;
    starHaloMat.opacity = 0.92 * f;

    for (let i = 0; i < lampHaloMats.length; i++) {
      lampHaloMats[i].opacity = 0.84 * f;
    }
    for (let i = 0; i < groundGlowMats.length; i++) {
      groundGlowMats[i].opacity = 0.36 * f;
    }
    for (let i = 0; i < twinkleBulbs.length; i++) {
      const m = twinkleBulbs[i].material as THREE.MeshBasicMaterial;
      m.color.copy(offBulbColor).lerp(twinkleBaseColors[i], f);
    }
  };

  // Per-frame lightweight prop animation (zero GC allocations)
  const update = (elapsed: number, activeNpcId: string | null) => {
    topStar.rotation.y = elapsed * 0.75;

    // Gentle breeze flutter on sled track red flags
    for (let i = 0; i < flags.length; i++) {
      flags[i].rotation.y = Math.sin(elapsed * 3.1 + i * 1.2) * 0.22;
    }

    // Gentle festive twinkle scale on tree & festoon bulbs when lit at dusk/night
    for (let i = 0; i < twinkleBulbs.length; i++) {
      const pulse =
        currentNightFactor > 0.08
          ? 0.85 + 0.35 * currentNightFactor * Math.sin(elapsed * 3.2 + i * 0.9)
          : 0.72;
      twinkleBulbs[i].scale.setScalar(pulse);
    }

    // Bob & rotate collectible star ornaments
    let idx = 0;
    starMeshes.forEach((sg) => {
      if (!sg.visible) return;
      sg.rotation.y = elapsed * 1.6 + idx;
      sg.position.y = (sg.userData.baseY as number) + Math.sin(elapsed * 2.4 + idx) * 0.18;
      idx++;
    });

    // Pop-in floating speech bubble when the rabbit approaches Red Postbox or Toy Shop door!
    speechBubbles.forEach((entry, id) => {
      const mat = entry.sprite.material as THREE.SpriteMaterial;
      const isNear = activeNpcId === id;
      const targetOp = isNear ? 1 : 0;
      mat.opacity += (targetOp - mat.opacity) * 0.2;
      entry.sprite.visible = mat.opacity > 0.03;
      if (entry.sprite.visible) {
        const bounce = 1 + Math.sin(elapsed * 5.0) * 0.06;
        entry.sprite.scale.set(2.85 * bounce, 1.78 * bounce, 1);
        entry.sprite.position.y = entry.baseY + Math.sin(elapsed * 3.2) * 0.14;
      }
    });
  };

  return {
    group,
    starMeshes,
    twinkleBulbs,
    topStar,
    flags,
    update,
    setNightFactor,
  };
}
