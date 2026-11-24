import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BUILDINGS,
  CHAIRLIFT,
  COBBLE_ZONES,
  COLLECTIBLES,
  PLAYER_SPAWN,
  TREE_CENTER,
  checkCollectiblePickup,
  evaluateChairliftPose,
  getJumpRampCrestAt,
  getLiftDismountPoint,
  getNearbyInteractable,
  getSledTrackCenterX,
  getSledTrackHalfWidth,
  getStreamCenterX,
  getStreamHalfWidth,
  getTerrainHeight,
  getVillageZoneName,
  getWalkableHeight,
  isNearChairliftBoarding,
  isOnSnowSurface,
  resolvePlayerMovement,
  type InteractableNpcSpec,
} from './worldLayout';
import {
  CYCLE_DURATION_SEC,
  TIME_PRESET_SECONDS,
  evaluateDayNightState,
  type TimePhase,
} from './dayNightCycle';
import { createProceduralTextures, type ProceduralTextureSet } from './textures';
import { createRabbitModel, type RabbitRig } from './models/rabbit';
import { buildAllVillageBuildings, type VillageBuildingsHandle } from './models/buildings';
import { buildVillagePropsAndNature, type AnimatedPropsHandle } from './models/villageProps';
import { createChairliftSystem, type ChairliftSystem } from './models/chairlift';
import { VillageAudio } from './audio';

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';
export type MovementMode = 'walk' | 'snowboard' | 'lift';

export interface ActiveDialogueHud {
  npcId: string;
  speaker: string;
  text: string;
  lineIndex: number;
  totalLines: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  zone: string;
  movementMode: MovementMode;
  timePhase: TimePhase;
  timeLabel: string;
  collectedCount: number;
  totalCollectibles: number;
  nearLift: boolean;
  isRidingLift: boolean;
  liftAltitude: number;
  nearNpcPrompt: string | null;
  activeDialogue: ActiveDialogueHud | null;
  trickCount: number;
  muted: boolean;
  lastToast: string | null;
  playerX: number;
  playerZ: number;
}

interface BurstParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export class ChristmasVillageEngine {
  private container: HTMLElement;
  private onHudChange: (snapshot: HudSnapshot) => void;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private textures: ProceduralTextureSet;
  private audio: VillageAudio;

  private rabbit: RabbitRig;
  private chairlift: ChairliftSystem;
  private buildingsHandle: VillageBuildingsHandle;
  private props: AnimatedPropsHandle;
  private snowPoints: THREE.Points;
  private snowVelocities: Float32Array;
  private streamMat: THREE.MeshStandardMaterial;
  private burstPool: BurstParticle[] = [];
  private burstCursor = 0;

  // Dynamic Day/Night Cycle scene refs
  private hemiLight!: THREE.HemisphereLight;
  private sunLight!: THREE.DirectionalLight;
  private warmPointLights: Array<{ light: THREE.PointLight; baseIntensity: number }> = [];
  private starPoints!: THREE.Points;
  private starMat!: THREE.PointsMaterial;
  private starBaseColors!: Float32Array;
  private moonMesh!: THREE.Mesh;
  private moonHalo!: THREE.Sprite;
  private fogObj!: THREE.FogExp2;
  private skyBgColor = new THREE.Color(0x081322);
  private dayCycleSec = TIME_PRESET_SECONDS.night;
  private currentTimePhase: TimePhase = 'night';
  private currentTimeLabel = '밤';

  // Game & player state
  private phase: GamePhase = 'title';
  private playerX = PLAYER_SPAWN.x;
  private playerY = 0;
  private playerZ = PLAYER_SPAWN.z;
  private playerYaw = PLAYER_SPAWN.yaw;
  private playerVy = 0;
  private velX = 0;
  private velZ = 0;
  private isGrounded = true;
  private isSnowboarding = false;
  private boardScale = 0;
  private carveLean = 0;
  private walkCycle = 0;
  private stepDistAccum = 0;
  private squashX = 1;
  private squashY = 1;

  // Jump ramps & double-Space 360° mid-air trick state
  private airTrickAvailable = false;
  private isDoingAirTrick = false;
  private airTrickProgress = 0;
  private trickCount = 0;
  private rampLaunchCooldown = 0;

  // Smooth automatic camera lead state
  private camLeadX = 0;
  private camLeadZ = 0;
  private camAutoYaw = 0;
  private prevCamPlayerX = PLAYER_SPAWN.x;
  private prevCamPlayerZ = PLAYER_SPAWN.z;

  // NPC Interaction & Dialogue state (Red Postbox & Toy Shop)
  private nearbyNpc: InteractableNpcSpec | null = null;
  private activeDialogueNpc: InteractableNpcSpec | null = null;
  private dialogueLineIdx = 0;

  // 2-person chairlift ride & mouse orbit camera state
  private isRidingLift = false;
  private liftAutoClimb = false;
  private activeChairIdx: number | null = null;
  private activeChairT = 0;
  private liftTimeOffset = 0;
  private liftPanAngle = -0.18;
  private liftPitchAngle = 0.42;
  private liftCamDistance = 74;
  private liftUserAdjustedCam = false;
  private isDraggingLiftCam = false;
  private dragLastX = 0;
  private dragLastY = 0;
  private liftAltitude = 0;

  // Collectibles & HUD throttling
  private collectedIds = new Set<string>();
  private lastToast: string | null = null;
  private toastTimer = 0;
  private lastHudPush = 0;
  private victoryShown = false;

  // Unified keyboard input
  private heldKeys = new Set<string>();
  private justPressed = new Set<string>();
  private spacePressQueue = 0;

  // Loop & timing
  private frameId = 0;
  private destroyed = false;
  private lastFrameMs = 0;
  private elapsed = 0;
  private resizeObserver: ResizeObserver;

  // Scratch vectors (zero GC in loop)
  private readonly _camDesiredPos = new THREE.Vector3();
  private readonly _camDesiredLook = new THREE.Vector3();
  private readonly _camCurrentLook = new THREE.Vector3();
  private readonly _seatWorldPos = new THREE.Vector3();
  private readonly _seatWorldQuat = new THREE.Quaternion();
  private readonly _tmpVec = new THREE.Vector3();

  constructor(container: HTMLElement, onHudChange: (snapshot: HudSnapshot) => void) {
    this.container = container;
    this.onHudChange = onHudChange;
    this.audio = new VillageAudio();

    // Detect software WebGL (SwiftShader / llvmpipe / WARP) via renderer string
    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Renderer configuration
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.setAttribute('data-testid', 'christmas-village-canvas');
    container.appendChild(this.renderer.domElement);

    // Scene & dynamic winter sky / fog
    this.scene = new THREE.Scene();
    this.scene.background = this.skyBgColor;
    this.fogObj = new THREE.FogExp2(0x081322, 0.0056);
    this.scene.fog = this.fogObj;

    // Studio environment map scaled dynamically across Day/Sunset/Night/Dawn
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.24;
    pmrem.dispose();

    // Camera
    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.3, 380);
    this.camera.position.set(-2, 26.5, 58);
    this._camCurrentLook.set(-3.0, 5.5, -2.0);
    this.camera.lookAt(this._camCurrentLook);

    // Procedural Textures
    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());

    // Build World
    this.setupLighting();
    this.buildStarryNightSky();
    this.streamMat = this.buildTerrainAndWater();
    this.buildingsHandle = buildAllVillageBuildings(BUILDINGS, this.textures);
    this.scene.add(this.buildingsHandle.group);
    this.props = buildVillagePropsAndNature(this.textures);
    this.scene.add(this.props.group);
    this.chairlift = createChairliftSystem(this.textures);
    this.scene.add(this.chairlift.group);

    // Sync initial lighting/sky/stars to starting cycle time
    this.applyDayNightCycle();

    // Build Hero White Rabbit (slightly larger for crisp quarter-view visibility)
    this.rabbit = createRabbitModel(this.textures.contactShadowMap);
    this.rabbit.root.scale.setScalar(1.18);
    const startH = getWalkableHeight(this.playerX, this.playerZ);
    this.playerY = startH.y;
    this.rabbit.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.rabbit.root.rotation.y = this.playerYaw;
    this.scene.add(this.rabbit.root);

    // Snowfall & pooled burst particles
    const { points, velocities } = this.createSnowParticles();
    this.snowPoints = points;
    this.snowVelocities = velocities;
    this.scene.add(this.snowPoints);
    this.initBurstPool();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Event listeners (keyboard + chairlift mouse drag & wheel camera orbit)
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    this.renderer.domElement.addEventListener('wheel', this.handleWheel, { passive: false });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    // Sync initial DOM attributes & start loop
    this.syncBodyDataset();
    this.pushHud(true);

    this.lastFrameMs = performance.now();
    this.startLoop();
  }

  private setupLighting(): void {
    // Dynamic HemisphereLight modulated across Day -> Sunset -> Night -> Dawn
    this.hemiLight = new THREE.HemisphereLight(0x2d5085, 0x16192b, 0.56);
    this.scene.add(this.hemiLight);

    // Dynamic Sun / Moon DirectionalLight arcing smoothly across the sky
    this.sunLight = new THREE.DirectionalLight(0x88b4f0, 0.54);
    this.sunLight.position.set(-42, 62, 34);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 165;
    const d = 62;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // 6 rich warm golden-amber PointLights synced automatically with sunset/nightfall
    const warmLights: Array<[number, number, number, number, number]> = [
      [TREE_CENTER.x, 7.2, TREE_CENTER.z + 1.5, 145, 38], // Giant Christmas Tree & central plaza
      [19.0, 5.6, 24.5, 118, 34], // Bottom-right rabbit promenade & south bridge
      [17.5, 5.8, 5.0, 125, 36], // Mid bridge & striped-awning toy shop
      [-4.2, 6.0, -21.0, 125, 36], // Grand red-brick holiday hall front & north bridge
      [32.5, 5.8, 4.0, 115, 34], // Right European shop avenue (post office & workshop)
      [-41.5, 11.5, -2.0, 140, 48], // Left 2x wider tall alpine ski slope warm glow
    ];

    for (const [x, y, z, intensity, distance] of warmLights) {
      const pt = new THREE.PointLight(0xffa634, intensity, distance, 1.65);
      pt.position.set(x, y, z);
      this.scene.add(pt);
      this.warmPointLights.push({ light: pt, baseIntensity: intensity });
    }
  }

  private buildStarryNightSky(): void {
    // Crisp twinkling winter stars arcing across upper night sky dome
    const starCount = 850;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    this.starBaseColors = new Float32Array(starCount * 3);
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < starCount; i++) {
      const theta = rnd() * Math.PI * 2;
      const phi = rnd() * Math.PI * 0.44; // Upper hemisphere
      const r = 165 + rnd() * 45;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r + 14;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

      const warm = rnd() > 0.72;
      const cr = warm ? 1.0 : 0.85;
      const cg = warm ? 0.94 : 0.92;
      const cb = warm ? 0.78 : 1.0;
      colors[i * 3] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;
      this.starBaseColors[i * 3] = cr;
      this.starBaseColors[i * 3 + 1] = cg;
      this.starBaseColors[i * 3 + 2] = cb;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.starMat = new THREE.PointsMaterial({
      size: 1.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      fog: false,
      depthWrite: false,
    });
    this.starPoints = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.starPoints);

    // Soft glowing full winter moon high in the upper-left sky (fades smoothly during daytime)
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 18, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff5d6, transparent: true, opacity: 1, fog: false }),
    );
    this.moonMesh.position.set(-82, 74, -118);
    this.scene.add(this.moonMesh);

    this.moonHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.textures.glowHaloSprite,
        color: 0xcbe2ff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.36,
        fog: false,
      }),
    );
    this.moonHalo.position.copy(this.moonMesh.position);
    this.moonHalo.scale.set(34, 34, 1);
    this.scene.add(this.moonHalo);
  }

  private applyDayNightCycle(): void {
    const dn = evaluateDayNightState(this.dayCycleSec);
    const phaseChanged = dn.phase !== this.currentTimePhase;
    this.currentTimePhase = dn.phase;
    this.currentTimeLabel = dn.label;

    this.skyBgColor.setRGB(dn.skyColor[0], dn.skyColor[1], dn.skyColor[2]);
    this.fogObj.color.setRGB(dn.fogColor[0], dn.fogColor[1], dn.fogColor[2]);
    this.fogObj.density = dn.fogDensity;

    this.sunLight.position.set(dn.sunPosition[0], dn.sunPosition[1], dn.sunPosition[2]);
    this.sunLight.color.setRGB(dn.sunColor[0], dn.sunColor[1], dn.sunColor[2]);
    this.sunLight.intensity = dn.sunIntensity;

    this.hemiLight.color.setRGB(dn.hemiSkyColor[0], dn.hemiSkyColor[1], dn.hemiSkyColor[2]);
    this.hemiLight.groundColor.setRGB(
      dn.hemiGroundColor[0],
      dn.hemiGroundColor[1],
      dn.hemiGroundColor[2],
    );
    this.hemiLight.intensity = dn.hemiIntensity;
    this.scene.environmentIntensity = dn.envIntensity;

    // Smoothly turn village street lamps, shop windows, tree bulbs & point lights on at dusk/night and off at day
    for (let i = 0; i < this.warmPointLights.length; i++) {
      const entry = this.warmPointLights[i];
      entry.light.intensity = entry.baseIntensity * dn.villageLightFactor;
    }
    this.buildingsHandle.setNightFactor(dn.villageLightFactor);
    this.props.setNightFactor(dn.villageLightFactor);
    this.chairlift.setNightFactor(dn.villageLightFactor);

    // Twinkling night sky stars & winter moon
    this.starPoints.visible = dn.starOpacity > 0.01;
    this.starMat.opacity = dn.starOpacity;
    if (this.starPoints.visible) {
      const colAttr = this.starPoints.geometry.attributes.color as THREE.BufferAttribute;
      const arr = colAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const twinkle = 0.62 + 0.38 * Math.sin(this.elapsed * 2.6 + i * 0.73);
        arr[i] = this.starBaseColors[i] * twinkle;
        arr[i + 1] = this.starBaseColors[i + 1] * twinkle;
        arr[i + 2] = this.starBaseColors[i + 2] * twinkle;
      }
      colAttr.needsUpdate = true;
    }

    this.moonMesh.visible = dn.moonOpacity > 0.02;
    this.moonHalo.visible = dn.moonOpacity > 0.02;
    (this.moonMesh.material as THREE.MeshBasicMaterial).opacity = dn.moonOpacity;
    (this.moonHalo.material as THREE.SpriteMaterial).opacity = 0.36 * dn.moonOpacity;

    if (phaseChanged) {
      this.pushHud(true);
    }
  }

  private buildTerrainAndWater(): THREE.MeshStandardMaterial {
    // 1. Snow-covered winter valley & tall alpine ski mountain terrain (320m x 300m expanse centered slightly west)
    const sizeX = 320;
    const sizeZ = 300;
    const segs = 136;
    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const colSnow = new THREE.Color(0xe6effc);
    const colShadowSnow = new THREE.Color(0xb8cde8);
    const colStreamBed = new THREE.Color(0x1f3d52);
    const tmpC = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i) - 16;
      const vz = pos.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      pos.setXYZ(i, vx, vy, vz);

      if (vy < -0.25) {
        tmpC.copy(colStreamBed);
      } else {
        const shade = THREE.MathUtils.clamp((vy + 0.2) * 0.055, 0, 1);
        tmpC.copy(colShadowSnow).lerp(colSnow, 0.52 + shade * 0.48);
      }
      colors[i * 3] = tmpC.r;
      colors[i * 3 + 1] = tmpC.g;
      colors[i * 3 + 2] = tmpC.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      bumpMap: this.textures.snowBump,
      bumpScale: 0.035,
      roughness: 0.9,
      metalness: 0.02,
    });
    const terrainMesh = new THREE.Mesh(geo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // 2. Smooth Organic Cobblestone Plaza & Walkways (zero sawtooth edges!)
    const cobbleMat = new THREE.MeshStandardMaterial({
      color: 0xd9d2cc,
      map: this.textures.cobbleMap,
      bumpMap: this.textures.cobbleBump,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const addCobbleDisc = (cx: number, cz: number, rx: number, rz: number, rotY = 0) => {
      const discGeo = new THREE.CircleGeometry(1, 36);
      discGeo.rotateX(-Math.PI / 2);
      const posAttr = discGeo.attributes.position;
      const uvAttr = discGeo.attributes.uv;
      for (let i = 0; i < posAttr.count; i++) {
        const lx = posAttr.getX(i) * rx;
        const lz = posAttr.getZ(i) * rz;
        const wx = cx + lx * Math.cos(rotY) - lz * Math.sin(rotY);
        const wz = cz + lx * Math.sin(rotY) + lz * Math.cos(rotY);
        posAttr.setXYZ(i, wx, Math.max(0.035, getTerrainHeight(wx, wz) + 0.035), wz);
        uvAttr.setXY(i, wx * 0.28, wz * 0.28);
      }
      discGeo.computeVertexNormals();
      const mesh = new THREE.Mesh(discGeo, cobbleMat);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };

    // Render exact cobblestone zones shared with isOnSnowSurface() so visual ground === walk zone!
    for (const z of COBBLE_ZONES) {
      addCobbleDisc(z.cx, z.cz, z.rx, z.rz, z.rotY);
    }

    // 3. Left 2x Wider Tall Alpine Ski Slope Ribbon with Crisp Groomed Carving Grooves!
    const sledSteps = 116;
    const sledHalfW = getSledTrackHalfWidth();
    const sledPositions: number[] = [];
    const sledIndices: number[] = [];
    const sledColors: number[] = [];
    const crossSamples = 17;

    for (let i = 0; i <= sledSteps; i++) {
      const z = -50 + (i / sledSteps) * 98;
      const cx = getSledTrackCenterX(z);
      for (let j = 0; j < crossSamples; j++) {
        const u = (j / (crossSamples - 1)) * 2 - 1; // -1..+1
        const x = cx + u * sledHalfW;
        const baseH = Math.max(0, getTerrainHeight(x, z));
        // Groomed alpine ski lanes with subtle twin carving tracks and banked snow edges
        const g1 = Math.exp(-Math.pow((u + 0.42) / 0.08, 2));
        const g2 = Math.exp(-Math.pow((u - 0.42) / 0.08, 2));
        const g3 = Math.exp(-Math.pow(u / 0.08, 2)) * 0.55;
        const bank = Math.pow(Math.abs(u), 3) * 0.34;
        const y = baseH + 0.06 + bank - (g1 + g2 + g3) * 0.04;
        sledPositions.push(x, y, z);

        // Distinct cool icy-blue shadowed grooves contrasting against moonlit snow
        const grooveTint = Math.min(1, g1 + g2 + g3);
        sledColors.push(
          THREE.MathUtils.lerp(0.92, 0.48, grooveTint),
          THREE.MathUtils.lerp(0.96, 0.66, grooveTint),
          THREE.MathUtils.lerp(1.0, 0.86, grooveTint),
        );
      }
    }

    for (let i = 0; i < sledSteps; i++) {
      for (let j = 0; j < crossSamples - 1; j++) {
        const a = i * crossSamples + j;
        const b = a + 1;
        const c = (i + 1) * crossSamples + j;
        const d = c + 1;
        sledIndices.push(a, c, b, b, c, d);
      }
    }

    const sledGeo = new THREE.BufferGeometry();
    sledGeo.setAttribute('position', new THREE.Float32BufferAttribute(sledPositions, 3));
    sledGeo.setAttribute('color', new THREE.Float32BufferAttribute(sledColors, 3));
    sledGeo.setIndex(sledIndices);
    sledGeo.computeVertexNormals();

    const sledMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35, // Packed glistening sled snow
      metalness: 0.08,
    });
    const sledMesh = new THREE.Mesh(sledGeo, sledMat);
    sledMesh.receiveShadow = true;
    this.scene.add(sledMesh);

    // 4. Meandering Midnight-Teal Icy Stream Water Ribbon
    const waterSteps = 104;
    const wPositions: number[] = [];
    const wUvs: number[] = [];
    const wIndices: number[] = [];
    for (let i = 0; i <= waterSteps; i++) {
      const t = i / waterSteps;
      const z = -48 + t * 96;
      const cx = getStreamCenterX(z);
      const hw = getStreamHalfWidth(z) + 0.5;
      const wy = -0.24 + (z < -24 ? Math.pow((-24 - z) / 38, 2) * 8.0 : 0);

      wPositions.push(cx - hw, wy, z, cx + hw, wy, z);
      wUvs.push(0, t * 20, 1, t * 20);
      if (i < waterSteps) {
        const row = i * 2;
        wIndices.push(row, row + 2, row + 1, row + 1, row + 2, row + 3);
      }
    }
    const waterGeo = new THREE.BufferGeometry();
    waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPositions, 3));
    waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wUvs, 2));
    waterGeo.setIndex(wIndices);
    waterGeo.computeVertexNormals();

    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x164961,
      emissive: 0x07202e,
      emissiveIntensity: 0.55,
      bumpMap: this.textures.snowBump,
      bumpScale: 0.04,
      roughness: 0.12,
      metalness: 0.45,
    });
    const waterMesh = new THREE.Mesh(waterGeo, streamMat);
    this.scene.add(waterMesh);

    return streamMat;
  }

  private createSnowParticles(): { points: THREE.Points; velocities: Float32Array } {
    const count = 2100;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 185 - 14;
      positions[i * 3 + 1] = Math.random() * 64;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 155;

      velocities[i * 3] = (Math.random() - 0.5) * 0.48;
      velocities[i * 3 + 1] = -(0.9 + Math.random() * 1.0); // Slow, cozy falling snow
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.48;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.26,
      map: this.textures.snowflakeSprite,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return { points, velocities };
  }

  private initBurstPool(): void {
    const geo = new THREE.SphereGeometry(0.085, 6, 6);
    for (let i = 0; i < 56; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfff5d6,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.burstPool.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.5 });
    }
  }

  private spawnBurst(x: number, y: number, z: number, count: number, colorHex: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.burstPool[this.burstCursor % this.burstPool.length];
      this.burstCursor++;
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(colorHex);
      mat.opacity = 1;
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.8);
      p.vx = Math.cos(ang) * spd;
      p.vy = speed * (0.6 + Math.random() * 0.9);
      p.vz = Math.sin(ang) * spd;
      p.maxLife = 0.42 + Math.random() * 0.32;
      p.life = p.maxLife;
    }
  }

  // Public Controls called from React HUD
  public startGame(): void {
    this.audio.unlock();
    this.phase = 'playing';
    this.heldKeys.clear();
    this.justPressed.clear();
    this.audio.startMusicBox();
    this.syncBodyDataset();
    this.pushHud(true);
  }

  public resumeGame(): void {
    if (this.phase === 'paused' || this.phase === 'gameover') {
      this.phase = 'playing';
      this.heldKeys.clear();
      this.justPressed.clear();
      this.audio.startMusicBox();
      this.syncBodyDataset();
      this.pushHud(true);
    }
  }

  public pauseGame(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.heldKeys.clear();
      this.justPressed.clear();
      this.spacePressQueue = 0;
      this.isDraggingLiftCam = false;
      this.audio.stopMusicBox();
      this.audio.stopSnowboardGlide();
      this.syncBodyDataset();
      this.pushHud(true);
    }
  }

  public returnToTitle(): void {
    this.dismountLift(true);
    this.phase = 'title';
    this.heldKeys.clear();
    this.justPressed.clear();
    this.spacePressQueue = 0;
    this.isDraggingLiftCam = false;
    this.audio.stopMusicBox();
    this.audio.stopSnowboardGlide();
    this.syncBodyDataset();
    this.pushHud(true);
  }

  public restartGame(): void {
    this.dismountLift(true);
    this.playerX = PLAYER_SPAWN.x;
    this.playerZ = PLAYER_SPAWN.z;
    this.playerYaw = PLAYER_SPAWN.yaw;
    this.playerY = getWalkableHeight(this.playerX, this.playerZ).y;
    this.playerVy = 0;
    this.isGrounded = true;
    this.collectedIds.clear();
    this.victoryShown = false;
    this.props.starMeshes.forEach((m) => {
      m.visible = true;
    });
    this.rabbit.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.rabbit.root.rotation.set(0, this.playerYaw, 0);
    this.phase = 'playing';
    this.heldKeys.clear();
    this.justPressed.clear();
    this.audio.unlock();
    this.audio.startMusicBox();
    this.syncBodyDataset();
    this.pushHud(true);
  }

  public toggleMute(): void {
    const next = !this.audio.isMuted();
    this.audio.setMuted(next);
    if (!next && this.phase === 'playing') {
      this.audio.unlock();
      this.audio.startMusicBox();
    }
    this.pushHud(true);
  }

  public setTimePreset(preset: 'day' | 'sunset' | 'night'): void {
    this.dayCycleSec = TIME_PRESET_SECONDS[preset];
    this.applyDayNightCycle();
    const labelMap = { day: '낮', sunset: '노을', night: '밤' };
    this.showToast(`시간대를 '${labelMap[preset]}'으로 전환했습니다`);
    this.pushHud(true);
  }

  public interactNearbyNpc(): void {
    if (this.phase !== 'playing' || this.isRidingLift) return;
    if (this.activeDialogueNpc) {
      this.advanceDialogue();
      return;
    }
    if (this.nearbyNpc) {
      this.activeDialogueNpc = this.nearbyNpc;
      this.dialogueLineIdx = 0;
      this.audio.playNpcChime();
      this.spawnBurst(this.nearbyNpc.x, 1.8, this.nearbyNpc.z, 12, 0xffe478, 2.5);
      this.pushHud(true);
    }
  }

  public advanceDialogue(): void {
    if (!this.activeDialogueNpc) return;
    if (this.dialogueLineIdx + 1 < this.activeDialogueNpc.dialogues.length) {
      this.dialogueLineIdx++;
      this.audio.playNpcChime();
    } else {
      this.activeDialogueNpc = null;
      this.dialogueLineIdx = 0;
    }
    this.pushHud(true);
  }

  public closeDialogue(): void {
    if (!this.activeDialogueNpc) return;
    this.activeDialogueNpc = null;
    this.dialogueLineIdx = 0;
    this.pushHud(true);
  }

  public toggleChairlift(allowQuickBoard = false): void {
    if (this.phase !== 'playing') return;
    this.closeDialogue();
    if (this.isRidingLift) {
      this.dismountLift(false);
    } else if (allowQuickBoard || isNearChairliftBoarding(this.playerX, this.playerZ)) {
      this.boardChairlift();
    }
  }

  private boardChairlift(): void {
    // Pick chair 0 and align lift phase so the chair starts right at the Finish Line uphill climb!
    const desiredStartPhase = 0.025;
    const currentRawPhase = (this.elapsed / CHAIRLIFT.loopDurationSec) % 1;
    this.liftTimeOffset = ((desiredStartPhase - currentRawPhase + 1) % 1) * CHAIRLIFT.loopDurationSec;

    this.activeChairIdx = 0;
    this.activeChairT = desiredStartPhase;
    this.isRidingLift = true;
    this.liftAutoClimb = true;
    this.isSnowboarding = false;
    this.isDoingAirTrick = false;
    this.airTrickAvailable = false;
    this.boardScale = 0;
    this.rabbit.snowboard.visible = false;
    this.velX = 0;
    this.velZ = 0;
    this.liftPanAngle = -0.18;
    this.liftPitchAngle = 0.42;
    this.liftCamDistance = 74;
    this.liftUserAdjustedCam = false;
    this.isDraggingLiftCam = false;
    this.renderer.domElement.style.cursor = 'grab';
    this.playerVy = 0;
    this.isGrounded = true;
    this.rabbit.shadowDisc.visible = false;
    this.audio.stopSnowboardGlide();

    this.audio.playLiftBell(true);
    this.showToast('2인 리프트 탑승! 마우스로 시점을 돌려 마을과 알프스 스키장을 감상해요');
    this.syncBodyDataset();
    this.pushHud(true);
  }

  private dismountLift(silent: boolean, forceSummit = false): void {
    if (!this.isRidingLift) return;
    const exitPoint = forceSummit
      ? CHAIRLIFT.summitDismountPoint
      : getLiftDismountPoint(this.activeChairT);
    const isSummit = exitPoint === CHAIRLIFT.summitDismountPoint;

    this.isRidingLift = false;
    this.liftAutoClimb = false;
    this.isDraggingLiftCam = false;
    this.renderer.domElement.style.cursor = 'default';
    this.activeChairIdx = null;
    this.liftAltitude = 0;

    this.playerX = exitPoint.x;
    this.playerZ = exitPoint.z;
    this.playerY = getWalkableHeight(this.playerX, this.playerZ).y;
    this.playerYaw = isSummit ? 0.15 : 0.7;
    this.velX = 0;
    this.velZ = 0;
    this.isSnowboarding = isOnSnowSurface(this.playerX, this.playerZ);
    this.boardScale = this.isSnowboarding ? 1 : 0;
    this.rabbit.snowboard.visible = this.isSnowboarding;
    this.rabbit.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.rabbit.root.rotation.set(0, this.playerYaw, 0);
    this.rabbit.shadowDisc.visible = true;

    if (!silent) {
      this.audio.playLiftBell(false);
      if (this.isSnowboarding) {
        this.audio.playSnowboardIntro();
      }
      this.spawnBurst(this.playerX, this.playerY + 0.3, this.playerZ, 12, 0xeef6ff, 2.5);
      this.showToast(
        isSummit
          ? '★ 출발선 정상에 도착했어요! 점프대를 넘어 스노보드로 내려가 보세요'
          : '리프트에서 내렸습니다',
      );
    }
    this.syncBodyDataset();
    this.pushHud(true);
  }

  private showToast(msg: string): void {
    this.lastToast = msg;
    this.toastTimer = 3.2;
    this.pushHud(true);
  }

  // Input listeners on window
  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'Space'
    ) {
      e.preventDefault();
    }

    if (!this.heldKeys.has(code)) {
      this.justPressed.add(code);
      if (code === 'Space' && this.phase === 'playing') {
        this.spacePressQueue = Math.min(2, this.spacePressQueue + 1);
      }
    }
    this.heldKeys.add(code);

    // Title start handshake via Enter or Space
    if (this.phase === 'title' && (code === 'Enter' || code === 'Space')) {
      this.startGame();
      this.justPressed.delete(code);
      this.spacePressQueue = 0;
      return;
    }

    if (code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (code === 'Escape' || code === 'KeyP') {
      if (this.activeDialogueNpc && code === 'Escape') {
        this.closeDialogue();
        return;
      }
      if (this.phase === 'playing') {
        this.pauseGame();
      } else if (this.phase === 'paused') {
        this.resumeGame();
      }
      return;
    }

    if (this.phase === 'playing') {
      if (code === 'KeyE' || code === 'KeyF') {
        if (this.activeDialogueNpc || this.nearbyNpc) {
          this.interactNearbyNpc();
        } else {
          this.toggleChairlift(false);
        }
      } else if (code === 'KeyL') {
        this.toggleChairlift(true);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.phase !== 'playing' || !this.isRidingLift) return;
    if (e.button !== 0 && e.button !== 2) return;
    this.isDraggingLiftCam = true;
    this.liftUserAdjustedCam = true;
    this.dragLastX = e.clientX;
    this.dragLastY = e.clientY;
    this.renderer.domElement.style.cursor = 'grabbing';
    try {
      this.renderer.domElement.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without active pointerId
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.isDraggingLiftCam || !this.isRidingLift) return;
    const dx = e.clientX - this.dragLastX;
    const dy = e.clientY - this.dragLastY;
    this.dragLastX = e.clientX;
    this.dragLastY = e.clientY;
    this.liftPanAngle -= dx * 0.0068;
    this.liftPitchAngle = THREE.MathUtils.clamp(this.liftPitchAngle + dy * 0.0046, 0.14, 1.05);
    this.syncBodyDataset();
  };

  private handlePointerUp = (): void => {
    if (!this.isDraggingLiftCam) return;
    this.isDraggingLiftCam = false;
    this.renderer.domElement.style.cursor = this.isRidingLift ? 'grab' : 'default';
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.phase !== 'playing' || !this.isRidingLift) return;
    e.preventDefault();
    this.liftUserAdjustedCam = true;
    this.liftCamDistance = THREE.MathUtils.clamp(this.liftCamDistance + e.deltaY * 0.035, 32, 96);
  };

  private handleBlur = (): void => {
    this.heldKeys.clear();
    this.justPressed.clear();
    this.spacePressQueue = 0;
    this.isDraggingLiftCam = false;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.heldKeys.clear();
      this.justPressed.clear();
      this.spacePressQueue = 0;
      this.isDraggingLiftCam = false;
      this.audio.stopSnowboardGlide();
    }
  };

  private handleResize(): void {
    if (this.destroyed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private getMovementMode(): MovementMode {
    if (this.isRidingLift) return 'lift';
    return this.isSnowboarding ? 'snowboard' : 'walk';
  }

  private syncBodyDataset(): void {
    document.body.dataset.state = this.phase;
    document.body.dataset.riding = this.isRidingLift ? 'true' : 'false';
    document.body.dataset.mode = this.getMovementMode();
    document.body.dataset.timePhase = this.currentTimePhase;
    document.body.dataset.dialogue = this.activeDialogueNpc ? 'open' : 'closed';
    document.body.dataset.nearNpc = this.nearbyNpc ? this.nearbyNpc.id : '';
    document.body.dataset.trick = this.isDoingAirTrick ? 'true' : 'false';
    document.body.dataset.tricks = String(this.trickCount);
    document.body.dataset.liftPan = String(Math.round((this.liftPanAngle * 180) / Math.PI));
    document.body.dataset.stars = String(this.collectedIds.size);
    document.body.dataset.playerX = this.playerX.toFixed(1);
    document.body.dataset.playerZ = this.playerZ.toFixed(1);
  }

  private pushHud(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastHudPush < 120) return;
    this.lastHudPush = now;
    this.syncBodyDataset();
    this.onHudChange({
      phase: this.phase,
      zone: getVillageZoneName(this.playerX, this.playerZ, this.isRidingLift),
      movementMode: this.getMovementMode(),
      timePhase: this.currentTimePhase,
      timeLabel: this.currentTimeLabel,
      collectedCount: this.collectedIds.size,
      totalCollectibles: COLLECTIBLES.length,
      nearLift: isNearChairliftBoarding(this.playerX, this.playerZ),
      isRidingLift: this.isRidingLift,
      liftAltitude: Math.round(this.liftAltitude),
      nearNpcPrompt:
        !this.activeDialogueNpc && this.nearbyNpc ? this.nearbyNpc.promptLabel : null,
      activeDialogue: this.activeDialogueNpc
        ? {
            npcId: this.activeDialogueNpc.id,
            speaker: this.activeDialogueNpc.speaker,
            text: this.activeDialogueNpc.dialogues[this.dialogueLineIdx],
            lineIndex: this.dialogueLineIdx,
            totalLines: this.activeDialogueNpc.dialogues.length,
          }
        : null,
      trickCount: this.trickCount,
      muted: this.audio.isMuted(),
      lastToast: this.lastToast,
      playerX: this.playerX,
      playerZ: this.playerZ,
    });
  }

  private startLoop(): void {
    const afterDraw = (cb: () => void) => {
      if (this.destroyed) return;
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (this.destroyed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            this.frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            this.frameId = window.setTimeout(cb, 80);
          }
        };
        this.frameId = window.setTimeout(poll, 5);
      } else {
        this.frameId = window.setTimeout(cb, 90);
      }
    };

    const tick = () => {
      if (this.destroyed) return;
      const now = performance.now();
      const rawDt = (now - this.lastFrameMs) / 1000;
      this.lastFrameMs = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      if (this.phase !== 'paused') {
        this.stepSimulation(dt);
      }
      this.justPressed.clear();

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private stepSimulation(dt: number): void {
    this.elapsed += dt;
    this.dayCycleSec = (this.dayCycleSec + dt) % CYCLE_DURATION_SEC;
    this.applyDayNightCycle();

    const liftTime = this.elapsed + this.liftTimeOffset;

    // Detect nearby interactive landmarks (Red Postbox & Toy Shop door) for floating speech bubbles
    const prevNpcId = this.nearbyNpc?.id ?? null;
    this.nearbyNpc =
      this.phase === 'playing' && !this.isRidingLift
        ? getNearbyInteractable(this.playerX, this.playerZ)
        : null;
    if (this.activeDialogueNpc && this.nearbyNpc?.id !== this.activeDialogueNpc.id) {
      this.activeDialogueNpc = null;
      this.dialogueLineIdx = 0;
      this.pushHud(true);
    } else if ((this.nearbyNpc?.id ?? null) !== prevNpcId) {
      this.pushHud(true);
    }

    // 1. Update animated environment props & 2-person chairlift
    this.props.update(this.elapsed, this.nearbyNpc?.id ?? null);
    this.chairlift.update(liftTime, dt, this.activeChairIdx);

    // Subtle shimmer on stream surface
    this.streamMat.emissiveIntensity = 0.4 + Math.sin(this.elapsed * 2.2) * 0.08;
    if (this.streamMat.bumpMap) {
      this.streamMat.bumpMap.offset.y = -(this.elapsed * 0.14) % 1;
    }

    // 2. Update gentle falling snow particles (zero GC, keeping flakes out of camera lens)
    const snowPos = this.snowPoints.geometry.attributes.position as THREE.BufferAttribute;
    const arr = snowPos.array as Float32Array;
    const camX = this.camera.position.x;
    const camY = this.camera.position.y;
    const camZ = this.camera.position.z;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += (this.snowVelocities[i] + Math.sin(this.elapsed * 0.65 + i) * 0.25) * dt;
      arr[i + 1] += this.snowVelocities[i + 1] * dt;
      arr[i + 2] += (this.snowVelocities[i + 2] + Math.cos(this.elapsed * 0.55 + i) * 0.2) * dt;
      const dcx = arr[i] - camX;
      const dcy = arr[i + 1] - camY;
      const dcz = arr[i + 2] - camZ;
      if (arr[i + 1] < 0 || dcx * dcx + dcy * dcy + dcz * dcz < 36) {
        arr[i + 1] = 60 + Math.random() * 4;
        arr[i] = (Math.random() - 0.5) * 185 - 14;
        arr[i + 2] = (Math.random() - 0.5) * 155;
      }
    }
    snowPos.needsUpdate = true;

    // 3. Update pooled burst particles
    for (let i = 0; i < this.burstPool.length; i++) {
      const p = this.burstPool[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 7.5 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const ratio = p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = ratio;
      p.mesh.scale.setScalar(0.5 + ratio * 0.7);
    }

    // Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.lastToast = null;
        this.pushHud(true);
      }
    }

    // 4. Update Rabbit & Camera based on phase
    if (this.phase === 'title') {
      this.updateTitleCamera(dt);
      this.animateRabbitIdle(dt);
      return;
    }

    if (this.phase === 'playing' || this.phase === 'gameover') {
      if (this.isRidingLift && this.activeChairIdx !== null) {
        this.updateChairliftRide(dt, liftTime);
      } else {
        this.updateRabbitWalking(dt);
      }

      // Check festive star ornament pickups
      if (this.phase === 'playing') {
        const picked = checkCollectiblePickup(
          this.playerX,
          this.playerY,
          this.playerZ,
          this.isRidingLift,
          this.collectedIds,
        );
        if (picked) {
          this.collectedIds.add(picked.id);
          const mesh = this.props.starMeshes.get(picked.id);
          if (mesh) mesh.visible = false;
          const allDone = this.collectedIds.size >= COLLECTIBLES.length;
          this.audio.playStarCollect(allDone);
          this.spawnBurst(picked.x, picked.y, picked.z, 18, 0xffe478, 3.6);
          if (allDone && !this.victoryShown) {
            this.victoryShown = true;
            this.phase = 'gameover';
            this.showToast('크리스마스 마을의 모든 별빛을 모았습니다!');
          } else {
            this.showToast(`★ ${picked.label} 발견! (${this.collectedIds.size}/${COLLECTIBLES.length})`);
          }
          this.pushHud(true);
        }
      }

      this.updateGameplayCamera(dt);
      this.pushHud(false);
    }
  }

  private updateRabbitWalking(dt: number): void {
    // 1. Automatic Surface Detection: Snow -> Snowboard, Ground/Bridge -> Walk!
    const shouldBoard = isOnSnowSurface(this.playerX, this.playerZ);
    if (shouldBoard !== this.isSnowboarding) {
      this.isSnowboarding = shouldBoard;
      this.audio.playModeSwitch(shouldBoard);
      this.spawnBurst(
        this.playerX,
        this.playerY + 0.15,
        this.playerZ,
        shouldBoard ? 9 : 5,
        shouldBoard ? 0xffffff : 0xffe49e,
        2.0,
      );
      this.pushHud(true);
    }

    let inputX = 0;
    let inputZ = 0;
    if (this.phase === 'playing') {
      if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inputZ -= 1;
      if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inputZ += 1;
      if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inputX -= 1;
      if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inputX += 1;
    }

    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 0.01) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    let movedDist = 0;
    let steerDiff = 0;

    let speedNow = 0;

    if (this.isSnowboarding) {
      // Smooth snowboard carving momentum + exhilarating alpine downhill gravity glide on the tall 2x wide mountain!
      const maxBoardSpeed = 16.0;
      const targetVx = inputX * maxBoardSpeed;
      let targetVz = inputZ * maxBoardSpeed;

      // Natural alpine downhill slide acceleration on the steep ~24m ski slope
      const hHere = getTerrainHeight(this.playerX, this.playerZ);
      const hSouth = getTerrainHeight(this.playerX, this.playerZ + 1.0);
      const slopeDrop = Math.max(0, hHere - hSouth);
      if (slopeDrop > 0.025) {
        targetVz += slopeDrop * 15.0;
      }
      targetVz = THREE.MathUtils.clamp(targetVz, -maxBoardSpeed, 19.0);

      const accel = inputLen > 0.01 ? 6.5 : 3.2; // Smooth glide inertia on snow
      const k = 1 - Math.exp(-accel * dt);
      this.velX += (targetVx - this.velX) * k;
      this.velZ += (targetVz - this.velZ) * k;

      const nextX = this.playerX + this.velX * dt;
      const nextZ = this.playerZ + this.velZ * dt;
      const resolved = resolvePlayerMovement(this.playerX, this.playerZ, nextX, nextZ);
      movedDist = Math.hypot(resolved.x - this.playerX, resolved.z - this.playerZ);
      if (resolved.hitBoundary) {
        this.velX *= 0.45;
        this.velZ *= 0.45;
      }
      this.playerX = resolved.x;
      this.playerZ = resolved.z;

      speedNow = Math.hypot(this.velX, this.velZ);
      if (speedNow > 0.35) {
        const targetYaw = Math.atan2(this.velX, this.velZ);
        let diff = targetYaw - this.playerYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        steerDiff = diff;
        this.playerYaw += diff * (1 - Math.exp(-10 * dt));

        // Continuous snow powder trail while gliding
        this.stepDistAccum += movedDist;
        if (this.isGrounded && this.stepDistAccum >= 0.72) {
          this.stepDistAccum = 0;
          this.spawnBurst(
            this.playerX - Math.sin(this.playerYaw) * 0.48,
            resolved.y + 0.1,
            this.playerZ - Math.cos(this.playerYaw) * 0.48,
            3,
            0xf2f8ff,
            1.45,
          );
        }
      }
    } else {
      // Crisp responsive walking on spacious cobblestone paths & wooden bridges
      this.velX = 0;
      this.velZ = 0;
      const walkSpeed = 8.4;

      if (inputLen > 0.01) {
        const nextX = this.playerX + inputX * walkSpeed * dt;
        const nextZ = this.playerZ + inputZ * walkSpeed * dt;
        const resolved = resolvePlayerMovement(this.playerX, this.playerZ, nextX, nextZ);
        movedDist = Math.hypot(resolved.x - this.playerX, resolved.z - this.playerZ);
        this.playerX = resolved.x;
        this.playerZ = resolved.z;

        const targetYaw = Math.atan2(inputX, inputZ);
        let diff = targetYaw - this.playerYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.playerYaw += diff * (1 - Math.exp(-12 * dt));

        this.walkCycle += movedDist * 2.55;
        this.stepDistAccum += movedDist;
        if (this.isGrounded && this.stepDistAccum >= 1.65) {
          this.stepDistAccum = 0;
          this.audio.playFootstep(resolved.onBridge);
          this.spawnBurst(this.playerX, resolved.y + 0.08, this.playerZ, 3, 0xe8f3ff, 1.1);
        }
      }
    }

    // Ramp launch impulse when gliding briskly over any of the 3 snowy jump mounds on the ski track!
    if (this.rampLaunchCooldown > 0) {
      this.rampLaunchCooldown -= dt;
    }
    const speedHoriz = this.isSnowboarding ? Math.hypot(this.velX, this.velZ) : movedDist / Math.max(dt, 0.001);
    if (this.isGrounded && this.rampLaunchCooldown <= 0 && speedHoriz > 4.2) {
      const ramp = getJumpRampCrestAt(this.playerX, this.playerZ);
      if (ramp) {
        this.playerVy = 9.4;
        this.isGrounded = false;
        this.airTrickAvailable = true;
        this.isDoingAirTrick = false;
        this.airTrickProgress = 0;
        this.rampLaunchCooldown = 0.85;
        this.squashX = 0.82;
        this.squashY = 1.24;
        this.audio.playHop();
        this.spawnBurst(this.playerX, this.playerY + 0.15, this.playerZ, 12, 0xf2f8ff, 2.6);
      }
    }

    // Spacebar #1: Jump / Snowboard Ollie (Space) — Spacebar #2 in mid-air: 360° Spin Trick!
    if (this.phase === 'playing' && this.spacePressQueue > 0) {
      while (this.spacePressQueue > 0) {
        this.spacePressQueue--;
        if (this.isGrounded) {
          this.playerVy = this.isSnowboarding ? 7.8 : 7.0;
          this.isGrounded = false;
          this.airTrickAvailable = true;
          this.isDoingAirTrick = false;
          this.airTrickProgress = 0;
          this.squashX = 0.84;
          this.squashY = 1.22;
          this.audio.playHop();
          this.spawnBurst(
            this.playerX,
            this.playerY + 0.1,
            this.playerZ,
            this.isSnowboarding ? 10 : 6,
            0xf0f8ff,
            2.1,
          );
        } else if (this.airTrickAvailable && !this.isDoingAirTrick) {
          // Double-Space mid-air 360° spin trick!
          this.isDoingAirTrick = true;
          this.airTrickAvailable = false;
          this.airTrickProgress = 0;
          this.trickCount++;
          // Subtle hang-time lift so the full 360° spin completes crisply before landing
          this.playerVy = Math.max(this.playerVy, 4.8);
          this.squashX = 0.88;
          this.squashY = 1.16;
          this.audio.playAirTrick();
          this.spawnBurst(this.playerX, this.playerY + 0.5, this.playerZ, 16, 0xffe478, 3.2);
          this.showToast('✨ 360° 공중 회전 트릭 성공!');
          this.pushHud(true);
        }
      }
    }

    // Advance 360° mid-air spin progress
    if (this.isDoingAirTrick) {
      this.airTrickProgress = Math.min(1, this.airTrickProgress + dt / 0.48);
      if (Math.random() < 0.45) {
        this.spawnBurst(this.playerX, this.playerY + 0.35, this.playerZ, 2, 0xfff0a8, 1.4);
      }
    }

    // Vertical gravity & ground landing
    const groundInfo = getWalkableHeight(this.playerX, this.playerZ);
    if (!this.isGrounded) {
      this.playerVy -= 18.5 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= groundInfo.y) {
        this.playerY = groundInfo.y;
        this.playerVy = 0;
        this.isGrounded = true;
        this.airTrickAvailable = false;
        this.isDoingAirTrick = false;
        this.airTrickProgress = 0;
        this.squashX = 1.22;
        this.squashY = 0.78;
        if (!this.isSnowboarding) {
          this.audio.playFootstep(groundInfo.onBridge);
        }
        this.spawnBurst(this.playerX, this.playerY + 0.08, this.playerZ, 7, 0xeef6ff, 1.8);
      }
    } else {
      this.playerY += (groundInfo.y - this.playerY) * (1 - Math.exp(-18 * dt));
    }

    // Drive uploaded looping snowboard glide MP3 smoothly based on ground contact & carve speed!
    this.audio.updateSnowboardGlide(
      this.phase === 'playing' && this.isSnowboarding && this.isGrounded && speedNow > 0.65,
      Math.min(1, speedNow / 16.5),
      dt,
    );

    // Smoothly animate snowboard appearance & edge-carve lean
    const boardDamp = 1 - Math.exp(-14 * dt);
    const targetBoardScale = this.isSnowboarding ? 1 : 0;
    this.boardScale += (targetBoardScale - this.boardScale) * boardDamp;
    this.rabbit.snowboard.visible = this.boardScale > 0.03;
    this.rabbit.snowboard.scale.setScalar(Math.max(0.01, this.boardScale));

    const targetLean = this.isSnowboarding
      ? THREE.MathUtils.clamp(-steerDiff * 0.45, -0.34, 0.34)
      : 0;
    this.carveLean += (targetLean - this.carveLean) * (1 - Math.exp(-10 * dt));

    // Exponentially damp squash-and-stretch back to 1
    const sqDamp = 1 - Math.exp(-11 * dt);
    this.squashX += (1 - this.squashX) * sqDamp;
    this.squashY += (1 - this.squashY) * sqDamp;

    // Apply transform & pose (sideways carving stance on snowboard vs bouncy bunny hop + 360° air trick!)
    const hopArc =
      !this.isSnowboarding && this.isGrounded && movedDist > 0.001
        ? Math.abs(Math.sin(this.walkCycle)) * 0.28
        : 0;
    const boardOffsetY = this.boardScale * 0.09;

    const trickEase = this.isDoingAirTrick
      ? 1 - Math.pow(1 - this.airTrickProgress, 2)
      : 0;
    const trickSpinY = this.isDoingAirTrick ? trickEase * Math.PI * 2 : 0;
    const trickRollZ = this.isDoingAirTrick ? Math.sin(this.airTrickProgress * Math.PI) * 0.42 : 0;

    this.rabbit.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.rabbit.root.rotation.set(0, this.playerYaw + trickSpinY, this.carveLean + trickRollZ);

    this.rabbit.bodyGroup.position.y = hopArc + boardOffsetY;
    this.rabbit.bodyGroup.scale.set(this.squashX, this.squashY, this.squashX);

    const targetBodyTwist = this.isSnowboarding ? 0.92 : 0;
    this.rabbit.bodyGroup.rotation.y +=
      (targetBodyTwist - this.rabbit.bodyGroup.rotation.y) * (1 - Math.exp(-12 * dt));
    this.rabbit.bodyGroup.rotation.x = this.isSnowboarding
      ? !this.isGrounded
        ? -0.22
        : 0.08
      : movedDist > 0.001
        ? 0.12
        : 0;

    // Articulated paws, ears, scarf bounce
    if (this.isSnowboarding) {
      this.rabbit.footLeft.position.z = 0.14;
      this.rabbit.footRight.position.z = -0.1;
      this.rabbit.pawLeft.rotation.x = -0.35;
      this.rabbit.pawRight.rotation.x = 0.55;
      this.rabbit.headGroup.rotation.y = -0.78; // Look forward down the slope!
      this.rabbit.earLeft.rotation.x = -0.24 - Math.sin(this.elapsed * 5.5) * 0.05;
      this.rabbit.earRight.rotation.x = -0.24 - Math.cos(this.elapsed * 5.2) * 0.05;
      this.rabbit.scarfTail.rotation.x = -0.68;
    } else {
      const swing = movedDist > 0.001 ? Math.sin(this.walkCycle) : 0;
      this.rabbit.footLeft.position.z = 0.06 + swing * 0.14;
      this.rabbit.footRight.position.z = 0.06 - swing * 0.14;
      this.rabbit.pawLeft.rotation.x = 0.35 - swing * 0.35;
      this.rabbit.pawRight.rotation.x = 0.35 + swing * 0.35;
      this.rabbit.headGroup.rotation.y = 0;

      const earBob = movedDist > 0.001 ? Math.abs(swing) * 0.2 : Math.sin(this.elapsed * 2.1) * 0.05;
      this.rabbit.earLeft.rotation.x = -0.06 - earBob;
      this.rabbit.earRight.rotation.x = -0.06 - earBob * 0.9;
      this.rabbit.scarfTail.rotation.x = -0.25 - (movedDist > 0.001 ? 0.35 : 0);
    }

    // Contact shadow stays flush on ground beneath rabbit
    const airHeight = Math.max(0, this.playerY - groundInfo.y) + hopArc;
    this.rabbit.shadowDisc.position.y = Math.max(0.02, groundInfo.y - this.playerY + 0.025);
    const shScale = Math.max(0.45, (this.isSnowboarding ? 1.25 : 1.0) - airHeight * 0.25);
    this.rabbit.shadowDisc.scale.setScalar(shScale);
  }

  private animateRabbitIdle(dt: number): void {
    const breath = Math.sin(this.elapsed * 2.2) * 0.025;
    this.rabbit.bodyGroup.scale.set(1 + breath, 1 - breath * 0.5, 1 + breath);
    this.rabbit.earLeft.rotation.x = -0.06 + Math.sin(this.elapsed * 1.8) * 0.06;
    this.rabbit.earRight.rotation.x = -0.06 + Math.cos(this.elapsed * 1.5) * 0.06;
    this.rabbit.headGroup.rotation.y = Math.sin(this.elapsed * 0.7) * 0.18;
    void dt;
  }

  private updateChairliftRide(dt: number, liftTime: number): void {
    const chair = this.chairlift.chairs[this.activeChairIdx!];
    chair.seatAnchor.updateWorldMatrix(true, false);
    chair.seatAnchor.getWorldPosition(this._seatWorldPos);
    chair.seatAnchor.getWorldQuaternion(this._seatWorldQuat);

    // Track rabbit world position for altitude & aerial star collection
    this.playerX = this._seatWorldPos.x;
    this.playerY = this._seatWorldPos.y;
    this.playerZ = this._seatWorldPos.z;

    const basePhase = (liftTime / CHAIRLIFT.loopDurationSec) % 1;
    const chairT = (basePhase + chair.phaseOffset) % 1;
    this.activeChairT = chairT;
    const pose = evaluateChairliftPose(chairT);
    this.liftAltitude = pose.altitude;

    // Position rabbit seated nicely on the left seat of the 2-person chair
    this.rabbit.root.position.copy(this._seatWorldPos);
    this.rabbit.root.quaternion.copy(this._seatWorldQuat);
    this.rabbit.bodyGroup.position.y = -0.08;
    this.rabbit.bodyGroup.scale.set(1, 1, 1);
    this.rabbit.bodyGroup.rotation.set(0, 0, 0);

    // Happy seated leg dangling & admiring head look-around
    this.rabbit.footLeft.position.z = 0.24 + Math.sin(this.elapsed * 3.0) * 0.06;
    this.rabbit.footRight.position.z = 0.24 - Math.sin(this.elapsed * 3.0) * 0.06;
    this.rabbit.earLeft.rotation.x = -0.14 + Math.sin(this.elapsed * 2.4) * 0.06;
    this.rabbit.earRight.rotation.x = -0.14 + Math.cos(this.elapsed * 2.1) * 0.06;
    this.rabbit.headGroup.rotation.y = Math.sin(this.elapsed * 0.85) * 0.35;

    // Allow player to gently pan panoramic camera left/right with A/D or Left/Right as well as mouse drag
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) {
      this.liftPanAngle -= 1.2 * dt;
      this.liftUserAdjustedCam = true;
    }
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) {
      this.liftPanAngle += 1.2 * dt;
      this.liftUserAdjustedCam = true;
    }

    // Automatically dismount right at the Start Line summit once the uphill lift ride arrives!
    if (this.liftAutoClimb && chairT >= 0.455 && chairT <= 0.52) {
      this.dismountLift(false, true);
    }
  }

  private updateTitleCamera(dt: number): void {
    // Wide festive live-world camera framing the village + tall 2x wide alpine ski mountain & chairlift
    const t = this.elapsed * 0.09;
    this._camDesiredPos.set(
      Math.sin(t) * 16 - 9.0,
      28.5 + Math.sin(t * 1.3) * 1.6,
      64.0 + Math.cos(t * 0.8) * 3.5,
    );
    this._camDesiredLook.set(-10.0, 6.2, -3.0);

    const k = 1 - Math.exp(-3.2 * dt);
    this.camera.position.lerp(this._camDesiredPos, k);
    this._camCurrentLook.lerp(this._camDesiredLook, k);
    this.camera.lookAt(this._camCurrentLook);
  }

  private updateGameplayCamera(dt: number): void {
    // Compute smooth directional velocity lead from actual player motion (works for both walking & snowboarding!)
    const instVx = (this.playerX - this.prevCamPlayerX) / Math.max(dt, 0.001);
    const instVz = (this.playerZ - this.prevCamPlayerZ) / Math.max(dt, 0.001);
    this.prevCamPlayerX = this.playerX;
    this.prevCamPlayerZ = this.playerZ;

    const leadDamp = 1 - Math.exp(-2.8 * dt);
    this.camLeadX += (THREE.MathUtils.clamp(instVx, -15, 15) - this.camLeadX) * leadDamp;
    this.camLeadZ += (THREE.MathUtils.clamp(instVz, -15, 15) - this.camLeadZ) * leadDamp;

    // Gentle automatic camera swivel following lateral movement while keeping WASD intuitive
    const targetAutoYaw = THREE.MathUtils.clamp(this.camLeadX * 0.022, -0.26, 0.26);
    this.camAutoYaw += (targetAutoYaw - this.camAutoYaw) * (1 - Math.exp(-2.4 * dt));

    const dampPos = 1 - Math.exp(this.isRidingLift ? -6.5 * dt : -4.2 * dt);
    const dampLook = 1 - Math.exp(this.isRidingLift ? -7.5 * dt : -5.6 * dt);
    let targetFov = 48;

    if (this.isRidingLift) {
      // Interactive 360° Mouse-Draggable Panoramic Orbit Camera on the 2-Person Chairlift!
      const autoDrift = this.liftUserAdjustedCam ? 0 : Math.sin(this.elapsed * 0.12) * 0.22;
      const orbitYaw = this.liftPanAngle + autoDrift;
      const pitch = this.liftPitchAngle;
      const dist = this.liftCamDistance;

      // Panoramic pivot balances the entire spacious village & tall alpine ski mountain
      const pivotX = -11.0;
      const pivotY = Math.max(5.5, this.playerY * 0.34);
      const pivotZ = -4.0;

      const horizR = Math.cos(pitch) * dist;
      const vertY = Math.sin(pitch) * dist;

      this._camDesiredPos.set(
        pivotX + Math.sin(orbitYaw) * horizR,
        Math.max(this.playerY + 5.0, pivotY + vertY),
        pivotZ + Math.cos(orbitYaw) * horizR,
      );
      this._camDesiredLook.set(pivotX, pivotY + 1.0, pivotZ);
      targetFov = 55;
    } else if (this.activeDialogueNpc) {
      // Cozy close-up framing centering both the rabbit and the interactive landmark (Red Postbox / Toy Shop)
      const midX = (this.playerX + this.activeDialogueNpc.x) * 0.5;
      const midZ = (this.playerZ + this.activeDialogueNpc.z) * 0.5;
      this._camDesiredPos.set(midX + 1.4, this.playerY + 6.4, midZ + 12.2);
      this._camDesiredLook.set(midX, this.playerY + 2.1, midZ - 2.2);
      targetFov = 45;
    } else if (this.isSnowboarding) {
      // Smart Automatic Alpine Snowboard Camera: adapts cleanly to steep 24m mountain slope & downhill speed!
      const speedRatio = Math.min(1, Math.hypot(this.camLeadX, this.camLeadZ) / 14.5);
      const downhillBias = Math.max(0, this.camLeadZ / 13.0);
      const hNorth = getTerrainHeight(this.playerX, this.playerZ - 2.5);
      const hSouth = getTerrainHeight(this.playerX, this.playerZ + 2.5);
      const steepness = Math.max(0, (hNorth - hSouth) / 5.0); // Positive on alpine downhill slope

      const radius = 18.8 + speedRatio * 3.2 + steepness * 3.5;
      const camHeight = 9.4 + speedRatio * 2.2 + steepness * 3.8 + (this.isGrounded ? 0 : 1.1);

      this._camDesiredPos.set(
        this.playerX + Math.sin(this.camAutoYaw) * radius + 1.5,
        this.playerY + camHeight,
        this.playerZ + Math.cos(this.camAutoYaw) * radius,
      );
      this._camDesiredLook.set(
        this.playerX + this.camLeadX * 0.45,
        this.playerY + 2.0 - steepness * 1.4,
        this.playerZ + this.camLeadZ * 0.46 - 4.6 + downhillBias * 5.2,
      );
      targetFov = 49 + speedRatio * 5.0;
    } else {
      // Comfortable Automatic 3rd-Person Quarter-View Walking Camera with fluid directional swivel & sky horizon!
      const centerBiasX = THREE.MathUtils.clamp(-this.playerX * 0.06, -2.4, 2.4);
      const radius = 17.8 - Math.min(0, this.camLeadZ) * 0.16;
      const camHeight = 8.6;

      this._camDesiredPos.set(
        this.playerX + Math.sin(this.camAutoYaw) * radius + centerBiasX,
        this.playerY + camHeight,
        this.playerZ + Math.cos(this.camAutoYaw) * radius,
      );
      this._camDesiredLook.set(
        this.playerX + this.camLeadX * 0.38 + centerBiasX * 0.4,
        this.playerY + 2.5,
        this.playerZ + this.camLeadZ * 0.34 - 6.2,
      );
      targetFov = 48;
    }

    // Terrain clearance safety so camera never dips near steep snowy hills
    const camGround = Math.max(0, getTerrainHeight(this._camDesiredPos.x, this._camDesiredPos.z));
    if (this._camDesiredPos.y < camGround + 5.8) {
      this._camDesiredPos.y = camGround + 5.8;
    }

    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-4.5 * dt));
      this.camera.updateProjectionMatrix();
    }

    this.camera.position.lerp(this._camDesiredPos, dampPos);
    this._camCurrentLook.lerp(this._camDesiredLook, dampLook);
    this.camera.lookAt(this._camCurrentLook);
  }

  public dispose(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel);
    this.resizeObserver.disconnect();
    this.audio.dispose();
    this.textures.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
