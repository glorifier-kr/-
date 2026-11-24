import * as THREE from 'three';
import {
  CHAIRLIFT,
  CHAIRLIFT_PYLON_FRACTIONS,
  SKI_TRACK_GATES,
  evaluateChairliftPose,
  getBaseTerrainHeight,
  getTerrainHeight,
} from '../worldLayout';
import type { ProceduralTextureSet } from '../textures';

export interface ChairSeatItem {
  group: THREE.Group;
  swayPivot: THREE.Group;
  safetyBar: THREE.Group;
  seatAnchor: THREE.Group; // Where the white rabbit sits!
  phaseOffset: number;
}

export interface ChairliftSystem {
  group: THREE.Group;
  chairs: ChairSeatItem[];
  lowerWheel: THREE.Group;
  upperWheel: THREE.Group;
  boardingBeacon: THREE.Mesh;
  update: (elapsed: number, dt: number, activeChairIdx: number | null) => void;
  setNightFactor: (nightFactor: number) => void;
}

export function createChairliftSystem(textures: ProceduralTextureSet): ChairliftSystem {
  const group = new THREE.Group();
  group.name = 'Alpine2PersonChairlift';
  const stationHaloMats: THREE.SpriteMaterial[] = [];
  let boothWinMat: THREE.MeshStandardMaterial | null = null;

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x3a4759,
    roughness: 0.38,
    metalness: 0.72,
  });
  const redPaintMat = new THREE.MeshStandardMaterial({
    color: 0xb9262d,
    roughness: 0.35,
    metalness: 0.28,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.woodPlankMap,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.78,
    metalness: 0.04,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4f321e,
    roughness: 0.82,
    metalness: 0.04,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xeef5ff,
    bumpMap: textures.snowBump,
    bumpScale: 0.025,
    roughness: 0.9,
    metalness: 0.0,
  });
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x252d38,
    roughness: 0.4,
    metalness: 0.8,
  });
  const goldLampMat = new THREE.MeshStandardMaterial({
    color: 0xffe49e,
    emissive: 0xffb83d,
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x1f5c3a,
    roughness: 0.85,
    metalness: 0.0,
  });

  const low = CHAIRLIFT.lowerStation;
  const high = CHAIRLIFT.upperStation;
  const dx = high.x - low.x;
  const dz = high.z - low.z;
  const spanLen = Math.hypot(dx, dz);
  const lineYaw = Math.atan2(dx, dz);

  // Build bullwheel assembly helper
  const buildBullwheel = (): THREE.Group => {
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(CHAIRLIFT.lateralOffset, 0.14, 10, 28),
      redPaintMat,
    );
    rim.rotation.x = Math.PI / 2;
    wheel.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.55, 14), steelMat);
    wheel.add(hub);

    const spokeGeo = new THREE.BoxGeometry(CHAIRLIFT.lateralOffset * 1.92, 0.1, 0.12);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(spokeGeo, steelMat);
      spoke.rotation.y = (i * Math.PI) / 4;
      wheel.add(spoke);
    }
    return wheel;
  };

  // Build Alpine Station (lower boarding station & upper summit station)
  const buildStation = (
    pos: { x: number; y: number; z: number },
    cableHeight: number,
    isLower: boolean,
  ): THREE.Group => {
    const st = new THREE.Group();
    st.position.set(pos.x, pos.y, pos.z);
    st.rotation.y = lineYaw;

    // Raised wooden boarding deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 6.2), woodMat);
    deck.position.set(0, 0.18, isLower ? 0.5 : -0.5);
    deck.receiveShadow = true;
    deck.castShadow = true;
    st.add(deck);

    // Subtle glowing gold edge stripe on lower boarding platform
    if (isLower) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(5.8, 0.04, 0.25),
        new THREE.MeshStandardMaterial({
          color: 0xffd25a,
          emissive: 0xffae26,
          emissiveIntensity: 0.85,
          roughness: 0.4,
        }),
      );
      stripe.position.set(0, 0.37, 2.75);
      st.add(stripe);
    }

    // 4 heavy timber/steel corner columns supporting Alpine shelter roof
    const roofBaseY = cableHeight + 1.1;
    const colGeo = new THREE.CylinderGeometry(0.18, 0.22, roofBaseY, 10);
    const colCoords = [
      [-2.8, -2.1],
      [2.8, -2.1],
      [-2.8, 2.1],
      [2.8, 2.1],
    ];
    for (const [cx, cz] of colCoords) {
      const col = new THREE.Mesh(colGeo, darkWoodMat);
      col.position.set(cx, roofBaseY * 0.5, cz);
      col.castShadow = true;
      st.add(col);
    }

    // Central steel drive pillar supporting bullwheel
    const drivePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.46, cableHeight + 0.6, 12),
      steelMat,
    );
    drivePillar.position.set(0, (cableHeight + 0.6) * 0.5, 0);
    drivePillar.castShadow = true;
    st.add(drivePillar);

    // Gabled Alpine snow roof canopy
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-3.6, 0);
    roofShape.lineTo(0, 2.0);
    roofShape.lineTo(3.6, 0);
    roofShape.lineTo(3.1, -0.25);
    roofShape.lineTo(0, 1.55);
    roofShape.lineTo(-3.1, -0.25);
    roofShape.closePath();

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
      depth: 5.4,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    });
    roofGeo.translate(0, 0, -2.7);
    const roofMesh = new THREE.Mesh(roofGeo, darkWoodMat);
    roofMesh.position.y = roofBaseY;
    roofMesh.castShadow = true;
    st.add(roofMesh);

    // Thick snow cap on roof
    const snowCapGeo = new THREE.ExtrudeGeometry(roofShape, {
      depth: 5.6,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 2,
    });
    snowCapGeo.translate(0, 0, -2.8);
    const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
    snowCap.position.y = roofBaseY + 0.22;
    snowCap.scale.set(1.02, 0.85, 1.0);
    st.add(snowCap);

    // Warm station lanterns on front gable
    for (const sx of [-2.4, 2.4]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), goldLampMat);
      lamp.position.set(sx, roofBaseY - 0.35, 2.3);
      st.add(lamp);

      const haloMat = new THREE.SpriteMaterial({
        map: textures.glowHaloSprite,
        color: 0xffd078,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.72,
      });
      stationHaloMats.push(haloMat);
      const halo = new THREE.Sprite(haloMat);
      halo.position.copy(lamp.position);
      halo.scale.set(2.4, 2.4, 1);
      st.add(halo);
    }

    // Small festive lift ticket booth at lower station
    if (isLower) {
      const booth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 2.0), darkWoodMat);
      booth.position.set(-2.3, 1.45, -1.3);
      booth.castShadow = true;
      st.add(booth);

      boothWinMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.warmWindowMap,
        emissive: 0xffb844,
        emissiveMap: textures.warmWindowMap,
        emissiveIntensity: 1.4,
      });
      const boothWin = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), boothWinMat);
      boothWin.position.set(-2.3, 1.65, -0.29);
      st.add(boothWin);

      // Festive red banner sign with "2인 리프트" look
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 0.14), redPaintMat);
      signBoard.position.set(0, roofBaseY + 0.25, 2.78);
      st.add(signBoard);
    }

    const wheel = buildBullwheel();
    wheel.position.set(0, cableHeight, 0);
    st.add(wheel);

    group.add(st);
    return wheel;
  };

  const lowerWheel = buildStation(low, 4.2, true);
  const upperWheel = buildStation(high, CHAIRLIFT.upperTowerHeight, false);

  // Subtle floating glowing ring at boarding point so player immediately sees where to press E
  const boardingBeacon = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.065, 8, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffdf78,
      transparent: true,
      opacity: 0.78,
    }),
  );
  boardingBeacon.rotation.x = Math.PI / 2;
  boardingBeacon.position.set(
    CHAIRLIFT.boardingPoint.x,
    Math.max(0, getTerrainHeight(CHAIRLIFT.boardingPoint.x, CHAIRLIFT.boardingPoint.z)) + 0.14,
    CHAIRLIFT.boardingPoint.z,
  );
  group.add(boardingBeacon);

  // 3 Intermediate Steel Support Pylons along the tall alpine ski-slope span (100% synced with colliders!)
  for (const frac of CHAIRLIFT_PYLON_FRACTIONS) {
    const px = low.x + dx * frac;
    const pz = low.z + dz * frac;
    const groundY = Math.max(0, getBaseTerrainHeight(px, pz));
    // Match uphill cable height at this fraction
    const poseUp = evaluateChairliftPose(frac * 0.45);
    const topY = poseUp.y + 0.15;
    const towerH = Math.max(5, topY - groundY);

    const pylon = new THREE.Group();
    pylon.position.set(px, groundY, pz);
    pylon.rotation.y = lineYaw;

    // Concrete/stone footing
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.9, 8), steelMat);
    base.position.y = 0.45;
    pylon.add(base);

    // Tapered steel mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, towerH, 10), steelMat);
    mast.position.y = towerH * 0.5;
    mast.castShadow = true;
    pylon.add(mast);

    // Cross-arm holding both haul & return cables
    const crossArm = new THREE.Mesh(
      new THREE.BoxGeometry(CHAIRLIFT.lateralOffset * 2 + 1.2, 0.28, 0.34),
      steelMat,
    );
    crossArm.position.y = towerH;
    pylon.add(crossArm);

    // Sheave roller batteries on both ends
    for (const side of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 1.5), redPaintMat);
      beam.position.set(side * CHAIRLIFT.lateralOffset, towerH - 0.12, 0);
      pylon.add(beam);
      for (const rz of [-0.45, 0, 0.45]) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 10), steelMat);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(side * CHAIRLIFT.lateralOffset, towerH - 0.02, rz);
        pylon.add(roller);
      }
    }

    // Small warm beacon lamp at top of pylon
    const topLight = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), goldLampMat);
    topLight.position.set(0, towerH + 0.35, 0);
    pylon.add(topLight);

    group.add(pylon);
  }

  // Continuous closed 3D steel haul cable using TubeGeometry
  const cablePoints: THREE.Vector3[] = [];
  const sampleCount = 120;
  for (let i = 0; i < sampleCount; i++) {
    const p = evaluateChairliftPose(i / sampleCount);
    cablePoints.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  const cableCurve = new THREE.CatmullRomCurve3(cablePoints, true);
  const cableMesh = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 140, 0.055, 6, true),
    cableMat,
  );
  group.add(cableMesh);

  // Overhead visual guide cable directly linking the Ski Slope Finish Line arch to the Start Line summit arch
  const finishY =
    Math.max(0, getBaseTerrainHeight(SKI_TRACK_GATES.finishLine.x, SKI_TRACK_GATES.finishLine.z)) +
    5.4;
  const startY =
    Math.max(0, getBaseTerrainHeight(SKI_TRACK_GATES.startLine.x, SKI_TRACK_GATES.startLine.z)) +
    5.4;
  const midX = (SKI_TRACK_GATES.finishLine.x + SKI_TRACK_GATES.startLine.x) * 0.5 - 9.0;
  const midZ = (SKI_TRACK_GATES.finishLine.z + SKI_TRACK_GATES.startLine.z) * 0.5;
  const midGroundY = Math.max(0, getBaseTerrainHeight(midX, midZ));
  const gateMid = new THREE.Vector3(midX, Math.max((finishY + startY) * 0.5 + 3.5, midGroundY + 7.0), midZ);
  const gateCableCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(SKI_TRACK_GATES.finishLine.x - 9.0, finishY, SKI_TRACK_GATES.finishLine.z),
    gateMid,
    new THREE.Vector3(SKI_TRACK_GATES.startLine.x - 9.0, startY, SKI_TRACK_GATES.startLine.z),
  );
  const gateCableMesh = new THREE.Mesh(
    new THREE.TubeGeometry(gateCableCurve, 56, 0.075, 6, false),
    cableMat,
  );
  group.add(gateCableMesh);

  // Build 8 authentic 2-Person Lift Chairs
  const chairs: ChairSeatItem[] = [];
  for (let i = 0; i < CHAIRLIFT.chairCount; i++) {
    const chairRoot = new THREE.Group();
    const swayPivot = new THREE.Group();
    chairRoot.add(swayPivot);

    // 1. Cable clamp grip at y = 0
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.34), steelMat);
    swayPivot.add(clamp);

    // 2. Curved steel hanger rod dropping down to seat frame
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 1.95, 8), steelMat);
    hanger.position.set(0, -1.0, 0);
    swayPivot.add(hanger);

    // Upper crossbar above heads
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.09, 0.09), redPaintMat);
    topBar.position.set(0, -1.85, -0.35);
    swayPivot.add(topBar);

    // Side arm supports down to bench
    for (const side of [-0.9, 0.9]) {
      const sideFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), redPaintMat);
      sideFrame.position.set(side, -2.3, -0.35);
      swayPivot.add(sideFrame);

      const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.85), redPaintMat);
      armrest.position.set(side, -2.42, 0.05);
      swayPivot.add(armrest);
    }

    // 3. Wide 2-Person Slatted Wooden Bench Seat
    const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.12, 0.86), woodMat);
    seatBase.position.set(0, -2.75, 0.04);
    seatBase.castShadow = true;
    swayPivot.add(seatBase);

    // Two distinct cozy seat cushions (visually signaling 2-person seating!)
    for (const sx of [-0.46, 0.46]) {
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.72), cushionMat);
      cushion.position.set(sx, -2.67, 0.04);
      swayPivot.add(cushion);
    }

    // 4. Slatted wooden backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.72, 0.1), woodMat);
    backrest.position.set(0, -2.32, -0.36);
    backrest.rotation.x = -0.1;
    swayPivot.add(backrest);

    // Center armrest divider between seat 1 & seat 2
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.72), redPaintMat);
    divider.position.set(0, -2.6, 0.02);
    swayPivot.add(divider);

    // 5. Hinged Safety Bar + Footrest (pivots down when riding)
    const safetyBar = new THREE.Group();
    safetyBar.position.set(0, -1.9, -0.3);
    const barSideL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), steelMat);
    barSideL.rotation.x = Math.PI / 2;
    barSideL.position.set(-0.88, -0.25, 0.42);
    safetyBar.add(barSideL);

    const barSideR = barSideL.clone();
    barSideR.position.x = 0.88;
    safetyBar.add(barSideR);

    const lapBar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1.82, 8), redPaintMat);
    lapBar.rotation.z = Math.PI / 2;
    lapBar.position.set(0, -0.25, 0.8);
    safetyBar.add(lapBar);

    const footRest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.14), steelMat);
    footRest.position.set(0, -1.12, 0.66);
    safetyBar.add(footRest);
    swayPivot.add(safetyBar);

    // Small warm festive fairy lantern hanging on chair side
    const chairLantern = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldLampMat);
    chairLantern.position.set(0.92, -1.86, 0.02);
    swayPivot.add(chairLantern);

    // Seat anchor on left seat for the white rabbit (right seat stays open as the 2nd seat!)
    const seatAnchor = new THREE.Group();
    seatAnchor.position.set(-0.46, -2.63, 0.08);
    swayPivot.add(seatAnchor);

    group.add(chairRoot);
    chairs.push({
      group: chairRoot,
      swayPivot,
      safetyBar,
      seatAnchor,
      phaseOffset: i / CHAIRLIFT.chairCount,
    });
  }

  // Track smoothed safety-bar angle per chair
  const barAngles = chairs.map(() => -0.75);

  const update = (elapsed: number, dt: number, activeChairIdx: number | null) => {
    // Rotate bullwheels continuously in sync with cable movement
    const wheelSpeed = (spanLen * 2) / (CHAIRLIFT.loopDurationSec * CHAIRLIFT.lateralOffset);
    lowerWheel.rotation.y = elapsed * wheelSpeed * 0.45;
    upperWheel.rotation.y = elapsed * wheelSpeed * 0.45;

    // Gentle vertical float on boarding ring
    boardingBeacon.position.y =
      Math.max(0, getTerrainHeight(CHAIRLIFT.boardingPoint.x, CHAIRLIFT.boardingPoint.z)) +
      0.16 +
      Math.sin(elapsed * 2.2) * 0.05;

    const basePhase = (elapsed / CHAIRLIFT.loopDurationSec) % 1;
    const damp = 1 - Math.exp(-7 * dt);

    for (let i = 0; i < chairs.length; i++) {
      const c = chairs[i];
      const t = (basePhase + c.phaseOffset) % 1;
      const pose = evaluateChairliftPose(t);
      c.group.position.set(pose.x, pose.y, pose.z);
      c.group.rotation.y = pose.heading;

      // Gentle alpine pendulum sway in the snow breeze
      c.swayPivot.rotation.z = Math.sin(elapsed * 1.35 + i * 1.1) * 0.045;
      c.swayPivot.rotation.x = Math.cos(elapsed * 1.05 + i * 0.8) * 0.025;

      // Lower safety bar smoothly when rabbit is seated on this chair
      const targetBar = activeChairIdx === i ? 0.02 : -0.78;
      barAngles[i] += (targetBar - barAngles[i]) * damp;
      c.safetyBar.rotation.x = barAngles[i];
    }
  };

  // Initialize poses immediately for frame 0
  update(0, 0.016, null);

  const dayLampColor = new THREE.Color(0xcbd6e2);
  const nightLampColor = new THREE.Color(0xffe49e);
  const setNightFactor = (nightFactor: number) => {
    const f = Math.max(0, Math.min(1, nightFactor));
    goldLampMat.emissiveIntensity = 0.06 + 2.0 * f;
    goldLampMat.color.copy(dayLampColor).lerp(nightLampColor, f);
    if (boothWinMat) {
      boothWinMat.emissiveIntensity = 0.05 + 1.4 * f;
    }
    for (let i = 0; i < stationHaloMats.length; i++) {
      stationHaloMats[i].opacity = 0.72 * f;
    }
  };

  return {
    group,
    chairs,
    lowerWheel,
    upperWheel,
    boardingBeacon,
    update,
    setNightFactor,
  };
}
