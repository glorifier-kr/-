import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRIDGES,
  BUILDINGS,
  CHAIRLIFT,
  COLLECTIBLES,
  INTERACTABLES,
  JUMP_RAMPS,
  PINE_TREES,
  PLAYER_SPAWN,
  SKI_TRACK_GATES,
  TREE_CENTER,
  checkCollectiblePickup,
  evaluateChairliftPose,
  getBridgeAt,
  getJumpRampCrestAt,
  getJumpRampElevation,
  getLiftDismountPoint,
  getNearbyInteractable,
  getSledTrackCenterX,
  getSledTrackHalfWidth,
  getStreamCenterX,
  getTerrainHeight,
  getVillageZoneName,
  getWalkableHeight,
  isInStreamWater,
  isNearChairliftBoarding,
  isOnSnowSurface,
  resolvePlayerMovement,
} from './worldLayout';

test('rabbit spawns on open cobblestone path without collision or water', () => {
  assert.equal(isInStreamWater(PLAYER_SPAWN.x, PLAYER_SPAWN.z), false);
  const res = resolvePlayerMovement(
    PLAYER_SPAWN.x,
    PLAYER_SPAWN.z,
    PLAYER_SPAWN.x,
    PLAYER_SPAWN.z,
  );
  assert.equal(res.hitBoundary, false);
  assert.equal(Math.abs(res.x - PLAYER_SPAWN.x) < 0.001, true);
  assert.equal(Math.abs(res.z - PLAYER_SPAWN.z) < 0.001, true);
});

test('all 3 wooden bridges span the meandering stream and are walkable', () => {
  assert.equal(BRIDGES.length, 3);
  for (const bridge of BRIDGES) {
    const streamX = getStreamCenterX(bridge.z);
    assert.ok(Math.abs(bridge.centerX - streamX) < 0.5);
    assert.equal(isInStreamWater(streamX, bridge.z), false);
    assert.equal(getBridgeAt(streamX, bridge.z)?.id, bridge.id);
    const walk = getWalkableHeight(streamX, bridge.z);
    assert.equal(walk.onBridge, true);
    assert.ok(walk.y > 0.5, 'Bridge arch center should elevate above ground');
  }
});

test('off-bridge stream channel blocks player entry', () => {
  const testZ = 5.5;
  const streamX = getStreamCenterX(testZ);
  assert.equal(isInStreamWater(streamX, testZ), true);
  const bankX = streamX + 3.0;
  const res = resolvePlayerMovement(bankX, testZ, streamX, testZ);
  assert.equal(res.hitBoundary, true);
  assert.equal(isInStreamWater(res.x, res.z), false);
});

test('2-person chairlift runs along the left ski slope as a continuous loop', () => {
  assert.ok(CHAIRLIFT.lowerStation.x < -25, 'Lower station should sit on the left side');
  assert.ok(CHAIRLIFT.upperStation.x < -35, 'Upper summit station should sit on the upper-left ski slope');

  const start = evaluateChairliftPose(0);
  const nearEnd = evaluateChairliftPose(0.9999);
  const loopGap = Math.hypot(start.x - nearEnd.x, start.y - nearEnd.y, start.z - nearEnd.z);
  assert.ok(loopGap < 0.35, `Loop should be continuous, gap=${loopGap}`);

  let maxAltitude = 0;
  for (let i = 0; i <= 100; i++) {
    const pose = evaluateChairliftPose(i / 100);
    maxAltitude = Math.max(maxAltitude, pose.altitude);
  }
  assert.ok(maxAltitude >= 12, `Chairlift should climb high for panoramic village view, got ${maxAltitude}`);
});

test('automatic snow vs ground surface detection switches snowboarding cleanly', () => {
  // Cobblestone spawn, central plaza, and all 3 wooden bridges -> walk (not snow)
  assert.equal(isOnSnowSurface(PLAYER_SPAWN.x, PLAYER_SPAWN.z), false);
  assert.equal(isOnSnowSurface(TREE_CENTER.x + 4, TREE_CENTER.z + 4), false);
  for (const b of BRIDGES) {
    assert.equal(isOnSnowSurface(b.centerX, b.z), false);
  }

  // Left ski slope & outer snowy areas -> snowboard (snow)
  assert.equal(isOnSnowSurface(getSledTrackCenterX(12), 12), true);
  assert.equal(isOnSnowSurface(getSledTrackCenterX(-22), -22), true);
  assert.equal(isOnSnowSurface(-34, 18), true);
});

test('chairlift boarding, smart summit dismount, and aerial star pickup work', () => {
  assert.equal(
    isNearChairliftBoarding(CHAIRLIFT.boardingPoint.x, CHAIRLIFT.boardingPoint.z),
    true,
  );
  assert.equal(isNearChairliftBoarding(PLAYER_SPAWN.x, PLAYER_SPAWN.z), false);
  assert.equal(getVillageZoneName(0, 0, true), '2인 파노라마 리프트');

  // Summit dismount lands on snow at top of ski slope
  const summitExit = getLiftDismountPoint(0.48);
  assert.equal(summitExit, CHAIRLIFT.summitDismountPoint);
  assert.equal(isOnSnowSurface(summitExit.x, summitExit.z), true);

  // Lower dismount returns near lower station
  assert.equal(getLiftDismountPoint(0.05), CHAIRLIFT.dismountPoint);

  const aerial = COLLECTIBLES.find((c) => c.isAerial);
  assert.ok(aerial, 'Should include an aerial chairlift star');
  const collected = new Set<string>();
  assert.equal(checkCollectiblePickup(aerial.x, aerial.y, aerial.z, false, collected), null);
  const picked = checkCollectiblePickup(aerial.x, aerial.y, aerial.z, true, collected);
  assert.equal(picked?.id, aerial.id);
});

test('wooden fences and building walls block rabbit penetration', () => {
  // Attempt to cross foreground wooden fence around z=30.7
  const prevX = 1.2;
  const prevZ = 29.0;
  const resFence = resolvePlayerMovement(prevX, prevZ, 1.2, 30.7);
  assert.equal(resFence.hitBoundary, true, 'Fence segment must trigger collision');
  assert.ok(resFence.z < 30.2, 'Rabbit must remain outside fence thickness');

  // Attempt to walk inside Toy Shop walls
  const toyShop = BUILDINGS.find((b) => b.id === 'toy-shop')!;
  const resWall = resolvePlayerMovement(toyShop.x, toyShop.z + 5.0, toyShop.x, toyShop.z);
  assert.equal(resWall.hitBoundary, true, 'Building walls must block entry');
  assert.ok(Math.hypot(resWall.x - toyShop.x, resWall.z - toyShop.z) > 2.5);
});

test('red postbox and toy shop door expose Jesus birth celebration NPC dialogues', () => {
  assert.equal(INTERACTABLES.length, 2);
  const postbox = INTERACTABLES.find((n) => n.id === 'postbox')!;
  const toyShop = INTERACTABLES.find((n) => n.id === 'toy-shop')!;

  assert.equal(getNearbyInteractable(postbox.x - 1.5, postbox.z + 1.0)?.id, 'postbox');
  assert.equal(getNearbyInteractable(toyShop.x, toyShop.z + 1.2)?.id, 'toy-shop');
  assert.equal(getNearbyInteractable(PLAYER_SPAWN.x, PLAYER_SPAWN.z), null);

  for (const npc of [postbox, toyShop]) {
    assert.ok(npc.dialogues.some((line) => line.includes('예수님') && line.includes('탄생')));
  }
});

test('3 snowy jump ramps elevate the ski track and detect takeoff crests', () => {
  assert.equal(JUMP_RAMPS.length, 3);
  for (const ramp of JUMP_RAMPS) {
    const elev = getJumpRampElevation(ramp.x, ramp.z + ramp.halfLength * 0.35);
    assert.ok(elev > 1.0, `Jump ramp ${ramp.id} should elevate track smoothly, got ${elev}`);
    assert.equal(getJumpRampCrestAt(ramp.x, ramp.z + ramp.halfLength * 0.35)?.id, ramp.id);
  }
});

test('all pine trees have solid collision preventing rabbit pass-through', () => {
  assert.ok(PINE_TREES.length > 100, 'Should generate pine forest & village accent trees');
  const sampleTrees = PINE_TREES.filter((t) => t.id.startsWith('pine-accent-')).slice(0, 6);
  assert.ok(sampleTrees.length >= 6);

  for (const tree of sampleTrees) {
    const startX = tree.x + tree.radius + 2.0;
    const startZ = tree.z;
    const res = resolvePlayerMovement(startX, startZ, tree.x, tree.z);
    assert.equal(res.hitBoundary, true, `Pine tree ${tree.id} must block entry`);
    const dist = Math.hypot(res.x - tree.x, res.z - tree.z);
    assert.ok(
      dist >= tree.radius + 0.55,
      `Rabbit must stay outside pine tree ${tree.id} radius (${tree.radius}), got dist=${dist}`,
    );
  }
});

test('ski slope is 2x wider (~21m) with a tall alpine summit (~24m) and clear chairlift', () => {
  const fullWidth = getSledTrackHalfWidth() * 2;
  assert.ok(fullWidth >= 20, `Ski slope should be at least 20m wide, got ${fullWidth}`);

  const baseH = getTerrainHeight(SKI_TRACK_GATES.finishLine.x, SKI_TRACK_GATES.finishLine.z);
  const summitH = getTerrainHeight(SKI_TRACK_GATES.startLine.x, SKI_TRACK_GATES.startLine.z);
  assert.ok(baseH < 2.0, `Ski slope finish base should be near valley floor, got ${baseH}`);
  assert.ok(
    summitH >= 20.0,
    `Ski slope summit should rise dramatically (>=20m), got ${summitH}`,
  );

  // Chairlift stays well above the tall alpine ski mountain along the full loop
  let minAlt = Infinity;
  for (let i = 0; i <= 100; i++) {
    const pose = evaluateChairliftPose(i / 100);
    minAlt = Math.min(minAlt, pose.altitude);
  }
  assert.ok(minAlt >= 3.2, `Chairlift cable must clear the tall mountain terrain, got minAlt=${minAlt}`);
});

