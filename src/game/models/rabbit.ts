import * as THREE from 'three';

export interface RabbitRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  earLeft: THREE.Group;
  earRight: THREE.Group;
  footLeft: THREE.Mesh;
  footRight: THREE.Mesh;
  pawLeft: THREE.Mesh;
  pawRight: THREE.Mesh;
  tail: THREE.Mesh;
  scarfTail: THREE.Mesh;
  shadowDisc: THREE.Mesh;
  snowboard: THREE.Group;
}

// Composite 12+ part adorable white Christmas rabbit pivoted at bottom-center (y = 0)
export function createRabbitModel(contactShadowMap: THREE.Texture): RabbitRig {
  const root = new THREE.Group();
  root.name = 'WhiteRabbit';

  // Varied PBR materials (soft matte fur vs glossy dark eyes vs woven red scarf)
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.88,
    metalness: 0.0,
  });
  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xf4b6c2,
    roughness: 0.72,
    metalness: 0.0,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x161214,
    roughness: 0.12,
    metalness: 0.15,
  });
  const eyeSparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xe87b8e,
    roughness: 0.42,
    metalness: 0.05,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: 0xc8262e,
    roughness: 0.78,
    metalness: 0.0,
  });
  const scarfGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf0c24b,
    roughness: 0.45,
    metalness: 0.35,
  });

  // Soft radial contact shadow disc directly on ground
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.68, 24),
    new THREE.MeshBasicMaterial({
      map: contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.025;
  root.add(shadowDisc);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // 1. Plump lower torso (Lathe/scaled sphere)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 16), furMat);
  torso.scale.set(0.96, 1.08, 0.92);
  torso.position.set(0, 0.52, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // 2. Fluffy chest puff
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), furMat);
  chest.position.set(0, 0.6, 0.19);
  chest.castShadow = true;
  bodyGroup.add(chest);

  // 3. Cute hind feet
  const footGeo = new THREE.SphereGeometry(0.16, 14, 12);
  footGeo.scale(0.85, 0.58, 1.45);
  const footLeft = new THREE.Mesh(footGeo, furMat);
  footLeft.position.set(-0.2, 0.1, 0.06);
  footLeft.castShadow = true;
  bodyGroup.add(footLeft);

  const footRight = new THREE.Mesh(footGeo, furMat);
  footRight.position.set(0.2, 0.1, 0.06);
  footRight.castShadow = true;
  bodyGroup.add(footRight);

  // 4. Little front paws
  const pawGeo = new THREE.SphereGeometry(0.11, 12, 10);
  pawGeo.scale(0.85, 1.25, 0.9);
  const pawLeft = new THREE.Mesh(pawGeo, furMat);
  pawLeft.position.set(-0.28, 0.54, 0.24);
  pawLeft.rotation.x = 0.35;
  pawLeft.castShadow = true;
  bodyGroup.add(pawLeft);

  const pawRight = new THREE.Mesh(pawGeo, furMat);
  pawRight.position.set(0.28, 0.54, 0.24);
  pawRight.rotation.x = 0.35;
  pawRight.castShadow = true;
  bodyGroup.add(pawRight);

  // 5. Fluffy round pom-pom tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), furMat);
  tail.position.set(0, 0.34, -0.38);
  tail.castShadow = true;
  bodyGroup.add(tail);

  // 6. Cozy knitted red scarf collar + trailing ribbon tail + gold bell
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.085, 10, 22), scarfMat);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.position.set(0, 0.86, 0.02);
  scarfRing.castShadow = true;
  bodyGroup.add(scarfRing);

  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.06), scarfMat);
  scarfTail.position.set(0.16, 0.72, 0.26);
  scarfTail.rotation.set(-0.25, 0, -0.22);
  scarfTail.castShadow = true;
  bodyGroup.add(scarfTail);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), scarfGoldMat);
  bell.position.set(0, 0.8, 0.32);
  bodyGroup.add(bell);

  // 7. Round cute head group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.14, 0.04);
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.39, 20, 18), furMat);
  head.scale.set(1.06, 0.96, 0.98);
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  // Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const cheekL = new THREE.Mesh(cheekGeo, innerEarMat);
  cheekL.scale.set(1.1, 0.65, 0.5);
  cheekL.position.set(-0.23, -0.05, 0.3);
  headGroup.add(cheekL);

  const cheekR = new THREE.Mesh(cheekGeo, innerEarMat);
  cheekR.scale.set(1.1, 0.65, 0.5);
  cheekR.position.set(0.23, -0.05, 0.3);
  headGroup.add(cheekR);

  // Glossy eyes with specular catchlight dots
  const eyeGeo = new THREE.SphereGeometry(0.062, 12, 10);
  const sparkGeo = new THREE.SphereGeometry(0.02, 8, 8);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.16, 0.04, 0.33);
    headGroup.add(eye);
    const spark = new THREE.Mesh(sparkGeo, eyeSparkMat);
    spark.position.set(side * 0.145, 0.062, 0.382);
    headGroup.add(spark);
  }

  // Tiny pink nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), noseMat);
  nose.scale.set(1.25, 0.85, 0.9);
  nose.position.set(0, -0.02, 0.38);
  headGroup.add(nose);

  // 8. Articulated tall upright bunny ears with soft pink interiors
  const buildEar = (side: number): THREE.Group => {
    const earPivot = new THREE.Group();
    earPivot.position.set(side * 0.17, 0.3, -0.02);

    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.42, 8, 14), furMat);
    outer.scale.set(0.95, 1, 0.58);
    outer.position.set(0, 0.28, 0);
    outer.castShadow = true;
    earPivot.add(outer);

    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.32, 6, 12), innerEarMat);
    inner.scale.set(0.9, 1, 0.35);
    inner.position.set(0, 0.27, 0.045);
    earPivot.add(inner);

    earPivot.rotation.z = -side * 0.12;
    earPivot.rotation.x = -0.06;
    return earPivot;
  };

  const earLeft = buildEar(-1);
  const earRight = buildEar(1);
  headGroup.add(earLeft, earRight);

  // 9. Composite Festive Red & Gold Snowboard (auto-equips smoothly on snow!)
  const snowboard = new THREE.Group();
  snowboard.name = 'FestiveSnowboard';
  snowboard.visible = false;
  snowboard.position.set(0, 0.06, 0);

  const boardRedMat = new THREE.MeshStandardMaterial({
    color: 0xc9222b,
    roughness: 0.24,
    metalness: 0.18,
  });
  const boardEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd9e4f0,
    roughness: 0.25,
    metalness: 0.85,
  });
  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0x202733,
    roughness: 0.55,
    metalness: 0.35,
  });

  // Main deck with rounded twin tips
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.055, 1.38), boardRedMat);
  deck.castShadow = true;
  snowboard.add(deck);

  // Upturned front nose & rear tail tips
  const tipGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.055, 14);
  const boardNose = new THREE.Mesh(tipGeo, boardRedMat);
  boardNose.position.set(0, 0.045, 0.72);
  boardNose.rotation.x = -0.32;
  snowboard.add(boardNose);

  const tailTip = new THREE.Mesh(tipGeo, boardRedMat);
  tailTip.position.set(0, 0.045, -0.72);
  tailTip.rotation.x = 0.32;
  snowboard.add(tailTip);

  // Gold center racing stripe + metallic steel side rails
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.062, 1.34), scarfGoldMat);
  snowboard.add(stripe);

  for (const sx of [-0.235, 0.235]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.048, 1.36), boardEdgeMat);
    rail.position.set(sx, -0.005, 0);
    snowboard.add(rail);
  }

  // Twin angled foot bindings
  for (const bz of [-0.26, 0.26]) {
    const bind = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.18), bindingMat);
    bind.position.set(0, 0.05, bz);
    bind.rotation.y = bz > 0 ? 0.22 : -0.18;
    snowboard.add(bind);
  }

  root.add(snowboard);

  return {
    root,
    bodyGroup,
    headGroup,
    earLeft,
    earRight,
    footLeft,
    footRight,
    pawLeft,
    pawRight,
    tail,
    scarfTail,
    shadowDisc,
    snowboard,
  };
}
