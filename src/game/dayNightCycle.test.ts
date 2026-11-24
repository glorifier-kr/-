import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYCLE_DURATION_SEC,
  PHASE_BOUNDS,
  TIME_PRESET_SECONDS,
  evaluateDayNightState,
  getTimePhase,
} from './dayNightCycle';

test('day/night cycle duration is exactly 3m30s (210s) with 120s/30s/30s/30s phases', () => {
  assert.equal(CYCLE_DURATION_SEC, 210);
  assert.equal(PHASE_BOUNDS.dayEnd, 120);
  assert.equal(PHASE_BOUNDS.sunsetEnd, 150);
  assert.equal(PHASE_BOUNDS.nightEnd, 180);
  assert.equal(PHASE_BOUNDS.dawnEnd, 210);

  assert.equal(getTimePhase(0).phase, 'day');
  assert.equal(getTimePhase(119.9).phase, 'day');
  assert.equal(getTimePhase(120).phase, 'sunset');
  assert.equal(getTimePhase(149.9).phase, 'sunset');
  assert.equal(getTimePhase(150).phase, 'night');
  assert.equal(getTimePhase(179.9).phase, 'night');
  assert.equal(getTimePhase(180).phase, 'dawn');
  assert.equal(getTimePhase(209.9).phase, 'dawn');
  assert.equal(getTimePhase(210).phase, 'day');
});

test('village lights and stars turn off in midday and turn on smoothly by night', () => {
  const day = evaluateDayNightState(TIME_PRESET_SECONDS.day);
  const sunset = evaluateDayNightState(TIME_PRESET_SECONDS.sunset);
  const night = evaluateDayNightState(TIME_PRESET_SECONDS.night);
  const dawn = evaluateDayNightState(195);

  assert.equal(day.phase, 'day');
  assert.equal(day.villageLightFactor, 0);
  assert.equal(day.starOpacity, 0);
  assert.ok(day.skyColor[2] > 0.85, 'Daytime sky should be bright blue');

  assert.equal(sunset.phase, 'sunset');
  assert.ok(sunset.villageLightFactor > 0.5 && sunset.villageLightFactor < 0.9);
  assert.ok(sunset.skyColor[0] > sunset.skyColor[2], 'Sunset sky should glow warm red-orange');

  assert.equal(night.phase, 'night');
  assert.ok(night.villageLightFactor >= 0.95, 'Village lights should be fully lit at night');
  assert.ok(night.starOpacity >= 0.9, 'Stars should shine brightly at night');
  assert.ok(night.skyColor[2] < 0.25, 'Night sky should be deep dark blue');

  assert.equal(dawn.phase, 'dawn');
  assert.ok(dawn.villageLightFactor > 0.1 && dawn.villageLightFactor < 0.8);
});

test('cycle wraps seamlessly from 210s back to 0s without lighting jumps', () => {
  const end = evaluateDayNightState(209.99);
  const start = evaluateDayNightState(0.01);
  assert.ok(Math.abs(end.skyColor[0] - start.skyColor[0]) < 0.02);
  assert.ok(Math.abs(end.villageLightFactor - start.villageLightFactor) < 0.02);
});
