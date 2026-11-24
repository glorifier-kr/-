export type TimePhase = 'day' | 'sunset' | 'night' | 'dawn';

export interface DayNightState {
  cycleSec: number;
  phase: TimePhase;
  label: string;
  skyColor: [number, number, number];
  fogColor: [number, number, number];
  fogDensity: number;
  sunPosition: [number, number, number];
  sunColor: [number, number, number];
  sunIntensity: number;
  hemiSkyColor: [number, number, number];
  hemiGroundColor: [number, number, number];
  hemiIntensity: number;
  envIntensity: number;
  villageLightFactor: number; // 0 = daytime (lights off), 1 = nighttime (lights on)
  starOpacity: number; // 0 = daytime, ~0.95 = night
  moonOpacity: number; // 0 = daytime, 1 = night
}

// Total full day cycle = 3 minutes 30 seconds (210s):
//   Day (낮):    0s   -> 120s (2 minutes)
//   Sunset (노을): 120s -> 150s (30 seconds)
//   Night (밤):  150s -> 180s (30 seconds)
//   Dawn (새벽):  180s -> 210s (30 seconds)
export const CYCLE_DURATION_SEC = 210;

export const PHASE_BOUNDS = {
  dayEnd: 120,
  sunsetEnd: 150,
  nightEnd: 180,
  dawnEnd: 210,
} as const;

export const TIME_PRESET_SECONDS: Record<'day' | 'sunset' | 'night', number> = {
  day: 52, // Bright crisp winter midday
  sunset: 135, // Rich golden-amber sunset glow
  night: 162, // Deep starry Christmas night
};

interface Keyframe {
  t: number; // seconds in [0, 210]
  sky: [number, number, number];
  fog: [number, number, number];
  fogDensity: number;
  sunColor: [number, number, number];
  sunIntensity: number;
  hemiSky: [number, number, number];
  hemiGround: [number, number, number];
  hemiIntensity: number;
  envIntensity: number;
  villageLight: number;
  starOpacity: number;
  moonOpacity: number;
}

const KEYFRAMES: Keyframe[] = [
  // 0s: Early crisp morning entering Day
  {
    t: 0,
    sky: [0.56, 0.78, 0.96],
    fog: [0.68, 0.83, 0.96],
    fogDensity: 0.0041,
    sunColor: [1.0, 0.95, 0.86],
    sunIntensity: 1.55,
    hemiSky: [0.68, 0.84, 0.98],
    hemiGround: [0.46, 0.52, 0.62],
    hemiIntensity: 0.98,
    envIntensity: 0.54,
    villageLight: 0.0,
    starOpacity: 0.0,
    moonOpacity: 0.0,
  },
  // 60s: Bright snowy winter noon
  {
    t: 60,
    sky: [0.44, 0.73, 0.96],
    fog: [0.64, 0.83, 0.98],
    fogDensity: 0.0034,
    sunColor: [1.0, 0.98, 0.93],
    sunIntensity: 1.85,
    hemiSky: [0.74, 0.88, 1.0],
    hemiGround: [0.52, 0.58, 0.68],
    hemiIntensity: 1.08,
    envIntensity: 0.62,
    villageLight: 0.0,
    starOpacity: 0.0,
    moonOpacity: 0.0,
  },
  // 112s: Late golden afternoon approaching sunset
  {
    t: 112,
    sky: [0.58, 0.70, 0.88],
    fog: [0.74, 0.73, 0.80],
    fogDensity: 0.0040,
    sunColor: [1.0, 0.82, 0.60],
    sunIntensity: 1.40,
    hemiSky: [0.68, 0.72, 0.86],
    hemiGround: [0.40, 0.38, 0.46],
    hemiIntensity: 0.84,
    envIntensity: 0.45,
    villageLight: 0.16,
    starOpacity: 0.0,
    moonOpacity: 0.0,
  },
  // 135s: Peak Sunset (노을) — glowing coral-amber sky, village lights turning on!
  {
    t: 135,
    sky: [0.80, 0.34, 0.28],
    fog: [0.70, 0.34, 0.30],
    fogDensity: 0.0048,
    sunColor: [1.0, 0.44, 0.18],
    sunIntensity: 1.02,
    hemiSky: [0.72, 0.36, 0.40],
    hemiGround: [0.20, 0.14, 0.24],
    hemiIntensity: 0.58,
    envIntensity: 0.28,
    villageLight: 0.78,
    starOpacity: 0.35,
    moonOpacity: 0.48,
  },
  // 150s: Twilight entering Night
  {
    t: 150,
    sky: [0.055, 0.085, 0.18],
    fog: [0.055, 0.085, 0.17],
    fogDensity: 0.0052,
    sunColor: [0.46, 0.64, 0.92],
    sunIntensity: 0.36,
    hemiSky: [0.16, 0.26, 0.46],
    hemiGround: [0.06, 0.08, 0.15],
    hemiIntensity: 0.36,
    envIntensity: 0.14,
    villageLight: 0.96,
    starOpacity: 0.90,
    moonOpacity: 0.94,
  },
  // 165s: Deep Starry Christmas Night (밤) — cool midnight blue snow, vivid warm village glow!
  {
    t: 165,
    sky: [0.022, 0.055, 0.118],
    fog: [0.024, 0.058, 0.118],
    fogDensity: 0.0052,
    sunColor: [0.42, 0.62, 0.92],
    sunIntensity: 0.30,
    hemiSky: [0.14, 0.25, 0.46],
    hemiGround: [0.055, 0.07, 0.135],
    hemiIntensity: 0.32,
    envIntensity: 0.12,
    villageLight: 1.0,
    starOpacity: 0.98,
    moonOpacity: 1.0,
  },
  // 180s: Late night entering Dawn
  {
    t: 180,
    sky: [0.06, 0.09, 0.19],
    fog: [0.07, 0.10, 0.20],
    fogDensity: 0.0050,
    sunColor: [0.54, 0.64, 0.86],
    sunIntensity: 0.38,
    hemiSky: [0.20, 0.28, 0.48],
    hemiGround: [0.08, 0.09, 0.17],
    hemiIntensity: 0.38,
    envIntensity: 0.16,
    villageLight: 0.90,
    starOpacity: 0.78,
    moonOpacity: 0.85,
  },
  // 195s: Peak Dawn (새벽) — lavender & soft rose winter sunrise, lights dimming
  {
    t: 195,
    sky: [0.52, 0.50, 0.72],
    fog: [0.74, 0.60, 0.66],
    fogDensity: 0.0046,
    sunColor: [1.0, 0.72, 0.56],
    sunIntensity: 0.92,
    hemiSky: [0.64, 0.58, 0.78],
    hemiGround: [0.26, 0.24, 0.34],
    hemiIntensity: 0.70,
    envIntensity: 0.34,
    villageLight: 0.42,
    starOpacity: 0.18,
    moonOpacity: 0.25,
  },
  // 210s: Wrap smoothly back to 0s (Day)
  {
    t: 210,
    sky: [0.56, 0.78, 0.96],
    fog: [0.68, 0.83, 0.96],
    fogDensity: 0.0041,
    sunColor: [1.0, 0.95, 0.86],
    sunIntensity: 1.55,
    hemiSky: [0.68, 0.84, 0.98],
    hemiGround: [0.46, 0.52, 0.62],
    hemiIntensity: 0.98,
    envIntensity: 0.54,
    villageLight: 0.0,
    starOpacity: 0.0,
    moonOpacity: 0.0,
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function smoothstep01(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export function getTimePhase(cycleSecRaw: number): { phase: TimePhase; label: string } {
  const t = ((cycleSecRaw % CYCLE_DURATION_SEC) + CYCLE_DURATION_SEC) % CYCLE_DURATION_SEC;
  if (t < PHASE_BOUNDS.dayEnd) return { phase: 'day', label: '낮' };
  if (t < PHASE_BOUNDS.sunsetEnd) return { phase: 'sunset', label: '노을' };
  if (t < PHASE_BOUNDS.nightEnd) return { phase: 'night', label: '밤' };
  return { phase: 'dawn', label: '새벽' };
}

export function evaluateDayNightState(cycleSecRaw: number): DayNightState {
  const t = ((cycleSecRaw % CYCLE_DURATION_SEC) + CYCLE_DURATION_SEC) % CYCLE_DURATION_SEC;
  const { phase, label } = getTimePhase(t);

  // Locate surrounding keyframes
  let k0 = KEYFRAMES[0];
  let k1 = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (t >= KEYFRAMES[i].t && t <= KEYFRAMES[i + 1].t) {
      k0 = KEYFRAMES[i];
      k1 = KEYFRAMES[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, k1.t - k0.t);
  const u = smoothstep01((t - k0.t) / span);

  // Smooth sun / moon directional light arc across the sky:
  // Day + Sunset (0..150s): Sun rises east (+X), arches high overhead at noon (60s), sets west (-X)
  // Night (150..180s): Moon sits high in the upper-left sky matching our winter moonlight shadows
  // Dawn (180..210s): Smoothly transitions from moonlight angle to rising eastern dawn sun
  let sunPosition: [number, number, number];
  if (t < 150) {
    // Sun arc: angle 0.18 (east morning) -> PI/2 (noon) -> PI-0.14 (west sunset)
    const dayNorm = t / 150;
    const elevAngle = lerp(0.24, Math.PI - 0.14, dayNorm);
    const radius = 84;
    const sx = Math.cos(elevAngle) * radius;
    const sy = Math.max(14, Math.sin(elevAngle) * 76);
    const sz = 24 + Math.sin(dayNorm * Math.PI) * 16;
    sunPosition = [sx, sy, sz];
  } else if (t < 185) {
    // Cool moonlight high in upper-left sky with gentle orbital drift
    const nightNorm = (t - 150) / 35;
    sunPosition = [
      lerp(-58, -32, nightNorm),
      lerp(52, 64, Math.sin(nightNorm * Math.PI)),
      lerp(28, 36, nightNorm),
    ];
  } else {
    // Dawn transition sweeping smoothly to eastern sunrise
    const dawnNorm = smoothstep01((t - 185) / 25);
    sunPosition = [
      lerp(-32, 81, dawnNorm),
      lerp(52, 20, dawnNorm),
      lerp(36, 24, dawnNorm),
    ];
  }

  return {
    cycleSec: t,
    phase,
    label,
    skyColor: lerp3(k0.sky, k1.sky, u),
    fogColor: lerp3(k0.fog, k1.fog, u),
    fogDensity: lerp(k0.fogDensity, k1.fogDensity, u) * 0.65,
    sunPosition,
    sunColor: lerp3(k0.sunColor, k1.sunColor, u),
    sunIntensity: lerp(k0.sunIntensity, k1.sunIntensity, u),
    hemiSkyColor: lerp3(k0.hemiSky, k1.hemiSky, u),
    hemiGroundColor: lerp3(k0.hemiGround, k1.hemiGround, u),
    hemiIntensity: lerp(k0.hemiIntensity, k1.hemiIntensity, u),
    envIntensity: lerp(k0.envIntensity, k1.envIntensity, u),
    villageLightFactor: lerp(k0.villageLight, k1.villageLight, u),
    starOpacity: lerp(k0.starOpacity, k1.starOpacity, u),
    moonOpacity: lerp(k0.moonOpacity, k1.moonOpacity, u),
  };
}
