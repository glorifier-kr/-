export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BridgeSpec {
  id: string;
  z: number;
  centerX: number;
  span: number; // X length across stream
  width: number; // Z width of walkway
  archHeight: number;
}

export interface BuildingSpec {
  id: string;
  name: string;
  style: 'townhall' | 'toyshop' | 'workshop' | 'postoffice' | 'woodcottage' | 'hillcottage';
  x: number;
  z: number;
  width: number;
  depth: number;
  rotationY: number;
}

export interface PineTreeSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  radius: number;
}

export interface CircleCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface BoxCollider {
  id: string;
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  rotationY?: number;
}

export interface CollectibleSpec {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  isAerial?: boolean;
}

export interface ChairliftPose {
  x: number;
  y: number;
  z: number;
  heading: number; // radians around Y
  goingUp: boolean;
  altitude: number;
}

export interface PlayerMoveResult {
  x: number;
  y: number;
  z: number;
  onBridge: boolean;
  hitBoundary: boolean;
  blockedUphill: boolean;
}

export interface CobbleEllipse {
  cx: number;
  cz: number;
  rx: number;
  rz: number;
  rotY: number;
}

export interface JumpRampSpec {
  id: string;
  x: number;
  z: number;
  halfWidth: number;
  halfLength: number;
  height: number;
}

export interface InteractableNpcSpec {
  id: 'postbox' | 'toy-shop';
  title: string;
  speaker: string;
  promptLabel: string;
  x: number;
  z: number;
  bubbleY: number;
  interactRadius: number;
  dialogues: string[];
}

export interface SkiSlopeVelocityResult {
  vx: number;
  vz: number;
  onOneWaySlope: boolean;
  resistedUphill: boolean;
}

// Grand Expanded Alpine Christmas Village & Resort (~210m x 180m playable valley):
// -X = Left (MASSIVE 2x bigger 42m-wide x 130m-long x ~46m-tall ONE-WAY downhill alpine ski resort + 2-person chairlift!)
//  0 = Center (Broad central plaza with Giant Christmas Tree, Snowman, Stream & 3 Wooden Bridges)
// +X = Right (Airy European village avenues with warmly lit shops & hillside cottages)
// -Z = North / Far Alpine Summit (Towering snow peaks, Start Line summit, Red-brick Town Hall)
// +Z = South / Foreground (Spacious bottom-right cobblestone promenade, Finish Line runout & rabbit spawn)

export const WORLD_BOUNDS = {
  minX: -148,
  maxX: 60,
  minZ: -120,
  maxZ: 54,
  playerRadius: 0.62,
};

export const TREE_CENTER: Vec2 = { x: -14.5, z: 2.5 };
export const SNOWMAN_POS: Vec2 = { x: -6.4, z: 10.6 };

// Rabbit starts on the spacious bottom-right cobblestone promenade
export const PLAYER_SPAWN = {
  x: 19.2,
  z: 26.2,
  yaw: -2.25, // Facing north-west toward foreground bridge & central Christmas tree
};

// Meandering mountain creek running down the middle-right of the spacious village
export function getStreamCenterX(z: number): number {
  return 4.5 + Math.sin(z * 0.068 + 0.5) * 4.2 + Math.cos(z * 0.032) * 1.2;
}

export function getStreamHalfWidth(z: number): number {
  return 2.55 + Math.sin(z * 0.1) * 0.35;
}

// MASSIVE 2x BIGGER alpine ski piste (42m total width, 130m downhill length, ~46m tall mountain!)
export function getSledTrackCenterX(z: number): number {
  return -86.0 + (z + 102) * 0.165 + Math.sin(z * 0.028) * 6.5;
}

export function getSledTrackHalfWidth(): number {
  return 21.0; // 42 meters wide!
}

// Three spacious arched wooden footbridges crossing the meandering stream
export const BRIDGES: BridgeSpec[] = [
  {
    id: 'bridge-south',
    z: 21.5,
    centerX: getStreamCenterX(21.5),
    span: 8.6,
    width: 4.2,
    archHeight: 0.9,
  },
  {
    id: 'bridge-mid',
    z: 0.5,
    centerX: getStreamCenterX(0.5),
    span: 8.2,
    width: 3.8,
    archHeight: 0.8,
  },
  {
    id: 'bridge-north',
    z: -20.5,
    centerX: getStreamCenterX(-20.5),
    span: 7.8,
    width: 3.6,
    archHeight: 0.74,
  },
];

// Generously spaced European Christmas shops & cottages (all sitting cleanly on level ground)
export const BUILDINGS: BuildingSpec[] = [
  {
    id: 'cottage-west',
    name: '서쪽 숲속 오두막',
    style: 'woodcottage',
    x: -23.5,
    z: -14.5,
    width: 5.4,
    depth: 4.8,
    rotationY: 0.32,
  },
  {
    id: 'town-hall',
    name: '붉은 벽돌 크리스마스 홀',
    style: 'townhall',
    x: -4.5,
    z: -30.5,
    width: 11.8,
    depth: 7.2,
    rotationY: 0.08,
  },
  {
    id: 'toy-shop',
    name: '줄무늬 차양 장난감 가게',
    style: 'toyshop',
    x: 20.5,
    z: 5.5,
    width: 6.8,
    depth: 6.0,
    rotationY: -0.22,
  },
  {
    id: 'clock-workshop',
    name: '황금 톱니 시계 공방',
    style: 'workshop',
    x: 34.5,
    z: -10.0,
    width: 7.2,
    depth: 6.2,
    rotationY: -0.35,
  },
  {
    id: 'post-office',
    name: '산타 우체국 상점',
    style: 'postoffice',
    x: 36.2,
    z: 18.0,
    width: 7.2,
    depth: 6.4,
    rotationY: -0.4,
  },
  {
    id: 'hill-cottage-1',
    name: '언덕 위 제과점 오두막',
    style: 'hillcottage',
    x: 17.5,
    z: -28.5,
    width: 5.8,
    depth: 5.2,
    rotationY: -0.18,
  },
  {
    id: 'hill-cottage-2',
    name: '눈꽃 지붕 오두막',
    style: 'hillcottage',
    x: 31.8,
    z: -31.5,
    width: 5.6,
    depth: 5.0,
    rotationY: -0.28,
  },
  {
    id: 'hill-cottage-3',
    name: '별빛 언덕 오두막',
    style: 'woodcottage',
    x: 22.8,
    z: -42.5,
    width: 5.0,
    depth: 4.6,
    rotationY: -0.12,
  },
];

// Helper: convert building-local (lx, lz) to Three.js world (x, z) with rotationY
function localToWorldXZ(b: BuildingSpec, lx: number, lz: number): Vec2 {
  const cos = Math.cos(b.rotationY);
  const sin = Math.sin(b.rotationY);
  return {
    x: b.x + lx * cos + lz * sin,
    z: b.z - lx * sin + lz * cos,
  };
}

const POST_OFFICE_SPEC = BUILDINGS.find((b) => b.id === 'post-office')!;
const TOY_SHOP_SPEC = BUILDINGS.find((b) => b.id === 'toy-shop')!;

// Exact world positions matching the 3D red pillar postbox and toy-shop green front door
export const POSTBOX_WORLD_POS = localToWorldXZ(
  POST_OFFICE_SPEC,
  -POST_OFFICE_SPEC.width * 0.5 - 0.75,
  POST_OFFICE_SPEC.depth * 0.5 + 0.55,
);
export const TOY_SHOP_DOOR_POS = localToWorldXZ(
  TOY_SHOP_SPEC,
  1.5,
  TOY_SHOP_SPEC.depth * 0.5 + 1.15,
);

// Interactive village landmarks with speech bubbles & Jesus's birth celebration NPC dialogues
export const INTERACTABLES: InteractableNpcSpec[] = [
  {
    id: 'postbox',
    title: '빨간 우체통',
    speaker: '빨간 우체통 · 성탄절 편지',
    promptLabel: '빨간 우체통 편지 읽기',
    x: POSTBOX_WORLD_POS.x,
    z: POSTBOX_WORLD_POS.z,
    bubbleY: 2.45,
    interactRadius: 4.8,
    dialogues: [
      '메리 크리스마스! 베들레헴의 빛나는 별 아래 아기 예수님의 탄생을 진심으로 축하합니다! ★',
      '지극히 높은 곳에서는 하나님께 영광이요, 땅에서는 기뻐하심을 입은 사람들 중에 평화가 가득하기를 기도해요.',
      '하얀 토끼야, 예수님께서 이 땅에 오신 기쁜 성탄절의 사랑과 축복을 마을 곳곳에 전해 주렴!',
    ],
  },
  {
    id: 'toy-shop',
    title: '장난감 가게',
    speaker: '장난감 가게 · 마법 장인 할아버지',
    promptLabel: '장난감 가게 문 두드리기',
    x: TOY_SHOP_DOOR_POS.x,
    z: TOY_SHOP_DOOR_POS.z,
    bubbleY: 3.15,
    interactRadius: 4.8,
    dialogues: [
      '어서 오렴, 귀여운 토끼야! 온 세상에 사랑과 구원을 선물하신 아기 예수님의 탄생을 함께 축하하자꾸나!',
      '예수님께서 태어나신 거룩한 성탄절을 기념해서 마을 아이들에게 나눌 따뜻한 나무 장난감을 밤새 정성껏 만들었단다.',
      '오늘 밤 내리는 하얀 눈처럼 맑고 포근한 예수님의 사랑이 네 마음에도 가득하길! 메리 크리스마스!',
    ],
  },
];

export function getNearbyInteractable(x: number, z: number): InteractableNpcSpec | null {
  let closest: InteractableNpcSpec | null = null;
  let minDist = Infinity;
  for (const npc of INTERACTABLES) {
    const d = Math.hypot(x - npc.x, z - npc.z);
    if (d <= npc.interactRadius && d < minDist) {
      minDist = d;
      closest = npc;
    }
  }
  return closest;
}

// Start Line (grand ~46m alpine summit) & Finish Line (valley base) spanning a 130m downhill run!
export const SKI_TRACK_GATES = {
  startLine: { x: getSledTrackCenterX(-102.0), z: -102.0 },
  finishLine: { x: getSledTrackCenterX(28.0), z: 28.0 },
};

// 3 grand sculpted snow jump ramps (눈 둔덕 점프대) spaced along the 130m x 42m alpine ski resort
export const JUMP_RAMPS: JumpRampSpec[] = [
  { id: 'ramp-upper', x: getSledTrackCenterX(-68.0), z: -68.0, halfWidth: 9.6, halfLength: 5.0, height: 2.65 },
  { id: 'ramp-mid', x: getSledTrackCenterX(-32.0), z: -32.0, halfWidth: 10.2, halfLength: 5.4, height: 2.85 },
  { id: 'ramp-lower', x: getSledTrackCenterX(4.0), z: 4.0, halfWidth: 9.6, halfLength: 4.8, height: 2.55 },
];

export function getJumpRampElevation(x: number, z: number): number {
  let maxBoost = 0;
  for (const r of JUMP_RAMPS) {
    const dx = Math.abs(x - r.x);
    const dz = z - r.z; // negative = uphill entry, positive = downhill lip
    if (dx <= r.halfWidth && Math.abs(dz) <= r.halfLength) {
      const wx = Math.cos((dx / r.halfWidth) * Math.PI * 0.5);
      // Smooth kicker ramp profile: gentle rise from north (-halfLength) peaking near south lip (+0.35*halfLength)
      const u = (dz + r.halfLength) / (r.halfLength * 2); // 0..1
      const profile =
        u < 0.72
          ? Math.sin((u / 0.72) * Math.PI * 0.5)
          : Math.cos(((u - 0.72) / 0.28) * Math.PI * 0.5);
      maxBoost = Math.max(maxBoost, wx * wx * profile * r.height);
    }
  }
  return maxBoost;
}

export function getJumpRampCrestAt(x: number, z: number): JumpRampSpec | null {
  for (const r of JUMP_RAMPS) {
    const dx = Math.abs(x - r.x);
    const dz = z - r.z;
    // Trigger launch impulse right across the ramp takeoff lip
    if (dx <= r.halfWidth * 0.88 && dz >= r.halfLength * 0.1 && dz <= r.halfLength * 0.68) {
      return r;
    }
  }
  return null;
}

// Exact check whether (x, z) is on the steep ONE-WAY downhill ski slope zone (no uphill climbing!)
export function isOnOneWaySkiSlope(x: number, z: number): boolean {
  if (z < SKI_TRACK_GATES.startLine.z - 6.0 || z > SKI_TRACK_GATES.finishLine.z - 2.5) {
    return false;
  }
  const cx = getSledTrackCenterX(z);
  const hw = getSledTrackHalfWidth() + 3.5;
  return Math.abs(x - cx) <= hw;
}

// Physical one-way downhill velocity solver for the steep alpine ski slope!
// Pressing uphill (inputZ < 0) acts strictly as heel-edge braking (slowing descent) and NEVER allows uphill travel (vz < 0)!
export function computeSkiSlopeVelocity(
  x: number,
  z: number,
  curVx: number,
  curVz: number,
  inputX: number,
  inputZ: number,
  dt: number,
): SkiSlopeVelocityResult {
  const onSlope = isOnOneWaySkiSlope(x, z);
  const hHere = getBaseTerrainHeight(x, z);
  const hSouth = getBaseTerrainHeight(x, z + 1.5);
  const grade = Math.max(0, (hHere - hSouth) / 1.5); // Positive when descending south (+Z)

  if (!onSlope) {
    const maxFlatSpeed = 14.5;
    const targetVx = inputX * maxFlatSpeed;
    const targetVz = inputZ * maxFlatSpeed + (grade > 0.04 ? grade * 12.0 : 0);
    const accel = Math.hypot(inputX, inputZ) > 0.01 ? 6.5 : 3.2;
    const k = 1 - Math.exp(-accel * dt);
    return {
      vx: curVx + (targetVx - curVx) * k,
      vz: curVz + (targetVz - curVz) * k,
      onOneWaySlope: false,
      resistedUphill: false,
    };
  }

  // On the steep one-way alpine ski piste:
  // - Gravity continuously accelerates downhill (+Z) proportional to mountain grade!
  // - Lateral carving (A/D) has crisp edge grip across the 42m-wide slope.
  // - Pressing S (inputZ > 0) tucks for high-speed downhill carving up to 24 m/s!
  // - Pressing W (inputZ < 0) engages snow-plow/heel-edge braking, slowing downhill speed to a controlled crawl
  //   but NEVER reversing uphill (vz is strictly >= 0)!
  const resisting = inputZ < -0.05;
  const carveSpeedX = 16.5;
  const targetVx = inputX * carveSpeedX;

  const naturalGravityCruise = Math.max(6.2, Math.min(18.5, 5.5 + grade * 34.0));
  let targetVz: number;
  if (inputZ > 0.05) {
    // Active downhill tuck boost
    targetVz = Math.min(24.5, naturalGravityCruise + inputZ * 7.5);
  } else if (resisting) {
    // Edge braking: slows descent gently, physically impossible to reverse uphill!
    targetVz = Math.max(1.4, naturalGravityCruise * 0.28);
  } else {
    targetVz = naturalGravityCruise;
  }

  const accelX = Math.abs(inputX) > 0.01 ? 7.2 : 3.8;
  const accelZ = resisting ? 6.5 : 3.4;
  const kx = 1 - Math.exp(-accelX * dt);
  const kz = 1 - Math.exp(-accelZ * dt);

  const nextVx = curVx + (targetVx - curVx) * kx;
  // Physical clamp: strictly downhill / non-negative Z velocity on the one-way ski slope!
  const nextVz = Math.max(0.6, curVz + (targetVz - curVz) * kz);

  return {
    vx: nextVx,
    vz: nextVz,
    onOneWaySlope: true,
    resistedUphill: resisting,
  };
}

// Single source of truth for all wooden split-rail fences (rendered in 3D AND collided against!)
export const FENCE_RUNS: Array<Array<[number, number]>> = (() => {
  const innerSled: Array<[number, number]> = [];
  for (let z = -98; z <= 22; z += 8.0) {
    innerSled.push([getSledTrackCenterX(z) + getSledTrackHalfWidth() + 1.0, z]);
  }
  const outerSledNorth: Array<[number, number]> = [];
  for (let z = -98; z <= 22; z += 8.0) {
    outerSledNorth.push([getSledTrackCenterX(z) - getSledTrackHalfWidth() - 1.0, z]);
  }
  const outerSledSouth: Array<[number, number]> = [];
  for (let z = 36; z <= 48; z += 4.0) {
    outerSledSouth.push([getSledTrackCenterX(z) - getSledTrackHalfWidth() - 1.0, z]);
  }
  const streamForeground: Array<[number, number]> = [
    [-1.5, 31.2],
    [1.2, 30.7],
    [3.6, 30.2],
  ];
  return [innerSled, outerSledNorth, outerSledSouth, streamForeground];
})();

// Single source of truth for street lamps & park benches (rendered AND collided against!)
export const LAMP_POSITIONS: Array<[number, number]> = [
  [-21.2, 6.2],
  [-7.8, 13.8],
  [-4.2, 4.5],
  [-19.5, -7.2],
  [-2.2, -9.8],
  [1.8, 22.8],
  [13.8, 22.4],
  [25.8, 28.5],
  [27.6, 17.5],
  [12.8, 8.8],
  [13.2, -2.5],
  [25.5, 2.2],
  [27.5, -9.5],
  [-11.8, -22.5],
  [4.2, -22.5],
  [14.8, -19.5],
];

export const BENCH_SPECS: Array<[number, number, number]> = [
  [-20.5, 9.2, 0.72],
  [-9.2, 13.4, -0.35],
  [-4.6, 1.8, -1.35],
  [22.4, 30.4, -0.55],
  [26.2, 14.2, -1.25],
  [-10.2, -21.8, 0.25],
];

// Terrain height function (broad winter valley + carved creek + MASSIVE ~46m tall alpine ski mountain!)
export function getBaseTerrainHeight(x: number, z: number): number {
  let h = 0;

  // Gently rising northern alpine foothills behind the village
  if (z < -26) {
    const t = Math.min(1, (-26 - z) / 58);
    h += t * t * 11.0;
  }

  // Grand ~46m tall alpine ski mountain spanning the ENTIRE 42m-wide x 130m-long ski piste!
  // Computed relative to the track's right edge so the 42m ski piste stays flat side-to-side (zero sideways roll)
  // while smoothly soaring from 0m at Finish Line (z=30) up to ~46m at Start Line Summit (z=-102)!
  const trackRightEdge = getSledTrackCenterX(z) + getSledTrackHalfWidth();
  const hillStartX = trackRightEdge + 11.5;
  if (x < hillStartX && z < 30) {
    const tx = Math.min(1, (hillStartX - x) / 10.5);
    const smoothX = tx * tx * (3 - 2 * tx);
    const tz = Math.min(1, (30 - z) / 136);
    const slopeCurve = Math.pow(tz, 1.18);
    h += smoothX * slopeCurve * 38.5;
  }

  // Towering snowy mountain ridge further west beyond the chairlift
  const farWestEdge = getSledTrackCenterX(z) - getSledTrackHalfWidth() - 12.0;
  if (x < farWestEdge) {
    const tx = Math.min(1, (farWestEdge - x) / 28);
    h += tx * tx * 16.0;
  }

  // Subtle snowy outer mounds on far-right rim
  if (x > 44) {
    const tx = Math.min(1, (x - 44) / 24);
    h += tx * tx * 5.8;
  }

  // Gentle organic snow undulation outside the flat village core
  const distCore = Math.hypot(x - 2, z - 3);
  if (distCore > 40 && x > trackRightEdge + 10) {
    const edgeFactor = Math.min(1, (distCore - 40) / 26);
    h += (Math.sin(x * 0.08) * Math.cos(z * 0.07) * 0.75 + 0.45) * edgeFactor;
  }

  // Carve the meandering stream channel
  const sx = getStreamCenterX(z);
  const halfW = getStreamHalfWidth(z);
  const distStream = Math.abs(x - sx);
  if (distStream < halfW + 1.8) {
    const bankT = Math.max(0, 1 - distStream / (halfW + 1.8));
    const smooth = bankT * bankT * (3 - 2 * bankT);
    h -= smooth * 1.05;
  }

  return h;
}

export function getTerrainHeight(x: number, z: number): number {
  return getBaseTerrainHeight(x, z) + getJumpRampElevation(x, z);
}

// 2-Person Scenic Chairlift climbing parallel to the LEFT edge of the 42m x 130m x ~46m tall alpine ski mountain!
const LIFT_LOWER_X = getSledTrackCenterX(34.0) - getSledTrackHalfWidth() - 6.5;
const LIFT_UPPER_X = getSledTrackCenterX(-108.0) - getSledTrackHalfWidth() - 6.5;
const LIFT_UPPER_GROUND_Y = Math.max(0, getBaseTerrainHeight(LIFT_UPPER_X, -108.0));

export const CHAIRLIFT = {
  lowerStation: { x: LIFT_LOWER_X, y: 0.2, z: 34.0 },
  upperStation: { x: LIFT_UPPER_X, y: LIFT_UPPER_GROUND_Y, z: -108.0 },
  boardingPoint: { x: SKI_TRACK_GATES.finishLine.x - 6.0, z: SKI_TRACK_GATES.finishLine.z + 2.5 },
  boardingRadius: 13.5,
  dismountPoint: { x: SKI_TRACK_GATES.finishLine.x, z: SKI_TRACK_GATES.finishLine.z + 2.5 },
  summitDismountPoint: { x: SKI_TRACK_GATES.startLine.x, z: SKI_TRACK_GATES.startLine.z + 2.5 },
  chairCount: 14,
  loopDurationSec: 52, // Exhilarating panoramic climb up the massive ~46m alpine ski mountain
  lateralOffset: 1.85,
  upperTowerHeight: 7.8,
};

export const CHAIRLIFT_PYLON_FRACTIONS = [0.18, 0.36, 0.54, 0.72, 0.88] as const;

export const CHAIRLIFT_PYLONS: Vec2[] = CHAIRLIFT_PYLON_FRACTIONS.map((frac) => ({
  x: CHAIRLIFT.lowerStation.x + (CHAIRLIFT.upperStation.x - CHAIRLIFT.lowerStation.x) * frac,
  z: CHAIRLIFT.lowerStation.z + (CHAIRLIFT.upperStation.z - CHAIRLIFT.lowerStation.z) * frac,
}));

// Single source of truth for spacious cobblestone plazas & lanes (100% matched with auto walk/snowboard!)
export const COBBLE_ZONES: CobbleEllipse[] = [
  { cx: TREE_CENTER.x + 1.8, cz: TREE_CENTER.z + 0.5, rx: 9.8, rz: 11.4, rotY: 0 }, // Spacious Christmas Tree Plaza
  { cx: 19.2, cz: 24.5, rx: 10.8, rz: 9.6, rotY: -0.18 }, // Bottom-right Rabbit Promenade
  { cx: 19.8, cz: 10.5, rx: 7.8, rz: 9.2, rotY: 0 }, // Toy Shop Avenue
  { cx: 18.2, cz: -7.5, rx: 7.4, rz: 10.2, rotY: 0.22 }, // Upper Shop Promenade
  { cx: -4.2, cz: -19.2, rx: 10.4, rz: 6.4, rotY: 0 }, // Grand Town Hall Square
  ...BRIDGES.flatMap((b) => [
    { cx: b.centerX - b.span * 0.54, cz: b.z, rx: 3.4, rz: b.width * 0.72, rotY: 0 },
    { cx: b.centerX + b.span * 0.54, cz: b.z, rx: 3.4, rz: b.width * 0.72, rotY: 0 },
  ]),
];

// Single source of truth for ALL snow-laden pine trees (rendered in 3D AND solidly collided against!)
export const PINE_TREES: PineTreeSpec[] = (() => {
  const list: PineTreeSpec[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Dense evergreen forest framing the entire expanded alpine resort & Christmas village
  for (let i = 0; i < 340; i++) {
    const ang = (i / 340) * Math.PI * 2 + (rand() - 0.5) * 0.06;
    const ring = i % 3;
    const radX = 112 + ring * 14.0 + rand() * 8;
    const radZ = 92 + ring * 13.0 + rand() * 8;
    const px = Math.cos(ang) * radX - 38.0;
    const pz = Math.sin(ang) * radZ - 26.0;

    // Keep south-east camera sightline open in the foreground
    if (pz > 40 && px > -22 && px < 48) continue;
    // Keep massive 42m-wide x 130m-long ski resort completely unobstructed
    if (
      Math.abs(px - getSledTrackCenterX(pz)) < getSledTrackHalfWidth() + 6.5 &&
      pz > -118 &&
      pz < 48
    ) {
      continue;
    }
    // Keep left 2-person chairlift cable corridor & stations unobstructed
    const liftT =
      (pz - CHAIRLIFT.lowerStation.z) / (CHAIRLIFT.upperStation.z - CHAIRLIFT.lowerStation.z);
    if (liftT >= -0.1 && liftT <= 1.1) {
      const liftX =
        CHAIRLIFT.lowerStation.x + (CHAIRLIFT.upperStation.x - CHAIRLIFT.lowerStation.x) * liftT;
      if (Math.abs(px - liftX) < 10.5) continue;
    }
    // Keep village core clear of outer perimeter trees
    if (px > -36 && px < 46 && pz > -48 && pz < 40) continue;

    const s = 1.15 + rand() * 0.85;
    const py = Math.max(-0.1, getTerrainHeight(px, pz));
    list.push({
      id: `pine-ring-${i}`,
      x: px,
      y: py,
      z: pz,
      scale: s,
      radius: 0.76 * s,
    });
  }

  // Alpine pine tree rows flanking the outer edges of the massive ski slope
  for (let z = -98; z <= 22; z += 15) {
    for (const side of [-1, 1]) {
      const offset = side === 1 ? getSledTrackHalfWidth() + 6.2 : -(getSledTrackHalfWidth() + 14.5);
      const px = getSledTrackCenterX(z) + offset;
      const pz = z + (side === 1 ? 3 : -2);
      // Avoid crowding village plaza or west cottage
      if (px > -34 && pz > -24 && pz < 22) continue;
      const s = 1.25 + (Math.abs(z) % 5) * 0.12;
      list.push({
        id: `pine-slope-${side > 0 ? 'r' : 'l'}-${z}`,
        x: px,
        y: Math.max(0, getTerrainHeight(px, pz)),
        z: pz,
        scale: s,
        radius: 0.78 * s,
      });
    }
  }

  // Decorative snow pines tucked gently between cottages & outer village rim (zero gate overlap!)
  const accentPines: Array<[number, number, number]> = [
    [-29.5, -24.0, 1.22],
    [-20.5, 32.5, 1.15],
    [41.5, 29.0, 1.25],
    [42.0, 5.5, 1.15],
    [39.5, -21.5, 1.2],
    [13.5, -14.5, 0.92],
    [29.5, 11.5, 0.96],
    [-19.0, -25.5, 1.15],
    [-23.5, -34.5, 1.28],
    [7.2, -34.5, 1.18],
    [-12.5, 29.5, 1.05],
    [-33.0, -38.0, 1.3],
    [-10.0, -46.0, 1.35],
    [10.0, -52.0, 1.4],
  ];
  accentPines.forEach(([px, pz, s], idx) => {
    list.push({
      id: `pine-accent-${idx}`,
      x: px,
      y: Math.max(0, getTerrainHeight(px, pz)),
      z: pz,
      scale: s,
      radius: 0.78 * s,
    });
  });

  return list;
})();

export function getBridgeAt(x: number, z: number): BridgeSpec | null {
  for (const b of BRIDGES) {
    if (
      Math.abs(z - b.z) <= b.width * 0.5 &&
      Math.abs(x - b.centerX) <= b.span * 0.5
    ) {
      return b;
    }
  }
  return null;
}

export function getBridgeDeckHeight(bridge: BridgeSpec, x: number): number {
  const norm = Math.max(-1, Math.min(1, (x - bridge.centerX) / (bridge.span * 0.5)));
  return 0.16 + (1 - norm * norm) * bridge.archHeight;
}

export function getWalkableHeight(x: number, z: number): { y: number; onBridge: boolean } {
  const bridge = getBridgeAt(x, z);
  if (bridge) {
    return { y: getBridgeDeckHeight(bridge, x), onBridge: true };
  }
  return { y: Math.max(0, getTerrainHeight(x, z)), onBridge: false };
}

export function isInStreamWater(x: number, z: number): boolean {
  if (getBridgeAt(x, z)) return false;
  const sx = getStreamCenterX(z);
  const halfW = getStreamHalfWidth(z);
  return Math.abs(x - sx) < halfW - 0.2;
}

// Exact cobblestone check using shared COBBLE_ZONES (100% matched with rendered stone paths!)
export function isOnCobblestone(x: number, z: number): boolean {
  for (const e of COBBLE_ZONES) {
    const dx = x - e.cx;
    const dz = z - e.cz;
    const cos = Math.cos(-e.rotY);
    const sin = Math.sin(-e.rotY);
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    if ((lx * lx) / (e.rx * e.rx) + (lz * lz) / (e.rz * e.rz) <= 1.0) {
      return true;
    }
  }
  return false;
}

// Automatic surface detection: snow (and ski slope!) -> snowboard, stone paths & wooden bridges -> walk!
export function isOnSnowSurface(x: number, z: number): boolean {
  if (getBridgeAt(x, z)) return false;
  if (Math.abs(x - getSledTrackCenterX(z)) <= getSledTrackHalfWidth() + 0.8) {
    return true;
  }
  if (isOnCobblestone(x, z)) return false;
  return true;
}

// Smart chairlift dismount: upper half drops onto ski slope summit for snowboarding down!
export function getLiftDismountPoint(chairT: number): Vec2 {
  const t = ((chairT % 1) + 1) % 1;
  if (t >= 0.26 && t <= 0.74) {
    return CHAIRLIFT.summitDismountPoint;
  }
  return CHAIRLIFT.dismountPoint;
}

export function getBuildingColliders(): BoxCollider[] {
  const list: BoxCollider[] = BUILDINGS.map((b) => ({
    id: b.id,
    x: b.x,
    z: b.z,
    halfW: b.width * 0.5 + 0.45,
    halfD: b.depth * 0.5 + 0.45,
    rotationY: b.rotationY,
  }));
  // Lower chairlift station shelter
  list.push({
    id: 'lift-lower-house',
    x: CHAIRLIFT.lowerStation.x - 1.2,
    z: CHAIRLIFT.lowerStation.z + 1.2,
    halfW: 2.3,
    halfD: 2.3,
    rotationY: 0.15,
  });
  return list;
}

export function getCircleColliders(): CircleCollider[] {
  const list: CircleCollider[] = [
    { id: 'christmas-tree', x: TREE_CENTER.x, z: TREE_CENTER.z, radius: 4.1 },
    { id: 'snowman', x: SNOWMAN_POS.x, z: SNOWMAN_POS.z, radius: 1.05 },
    { id: 'postbox', x: POSTBOX_WORLD_POS.x, z: POSTBOX_WORLD_POS.z, radius: 0.68 },
  ];

  // ALL pine trees (100% synced with PINE_TREES rendered in 3D!)
  for (const tree of PINE_TREES) {
    list.push({
      id: tree.id,
      x: tree.x,
      z: tree.z,
      radius: tree.radius,
    });
  }

  // Street lamp poles
  LAMP_POSITIONS.forEach(([lx, lz], idx) => {
    list.push({ id: `lamp-${idx}`, x: lx, z: lz, radius: 0.34 });
  });

  // Wooden park benches
  BENCH_SPECS.forEach(([bx, bz], idx) => {
    list.push({ id: `bench-${idx}`, x: bx, z: bz, radius: 0.92 });
  });

  // Chairlift steel support pylons
  CHAIRLIFT_PYLONS.forEach((p, idx) => {
    list.push({ id: `pylon-${idx}`, x: p.x, z: p.z, radius: 0.95 });
  });

  // Start & Finish ski arch side pillars (widened to span the 42m ski piste!)
  const gateHalfSpan = 18.5;
  for (const [key, gate] of [
    ['start', SKI_TRACK_GATES.startLine],
    ['finish', SKI_TRACK_GATES.finishLine],
  ] as const) {
    list.push({ id: `gate-${key}-l`, x: gate.x - gateHalfSpan, z: gate.z, radius: 0.55 });
    list.push({ id: `gate-${key}-r`, x: gate.x + gateHalfSpan, z: gate.z, radius: 0.55 });
  }

  return list;
}

const BUILDING_COLLIDERS = getBuildingColliders();
const CIRCLE_COLLIDERS = getCircleColliders();

export function resolvePlayerMovement(
  prevX: number,
  prevZ: number,
  targetX: number,
  targetZ: number,
): PlayerMoveResult {
  const r = WORLD_BOUNDS.playerRadius;
  let x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, targetX));
  let z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, targetZ));
  let hitBoundary = x !== targetX || z !== targetZ;
  let blockedUphill = false;

  // PHYSICAL ONE-WAY SKI SLOPE ENFORCEMENT (No uphill reverse climbing allowed!)
  // If the player is on the ski slope OR tries to climb uphill past the Finish Line into the ski slope,
  // physically clamp Z so movement can ONLY go downhill (+Z) or carve sideways (X)!
  if (z < prevZ && (isOnOneWaySkiSlope(prevX, prevZ) || isOnOneWaySkiSlope(x, z))) {
    blockedUphill = true;
    hitBoundary = true;
    if (!isOnOneWaySkiSlope(prevX, prevZ)) {
      // Trying to walk/board UP through the Finish Line from the valley floor -> hold outside Finish Line!
      z = Math.max(prevZ, SKI_TRACK_GATES.finishLine.z - 2.4);
    } else {
      // Already on the steep ski slope -> cannot move uphill (z cannot decrease!)
      z = prevZ;
    }
  }

  // Run 2 collision iterations so adjacent trees, buildings, and fences never leak penetration
  for (let pass = 0; pass < 2; pass++) {
    for (const c of CIRCLE_COLLIDERS) {
      const dx = x - c.x;
      const dz = z - c.z;
      const minDist = c.radius + r;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist) {
        hitBoundary = true;
        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          x = c.x + (dx / dist) * minDist;
          z = c.z + (dz / dist) * minDist;
        } else {
          const px = prevX - c.x;
          const pz = prevZ - c.z;
          const pDist = Math.hypot(px, pz) || 1;
          x = c.x + (px / pDist) * minDist;
          z = c.z + (pz / pDist) * minDist;
        }
      }
    }

    for (const b of BUILDING_COLLIDERS) {
      const cos = Math.cos(-(b.rotationY ?? 0));
      const sin = Math.sin(-(b.rotationY ?? 0));
      const dx = x - b.x;
      const dz = z - b.z;
      const localX = dx * cos - dz * sin;
      const localZ = dx * sin + dz * cos;

      const clampedX = Math.max(-b.halfW, Math.min(b.halfW, localX));
      const clampedZ = Math.max(-b.halfD, Math.min(b.halfD, localZ));
      const diffX = localX - clampedX;
      const diffZ = localZ - clampedZ;
      const distSq = diffX * diffX + diffZ * diffZ;

      if (distSq < r * r) {
        hitBoundary = true;
        let pushLX = 0;
        let pushLZ = 0;
        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const push = r - dist;
          pushLX = (diffX / dist) * push;
          pushLZ = (diffZ / dist) * push;
        } else {
          const overlapX = b.halfW - Math.abs(localX);
          const overlapZ = b.halfD - Math.abs(localZ);
          if (overlapX < overlapZ) {
            pushLX = (localX >= 0 ? 1 : -1) * (overlapX + r);
          } else {
            pushLZ = (localZ >= 0 ? 1 : -1) * (overlapZ + r);
          }
        }
        const cosW = Math.cos(b.rotationY ?? 0);
        const sinW = Math.sin(b.rotationY ?? 0);
        x += pushLX * cosW - pushLZ * sinW;
        z += pushLX * sinW + pushLZ * cosW;
      }
    }

    // Solid Wooden Fence Collision (circle vs capsule/segment for every wooden fence run!)
    const fenceMinDist = r + 0.3;
    for (const run of FENCE_RUNS) {
      for (let i = 0; i < run.length - 1; i++) {
        const [ax, az] = run[i];
        const [bx, bz] = run[i + 1];
        const abx = bx - ax;
        const abz = bz - az;
        const abLenSq = abx * abx + abz * abz;
        if (abLenSq < 0.0001) continue;

        const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / abLenSq));
        const closestX = ax + abx * t;
        const closestZ = az + abz * t;
        const dx = x - closestX;
        const dz = z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < fenceMinDist * fenceMinDist) {
          hitBoundary = true;
          if (distSq > 0.00001) {
            const dist = Math.sqrt(distSq);
            x = closestX + (dx / dist) * fenceMinDist;
            z = closestZ + (dz / dist) * fenceMinDist;
          } else {
            const px = prevX - closestX;
            const pz = prevZ - closestZ;
            const pDist = Math.hypot(px, pz) || 1;
            x = closestX + (px / pDist) * fenceMinDist;
            z = closestZ + (pz / pDist) * fenceMinDist;
          }
        }
      }
    }
  }

  // Re-verify one-way downhill rule after collider pushouts so corner pushing can't cheat uphill!
  if (z < prevZ && (isOnOneWaySkiSlope(prevX, prevZ) || isOnOneWaySkiSlope(x, z))) {
    blockedUphill = true;
    z = prevZ;
  }

  if (isInStreamWater(x, z)) {
    hitBoundary = true;
    if (!isInStreamWater(prevX, z)) {
      x = prevX;
    } else if (!isInStreamWater(x, prevZ)) {
      z = prevZ;
    } else {
      x = prevX;
      z = prevZ;
    }
  }

  const prevBridge = getBridgeAt(prevX, prevZ);
  if (prevBridge && isInStreamWater(x, z)) {
    z = Math.max(
      prevBridge.z - prevBridge.width * 0.44,
      Math.min(prevBridge.z + prevBridge.width * 0.44, z),
    );
  }

  x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, x));
  z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, z));

  const walk = getWalkableHeight(x, z);
  return {
    x,
    y: walk.y,
    z,
    onBridge: walk.onBridge,
    hitBoundary,
    blockedUphill,
  };
}

// Evaluate 3D position & heading along the closed 2-person chairlift loop (t in [0, 1))
export function evaluateChairliftPose(tRaw: number): ChairliftPose {
  const t = ((tRaw % 1) + 1) % 1;
  const low = CHAIRLIFT.lowerStation;
  const high = CHAIRLIFT.upperStation;

  const dx = high.x - low.x;
  const dz = high.z - low.z;
  const spanLen = Math.hypot(dx, dz);
  const dirX = dx / spanLen;
  const dirZ = dz / spanLen;
  const perpX = -dirZ;
  const perpZ = dirX;
  const lat = CHAIRLIFT.lateralOffset;

  const lowCableY = low.y + 4.2;
  const highCableY = high.y + CHAIRLIFT.upperTowerHeight;

  const computeCableY = (s: number, cx: number, cz: number): number => {
    const base = lowCableY + (highCableY - lowCableY) * Math.pow(s, 1.06);
    const scenicArch = Math.sin(Math.PI * s) * 8.5;
    const terrainHere = Math.max(0, getBaseTerrainHeight(cx, cz));
    const minClearance = 3.8 + Math.sin(Math.PI * s) * 3.4;
    return Math.max(base + scenicArch, terrainHere + minClearance);
  };

  let x = 0;
  let y = 0;
  let z = 0;
  let heading = 0;
  let goingUp = true;

  if (t < 0.45) {
    const s = t / 0.45;
    x = low.x + dx * s + perpX * lat;
    z = low.z + dz * s + perpZ * lat;
    y = computeCableY(s, x, z);
    heading = Math.atan2(dirX, dirZ);
    goingUp = true;
  } else if (t < 0.5) {
    const u = (t - 0.45) / 0.05;
    const angle = u * Math.PI;
    const forwardPush = Math.sin(angle) * lat;
    const sidePush = Math.cos(angle) * lat;
    x = high.x + dirX * forwardPush + perpX * sidePush;
    z = high.z + dirZ * forwardPush + perpZ * sidePush;
    y = highCableY;
    const tanX = dirX * Math.cos(angle) - perpX * Math.sin(angle);
    const tanZ = dirZ * Math.cos(angle) - perpZ * Math.sin(angle);
    heading = Math.atan2(tanX, tanZ);
    goingUp = u < 0.5;
  } else if (t < 0.95) {
    const s = 1 - (t - 0.5) / 0.45;
    x = low.x + dx * s - perpX * lat;
    z = low.z + dz * s - perpZ * lat;
    y = computeCableY(s, x, z);
    heading = Math.atan2(-dirX, -dirZ);
    goingUp = false;
  } else {
    const u = (t - 0.95) / 0.05;
    const angle = u * Math.PI;
    const backPush = -Math.sin(angle) * lat;
    const sidePush = -Math.cos(angle) * lat;
    x = low.x + dirX * backPush + perpX * sidePush;
    z = low.z + dirZ * backPush + perpZ * sidePush;
    y = lowCableY;
    const tanX = -dirX * Math.cos(angle) + perpX * Math.sin(angle);
    const tanZ = -dirZ * Math.cos(angle) + perpZ * Math.sin(angle);
    heading = Math.atan2(tanX, tanZ);
    goingUp = u >= 0.5;
  }

  const groundY = Math.max(0, getTerrainHeight(x, z));
  return {
    x,
    y,
    z,
    heading,
    goingUp,
    altitude: Math.max(0, y - groundY),
  };
}

export function isNearChairliftBoarding(x: number, z: number): boolean {
  const d = Math.hypot(x - CHAIRLIFT.boardingPoint.x, z - CHAIRLIFT.boardingPoint.z);
  return d <= CHAIRLIFT.boardingRadius;
}

export function getVillageZoneName(x: number, z: number, isRidingLift: boolean): string {
  if (isRidingLift) return '2인 파노라마 리프트';
  if (isNearChairliftBoarding(x, z)) return '2인 리프트 승강장';
  if (getBridgeAt(x, z)) return '시냇물 나무다리';
  if (Math.hypot(x - TREE_CENTER.x, z - TREE_CENTER.z) < 13.5) return '중앙 크리스마스 트리 광장';
  if (Math.abs(x - getSledTrackCenterX(z)) < getSledTrackHalfWidth() + 4.5) {
    return '대형 알프스 스키 슬로프';
  }
  if (x > 11 && z > 14) return '남동쪽 돌길 산책로';
  if (x > 10 && z <= 14 && z > -18) return '유럽풍 상점 거리';
  if (z <= -18) return '언덕 위 오두막 마을';
  return '눈 내리는 크리스마스 마을';
}

// 8 glowing Festive Star Ornaments across the spacious village & grand ski slope landmarks
export const COLLECTIBLES: CollectibleSpec[] = [
  { id: 'star-bridge-south', label: '앞쪽 나무다리 별빛', x: BRIDGES[0].centerX, y: 1.75, z: BRIDGES[0].z },
  { id: 'star-plaza-tree', label: '중앙 대형 트리 선물 앞', x: TREE_CENTER.x + 5.4, y: 1.1, z: TREE_CENTER.z + 4.4 },
  { id: 'star-snowman', label: '웃는 눈사람 친구', x: SNOWMAN_POS.x + 2.0, y: 1.1, z: SNOWMAN_POS.z + 1.8 },
  { id: 'star-sled-flag', label: '알프스 대형 스키 슬로프', x: getSledTrackCenterX(-14.0), y: 1.4, z: -14.0 },
  { id: 'star-toyshop', label: '장난감 가게 앞', x: 14.5, y: 1.1, z: 9.0 },
  { id: 'star-workshop', label: '시계 공방 골목', x: 25.5, y: 1.1, z: -8.5 },
  { id: 'star-townhall', label: '붉은 벽돌 홀 앞 광장', x: -4.2, y: 1.1, z: -20.5 },
  {
    id: 'star-lift-summit',
    label: '2인 리프트 하늘 전망',
    ...(() => {
      const p = evaluateChairliftPose(0.24);
      return { x: p.x, y: p.y - 1.5, z: p.z };
    })(),
    isAerial: true,
  },
];

export function checkCollectiblePickup(
  playerX: number,
  playerY: number,
  playerZ: number,
  isRidingLift: boolean,
  collectedIds: ReadonlySet<string>,
): CollectibleSpec | null {
  for (const item of COLLECTIBLES) {
    if (collectedIds.has(item.id)) continue;
    if (item.isAerial) {
      if (!isRidingLift) continue;
      const dist3d = Math.hypot(playerX - item.x, playerY - item.y, playerZ - item.z);
      if (dist3d < 6.5) return item;
    } else {
      const dist2d = Math.hypot(playerX - item.x, playerZ - item.z);
      if (dist2d < 2.2) return item;
    }
  }
  return null;
}
