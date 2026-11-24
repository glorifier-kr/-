import { useEffect, useRef, useState } from 'react';
import { ChristmasVillageEngine, type HudSnapshot } from './game/ChristmasVillageEngine';
import { COLLECTIBLES, PLAYER_SPAWN } from './game/worldLayout';
import { GameHud } from './components/GameHud';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  zone: '남동쪽 돌길 산책로',
  movementMode: 'walk',
  timePhase: 'night',
  timeLabel: '밤',
  collectedCount: 0,
  totalCollectibles: COLLECTIBLES.length,
  nearLift: false,
  isRidingLift: false,
  liftAltitude: 0,
  nearNpcPrompt: null,
  activeDialogue: null,
  trickCount: 0,
  muted: false,
  lastToast: null,
  playerX: PLAYER_SPAWN.x,
  playerZ: PLAYER_SPAWN.z,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ChristmasVillageEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const engine = new ChristmasVillageEngine(el, (nextHud) => {
      setHud(nextHud);
    });
    engineRef.current = engine;

    // Support ?autostart=1 for automated testing and direct jump-in
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startGame();
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08111e]">
      {/* Isolated WebGL canvas mount — React HUD state updates never tear down or re-render this container */}
      <div ref={mountRef} className="w-full h-full" />

      <GameHud
        hud={hud}
        onStart={() => engineRef.current?.startGame()}
        onResume={() => engineRef.current?.resumeGame()}
        onPause={() => engineRef.current?.pauseGame()}
        onRestart={() => engineRef.current?.restartGame()}
        onReturnTitle={() => engineRef.current?.returnToTitle()}
        onToggleMute={() => engineRef.current?.toggleMute()}
        onToggleLift={(quickBoard) => engineRef.current?.toggleChairlift(quickBoard)}
        onSetTimePreset={(preset) => engineRef.current?.setTimePreset(preset)}
        onInteractNpc={() => engineRef.current?.interactNearbyNpc()}
        onAdvanceDialogue={() => engineRef.current?.advanceDialogue()}
        onCloseDialogue={() => engineRef.current?.closeDialogue()}
      />
    </main>
  );
}
