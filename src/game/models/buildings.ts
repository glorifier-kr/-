import * as THREE from 'three';
import type { BuildingSpec } from '../worldLayout';
import { getTerrainHeight } from '../worldLayout';
import type { ProceduralTextureSet } from '../textures';

export interface VillageBuildingsHandle {
  group: THREE.Group;
  setNightFactor: (nightFactor: number) => void;
}

export function buildAllVillageBuildings(
  specs: BuildingSpec[],
  textures: ProceduralTextureSet,
): VillageBuildingsHandle {
  const group = new THREE.Group();
  group.name = 'EuropeanVillageBuildings';
  const porchHaloMats: THREE.SpriteMaterial[] = [];

  // Shared PBR Materials with varied roughness/metalness
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.brickMap,
    bumpMap: textures.brickBump,
    bumpScale: 0.04,
    roughness: 0.85,
    metalness: 0.02,
  });
  const plasterTimberMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.plasterTimberMap,
    roughness: 0.84,
    metalness: 0.02,
  });
  const woodWallMat = new THREE.MeshStandardMaterial({
    color: 0xc29368,
    map: textures.woodPlankMap,
    bumpMap: textures.woodBump,
    bumpScale: 0.035,
    roughness: 0.82,
    metalness: 0.03,
  });
  const sageWallMat = new THREE.MeshStandardMaterial({
    color: 0x3b5848,
    roughness: 0.8,
    metalness: 0.04,
  });
  const stoneBaseMat = new THREE.MeshStandardMaterial({
    color: 0x6f7074,
    bumpMap: textures.cobbleBump,
    bumpScale: 0.04,
    roughness: 0.9,
    metalness: 0.04,
  });
  const darkTimberMat = new THREE.MeshStandardMaterial({
    color: 0x3f2818,
    roughness: 0.78,
    metalness: 0.05,
  });
  const roofSlateMat = new THREE.MeshStandardMaterial({
    color: 0x2f3a4a,
    roughness: 0.75,
    metalness: 0.1,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf0f6ff,
    bumpMap: textures.snowBump,
    bumpScale: 0.025,
    roughness: 0.92,
    metalness: 0.0,
  });
  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.warmWindowMap,
    emissive: 0xffba42,
    emissiveMap: textures.warmWindowMap,
    emissiveIntensity: 1.65,
    roughness: 0.22,
    metalness: 0.1,
  });
  const awningMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.awningStripeMap,
    roughness: 0.72,
    metalness: 0.02,
  });
  const redDoorMat = new THREE.MeshStandardMaterial({
    color: 0x9e2125,
    roughness: 0.55,
    metalness: 0.08,
  });
  const greenDoorMat = new THREE.MeshStandardMaterial({
    color: 0x245938,
    roughness: 0.58,
    metalness: 0.08,
  });
  const garlandMat = new THREE.MeshStandardMaterial({
    color: 0x1d4d2c,
    roughness: 0.85,
  });
  const bowRedMat = new THREE.MeshStandardMaterial({
    color: 0xd9262e,
    roughness: 0.4,
    metalness: 0.12,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe6b647,
    emissive: 0x8f5d10,
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.78,
  });

  // Helper: extruded gabled snow roof
  const addGabledRoof = (
    parent: THREE.Group,
    w: number,
    d: number,
    wallH: number,
    peakH: number,
  ) => {
    const overhangX = 0.55;
    const overhangZ = 0.55;
    const hw = w * 0.5 + overhangX;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(0, peakH);
    shape.lineTo(hw, 0);
    shape.lineTo(hw - 0.35, -0.2);
    shape.lineTo(0, peakH - 0.45);
    shape.lineTo(-hw + 0.35, -0.2);
    shape.closePath();

    const roofGeo = new THREE.ExtrudeGeometry(shape, {
      depth: d + overhangZ * 2,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    roofGeo.translate(0, 0, -(d * 0.5 + overhangZ));
    const roof = new THREE.Mesh(roofGeo, roofSlateMat);
    roof.position.y = wallH;
    roof.castShadow = true;
    roof.receiveShadow = true;
    parent.add(roof);

    // Gable wall triangles front & back
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-w * 0.49, 0);
    gableShape.lineTo(0, peakH - 0.25);
    gableShape.lineTo(w * 0.49, 0);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: d * 0.98, bevelEnabled: false });
    gableGeo.translate(0, 0, -d * 0.49);
    const gableMesh = new THREE.Mesh(gableGeo, plasterTimberMat);
    gableMesh.position.y = wallH;
    parent.add(gableMesh);

    // Thick cozy snow blanket perched on top of roof
    const snowShape = new THREE.Shape();
    snowShape.moveTo(-hw - 0.08, 0.06);
    snowShape.lineTo(0, peakH + 0.28);
    snowShape.lineTo(hw + 0.08, 0.06);
    snowShape.lineTo(hw - 0.16, -0.1);
    snowShape.lineTo(0, peakH - 0.04);
    snowShape.lineTo(-hw + 0.16, -0.1);
    snowShape.closePath();

    const snowGeo = new THREE.ExtrudeGeometry(snowShape, {
      depth: d + overhangZ * 2 + 0.16,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 2,
    });
    snowGeo.translate(0, 0, -(d * 0.5 + overhangZ + 0.08));
    const snowRoof = new THREE.Mesh(snowGeo, snowMat);
    snowRoof.position.y = wallH + 0.05;
    snowRoof.receiveShadow = true;
    parent.add(snowRoof);
  };

  // Helper: chimney with snow cap
  const addChimney = (parent: THREE.Group, x: number, y: number, z: number, h: number) => {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.85, h, 0.85), brickMat);
    ch.position.set(x, y + h * 0.5, z);
    ch.castShadow = true;
    parent.add(ch);

    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.22, 1.06), snowMat);
    rim.position.set(x, y + h + 0.08, z);
    parent.add(rim);
  };

  // Helper: glowing mullioned window with dark wood frame & snow sill
  const addWindow = (
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    rotY = 0,
  ) => {
    const wg = new THREE.Group();
    wg.position.set(x, y, z);
    wg.rotation.y = rotY;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.14), darkTimberMat);
    wg.add(frame);

    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), warmWindowMat);
    pane.position.z = 0.08;
    wg.add(pane);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.28, 0.14, 0.26), snowMat);
    sill.position.set(0, -h * 0.5 - 0.08, 0.08);
    wg.add(sill);

    parent.add(wg);
  };

  // Helper: festive doorway with solid jambs, wreath & lintel garland
  const addDoor = (
    parent: THREE.Group,
    x: number,
    z: number,
    doorMat: THREE.Material,
    w = 1.25,
    h = 2.15,
  ) => {
    const dg = new THREE.Group();
    dg.position.set(x, 0, z);

    // Door jambs & header
    const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.18, h + 0.15, 0.24), darkTimberMat);
    jambL.position.set(-w * 0.5 - 0.08, h * 0.5, 0.04);
    dg.add(jambL);

    const jambR = jambL.clone();
    jambR.position.x = w * 0.5 + 0.08;
    dg.add(jambR);

    const header = new THREE.Mesh(new THREE.BoxGeometry(w + 0.42, 0.22, 0.28), darkTimberMat);
    header.position.set(0, h + 0.12, 0.05);
    dg.add(header);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), doorMat);
    panel.position.set(0, h * 0.5, 0.01);
    dg.add(panel);

    // Christmas wreath on door
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 8, 16), garlandMat);
    wreath.position.set(0, h * 0.62, 0.12);
    dg.add(wreath);

    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.12), bowRedMat);
    bow.position.set(0, h * 0.62 + 0.26, 0.16);
    dg.add(bow);

    // Warm porch lantern beside/above door
    const haloMat = new THREE.SpriteMaterial({
      map: textures.glowHaloSprite,
      color: 0xffd072,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.62,
    });
    porchHaloMats.push(haloMat);
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(0, h + 0.45, 0.35);
    halo.scale.set(2.2, 2.2, 1);
    dg.add(halo);

    parent.add(dg);
  };

  for (const spec of specs) {
    const b = new THREE.Group();
    b.name = spec.id;
    const baseY = Math.max(0, getTerrainHeight(spec.x, spec.z)) - 0.1;
    b.position.set(spec.x, baseY, spec.z);
    b.rotation.y = spec.rotationY;

    const w = spec.width;
    const d = spec.depth;

    if (spec.style === 'townhall') {
      // Grand 2-story Red-Brick Holiday Hall matching upper-center of reference image
      const wallH = 5.4;
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.7, d + 0.3), stoneBaseMat);
      plinth.position.y = 0.35;
      plinth.receiveShadow = true;
      b.add(plinth);

      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), brickMat);
      mainBody.position.y = wallH * 0.5 + 0.2;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      b.add(mainBody);

      // Center projecting entrance gable
      const portico = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.6, 1.3), brickMat);
      portico.position.set(0, 2.4, d * 0.5 + 0.45);
      portico.castShadow = true;
      b.add(portico);

      // Roof oriented lengthwise (rotate roof 90 deg so ridge runs along X!)
      const roofHolder = new THREE.Group();
      roofHolder.rotation.y = Math.PI / 2;
      addGabledRoof(roofHolder, d, w, wallH + 0.1, 2.8);
      b.add(roofHolder);

      // Front center gable pediment
      const pedHolder = new THREE.Group();
      pedHolder.position.set(0, 0, d * 0.5 + 0.2);
      addGabledRoof(pedHolder, 3.2, 1.6, 4.4, 1.8);
      b.add(pedHolder);

      // Twin brick chimneys
      addChimney(b, -w * 0.32, wallH + 1.2, -0.4, 2.4);
      addChimney(b, w * 0.32, wallH + 1.2, -0.4, 2.4);

      // Front doorway + garland
      addDoor(b, 0, d * 0.5 + 1.08, redDoorMat, 1.4, 2.35);

      // Rows of warmly glowing windows across both floors
      for (const wx of [-3.6, -2.2, 2.2, 3.6]) {
        addWindow(b, wx, 1.85, d * 0.5 + 0.02, 0.95, 1.25);
        addWindow(b, wx, 3.85, d * 0.5 + 0.02, 0.95, 1.15);
      }
      addWindow(b, 0, 3.65, d * 0.5 + 1.12, 1.05, 1.05);
      // Side windows
      for (const side of [-1, 1]) {
        addWindow(b, side * (w * 0.5 + 0.02), 1.9, 0.9, 1.0, 1.2, side * Math.PI * 0.5);
        addWindow(b, side * (w * 0.5 + 0.02), 1.9, -1.1, 1.0, 1.2, side * Math.PI * 0.5);
        addWindow(b, side * (w * 0.5 + 0.02), 3.8, 0, 1.0, 1.1, side * Math.PI * 0.5);
      }
    } else if (spec.style === 'toyshop') {
      // Half-timbered Alpine Toy Shop with iconic Red & White Striped Awning!
      const wallH = 4.3;
      const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.65, d + 0.2), stoneBaseMat);
      base.position.y = 0.32;
      b.add(base);

      const lower = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), woodWallMat);
      lower.position.y = 1.5;
      lower.castShadow = true;
      lower.receiveShadow = true;
      b.add(lower);

      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 1.9, d + 0.3),
        plasterTimberMat,
      );
      upper.position.y = 3.55;
      upper.castShadow = true;
      b.add(upper);

      addGabledRoof(b, w + 0.3, d + 0.3, wallH + 0.15, 2.5);
      addChimney(b, -w * 0.28, wallH + 1.2, -0.8, 2.0);

      // Red & white striped awning over front left display window
      const awning = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 1.35), awningMat);
      awning.position.set(-1.1, 2.65, d * 0.5 + 0.55);
      awning.rotation.x = 0.38;
      awning.castShadow = true;
      b.add(awning);

      // Glowing bay shop windows & green door
      addDoor(b, 1.5, d * 0.5 + 0.02, greenDoorMat, 1.2, 2.15);
      addWindow(b, -1.2, 1.55, d * 0.5 + 0.04, 2.3, 1.45);
      addWindow(b, 0, 3.6, d * 0.5 + 0.18, 1.5, 1.1);
      addWindow(b, -w * 0.5 - 0.02, 1.6, 0.2, 2.0, 1.4, -Math.PI * 0.5);
      addWindow(b, w * 0.5 + 0.02, 1.6, 0.2, 1.8, 1.35, Math.PI * 0.5);

      // Festive pine garland trim under upper eave
      const garland = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.24, 0.24), garlandMat);
      garland.position.set(0, 2.68, d * 0.5 + 0.18);
      b.add(garland);
    } else if (spec.style === 'workshop') {
      // Clockmaker / Toymaker Workshop with glowing golden gear inside window!
      const wallH = 4.4;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), plasterTimberMat);
      body.position.y = wallH * 0.5 + 0.1;
      body.castShadow = true;
      body.receiveShadow = true;
      b.add(body);

      // Heavy dark timber corner posts
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, wallH, 0.28), darkTimberMat);
          post.position.set(sx * (w * 0.5), wallH * 0.5 + 0.1, sz * (d * 0.5));
          b.add(post);
        }
      }

      addGabledRoof(b, w, d, wallH + 0.05, 2.6);
      addChimney(b, w * 0.34, wallH + 1.0, 0.4, 2.2);

      // Tall glowing workshop windows
      addWindow(b, -1.35, 1.9, d * 0.5 + 0.03, 2.2, 2.1);
      addWindow(b, 1.45, 1.9, d * 0.5 + 0.03, 2.0, 2.0);
      addWindow(b, 0, 4.9, d * 0.5 + 0.03, 1.2, 1.0);
      addWindow(b, -w * 0.5 - 0.03, 1.9, 0, 2.2, 1.8, -Math.PI * 0.5);

      // Iconic glowing golden mechanical gear visible in right workshop window!
      const gearGroup = new THREE.Group();
      gearGroup.position.set(1.45, 1.9, d * 0.5 + 0.18);
      const gearRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.1, 8, 18), brassMat);
      gearGroup.add(gearRing);
      const toothGeo = new THREE.BoxGeometry(0.14, 0.28, 0.08);
      for (let t = 0; t < 8; t++) {
        const ang = (t / 8) * Math.PI * 2;
        const tooth = new THREE.Mesh(toothGeo, brassMat);
        tooth.position.set(Math.cos(ang) * 0.64, Math.sin(ang) * 0.64, 0);
        tooth.rotation.z = ang + Math.PI / 2;
        gearGroup.add(tooth);
      }
      b.add(gearGroup);
    } else if (spec.style === 'postoffice') {
      // Bottom-Right Sage-Green European Post Office Cottage + Classic Red Pillar Postbox!
      const wallH = 4.2;
      const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.25, 0.65, d + 0.25), stoneBaseMat);
      base.position.y = 0.32;
      b.add(base);

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), sageWallMat);
      body.position.y = wallH * 0.5 + 0.2;
      body.castShadow = true;
      body.receiveShadow = true;
      b.add(body);

      addGabledRoof(b, w, d, wallH + 0.15, 2.5);
      addChimney(b, w * 0.35, wallH + 1.1, -0.5, 2.2);

      // Front red door + twin glowing bay windows + attic gable window
      addDoor(b, 0, d * 0.5 + 0.03, redDoorMat, 1.25, 2.2);
      addWindow(b, -1.9, 1.65, d * 0.5 + 0.04, 1.55, 1.55);
      addWindow(b, 1.9, 1.65, d * 0.5 + 0.04, 1.55, 1.55);
      addWindow(b, 0, 4.95, d * 0.5 + 0.04, 1.4, 1.05);
      addWindow(b, -w * 0.5 - 0.04, 1.7, 0.3, 1.8, 1.45, -Math.PI * 0.5);

      // Festive pine garland with 3 red bows across facade
      const garland = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.26, 0.24), garlandMat);
      garland.position.set(0, 3.05, d * 0.5 + 0.14);
      b.add(garland);
      for (const bx of [-2.0, 0, 2.0]) {
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.16), bowRedMat);
        bow.position.set(bx, 3.05, d * 0.5 + 0.28);
        b.add(bow);
      }

      // Classic red pillar postbox standing beside front corner
      const postbox = new THREE.Group();
      postbox.position.set(-w * 0.5 - 0.75, 0, d * 0.5 + 0.55);
      const pbCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.35, 14), bowRedMat);
      pbCyl.position.y = 0.68;
      pbCyl.castShadow = true;
      postbox.add(pbCyl);
      const pbCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), bowRedMat);
      pbCap.position.y = 1.34;
      postbox.add(pbCap);
      const pbSnow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), snowMat);
      pbSnow.position.y = 1.42;
      postbox.add(pbSnow);
      b.add(postbox);
    } else {
      // Cozy Wood Cottage & Alpine Hillside Cottages
      const isWood = spec.style === 'woodcottage';
      const wallH = isWood ? 3.2 : 3.8;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, wallH, d),
        isWood ? woodWallMat : plasterTimberMat,
      );
      body.position.y = wallH * 0.5 + 0.1;
      body.castShadow = true;
      body.receiveShadow = true;
      b.add(body);

      addGabledRoof(b, w, d, wallH + 0.05, 2.2);
      addChimney(b, w * 0.28, wallH + 0.9, -0.5, 1.8);
      addDoor(b, 0, d * 0.5 + 0.02, isWood ? darkTimberMat : greenDoorMat, 1.1, 1.95);
      addWindow(b, -w * 0.3, 1.5, d * 0.5 + 0.03, 0.95, 1.05);
      addWindow(b, w * 0.3, 1.5, d * 0.5 + 0.03, 0.95, 1.05);
      addWindow(b, 0, wallH + 0.85, d * 0.5 + 0.03, 0.95, 0.85);
      addWindow(b, -w * 0.5 - 0.03, 1.55, 0, 1.1, 1.05, -Math.PI * 0.5);
      addWindow(b, w * 0.5 + 0.03, 1.55, 0, 1.1, 1.05, Math.PI * 0.5);
    }

    group.add(b);
  }

  const dayWinColor = new THREE.Color(0x55718f);
  const nightWinColor = new THREE.Color(0xffffff);

  const setNightFactor = (nightFactor: number) => {
    const f = Math.max(0, Math.min(1, nightFactor));
    warmWindowMat.emissiveIntensity = 0.04 + 1.65 * f;
    warmWindowMat.color.copy(dayWinColor).lerp(nightWinColor, f);
    brassMat.emissiveIntensity = 0.08 + 0.52 * f;
    for (let i = 0; i < porchHaloMats.length; i++) {
      porchHaloMats[i].opacity = 0.62 * f;
    }
  };

  return { group, setNightFactor };
}
